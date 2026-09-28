import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateHoroofBoard, getQuestionForLetter, checkHoroofWinner } from './horoofData.js';
import { getRandomAdedTopic } from './adedData.js';

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
const voiceRooms = new Map();

const DEFAULT_PUBLIC_ROOMS = [
  { code: 'PUB1', name: 'غرفة الألعاب والتحديات 1', isPermanent: true, isPublic: true },
  { code: 'PUB2', name: 'مجلس الفويس والمنافسات 2', isPermanent: true, isPublic: true },
  { code: 'PUB3', name: 'ديوانية برا السالفة ومافيا', isPermanent: true, isPublic: true }
];

DEFAULT_PUBLIC_ROOMS.forEach(pr => {
  rooms.set(pr.code, {
    hostId: null,
    code: pr.code,
    name: pr.name,
    isPermanent: true,
    isPublic: true,
    players: [],
    state: 'lobby',
    gameData: {},
    voting: { active: false, votes: {}, endTime: null }
  });
});

const getGameDisplayName = (state, gameData) => {
  if (!state || state === 'lobby') return 'في صالة الانتظار';
  if (state.startsWith('barra')) return 'برا السالفة';
  if (state.startsWith('mafia')) return 'مافيا';
  if (state.startsWith('codenames')) return 'كود نيمز';
  if (state.startsWith('horoof')) return 'تحدي الحروف';
  if (state.startsWith('aded')) return 'عدّد';
  return 'جاري اللعب';
};

const getPublicRoomsList = () => {
  const list = [];
  rooms.forEach((r, c) => {
    if (r.isPublic) {
      const vr = voiceRooms.get(c);
      list.push({
        code: r.code,
        name: r.name || `غرفة ${r.code}`,
        playersCount: r.players.length,
        state: r.state,
        gameName: getGameDisplayName(r.state, r.gameData),
        isPermanent: !!r.isPermanent,
        hostName: r.players.find(p => p.id === r.hostId)?.name || (r.players.length === 0 ? 'متاحة للجميع' : 'مقدم الروم'),
        hasVoice: true,
        voiceCount: vr ? vr.size : 0
      });
    }
  });
  return list;
};

const broadcastPublicRooms = () => {
  io.emit('public_rooms_update', getPublicRoomsList());
};

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
  socket.on('get_public_rooms', (callback) => {
    safeCallback(callback, { success: true, rooms: getPublicRoomsList() });
  });

  socket.on('host_create_room', (payload, callback) => {
    const cb = typeof payload === 'function' ? payload : callback;
    const options = typeof payload === 'object' && payload !== null ? payload : {};
    const isPublic = options.isPublic !== undefined ? Boolean(options.isPublic) : true;
    const name = options.name ? String(options.name).trim().slice(0, 30) : null;

    const code = generateCode();
    const newRoom = {
      hostId: socket.id,
      code,
      name: name || `غرفة ${code}`,
      isPublic,
      players: [],
      state: 'lobby',
      gameData: {},
      voting: { active: false, votes: {}, endTime: null }
    };
    rooms.set(code, newRoom);
    socket.join(code);
    safeCallback(cb, { success: true, code });
    io.to(code).emit('room_state_update', newRoom);
    if (isPublic) broadcastPublicRooms();
  });

  socket.on('host_toggle_room_privacy', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.isPublic = !room.isPublic;
      io.to(room.code).emit('room_state_update', room);
      broadcastPublicRooms();
    }
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

  const startCodenamesTurnTimer = (room) => {
    if (!room || room.state !== 'codenames_playing') return;
    if (room.gameData.turnTimeoutId) {
      clearTimeout(room.gameData.turnTimeoutId);
      room.gameData.turnTimeoutId = null;
    }

    const duration = room.gameData.turnDuration || 60;
    room.gameData.turnExpiresAt = Date.now() + duration * 1000;

    room.gameData.turnTimeoutId = setTimeout(() => {
      if (!room || room.state !== 'codenames_playing') return;
      const currentTurn = room.gameData.turn;
      const nextTurn = currentTurn === 'red' ? 'blue' : 'red';
      room.gameData.turn = nextTurn;
      room.gameData.clue = null;
      io.to(room.code).emit('cn_turn_timed_out', { previousTurn: currentTurn, newTurn: nextTurn });
      startCodenamesTurnTimer(room);
      io.to(room.code).emit('room_state_update', room);
    }, duration * 1000);
  };

  socket.on('host_set_codenames_turn_duration', ({ code, duration }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.gameData.turnDuration = Math.min(180, Math.max(20, Number(duration) || 60));
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_start_codenames', ({ code, turnDuration }) => {
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
      room.gameData.turnDuration = Math.min(180, Math.max(20, Number(turnDuration) || room.gameData.turnDuration || 60));

      startCodenamesTurnTimer(room);
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('cn_give_clue', ({ code, clueWord, clueNum }) => {
    const room = getRoom(code);
    if (room && room.state === 'codenames_playing') {
      const turn = room.gameData.turn;
      if (room.gameData.spymasters?.[turn] !== socket.id) return;
      room.gameData.clue = { word: String(clueWord || '').slice(0, 20), number: Number(clueNum) || 1 };
      startCodenamesTurnTimer(room);
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
        if (room.gameData.turnTimeoutId) clearTimeout(room.gameData.turnTimeoutId);
        room.gameData.winner = turn === 'red' ? 'blue' : 'red';
      } else if (room.gameData.left.red === 0) {
        if (room.gameData.turnTimeoutId) clearTimeout(room.gameData.turnTimeoutId);
        room.gameData.winner = 'red';
      } else if (room.gameData.left.blue === 0) {
        if (room.gameData.turnTimeoutId) clearTimeout(room.gameData.turnTimeoutId);
        room.gameData.winner = 'blue';
      }

      if (room.gameData.winner) {
        room.state = 'codenames_winner';
      } else if (card.color !== turn) {
        room.gameData.turn = turn === 'red' ? 'blue' : 'red';
        room.gameData.clue = null;
        startCodenamesTurnTimer(room);
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
      startCodenamesTurnTimer(room);
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
        scores: { green: 0, blue: 0, orange: 0 },
        round: 1,
        usedQuestions: []
      };
      // Distribute only non-host contestants into green and blue teams
      const nonHostPlayers = room.players.filter(p => p.id !== room.hostId);
      nonHostPlayers.forEach((p, i) => {
        room.gameData.teams[p.id] = i % 2 === 0 ? 'green' : 'blue';
      });
      delete room.gameData.teams[room.hostId];
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('horoof_join_team', ({ code, team }) => {
    const room = getRoom(code);
    if (room && room.state === 'horoof_lobby') {
      // The host is the referee/presenter and must not play or join a team
      if (socket.id === room.hostId) return;
      const normalizedTeam = (team === 'blue' || team === 'orange') ? 'blue' : (team === 'green' ? 'green' : null);
      if (normalizedTeam) {
        room.gameData.teams[socket.id] = normalizedTeam;
        io.to(room.code).emit('room_state_update', room);
      }
    }
  });

  socket.on('horoof_leave_team', ({ code }) => {
    const room = getRoom(code);
    if (room && room.state === 'horoof_lobby') {
      if (room.gameData?.teams) {
        delete room.gameData.teams[socket.id];
        io.to(room.code).emit('room_state_update', room);
      }
    }
  });

  socket.on('host_start_horoof', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      delete room.gameData.teams[room.hostId];
      room.state = 'horoof_playing';
      room.gameData.board = generateHoroofBoard();
      room.gameData.turn = 'green';
      room.gameData.activeCell = null;
      room.gameData.activeQuestion = null;
      room.gameData.buzzedPlayer = null;
      room.gameData.winner = null;
      room.gameData.winningPath = null;
      room.gameData.round = room.gameData.round || 1;
      room.gameData.scores = room.gameData.scores || { green: 0, blue: 0, orange: 0 };
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
    // Host is referee and cannot buzz
    if (socket.id === room.hostId) return;
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
      const normalizedOutcome = (outcome === 'blue' || outcome === 'orange') ? 'blue' : (outcome === 'green' ? 'green' : null);
      if (cell && normalizedOutcome) {
        cell.owner = normalizedOutcome;
        const winResult = checkHoroofWinner(room.gameData.board);
        if (winResult) {
          const winnerKey = winResult.winner === 'orange' ? 'blue' : winResult.winner;
          room.gameData.winner = winnerKey;
          room.gameData.winningPath = winResult.winningPath;
          room.gameData.scores[winnerKey] = (room.gameData.scores[winnerKey] || 0) + 1;
          room.state = 'horoof_winner';
        }
      }
      if (!room.gameData.winner) {
        room.gameData.turn = room.gameData.turn === 'green' ? 'blue' : 'green';
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
      room.gameData.turn = room.gameData.round % 2 === 1 ? 'green' : 'blue';
      room.gameData.activeCell = null;
      room.gameData.activeQuestion = null;
      room.gameData.buzzedPlayer = null;
      room.gameData.winner = null;
      room.gameData.winningPath = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_horoof_toggle_hint', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'horoof_playing' && room.gameData?.activeQuestion) {
      room.gameData.showHint = !room.gameData.showHint;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  /* =========================================
     ADED (عدّد - نظام المزايدة والتحدي بـ 30 ثانية) LOGIC
     ========================================= */
  socket.on('host_start_aded', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'aded_lobby';
      room.gameData = {
        mode: 'aded',
        contestants: room.players.map(p => p.id),
        round: 1,
        scores: {},
        history: [],
        usedTopics: [],
        phase: 'bidding', // 'bidding' | 'counting'
        currentBid: 0,
        highestBidderId: null,
        highestBidderName: null,
        targetCount: 0,
        count: 0,
        isRunning: false,
        timerStartedAt: null
      };
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('aded_toggle_contestant', ({ code }) => {
    const room = getRoom(code);
    if (room && room.state === 'aded_lobby') {
      room.gameData.contestants = room.gameData.contestants || [];
      const idx = room.gameData.contestants.indexOf(socket.id);
      if (idx !== -1) {
        room.gameData.contestants.splice(idx, 1);
      } else {
        room.gameData.contestants.push(socket.id);
      }
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_aded_start_game', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && (room.state === 'aded_lobby' || room.state === 'aded_results')) {
      room.state = 'aded_playing';
      const topic = getRandomAdedTopic(room.gameData?.usedTopics || []);
      room.gameData = {
        ...room.gameData,
        topic,
        usedTopics: [...(room.gameData?.usedTopics || []), topic],
        phase: 'bidding',
        currentBid: 0,
        highestBidderId: null,
        highestBidderName: null,
        activePlayerId: null,
        targetCount: 0,
        count: 0,
        isRunning: false,
        timerStartedAt: null,
        scores: room.gameData?.scores || {},
        history: room.gameData?.history || [],
        round: (room.gameData?.round || 0) + 1
      };
      io.to(room.code).emit('room_state_update', room);
    }
  });

  // مزايدة المتسابقين (+1 أو رفع الرقم)
  socket.on('aded_place_bid', ({ code, amount }) => {
    const room = getRoom(code);
    if (room && room.state === 'aded_playing') {
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;
      const num = parseInt(amount, 10);
      if (isNaN(num) || num <= (room.gameData.currentBid || 0)) return;

      room.gameData.currentBid = num;
      room.gameData.highestBidderId = socket.id;
      room.gameData.highestBidderName = player.name;
      room.gameData.activePlayerId = socket.id;
      room.gameData.targetCount = num;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  // تحكم الهوست بالمزايدة واختيار المتحدي يدوياً بدون إجبار
  socket.on('host_aded_set_bid', ({ code, playerId, amount }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing') {
      const player = room.players.find(p => p.id === playerId);
      const num = Math.max(1, parseInt(amount, 10) || 1);
      room.gameData.currentBid = num;
      room.gameData.targetCount = num;
      room.gameData.highestBidderId = playerId;
      room.gameData.highestBidderName = player ? player.name : 'متسابق';
      room.gameData.activePlayerId = playerId;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  // بدء التحدي والعد للمزايد الأعلى (الانتقال لمرحلة الـ 30 ثانية)
  socket.on('host_aded_start_challenge', ({ code, playerId, targetCount }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing') {
      const finalPlayerId = playerId || room.gameData.highestBidderId || room.players[0]?.id;
      const finalTarget = parseInt(targetCount, 10) || room.gameData.currentBid || 5;

      room.gameData.phase = 'counting';
      room.gameData.activePlayerId = finalPlayerId;
      room.gameData.targetCount = finalTarget;
      room.gameData.count = 0;
      room.gameData.isRunning = false;
      room.gameData.timerStartedAt = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  // إنهاء التحدي وتحديد الفائز بالنقاط (نجح في المزايدة أو فشل)
  socket.on('host_aded_finish_challenge', ({ code, outcome }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing') {
      const pId = room.gameData.activePlayerId;
      const player = room.players.find(p => p.id === pId);
      const won = outcome === 'win';
      const target = room.gameData.targetCount || room.gameData.currentBid || 0;
      const count = room.gameData.count || 0;

      if (pId && won) {
        room.gameData.scores = room.gameData.scores || {};
        room.gameData.scores[pId] = (room.gameData.scores[pId] || 0) + 1;
      }

      room.gameData.history = room.gameData.history || [];
      room.gameData.history.unshift({
        playerId: pId,
        playerName: player ? player.name : 'مجهول',
        won,
        count,
        target,
        topic: room.gameData.topic,
        time: new Date().toLocaleTimeString('ar-SA')
      });

      // الرجوع لمرحلة المزايدة بموضوع جديد
      const newTopic = getRandomAdedTopic(room.gameData.usedTopics || []);
      room.gameData.topic = newTopic;
      room.gameData.usedTopics = [...(room.gameData.usedTopics || []), newTopic];
      room.gameData.phase = 'bidding';
      room.gameData.currentBid = 0;
      room.gameData.highestBidderId = null;
      room.gameData.highestBidderName = null;
      room.gameData.activePlayerId = null;
      room.gameData.targetCount = 0;
      room.gameData.count = 0;
      room.gameData.isRunning = false;
      room.gameData.timerStartedAt = null;
      room.gameData.round = (room.gameData.round || 1) + 1;

      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_aded_next_topic', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing') {
      const newTopic = getRandomAdedTopic(room.gameData.usedTopics || []);
      room.gameData.topic = newTopic;
      room.gameData.usedTopics = [...(room.gameData.usedTopics || []), newTopic];
      room.gameData.phase = 'bidding';
      room.gameData.currentBid = 0;
      room.gameData.highestBidderId = null;
      room.gameData.highestBidderName = null;
      room.gameData.count = 0;
      room.gameData.isRunning = false;
      room.gameData.timerStartedAt = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_aded_set_custom_topic', ({ code, customTopic }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing' && customTopic) {
      room.gameData.topic = String(customTopic).trim().slice(0, 120);
      room.gameData.phase = 'bidding';
      room.gameData.currentBid = 0;
      room.gameData.highestBidderId = null;
      room.gameData.highestBidderName = null;
      room.gameData.count = 0;
      room.gameData.isRunning = false;
      room.gameData.timerStartedAt = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_aded_start_timer', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing') {
      room.gameData.isRunning = true;
      room.gameData.timerStartedAt = Date.now();
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_aded_stop_timer', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing') {
      room.gameData.isRunning = false;
      room.gameData.timerStartedAt = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_aded_increment', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing') {
      room.gameData.count = (room.gameData.count || 0) + 1;
      io.to(room.code).emit('room_state_update', room);
      io.to(room.code).emit('aded_count_bump', { count: room.gameData.count });
    }
  });

  socket.on('host_aded_decrement', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing') {
      room.gameData.count = Math.max(0, (room.gameData.count || 0) - 1);
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_aded_end_game', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id && room.state === 'aded_playing') {
      room.state = 'aded_results';
      room.gameData.isRunning = false;
      room.gameData.timerStartedAt = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_aded_new_round', ({ code }) => {
    const room = getRoom(code);
    if (room && room.hostId === socket.id) {
      room.state = 'aded_playing';
      room.gameData.round = (room.gameData.round || 1) + 1;
      room.gameData.currentTurnIdx = 0;
      const contestants = room.gameData.contestants && room.gameData.contestants.length > 0 ? room.gameData.contestants : room.players.map(p => p.id);
      room.gameData.activePlayerId = contestants[0] || room.players[0]?.id;
      const nextTopic = getRandomAdedTopic(room.gameData.usedTopics || []);
      room.gameData.topic = nextTopic;
      room.gameData.usedTopics = room.gameData.usedTopics || [];
      room.gameData.usedTopics.push(nextTopic);
      room.gameData.count = 0;
      room.gameData.isRunning = false;
      room.gameData.timerStartedAt = null;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  /* =========================================
     GAME VOTING SYSTEM
     ========================================= */
  const triggerGameStart = (room, gameId) => {
    if (!room) return;
    if (room.voting?.timeoutId) clearTimeout(room.voting.timeoutId);
    room.voting = { active: false, votes: {}, endTime: null };

    if (gameId === 'barra') {
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
      broadcastPublicRooms();
    } else if (gameId === 'horoof') {
      room.state = 'horoof_lobby';
      const teams = {};
      room.players.forEach((p, idx) => {
        teams[p.id] = idx % 2 === 0 ? 'green' : 'blue';
      });
      room.gameData = {
        mode: 'horoof',
        teams,
        scores: { green: 0, blue: 0, orange: 0 },
        round: 1,
        board: generateHoroofBoard(),
        turn: 'green',
        activeCell: null,
        activeQuestion: null,
        buzzedPlayer: null,
        winningPath: null,
        showHint: false
      };
      io.to(room.code).emit('room_state_update', room);
      broadcastPublicRooms();
    } else if (gameId === 'aded') {
      room.state = 'aded_lobby';
      room.gameData = {
        mode: 'aded',
        round: 1,
        scores: {},
        contestants: room.players.map(p => p.id),
        targetGoal: 10,
        topic: getRandomAdedTopic([]),
        usedTopics: [],
        phase: 'bidding',
        currentBid: 0,
        highestBidderId: null,
        highestBidderName: null,
        count: 0,
        isRunning: false,
        timerStartedAt: null
      };
      io.to(room.code).emit('room_state_update', room);
      broadcastPublicRooms();
    } else if (gameId === 'codenames') {
      room.state = 'codenames_lobby';
      const teams = {};
      room.players.forEach((p, idx) => {
        teams[p.id] = idx % 2 === 0 ? 'red' : 'blue';
      });
      room.gameData = {
        mode: 'codenames',
        teams,
        spymasters: { red: null, blue: null }
      };
      io.to(room.code).emit('room_state_update', room);
      broadcastPublicRooms();
    } else if (gameId === 'mafia') {
      room.state = 'mafia_playing';
      const numPlayers = room.players.length;
      const numMafia = Math.max(1, Math.floor(numPlayers / 3));
      const shuffled = [...room.players].sort(() => Math.random() - 0.5);
      const roles = {};
      const alive = {};
      room.players.forEach(p => alive[p.id] = true);
      for (let i = 0; i < shuffled.length; i++) {
        if (i < numMafia) roles[shuffled[i].id] = 'mafia';
        else if (i === numMafia) roles[shuffled[i].id] = 'doctor';
        else if (i === numMafia + 1) roles[shuffled[i].id] = 'detective';
        else roles[shuffled[i].id] = 'town';
      }
      room.gameData = {
        mode: 'mafia',
        roles,
        alive,
        phase: 'night',
        nightActions: {},
        dayNumber: 1,
        votes: {}
      };
      room.players.forEach(p => {
        const r = roles[p.id];
        let roleName = 'مواطن صالح';
        let hint = 'حاول معرفة المافيا بالتصويت في النهار!';
        if (r === 'mafia') { roleName = 'مافيا'; hint = 'اقتلوا المواطنين في الليل بدون ما تكشفون أنفسكم!'; }
        else if (r === 'doctor') { roleName = 'طبيب'; hint = 'اختر شخصا لحمايته من القتل كل ليلة!'; }
        else if (r === 'detective') { roleName = 'محقق'; hint = 'تحقق من هوية لاعب واحد كل ليلة!'; }
        io.to(p.id).emit('game_started', { mode: 'mafia', role: roleName, hint, roleType: r });
      });
      io.to(room.code).emit('room_state_update', room);
      io.to(room.code).emit('start_night', { alive });
      broadcastPublicRooms();
    }
  };

  const resolveVoting = (code) => {
    const room = getRoom(code);
    if (!room || !room.voting || !room.voting.active) return;
    if (room.voting.timeoutId) clearTimeout(room.voting.timeoutId);

    const counts = { barra: 0, horoof: 0, aded: 0, codenames: 0, mafia: 0 };
    Object.values(room.voting.votes || {}).forEach(v => {
      if (counts[v] !== undefined) counts[v]++;
    });

    let topGame = 'horoof';
    let maxCount = -1;
    Object.entries(counts).forEach(([g, c]) => {
      if (c > maxCount) {
        maxCount = c;
        topGame = g;
      }
    });

    io.to(room.code).emit('game_vote_finished', { winningGame: topGame, counts });
    triggerGameStart(room, topGame);
  };

  socket.on('host_start_game_voting', ({ code, duration = 30 }) => {
    const room = getRoom(code);
    if (room && (room.hostId === socket.id || !room.hostId)) {
      const validDuration = Math.min(60, Math.max(10, Number(duration) || 30));
      if (room.voting?.timeoutId) clearTimeout(room.voting.timeoutId);
      room.voting = {
        active: true,
        votes: {},
        endTime: Date.now() + validDuration * 1000,
        timeoutId: setTimeout(() => {
          resolveVoting(code);
        }, validDuration * 1000)
      };
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('player_cast_game_vote', ({ code, gameId }) => {
    const room = getRoom(code);
    if (room && room.voting && room.voting.active) {
      room.voting.votes[socket.id] = gameId;
      io.to(room.code).emit('room_state_update', room);
    }
  });

  socket.on('host_end_game_voting', ({ code }) => {
    const room = getRoom(code);
    if (room && (room.hostId === socket.id || !room.hostId) && room.voting?.active) {
      resolveVoting(code);
    }
  });

  socket.on('host_cancel_game_voting', ({ code }) => {
    const room = getRoom(code);
    if (room && (room.hostId === socket.id || !room.hostId)) {
      if (room.voting?.timeoutId) clearTimeout(room.voting.timeoutId);
      room.voting = { active: false, votes: {}, endTime: null };
      io.to(room.code).emit('room_state_update', room);
    }
  });

  /* =========================================
     VOICE CHAT (WebRTC Signaling)
     ========================================= */
  socket.on('voice_join', ({ code, name, isMuted }) => {
    if (!code) return;
    const roomCode = code.trim().toUpperCase();
    if (!voiceRooms.has(roomCode)) {
      voiceRooms.set(roomCode, new Map());
    }
    const vr = voiceRooms.get(roomCode);
    vr.set(socket.id, {
      name: name || 'لاعب',
      isMuted: Boolean(isMuted),
      isSpeaking: false
    });

    socket.to(roomCode).emit('voice_user_joined', {
      peerId: socket.id,
      name: name || 'لاعب',
      isMuted: Boolean(isMuted)
    });

    const existingUsers = [];
    vr.forEach((u, id) => {
      if (id !== socket.id) {
        existingUsers.push({ peerId: id, name: u.name, isMuted: u.isMuted, isSpeaking: u.isSpeaking });
      }
    });
    socket.emit('voice_current_users', existingUsers);
    broadcastPublicRooms();
  });

  socket.on('voice_offer', ({ targetPeerId, offer }) => {
    if (targetPeerId) {
      io.to(targetPeerId).emit('voice_offer', { senderPeerId: socket.id, offer });
    }
  });

  socket.on('voice_answer', ({ targetPeerId, answer }) => {
    if (targetPeerId) {
      io.to(targetPeerId).emit('voice_answer', { senderPeerId: socket.id, answer });
    }
  });

  socket.on('voice_ice_candidate', ({ targetPeerId, candidate }) => {
    if (targetPeerId) {
      io.to(targetPeerId).emit('voice_ice_candidate', { senderPeerId: socket.id, candidate });
    }
  });

  socket.on('voice_state_update', ({ code, isMuted, isSpeaking }) => {
    if (!code) return;
    const roomCode = code.trim().toUpperCase();
    const vr = voiceRooms.get(roomCode);
    if (vr && vr.has(socket.id)) {
      const user = vr.get(socket.id);
      if (isMuted !== undefined) user.isMuted = Boolean(isMuted);
      if (isSpeaking !== undefined) user.isSpeaking = Boolean(isSpeaking);
      io.to(roomCode).emit('voice_user_state_changed', {
        peerId: socket.id,
        isMuted: user.isMuted,
        isSpeaking: user.isSpeaking
      });
    }
  });

  socket.on('voice_leave', ({ code }) => {
    if (!code) return;
    const roomCode = code.trim().toUpperCase();
    const vr = voiceRooms.get(roomCode);
    if (vr && vr.has(socket.id)) {
      vr.delete(socket.id);
      io.to(roomCode).emit('voice_user_left', { peerId: socket.id });
      if (vr.size === 0) voiceRooms.delete(roomCode);
      broadcastPublicRooms();
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

    if (!room.hostId || !room.players.some(p => p.id === room.hostId)) {
      room.hostId = socket.id;
    }

    if (room.players.find(p => p.name === cleanName)) {
      return safeCallback(callback, { success: false, error: 'الاسم مستخدم!' });
    }

    const newPlayer = { id: socket.id, name: cleanName };
    room.players.push(newPlayer);
    socket.join(roomCode);
    io.to(roomCode).emit('room_state_update', room);
    broadcastPublicRooms();
    safeCallback(callback, { success: true, room: roomCode, state: room.state });
  });

  socket.on('disconnect', () => {
    voiceRooms.forEach((vr, code) => {
      if (vr.has(socket.id)) {
        vr.delete(socket.id);
        io.to(code).emit('voice_user_left', { peerId: socket.id });
        if (vr.size === 0) voiceRooms.delete(code);
      }
    });

    rooms.forEach((room, code) => {
      if (room.hostId === socket.id) {
        if (room.isPermanent) {
          const playerIndex = room.players.findIndex(p => p.id === socket.id);
          if (playerIndex !== -1) room.players.splice(playerIndex, 1);
          if (room.players.length > 0) {
            room.hostId = room.players[0].id;
            io.to(code).emit('room_state_update', room);
          } else {
            room.hostId = null;
            room.state = 'lobby';
            room.gameData = {};
            if (room.voting?.timeoutId) clearTimeout(room.voting.timeoutId);
            room.voting = { active: false, votes: {}, endTime: null };
          }
          broadcastPublicRooms();
        } else {
          io.to(code).emit('host_disconnected');
          rooms.delete(code);
          broadcastPublicRooms();
        }
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
          if (room.voting?.votes?.[socket.id]) {
            delete room.voting.votes[socket.id];
          }
          io.to(room.hostId).emit('player_left', p);
          io.to(code).emit('room_state_update', room);
          broadcastPublicRooms();
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
