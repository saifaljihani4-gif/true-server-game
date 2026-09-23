const fs = require('fs');
let data = fs.readFileSync('src/components/game/multiplayer.tsx', 'utf8');

if (!data.includes('import { Categories }')) {
  data = data.replace('import { sfx } from \'@/game/sfx\';', 'import { sfx } from \'@/game/sfx\';\nimport { Categories } from \'@/game/data\';');
}

const guessState = `
  if (room.state === 'barra_spy_guess') {
    const isSpyMe = room.gameData.spyId === socket.id;
    const spy = room.players.find((p:any) => p.id === room.gameData.spyId);
    
    // Generate random options for the spy
    const catWords = Categories[room.gameData.category] || [];
    const allOptions = Array.from(new Set([room.gameData.word, ...catWords])).sort(() => Math.random() - 0.5).slice(0, 9);
    if (!allOptions.includes(room.gameData.word)) {
      allOptions[0] = room.gameData.word;
      allOptions.sort(() => Math.random() - 0.5);
    }

    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-black text-center">
        <h1 className="font-kufi text-4xl md:text-5xl font-bold mb-6 text-red-500 pop-in-bouncy">صادوك يا جاسوس!</h1>
        <div className="text-2xl text-gray-300 mb-8">الجاسوس هو: <span className="text-red-400 font-bold">{spy?.name}</span></div>
        
        {isSpyMe ? (
          <div className="w-full max-w-2xl fade-in-up">
            <h2 className="text-xl font-bold text-white mb-6">عندك فرصة أخيرة! خمن السالفة:</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allOptions.map(opt => (
                <button key={opt} onClick={() => socket.emit('spy_guess_word', { code, word: opt })} className="p-4 rounded-xl font-bold text-white bg-white/10 hover:bg-red-500 hover:scale-105 transition-all border border-white/5">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xl text-yellow-400 font-bold animate-pulse">الجاسوس قاعد يحاول يخمن السالفة...</div>
        )}
      </main>
    );
  }
`;

if (!data.includes('barra_spy_guess')) {
  data = data.replace('if (room.state === \'barra_results\') {', guessState + '\n  if (room.state === \'barra_results\') {');
}

// Enhance barra_results to show if spy won or town won
data = data.replace(
  '<h1 className="font-kufi text-3xl font-bold mb-6 text-gray-400">اللي كان برا السالفة هو:</h1>',
  '<h1 className="winner-explosion font-kufi text-4xl md:text-5xl font-bold mb-6 text-white">{room.gameData.spyWon ? <span className="text-red-500">الجاسوس فاز!</span> : <span className="text-green-400">الشعب فاز!</span>}</h1>\n          {room.gameData.spyGuessedWord && <div className="text-xl text-gray-300 mb-4">تخمين الجاسوس كان: <span className={room.gameData.spyWon ? "text-red-400" : "text-gray-500 line-through"}>{room.gameData.spyGuessedWord}</span></div>}\n          <h2 className="font-kufi text-2xl font-bold mb-4 text-gray-400">اللي كان برا السالفة هو:</h2>'
);

fs.writeFileSync('src/components/game/multiplayer.tsx', data, 'utf8');
console.log('done');
