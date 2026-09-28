import { useState, useEffect } from 'react';
import { ChevronRight, Users, Bell, Check, X, RotateCcw, Crown, Sparkles, LogOut, HelpCircle, ArrowRightLeft, ArrowUpDown, Info } from 'lucide-react';
import { sfx } from '@/game/sfx';

export function HoroofLobby({ room, socket, onBack, isHost }: { room: any; socket: any; onBack: () => void; isHost: boolean }) {
  const code = room.code;
  const myTeam = room.gameData?.teams?.[socket.id];
  const hostPlayer = room.players.find((p: any) => p.id === room.hostId);
  const greenPlayers = room.players.filter((p: any) => room.gameData?.teams?.[p.id] === 'green' && p.id !== room.hostId);
  const bluePlayers = room.players.filter((p: any) => (room.gameData?.teams?.[p.id] === 'blue' || room.gameData?.teams?.[p.id] === 'orange') && p.id !== room.hostId);

  const [showRules, setShowRules] = useState(false);

  return (
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col pt-14 sm:pt-6 px-3 sm:px-6 pb-8 items-center">
      {/* Top Header with lowered Room Code */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-5 gap-3">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <button
            onClick={() => { socket.emit('host_back_to_lobby', { code }); onBack(); }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} /> خروج
          </button>
          <img src="/images/info.png" alt="True Server" className="h-7 sm:h-9 w-auto object-contain drop-shadow-md" />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-white/10 px-5 py-2 rounded-2xl border border-white/20 text-white shadow-lg">
          <span className="text-gray-400">كود الروم:</span>
          <span className="font-mono text-xl sm:text-2xl font-black text-amber-400">{code}</span>
        </div>
      </div>

      <div className="text-center mb-3 pop-in-bouncy">
        <h1 className="font-kufi text-2xl sm:text-4xl font-bold text-white mb-1.5">تحدي الحروف</h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
          المسابقة التفاعلية: الأخضر يوصل أفقياً، والأزرق يوصل رأسياً، والهوست هو الحكم والمقدم.
        </p>
      </div>

      {/* Presenter / Host Role Badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs sm:text-sm font-bold mb-4 shadow-lg">
        <Crown size={16} className="text-yellow-400 shrink-0" />
        <span>مقدم المسابقة والحكم:</span>
        <span className="text-white font-black">{hostPlayer?.name || 'الهوست'}</span>
        {isHost ? (
          <span className="bg-purple-500/30 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
            (أنت - تدير الأسئلة والتحكيم)
          </span>
        ) : (
          <span className="text-gray-400 text-[10px]">(الهوست لا يشارك كلاعب)</span>
        )}
      </div>

      {/* Two Teams Cards */}
      <div className="flex flex-col md:flex-row gap-3 sm:gap-5 w-full max-w-4xl mb-5 sm:mb-6 fade-in-up">
        {/* الفريق الأخضر */}
        <div className={`flex-1 rounded-2xl p-4 sm:p-5 border transition-all ${myTeam === 'green' ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)]' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-kufi font-bold text-emerald-400">الفريق الأخضر</h2>
              <span className="text-[10px] sm:text-xs text-gray-400">المسار: أفقي (يمين ↔ يسار)</span>
            </div>
            {!isHost ? (
              myTeam === 'green' ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-black">فريقك</span>
                  <button
                    onClick={() => socket.emit('horoof_leave_team', { code })}
                    className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30 transition-colors flex items-center gap-1"
                  >
                    <LogOut size={12} /> خروج
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => socket.emit('horoof_join_team', { code, team: 'green' })}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30 transition-all"
                >
                  انضم للأخضر
                </button>
              )
            ) : (
              <span className="text-[11px] font-bold text-gray-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                فريق المتسابقين
              </span>
            )}
          </div>
          <div className="mt-3 bg-black/40 rounded-xl p-3 min-h-[100px] max-h-[160px] overflow-y-auto space-y-1.5 border border-white/5">
            <div className="text-[11px] text-gray-500 font-bold mb-1">الأعضاء ({greenPlayers.length}):</div>
            {greenPlayers.map((p: any) => (
              <div key={p.id} className="text-xs sm:text-sm font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span>{p.name} {p.id === socket.id && '(أنت)'}</span>
              </div>
            ))}
            {greenPlayers.length === 0 && <p className="text-xs text-gray-600 text-center py-4">بانتظار متسابقين...</p>}
          </div>
        </div>

        {/* الفريق الأزرق */}
        <div className={`flex-1 rounded-2xl p-4 sm:p-5 border transition-all ${myTeam === 'blue' || myTeam === 'orange' ? 'bg-sky-950/40 border-sky-500 shadow-[0_0_25px_rgba(14,165,233,0.25)]' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-kufi font-bold text-sky-400">الفريق الأزرق</h2>
              <span className="text-[10px] sm:text-xs text-gray-400">المسار: رأسي (أعلى ↕ أسفل)</span>
            </div>
            {!isHost ? (
              myTeam === 'blue' || myTeam === 'orange' ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-sky-500 text-white">فريقك</span>
                  <button
                    onClick={() => socket.emit('horoof_leave_team', { code })}
                    className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30 transition-colors flex items-center gap-1"
                  >
                    <LogOut size={12} /> خروج
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => socket.emit('horoof_join_team', { code, team: 'blue' })}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 hover:bg-sky-500/40 border border-sky-500/30 transition-all"
                >
                  انضم للأزرق
                </button>
              )
            ) : (
              <span className="text-[11px] font-bold text-gray-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                فريق المتسابقين
              </span>
            )}
          </div>
          <div className="mt-3 bg-black/40 rounded-xl p-3 min-h-[100px] max-h-[160px] overflow-y-auto space-y-1.5 border border-white/5">
            <div className="text-[11px] text-gray-500 font-bold mb-1">الأعضاء ({bluePlayers.length}):</div>
            {bluePlayers.map((p: any) => (
              <div key={p.id} className="text-xs sm:text-sm font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span>{p.name} {p.id === socket.id && '(أنت)'}</span>
              </div>
            ))}
            {bluePlayers.length === 0 && <p className="text-xs text-gray-600 text-center py-4">بانتظار متسابقين...</p>}
          </div>
        </div>
      </div>

      {/* Rules & Explanation Card */}
      <div className="w-full max-w-4xl glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 mb-5 text-start">
        <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-sm sm:text-base border-b border-white/10 pb-2">
          <Info size={18} />
          <span>طريقة الحل وقواعد الفوز لكل فريق:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
            <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
              <ArrowRightLeft size={16} />
              <span>طريقة فوز الفريق الأخضر (أفقي):</span>
            </div>
            <p className="text-gray-300 leading-relaxed text-[11px] sm:text-xs">
              هدفكم ربط الشبكة من أقصى اليمين إلى أقصى اليسار. جاوبوا على الحروف المتجاورة لتشكيل جسر أخضر متصل من الطرف الأيمن للطرف الأيسر!
            </p>
          </div>

          <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20">
            <div className="flex items-center gap-2 font-bold text-sky-400 mb-1">
              <ArrowUpDown size={16} />
              <span>طريقة فوز الفريق الأزرق (رأسي):</span>
            </div>
            <p className="text-gray-300 leading-relaxed text-[11px] sm:text-xs">
              هدفكم ربط الشبكة من أعلى نقطة إلى أسفل نقطة. جاوبوا على الحروف المتجاورة لتشكيل جسر أزرق متصل من الشريط العلوي إلى الشريط السفلي!
            </p>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-gray-400 gap-2">
          <span>نظام الإجابة: من يضغط الجرس أولاً يحق له الإجابة صوتياً.</span>
          <span>التلميح: يتوفر تلميح ذكي لعدد الحروف عند الحاجة.</span>
          <span>التكتيك: اقطعوا الحروف التي يحتاجها الفريق الآخر لمنعه من إكمال خطه!</span>
        </div>
      </div>

      {isHost ? (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => socket.emit('host_start_horoof', { code })}
            disabled={greenPlayers.length === 0 || bluePlayers.length === 0}
            className="btn-clean font-kufi bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white border border-purple-400/40 px-8 sm:px-10 py-3 sm:py-3.5 rounded-2xl text-base sm:text-lg font-bold shadow-[0_0_25px_rgba(168,85,247,0.4)] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-all"
          >
            بدء المسابقة
          </button>
          {(greenPlayers.length === 0 || bluePlayers.length === 0) && (
            <p className="text-xs text-amber-400 font-bold">
              تحتاج لاعب واحد على الأقل في كل فريق للبدء
            </p>
          )}
        </div>
      ) : (
        <div className="text-gray-400 font-bold text-xs sm:text-sm bg-white/5 px-6 py-2.5 rounded-full border border-white/10 animate-pulse">
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
  const turn = gd.turn; // 'green' | 'blue' | 'orange'
  const isBlueTurn = turn === 'blue' || turn === 'orange';
  const activeCellId = gd.activeCell;
  const activeQuestion = gd.activeQuestion;
  const buzzedPlayer = gd.buzzedPlayer;
  const winningPathSet = new Set(gd.winningPath || []);
  const myTeam = isHost ? null : gd.teams?.[socket.id];
  const round = gd.round || 1;
  const scores = gd.scores || { green: 0, blue: 0, orange: 0 };
  const blueScore = scores.blue ?? scores.orange ?? 0;
  const showHint = gd.showHint;

  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const handleCellClick = (cell: any) => {
    if (cell.owner) return;
    if (activeCellId) return;
    const isMyTurn = (myTeam === 'green' && turn === 'green') || ((myTeam === 'blue' || myTeam === 'orange') && isBlueTurn);
    if (!isHost && !isMyTurn) return;
    sfx.select();
    socket.emit('horoof_select_cell', { code, cellId: cell.id });
  };

  return (
    <main className="fade-screen relative flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between pt-14 sm:pt-6 px-2 sm:px-5 pb-6">
      {/* 1. TOP HEADER & SCOREBOARD */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (isHost) socket.emit('host_back_to_lobby', { code }); onBack(); }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white shrink-0 transition-colors"
          >
            <ChevronRight size={14} /> {isHost ? 'اللوبي' : 'خروج'}
          </button>

          <button
            onClick={() => setRulesModalOpen(true)}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:text-white transition-colors"
            title="طريقة الحل والشرح"
          >
            <HelpCircle size={14} />
            <span className="hidden sm:inline">شرح اللعبة</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/50 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>الأخضر:</span>
            <span className="text-sm sm:text-base font-black text-white">{scores.green || 0}</span>
          </div>

          <div className="text-xs font-black text-purple-300 bg-purple-950/70 border border-purple-500/40 px-3 py-1 rounded-full">
            جولة {round}
          </div>

          <div className="flex items-center gap-1.5 bg-sky-950/80 border border-sky-500/50 px-3.5 py-1.5 rounded-full text-xs font-bold text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>الأزرق:</span>
            <span className="text-sm sm:text-base font-black text-white">{blueScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isHost && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 hidden sm:inline-block">
              الحكم والمقدم
            </span>
          )}
          <div className={`text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full border ${turn === 'green' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 border-sky-500/40'}`}>
            الدور: {turn === 'green' ? 'الأخضر' : 'الأزرق'}
          </div>
        </div>
      </div>

      {/* 2. THE HEXAGONAL ARENA BOARD */}
      <div className="flex flex-col items-center justify-center w-full max-w-xl my-auto py-2">
        {/* Top Goal Bar (Blue Start / Top) */}
        <div className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-gradient-to-r from-sky-950/40 via-blue-900/60 to-sky-950/40 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)] mb-2.5">
          <span className="text-sky-300 font-bold text-[11px] sm:text-xs tracking-wider">
            ▼ مسار الفريق الأزرق (من الأعلى إلى الأسفل) ▼
          </span>
        </div>

        {/* Board Arena with Green Side Rails */}
        <div className="relative flex items-center justify-center w-full px-1 sm:px-2">
          {/* Right Green Rail (Start for RTL) */}
          <div className="flex flex-col items-center justify-center h-full px-1.5 sm:px-2 py-4 rounded-xl bg-gradient-to-b from-emerald-950/60 via-green-900/50 to-emerald-950/60 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 self-stretch my-1 select-none">
            <span className="text-emerald-300 font-black text-[11px] sm:text-xs writing-vertical tracking-widest">
              ◀ بداية الأخضر
            </span>
          </div>

          {/* Hexagon Letter Grid */}
          <div className="flex flex-col gap-1.5 sm:gap-2.5 items-center mx-2 sm:mx-3 flex-1">
            {[0, 1, 2, 3, 4].map((r) => {
              const rowCells = board.filter((c: any) => c.row === r).sort((a: any, b: any) => a.col - b.col);
              const isStaggered = r % 2 === 1;

              return (
                <div
                  key={r}
                  className={`flex gap-1.5 sm:gap-2.5 transition-transform ${isStaggered ? 'translate-x-2 sm:translate-x-3' : '-translate-x-2 sm:-translate-x-3'}`}
                >
                  {rowCells.map((cell: any) => {
                    const isWinning = winningPathSet.has(cell.id);
                    const isActive = activeCellId === cell.id;

                    let bgClass = 'bg-[#121524] border-white/20 text-gray-100 hover:border-sky-400 hover:bg-[#1a1f33] shadow-md';
                    if (cell.owner === 'green') {
                      bgClass = 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 text-black border-2 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.7)] font-black scale-[1.02]';
                    } else if (cell.owner === 'blue' || cell.owner === 'orange') {
                      bgClass = 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white border-2 border-cyan-200 shadow-[0_0_20px_rgba(14,165,233,0.7)] font-black scale-[1.02]';
                    }

                    if (isActive) {
                      bgClass = 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-white ring-4 ring-yellow-400 scale-110 z-20 animate-pulse';
                    }

                    if (isWinning) {
                      bgClass += ' ring-4 ring-amber-300 scale-105 animate-bounce z-30';
                    }

                    const isMyTurn = (myTeam === 'green' && turn === 'green') || ((myTeam === 'blue' || myTeam === 'orange') && isBlueTurn);
                    const canClick = !cell.owner && !activeCellId && (isHost || isMyTurn);

                    return (
                      <button
                        key={cell.id}
                        onClick={() => handleCellClick(cell)}
                        disabled={!canClick && !isActive}
                        className={`w-10 h-10 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-xl sm:rounded-2xl border flex items-center justify-center font-kufi font-black text-base sm:text-xl md:text-2xl transition-all duration-200 select-none ${bgClass} active:scale-95 disabled:cursor-not-allowed`}
                      >
                        {cell.letter}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Left Green Rail (Finish for RTL) */}
          <div className="flex flex-col items-center justify-center h-full px-1.5 sm:px-2 py-4 rounded-xl bg-gradient-to-b from-emerald-950/60 via-green-900/50 to-emerald-950/60 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 self-stretch my-1 select-none">
            <span className="text-emerald-300 font-black text-[11px] sm:text-xs writing-vertical tracking-widest">
              هدف الأخضر ◀
            </span>
          </div>
        </div>

        {/* Bottom Goal Bar (Blue Finish / Bottom) */}
        <div className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-gradient-to-r from-sky-950/40 via-blue-900/60 to-sky-950/40 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)] mt-2.5">
          <span className="text-sky-300 font-bold text-[11px] sm:text-xs tracking-wider">
            ▲ خط النهاية للأزرق (الوصول للأسفل) ▲
          </span>
        </div>
      </div>

      {/* 3. ACTIVE QUESTION & HOST CONTROL PANEL */}
      <div className="w-full max-w-2xl bg-black/60 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-5 mt-2 backdrop-blur-md shadow-2xl">
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

            {/* Hint Box (تلميح للحل) */}
            {activeQuestion.hint && (showHint || isHost) && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold shadow-md fade-in-up">
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <span>تلميح للحل:</span>
                <span className="text-white font-medium">{activeQuestion.hint}</span>
              </div>
            )}

            {/* Buzzer Status or Button */}
            {buzzedPlayer ? (
              <div className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold winner-explosion ${buzzedPlayer.team === 'green' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-sky-950/80 border-sky-500 text-sky-300'}`}>
                الأسرع في الجرس: <span className="text-white font-black">{buzzedPlayer.name}</span> ({buzzedPlayer.team === 'green' ? 'الفريق الأخضر' : 'الفريق الأزرق'})
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 my-1">
                {myTeam && !isHost && (
                  <button
                    onClick={() => {
                      sfx.buzz();
                      socket.emit('horoof_buzz', { code });
                    }}
                    className="btn-clean font-kufi bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 transition-all"
                  >
                    <Bell size={16} /> اضغط الجرس للإجابة!
                  </button>
                )}
                {isHost && (
                  <div className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25 px-4 py-1.5 rounded-xl">
                    بانتظار المتسابقين للضغط على الجرس...
                  </div>
                )}
                <span className="text-[11px] text-gray-500">من يضغط الجرس أولاً يحصل على حق الإجابة</span>
              </div>
            )}

            {/* Host Controls */}
            {isHost && (
              <div className="w-full mt-2 pt-3 border-t border-white/10 flex flex-col items-center gap-2.5">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="bg-purple-950/50 border border-purple-500/30 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm">
                    <span className="text-gray-400">الإجابة الصحيحة: </span>
                    <span className="text-purple-300 font-bold font-mono">{activeQuestion.a}</span>
                  </div>

                  <button
                    onClick={() => socket.emit('host_horoof_toggle_hint', { code })}
                    className="btn-clean px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles size={13} />
                    <span>{showHint ? 'إخفاء التلميح عن المتسابقين' : 'كشف التلميح للمتسابقين'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  <button
                    onClick={() => socket.emit('host_horoof_judge', { code, outcome: 'green' })}
                    className="btn-clean px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <Check size={16} /> صح للأخضر
                  </button>
                  <button
                    onClick={() => socket.emit('host_horoof_judge', { code, outcome: 'blue' })}
                    className="btn-clean px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                  >
                    <Check size={16} /> صح للأزرق
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
            <p className="text-xs sm:text-sm font-bold text-gray-300">
              {turn === 'green' ? 'دور الفريق الأخضر في اختيار الحرف من الشبكة' : 'دور الفريق الأزرق في اختيار الحرف من الشبكة'}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {isHost ? 'المتسابق في الفريق يختار الحرف، أو اضغط أنت عليه كـ حكم لتفعيله' : ((myTeam === 'green' && turn === 'green') || ((myTeam === 'blue' || myTeam === 'orange') && isBlueTurn) ? 'دور فريقك! اضغط على الحرف الذي تريده في الشبكة' : 'بانتظار الفريق صاحب الدور لاختيار الحرف')}
            </p>
          </div>
        )}
      </div>

      {/* Rules Modal */}
      {rulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-screen">
          <div className="w-full max-w-lg glass-panel p-5 sm:p-6 rounded-3xl border border-white/20 text-start shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-amber-400 font-kufi font-bold text-lg">
                <Info size={20} />
                <h2>دليل وقواعد لعبة حروف:</h2>
              </div>
              <button
                onClick={() => setRulesModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1.5 text-sm">
                  <ArrowRightLeft size={16} />
                  <span>طريقة فوز الفريق الأخضر (المسار الأفقي):</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-xs">
                  يبدأ الفريق الأخضر من الطرف الأيمن ويتحرك نحو الطرف الأيسر. هدفكم الإجابة على الحروف المتجاورة لتشكيل خط أو جسر متصل بالكامل من اليمين إلى اليسار ↔.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30">
                <div className="flex items-center gap-2 font-bold text-sky-400 mb-1.5 text-sm">
                  <ArrowUpDown size={16} />
                  <span>طريقة فوز الفريق الأزرق (المسار الرأسي):</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-xs">
                  يبدأ الفريق الأزرق من الشريط العلوي ويتحرك نحو الشريط السفلي. هدفكم الإجابة على الحروف المتجاورة لتشكيل خط أو جسر متصل بالكامل من الأعلى إلى الأسفل ↕.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 space-y-1.5">
                <div className="font-bold text-white mb-1">خطوات الجولة والتنافس:</div>
                <p>1. الفريق صاحب الدور يختار الحرف المطلوب لفتحه.</p>
                <p>2. يظهر السؤال والتلميح، وأسرع متسابق يضغط الجرس يحصل على حق الإجابة شفهياً.</p>
                <p>3. إذا أجاب صح يلوّن الحكم الحرف بلون فريقه! وإذا أخطأ يُعاد فتح الجرس.</p>
                <p>4. بإمكانك اختيار حروف لقطع الطريق على الفريق الآخر ومنعه من إكمال خطه!</p>
              </div>
            </div>

            <button
              onClick={() => setRulesModalOpen(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-white text-black font-kufi font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              فهمت، متابعة اللعبة
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export function HoroofWinnerView({ room, socket, isHost, onBack }: { room: any; socket: any; isHost: boolean; onBack: () => void }) {
  const code = room.code;
  const gd = room.gameData || {};
  const winner = gd.winner; // 'green' | 'blue' | 'orange'
  const winnerIsGreen = winner === 'green';
  const scores = gd.scores || { green: 0, blue: 0, orange: 0 };
  const blueScore = scores.blue ?? scores.orange ?? 0;

  useEffect(() => {
    sfx.win();
  }, []);

  return (
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mb-4 winner-explosion">
        <Sparkles size={32} className="text-yellow-400" />
      </div>

      <h1 className="winner-explosion font-kufi text-3xl sm:text-5xl md:text-6xl font-black mb-3 text-white">
        انتهى التحدي!
      </h1>

      <div className={`winner-explosion text-2xl sm:text-4xl font-black mb-6 p-6 sm:p-8 rounded-3xl border ${winnerIsGreen ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-sky-950/50 border-sky-500 text-sky-400 shadow-[0_0_40px_rgba(14,165,233,0.3)]'}`}>
        فاز الفريق {winnerIsGreen ? 'الأخضر بالتوصيل الأفقي (يمين ↔ يسار)!' : 'الأزرق بالتوصيل الرأسي (أعلى ↕ أسفل)!'}
      </div>

      <div className="flex items-center gap-6 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl mb-8">
        <div className="text-center">
          <div className="text-xs text-gray-400">الأخضر</div>
          <div className="text-2xl font-black text-emerald-400">{scores.green || 0}</div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-center">
          <div className="text-xs text-gray-400">الأزرق</div>
          <div className="text-2xl font-black text-sky-400">{blueScore}</div>
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
