import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Crown, Play, Square, RotateCcw, Plus, Minus, Shuffle, Trophy, Users, Edit3, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { sfx } from '@/game/sfx';

// -------------------------------------------------------------
// 1. ADED LOBBY VIEW (تجهيز ودخول المتسابقين قبل بدء الدور)
// -------------------------------------------------------------
export function AdedLobbyView({ room, socket, onBack, isHost }: { room: any; socket: any; onBack: () => void; isHost: boolean }) {
  const code = room.code;
  const gd = room.gameData || {};
  const contestants = gd.contestants || room.players.map((p: any) => p.id);
  const isMeContestant = contestants.includes(socket.id);

  const contestantPlayers = contestants
    .map((id: string) => room.players.find((p: any) => p.id === id))
    .filter(Boolean);

  return (
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between p-4 sm:p-8 bg-[#07080b]">
      {/* Top Header */}
      <div className="w-full max-w-3xl flex items-center justify-between">
        <button
          onClick={() => { socket.emit('host_back_to_lobby', { code }); onBack(); }}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={16} /> خروج للوبي الرئيسي
        </button>
        <img src="/images/info.png" alt="True Server" className="h-9 sm:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
        <div className="text-xs sm:text-sm font-mono font-bold bg-white/10 px-4 py-2 rounded-full border border-white/15 text-white">
          كود: <span className="font-black text-amber-400 text-sm sm:text-base">{code}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl flex flex-col items-center text-center my-auto py-4 pop-in-bouncy">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4">
          <Trophy size={16} /> تحدي الـ 30 ثانية
        </div>

        <h1 className="font-kufi text-4xl sm:text-6xl font-black text-white mb-3">
          لعبة عدّد
        </h1>
        <p className="text-sm sm:text-lg text-gray-300 max-w-lg mx-auto mb-6 sm:mb-8 font-medium">
          ادخلوا كلكم بالروم، والمسابقة بتمشي بالدور عليكم واحد ورا الثاني!
        </p>

        {/* Contestants List Box */}
        <div className="w-full glass-panel p-5 sm:p-8 rounded-3xl border border-white/15 shadow-2xl mb-6 text-start">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-amber-400" />
              <h2 className="font-kufi text-lg sm:text-2xl font-bold text-white">
                ترتيب المتسابقين بالدور ({contestantPlayers.length})
              </h2>
            </div>

            <button
              onClick={() => socket.emit('aded_toggle_contestant', { code })}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${isMeContestant ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              {isMeContestant ? 'أنا متسابق (مشارك)' : 'أنا مشاهد (تخطي)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
            {contestantPlayers.map((p: any, idx: number) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 text-sm sm:text-base font-bold text-white"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center font-black">
                    {idx + 1}
                  </span>
                  <span className="truncate">{p.name} {p.id === socket.id && '(أنت)'}</span>
                </div>
                {p.id === room.hostId && <Crown size={15} className="text-yellow-400 shrink-0" />}
              </div>
            ))}
            {contestantPlayers.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6 col-span-2">بانتظار انضمام المتسابقين...</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            onClick={() => socket.emit('host_aded_start_game', { code })}
            disabled={contestantPlayers.length === 0}
            className="btn-clean font-kufi bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black px-10 sm:px-14 py-4 sm:py-5 rounded-3xl text-xl sm:text-2xl font-black shadow-[0_10px_35px_rgba(245,158,11,0.4)] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
          >
            بدء المسابقة بالدور
          </button>
        ) : (
          <div className="bg-white/5 border border-white/10 text-gray-300 px-8 py-3.5 rounded-2xl text-sm sm:text-base font-bold animate-pulse">
            بانتظار الهوست لبدء المسابقة بعد اكتمال المتسابقين...
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 font-bold">
        بإمكان أي شخص الانضمام أو التفرج قبل بدء التحدي
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 2. ADED GAME VIEW (واجهة اللعب المكبرة مع الترتيب والعداد الضخم)
// -------------------------------------------------------------
export function AdedGameView({ room, socket, onBack, isHost }: { room: any; socket: any; onBack: () => void; isHost: boolean }) {
  const code = room.code;
  const gd = room.gameData || {};
  const topic = gd.topic || 'كم تقدر تعدّد في 30 ثانية؟';
  const count = gd.count || 0;
  const activePlayerId = gd.activePlayerId;
  const isRunning = gd.isRunning || false;
  const timerStartedAt = gd.timerStartedAt;
  const contestants = gd.contestants || room.players.map((p: any) => p.id);
  const currentTurnIdx = gd.currentTurnIdx || 0;
  const scores = gd.scores || {};

  const activePlayer = room.players.find((p: any) => p.id === activePlayerId) || room.players[0];
  const isMeActive = activePlayer?.id === socket.id;

  // Next player in turn
  const nextPlayerId = contestants[currentTurnIdx + 1];
  const nextPlayer = nextPlayerId ? room.players.find((p: any) => p.id === nextPlayerId) : null;

  // Local synchronized timer
  const [timeLeft, setTimeLeft] = useState(30);
  const lastTickRef = useRef(30);

  useEffect(() => {
    if (!isRunning || !timerStartedAt) {
      setTimeLeft(30);
      lastTickRef.current = 30;
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setTimeLeft(remaining);

      // Play tick sound on last 5 seconds
      if (remaining <= 5 && remaining > 0 && remaining !== lastTickRef.current) {
        lastTickRef.current = remaining;
        sfx.tick();
      }

      // Play buzzer when time expires
      if (remaining === 0 && lastTickRef.current !== 0) {
        lastTickRef.current = 0;
        sfx.buzz();
        if (isHost) {
          socket.emit('host_aded_stop_timer', { code });
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, timerStartedAt, isHost, code, socket]);

  // Bump animation on count change
  const [bumping, setBumping] = useState(false);
  useEffect(() => {
    setBumping(true);
    const t = setTimeout(() => setBumping(false), 200);
    return () => clearTimeout(t);
  }, [count]);

  // Custom topic input state
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');

  const handleCustomTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim()) return;
    socket.emit('host_aded_set_custom_topic', { code, customTopic: customTopicInput.trim() });
    setCustomTopicInput('');
    setShowCustomTopic(false);
  };

  return (
    <main className="fade-screen relative flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between p-3 sm:p-6 bg-[#06070a]">
      {/* 1. TOP HEADER & QUEUE STATUS */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 mb-2 sm:mb-4">
        <button
          onClick={() => { if (isHost) socket.emit('host_back_to_lobby', { code }); onBack(); }}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-400 hover:text-white shrink-0 transition-colors"
        >
          <ChevronRight size={15} /> {isHost ? 'العودة للوبي' : 'خروج'}
        </button>

        {/* Turn Progress Badge */}
        <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold text-white">
          <span className="text-amber-400 font-mono font-black text-sm sm:text-base">{currentTurnIdx + 1} / {contestants.length}</span>
          <span className="text-gray-400">| الدور على:</span>
          <span className="text-amber-300 font-black text-sm sm:text-base">{activePlayer?.name || 'مجهول'}</span>
        </div>

        <div className="text-xs font-mono font-bold bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 text-white shrink-0">
          كود: <span className="font-black text-amber-400">{code}</span>
        </div>
      </div>

      {/* 2. THE BIG PROMPT CARD & MASSIVE COUNTER */}
      <div className="w-full max-w-3xl flex flex-col items-center gap-4 sm:gap-6 my-auto py-2">
        {/* Active Challenger Big Banner */}
        <div className={`w-full max-w-md py-2.5 px-6 rounded-2xl border text-center font-bold text-sm sm:text-lg transition-all ${isMeActive ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-pulse' : 'bg-white/5 border-white/10 text-gray-300'}`}>
          المتحدي الحالي: <span className="text-white font-black text-base sm:text-xl">{activePlayer?.name}</span> {isMeActive && '(دورك الآن!)'}
          {nextPlayer && <div className="text-xs text-gray-400 font-normal mt-0.5">التالي بعده: {nextPlayer.name}</div>}
        </div>

        {/* Topic Card - Very Big & Clear */}
        <div className="w-full glass-panel p-6 sm:p-10 md:p-12 rounded-3xl sm:rounded-[2.5rem] border-2 border-purple-500/40 text-center relative overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          
          <span className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-widest block mb-2 sm:mb-3">
            التحدي المطلوب
          </span>

          <h2 className="font-kufi text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight sm:leading-snug drop-shadow-lg">
            {topic}
          </h2>

          {isHost && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5 sm:mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => socket.emit('host_aded_next_topic', { code })}
                className="btn-clean flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold text-gray-200"
              >
                <Shuffle size={14} /> موضوع عشوائي
              </button>
              <button
                onClick={() => setShowCustomTopic(!showCustomTopic)}
                className="btn-clean flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold text-amber-300"
              >
                <Edit3 size={14} /> كتابة موضوع
              </button>
            </div>
          )}

          {showCustomTopic && isHost && (
            <form onSubmit={handleCustomTopicSubmit} className="mt-4 flex gap-2 w-full fade-in-up">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                placeholder="اكتب التحدي (مثال: كم تقدر تعدّد شخصية كرتونية في 30 ثانية؟)"
                className="flex-1 bg-black/70 border border-white/25 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
              />
              <button type="submit" className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-2xl text-xs sm:text-sm">
                تأكيد
              </button>
            </form>
          )}
        </div>

        {/* TIMER AND HUGE LIVE COUNTER */}
        <div className="w-full flex items-center justify-center gap-6 sm:gap-14 my-2">
          {/* Big 30s Timer */}
          <div className="flex flex-col items-center">
            <div className={`w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full border-4 sm:border-[6px] flex flex-col items-center justify-center transition-all ${timeLeft <= 5 ? 'border-red-500 bg-red-950/50 text-red-400 animate-pulse shadow-[0_0_35px_rgba(239,68,68,0.6)]' : 'border-amber-500/50 bg-black/60 text-white'}`}>
              <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-black">{timeLeft}</span>
              <span className="text-xs sm:text-sm uppercase tracking-wider text-gray-400 font-bold">ثانية</span>
            </div>
          </div>

          {/* Enormous Live Counter */}
          <div className="flex flex-col items-center">
            <div className={`px-10 sm:px-14 md:px-20 py-4 sm:py-6 rounded-[2.5rem] bg-gradient-to-b from-purple-950/90 via-[#18112e] to-black border-2 border-purple-400/50 shadow-[0_0_50px_rgba(168,85,247,0.45)] flex flex-col items-center justify-center transition-transform duration-150 ${bumping ? 'scale-110 border-amber-400' : 'scale-100'}`}>
              <span className="font-mono text-6xl sm:text-8xl md:text-9xl font-black text-white drop-shadow-[0_0_25px_rgba(168,85,247,0.9)]">
                {count}
              </span>
              <span className="text-xs sm:text-base font-black text-amber-300 mt-1 uppercase tracking-wider">
                العدد الحالي
              </span>
            </div>
          </div>
        </div>

        {/* 3. HOST CONTROLS: THE HUGE "عِدّ" BUTTON */}
        {isHost ? (
          <div className="w-full flex flex-col items-center gap-3.5 mt-2 fade-in-up">
            {/* The Main Huge Button */}
            <div className="flex items-center gap-3 w-full max-w-md justify-center">
              <button
                onClick={() => {
                  sfx.select();
                  socket.emit('host_aded_increment', { code });
                }}
                className="flex-1 btn-clean font-kufi bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-white py-5 sm:py-6 px-8 sm:px-12 rounded-3xl text-3xl sm:text-5xl font-black shadow-[0_12px_40px_rgba(16,185,129,0.5)] border-2 border-emerald-300/50 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <Plus size={36} strokeWidth={3.5} /> عِدّ (+1)
              </button>

              <button
                onClick={() => socket.emit('host_aded_decrement', { code })}
                disabled={count === 0}
                className="btn-clean bg-white/10 hover:bg-white/20 text-gray-300 p-5 sm:p-6 rounded-3xl border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="إنقاص (-1)"
              >
                <Minus size={28} />
              </button>
            </div>

            {/* Timer & Finish Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-lg">
              {!isRunning ? (
                <button
                  onClick={() => socket.emit('host_aded_start_timer', { code })}
                  className="btn-clean flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm sm:text-base shadow-lg"
                >
                  <Play size={18} fill="black" /> ابدأ الـ 30 ثانية
                </button>
              ) : (
                <button
                  onClick={() => socket.emit('host_aded_stop_timer', { code })}
                  className="btn-clean flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm sm:text-base shadow-lg"
                >
                  <Square size={18} fill="white" /> إيقاف المؤقت
                </button>
              )}

              <button
                onClick={() => socket.emit('host_aded_save_score', { code })}
                className="btn-clean flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-lg"
              >
                <CheckCircle2 size={18} /> حفظ الدور والانتقال للتالي
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm sm:text-base font-bold text-gray-300">
              {isMeActive ? 'دورك الحين! سمّع الهوست أكبر عدد تقدر عليه' : `الهوست قاعد يحسب لـ ${activePlayer?.name || 'المتسابق'}`}
            </p>
          </div>
        )}
      </div>

      {/* Bottom turn reminder */}
      <div className="text-xs text-gray-500 font-bold">
        ينتقل الدور تلقائياً بالترتيب لكل المتسابقين حتى نهاية الجولة
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 3. ADED RESULTS VIEW (تتويج الفائز ولوحة الترتيب النهائية)
// -------------------------------------------------------------
export function AdedResultsView({ room, socket, isHost, onBack }: { room: any; socket: any; isHost: boolean; onBack: () => void }) {
  const code = room.code;
  const gd = room.gameData || {};
  const scores = gd.scores || {};
  const history = gd.history || [];
  const contestants = gd.contestants || room.players.map((p: any) => p.id);

  useEffect(() => {
    sfx.win();
  }, []);

  // Sort contestants by score
  const ranked = contestants
    .map((id: string) => ({
      id,
      player: room.players.find((p: any) => p.id === id),
      score: scores[id] || 0
    }))
    .filter((item: any) => item.player)
    .sort((a: any, b: any) => b.score - a.score);

  const champion = ranked[0];

  return (
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between p-4 sm:p-8 bg-[#06070a] text-center">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <button
          onClick={() => { socket.emit('host_back_to_lobby', { code }); onBack(); }}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={16} /> خروج للوبي
        </button>
        <img src="/images/info.png" alt="True Server" className="h-9 sm:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
        <div className="text-xs sm:text-sm font-mono font-bold bg-white/10 px-4 py-2 rounded-full border border-white/15 text-white">
          كود: <span className="font-black text-amber-400">{code}</span>
        </div>
      </div>

      <div className="w-full max-w-xl flex flex-col items-center my-auto py-4 pop-in-bouncy">
        <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center mb-4 winner-explosion shadow-[0_0_35px_rgba(234,179,8,0.4)]">
          <Crown size={40} className="text-yellow-400" />
        </div>

        <h1 className="font-kufi text-4xl sm:text-6xl font-black text-white mb-2">
          انتهت الجولة!
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mb-6 font-medium">
          تمت مشاركة جميع المتسابقين بالدور
        </p>

        {/* Champion Card */}
        {champion && (
          <div className="w-full glass-panel p-6 sm:p-8 rounded-3xl border-2 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)] mb-6 winner-explosion">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              المركز الأول (بطل التعداد)
            </span>
            <div className="text-3xl sm:text-5xl font-black text-white font-kufi mb-2">
              {champion.player.name}
            </div>
            <div className="text-4xl sm:text-6xl font-mono font-black text-amber-400">
              {champion.score} <span className="text-base text-gray-300 font-sans font-bold">عنصر</span>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="w-full bg-black/60 border border-white/15 rounded-3xl p-4 sm:p-6 mb-8 text-start">
          <h3 className="text-xs sm:text-sm font-bold text-gray-400 mb-3 px-1 flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" /> الترتيب النهائي للجولة:
          </h3>
          <div className="space-y-2">
            {ranked.map((item: any, idx: number) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border text-sm sm:text-base font-bold ${idx === 0 ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/5 text-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-black ${idx === 0 ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-400'}`}>
                    {idx + 1}
                  </span>
                  <span>{item.player.name}</span>
                </div>
                <span className="font-mono font-black text-lg text-white">
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Host Control Actions */}
        {isHost ? (
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <button
              onClick={() => socket.emit('host_aded_new_round', { code })}
              className="flex-1 btn-clean font-kufi bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-6 py-4 rounded-2xl text-base sm:text-lg font-black shadow-lg hover:scale-105 transition-all"
            >
              جولة جديدة بنفس المتسابقين
            </button>
            <button
              onClick={() => socket.emit('host_start_aded', { code })}
              className="btn-clean font-kufi bg-white/10 text-white border border-white/20 px-6 py-4 rounded-2xl text-sm sm:text-base font-bold hover:bg-white/20 transition-colors"
            >
              تجهيز المتسابقين
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 text-gray-300 px-6 py-3 rounded-full text-xs sm:text-sm font-bold animate-pulse">
            بانتظار الهوست لبدء جولة جديدة أو العودة...
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 font-bold">
        True Server Gaming Activity
      </div>
    </main>
  );
}
