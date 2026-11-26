import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onDisconnect,
  runTransaction,
  Database,
  Unsubscribe,
} from 'firebase/database';
import { config } from '../constants/config';
import { LiveBuzzerRoom, Player, ActiveCardEvent } from '../types';
import { POWER_CARDS } from '../data/powerCards';

type RoomUpdateListener = (room: LiveBuzzerRoom) => void;
type BuzzerWinnerListener = (data: { playerId: string; name: string; room: LiveBuzzerRoom }) => void;
type SimpleListener = () => void;

interface FirebaseRoomData {
  code: string;
  targetScore: number;
  status: 'lobby' | 'playing' | 'finished';
  players?: Record<string, Player>;
  buzzerState: 'locked' | 'open' | 'buzzed';
  buzzedBy?: { playerId: string; name: string; timestamp: number } | null;
  lockedOutPlayerIds?: Record<string, boolean>;
  currentOptions?: string[] | null;
  winner?: Player | null;
  lastScoreEvent?: {
    playerId: string;
    delta: number;
    newScore: number;
    timestamp: number;
    customMessage?: string | null;
  } | null;
  seenQuestionIds?: Record<string, boolean>;
  usedCardPlayerIds?: Record<string, string>;
  usedCardIds?: Record<string, boolean>;
  activeCardEvent?: {
    cardId: string;
    playedBy: { id: string; name: string };
    timestamp: number;
  } | null;
  createdAt?: number;
  lastActivity?: number;
}

function getDb(): Database {
  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          databaseURL: config.FIREBASE_DATABASE_URL,
          projectId: 'casino-games-3266e',
        });
  return getDatabase(app);
}

function normalizeRoom(raw: FirebaseRoomData): LiveBuzzerRoom {
  const playersArr: Player[] = raw.players
    ? Object.values(raw.players)
        .map((p) => ({
          ...p,
          usedCardId: p.usedCardId || (raw.usedCardPlayerIds && raw.usedCardPlayerIds[p.id]) || undefined,
        }))
        .sort((a, b) => a.id.localeCompare(b.id))
    : [];
  const lockedOut = raw.lockedOutPlayerIds
    ? Object.keys(raw.lockedOutPlayerIds).filter((k) => raw.lockedOutPlayerIds?.[k])
    : [];

  return {
    code: raw.code,
    targetScore: raw.targetScore || 10,
    status: raw.status || 'lobby',
    players: playersArr,
    buzzerState: raw.buzzerState || 'locked',
    buzzedBy: raw.buzzedBy || null,
    lockedOutPlayerIds: lockedOut,
    currentOptions: Array.isArray(raw.currentOptions) ? raw.currentOptions : null,
    winner: raw.winner || null,
    lastScoreEvent: raw.lastScoreEvent || null,
    seenQuestionIds: raw.seenQuestionIds
      ? Object.keys(raw.seenQuestionIds).filter((k) => raw.seenQuestionIds?.[k])
      : [],
    usedCardPlayerIds: raw.usedCardPlayerIds || {},
    usedCardIds: raw.usedCardIds || {},
    activeCardEvent: raw.activeCardEvent || null,
  };
}

class BuzzerService {
  private unsubRoom: Unsubscribe | null = null;
  private activeRoomCode: string | null = null;
  private activeRole: 'host' | 'player' | null = null;
  private activePlayerId: string | null = null;

  private prevBuzzerState: 'locked' | 'open' | 'buzzed' | null = null;
  private prevBuzzedTs: number | null = null;
  private prevCardEventTs: number | null = null;

  private roomListeners = new Set<RoomUpdateListener>();
  private winnerListeners = new Set<BuzzerWinnerListener>();
  private openedListeners = new Set<RoomUpdateListener>();
  private closedListeners = new Set<SimpleListener>();
  private kickedListeners = new Set<SimpleListener>();
  private cardPlayedListeners = new Set<(event: ActiveCardEvent) => void>();

  private subscribeToRoom(code: string) {
    if (this.unsubRoom) {
      this.unsubRoom();
      this.unsubRoom = null;
    }

    const db = getDb();
    const roomRef = ref(db, `rooms/${code}`);

    this.unsubRoom = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        // Room was closed by host
        if (this.activeRoomCode === code) {
          this.clearSession();
          this.closedListeners.forEach((cb) => cb());
        }
        return;
      }

      const raw = snapshot.val() as FirebaseRoomData;
      const room = normalizeRoom(raw);

      // Check if current player was kicked
      if (this.activeRole === 'player' && this.activePlayerId) {
        const stillInRoom = room.players.some((p) => p.id === this.activePlayerId);
        if (!stillInRoom) {
          this.clearSession();
          this.kickedListeners.forEach((cb) => cb());
          return;
        }
      }

      // Detect buzzer opened transition
      if (room.buzzerState === 'open' && this.prevBuzzerState !== 'open') {
        this.openedListeners.forEach((cb) => cb(room));
      }

      // Detect new buzzer winner transition
      if (
        room.buzzerState === 'buzzed' &&
        room.buzzedBy &&
        room.buzzedBy.timestamp !== this.prevBuzzedTs
      ) {
        this.prevBuzzedTs = room.buzzedBy.timestamp;
        this.winnerListeners.forEach((cb) =>
          cb({
            playerId: room.buzzedBy!.playerId,
            name: room.buzzedBy!.name,
            room,
          })
        );
      }

      // Detect active power card played transition (Full-screen reveal for everyone!)
      if (
        room.activeCardEvent &&
        room.activeCardEvent.timestamp !== this.prevCardEventTs
      ) {
        this.prevCardEventTs = room.activeCardEvent.timestamp;
        this.cardPlayedListeners.forEach((cb) => cb(room.activeCardEvent!));
      }

      this.prevBuzzerState = room.buzzerState;
      this.roomListeners.forEach((cb) => cb(room));
    });
  }

  private clearSession() {
    if (this.unsubRoom) {
      this.unsubRoom();
      this.unsubRoom = null;
    }
    this.activeRoomCode = null;
    this.activeRole = null;
    this.activePlayerId = null;
    this.prevBuzzerState = null;
    this.prevBuzzedTs = null;
    this.prevCardEventTs = null;
  }

  async createRoom(targetScore: number): Promise<{ ok: boolean; room?: LiveBuzzerRoom; error?: string }> {
    try {
      const db = getDb();
      let code = '';
      for (let i = 0; i < 15; i++) {
        const candidate = String(Math.floor(1000 + Math.random() * 9000));
        const snap = await get(ref(db, `rooms/${candidate}`));
        if (!snap.exists()) {
          code = candidate;
          break;
        }
      }
      if (!code) code = String(Math.floor(10000 + Math.random() * 90000));

      const now = Date.now();
      const rawRoom: FirebaseRoomData = {
        code,
        targetScore: Number(targetScore) || 10,
        status: 'lobby',
        buzzerState: 'open',
        buzzedBy: null,
        currentOptions: null,
        winner: null,
        createdAt: now,
        lastActivity: now,
      };

      await set(ref(db, `rooms/${code}`), rawRoom);

      this.activeRoomCode = code;
      this.activeRole = 'host';
      this.prevBuzzerState = 'locked';
      this.prevBuzzedTs = null;
      this.subscribeToRoom(code);

      return { ok: true, room: normalizeRoom(rawRoom) };
    } catch (e: any) {
      return {
        ok: false,
        error: 'تعذر الاتصال بالسيرفر، تأكد من اتصالك بالإنترنت وحاول تاني',
      };
    }
  }

  async joinRoom(
    codeInput: string,
    nameInput: string
  ): Promise<{ ok: boolean; playerId?: string; room?: LiveBuzzerRoom; error?: string }> {
    try {
      const code = codeInput.trim();
      const name = nameInput.trim().slice(0, 24);
      if (!name) return { ok: false, error: 'اكتب اسمك الأول!' };

      const db = getDb();
      const roomRef = ref(db, `rooms/${code}`);
      const snap = await get(roomRef);

      if (!snap.exists()) {
        return { ok: false, error: 'كود الغرفة غير صحيح أو الغرفة مغلقة' };
      }

      const raw = snap.val() as FirebaseRoomData;
      const existingPlayers = raw.players ? Object.values(raw.players) : [];
      if (existingPlayers.length >= 16) {
        return { ok: false, error: 'الغرفة ممتلئة (الحد الأقصى 16 لاعب)' };
      }

      const playerId = `lp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const playerObj: Player = {
        id: playerId,
        name,
        score: 0,
        connected: true,
      };

      const playerRef = ref(db, `rooms/${code}/players/${playerId}`);
      await set(playerRef, playerObj);

      // Automatically mark disconnected if phone drops offline
      try {
        onDisconnect(ref(db, `rooms/${code}/players/${playerId}/connected`)).set(false);
      } catch {
        // Ignore onDisconnect if unsupported
      }

      this.activeRoomCode = code;
      this.activeRole = 'player';
      this.activePlayerId = playerId;
      this.prevBuzzerState = raw.buzzerState || 'locked';
      this.prevBuzzedTs = raw.buzzedBy?.timestamp || null;
      this.subscribeToRoom(code);

      const updatedSnap = await get(roomRef);
      const room = normalizeRoom(updatedSnap.val() as FirebaseRoomData);
      return { ok: true, playerId, room };
    } catch (e: any) {
      return {
        ok: false,
        error: 'تعذر الدخول للغرفة، تأكد من الإنترنت وكود الغرفة',
      };
    }
  }

  async startGame(code: string, targetScore?: number) {
    try {
      const db = getDb();
      const roomRef = ref(db, `rooms/${code}`);
      const snap = await get(roomRef);
      if (!snap.exists()) return;
      const raw = snap.val() as FirebaseRoomData;

      const updates: Record<string, any> = {
        status: 'playing',
        buzzerState: 'open',
        buzzedBy: null,
        lockedOutPlayerIds: null,
        currentOptions: null,
        winner: null,
        lastActivity: Date.now(),
      };
      if (targetScore) updates.targetScore = targetScore;
      if (raw.players) {
        Object.keys(raw.players).forEach((pid) => {
          updates[`players/${pid}/score`] = 0;
        });
      }
      await update(roomRef, updates);
    } catch {}
  }

  async openBuzzer(code: string, resetLockouts = false) {
    try {
      const db = getDb();
      const updates: Record<string, any> = {
        buzzerState: 'open',
        buzzedBy: null,
        lastActivity: Date.now(),
      };
      if (resetLockouts) {
        updates.lockedOutPlayerIds = null;
      }
      await update(ref(db, `rooms/${code}`), updates);
    } catch {}
  }

  async lockBuzzer(code: string, clearLockouts = true) {
    try {
      const db = getDb();
      const updates: Record<string, any> = {
        buzzerState: 'locked',
        buzzedBy: null,
        currentOptions: null,
        lastActivity: Date.now(),
      };
      if (clearLockouts) {
        updates.lockedOutPlayerIds = null;
      }
      await update(ref(db, `rooms/${code}`), updates);
    } catch {}
  }

  // ATOMIC FIRST-PRESS TRANSACTION: Guaranteed only the very first press wins!
  async pressBuzzer(code: string, playerId: string) {
    try {
      const db = getDb();
      const roomRef = ref(db, `rooms/${code}`);
      await runTransaction(roomRef, (current: FirebaseRoomData | null) => {
        // On Firebase RTDB speculative first pass, current can be null -> return null (not undefined) so Firebase fetches server state
        if (current === null) return null;
        if (current.buzzerState !== 'open') return undefined; // Abort: already buzzed or locked
        if (current.lockedOutPlayerIds && current.lockedOutPlayerIds[playerId]) return undefined;
        const player = current.players?.[playerId];
        if (!player) return undefined;

        current.buzzerState = 'buzzed';
        current.buzzedBy = {
          playerId: player.id,
          name: player.name,
          timestamp: Date.now(),
        };
        current.lastActivity = Date.now();
        return current;
      });
    } catch {}
  }

  async updateScore(
    code: string,
    playerId: string,
    delta: number,
    reopenOnWrong = false,
    customMessage?: string
  ) {
    try {
      const db = getDb();
      const roomRef = ref(db, `rooms/${code}`);
      await runTransaction(roomRef, (current: FirebaseRoomData | null) => {
        if (current === null) return null;
        if (!current.players || !current.players[playerId]) return undefined;

        const player = current.players[playerId];
        player.score = (player.score || 0) + delta;
        current.lastActivity = Date.now();
        current.lastScoreEvent = {
          playerId,
          delta,
          newScore: player.score,
          timestamp: Date.now(),
          customMessage: customMessage?.trim() || null,
        };

        if (delta > 0) {
          if (player.score >= (current.targetScore || 10)) {
            current.status = 'finished';
            current.buzzerState = 'locked';
            current.winner = { id: player.id, name: player.name, score: player.score };
          } else {
            // Point awarded (+1): automatically reopen buzzer for everyone!
            current.lockedOutPlayerIds = {};
            current.buzzerState = 'open';
            current.buzzedBy = null;
          }
        } else if (delta < 0) {
          // Penalty (-1): automatically reopen buzzer for everyone!
          current.lockedOutPlayerIds = {};
          current.buzzerState = 'open';
          current.buzzedBy = null;
        }
        return current;
      });
    } catch {}
  }

  async setLiveOptions(code: string, options: string[] | null) {
    try {
      const db = getDb();
      await update(ref(db, `rooms/${code}`), {
        currentOptions: options,
        lastActivity: Date.now(),
      });
    } catch {}
  }

  // Broadcast revealed question ID so every contestant marks it seen locally too!
  async markSeenForRoom(code: string, questionId: string) {
    try {
      const db = getDb();
      await set(ref(db, `rooms/${code}/seenQuestionIds/${questionId}`), true);
    } catch {}
  }

  async kickPlayer(code: string, playerId: string) {
    try {
      const db = getDb();
      await remove(ref(db, `rooms/${code}/players/${playerId}`));
    } catch {}
  }

  async closeRoom(code: string) {
    try {
      const db = getDb();
      await remove(ref(db, `rooms/${code}`));
    } catch {}
    this.clearSession();
  }

  disconnect() {
    if (this.activeRoomCode && this.activeRole === 'player' && this.activePlayerId) {
      try {
        const db = getDb();
        remove(ref(db, `rooms/${this.activeRoomCode}/players/${this.activePlayerId}`)).catch(
          () => {}
        );
      } catch {}
    }
    this.clearSession();
  }

  async drawAndPlayPowerCard(
    code: string,
    playerId: string
  ): Promise<{ ok: boolean; cardId?: string; error?: string }> {
    try {
      const db = getDb();
      const roomRef = ref(db, `rooms/${code}`);
      let chosenCardId: string | null = null;

      const txResult = await runTransaction(roomRef, (current: FirebaseRoomData | null) => {
        if (current === null) return null;
        if (!current.players || !current.players[playerId]) return undefined;

        const player = current.players[playerId];
        // Enforce 1 card per player rule!
        if (
          player.usedCardId ||
          (current.usedCardPlayerIds && current.usedCardPlayerIds[playerId])
        ) {
          return undefined; // Already used
        }

        const usedMap = current.usedCardIds || {};
        const allCardIds = POWER_CARDS.map((c) => c.id);
        const available = allCardIds.filter((id) => !usedMap[id]);
        const pool = available.length > 0 ? available : allCardIds;
        chosenCardId = pool[Math.floor(Math.random() * pool.length)];

        current.usedCardPlayerIds = current.usedCardPlayerIds || {};
        current.usedCardPlayerIds[playerId] = chosenCardId;

        current.usedCardIds = current.usedCardIds || {};
        current.usedCardIds[chosenCardId] = true;

        player.usedCardId = chosenCardId;

        current.activeCardEvent = {
          cardId: chosenCardId,
          playedBy: {
            id: player.id,
            name: player.name,
          },
          timestamp: Date.now(),
        };
        current.lastActivity = Date.now();
        return current;
      });

      if (!txResult.committed || !chosenCardId) {
        return { ok: false, error: 'لقد استخدمت كارتك بالفعل في هذا الجيم!' };
      }

      return { ok: true, cardId: chosenCardId };
    } catch (e: any) {
      return { ok: false, error: 'تعذر سحب الكارت، حاول مرة أخرى' };
    }
  }

  onPowerCardPlayed(cb: (event: ActiveCardEvent) => void) {
    this.cardPlayedListeners.add(cb);
    return () => {
      this.cardPlayedListeners.delete(cb);
    };
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
