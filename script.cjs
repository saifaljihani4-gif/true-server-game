const fs = require('fs');
let data = fs.readFileSync('src/components/game/multiplayer.tsx', 'utf8');

data = data.replace(
  '{isHost && (\n            <button onClick={() => socket.emit(\'host_back_to_lobby\', { code })} className="btn-clean font-kufi bg-white text-black px-10 py-4 rounded-2xl text-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]">\n              العودة للوبي\n            </button>\n          )}',
  '{isHost && (\n            <div className="flex flex-col md:flex-row gap-4">\n              <button onClick={() => socket.emit(room.gameData?.mode === \'barra\' ? \'host_start_barra\' : \'host_start_mafia\', { code })} className="btn-clean font-kufi bg-red-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105 transition-transform">\n                العب راوند جديد\n              </button>\n              <button onClick={() => socket.emit(\'host_back_to_lobby\', { code })} className="btn-clean font-kufi bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl text-xl font-bold hover:bg-white/20 transition-colors">\n                العودة للوبي\n              </button>\n            </div>\n          )}'
);

data = data.replace(
  '{isHost && (\n            <button onClick={() => socket.emit(\'host_back_to_lobby\', { code })} className="btn-clean font-kufi bg-white text-black px-10 py-4 rounded-2xl text-xl font-bold mt-4 shadow-[0_0_20px_rgba(255,255,255,0.2)]">\n              العودة للوبي\n            </button>\n          )}',
  '{isHost && (\n            <div className="flex flex-col md:flex-row gap-4 mt-4">\n              <button onClick={() => socket.emit(\'host_start_barra\', { code })} className="btn-clean font-kufi bg-blue-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-transform">\n                العب راوند جديد\n              </button>\n              <button onClick={() => socket.emit(\'host_back_to_lobby\', { code })} className="btn-clean font-kufi bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl text-xl font-bold hover:bg-white/20 transition-colors">\n                العودة للوبي\n              </button>\n            </div>\n          )}'
);

fs.writeFileSync('src/components/game/multiplayer.tsx', data, 'utf8');
