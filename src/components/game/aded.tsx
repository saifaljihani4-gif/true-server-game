import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Crown, Play, Square, RotateCcw, Plus, Minus, Shuffle, Trophy, Users, Edit3, ArrowLeft, Sparkles, CheckCircle2, XCircle, Gavel, Flame } from 'lucide-react';
import { sfx } from '@/game/sfx';

// -------------------------------------------------------------
// 1. ADED LOBBY VIEW (تجهيز ودخول المتسابقين قبل بدء المزايدة)
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
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between pt-14 sm:pt-6 px-4 sm:px-8 pb-6">
      {/* Top Header */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <button
            onClick={() => { socket.emit('host_back_to_lobby', { code }); onBack(); }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={16} /> خروج للوبي الرئيسي
          </button>
          <img src="/images/info.png" alt="True Server" className="h-7 sm:h-10 w-auto object-contain drop-shadow-md" />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-mono font-bold bg-white/10 px-5 py-2 rounded-2xl border border-white/15 text-white shadow-lg">
          <span className="text-gray-400">كود الروم:</span>
          <span className="font-black text-amber-400 text-xl sm:text-2xl">{code}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-xl flex flex-col items-center text-center my-auto py-3 pop-in-bouncy">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1 rounded-full text-xs font-bold mb-3">
          <Gavel size={14} /> نظام المزايدة والتحدي بـ 30 ثانية
        </div>

        <h1 className="font-kufi text-2xl sm:text-4xl font-black text-white mb-2">
          لعبة عدّد (المزايدة)
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto mb-4 sm:mb-6 font-medium leading-relaxed">
          يطرح الهوست التحدي، والكل يزايد على أكبر رقم يقدر يعده في 30 ثانية! صاحب أعلى مزايدة ينزل للميدان ليثبت رقمه ويكسب النقطة!
        </p>

        {/* Contestants List Box */}
        <div className="w-full glass-panel p-4 sm:p-6 rounded-2xl border border-white/15 shadow-2xl mb-5 text-start">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-amber-400" />
              <h2 className="font-kufi text-base sm:text-lg font-bold text-white">
                المتسابقون المشاركون ({contestantPlayers.length})
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
            بدء مرحلة المزايدة والتحدي
          </button>
        ) : (
          <div className="bg-white/5 border border-white/10 text-gray-300 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold animate-pulse">
            بانتظار الهوست لبدء المزايدة بعد اكتمال المتسابقين...
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 font-bold">
        المزايدة مفتوحة للجميع ولا يشترط التقيد بترتيب مسبق
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 2. ADED GAME VIEW (مرحلة المزايدة الحية + مرحلة العد بالـ 30 ثانية)
// -------------------------------------------------------------
export function AdedGameView({ room, socket, onBack, isHost }: { room: any; socket: any; onBack: () => void; isHost: boolean }) {
  const code = room.code;
  const gd = room.gameData || {};
  const topic = gd.topic || 'كم تقدر تعدّد في 30 ثانية؟';
  const count = gd.count || 0;
  const phase = gd.phase || 'bidding'; // 'bidding' | 'counting'
  const isCountingPhase = phase === 'counting';

  const currentBid = gd.currentBid || 0;
  const highestBidderId = gd.highestBidderId;
  const highestBidderName = gd.highestBidderName;
  const targetCount = gd.targetCount || currentBid || 5;
  const activePlayerId = gd.activePlayerId || highestBidderId;
  const activePlayer = room.players.find((p: any) => p.id === activePlayerId);
  const isMeActive = activePlayer?.id === socket.id;

  const isRunning = gd.isRunning || false;
  const timerStartedAt = gd.timerStartedAt;
  const scores = gd.scores || {};
  const round = gd.round || 1;

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

      // Play tick every second in last 5 seconds
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

  // Custom bid input
  const [customBidInput, setCustomBidInput] = useState('');
  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customBidInput, 10);
    if (val > currentBid) {
      sfx.select();
      socket.emit('aded_place_bid', { code, amount: val });
      setCustomBidInput('');
    }
  };

  const handleQuickBid = (increment: number) => {
    sfx.select();
    const newBid = (currentBid || 0) + increment;
    socket.emit('aded_place_bid', { code, amount: newBid });
  };

  // Host manual challenger picker state
  const [selectedChallengerId, setSelectedChallengerId] = useState('');
  const [manualTarget, setManualTarget] = useState(5);

  return (
    <main className="fade-screen relative flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between pt-14 sm:pt-6 px-3 sm:px-6 pb-6">
      {/* 1. TOP HEADER & STATUS */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <button
          onClick={() => { if (isHost) socket.emit('host_back_to_lobby', { code }); onBack(); }}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-400 hover:text-white shrink-0 transition-colors"
        >
          <ChevronRight size={15} /> {isHost ? 'العودة للوبي' : 'خروج'}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-400">
            <Gavel size={14} />
            <span>جولة {round}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-xs font-bold text-gray-300">
            <span>الحالة:</span>
            <span className="text-white font-black">{isCountingPhase ? 'مرحلة العد والتحدي' : 'مرحلة المزايدة'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => socket.emit('host_aded_end_game', { code })}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full border border-white/15 text-gray-300 transition-colors"
            >
              إنهاء اللعبة
            </button>
          )}
          <div className="text-xs font-mono font-bold bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 text-white shrink-0">
            كود: <span className="font-black text-amber-400">{code}</span>
          </div>
        </div>
      </div>

      {/* 2. THE TOPIC CARD */}
      <div className="w-full max-w-xl flex flex-col items-center gap-3 sm:gap-4 my-auto py-1">
        <div className="w-full glass-panel p-4 sm:p-5 rounded-2xl border border-amber-500/30 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1.5">
            التحدي المطلوب
          </span>

          <h2 className="font-kufi text-lg sm:text-2xl md:text-3xl font-black text-white leading-snug drop-shadow-md">
            {topic}
          </h2>

          {isHost && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-2.5 border-t border-white/10">
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
                placeholder="اكتب التحدي (مثال: دول تبدأ بحرف الميم...)"
                className="flex-1 bg-black/70 border border-white/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs">
                تأكيد
              </button>
            </form>
          )}
        </div>

        {/* PHASE A: BIDDING PHASE (المزايدة) */}
        {!isCountingPhase ? (
          <div className="w-full flex flex-col items-center gap-3 fade-in-up">
            {/* Live Highest Bid Box */}
            <div className="w-full glass-panel p-5 rounded-2xl border border-amber-400/40 text-center shadow-2xl relative overflow-hidden bg-gradient-to-b from-amber-950/30 to-black/60">
              <div className="text-xs font-bold text-amber-400 mb-1 flex items-center justify-center gap-1.5">
                <Gavel size={15} />
                <span>أعلى مزايدة حالية في الروم</span>
              </div>

              <div className="font-mono text-5xl sm:text-6xl font-black text-amber-300 my-1 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]">
                {currentBid > 0 ? currentBid : '0'}
              </div>

              <div className="text-xs sm:text-sm font-bold text-gray-300">
                {highestBidderName ? (
                  <span>صاحب المزايدة: <span className="text-white font-black text-sm sm:text-base">{highestBidderName}</span></span>
                ) : (
                  <span className="text-gray-400">لا توجد مزايدات بعد - زايدوا الآن!</span>
                )}
              </div>
            </div>

            {/* Quick Bid Buttons for Players */}
            <div className="w-full flex flex-col items-center gap-2">
              <div className="text-[11px] font-bold text-gray-400">كم تقدر تعدّ في 30 ثانية؟ اضغط لترفع المزايدة:</div>

              <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-sm">
                <button
                  onClick={() => handleQuickBid(1)}
                  className="btn-clean px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus size={14} /> +1 ({currentBid + 1})
                </button>
                <button
                  onClick={() => handleQuickBid(2)}
                  className="btn-clean px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus size={14} /> +2 ({currentBid + 2})
                </button>
                <button
                  onClick={() => handleQuickBid(5)}
                  className="btn-clean px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus size={14} /> +5 ({currentBid + 5})
                </button>
              </div>

              <form onSubmit={handleCustomBid} className="flex gap-1.5 w-full max-w-xs mt-1">
                <input
                  type="number"
                  min={currentBid + 1}
                  value={customBidInput}
                  onChange={(e) => setCustomBidInput(e.target.value)}
                  placeholder={`اكتب رقم أعلى من ${currentBid}`}
                  className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white text-center font-bold font-mono focus:outline-none focus:border-amber-400"
                />
                <button type="submit" className="px-3.5 py-1.5 bg-white text-black font-bold text-xs rounded-xl hover:scale-105 transition-transform">
                  زايد
                </button>
              </form>
            </div>

            {/* Host Execution Control */}
            {isHost && (
              <div className="w-full mt-2 pt-3 border-t border-white/10 flex flex-col items-center gap-2.5">
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-sm justify-center">
                  {/* Option to select any player manually without order */}
                  <select
                    value={selectedChallengerId || highestBidderId || ''}
                    onChange={(e) => setSelectedChallengerId(e.target.value)}
                    className="bg-black/80 border border-white/20 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none w-full sm:w-auto"
                  >
                    <option value="">{highestBidderName ? `المزايد الأعلى: ${highestBidderName}` : 'اختر المتحدي يدوياً'}</option>
                    {room.players.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={manualTarget || currentBid || 5}
                    onChange={(e) => setManualTarget(parseInt(e.target.value, 10) || 1)}
                    className="w-20 bg-black/80 border border-white/20 text-amber-300 font-mono text-center text-sm font-black rounded-xl px-2 py-1.5"
                    title="الرقم المطلوب"
                  />
                </div>

                <button
                  onClick={() => socket.emit('host_aded_start_challenge', {
                    code,
                    playerId: selectedChallengerId || highestBidderId || room.players[0]?.id,
                    targetCount: manualTarget || currentBid || 5
                  })}
                  className="w-full max-w-sm btn-clean font-kufi bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-white py-3 px-6 rounded-2xl text-base sm:text-lg font-black shadow-[0_8px_30px_rgba(16,185,129,0.4)] border border-emerald-300/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Play size={18} fill="white" />
                  <span>تثبيت المزايدة وبدء الـ 30 ثانية</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* PHASE B: COUNTING & EXECUTION PHASE (مرحلة العد والتحدي) */
          <div className="w-full flex flex-col items-center gap-3 fade-in-up">
            {/* Active Challenger & Target Pill */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center sm:text-start">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-amber-400" />
                <span className="text-xs sm:text-sm font-bold text-gray-200">
                  المتحدي: <span className="text-white font-black text-sm sm:text-base">{activePlayer?.name || 'مجهول'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-bold border border-amber-500/30">
                <span>المطلوب عَدّه:</span>
                <span className="font-mono text-base sm:text-lg font-black text-white">{targetCount}</span>
              </div>
            </div>

            {/* Timer and Live Counter */}
            <div className="w-full flex items-center justify-center gap-4 sm:gap-8 my-1">
              {/* 30s Timer */}
              <div className="flex flex-col items-center">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 sm:border-4 flex flex-col items-center justify-center transition-all ${timeLeft <= 5 ? 'border-red-500 bg-red-950/50 text-red-400 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.5)]' : 'border-amber-500/50 bg-black/60 text-white'}`}>
                  <span className="font-mono text-2xl sm:text-3xl font-black">{timeLeft}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">ثانية</span>
                </div>
              </div>

              {/* Live Counter (Progress against target) */}
              <div className="flex flex-col items-center">
                <div className={`px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-2xl bg-gradient-to-b from-purple-950/90 via-[#18112e] to-black border border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.35)] flex flex-col items-center justify-center transition-transform duration-150 ${bumping ? 'scale-110 border-amber-400' : 'scale-100'}`}>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-4xl sm:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
                      {count}
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-gray-400 font-bold">
                      / {targetCount}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider">
                    {count >= targetCount ? 'تم الوصول للمطلوب!' : 'العدد المحسوب'}
                  </span>
                </div>
              </div>
            </div>

            {/* Host Counting & Judging Controls */}
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

                {/* Timer Controls */}
                <div className="flex items-center gap-2 w-full max-w-sm justify-center">
                  {!isRunning ? (
                    <button
                      onClick={() => socket.emit('host_aded_start_timer', { code })}
                      className="flex-1 btn-clean flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm shadow-md"
                    >
                      <Play size={14} fill="black" /> ابدأ الـ 30 ثانية
                    </button>
                  ) : (
                    <button
                      onClick={() => socket.emit('host_aded_stop_timer', { code })}
                      className="flex-1 btn-clean flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm shadow-md"
                    >
                      <Square size={14} fill="white" /> إيقاف المؤقت
                    </button>
                  )}
                </div>

                {/* Judgement Buttons */}
                <div className="flex items-center gap-2 w-full max-w-sm justify-center mt-1">
                  <button
                    onClick={() => socket.emit('host_aded_finish_challenge', { code, outcome: 'win' })}
                    className="flex-1 btn-clean flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md"
                  >
                    <CheckCircle2 size={16} /> نجح في التحدي (+نقطة)
                  </button>
                  <button
                    onClick={() => socket.emit('host_aded_finish_challenge', { code, outcome: 'lose' })}
                    className="flex-1 btn-clean flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm shadow-md"
                  >
                    <XCircle size={16} /> فشل في التحدي
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm sm:text-base font-bold text-gray-200">
                  {isMeActive ? 'دورك الحين! سمّع الهوست وعِدّ أسرع ما عندك!' : `الهوست قاعد يحسب لـ ${activePlayer?.name || 'المتسابق'}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Live Scoreboard Pill Strip */}
        <div className="w-full flex items-center justify-center gap-2 flex-wrap pt-2 border-t border-white/10 text-xs">
          <span className="text-gray-400 font-bold">لوحة النقاط:</span>
          {room.players.map((p: any) => (
            <span key={p.id} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200 font-bold">
              {p.name}: <span className="text-amber-400 font-mono font-black">{scores[p.id] || 0}</span>
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 3. ADED RESULTS VIEW (لوحة الشرف وتتويج الفائز)
// -------------------------------------------------------------
export function AdedResultsView({ room, socket, onBack, isHost }: { room: any; socket: any; onBack: () => void; isHost: boolean }) {
  const code = room.code;
  const gd = room.gameData || {};
  const scores = gd.scores || {};
  const history = gd.history || [];

  useEffect(() => {
    sfx.win();
  }, []);

  // Sort players by score
  const ranked = room.players
    .map((p: any) => ({
      ...p,
      score: scores[p.id] || 0
    }))
    .sort((a: any, b: any) => b.score - a.score);

  const champion = ranked[0];

  return (
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between pt-14 sm:pt-6 px-3 sm:px-6 pb-6 text-center">
      <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <button
            onClick={() => { socket.emit('host_back_to_lobby', { code }); onBack(); }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} /> خروج للوبي
          </button>
          <img src="/images/info.png" alt="True Server" className="h-7 sm:h-9 w-auto object-contain drop-shadow-md" />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-mono font-bold bg-white/10 px-5 py-2 rounded-2xl border border-white/15 text-white shadow-lg">
          <span className="text-gray-400">كود الروم:</span>
          <span className="font-black text-amber-400 text-xl sm:text-2xl">{code}</span>
        </div>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center my-auto py-3 pop-in-bouncy">
        <div className="w-14 h-14 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center mb-3 winner-explosion shadow-[0_0_25px_rgba(234,179,8,0.35)]">
          <Crown size={28} className="text-yellow-400" />
        </div>

        <h1 className="font-kufi text-2xl sm:text-4xl font-black text-white mb-1.5 winner-explosion">
          بطل تحدي المزايدة!
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-5">
          أكثر من حقق تحديات المزايدة بنجاح في الـ 30 ثانية
        </p>

        {/* Champion Card */}
        {champion && (
          <div className="w-full p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-black/40 to-black/60 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.3)] mb-5">
            <div className="text-xs text-amber-300 font-bold mb-1">الفائز بالمركز الأول</div>
            <div className="font-kufi text-2xl sm:text-3xl font-black text-white">{champion.name}</div>
            <div className="font-mono text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {champion.score} نقطة
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="w-full bg-black/60 border border-white/15 rounded-2xl p-3 sm:p-5 mb-5 text-start">
          <h2 className="font-kufi text-sm sm:text-base font-bold text-white mb-3">ترتيب جميع المتسابقين:</h2>
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {ranked.map((item: any, idx: number) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-xs sm:text-sm font-bold text-white">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-gray-300 text-xs flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span>{item.name}</span>
                </div>
                <span className="font-mono text-amber-400 font-black">{item.score} نقطة</span>
              </div>
            ))}
          </div>
        </div>

        {/* Host Actions */}
        {isHost ? (
          <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm">
            <button
              onClick={() => socket.emit('host_aded_start_game', { code })}
              className="flex-1 btn-clean font-kufi bg-gradient-to-r from-amber-500 to-yellow-500 text-black py-3 rounded-xl font-black text-sm shadow-lg hover:scale-105 transition-all"
            >
              جولة مزايدة جديدة
            </button>
            <button
              onClick={() => socket.emit('host_back_to_lobby', { code })}
              className="flex-1 btn-clean font-kufi bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              العودة للوبي الرئيسي
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-400 font-bold">بانتظار الهوست لبدء جولة جديدة...</div>
        )}
      </div>
    </main>
  );
}
