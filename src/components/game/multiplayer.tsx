import { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import { ChevronRight, Users, Eye, EyeOff, Trophy, Crown } from 'lucide-react';
import { HoroofLobby, HoroofBoardView, HoroofWinnerView } from './horoof';
import { AdedGameView } from './aded';

function DiscussionTimer({ duration = 60 }: { duration?: number }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(l => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return (
    <div className={`text-4xl md:text-5xl font-black mt-4 p-4 rounded-2xl border ${timeLeft <= 10 ? 'text-red-500 border-red-500/30 bg-red-500/10 animate-pulse' : 'text-white border-white/20 bg-white/5'}`}>
      {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </div>
  );
}

function UnifiedRoom({ onBack, initialHost }: { onBack: () => void, initialHost: boolean }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [room, setRoom] = useState<any>(null);
  
  // Personal State
  const [roleData, setRoleData] = useState({ role: '', hint: '', type: '' });
  const [showRole, setShowRole] = useState(false);
  const [votedFor, setVotedFor] = useState('');
  const [aliveData, setAliveData] = useState<Record<string, boolean>>({});
  const [dayData, setDayData] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [clueWord, setClueWord] = useState('');
  const [clueNum, setClueNum] = useState(1);

  // Connection
  useEffect(() => {
    socket.connect();
    return () => { socket.disconnect(); };
  }, []);

  // Listeners
  useEffect(() => {
    const onRoomUpdate = (r: any) => setRoom(r);
    const onHostDisconnected = () => { setError('المضيف أنهى الروم.'); setRoom(null); setCode(''); };
    
    // Personal Updates
    const onGameStarted = (data: any) => {
      setRoleData({ role: data.role, hint: data.hint, type: data.roleType });
      setVotedFor('');
      setResults(null);
    };
    const onStartNight = (data: any) => { setAliveData(data.alive); setVotedFor(''); };
    const onDayReveal = (data: any) => { setAliveData(data.alive); setDayData({ killedName: data.killedName, winner: data.winner }); setVotedFor(''); };
    const onExecutionReveal = (data: any) => { setAliveData(data.alive); setDayData({ executedName: data.executedName, winner: data.winner }); setVotedFor(''); };
    const onShowResults = (data: any) => setResults(data);
    const onBackToLobby = () => { setRoleData({ role: '', hint: '', type: '' }); setDayData(null); setResults(null); setVotedFor(''); };

    socket.on('room_state_update', onRoomUpdate);
    socket.on('host_disconnected', onHostDisconnected);
    socket.on('game_started', onGameStarted);
    socket.on('start_night', onStartNight);
    socket.on('day_reveal', onDayReveal);
    socket.on('execution_reveal', onExecutionReveal);
    socket.on('show_results', onShowResults);
    socket.on('back_to_lobby', onBackToLobby);

    return () => {
      socket.off('room_state_update', onRoomUpdate);
      socket.off('host_disconnected', onHostDisconnected);
      socket.off('game_started', onGameStarted);
      socket.off('start_night', onStartNight);
      socket.off('day_reveal', onDayReveal);
      socket.off('execution_reveal', onExecutionReveal);
      socket.off('show_results', onShowResults);
      socket.off('back_to_lobby', onBackToLobby);
    };
  }, []);

  const handleCreateAndJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    socket.emit('host_create_room', (res: any) => {
      if (res.success) {
        setCode(res.code);
        socket.emit('player_join_room', { code: res.code, name }, (joinRes: any) => {
          if (!joinRes.success) setError(joinRes.error);
        });
      }
    });
  };

  const handleJoinOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    socket.emit('player_join_room', { code, name }, (res: any) => {
      if (!res.success) setError(res.error);
    });
  };

  const isHost = room?.hostId === socket.id;
  const isDead = room?.gameData?.alive && !room.gameData.alive[socket.id];
  const playersToVote = room?.players.filter((p: any) => p.id !== socket.id && (!room.gameData?.alive || room.gameData.alive[p.id])) || [];

  const castVote = (id: string) => { setVotedFor(id); socket.emit('player_vote', { code, votedForId: id }); };
  const castMafiaAction = (id: string) => { setVotedFor(id); socket.emit('mafia_action', { code, targetId: id, roleType: roleData.type }); };

  // --- 1. LOGIN SCREEN ---
  if (!room) {
    return (
      <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-center p-4 sm:p-6 bg-black relative">
        <button onClick={onBack} className="absolute start-4 top-4 sm:start-5 sm:top-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors">
          <ChevronRight size={14} /> رجوع
        </button>
        <form onSubmit={initialHost ? handleCreateAndJoin : handleJoinOnly} className="w-full max-w-sm flex flex-col gap-4 sm:gap-5 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="text-center mb-1"><h2 className="font-kufi text-2xl sm:text-3xl font-bold text-white">{initialHost ? 'إنشاء روم جديد' : 'الانضمام لروم'}</h2></div>
          {error && <div className="bg-red-500/20 text-red-300 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm font-bold border border-red-500/30 text-center">{error}</div>}
          
          {!initialHost && (
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={4} placeholder="كود الروم" className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-center text-2xl sm:text-3xl font-bold tracking-widest text-white uppercase focus:outline-none focus:border-white/30 transition-colors" required />
          )}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={12} placeholder="اسمك" className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-base sm:text-xl font-bold text-center text-white focus:outline-none focus:border-white/30 transition-colors" required dir="auto" />
          
          <button type="submit" className="mt-2 w-full bg-white text-black font-kufi font-bold text-lg sm:text-xl py-3 sm:py-4 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-transform">
            {initialHost ? 'إنشاء ودخول' : 'ادخل الروم'}
          </button>
        </form>
      </main>
    );
  }

  // --- 2. LOBBY SCREEN ---
  if (room.state === 'lobby') {
    return (
      <main className="fade-screen relative flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col p-3 sm:p-6">
        <header className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 max-w-5xl mx-auto w-full gap-2 sm:gap-4">
          <button onClick={() => { socket.disconnect(); onBack(); }} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors shrink-0">
            <ChevronRight size={14} /> خروج
          </button>
          <img src="/images/info.png" alt="True Server" className="h-8 sm:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
          <div className="flex items-center gap-1.5 sm:gap-3 px-3 sm:px-6 py-1 sm:py-2 bg-white/10 border border-white/20 rounded-full shrink-0">
            <span className="text-xs sm:text-sm font-bold text-gray-400">كود الروم:</span>
            <span className="text-lg sm:text-2xl font-black tracking-widest text-white">{room.code}</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row gap-6 max-w-5xl mx-auto w-full">
          <div className="flex-1 glass-panel p-6 rounded-3xl flex flex-col border border-white/10 bg-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-kufi text-2xl font-bold text-white">اللاعبين ({room.players.length})</h2>
              <Users size={24} className="text-white/20" />
            </div>
            <div className="flex-1 bg-black/40 rounded-2xl p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
              {room.players.map((p: any) => (
                <div key={p.id} className="winner-explosion bg-white/10 py-3 px-4 rounded-xl text-center font-bold text-white truncate border border-white/5 flex items-center justify-center gap-2">
                  {p.name} {p.id === room.hostId && <Crown size={14} className="text-yellow-500" />}
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <div className="w-full md:w-80 flex flex-col gap-4">
              <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5">
                <h3 className="font-kufi text-xl font-bold mb-4 text-white">إعدادات اللعبة</h3>
                <div className="flex flex-col gap-3">
                  <button onClick={() => socket.emit('host_start_barra', { code: room.code })} disabled={room.players.length < 3} className="py-4 px-5 rounded-2xl font-bold transition-all bg-white text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex justify-between items-center">
                    برا السالفة <span className="w-3 h-3 rounded-full bg-green-500" />
                  </button>
                  <button onClick={() => socket.emit('host_start_mafia', { code: room.code })} disabled={room.players.length < 3} className="py-4 px-5 rounded-2xl font-bold transition-all bg-white text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex justify-between items-center">
                    مافيا <span className="w-3 h-3 rounded-full bg-red-500" />
                  </button>
                  <button onClick={() => socket.emit('host_start_codenames_lobby', { code: room.code })} disabled={room.players.length < 3} className="py-4 px-5 rounded-2xl font-bold transition-all bg-white text-black hover:scale-105 disabled:opacity-50 flex justify-between items-center">
                    كود نيمز <span className="w-3 h-3 rounded-full bg-blue-500" />
                  </button>
                  <button onClick={() => socket.emit('host_start_horoof_lobby', { code: room.code })} disabled={room.players.length < 2} className="py-4 px-5 rounded-2xl font-bold transition-all bg-white text-black hover:scale-105 disabled:opacity-50 flex justify-between items-center">
                    تحدي الحروف <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </button>
                  <button onClick={() => socket.emit('host_start_aded', { code: room.code })} disabled={room.players.length < 1} className="py-4 px-5 rounded-2xl font-bold transition-all bg-white text-black hover:scale-105 disabled:opacity-50 flex justify-between items-center">
                    عدّد (30 ثانية) <span className="w-3 h-3 rounded-full bg-amber-500" />
                  </button>
                </div>
                {room.players.length < 2 && <p className="text-sm text-red-400 mt-4 text-center font-bold">تحتاج لاعبين على الأقل لبدء اللعبة</p>}
              </div>
            </div>
          ) : (
            <div className="w-full md:w-80 glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white mx-auto mb-4 animate-spin" />
              <p className="text-gray-400 font-bold text-lg">بانتظار المضيف يبدأ اللعبة...</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // --- UNIFIED GAME VIEWS ---
  
  // SHARED: WINNER SCREEN (Overrides normal view if someone won)
  if (room.gameData?.mode === 'mafia' && room.gameData?.winner) {
    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col p-6 items-center justify-center text-center bg-black">
        <h1 className="font-kufi text-5xl md:text-7xl font-bold mb-6 text-white">انتهت اللعبة!</h1>
        <div className="text-4xl md:text-5xl font-black mb-12 p-8 rounded-3xl bg-white/10 border border-white/20 winner-explosion">
          {room.gameData.winner === 'town' ? <span className="text-green-400">فاز المواطنون</span> : <span className="text-red-500">فازت المافيا</span>}
        </div>
        {isHost && (
            <div className="flex flex-col md:flex-row gap-4">
              <button onClick={() => socket.emit(room.gameData?.mode === 'barra' ? 'host_start_barra' : 'host_start_mafia', { code })} className="btn-clean font-kufi bg-red-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105 transition-transform">
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

  // --- HOROOF (تحدي الحروف) ---
  if (room.state === 'horoof_lobby') {
    return <HoroofLobby room={room} socket={socket} onBack={onBack} isHost={isHost} />;
  }

  if (room.state === 'horoof_playing') {
    return <HoroofBoardView room={room} socket={socket} onBack={onBack} isHost={isHost} />;
  }

  if (room.state === 'horoof_winner') {
    return <HoroofWinnerView room={room} socket={socket} isHost={isHost} onBack={onBack} />;
  }

  // --- ADED (عدّد - مين يعدد أكثر) ---
  if (room.state === 'aded_playing') {
    return <AdedGameView room={room} socket={socket} onBack={onBack} isHost={isHost} />;
  }

  // --- BARRA AL SALFA ---
  if (room.state === 'barra_playing') {
    const order = room.gameData.questionOrder;
    const currentIdx = room.gameData.currentQuestion || 0;
    const isDone = currentIdx >= order.length;
    const isBad = roleData.type === 'spy';

    return (
      <main className="fade-screen relative flex min-h-[100dvh] flex-col bg-black">
        {/* PUBLIC TOP HALF */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center border-b border-white/10 bg-white/5 relative">
          <h1 className="font-kufi text-2xl sm:text-4xl font-bold mb-3 text-white">وقت الأسئلة!</h1>
          {!isDone ? (
            <div className="w-full max-w-2xl flex flex-col items-center winner-explosion" key={currentIdx}>
              <div className="text-xs sm:text-sm font-bold text-purple-300 mb-4 bg-purple-950/60 border border-purple-500/40 px-3.5 py-1 rounded-full shadow-sm">
                سؤال {currentIdx + 1} من {order.length}
              </div>
              <p className="text-gray-400 mb-3 font-bold text-sm sm:text-base">الدور الآن على:</p>
              <div className="flex items-center justify-center gap-3 sm:gap-6 font-black mb-6 w-full max-w-lg">
                 <span className="text-xl sm:text-3xl md:text-4xl text-blue-400 flex-1 text-end truncate">{order[currentIdx].asker}</span>
                 <div className="flex flex-col items-center justify-center bg-black/50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-white/10">
                   <span className="text-gray-300 text-xs sm:text-sm font-bold">يسأل</span>
                   <span className="text-purple-400 text-base sm:text-2xl">➔</span>
                 </div>
                 <span className="text-xl sm:text-3xl md:text-4xl text-pink-400 flex-1 text-start truncate">{order[currentIdx].answerer}</span>
              </div>
              {isHost && (
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => socket.emit('host_next_question', { code })} className="btn-clean font-kufi bg-gradient-to-b from-[#2e1254] via-[#431b7a] to-[#250d45] hover:from-[#3b176d] hover:to-[#2e1056] text-white border border-purple-400/40 px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base font-bold shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:scale-105 transition-all">
                    {currentIdx === order.length - 1 ? 'إنهاء وبدء التصويت' : 'السؤال التالي'}
                  </button>
                  <button onClick={() => socket.emit('host_start_voting', { code })} className="btn-clean font-kufi bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all">
                    تخطي وبدء التصويت
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="winner-explosion">
              <h2 className="text-2xl sm:text-3xl text-white font-bold mb-4">انتهت كل الأسئلة!</h2>
              {isHost && (
                <button onClick={() => socket.emit('host_start_voting', { code })} className="btn-clean font-kufi pulse-glow-red bg-red-500 text-white px-8 py-3.5 rounded-2xl text-lg font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                  انتقل للتصويت
                </button>
              )}
            </div>
          )}
        </div>

        {/* PRIVATE BOTTOM HALF */}
        <div className="p-6 pb-8 flex flex-col items-center justify-center bg-black">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-white/10 text-center">
            <h3 className="text-sm text-gray-400 font-bold mb-4">دورك السري (لا توريه أحد):</h3>
            {showRole ? (
              <div className={`border rounded-xl p-6 mb-4 winner-explosion ${isBad ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
                <h1 className="font-kufi text-2xl font-black mb-1">{roleData.role}</h1>
                <p className="text-xs font-bold opacity-80">{roleData.hint}</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
                <h1 className="font-kufi text-2xl font-black text-white/20">مخفي</h1>
              </div>
            )}
            <button 
              onPointerDown={() => setShowRole(true)} onPointerUp={() => setShowRole(false)} onPointerLeave={() => setShowRole(false)}
              className="w-full flex justify-center items-center gap-2 py-4 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-white transition-all"
            >
              {showRole ? <EyeOff size={20} /> : <Eye size={20} />} {showRole ? 'ارفع اصبعك للإخفاء' : 'علق هنا عشان تشوف'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (room.state === 'barra_voting') {
    const votesCount = Object.keys(room.gameData.votes).length;
    return (
      <main className="fade-screen relative flex min-h-[100dvh] flex-col bg-black">
        {/* PUBLIC TOP HALF */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-white/10 bg-white/5">
          <h1 className="font-kufi text-4xl font-bold mb-4 text-red-400">وقت التصويت!</h1>
          <div className="text-6xl font-black text-white mb-6">{votesCount} <span className="text-3xl text-white/30">/ {room.players.length}</span></div>
          {isHost && (
            <button onClick={() => socket.emit('host_reveal_results', { code })} disabled={votesCount === 0} className="btn-clean font-kufi bg-[#7c3aed] hover:bg-[#6d28d9] text-white border border-purple-400/40 px-8 py-3 rounded-2xl text-lg font-bold shadow-[0_0_20px_rgba(168,85,247,0.35)] disabled:opacity-50">
              كشف النتائج
            </button>
          )}
        </div>

        {/* PRIVATE BOTTOM HALF */}
        <div className="p-6 pb-8 flex flex-col items-center justify-start bg-black overflow-y-auto max-h-[50vh]">
          <div className="w-full max-w-sm">
            <h3 className="text-gray-400 font-bold mb-4 text-center">مين تتوقع إنه برا السالفة؟</h3>
            <div className="grid grid-cols-2 gap-3">
              {playersToVote.map((p: any) => (
                <button key={p.id} onClick={() => castVote(p.id)} className={`pop-in-bouncy card-vibrate py-4 px-4 rounded-xl font-bold text-sm transition-all ${votedFor === p.id ? 'bg-red-500 text-white scale-105' : 'bg-white/10 text-gray-300 border border-white/5 hover:bg-white/20'}`}>
                  {p.name}
                </button>
              ))}
            </div>
            {votedFor && <p className="mt-6 text-green-400 font-bold text-center winner-explosion">تم تسجيل تصويتك!</p>}
          </div>
        </div>
      </main>
    );
  }

  
  if (room.state === 'barra_spy_guess') {
    const isSpyMe = room.gameData.spyId === socket.id;
    const spy = room.players.find((p:any) => p.id === room.gameData.spyId);
    const allOptions = (room.gameData.spyOptions && room.gameData.spyOptions.length > 0) ? room.gameData.spyOptions : [room.gameData.word];
    const spyCaught = room.gameData.spyCaught;

    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-6 bg-black text-center">
        <h1 className="font-kufi text-3xl sm:text-5xl font-bold mb-3 sm:mb-4 text-purple-400 pop-in-bouncy">
          {spyCaught ? 'صادوك يا اللي برا السالفة!' : 'انتهى التصويت! دور اللي برا السالفة'}
        </h1>
        <div className="text-lg sm:text-2xl text-gray-300 mb-6">
          اللي برا السالفة هو: <span className="text-purple-300 font-bold">{spy?.name} {isSpyMe && '(أنت)'}</span>
        </div>
        
        {isSpyMe ? (
          <div className="w-full max-w-xl fade-in-up bg-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-purple-500/30">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">عندك فرصة لتخمين السالفة!</h2>
            <p className="text-xs sm:text-sm text-gray-400 mb-6">التصنيف: <span className="text-purple-300 font-bold">{room.gameData.category}</span> — خمن الكلمة الصح:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {allOptions.map((opt: string) => (
                <button 
                  key={opt} 
                  onClick={() => socket.emit('spy_guess_word', { code, word: opt })} 
                  className="p-3 sm:p-4 rounded-xl font-bold text-white bg-gradient-to-b from-[#2e1254] via-[#431b7a] to-[#250d45] hover:from-[#3b176d] hover:to-[#2e1056] border border-purple-400/40 hover:scale-105 active:scale-95 transition-all shadow-md text-sm sm:text-base"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-lg sm:text-xl text-purple-300 font-bold animate-pulse bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
            {spy?.name} قاعد يحاول يخمن وش السالفة...
          </div>
        )}
      </main>
    );
  }

  if (room.state === 'barra_results') {
    const spy = room.players.find((p:any) => p.id === room.gameData.spyId);
    const isSpyMe = room.gameData.spyId === socket.id;
    const spyGuessedCorrect = room.gameData.spyGuessedCorrectly;
    const spyWon = room.gameData.spyWon;

    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-6 bg-black text-center">
        <h1 className="winner-explosion font-kufi text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 text-white">
          {spyWon ? <span className="text-purple-400">فاز اللي برا السالفة!</span> : <span className="text-green-400">فاز الشعب!</span>}
        </h1>
        
        <div className="w-full max-w-md bg-white/5 p-5 sm:p-8 rounded-3xl border border-white/10 flex flex-col gap-4 mb-6">
          <div>
            <div className="text-xs sm:text-sm text-gray-400 mb-1">اللي كان برا السالفة:</div>
            <div className="text-2xl sm:text-4xl font-black text-purple-300">{spy?.name} {isSpyMe && '(أنت)'}</div>
          </div>
          
          <div className="border-t border-white/10 pt-3">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">السالفة كانت:</div>
            <div className="text-xl sm:text-2xl font-bold text-green-400">{room.gameData.word}</div>
          </div>

          {room.gameData.spyGuessedWord && (
            <div className="border-t border-white/10 pt-3">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">تخمين اللي برا السالفة:</div>
              <div className={`text-base sm:text-lg font-bold ${spyGuessedCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {room.gameData.spyGuessedWord} {spyGuessedCorrect ? '(صحيح)' : '(خطأ)'}
              </div>
            </div>
          )}
        </div>
        
        {isHost && (
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button onClick={() => socket.emit('host_start_barra', { code })} className="btn-clean font-kufi bg-gradient-to-b from-[#2e1254] via-[#431b7a] to-[#250d45] hover:from-[#3b176d] hover:to-[#2e1056] text-white border border-purple-400/40 px-8 py-3.5 rounded-2xl text-base sm:text-lg font-bold shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:scale-105 transition-transform">
              العب راوند جديد
            </button>
            <button onClick={() => socket.emit('host_back_to_lobby', { code })} className="btn-clean font-kufi bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-2xl text-base sm:text-lg font-bold hover:bg-white/20 transition-colors">
              العودة للوبي
            </button>
          </div>
        )}
      </main>
    );
  }

  // --- MAFIA ---
  
  if (room.state === 'codenames_lobby') {
    const myTeam = room.gameData?.teams?.[socket.id];
    const redSpymaster = room.gameData?.spymasters?.red;
    const blueSpymaster = room.gameData?.spymasters?.blue;
    
    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col p-4 sm:p-6 items-center bg-black">
        <h1 className="font-kufi text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-8 pop-in-bouncy">تجهيز كود نيمز</h1>
        
        <div className="flex flex-col md:flex-row gap-4 sm:gap-8 w-full max-w-4xl mb-6 sm:mb-12 fade-in-up">
          {/* Red Team */}
          <div className="flex-1 bg-red-900/20 border border-red-500/30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-red-500 mb-3 sm:mb-4">الفريق الأحمر</h2>
            <button onClick={() => socket.emit('cn_join_team', { code, team: 'red' })} className="mb-4 sm:mb-6 px-5 py-1.5 sm:px-6 sm:py-2 rounded-full bg-red-500/20 text-red-400 text-xs sm:text-sm font-bold hover:bg-red-500/40">انضم للأحمر</button>
            <div className="w-full space-y-2 sm:space-y-3">
              <div className="p-2.5 sm:p-3 bg-black/50 border border-red-500/20 rounded-xl">
                <span className="text-gray-400 text-xs sm:text-sm block mb-1">الرئيس (Spymaster)</span>
                {redSpymaster ? <span className="text-white font-bold text-sm sm:text-base">{room.players.find((p:any) => p.id === redSpymaster)?.name}</span> : <button onClick={() => socket.emit('cn_claim_spymaster', { code, team: 'red' })} className="text-red-400 font-bold text-xs bg-red-500/20 px-3 py-1 rounded-full">استلم المنصب</button>}
              </div>
              <div className="p-2.5 sm:p-3 bg-black/50 border border-red-500/20 rounded-xl min-h-[60px] sm:min-h-[100px]">
                <span className="text-gray-400 text-xs sm:text-sm block mb-1">العملاء</span>
                {room.players.filter((p:any) => room.gameData?.teams?.[p.id] === 'red' && p.id !== redSpymaster).map((p:any) => (
                  <div key={p.id} className="text-white font-bold text-xs sm:text-sm">{p.name}</div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Blue Team */}
          <div className="flex-1 bg-blue-900/20 border border-blue-500/30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-500 mb-3 sm:mb-4">الفريق الأزرق</h2>
            <button onClick={() => socket.emit('cn_join_team', { code, team: 'blue' })} className="mb-4 sm:mb-6 px-5 py-1.5 sm:px-6 sm:py-2 rounded-full bg-blue-500/20 text-blue-400 text-xs sm:text-sm font-bold hover:bg-blue-500/40">انضم للأزرق</button>
            <div className="w-full space-y-2 sm:space-y-3">
              <div className="p-2.5 sm:p-3 bg-black/50 border border-blue-500/20 rounded-xl">
                <span className="text-gray-400 text-xs sm:text-sm block mb-1">الرئيس (Spymaster)</span>
                {blueSpymaster ? <span className="text-white font-bold text-sm sm:text-base">{room.players.find((p:any) => p.id === blueSpymaster)?.name}</span> : <button onClick={() => socket.emit('cn_claim_spymaster', { code, team: 'blue' })} className="text-blue-400 font-bold text-xs bg-blue-500/20 px-3 py-1 rounded-full">استلم المنصب</button>}
              </div>
              <div className="p-2.5 sm:p-3 bg-black/50 border border-blue-500/20 rounded-xl min-h-[60px] sm:min-h-[100px]">
                <span className="text-gray-400 text-xs sm:text-sm block mb-1">العملاء</span>
                {room.players.filter((p:any) => room.gameData?.teams?.[p.id] === 'blue' && p.id !== blueSpymaster).map((p:any) => (
                  <div key={p.id} className="text-white font-bold text-xs sm:text-sm">{p.name}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isHost && (
          <button onClick={() => socket.emit('host_start_codenames', { code })} className="btn-clean font-kufi bg-[#7c3aed] hover:bg-[#6d28d9] text-white border border-purple-400/40 px-8 sm:px-12 py-3 sm:py-4 rounded-2xl text-base sm:text-xl font-bold hover:scale-105 transition-transform shadow-[0_0_25px_rgba(168,85,247,0.4)]">
            ابدأ اللعبة
          </button>
        )}
      </main>
    );
  }

  if (room.state === 'codenames_playing') {
    const gd = room.gameData || {};
    const isRedTurn = gd.turn === 'red';
    const myTeam = gd.teams?.[socket.id];
    const isMyTurn = myTeam === gd.turn;
    const isSpymaster = gd.spymasters?.red === socket.id || gd.spymasters?.blue === socket.id;
    const amIActiveSpymaster = isSpymaster && isMyTurn;
    const amIActiveOperative = !isSpymaster && isMyTurn;
    const board = gd.board || [];

    const submitClue = () => {
      if (!clueWord.trim()) return;
      socket.emit('cn_give_clue', { code, clueWord: clueWord.trim(), clueNum: Number(clueNum) || 1 });
      setClueWord('');
    };

    return (
      <main className="fade-screen flex h-[100dvh] max-h-[100dvh] flex-col p-2 sm:p-3 items-center bg-black justify-between overflow-y-auto">
        {/* Status Bar */}
        <div className={`w-full max-w-xl sm:max-w-2xl p-2 sm:p-3 rounded-xl sm:rounded-2xl flex justify-between items-center mb-1 sm:mb-2 border ${isRedTurn ? 'bg-red-950/40 border-red-500/50' : 'bg-blue-950/40 border-blue-500/50'}`}>
          <div className="text-red-400 font-bold text-sm sm:text-xl bg-black/60 px-2.5 sm:px-3.5 py-1 rounded-lg sm:rounded-xl">{gd.left?.red ?? 0}</div>
          <div className="text-center px-2">
            <div className={`text-sm sm:text-lg font-bold ${isRedTurn ? 'text-red-400' : 'text-blue-400'}`}>دور الفريق {isRedTurn ? 'الأحمر' : 'الأزرق'}</div>
            {gd.clue ? (
              <div className="text-[11px] sm:text-sm text-white mt-0.5">
                تلميحة: <span className="font-bold text-purple-300">{gd.clue.word}</span> ({gd.clue.number})
              </div>
            ) : (
              <div className="text-gray-400 text-[11px] sm:text-xs mt-0.5">بانتظار الرئيس يعطي تلميحة...</div>
            )}
          </div>
          <div className="text-blue-400 font-bold text-sm sm:text-xl bg-black/60 px-2.5 sm:px-3.5 py-1 rounded-lg sm:rounded-xl">{gd.left?.blue ?? 0}</div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full max-w-xl sm:max-w-2xl my-auto flex-1 content-center">
          {board.map((card: any, idx: number) => {
            const revealed = card.revealed;
            const seeColor = revealed || isSpymaster;
            
            let bg = "bg-gradient-to-b from-[#2e1254] via-[#3a186b] to-[#220d3f] border-purple-500/50 hover:border-purple-300 shadow-[0_4px_12px_rgba(0,0,0,0.5),0_0_10px_rgba(147,51,234,0.25)]";
            if (seeColor) {
              if (card.color === 'red') bg = 'bg-red-600 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.35)]';
              else if (card.color === 'blue') bg = 'bg-blue-600 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.35)]';
              else if (card.color === 'black') bg = 'bg-neutral-900 border-neutral-700 shadow-inner';
              else bg = 'bg-amber-900/80 border-amber-600/70';
            }

            return (
              <button 
                key={idx} 
                disabled={revealed || !amIActiveOperative || !gd.clue}
                onClick={() => socket.emit('cn_guess', { code, index: idx })}
                className={`flex items-center justify-center p-1 sm:p-1.5 rounded-lg sm:rounded-xl border transition-all min-h-[38px] sm:min-h-[48px] md:min-h-[56px] ${bg} ${!revealed && amIActiveOperative && gd.clue ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default opacity-95'}`}
              >
                <span className={`font-bold text-[10px] sm:text-xs md:text-sm leading-tight break-words text-center text-white ${revealed ? 'opacity-35 scale-95' : ''}`}>
                  {card.word}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="w-full max-w-xl sm:max-w-2xl flex justify-center gap-2 pb-14 sm:pb-4 mt-1">
          {amIActiveSpymaster && !gd.clue && (
            <div className="flex gap-2 w-full max-w-md bg-white/5 p-1.5 sm:p-2 rounded-xl border border-white/10">
              <input type="text" placeholder="كلمة التلميح" value={clueWord} onChange={e=>setClueWord(e.target.value)} className="flex-1 bg-black/60 text-white text-xs sm:text-sm rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-400 border border-transparent" />
              <input type="number" min="1" max="9" value={clueNum} onChange={e=>setClueNum(parseInt(e.target.value) || 1)} className="w-12 sm:w-16 bg-black/60 text-white text-xs sm:text-sm rounded-lg px-1.5 py-1.5 text-center outline-none border border-transparent" />
              <button onClick={submitClue} className="bg-gradient-to-b from-[#2e1254] via-[#431b7a] to-[#250d45] hover:from-[#3b176d] hover:to-[#2e1056] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-5 py-1.5 rounded-lg border border-purple-400/40 transition-all">أرسل</button>
            </div>
          )}
          
          {amIActiveOperative && gd.clue && (
            <button onClick={() => socket.emit('cn_end_turn', { code })} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm px-6 sm:px-8 py-2 rounded-xl hover:scale-105 transition-transform">
              إنهاء الدور
            </button>
          )}
        </div>
      </main>
    );
  }

  if (room.state === 'codenames_winner') {
    const winnerIsRed = room.gameData?.winner === 'red';
    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col p-4 sm:p-6 items-center justify-center text-center bg-black">
        <h1 className="winner-explosion font-kufi text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 text-white">انتهت اللعبة!</h1>
        <div className="winner-explosion text-2xl sm:text-4xl md:text-5xl font-black mb-8 sm:mb-12 p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-white/10 border border-white/20">
          <span className={winnerIsRed ? "text-red-500" : "text-blue-500"}>
            فاز الفريق {winnerIsRed ? 'الأحمر' : 'الأزرق'}!
          </span>
        </div>
        {isHost && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-sm">
            <button onClick={() => socket.emit('host_start_codenames_lobby', { code })} className="btn-clean font-kufi bg-green-500 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-xl font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform">
              العب راوند جديد
            </button>
            <button onClick={() => socket.emit('host_back_to_lobby', { code })} className="btn-clean font-kufi bg-white/10 text-white border border-white/20 px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-xl font-bold hover:bg-white/20 transition-colors">
              العودة للوبي
            </button>
          </div>
        )}
      </main>
    );
  }

  if (room.state === 'mafia_roles') {
    const isBad = roleData.type === 'mafia';
    return (
      <main className="fade-screen relative flex min-h-[100dvh] flex-col bg-black">
        {/* PUBLIC TOP HALF */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-white/10 bg-white/5">
          <h1 className="font-kufi text-4xl font-bold mb-4 text-white">توزيع الأدوار</h1>
          <p className="text-xl text-gray-400 mb-8">الكل يشوف دوره الحين... تأكد محد يشوف شاشتك!</p>
          {isHost && (
            <button onClick={() => socket.emit('host_start_first_night', { code })} className="btn-clean font-kufi bg-blue-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-transform">
              الكل شاف دوره؟ ابدأ الليل
            </button>
          )}
        </div>

        {/* PRIVATE BOTTOM HALF */}
        <div className="p-6 pb-8 flex flex-col items-center justify-center bg-black">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-white/10 text-center">
            <h3 className="text-sm text-gray-400 font-bold mb-4">دورك السري (لا توريه أحد):</h3>
            {showRole ? (
              <div className={`border rounded-xl p-6 mb-4 winner-explosion ${isBad ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
                <h1 className="font-kufi text-2xl font-black mb-1">{roleData.role}</h1>
                <p className="text-xs font-bold opacity-80">{roleData.hint}</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
                <h1 className="font-kufi text-2xl font-black text-white/20">مخفي</h1>
              </div>
            )}
            <button 
              onPointerDown={() => setShowRole(true)} onPointerUp={() => setShowRole(false)} onPointerLeave={() => setShowRole(false)}
              className="w-full flex justify-center items-center gap-2 py-4 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-white transition-all"
            >
              {showRole ? <EyeOff size={20} /> : <Eye size={20} />} {showRole ? 'ارفع اصبعك للإخفاء' : 'علق هنا عشان تشوف'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (room.state === 'mafia_night') {
    const mafiaDone = !!room.gameData.nightActions.mafiaTarget;
    const doctorExists = !!room.gameData.doctorId && room.gameData.alive[room.gameData.doctorId];
    const doctorDone = doctorExists ? !!room.gameData.nightActions.doctorTarget : true;

    return (
      <main className="fade-screen relative flex min-h-[100dvh] flex-col bg-black">
        {/* PUBLIC TOP HALF */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-white/10 bg-white/5">
          <h1 className="font-kufi text-5xl font-bold mb-4 text-blue-400">المدينة نايمة</h1>
          <p className="text-lg text-gray-400 mb-6">المافيا والطبيب يختارون الحين...</p>
          <div className="flex gap-4 mb-8">
            <div className={`p-4 rounded-xl border text-sm font-bold ${mafiaDone ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-white/20 bg-white/5 text-gray-500'}`}>المافيا {mafiaDone ? 'جاهز' : 'ينتظر'}</div>
            <div className={`p-4 rounded-xl border text-sm font-bold ${doctorDone ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-white/20 bg-white/5 text-gray-500'}`}>الطبيب {doctorDone ? 'جاهز' : 'ينتظر'}</div>
          </div>
          {isHost && (
            <button onClick={() => socket.emit('host_end_night', { code })} className="btn-clean font-kufi bg-gradient-to-b from-[#2e1254] via-[#431b7a] to-[#250d45] hover:from-[#3b176d] hover:to-[#2e1056] text-white border border-purple-400/40 px-8 py-3 rounded-2xl font-bold shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:scale-105 transition-all">إنهاء الليلة</button>
          )}
        </div>

        {/* PRIVATE BOTTOM HALF */}
        <div className="p-6 pb-8 flex flex-col items-center justify-start bg-black overflow-y-auto max-h-[50vh]">
          <div className="w-full max-w-sm text-center">
            {isDead ? (
              <div className="text-red-500 font-bold mt-10">
                <h2 className="text-4xl font-black mb-2">أنت ميت</h2>
                <p className="text-gray-400">تابع اللعب عالصامت</p>
              </div>
            ) : roleData.type === 'mafia' || roleData.type === 'doctor' ? (
              <>
                <h3 className="font-kufi text-xl font-bold mb-4 text-white">{roleData.type === 'mafia' ? 'تبي تقتل مين؟' : 'تبي تعالج مين؟'}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {playersToVote.map((p: any) => (
                    <button key={p.id} onClick={() => castMafiaAction(p.id)} className={`pop-in-bouncy card-vibrate py-4 px-4 rounded-xl font-bold text-sm transition-all ${votedFor === p.id ? 'bg-red-500 text-white scale-105' : 'bg-white/10 text-gray-300 border border-white/5 hover:bg-white/20'}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
                {votedFor && <p className="mt-6 text-green-400 font-bold winner-explosion">تم! بانتظار الباقين.</p>}
              </>
            ) : (
              <div className="text-gray-500 font-bold mt-10">
                <h2 className="text-3xl font-black mb-2 text-gray-400">أنت مواطن</h2>
                <p>غمض عيونك ولا تتكلم</p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (room.state === 'mafia_day_reveal') {
    return (
      <main className="fade-screen relative flex min-h-[100dvh] flex-col bg-black">
        {/* PUBLIC TOP HALF */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-white/10 bg-white/5">
          <h1 className="font-kufi text-5xl font-bold mb-6 text-yellow-500">أشرقت الشمس</h1>
          <div className="glass-panel p-6 rounded-3xl border border-white/10 w-full max-w-lg mb-6 winner-explosion">
            {dayData?.killedName ? (
              <>
                <h3 className="text-gray-400 mb-2">الضحية الليلة:</h3>
                <div className="text-4xl font-black text-red-500">{dayData.killedName}</div>
              </>
            ) : (
              <h3 className="text-3xl font-bold text-green-400">الحمد لله!<br/>محد مات اليوم</h3>
            )}
          </div>
          <DiscussionTimer duration={60} />
          {isHost && (
            <button onClick={() => socket.emit('host_start_mafia_voting', { code })} className="btn-clean font-kufi bg-red-500 text-white px-8 py-3 rounded-2xl text-lg font-bold mt-6 shadow-[0_0_15px_rgba(239,68,68,0.4)]">تخطي الوقت وبدء التصويت</button>
          )}
        </div>

        {/* PRIVATE BOTTOM HALF */}
        <div className="p-6 pb-8 flex flex-col items-center justify-center bg-black">
           {isDead ? (
             <div className="text-center text-red-500 font-bold">
               <h2 className="text-3xl font-black mb-2">أنت ميت</h2>
               <p className="text-gray-400">تابع المحاكمة بصمت</p>
             </div>
           ) : (
             <div className="text-center">
               <h3 className="text-2xl font-bold text-white mb-2">وقت السوالف!</h3>
               <p className="text-gray-400">تناقشوا مين المافيا ودافع عن نفسك.</p>
             </div>
           )}
        </div>
      </main>
    );
  }

  if (room.state === 'mafia_voting') {
    const votesCount = Object.keys(room.gameData.votes).length;
    const aliveCount = room.players.filter((p:any) => room.gameData.alive[p.id]).length;
    
    return (
      <main className="fade-screen relative flex min-h-[100dvh] flex-col bg-black">
        {/* PUBLIC TOP HALF */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-white/10 bg-white/5">
          <h1 className="font-kufi text-4xl font-bold mb-4 text-red-400">تصويت الإعدام!</h1>
          <div className="text-6xl font-black text-white mb-6">{votesCount} <span className="text-3xl text-white/30">/ {aliveCount}</span></div>
          {isHost && (
            <button onClick={() => socket.emit('host_execute_mafia', { code })} disabled={votesCount === 0} className="btn-clean font-kufi bg-[#7c3aed] hover:bg-[#6d28d9] text-white border border-purple-400/40 px-8 py-3 rounded-2xl text-lg font-bold shadow-[0_0_20px_rgba(168,85,247,0.35)] disabled:opacity-50">
              إعدام الأعلى تصويتاً
            </button>
          )}
        </div>

        {/* PRIVATE BOTTOM HALF */}
        <div className="p-6 pb-8 flex flex-col items-center justify-start bg-black overflow-y-auto max-h-[50vh]">
          <div className="w-full max-w-sm">
            {isDead ? (
               <div className="text-center text-red-500 font-bold mt-10">أنت ميت ولا يمكنك التصويت</div>
            ) : (
              <>
                <h3 className="text-gray-400 font-bold mb-4 text-center">مين تتوقع المافيا؟ (اختر للإعدام)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {playersToVote.map((p: any) => (
                    <button key={p.id} onClick={() => castVote(p.id)} className={`pop-in-bouncy card-vibrate py-4 px-4 rounded-xl font-bold text-sm transition-all ${votedFor === p.id ? 'bg-red-500 text-white scale-105' : 'bg-white/10 text-gray-300 border border-white/5 hover:bg-white/20'}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
                {votedFor && <p className="mt-6 text-green-400 font-bold text-center winner-explosion">تم تسجيل تصويتك!</p>}
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (room.state === 'mafia_execution_reveal') {
    return (
      <main className="fade-screen relative flex min-h-[100dvh] flex-col bg-black">
        {/* PUBLIC TOP HALF */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-white/10 bg-white/5">
          <h1 className="font-kufi text-5xl font-bold mb-6 text-red-500">تم الإعدام</h1>
          <div className="glass-panel p-8 rounded-3xl border border-white/10 w-full max-w-sm mb-8 winner-explosion">
             <h3 className="text-gray-400 mb-2">الشخص اللي انطرد:</h3>
             <div className="text-4xl font-black text-red-500">{dayData?.executedName || 'لا أحد'}</div>
          </div>
          {isHost && (
            <button onClick={() => socket.emit('host_next_night', { code })} className="btn-clean font-kufi bg-blue-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105">
              العودة لليل
            </button>
          )}
        </div>

        {/* PRIVATE BOTTOM HALF */}
        <div className="p-6 pb-8 flex flex-col items-center justify-center bg-black">
           {isDead ? (
             <div className="text-center text-red-500 font-bold">
               <h2 className="text-3xl font-black">أنت ميت</h2>
             </div>
           ) : (
             <div className="text-center">
               <h3 className="text-2xl font-bold text-gray-400">تجهز لليل القادم...</h3>
             </div>
           )}
        </div>
      </main>
    );
  }

  return (
    <main className="fade-screen flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-black text-center text-white">
      <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white mx-auto mb-4 animate-spin" />
      <p className="text-gray-400 font-bold mb-2">جاري مزامنة حالة اللعبة...</p>
      <p className="text-xs text-gray-600 mb-6 font-mono">الحالة: {room?.state || 'غير محدد'}</p>
      <button
        onClick={() => { socket.disconnect(); onBack(); }}
        className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-bold text-gray-300 transition-colors"
      >
        العودة للرئيسية
      </button>
    </main>
  );
}

export function JoinRoom({ onBack }: { onBack: () => void }) {
  return <UnifiedRoom onBack={onBack} initialHost={false} />;
}

export function HostLobby({ onBack }: { onBack: () => void }) {
  return <UnifiedRoom onBack={onBack} initialHost={true} />;
}
