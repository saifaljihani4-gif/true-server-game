const fs = require('fs');
let data = fs.readFileSync('src/components/game/multiplayer.tsx', 'utf8');

const lobbyButton = `
                  <button onClick={() => socket.emit('host_start_codenames_lobby', { code: room.code })} disabled={room.players.length < 2} className="py-4 px-5 rounded-2xl font-bold transition-all bg-white text-black hover:scale-105 disabled:opacity-50 flex justify-between items-center">
                    كود نيمز <span className="w-3 h-3 rounded-full bg-blue-500" />
                  </button>
`;

if (!data.includes('host_start_codenames_lobby')) {
  data = data.replace(
    /<button onClick=\{\(\) => socket\.emit\('host_start_mafia', \{ code: room\.code \}\)\}[\s\S]*?<\/button>/,
    "$&" + lobbyButton
  );
}

const cnViews = `
  if (room.state === 'codenames_lobby') {
    const myTeam = room.gameData?.teams?.[socket.id];
    const redSpymaster = room.gameData?.spymasters?.red;
    const blueSpymaster = room.gameData?.spymasters?.blue;
    
    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col p-6 items-center bg-black">
        <h1 className="font-kufi text-4xl font-bold text-white mb-8 pop-in-bouncy">تجهيز كود نيمز</h1>
        
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl mb-12 fade-in-up">
          {/* Red Team */}
          <div className="flex-1 bg-red-900/20 border border-red-500/30 p-6 rounded-3xl flex flex-col items-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">الفريق الأحمر</h2>
            <button onClick={() => socket.emit('cn_join_team', { code, team: 'red' })} className="mb-6 px-6 py-2 rounded-full bg-red-500/20 text-red-400 font-bold hover:bg-red-500/40">انضم للأحمر</button>
            <div className="w-full space-y-3">
              <div className="p-3 bg-black/50 border border-red-500/20 rounded-xl">
                <span className="text-gray-400 text-sm block mb-1">الرئيس (Spymaster)</span>
                {redSpymaster ? <span className="text-white font-bold">{room.players.find((p:any) => p.id === redSpymaster)?.name}</span> : <button onClick={() => socket.emit('cn_claim_spymaster', { code, team: 'red' })} className="text-red-400 font-bold text-sm bg-red-500/20 px-3 py-1 rounded-full">استلم المنصب</button>}
              </div>
              <div className="p-3 bg-black/50 border border-red-500/20 rounded-xl min-h-[100px]">
                <span className="text-gray-400 text-sm block mb-1">العملاء</span>
                {room.players.filter((p:any) => room.gameData.teams?.[p.id] === 'red' && p.id !== redSpymaster).map((p:any) => (
                  <div key={p.id} className="text-white font-bold">{p.name}</div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Blue Team */}
          <div className="flex-1 bg-blue-900/20 border border-blue-500/30 p-6 rounded-3xl flex flex-col items-center">
            <h2 className="text-2xl font-bold text-blue-500 mb-4">الفريق الأزرق</h2>
            <button onClick={() => socket.emit('cn_join_team', { code, team: 'blue' })} className="mb-6 px-6 py-2 rounded-full bg-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/40">انضم للأزرق</button>
            <div className="w-full space-y-3">
              <div className="p-3 bg-black/50 border border-blue-500/20 rounded-xl">
                <span className="text-gray-400 text-sm block mb-1">الرئيس (Spymaster)</span>
                {blueSpymaster ? <span className="text-white font-bold">{room.players.find((p:any) => p.id === blueSpymaster)?.name}</span> : <button onClick={() => socket.emit('cn_claim_spymaster', { code, team: 'blue' })} className="text-blue-400 font-bold text-sm bg-blue-500/20 px-3 py-1 rounded-full">استلم المنصب</button>}
              </div>
              <div className="p-3 bg-black/50 border border-blue-500/20 rounded-xl min-h-[100px]">
                <span className="text-gray-400 text-sm block mb-1">العملاء</span>
                {room.players.filter((p:any) => room.gameData.teams?.[p.id] === 'blue' && p.id !== blueSpymaster).map((p:any) => (
                  <div key={p.id} className="text-white font-bold">{p.name}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isHost && (
          <button onClick={() => socket.emit('host_start_codenames', { code })} className="btn-clean font-kufi bg-white text-black px-12 py-4 rounded-2xl text-xl font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            ابدأ اللعبة
          </button>
        )}
      </main>
    );
  }

  if (room.state === 'codenames_playing') {
    const gd = room.gameData;
    const isRedTurn = gd.turn === 'red';
    const myTeam = gd.teams?.[socket.id];
    const isMyTurn = myTeam === gd.turn;
    const isSpymaster = gd.spymasters?.red === socket.id || gd.spymasters?.blue === socket.id;
    const amIActiveSpymaster = isSpymaster && isMyTurn;
    const amIActiveOperative = !isSpymaster && isMyTurn;

    const [clueWord, setClueWord] = React.useState('');
    const [clueNum, setClueNum] = React.useState(1);

    const submitClue = () => {
      if (!clueWord) return;
      socket.emit('cn_give_clue', { code, clueWord, clueNum });
      setClueWord('');
    };

    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col p-4 items-center bg-black">
        {/* Status Bar */}
        <div className={\`w-full max-w-4xl p-4 rounded-2xl flex justify-between items-center mb-6 border \${isRedTurn ? 'bg-red-900/20 border-red-500/50' : 'bg-blue-900/20 border-blue-500/50'}\`}>
          <div className="text-red-400 font-bold text-2xl bg-black/50 px-4 py-2 rounded-xl">{gd.left.red}</div>
          <div className="text-center">
            <div className={\`text-2xl font-bold \${isRedTurn ? 'text-red-500' : 'text-blue-500'}\`}>دور الفريق {isRedTurn ? 'الأحمر' : 'الأزرق'}</div>
            {gd.clue ? (
              <div className="text-lg text-white mt-1">
                تلميحة: <span className="font-bold text-yellow-400">{gd.clue.word}</span> ({gd.clue.number}) - باقي {gd.clue.guessesLeft}
              </div>
            ) : (
              <div className="text-gray-400 text-sm mt-1">بانتظار الرئيس يعطي تلميحة...</div>
            )}
          </div>
          <div className="text-blue-400 font-bold text-2xl bg-black/50 px-4 py-2 rounded-xl">{gd.left.blue}</div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-5 gap-2 w-full max-w-4xl mb-8 flex-1">
          {gd.board.map((card: any, idx: number) => {
            const revealed = card.revealed;
            const seeColor = revealed || isSpymaster;
            
            let bg = 'bg-white/10 hover:bg-white/20 border-white/10';
            if (seeColor) {
              if (card.color === 'red') bg = 'bg-red-500 border-red-400';
              else if (card.color === 'blue') bg = 'bg-blue-500 border-blue-400';
              else if (card.color === 'black') bg = 'bg-gray-900 border-gray-700';
              else bg = 'bg-yellow-600/80 border-yellow-500';
            }

            return (
              <button 
                key={idx} 
                disabled={revealed || !amIActiveOperative || !gd.clue}
                onClick={() => socket.emit('cn_guess', { code, index: idx })}
                className={\`flex items-center justify-center p-2 rounded-xl border-2 transition-all \${bg} \${!revealed && amIActiveOperative && gd.clue ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-90'}\`}
                style={{ aspectRatio: '4/3' }}
              >
                <span className={\`font-bold \${seeColor && card.color==='neutral' ? 'text-white' : 'text-white'} \${revealed ? 'opacity-40 line-through' : ''}\`}>
                  {card.word}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="w-full max-w-4xl flex justify-center gap-4">
          {amIActiveSpymaster && !gd.clue && (
            <div className="flex gap-2 w-full max-w-lg bg-white/5 p-2 rounded-2xl">
              <input type="text" placeholder="كلمة التلميح" value={clueWord} onChange={e=>setClueWord(e.target.value)} className="flex-1 bg-black/50 text-white rounded-xl px-4 py-2 outline-none focus:border-white/50 border border-transparent" />
              <input type="number" min="1" max="9" value={clueNum} onChange={e=>setClueNum(parseInt(e.target.value))} className="w-20 bg-black/50 text-white rounded-xl px-4 py-2 text-center outline-none border border-transparent" />
              <button onClick={submitClue} className="bg-green-500 text-white font-bold px-6 py-2 rounded-xl">أرسل</button>
            </div>
          )}
          
          {amIActiveOperative && gd.clue && (
            <button onClick={() => socket.emit('cn_end_turn', { code })} className="bg-gray-500 text-white font-bold px-8 py-3 rounded-2xl hover:scale-105 transition-transform">
              إنهاء الدور
            </button>
          )}
        </div>
      </main>
    );
  }

  if (room.state === 'codenames_winner') {
    const winnerIsRed = room.gameData.winner === 'red';
    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col p-6 items-center justify-center text-center bg-black">
        <h1 className="winner-explosion font-kufi text-5xl md:text-7xl font-bold mb-6 text-white">انتهت اللعبة!</h1>
        <div className="winner-explosion text-4xl md:text-5xl font-black mb-12 p-12 rounded-3xl bg-white/10 border border-white/20">
          <span className={winnerIsRed ? "text-red-500" : "text-blue-500"}>
            فاز الفريق {winnerIsRed ? 'الأحمر' : 'الأزرق'}!
          </span>
        </div>
        {isHost && (
          <div className="flex flex-col md:flex-row gap-4">
            <button onClick={() => socket.emit('host_start_codenames_lobby', { code })} className="btn-clean font-kufi bg-green-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform">
              العب راوند جديد
            </button>
            <button onClick={() => socket.emit('host_back_to_lobby', { code })} className="btn-clean font-kufi bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl text-xl font-bold hover:bg-white/20 transition-colors">
              العودة للوبي
            </button>
          </div>
        )}
      </main>
    );
  }
`;

if (!data.includes('codenames_lobby')) {
  data = data.replace('if (room.state === \'mafia_roles\') {', cnViews + '\n  if (room.state === \'mafia_roles\') {');
}

fs.writeFileSync('src/components/game/multiplayer.tsx', data, 'utf8');
console.log('done');
