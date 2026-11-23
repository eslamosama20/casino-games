const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 20000,
  pingTimeout: 10000,
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check for Render / uptime monitors
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'Casino Games Live Buzzer', rooms: rooms.size });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, rooms: rooms.size, timestamp: Date.now() });
});

// ============================================================================
// LIVE BUZZER ROOMS (In-Memory, Atomic First-Press Lock, Auto-Reconnect)
// ============================================================================
const rooms = new Map();

function generateRoomCode() {
  for (let i = 0; i < 50; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    if (!rooms.has(code)) return code;
  }
  return String(Math.floor(10000 + Math.random() * 90000));
}

function serializeRoom(room) {
  return {
    code: room.code,
    targetScore: room.targetScore,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: p.connected,
    })),
    buzzerState: room.buzzerState,
    buzzedBy: room.buzzedBy,
    lockedOutPlayerIds: room.lockedOutPlayerIds,
    currentOptions: room.currentOptions,
    winner: room.winner,
  };
}

// Cleanup stale rooms older than 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivity > 2 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 10 * 60 * 1000);

io.on('connection', (socket) => {
  socket.on('room:create', (payload, ack) => {
    const targetScore = Number(payload?.targetScore) || 10;
    const code = generateRoomCode();
    const room = {
      code,
      hostSocketId: socket.id,
      targetScore,
      status: 'lobby',
      players: [],
      buzzerState: 'locked',
      buzzedBy: null,
      lockedOutPlayerIds: [],
      currentOptions: null,
      winner: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'host';

    if (typeof ack === 'function') {
      ack({ ok: true, room: serializeRoom(room) });
    }
  });

  socket.on('room:host_rejoin', (payload, ack) => {
    const code = String(payload?.code || '').trim();
    const room = rooms.get(code);
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, error: 'الغرفة غير موجودة أو انتهت' });
      return;
    }
    room.hostSocketId = socket.id;
    room.lastActivity = Date.now();
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'host';

    if (typeof ack === 'function') {
      ack({ ok: true, room: serializeRoom(room) });
    }
  });

  socket.on('room:join', (payload, ack) => {
    const code = String(payload?.code || '').trim();
    const name = String(payload?.name || '').trim().slice(0, 24);
    const existingPlayerId = payload?.playerId ? String(payload.playerId) : null;

    const room = rooms.get(code);
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, error: 'كود الغرفة غير صحيح أو الغرفة مغلقة' });
      return;
    }
    if (!name && !existingPlayerId) {
      if (typeof ack === 'function') ack({ ok: false, error: 'اكتب اسمك الأول قبل ما تدخل الغرفة' });
      return;
    }

    room.lastActivity = Date.now();
    let player = existingPlayerId ? room.players.find((p) => p.id === existingPlayerId) : null;

    if (player) {
      player.socketId = socket.id;
      player.connected = true;
      if (name) player.name = name;
    } else {
      if (room.players.length >= 16) {
        if (typeof ack === 'function') ack({ ok: false, error: 'الغرفة ممتلئة (الحد الأقصى 16 لاعب)' });
        return;
      }
      player = {
        id: `lp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        socketId: socket.id,
        name: name || `لاعب ${room.players.length + 1}`,
        score: 0,
        connected: true,
      };
      room.players.push(player);
    }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'player';
    socket.data.playerId = player.id;

    const serialized = serializeRoom(room);
    io.to(code).emit('room:update', serialized);

    if (typeof ack === 'function') {
      ack({ ok: true, playerId: player.id, room: serialized });
    }
  });

  socket.on('room:start', (payload) => {
    const code = String(payload?.code || socket.data.roomCode || '');
    const room = rooms.get(code);
    if (!room || room.hostSocketId !== socket.id) return;

    if (payload?.targetScore) room.targetScore = Number(payload.targetScore);
    room.status = 'playing';
    room.players.forEach((p) => {
      p.score = 0;
    });
    room.buzzerState = 'locked';
    room.buzzedBy = null;
    room.lockedOutPlayerIds = [];
    room.currentOptions = null;
    room.winner = null;
    room.lastActivity = Date.now();

    io.to(code).emit('room:update', serializeRoom(room));
  });

  socket.on('buzzer:open', (payload) => {
    const code = String(payload?.code || socket.data.roomCode || '');
    const room = rooms.get(code);
    if (!room || room.hostSocketId !== socket.id) return;

    if (payload?.resetLockouts) {
      room.lockedOutPlayerIds = [];
    }
    room.buzzerState = 'open';
    room.buzzedBy = null;
    room.lastActivity = Date.now();

    const serialized = serializeRoom(room);
    io.to(code).emit('buzzer:opened', serialized);
    io.to(code).emit('room:update', serialized);
  });

  socket.on('buzzer:lock', (payload) => {
    const code = String(payload?.code || socket.data.roomCode || '');
    const room = rooms.get(code);
    if (!room || room.hostSocketId !== socket.id) return;

    room.buzzerState = 'locked';
    room.buzzedBy = null;
    room.currentOptions = null;
    if (payload?.clearLockouts !== false) {
      room.lockedOutPlayerIds = [];
    }
    room.lastActivity = Date.now();

    io.to(code).emit('room:update', serializeRoom(room));
  });

  socket.on('buzzer:press', (payload) => {
    const code = String(payload?.code || socket.data.roomCode || '');
    const playerId = String(payload?.playerId || socket.data.playerId || '');
    const room = rooms.get(code);
    if (!room) return;

    if (room.buzzerState !== 'open') return;
    if (room.lockedOutPlayerIds.includes(playerId)) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    room.buzzerState = 'buzzed';
    room.buzzedBy = {
      playerId: player.id,
      name: player.name,
      timestamp: Date.now(),
    };
    room.lastActivity = Date.now();

    const serialized = serializeRoom(room);
    io.to(code).emit('buzzer:winner', {
      playerId: player.id,
      name: player.name,
      room: serialized,
    });
    io.to(code).emit('room:update', serialized);
  });

  socket.on('room:score', (payload) => {
    const code = String(payload?.code || socket.data.roomCode || '');
    const playerId = String(payload?.playerId || '');
    const delta = Number(payload?.delta) || 0;
    const reopenOnWrong = Boolean(payload?.reopenOnWrong);

    const room = rooms.get(code);
    if (!room || room.hostSocketId !== socket.id) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.score += delta;
    room.lastActivity = Date.now();

    if (delta > 0) {
      room.buzzerState = 'locked';
      room.buzzedBy = null;
      if (player.score >= room.targetScore) {
        room.status = 'finished';
        room.winner = { id: player.id, name: player.name, score: player.score };
      }
    } else if (delta < 0) {
      if (!room.lockedOutPlayerIds.includes(playerId)) {
        room.lockedOutPlayerIds.push(playerId);
      }
      if (reopenOnWrong) {
        room.buzzerState = 'open';
        room.buzzedBy = null;
      } else if (room.buzzedBy?.playerId === playerId) {
        room.buzzerState = 'locked';
        room.buzzedBy = null;
      }
    }

    io.to(code).emit('room:update', serializeRoom(room));
  });

  socket.on('room:options', (payload) => {
    const code = String(payload?.code || socket.data.roomCode || '');
    const room = rooms.get(code);
    if (!room || room.hostSocketId !== socket.id) return;

    room.currentOptions = Array.isArray(payload?.options) ? payload.options : null;
    room.lastActivity = Date.now();
    io.to(code).emit('room:update', serializeRoom(room));
  });

  socket.on('room:kick', (payload) => {
    const code = String(payload?.code || socket.data.roomCode || '');
    const playerId = String(payload?.playerId || '');
    const room = rooms.get(code);
    if (!room || room.hostSocketId !== socket.id) return;

    const target = room.players.find((p) => p.id === playerId);
    room.players = room.players.filter((p) => p.id !== playerId);
    if (target?.socketId) {
      io.to(target.socketId).emit('room:kicked');
    }
    io.to(code).emit('room:update', serializeRoom(room));
  });

  socket.on('room:close', (payload) => {
    const code = String(payload?.code || socket.data.roomCode || '');
    const room = rooms.get(code);
    if (!room || room.hostSocketId !== socket.id) return;

    io.to(code).emit('room:closed');
    rooms.delete(code);
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    if (socket.data.role === 'player' && socket.data.playerId) {
      const player = room.players.find((p) => p.id === socket.data.playerId);
      if (player && player.socketId === socket.id) {
        player.connected = false;
        io.to(code).emit('room:update', serializeRoom(room));
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Casino Live Buzzer server listening on port ${PORT}`);
});
