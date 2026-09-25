import { useState } from 'react';
import { ChevronRight, Users, Bell, Check, X, RotateCcw, Crown, Sparkles } from 'lucide-react';

export function HoroofLobby({ room, socket, onBack, isHost }: { room: any; socket: any; onBack: () => void; isHost: boolean }) {
  const code = room.code;
  const myTeam = room.gameData?.teams?.[socket.id];
  const greenPlayers = room.players.filter((p: any) => room.gameData?.teams?.[p.id] === 'green');
  const orangePlayers = room.players.filter((p: any) => room.gameData?.teams?.[p.id] === 'orange');

  return (
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col p-3 sm:p-6 items-center bg-black">
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => { socket.emit('host_back_to_lobby', { code }); onBack(); }}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={14} /> خروج
        </button>
        <img src="/images/info.png" alt="True Server" className="h-8 sm:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
        <div className="text-xs sm:text-sm font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/20 text-white">
          كود: <span className="font-mono text-base font-black">{code}</span>
        </div>
      </div>

      <div className="text-center mb-6 pop-in-bouncy">
        <h1 className="font-kufi text-3xl sm:text-5xl font-bold text-white mb-2">تحدي الحروف</h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
          المسابقة التفاعلية الشهيرة: الأخضر يوصل أفقياً، والبرتقالي يوصل رأسياً، والهوست يدير الأسئلة والتحكيم.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full max-w-4xl mb-6 sm:mb-8 fade-in-up">
        {/* الفريق الأخضر */}
        <div className={`flex-1 rounded-3xl p-5 sm:p-6 border transition-all ${myTeam === 'green' ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)]' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-kufi font-bold text-emerald-400">الفريق الأخضر</h2>
              <span className="text-[11px] sm:text-xs text-gray-400">المسار: أفقي (يمين ↔ يسار)</span>
            </div>
            <button
              onClick={() => socket.emit('horoof_join_team', { code, team: 'green' })}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${myTeam === 'green' ? 'bg-emerald-500 text-black' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40'}`}
            >
              {myTeam === 'green' ? 'فريقك الحالي' : 'انضم للأخضر'}
            </button>
          </div>
          <div className="mt-4 bg-black/40 rounded-2xl p-3 min-h-[120px] max-h-[200px] overflow-y-auto space-y-2 border border-white/5">
            <div className="text-[11px] text-gray-500 font-bold mb-1">الأعضاء ({greenPlayers.length}):</div>
            {greenPlayers.map((p: any) => (
              <div key={p.id} className="text-xs sm:text-sm font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span>{p.name} {p.id === socket.id && '(أنت)'}</span>
                {p.id === room.hostId && <Crown size={12} className="text-yellow-400" />}
              </div>
            ))}
            {greenPlayers.length === 0 && <p className="text-xs text-gray-600 text-center py-4">لا يوجد لاعبين حتى الآن</p>}
          </div>
        </div>

        {/* الفريق البرتقالي */}
        <div className={`flex-1 rounded-3xl p-5 sm:p-6 border transition-all ${myTeam === 'orange' ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)]' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-kufi font-bold text-amber-400">الفريق البرتقالي</h2>
              <span className="text-[11px] sm:text-xs text-gray-400">المسار: رأسي (أعلى ↕ أسفل)</span>
            </div>
            <button
              onClick={() => socket.emit('horoof_join_team', { code, team: 'orange' })}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${myTeam === 'orange' ? 'bg-amber-500 text-black' : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40'}`}
            >
              {myTeam === 'orange' ? 'فريقك الحالي' : 'انضم للبرتقالي'}
            </button>
          </div>
          <div className="mt-4 bg-black/40 rounded-2xl p-3 min-h-[120px] max-h-[200px] overflow-y-auto space-y-2 border border-white/5">
            <div className="text-[11px] text-gray-500 font-bold mb-1">الأعضاء ({orangePlayers.length}):</div>
            {orangePlayers.map((p: any) => (
              <div key={p.id} className="text-xs sm:text-sm font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span>{p.name} {p.id === socket.id && '(أنت)'}</span>
                {p.id === room.hostId && <Crown size={12} className="text-yellow-400" />}
              </div>
            ))}
            {orangePlayers.length === 0 && <p className="text-xs text-gray-600 text-center py-4">لا يوجد لاعبين حتى الآن</p>}
          </div>
        </div>
      </div>

      {isHost ? (
        <button
          onClick={() => socket.emit('host_start_horoof', { code })}
          className="btn-clean font-kufi bg-gradient-to-b from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white border border-purple-400/40 px-10 py-4 rounded-2xl text-lg sm:text-xl font-bold shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:scale-105 transition-all"
        >
          بدء المسابقة
        </button>
      ) : (
        <div className="text-gray-400 font-bold text-sm bg-white/5 px-6 py-3 rounded-full border border-white/10 animate-pulse">
          بانتظار الهوست لبدء المسابقة...
        </div>
      )}
    </main>
  );
}

export function HoroofBoardView({ room, socket, onBack, isHost }: { room: any; socket: any; onBack: () => void; isHost: boolean }) {
  const code = room.code;
  const gd = room.gameData || {};
  const board = gd.board || [];
  const turn = gd.turn; // 'green' | 'orange'
  const activeCellId = gd.activeCell;
  const activeQuestion = gd.activeQuestion;
  const buzzedPlayer = gd.buzzedPlayer;
  const winningPathSet = new Set(gd.winningPath || []);
  const myTeam = gd.teams?.[socket.id];
  const round = gd.round || 1;
  const scores = gd.scores || { green: 0, orange: 0 };

  const handleCellClick = (cell: any) => {
    if (cell.owner) return;
    if (activeCellId) return;
    socket.emit('horoof_select_cell', { code, cellId: cell.id });
  };

  return (
    <main className="fade-screen relative flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between p-3 sm:p-5 bg-[#07080b]">
      {/* 1. TOP HEADER & SCOREBOARD */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 mb-3">
        <button
          onClick={() => { if (isHost) socket.emit('host_back_to_lobby', { code }); onBack(); }}
          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-gray-400 hover:text-white shrink-0"
        >
          <ChevronRight size={14} /> {isHost ? 'اللوبي' : 'خروج'}
        </button>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
            <span>الأخضر:</span>
            <span className="text-sm font-black text-white">{scores.green || 0}</span>
          </div>
          <div className="text-xs font-black text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-full">
            راوند {round}
          </div>
          <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
            <span>البرتقالي:</span>
            <span className="text-sm font-black text-white">{scores.orange || 0}</span>
          </div>
        </div>

        <div className={`hidden sm:flex text-xs font-bold px-3 py-1 rounded-full border ${turn === 'green' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
          دور: {turn === 'green' ? 'الفريق الأخضر' : 'الفريق البرتقالي'}
        </div>
      </div>

      {/* 2. THE HEXAGONAL 5x5 BOARD */}
      <div className="flex flex-col items-center justify-center w-full max-w-lg my-auto py-2">
        {/* Top goal indicator for Orange */}
        <div className="w-full flex items-center justify-center gap-2 mb-2">
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full opacity-60" />
          <span className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider px-2 bg-amber-950/50 rounded-md border border-amber-500/30">
            هدف البرتقالي (أعلى)
          </span>
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full opacity-60" />
        </div>

        {/* Board container with left/right green indicators */}
        <div className="relative flex items-center justify-center px-4 py-2 w-full">
          {/* Right green goal bar */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-400">
            <span className="writing-vertical rotate-180 bg-emerald-950/80 px-1 py-2 rounded-md border border-emerald-500/30 shadow-sm">
              أخضر
            </span>
          </div>

          {/* Grid rows */}
          <div className="flex flex-col gap-1.5 sm:gap-2 items-center">
            {[0, 1, 2, 3, 4].map((r) => {
              const rowCells = board.filter((c: any) => c.row === r).sort((a: any, b: any) => a.col - b.col);
              const isStaggered = r % 2 === 1;

              return (
                <div
                  key={r}
                  className={`flex gap-1.5 sm:gap-2.5 transition-transform ${isStaggered ? 'translate-x-3 sm:translate-x-5' : '-translate-x-3 sm:-translate-x-5'}`}
                >
                  {rowCells.map((cell: any) => {
                    const isWinning = winningPathSet.has(cell.id);
                    const isActive = activeCellId === cell.id;

                    let bgClass = 'bg-[#151722] border-white/20 text-white hover:border-purple-400 hover:bg-[#1f2233]';
                    if (cell.owner === 'green') {
                      bgClass = 'bg-gradient-to-br from-emerald-500 to-green-700 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
                    } else if (cell.owner === 'orange') {
                      bgClass = 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.5)]';
                    }

                    if (isActive) {
                      bgClass = 'bg-purple-600 text-white border-white ring-4 ring-purple-400/80 scale-110 z-10 animate-pulse';
                    }

                    if (isWinning) {
                      bgClass += ' ring-4 ring-yellow-300 scale-105 animate-bounce z-20';
                    }

                    return (
                      <button
                        key={cell.id}
                        onClick={() => handleCellClick(cell)}
                        disabled={!!cell.owner || (!!activeCellId && !isActive)}
                        className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center font-kufi font-black text-lg sm:text-2xl transition-all duration-200 select-none ${bgClass} active:scale-95 disabled:cursor-not-allowed`}
                      >
                        {cell.letter}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Left green goal bar */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-400">
            <span className="writing-vertical bg-emerald-950/80 px-1 py-2 rounded-md border border-emerald-500/30 shadow-sm">
              أخضر
            </span>
          </div>
        </div>

        {/* Bottom goal indicator for Orange */}
        <div className="w-full flex items-center justify-center gap-2 mt-2">
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full opacity-60" />
          <span className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider px-2 bg-amber-950/50 rounded-md border border-amber-500/30">
            هدف البرتقالي (أسفل)
          </span>
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full opacity-60" />
        </div>
      </div>

      {/* 3. ACTIVE QUESTION & HOST CONTROL PANEL */}
      <div className="w-full max-w-2xl bg-black/70 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-5 mt-2 backdrop-blur-md shadow-2xl">
        {activeQuestion ? (
          <div className="flex flex-col items-center text-center gap-2.5 fade-in-up">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold">
                حرف ({board.find((c: any) => c.id === activeCellId)?.letter})
              </span>
              <span className="text-xs text-gray-400">السؤال الحالي:</span>
            </div>

            <h3 className="text-base sm:text-xl font-kufi font-bold text-white px-2">
              {activeQuestion.q}
            </h3>

            {/* BUZZER STATUS OR BUTTON */}
            {buzzedPlayer ? (
              <div className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold winner-explosion ${buzzedPlayer.team === 'green' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-amber-950/80 border-amber-500 text-amber-300'}`}>
                الأسرع في الجرس: <span className="text-white font-black">{buzzedPlayer.name}</span> ({buzzedPlayer.team === 'green' ? 'الفريق الأخضر' : 'الفريق البرتقالي'})
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 my-1">
                {myTeam && (
                  <button
                    onClick={() => socket.emit('horoof_buzz', { code })}
                    className="btn-clean font-kufi bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 transition-all"
                  >
                    <Bell size={16} /> اضغط الجرس للإجابة!
                  </button>
                )}
                <span className="text-[11px] text-gray-500">من يضغط الجرس أولاً يحصل على حق الإجابة</span>
              </div>
            )}

            {/* HOST CONTROLS */}
            {isHost && (
              <div className="w-full mt-2 pt-3 border-t border-white/10 flex flex-col items-center gap-2.5">
                <div className="bg-purple-950/50 border border-purple-500/30 px-4 py-1.5 rounded-xl text-xs sm:text-sm">
                  <span className="text-gray-400">الإجابة الصحيحة: </span>
                  <span className="text-purple-300 font-bold font-mono">{activeQuestion.a}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  <button
                    onClick={() => socket.emit('host_horoof_judge', { code, outcome: 'green' })}
                    className="btn-clean px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <Check size={16} /> صح للأخضر
                  </button>
                  <button
                    onClick={() => socket.emit('host_horoof_judge', { code, outcome: 'orange' })}
                    className="btn-clean px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  >
                    <Check size={16} /> صح للبرتقالي
                  </button>
                  <button
                    onClick={() => socket.emit('host_horoof_judge', { code, outcome: 'skip' })}
                    className="btn-clean px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs flex items-center gap-1"
                  >
                    <X size={15} /> تخطي / خطأ
                  </button>
                  {buzzedPlayer && (
                    <button
                      onClick={() => socket.emit('host_horoof_clear_buzz', { code })}
                      className="btn-clean px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-yellow-300 font-bold text-xs flex items-center gap-1"
                    >
                      <RotateCcw size={14} /> إعادة فتح الجرس
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs sm:text-sm font-bold text-gray-400">
              {turn === 'green' ? 'دور الفريق الأخضر في اختيار الحرف من الشبكة' : 'دور الفريق البرتقالي في اختيار الحرف من الشبكة'}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {isHost ? 'اضغط أنت أو أي لاعب من الفريق صاحب الدور على أي حرف غير محجوز' : 'اضغط على الحرف اللي تبيه إذا كان دور فريقك'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export function HoroofWinnerView({ room, socket, isHost, onBack }: { room: any; socket: any; isHost: boolean; onBack: () => void }) {
  const code = room.code;
  const gd = room.gameData || {};
  const winner = gd.winner; // 'green' | 'orange'
  const winnerIsGreen = winner === 'green';
  const scores = gd.scores || { green: 0, orange: 0 };

  return (
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-center p-4 sm:p-6 bg-black text-center">
      <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mb-4 winner-explosion">
        <Sparkles size={32} className="text-yellow-400" />
      </div>

      <h1 className="winner-explosion font-kufi text-3xl sm:text-5xl md:text-6xl font-black mb-3 text-white">
        انتهى التحدي!
      </h1>

      <div className={`winner-explosion text-2xl sm:text-4xl font-black mb-6 p-6 sm:p-8 rounded-3xl border ${winnerIsGreen ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-amber-950/50 border-amber-500 text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.3)]'}`}>
        فاز الفريق {winnerIsGreen ? 'الأخضر بالتوصيل الأفقي!' : 'البرتقالي بالتوصيل الرأسي!'}
      </div>

      <div className="flex items-center gap-6 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl mb-8">
        <div className="text-center">
          <div className="text-xs text-gray-400">الأخضر</div>
          <div className="text-2xl font-black text-emerald-400">{scores.green || 0}</div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-center">
          <div className="text-xs text-gray-400">البرتقالي</div>
          <div className="text-2xl font-black text-amber-400">{scores.orange || 0}</div>
        </div>
      </div>

      {isHost ? (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <button
            onClick={() => socket.emit('host_horoof_new_round', { code })}
            className="btn-clean font-kufi bg-gradient-to-b from-purple-700 to-purple-900 text-white border border-purple-400/40 px-8 py-3.5 rounded-2xl text-base sm:text-lg font-bold shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:scale-105 transition-all"
          >
            راوند جديد (حروف جديدة)
          </button>
          <button
            onClick={() => socket.emit('host_back_to_lobby', { code })}
            className="btn-clean font-kufi bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-2xl text-base sm:text-lg font-bold hover:bg-white/20 transition-colors"
          >
            العودة للوبي
          </button>
        </div>
      ) : (
        <div className="text-gray-400 font-bold text-sm bg-white/5 px-6 py-3 rounded-full border border-white/10 animate-pulse">
          بانتظار الهوست لبدء راوند جديد أو العودة للوبي...
        </div>
      )}
    </main>
  );
}
