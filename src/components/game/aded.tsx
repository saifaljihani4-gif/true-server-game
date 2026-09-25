import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Crown, Play, Square, RotateCcw, Plus, Minus, Shuffle, Trophy, Users, Edit3 } from 'lucide-react';
import { sfx } from '@/game/sfx';

export function AdedGameView({ room, socket, onBack, isHost }: { room: any; socket: any; onBack: () => void; isHost: boolean }) {
  const code = room.code;
  const gd = room.gameData || {};
  const topic = gd.topic || 'كم تقدر تعدّد في 30 ثانية؟';
  const count = gd.count || 0;
  const activePlayerId = gd.activePlayerId;
  const isRunning = gd.isRunning || false;
  const timerStartedAt = gd.timerStartedAt;
  const scores = gd.scores || {};
  const history = gd.history || [];

  const activePlayer = room.players.find((p: any) => p.id === activePlayerId) || room.players[0];
  const isMeActive = activePlayer?.id === socket.id;

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

  // Sort players for leaderboard
  const sortedPlayers = [...room.players].sort((a: any, b: any) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <main className="fade-screen relative flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between p-3 sm:p-6 bg-[#07080b]">
      {/* 1. TOP BAR */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 mb-3">
        <button
          onClick={() => { if (isHost) socket.emit('host_back_to_lobby', { code }); onBack(); }}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white shrink-0 transition-colors"
        >
          <ChevronRight size={14} /> {isHost ? 'العودة للوبي' : 'خروج'}
        </button>

        <div className="flex items-center gap-2">
          <img src="/images/info.png" alt="True Server" className="h-7 sm:h-9 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
          <span className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full">
            لعبة عدّد
          </span>
        </div>

        <div className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-full border border-white/15 text-white shrink-0">
          كود: <span className="font-black">{code}</span>
        </div>
      </div>

      {/* 2. MAIN CHALLENGE CARD & LIVE COUNTER */}
      <div className="w-full max-w-xl flex flex-col items-center gap-4 my-auto py-2">
        {/* Active Player Indicator */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-gray-300">
          <Users size={14} className="text-purple-400" />
          <span>المتحدي الآن:</span>
          <span className="text-white font-black text-sm text-purple-300">
            {activePlayer?.name || 'اختر لاعب'} {isMeActive && '(أنت)'}
          </span>
        </div>

        {/* Challenge Topic Card */}
        <div className="w-full glass-panel p-5 sm:p-7 rounded-3xl border border-purple-500/30 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />
          <h2 className="font-kufi text-xl sm:text-3xl font-black text-white leading-snug drop-shadow-md">
            {topic}
          </h2>

          {isHost && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                onClick={() => socket.emit('host_aded_next_topic', { code })}
                className="btn-clean flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200"
              >
                <Shuffle size={13} /> موضوع عشوائي
              </button>
              <button
                onClick={() => setShowCustomTopic(!showCustomTopic)}
                className="btn-clean flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-purple-300"
              >
                <Edit3 size={13} /> كتابة موضوع
              </button>
            </div>
          )}

          {showCustomTopic && isHost && (
            <form onSubmit={handleCustomTopicSubmit} className="mt-3 flex gap-2 w-full fade-in-up">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                placeholder="اكتب التحدي (مثلاً: كم تقدر تعدّد...)"
                className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
              />
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold">
                تأكيد
              </button>
            </form>
          )}
        </div>

        {/* TIMER & BIG COUNTER DISPLAY */}
        <div className="w-full flex items-center justify-center gap-4 sm:gap-8 my-2">
          {/* Circular 30s Timer */}
          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all ${timeLeft <= 5 ? 'border-red-500 bg-red-950/40 text-red-400 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.5)]' : 'border-purple-500/50 bg-black/50 text-white'}`}>
              <span className="font-mono text-2xl sm:text-3xl font-black">{timeLeft}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">ثانية</span>
            </div>
          </div>

          {/* Huge Counter */}
          <div className="flex flex-col items-center">
            <div className={`px-8 sm:px-10 py-3 sm:py-4 rounded-3xl bg-gradient-to-b from-purple-950/80 to-black border-2 border-purple-400/40 shadow-[0_0_35px_rgba(168,85,247,0.35)] flex flex-col items-center justify-center transition-transform ${bumping ? 'scale-110 border-purple-300' : 'scale-100'}`}>
              <span className="font-mono text-4xl sm:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
                {count}
              </span>
              <span className="text-xs font-bold text-purple-300 mt-0.5">العدد المحسوب</span>
            </div>
          </div>
        </div>

        {/* 3. HOST CONTROLS - THE BIG "عِدّ" BUTTON */}
        {isHost ? (
          <div className="w-full flex flex-col items-center gap-3 mt-2 fade-in-up">
            {/* The Main "عِدّ" Button */}
            <div className="flex items-center gap-3 w-full max-w-sm justify-center">
              <button
                onClick={() => {
                  sfx.select();
                  socket.emit('host_aded_increment', { code });
                }}
                className="flex-1 btn-clean font-kufi bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white py-4 sm:py-5 px-6 rounded-3xl text-2xl sm:text-3xl font-black shadow-[0_10px_35px_rgba(16,185,129,0.4)] border border-emerald-300/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Plus size={28} strokeWidth={3} /> عِدّ (+1)
              </button>

              <button
                onClick={() => socket.emit('host_aded_decrement', { code })}
                disabled={count === 0}
                className="btn-clean bg-white/10 hover:bg-white/20 text-gray-300 p-4 sm:p-5 rounded-3xl border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="إنقاص (-1)"
              >
                <Minus size={22} />
              </button>
            </div>

            {/* Timer Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-md">
              {!isRunning ? (
                <button
                  onClick={() => socket.emit('host_aded_start_timer', { code })}
                  className="btn-clean flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-md"
                >
                  <Play size={16} /> ابدأ المؤقت (30 ثانية)
                </button>
              ) : (
                <button
                  onClick={() => socket.emit('host_aded_stop_timer', { code })}
                  className="btn-clean flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-md"
                >
                  <Square size={16} /> إيقاف المؤقت
                </button>
              )}

              <button
                onClick={() => socket.emit('host_aded_save_score', { code })}
                className="btn-clean flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md"
              >
                <Trophy size={16} /> حفظ النتيجة والتالي
              </button>
            </div>

            {/* Player Selection Dropdown for Host */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400 font-bold">تحديد المتسابق:</span>
              <div className="flex flex-wrap gap-1.5">
                {room.players.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => socket.emit('host_aded_set_player', { code, playerId: p.id })}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${p.id === activePlayerId ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs sm:text-sm font-bold text-gray-400">
              {isMeActive ? 'دورك الحين! اذكر أكبر عدد ممكن قبل ينتهي الوقت' : `الهوست قاعد يعد لـ ${activePlayer?.name || 'المتسابق'}`}
            </p>
          </div>
        )}
      </div>

      {/* 4. LEADERBOARD (لوحة الصدارة) */}
      <div className="w-full max-w-xl bg-black/60 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 mt-2 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400">
            <Trophy size={14} /> لوحة الصدارة (أعلى نتيجة)
          </div>
          <span className="text-[11px] text-gray-500">{sortedPlayers.length} لاعبين</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sortedPlayers.map((p: any, i: number) => {
            const isTop = i === 0 && (scores[p.id] || 0) > 0;
            return (
              <div
                key={p.id}
                className={`p-2 rounded-xl flex items-center justify-between text-xs border ${isTop ? 'bg-yellow-950/40 border-yellow-500/40 text-yellow-300' : 'bg-white/5 border-white/5 text-gray-300'}`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isTop ? <Crown size={12} className="text-yellow-400 shrink-0" /> : <span className="text-gray-500 font-mono text-[10px] w-3">{i + 1}</span>}
                  <span className="font-bold truncate">{p.name}</span>
                </div>
                <span className="font-mono font-black text-sm text-white shrink-0">
                  {scores[p.id] || 0}
                </span>
              </div>
            );
          })}
        </div>

        {/* History drawer if any */}
        {history.length > 0 && (
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 px-1">
            <span>آخر محاولة: <span className="text-white font-bold">{history[0].playerName}</span> جاب <span className="text-emerald-400 font-bold">{history[0].count}</span> في ({history[0].topic.slice(0, 25)}...)</span>
          </div>
        )}
      </div>
    </main>
  );
}
