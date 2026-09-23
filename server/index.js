import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } });

const rooms = new Map();

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do { code = ''; for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length)); } while (rooms.has(code));
  return code;
};

const barraCategories = {
  'أكلات': ['شاورما', 'بيتزا', 'برجر', 'كبسة', 'سوشي', 'فلافل'],
  'أماكن': ['مستشفى', 'مدرسة', 'مطار', 'بنك', 'ملعب', 'سجن'],
  'وظائف': ['طيار', 'دكتور', 'حلاق', 'سباك', 'محامي', 'طباخ'],
  'حيوانات': ['أسد', 'فيل', 'زرافة', 'قرد', 'تمساح', 'بطريق']
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('host_create_room', (callback) => {
    const code = generateCode();
    const newRoom = { hostId: socket.id, code, players: [], state: 'lobby', gameData: {} };
    rooms.set(code, newRoom);
    socket.join(code);
    callback({ success: true, code });
    io.to(code).emit('room_state_update', newRoom);
  });

  /* =========================================
     BARRA AL SALFA LOGIC
     ========================================= */
  socket.on('host_start_barra', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      room.state = 'barra_playing';
      const categories = Object.keys(barraCategories);
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const words = barraCategories[randomCategory];
      const secretWord = words[Math.floor(Math.random() * words.length)];
      const spyIndex = Math.floor(Math.random() * room.players.length);
      const spyId = room.players[spyIndex].id;
      
      // Generate question order
      const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
      const questionOrder = shuffledPlayers.map((p, idx) => ({
        asker: p.name,
        answerer: shuffledPlayers[(idx + 1) % shuffledPlayers.length].name
      }));
      
      room.gameData = { mode: 'barra', category: randomCategory, word: secretWord, spyId: spyId, votes: {}, questionOrder, currentQuestion: 0 };

      room.players.forEach((p) => {
        const isSpy = p.id === spyId;
        const role = isSpy ? 'برا السالفة!' : `السالفة: ${secretWord}`;
        const hint = isSpy ? `التصنيف: ${randomCategory}` : 'أنت من عامة الشعب، اسأل بذكاء!';
        io.to(p.id).emit('game_started', { mode: 'barra', role, hint, roleType: isSpy ? 'spy' : 'town' });
      });
      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('host_next_question', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      room.gameData.currentQuestion = (room.gameData.currentQuestion || 0) + 1;
      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('host_start_voting', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      room.state = 'barra_voting';
      io.to(code).emit('room_state_update', room);
      io.to(code).emit('start_voting', { players: room.players });
    }
  });

  socket.on('player_vote', ({ code, votedForId }) => {
    const room = rooms.get(code);
    if (room && (room.state === 'barra_voting' || room.state === 'mafia_voting')) {
      room.gameData.votes[socket.id] = votedForId;
      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('host_reveal_results', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      const tally = {};
      Object.values(room.gameData.votes).forEach(v => { tally[v] = (tally[v] || 0) + 1; });
      let maxVotes = 0, executedId = null, tie = false;
      for (const [id, count] of Object.entries(tally)) {
        if (count > maxVotes) { maxVotes = count; executedId = id; tie = false; }
        else if (count === maxVotes) { tie = true; }
      }

      if (executedId === room.gameData.spyId && !tie) {
        room.state = 'barra_spy_guess';
        const catWords = barraCategories[room.gameData.category] || [];
        const opts = Array.from(new Set([room.gameData.word, ...catWords])).sort(() => Math.random() - 0.5).slice(0, 9);
        if (!opts.includes(room.gameData.word)) {
          opts[0] = room.gameData.word;
          opts.sort(() => Math.random() - 0.5);
        }
        room.gameData.spyOptions = opts;
      } else {
        room.state = 'barra_results';
        room.gameData.spyWon = true;
      }
      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('spy_guess_word', ({ code, word }) => {
    const room = rooms.get(code);
    if (room && room.state === 'barra_spy_guess') {
      room.state = 'barra_results';
      room.gameData.spyGuessedWord = word;
      room.gameData.spyWon = (word === room.gameData.word);
      io.to(code).emit('room_state_update', room);
    }
  });

  /* =========================================
     MAFIA LOGIC
     ========================================= */
  socket.on('host_start_mafia', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      room.state = 'mafia_roles';
      
      const shuffled = [...room.players].sort(() => Math.random() - 0.5);
      const roles = {};
      const alive = {};
      let mafiaId = '', doctorId = '';

      shuffled.forEach((p, i) => {
        alive[p.id] = true;
        if (i === 0) { roles[p.id] = 'mafia'; mafiaId = p.id; }
        else if (i === 1 && room.players.length >= 3) { roles[p.id] = 'doctor'; doctorId = p.id; }
        else { roles[p.id] = 'town'; }
      });

      room.gameData = {
        mode: 'mafia', roles, alive, mafiaId, doctorId,
        nightActions: { mafiaTarget: null, doctorTarget: null },
        votes: {}, killedThisNight: null, winner: null
      };

      room.players.forEach((p) => {
        const r = roles[p.id];
        let roleName = r === 'mafia' ? 'المافيا' : (r === 'doctor' ? 'الطبيب' : 'مواطن');
        let hint = r === 'mafia' ? 'اقتل واحد بالليل ولا تنقفط بالنهار' : (r === 'doctor' ? 'حاول تحمي الضحية بالليل' : 'صِيد المافيا بالنهار!');
        io.to(p.id).emit('game_started', { mode: 'mafia', role: roleName, hint, roleType: r });
      });
      
      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('host_start_first_night', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      room.state = 'mafia_night';
      io.to(code).emit('room_state_update', room);
      io.to(code).emit('start_night', { alive: room.gameData.alive, players: room.players });
    }
  });

  socket.on('mafia_action', ({ code, targetId, roleType }) => {
    const room = rooms.get(code);
    if (room && room.state === 'mafia_night') {
      if (roleType === 'mafia') room.gameData.nightActions.mafiaTarget = targetId;
      if (roleType === 'doctor') room.gameData.nightActions.doctorTarget = targetId;
      
      const mafiaDone = !!room.gameData.nightActions.mafiaTarget;
      const doctorExists = !!room.gameData.doctorId && room.gameData.alive[room.gameData.doctorId];
      const doctorDone = doctorExists ? !!room.gameData.nightActions.doctorTarget : true;

      io.to(room.hostId).emit('night_action_update', { mafiaDone, doctorDone });
    }
  });

  socket.on('host_end_night', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      const actions = room.gameData.nightActions;
      room.gameData.killedThisNight = null;

      if (actions.mafiaTarget && actions.mafiaTarget !== actions.doctorTarget) {
        room.gameData.alive[actions.mafiaTarget] = false;
        room.gameData.killedThisNight = actions.mafiaTarget;
      }

      room.state = 'mafia_day_reveal';
      room.gameData.nightActions = { mafiaTarget: null, doctorTarget: null }; // reset
      
      const alivePlayers = room.players.filter(p => room.gameData.alive[p.id]);
      const mafiaAlive = alivePlayers.filter(p => room.gameData.roles[p.id] === 'mafia').length;
      const townAlive = alivePlayers.length - mafiaAlive;
      
      if (mafiaAlive === 0) room.gameData.winner = 'town';
      else if (mafiaAlive >= townAlive) room.gameData.winner = 'mafia';

      io.to(code).emit('room_state_update', room);
      const killedPlayer = room.players.find(p => p.id === room.gameData.killedThisNight);
      io.to(code).emit('day_reveal', { killedName: killedPlayer ? killedPlayer.name : null, alive: room.gameData.alive, winner: room.gameData.winner });
    }
  });

  socket.on('host_start_mafia_voting', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      room.state = 'mafia_voting';
      room.gameData.votes = {};
      io.to(code).emit('room_state_update', room);
      io.to(code).emit('start_mafia_voting', { alive: room.gameData.alive, players: room.players });
    }
  });

  socket.on('host_execute_mafia', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      const tally = {};
      Object.values(room.gameData.votes).forEach(v => tally[v] = (tally[v] || 0) + 1);
      
      let maxVotes = 0, executedId = null;
      for (const [id, count] of Object.entries(tally)) {
        if (count > maxVotes) { maxVotes = count; executedId = id; }
      }

      if (executedId) room.gameData.alive[executedId] = false;
      room.state = 'mafia_execution_reveal';

      const alivePlayers = room.players.filter(p => room.gameData.alive[p.id]);
      const mafiaAlive = alivePlayers.filter(p => room.gameData.roles[p.id] === 'mafia').length;
      const townAlive = alivePlayers.length - mafiaAlive;
      
      if (mafiaAlive === 0) room.gameData.winner = 'town';
      else if (mafiaAlive >= townAlive) room.gameData.winner = 'mafia';

      io.to(code).emit('room_state_update', room);
      const executedPlayer = room.players.find(p => p.id === executedId);
      io.to(code).emit('execution_reveal', { executedName: executedPlayer ? executedPlayer.name : null, alive: room.gameData.alive, winner: room.gameData.winner });
    }
  });

  socket.on('host_next_night', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      room.state = 'mafia_night';
      room.gameData.nightActions = { mafiaTarget: null, doctorTarget: null };
      io.to(code).emit('room_state_update', room);
      io.to(code).emit('start_night', { alive: room.gameData.alive, players: room.players });
    }
  });

  socket.on('host_back_to_lobby', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      room.state = 'lobby';
      room.gameData = {};
      io.to(code).emit('room_state_update', room);
      io.to(code).emit('back_to_lobby');
    }
  });

  /* =========================================
     CORE LOBBY
     ========================================= */
  socket.on('player_join_room', ({ code, name }, callback) => {
    const roomCode = code.toUpperCase();
    const room = rooms.get(roomCode);
    if (!room) return callback({ success: false, error: 'الروم غير موجود!' });
    if (room.state !== 'lobby') return callback({ success: false, error: 'اللعبة بدأت بالفعل!' });
    if (room.players.find(p => p.name === name)) return callback({ success: false, error: 'الاسم مستخدم!' });

    const newPlayer = { id: socket.id, name };
    room.players.push(newPlayer);
    socket.join(roomCode);
    io.to(roomCode).emit('room_state_update', room);
    callback({ success: true, room: roomCode, state: room.state });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, code) => {
      if (room.hostId === socket.id) {
        io.to(code).emit('host_disconnected');
        rooms.delete(code);
      } else {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          const p = room.players[playerIndex];
          room.players.splice(playerIndex, 1);
          io.to(room.hostId).emit('player_left', p);
        }
      }
    });
  });
});

app.use(express.static(path.join(__dirname, '../dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Socket server running on port ${PORT}`));
