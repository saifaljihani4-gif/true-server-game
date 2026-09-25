import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateHoroofBoard, getQuestionForLetter, checkHoroofWinner } from './horoofData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e6
});

const rooms = new Map();

const getRoom = (code) => {
  if (!code || typeof code !== 'string') return null;
  return rooms.get(code.trim().toUpperCase()) || null;
};

const safeCallback = (cb, data) => {
  if (typeof cb === 'function') {
    try { cb(data); } catch (_) {}
  }
};

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  } while (rooms.has(code));
  return code;
};

const barraCategories = {
  'أكلات': ['شاورما', 'بيتزا', 'برجر', 'كبسة', 'سوشي', 'فلافل'],
  'أماكن': ['مستشفى', 'مدرسة', 'مطار', 'بنك', 'ملعب', 'سجن'],
  'وظائف': ['طيار', 'دكتور', 'حلاق', 'سباك', 'محامي', 'طباخ'],
  'حيوانات': ['أسد', 'فيل', 'زرافة', 'قرد', 'تمساح', 'بطريق']
};

io.on('connection', (socket) => {
  socket.on('host_create_room', (callback) => {
    const code = generateCode();
    const newRoom = { hostId: socket.id, code, players: [], state: 'lobby', gameData: {} };
    rooms.set(code, newRoom);
    socket.join(code);
    safeCallback(callback, { success: true, code });
    io.to(code).emit('room_state_update', newRoom);
  });

  /* =========================================
     BARRA AL SALFA LOGIC
     ========================================= */
  socket.on('host_start_barra', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'barra_playing';
      const categories = Object.keys(barraCategories);
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const words = barraCategories[randomCategory];
      const secretWord = words[Math.floor(Math.random() * words.length)];
      const spyIndex = Math.floor(Math.random() * room.players.length);
      const spyId = room.players[spyIndex]?.id || room.players[0]?.id;

      const players = [...room.players];
      const allPairs = [];
      for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < players.length; j++) {
          if (i !== j) {
            allPairs.push({
              asker: players[i].name,
              askerId: players[i].id,
              answerer: players[j].name,
              answererId: players[j].id
            });
          }
        }
      }

      const questionOrder = [];
      const pool = [...allPairs];
      let lastAsker = null;
      while (pool.length > 0) {
        let idx = pool.findIndex(p => p.asker !== lastAsker);
        if (idx === -1) idx = 0;
        const [picked] = pool.splice(idx, 1);
        questionOrder.push(picked);
        lastAsker = picked.asker;
      }

      room.gameData = {
        mode: 'barra',
        category: randomCategory,
        word: secretWord,
        spyId,
        votes: {},
        questionOrder,
        currentQuestion: 0
      };

      room.players.forEach((p) => {
        const isSpy = p.id === spyId;
        const role = isSpy ? 'برا السالفة!' : `السالفة: ${secretWord}`;
        const hint = isSpy ? `التصنيف: ${randomCategory}` : 'أنت من عامة الشعب، اسأل بذكاء!';
        io.to(p.id).emit('game_started', { mode: 'barra', role, hint, roleType: isSpy ? 'spy' : 'town' });
      });
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_next_question', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.gameData.currentQuestion = (room.gameData.currentQuestion || 0) + 1;
      if (room.gameData.currentQuestion >= (room.gameData.questionOrder?.length || 0)) {
        room.state = 'barra_voting';
        io.to(room.code).emit('room_state_update', room);
        io.to(room.code).emit('start_voting', { players: room.players });
        return;
      }
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_start_voting', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'barra_voting';
      io.to(room.code).emit('room_state_update', room);
      io.to(room.code).emit('start_voting', { players: room.players });
    }
  });

  socket.on('player_vote', ({ code, votedForId }) => {
    const room = getRoom(code);
    if (!room) return;
    if (room.state === 'mafia_voting' && room.gameData?.alive && !room.gameData.alive[socket.id]) return;
    if (!room.players.some(p => p.id === votedForId)) return;
    if (room.state === 'barra_voting' || room.state === 'mafia_voting') {
      room.gameData.votes[socket.id] = votedForId;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_reveal_results', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      const tally = {};
      Object.values(room.gameData.votes || {}).forEach(v => { tally[v] = (tally[v] || 0) + 1; });
      let maxVotes = 0, executedId = null, tie = false;
      for (const [id, count] of Object.entries(tally)) {
        if (count > maxVotes) { maxVotes = count; executedId = id; tie = false; }
        else if (count === maxVotes) { tie = true; }
      }

      const spyCaught = (executedId === room.gameData.spyId && !tie);
      room.gameData.spyCaught = spyCaught;
      room.gameData.executedId = executedId;
      room.gameData.tie = tie;

      room.state = 'barra_spy_guess';
      const catWords = barraCategories[room.gameData.category] || [];
      const opts = Array.from(new Set([room.gameData.word, ...catWords])).sort(() => Math.random() - 0.5).slice(0, 9);
      if (!opts.includes(room.gameData.word)) {
        opts[0] = room.gameData.word;
        opts.sort(() => Math.random() - 0.5);
      }
      room.gameData.spyOptions = opts;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('spy_guess_word', ({ code, word }) => {
    const room = getRoom(code);
    if (room && room.state === 'barra_spy_guess' && socket.id === room.gameData?.spyId) {
      room.state = 'barra_results';
      room.gameData.spyGuessedWord = word;
      const isCorrect = (word === room.gameData.word);
      room.gameData.spyGuessedCorrectly = isCorrect;
      room.gameData.spyWon = room.gameData.spyCaught ? isCorrect : true;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  /* =========================================
     MAFIA LOGIC
     ========================================= */
  socket.on('host_start_mafia', ({ code }) => {
    const room = getRoom(code);
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
        mode: 'mafia',
        roles,
        alive,
        mafiaId,
        doctorId,
        nightActions: { mafiaTarget: null, doctorTarget: null },
        votes: {},
        killedThisNight: null,
        winner: null,
      };

      room.players.forEach((p) => {
        const r = roles[p.id];
        let roleName = r === 'mafia' ? 'المافيا' : (r === 'doctor' ? 'الطبيب' : 'مواطن');
        let hint = r === 'mafia' ? 'اقتل واحد بالليل ولا تنقفط بالنهار' : (r === 'doctor' ? 'حاول تحمي الضحية بالليل' : 'صِيد المافيا بالنهار!');
        io.to(p.id).emit('game_started', { mode: 'mafia', role: roleName, hint, roleType: r });
      });

      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_start_first_night', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'mafia_night';
      io.to(room.code).emit('room_state_update', room);
      io.to(room.code).emit('start_night', { alive: room.gameData.alive, players: room.players });
    }
  });

  socket.on('mafia_action', ({ code, targetId }) => {
    const room = getRoom(code);
    if (!room || room.state !== 'mafia_night') return;
    const actualRole = room.gameData?.roles?.[socket.id];
    const isAlive = room.gameData?.alive?.[socket.id];
    if (!isAlive || !actualRole) return;

    if (actualRole === 'mafia') room.gameData.nightActions.mafiaTarget = targetId;
    if (actualRole === 'doctor') room.gameData.nightActions.doctorTarget = targetId;

    const mafiaDone = !!room.gameData.nightActions.mafiaTarget;
    const doctorExists = !!room.gameData.doctorId && room.gameData.alive[room.gameData.doctorId];
    const doctorDone = doctorExists ? !!room.gameData.nightActions.doctorTarget : true;

    io.to(room.hostId).emit('night_action_update', { mafiaDone, doctorDone });
  });

  socket.on('host_end_night', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      const actions = room.gameData.nightActions || {};
      room.gameData.killedThisNight = null;

      if (actions.mafiaTarget && actions.mafiaTarget !== actions.doctorTarget) {
        room.gameData.alive[actions.mafiaTarget] = false;
        room.gameData.killedThisNight = actions.mafiaTarget;
      }

      room.state = 'mafia_day_reveal';
      room.gameData.nightActions = { mafiaTarget: null, doctorTarget: null };

      const alivePlayers = room.players.filter(p => room.gameData.alive[p.id]);
      const mafiaAlive = alivePlayers.filter(p => room.gameData.roles[p.id] === 'mafia').length;
      const townAlive = alivePlayers.length - mafiaAlive;

      if (mafiaAlive === 0) room.gameData.winner = 'town';
      else if (mafiaAlive >= townAlive) room.gameData.winner = 'mafia';

      io.to(room.code).emit('room_state_update', room);
      const killedPlayer = room.players.find(p => p.id === room.gameData.killedThisNight);
      io.to(room.code).emit('day_reveal', { killedName: killedPlayer ? killedPlayer.name : null, alive: room.gameData.alive, winner: room.gameData.winner });
    }
  });

  socket.on('host_start_mafia_voting', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'mafia_voting';
      room.gameData.votes = {};
      io.to(room.code).emit('room_state_update', room);
      io.to(room.code).emit('start_mafia_voting', { alive: room.gameData.alive, players: room.players });
    }
  });

  socket.on('host_execute_mafia', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      const tally = {};
      Object.values(room.gameData.votes || {}).forEach(v => tally[v] = (tally[v] || 0) + 1);

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

      io.to(room.code).emit('room_state_update', room);
      const executedPlayer = room.players.find(p => p.id === executedId);
      io.to(room.code).emit('execution_reveal', { executedName: executedPlayer ? executedPlayer.name : null, alive: room.gameData.alive, winner: room.gameData.winner });
    }
  });

  socket.on('host_next_night', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'mafia_night';
      room.gameData.nightActions = { mafiaTarget: null, doctorTarget: null };
      io.to(room.code).emit('room_state_update', room);
      io.to(room.code).emit('start_night', { alive: room.gameData.alive, players: room.players });
    }
  });

  socket.on('host_back_to_lobby', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'lobby';
      room.gameData = {};
      io.to(room.code).emit('room_state_update', room);
      io.to(room.code).emit('back_to_lobby');
    }
  });

  /* =========================================
     CODENAMES LOGIC
     ========================================= */
  const codenamesWords = ['شمس', 'قمر', 'بحر', 'نار', 'جبل', 'نهر', 'سماء', 'غيمة', 'مطر', 'ثلج', 'عاصفة', 'ريح', 'شجرة', 'وردة', 'عشب', 'حصان', 'كلب', 'قطة', 'فأر', 'أسد', 'نمر', 'فيل', 'زرافة', 'قرد', 'نسر', 'صقر', 'سمكة', 'قرش', 'حوت', 'سيارة', 'قطار', 'طائرة', 'سفينة', 'دراجة', 'مستشفى', 'مدرسة', 'جامعة', 'مكتبة', 'ملعب', 'حديقة', 'سوق', 'مقهى', 'مطعم', 'فندق', 'سرير', 'كرسي', 'طاولة', 'باب', 'نافذة', 'ساعة', 'هاتف', 'كمبيوتر', 'تلفاز', 'كتاب', 'قلم', 'ورقة', 'نظارة', 'مفتاح', 'سيف', 'درع', 'رمح', 'قوس', 'بندقية', 'قنبلة', 'ذهب', 'فضة', 'نحاس', 'حديد', 'خشب', 'زجاج', 'ماء', 'عصير', 'حليب', 'قهوة', 'شاي', 'خبز', 'لحم', 'دجاج', 'سمك', 'جبن', 'بيض', 'تفاح', 'برتقال', 'موز', 'عنب', 'بطيخ', 'تمر', 'خاتم', 'عقد', 'سوار', 'قبعة', 'قميص', 'حذاء', 'قفاز', 'معطف', 'شراب', 'نظارة', 'حقيبة', 'محفظة', 'بطاقة', 'عملة', 'صورة', 'خريطة', 'رسالة', 'جريدة', 'مجلة', 'لعبة', 'كرة', 'مضرب', 'شبكة', 'حكم', 'ملعب', 'هدف', 'نقطة', 'فوز', 'خسارة', 'تعادل', 'بطل', 'كأس', 'ميدالية', 'جائزة', 'هدية', 'حفلة', 'رقص', 'أغنية', 'موسيقى', 'فيلم', 'مسرح', 'ممثل', 'مخرج', 'بطل', 'شرير', 'نهاية'];

  socket.on('host_start_codenames_lobby', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'codenames_lobby';
      room.gameData = {
        mode: 'codenames',
        teams: {},
        spymasters: { red: null, blue: null },
      };
      room.players.forEach((p, i) => {
        room.gameData.teams[p.id] = i % 2 === 0 ? 'red' : 'blue';
      });
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('cn_join_team', ({ code, team }) => {
    const room = getRoom(code);
    if (room && room.state === 'codenames_lobby') {
      room.gameData.teams[socket.id] = team;
      if (room.gameData.spymasters['red'] === socket.id) room.gameData.spymasters['red'] = null;
      if (room.gameData.spymasters['blue'] === socket.id) room.gameData.spymasters['blue'] = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('cn_claim_spymaster', ({ code, team }) => {
    const room = getRoom(code);
    if (room && room.state === 'codenames_lobby') {
      room.gameData.spymasters[team] = socket.id;
      room.gameData.teams[socket.id] = team;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_start_codenames', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      const shuffledWords = [...codenamesWords].sort(() => Math.random() - 0.5).slice(0, 25);
      const startTeam = Math.random() > 0.5 ? 'red' : 'blue';
      const otherTeam = startTeam === 'red' ? 'blue' : 'red';

      let colors = [];
      for (let i = 0; i < 9; i++) colors.push(startTeam);
      for (let i = 0; i < 8; i++) colors.push(otherTeam);
      for (let i = 0; i < 7; i++) colors.push('neutral');
      colors.push('black');
      colors = colors.sort(() => Math.random() - 0.5);

      const board = shuffledWords.map((word, i) => ({
        word, color: colors[i], revealed: false
      }));

      room.state = 'codenames_playing';
      room.gameData.board = board;
      room.gameData.turn = startTeam;
      room.gameData.clue = null;
      room.gameData.winner = null;
      room.gameData.left = {
        red: board.filter(c => c.color === 'red').length,
        blue: board.filter(c => c.color === 'blue').length,
      };

      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('cn_give_clue', ({ code, clueWord, clueNum }) => {
    const room = getRoom(code);
    if (room && room.state === 'codenames_playing') {
      const turn = room.gameData.turn;
      if (room.gameData.spymasters?.[turn] !== socket.id) return;
      room.gameData.clue = { word: String(clueWord || '').slice(0, 20), number: Number(clueNum) || 1 };
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('cn_guess', ({ code, index }) => {
    const room = getRoom(code);
    if (room && room.state === 'codenames_playing' && room.gameData.clue) {
      const turn = room.gameData.turn;
      const myTeam = room.gameData.teams?.[socket.id];
      const isSpymaster = room.gameData.spymasters?.[turn] === socket.id;
      if (myTeam !== turn || isSpymaster) return;

      const card = room.gameData.board[index];
      if (!card || card.revealed) return;

      card.revealed = true;
      if (card.color === 'red') room.gameData.left.red--;
      if (card.color === 'blue') room.gameData.left.blue--;

      if (card.color === 'black') {
        room.gameData.winner = turn === 'red' ? 'blue' : 'red';
      } else if (room.gameData.left.red === 0) {
        room.gameData.winner = 'red';
      } else if (room.gameData.left.blue === 0) {
        room.gameData.winner = 'blue';
      }

      if (room.gameData.winner) {
        room.state = 'codenames_winner';
      } else if (card.color !== turn) {
        room.gameData.turn = turn === 'red' ? 'blue' : 'red';
        room.gameData.clue = null;
      }

      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('cn_end_turn', ({ code }) => {
    const room = getRoom(code);
    if (room && room.state === 'codenames_playing') {
      if (room.gameData.teams?.[socket.id] !== room.gameData.turn && room.hostId !== socket.id) return;
      room.gameData.turn = room.gameData.turn === 'red' ? 'blue' : 'red';
      room.gameData.clue = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  /* =========================================
     HOROOF (حروف مع عزيز) LOGIC
     ========================================= */
  socket.on('host_start_horoof_lobby', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'horoof_lobby';
      room.gameData = {
        mode: 'horoof',
        teams: {},
        scores: { green: 0, orange: 0 },
        round: 1,
        usedQuestions: []
      };
      room.players.forEach((p, i) => {
        room.gameData.teams[p.id] = i % 2 === 0 ? 'green' : 'orange';
      });
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('horoof_join_team', ({ code, team }) => {
    const room = getRoom(code);
    if (room && room.state === 'horoof_lobby') {
      if (team === 'green' || team === 'orange') {
        room.gameData.teams[socket.id] = team;
        io.to(room.code).emit('room_state_update', room);
      }
    }
  });

  socket.on('host_start_horoof', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'horoof_playing';
      room.gameData.board = generateHoroofBoard();
      room.gameData.turn = 'green';
      room.gameData.activeCell = null;
      room.gameData.activeQuestion = null;
      room.gameData.buzzedPlayer = null;
      room.gameData.winner = null;
      room.gameData.winningPath = null;
      room.gameData.round = room.gameData.round || 1;
      room.gameData.scores = room.gameData.scores || { green: 0, orange: 0 };
      room.gameData.usedQuestions = room.gameData.usedQuestions || [];
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('horoof_select_cell', ({ code, cellId }) => {
    const room = getRoom(code);
    if (!room || room.state !== 'horoof_playing' || room.gameData.activeCell) return;
    const isHost = room.hostId === socket.id;
    const playerTeam = room.gameData.teams?.[socket.id];
    if (!isHost && playerTeam !== room.gameData.turn) return;

    const cell = room.gameData.board.find(c => c.id === cellId);
    if (!cell || cell.owner) return;
    room.gameData.activeCell = cellId;
    const q = getQuestionForLetter(cell.letter, new Set(room.gameData.usedQuestions));
    room.gameData.usedQuestions.push(q.id);
    room.gameData.activeQuestion = q;
    room.gameData.buzzedPlayer = null;
    io.to(room.code).emit('room_state_update', room);
  });

  socket.on('horoof_buzz', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.state !== 'horoof_playing') return;
    if (!room.gameData.activeQuestion || room.gameData.buzzedPlayer) return;
    const team = room.gameData.teams?.[socket.id];
    if (!team) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    room.gameData.buzzedPlayer = { id: socket.id, name: player.name, team };
    io.to(room.code).emit('room_state_update', room);
  });

  socket.on('host_horoof_clear_buzz', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'horoof_playing') {
      room.gameData.buzzedPlayer = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_horoof_judge', ({ code, outcome }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'horoof_playing' && room.gameData.activeCell) {
      const cell = room.gameData.board.find(c => c.id === room.gameData.activeCell);
      if (cell && (outcome === 'green' || outcome === 'orange')) {
        cell.owner = outcome;
        const winResult = checkHoroofWinner(room.gameData.board);
        if (winResult) {
          room.gameData.winner = winResult.winner;
          room.gameData.winningPath = winResult.winningPath;
          room.gameData.scores[winResult.winner] = (room.gameData.scores[winResult.winner] || 0) + 1;
          room.state = 'horoof_winner';
        }
      }
      if (!room.gameData.winner) {
        room.gameData.turn = room.gameData.turn === 'green' ? 'orange' : 'green';
      }
      room.gameData.activeCell = null;
      room.gameData.activeQuestion = null;
      room.gameData.buzzedPlayer = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_horoof_new_round', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'horoof_playing';
      room.gameData.round = (room.gameData.round || 1) + 1;
      room.gameData.board = generateHoroofBoard();
      room.gameData.turn = room.gameData.round % 2 === 1 ? 'green' : 'orange';
      room.gameData.activeCell = null;
      room.gameData.activeQuestion = null;
      room.gameData.buzzedPlayer = null;
      room.gameData.winner = null;
      room.gameData.winningPath = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  /* =========================================
     CORE LOBBY
     ========================================= */
  socket.on('player_join_room', ({ code, name }, callback) => {
    if (!code || typeof code !== 'string' || !name || typeof name !== 'string') {
      return safeCallback(callback, { success: false, error: 'البيانات غير مكتملة!' });
    }
    const roomCode = code.trim().toUpperCase();
    const cleanName = name.trim().slice(0, 15);
    if (!cleanName) {
      return safeCallback(callback, { success: false, error: 'اسم غير صالح!' });
    }
    const room = rooms.get(roomCode);
    if (!room) return safeCallback(callback, { success: false, error: 'الروم غير موجود!' });
    if (room.state !== 'lobby') return safeCallback(callback, { success: false, error: 'اللعبة بدأت بالفعل!' });
    if (room.players.find(p => p.name === cleanName)) return safeCallback(callback, { success: false, error: 'الاسم مستخدم!' });

    const newPlayer = { id: socket.id, name: cleanName };
    room.players.push(newPlayer);
    socket.join(roomCode);
    io.to(roomCode).emit('room_state_update', room);
    safeCallback(callback, { success: true, room: roomCode, state: room.state });
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
          if (room.gameData?.buzzedPlayer?.id === socket.id) {
            room.gameData.buzzedPlayer = null;
          }
          if (room.gameData?.alive) {
            delete room.gameData.alive[socket.id];
          }
          if (room.gameData?.teams) {
            delete room.gameData.teams[socket.id];
          }
          io.to(room.hostId).emit('player_left', p);
          io.to(code).emit('room_state_update', room);
        }
      }
    });
  });
});

app.use(express.static(path.join(__dirname, '../dist'), { maxAge: '1d' }));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Socket server running on port ${PORT}`));
