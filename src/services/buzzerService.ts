import { io, Socket } from 'socket.io-client';
import { config } from '../constants/config';
import { LiveBuzzerRoom } from '../types';

type RoomUpdateListener = (room: LiveBuzzerRoom) => void;
type BuzzerWinnerListener = (data: { playerId: string; name: string; room: LiveBuzzerRoom }) => void;
type SimpleListener = () => void;

class BuzzerService {
  private socket: Socket | null = null;
  private activeRoomCode: string | null = null;
  private activeRole: 'host' | 'player' | null = null;
  private activePlayerId: string | null = null;
  private activePlayerName: string | null = null;

  private roomListeners = new Set<RoomUpdateListener>();
  private winnerListeners = new Set<BuzzerWinnerListener>();
  private openedListeners = new Set<RoomUpdateListener>();
  private closedListeners = new Set<SimpleListener>();
  private kickedListeners = new Set<SimpleListener>();

  private ensureSocket(): Socket {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    const s = io(config.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 800,
      timeout: 8000,
    });

    s.on('connect', () => {
      // Seamless auto-rejoin on reconnect
      if (this.activeRoomCode && this.activeRole === 'host') {
        s.emit('room:host_rejoin', { code: this.activeRoomCode }, (res: any) => {
          if (res?.ok && res.room) {
            this.roomListeners.forEach((cb) => cb(res.room));
          }
        });
      } else if (this.activeRoomCode && this.activeRole === 'player' && this.activePlayerId) {
        s.emit(
          'room:join',
          {
            code: this.activeRoomCode,
            name: this.activePlayerName || '',
            playerId: this.activePlayerId,
          },
          (res: any) => {
            if (res?.ok && res.room) {
              this.roomListeners.forEach((cb) => cb(res.room));
            }
          }
        );
      }
    });

    s.on('room:update', (room: LiveBuzzerRoom) => {
      this.roomListeners.forEach((cb) => cb(room));
    });

    s.on('buzzer:winner', (data: { playerId: string; name: string; room: LiveBuzzerRoom }) => {
      this.winnerListeners.forEach((cb) => cb(data));
    });

    s.on('buzzer:opened', (room: LiveBuzzerRoom) => {
      this.openedListeners.forEach((cb) => cb(room));
    });

    s.on('room:closed', () => {
      this.clearSession();
      this.closedListeners.forEach((cb) => cb());
    });

    s.on('room:kicked', () => {
      this.clearSession();
      this.kickedListeners.forEach((cb) => cb());
    });

    this.socket = s;
    return s;
  }

  private clearSession() {
    this.activeRoomCode = null;
    this.activeRole = null;
    this.activePlayerId = null;
    this.activePlayerName = null;
  }

  createRoom(targetScore: number): Promise<{ ok: boolean; room?: LiveBuzzerRoom; error?: string }> {
    return new Promise((resolve) => {
      const s = this.ensureSocket();
      const timer = setTimeout(() => {
        resolve({ ok: false, error: 'تعذر الاتصال بالسيرفر، تأكد من تشغيله والإنترنت' });
      }, 7000);

      s.emit('room:create', { targetScore }, (res: any) => {
        clearTimeout(timer);
        if (res?.ok && res.room) {
          this.activeRoomCode = res.room.code;
          this.activeRole = 'host';
          resolve({ ok: true, room: res.room });
        } else {
          resolve({ ok: false, error: res?.error || 'حدث خطأ أثناء إنشاء الغرفة' });
        }
      });
    });
  }

  joinRoom(
    code: string,
    name: string
  ): Promise<{ ok: boolean; playerId?: string; room?: LiveBuzzerRoom; error?: string }> {
    return new Promise((resolve) => {
      const s = this.ensureSocket();
      const timer = setTimeout(() => {
        resolve({ ok: false, error: 'تعذر الاتصال بالسيرفر، تأكد من تشغيله والإنترنت' });
      }, 7000);

      s.emit('room:join', { code: code.trim(), name: name.trim() }, (res: any) => {
        clearTimeout(timer);
        if (res?.ok && res.room) {
          this.activeRoomCode = res.room.code;
          this.activeRole = 'player';
          this.activePlayerId = res.playerId;
          this.activePlayerName = name.trim();
          resolve({ ok: true, playerId: res.playerId, room: res.room });
        } else {
          resolve({ ok: false, error: res?.error || 'كود الغرفة غير صحيح' });
        }
      });
    });
  }

  startGame(code: string, targetScore?: number) {
    this.ensureSocket().emit('room:start', { code, targetScore });
  }

  openBuzzer(code: string, resetLockouts = false) {
    this.ensureSocket().emit('buzzer:open', { code, resetLockouts });
  }

  lockBuzzer(code: string, clearLockouts = true) {
    this.ensureSocket().emit('buzzer:lock', { code, clearLockouts });
  }

  pressBuzzer(code: string, playerId: string) {
    this.ensureSocket().emit('buzzer:press', { code, playerId });
  }

  updateScore(code: string, playerId: string, delta: number, reopenOnWrong = false) {
    this.ensureSocket().emit('room:score', { code, playerId, delta, reopenOnWrong });
  }

  setLiveOptions(code: string, options: string[] | null) {
    this.ensureSocket().emit('room:options', { code, options });
  }

  kickPlayer(code: string, playerId: string) {
    this.ensureSocket().emit('room:kick', { code, playerId });
  }

  closeRoom(code: string) {
    if (this.socket) {
      this.socket.emit('room:close', { code });
    }
    this.clearSession();
  }

  disconnect() {
    this.clearSession();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onRoomUpdate(cb: RoomUpdateListener) {
    this.roomListeners.add(cb);
    return () => {
      this.roomListeners.delete(cb);
    };
  }

  onBuzzerWinner(cb: BuzzerWinnerListener) {
    this.winnerListeners.add(cb);
    return () => {
      this.winnerListeners.delete(cb);
    };
  }

  onBuzzerOpened(cb: RoomUpdateListener) {
    this.openedListeners.add(cb);
    return () => {
      this.openedListeners.delete(cb);
    };
  }

  onRoomClosed(cb: SimpleListener) {
    this.closedListeners.add(cb);
    return () => {
      this.closedListeners.delete(cb);
    };
  }

  onKicked(cb: SimpleListener) {
    this.kickedListeners.add(cb);
    return () => {
      this.kickedListeners.delete(cb);
    };
  }
}

export const buzzerService = new BuzzerService();
