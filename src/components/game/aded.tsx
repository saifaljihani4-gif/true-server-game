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
      <div className="w-full max-w-xl flex flex-col items-center text-center my-auto py-3 pop-in-bouncy">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <Trophy size={14} /> تحدي الـ 30 ثانية
        </div>

        <h1 className="font-kufi text-2xl sm:text-4xl font-black text-white mb-2">
          لعبة عدّد
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto mb-4 sm:mb-6 font-medium">
          ادخلوا كلكم بالروم، والمسابقة بتمشي بالدور عليكم واحد ورا الثاني!
        </p>

        {/* Contestants List Box */}
        <div className="w-full glass-panel p-4 sm:p-6 rounded-2xl border border-white/15 shadow-2xl mb-5 text-start">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-amber-400" />
              <h2 className="font-kufi text-base sm:text-lg font-bold text-white">
                ترتيب المتسابقين بالدور ({contestantPlayers.length})
              </h2>
            </div>

            <button
              onClick={() => socket.emit('aded_toggle_contestant', { code })}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${isMeContestant ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              {isMeContestant ? 'أنا متسابق (مشارك)' : 'أنا مشاهد (تخطي)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {contestantPlayers.map((p: any, idx: number) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/5 text-xs sm:text-sm font-bold text-white"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[11px] flex items-center justify-center font-black">
                    {idx + 1}
                  </span>
                  <span className="truncate">{p.name} {p.id === socket.id && '(أنت)'}</span>
                </div>
                {p.id === room.hostId && <Crown size={13} className="text-yellow-400 shrink-0" />}
              </div>
            ))}
            {contestantPlayers.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-5 col-span-2">بانتظار انضمام المتسابقين...</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            onClick={() => socket.emit('host_aded_start_game', { code })}
            disabled={contestantPlayers.length === 0}
            className="btn-clean font-kufi bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black px-8 sm:px-10 py-3 sm:py-3.5 rounded-2xl text-base sm:text-lg font-black shadow-[0_8px_25px_rgba(245,158,11,0.35)] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
          >
            بدء المسابقة بالدور
          </button>
        ) : (
          <div className="bg-white/5 border border-white/10 text-gray-300 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold animate-pulse">
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

      {/* 2. THE TOPIC CARD & COUNTER */}
      <div className="w-full max-w-xl flex flex-col items-center gap-3 sm:gap-4 my-auto py-1">
        {/* Active Challenger Banner */}
        <div className={`w-full max-w-sm py-1.5 px-4 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all ${isMeActive ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse' : 'bg-white/5 border-white/10 text-gray-300'}`}>
          المتحدي الحالي: <span className="text-white font-black text-sm sm:text-base">{activePlayer?.name}</span> {isMeActive && '(دورك الآن!)'}
          {nextPlayer && <div className="text-[10px] text-gray-400 font-normal mt-0.5">التالي بعده: {nextPlayer.name}</div>}
        </div>

        {/* Topic Card */}
        <div className="w-full glass-panel p-4 sm:p-6 rounded-2xl border border-purple-500/30 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          
          <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1.5">
            التحدي المطلوب
          </span>

          <h2 className="font-kufi text-lg sm:text-2xl md:text-3xl font-black text-white leading-snug drop-shadow-md">
            {topic}
          </h2>

          {isHost && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5 pt-3 border-t border-white/10">
              <button
                onClick={() => socket.emit('host_aded_next_topic', { code })}
                className="btn-clean flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200"
              >
                <Shuffle size={12} /> موضوع عشوائي
              </button>
              <button
                onClick={() => setShowCustomTopic(!showCustomTopic)}
                className="btn-clean flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-300"
              >
                <Edit3 size={12} /> كتابة موضوع
              </button>
            </div>
          )}

          {showCustomTopic && isHost && (
            <form onSubmit={handleCustomTopicSubmit} className="mt-3 flex gap-1.5 w-full fade-in-up">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                placeholder="اكتب التحدي (مثال: شخصية كرتونية...)"
                className="flex-1 bg-black/70 border border-white/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs">
                تأكيد
              </button>
            </form>
          )}
        </div>

        {/* TIMER AND LIVE COUNTER */}
        <div className="w-full flex items-center justify-center gap-4 sm:gap-8 my-1">
          {/* 30s Timer */}
          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 sm:border-4 flex flex-col items-center justify-center transition-all ${timeLeft <= 5 ? 'border-red-500 bg-red-950/50 text-red-400 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.5)]' : 'border-amber-500/50 bg-black/60 text-white'}`}>
              <span className="font-mono text-2xl sm:text-3xl font-black">{timeLeft}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">ثانية</span>
            </div>
          </div>

          {/* Live Counter */}
          <div className="flex flex-col items-center">
            <div className={`px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-2xl bg-gradient-to-b from-purple-950/90 via-[#18112e] to-black border border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.35)] flex flex-col items-center justify-center transition-transform duration-150 ${bumping ? 'scale-110 border-amber-400' : 'scale-100'}`}>
              <span className="font-mono text-4xl sm:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
                {count}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider">
                العدد الحالي
              </span>
            </div>
          </div>
        </div>

        {/* 3. HOST CONTROLS */}
        {isHost ? (
          <div className="w-full flex flex-col items-center gap-2.5 mt-1 fade-in-up">
            {/* The Main Count Button */}
            <div className="flex items-center gap-2.5 w-full max-w-sm justify-center">
              <button
                onClick={() => {
                  sfx.select();
                  socket.emit('host_aded_increment', { code });
                }}
                className="flex-1 btn-clean font-kufi bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-white py-3 sm:py-3.5 px-6 rounded-2xl text-xl sm:text-2xl font-black shadow-[0_8px_30px_rgba(16,185,129,0.4)] border border-emerald-300/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Plus size={24} strokeWidth={3} /> عِدّ (+1)
              </button>

              <button
                onClick={() => socket.emit('host_aded_decrement', { code })}
                disabled={count === 0}
                className="btn-clean bg-white/10 hover:bg-white/20 text-gray-300 p-3 sm:p-3.5 rounded-2xl border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="إنقاص (-1)"
              >
                <Minus size={20} />
              </button>
            </div>

            {/* Timer & Finish Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-md">
              {!isRunning ? (
                <button
                  onClick={() => socket.emit('host_aded_start_timer', { code })}
                  className="btn-clean flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm shadow-md"
                >
                  <Play size={14} fill="black" /> ابدأ الـ 30 ثانية
                </button>
              ) : (
                <button
                  onClick={() => socket.emit('host_aded_stop_timer', { code })}
                  className="btn-clean flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm shadow-md"
                >
                  <Square size={14} fill="white" /> إيقاف المؤقت
                </button>
              )}

              <button
                onClick={() => socket.emit('host_aded_save_score', { code })}
                className="btn-clean flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md"
              >
                <CheckCircle2 size={14} /> حفظ الدور والانتقال للتالي
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
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between p-3 sm:p-6 bg-[#06070a] text-center">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <button
          onClick={() => { socket.emit('host_back_to_lobby', { code }); onBack(); }}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={14} /> خروج للوبي
        </button>
        <img src="/images/info.png" alt="True Server" className="h-8 sm:h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
        <div className="text-xs sm:text-sm font-mono font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/15 text-white">
          كود: <span className="font-black text-amber-400">{code}</span>
        </div>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center my-auto py-3 pop-in-bouncy">
        <div className="w-14 h-14 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center mb-3 winner-explosion shadow-[0_0_25px_rgba(234,179,8,0.35)]">
          <Crown size={28} className="text-yellow-400" />
        </div>

        <h1 className="font-kufi text-2xl sm:text-4xl font-black text-white mb-1.5">
          انتهت الجولة!
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-4 font-medium">
          تمت مشاركة جميع المتسابقين بالدور
        </p>

        {/* Champion Card */}
        {champion && (
          <div className="w-full glass-panel p-4 sm:p-6 rounded-2xl border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.25)] mb-4 winner-explosion">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
              المركز الأول (بطل التعداد)
            </span>
            <div className="text-xl sm:text-3xl font-black text-white font-kufi mb-1">
              {champion.player.name}
            </div>
            <div className="text-3xl sm:text-5xl font-mono font-black text-amber-400">
              {champion.score} <span className="text-sm text-gray-300 font-sans font-bold">عنصر</span>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="w-full bg-black/60 border border-white/15 rounded-2xl p-3 sm:p-5 mb-5 text-start">
          <h3 className="text-xs sm:text-sm font-bold text-gray-400 mb-2.5 px-1 flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-400" /> الترتيب النهائي للجولة:
          </h3>
          <div className="space-y-1.5">
            {ranked.map((item: any, idx: number) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-bold ${idx === 0 ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/5 text-gray-200'}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-black ${idx === 0 ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-400'}`}>
                    {idx + 1}
                  </span>
                  <span>{item.player.name}</span>
                </div>
                <span className="font-mono font-black text-base text-white">
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
