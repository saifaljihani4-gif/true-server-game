const fs = require('fs');
let data = fs.readFileSync('server/index.js', 'utf8');

const codenamesLogic = `
  /* =========================================
     CODENAMES LOGIC
     ========================================= */
  const codenamesWords = ['شمس', 'قمر', 'بحر', 'نار', 'جبل', 'نهر', 'سماء', 'غيمة', 'مطر', 'ثلج', 'عاصفة', 'ريح', 'شجرة', 'وردة', 'عشب', 'حصان', 'كلب', 'قطة', 'فأر', 'أسد', 'نمر', 'فيل', 'زرافة', 'قرد', 'نسر', 'صقر', 'سمكة', 'قرش', 'حوت', 'سيارة', 'قطار', 'طائرة', 'سفينة', 'دراجة', 'مستشفى', 'مدرسة', 'جامعة', 'مكتبة', 'ملعب', 'حديقة', 'سوق', 'مقهى', 'مطعم', 'فندق', 'سرير', 'كرسي', 'طاولة', 'باب', 'نافذة', 'ساعة', 'هاتف', 'كمبيوتر', 'تلفاز', 'كتاب', 'قلم', 'ورقة', 'نظارة', 'مفتاح', 'سيف', 'درع', 'رمح', 'قوس', 'بندقية', 'قنبلة', 'ذهب', 'فضة', 'نحاس', 'حديد', 'خشب', 'زجاج', 'ماء', 'عصير', 'حليب', 'قهوة', 'شاي', 'خبز', 'لحم', 'دجاج', 'سمك', 'جبن', 'بيض', 'تفاح', 'برتقال', 'موز', 'عنب', 'بطيخ', 'تمر', 'خاتم', 'عقد', 'سوار', 'قبعة', 'قميص', 'حذاء', 'قفاز', 'معطف', 'شراب', 'نظارة', 'حقيبة', 'محفظة', 'بطاقة', 'عملة', 'صورة', 'خريطة', 'رسالة', 'جريدة', 'مجلة', 'لعبة', 'كرة', 'مضرب', 'شبكة', 'حكم', 'ملعب', 'هدف', 'نقطة', 'فوز', 'خسارة', 'تعادل', 'بطل', 'كأس', 'ميدالية', 'جائزة', 'هدية', 'حفلة', 'رقص', 'أغنية', 'موسيقى', 'فيلم', 'مسرح', 'ممثل', 'مخرج', 'بطل', 'شرير', 'نهاية'];

  socket.on('host_start_codenames_lobby', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      room.state = 'codenames_lobby';
      room.gameData = {
        mode: 'codenames',
        teams: {}, // { playerId: 'red' | 'blue' }
        spymasters: { red: null, blue: null },
      };
      
      // Auto assign teams
      room.players.forEach((p, i) => {
        room.gameData.teams[p.id] = i % 2 === 0 ? 'red' : 'blue';
      });

      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('cn_join_team', ({ code, team }) => {
    const room = rooms.get(code);
    if (room && room.state === 'codenames_lobby') {
      room.gameData.teams[socket.id] = team;
      if (room.gameData.spymasters[team === 'red' ? 'blue' : 'red'] === socket.id) {
        room.gameData.spymasters[team === 'red' ? 'blue' : 'red'] = null;
      }
      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('cn_claim_spymaster', ({ code, team }) => {
    const room = rooms.get(code);
    if (room && room.state === 'codenames_lobby') {
      room.gameData.spymasters[team] = socket.id;
      room.gameData.teams[socket.id] = team; // auto join team
      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('host_start_codenames', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.hostId === socket.id) {
      // Pick random words
      const shuffledWords = [...codenamesWords].sort(() => Math.random() - 0.5).slice(0, 25);
      const startTeam = Math.random() > 0.5 ? 'red' : 'blue';
      const otherTeam = startTeam === 'red' ? 'blue' : 'red';
      
      let colors = [];
      for(let i=0; i<9; i++) colors.push(startTeam);
      for(let i=0; i<8; i++) colors.push(otherTeam);
      for(let i=0; i<7; i++) colors.push('neutral');
      colors.push('black'); // assassin
      colors = colors.sort(() => Math.random() - 0.5);

      const board = shuffledWords.map((word, i) => ({
        word,
        color: colors[i],
        revealed: false
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

      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('cn_give_clue', ({ code, clueWord, clueNum }) => {
    const room = rooms.get(code);
    if (room && room.state === 'codenames_playing') {
      room.gameData.clue = { word: clueWord, number: clueNum, guessesLeft: clueNum + 1 };
      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('cn_guess', ({ code, index }) => {
    const room = rooms.get(code);
    if (room && room.state === 'codenames_playing' && room.gameData.clue) {
      const card = room.gameData.board[index];
      if (card.revealed) return;
      
      card.revealed = true;
      const turn = room.gameData.turn;
      
      // Update counts
      if (card.color === 'red') room.gameData.left.red--;
      if (card.color === 'blue') room.gameData.left.blue--;

      // Check win conditions
      if (card.color === 'black') {
        room.gameData.winner = turn === 'red' ? 'blue' : 'red';
      } else if (room.gameData.left.red === 0) {
        room.gameData.winner = 'red';
      } else if (room.gameData.left.blue === 0) {
        room.gameData.winner = 'blue';
      }

      if (room.gameData.winner) {
        room.state = 'codenames_winner';
      } else {
        if (card.color === turn) {
          room.gameData.clue.guessesLeft--;
          if (room.gameData.clue.guessesLeft <= 0) {
            room.gameData.turn = turn === 'red' ? 'blue' : 'red';
            room.gameData.clue = null;
          }
        } else {
          // Wrong guess (neutral or enemy)
          room.gameData.turn = turn === 'red' ? 'blue' : 'red';
          room.gameData.clue = null;
        }
      }

      io.to(code).emit('room_state_update', room);
    }
  });

  socket.on('cn_end_turn', ({ code }) => {
    const room = rooms.get(code);
    if (room && room.state === 'codenames_playing') {
      room.gameData.turn = room.gameData.turn === 'red' ? 'blue' : 'red';
      room.gameData.clue = null;
      io.to(code).emit('room_state_update', room);
    }
  });

  /* =========================================`;

if (!data.includes('CODENAMES LOGIC')) {
  data = data.replace('/* =========================================\n     CORE LOBBY', codenamesLogic + '\n     CORE LOBBY');
}

fs.writeFileSync('server/index.js', data, 'utf8');
console.log('done');
