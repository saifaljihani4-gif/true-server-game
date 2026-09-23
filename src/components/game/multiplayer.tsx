import { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import { ChevronRight, Users, Eye, EyeOff, Trophy, Crown } from 'lucide-react';

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
      <main className="fade-screen flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-black">
        <button onClick={onBack} className="absolute start-5 top-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">
          <ChevronRight size={15} /> رجوع
        </button>
        <form onSubmit={initialHost ? handleCreateAndJoin : handleJoinOnly} className="w-full max-w-sm flex flex-col gap-5 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="text-center mb-2"><h2 className="font-kufi text-3xl font-bold text-white">{initialHost ? 'إنشاء روم جديد' : 'الانضمام لروم'}</h2></div>
          {error && <div className="bg-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm font-bold border border-red-500/30 text-center">{error}</div>}
          
          {!initialHost && (
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={4} placeholder="كود الروم" className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-center text-3xl font-bold tracking-widest text-white uppercase focus:outline-none focus:border-white/30 transition-colors" required />
          )}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={12} placeholder="اسمك" className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-xl font-bold text-center text-white focus:outline-none focus:border-white/30 transition-colors" required dir="auto" />
          
          <button type="submit" className="mt-2 w-full bg-white text-black font-kufi font-bold text-xl py-4 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-transform">
            {initialHost ? 'إنشاء ودخول' : 'ادخل الروم'}
          </button>
        </form>
      </main>
    );
  }

  // --- 2. LOBBY SCREEN ---
  if (room.state === 'lobby') {
    return (
      <main className="fade-screen relative flex min-h-[100dvh] flex-col p-6">
        <header className="flex justify-between items-center mb-8">
          <button onClick={() => { socket.disconnect(); onBack(); }} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
            <ChevronRight size={15} /> خروج
          </button>
          <div className="flex items-center gap-3 px-6 py-2 bg-white/10 border border-white/20 rounded-full">
            <span className="text-sm font-bold text-gray-400">كود الروم:</span>
            <span className="text-2xl font-black tracking-widest text-white">{room.code}</span>
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
                  <button onClick={() => socket.emit('host_start_codenames_lobby', { code: room.code })} disabled={room.players.length < 1} className="py-4 px-5 rounded-2xl font-bold transition-all bg-white text-black hover:scale-105 disabled:opacity-50 flex justify-between items-center">
                    كود نيمز <span className="w-3 h-3 rounded-full bg-blue-500" />
                  </button>

                </div>
                {room.players.length < 3 && <p className="text-sm text-red-400 mt-4 text-center font-bold">تحتاج 3 لاعبين على الأقل لبدء اللعبة</p>}
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
  if (room.gameData?.winner) {
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

  // --- BARRA AL SALFA ---
  if (room.state === 'barra_playing') {
    const order = room.gameData.questionOrder;
    const currentIdx = room.gameData.currentQuestion || 0;
    const isDone = currentIdx >= order.length;
    const isBad = roleData.type === 'spy';

    return (
      <main className="fade-screen relative flex min-h-[100dvh] flex-col bg-black">
        {/* PUBLIC TOP HALF */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-white/10 bg-white/5 relative">
          <h1 className="font-kufi text-3xl md:text-5xl font-bold mb-8 text-white">وقت الأسئلة!</h1>
          {!isDone ? (
            <div className="w-full max-w-2xl flex flex-col items-center winner-explosion" key={currentIdx}>
              <p className="text-gray-400 mb-4 font-bold text-lg">الدور الآن على:</p>
              <div className="flex items-center justify-center gap-4 md:gap-8 font-black mb-8 w-full">
                 <span className="text-3xl md:text-5xl text-blue-400 flex-1 text-end truncate">{order[currentIdx].asker}</span>
                 <div className="flex flex-col items-center justify-center bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                   <span className="text-gray-400 text-sm md:text-lg font-bold">يسأل</span>
                   <span className="text-gray-500 text-xl md:text-3xl">➔</span>
                 </div>
                 <span className="text-3xl md:text-5xl text-pink-400 flex-1 text-start truncate">{order[currentIdx].answerer}</span>
              </div>
              {isHost && (
                <button onClick={() => socket.emit('host_next_question', { code })} className="btn-clean font-kufi bg-white text-black px-8 py-3 rounded-2xl text-lg font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {currentIdx === order.length - 1 ? 'إنهاء الأسئلة' : 'السؤال التالي'}
                </button>
              )}
            </div>
          ) : (
            <div className="winner-explosion">
              <h2 className="text-3xl text-white font-bold mb-6">انتهت كل الأسئلة!</h2>
              {isHost && (
                <button onClick={() => socket.emit('host_start_voting', { code })} className="btn-clean font-kufi pulse-glow-red bg-red-500 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)]">
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
            <button onClick={() => socket.emit('host_reveal_results', { code })} disabled={votesCount === 0} className="btn-clean font-kufi bg-white text-black px-8 py-3 rounded-2xl text-lg font-bold disabled:opacity-50">
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

  if (room.state === 'barra_results') {
    const spy = room.players.find((p:any) => p.id === room.gameData.spyId);
    const isSpyMe = room.gameData.spyId === socket.id;
    return (
      <main className="fade-screen flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-black text-center">
        <h1 className="winner-explosion font-kufi text-4xl md:text-5xl font-bold mb-6 text-white">{room.gameData.spyWon ? <span className="text-red-500">الجاسوس فاز!</span> : <span className="text-green-400">الشعب فاز!</span>}</h1>
          {room.gameData.spyGuessedWord && <div className="text-xl text-gray-300 mb-4">تخمين الجاسوس كان: <span className={room.gameData.spyWon ? "text-red-400" : "text-gray-500"}>{room.gameData.spyGuessedWord}</span></div>}
          <h2 className="font-kufi text-2xl font-bold mb-4 text-gray-400">اللي كان برا السالفة هو:</h2>
        <div className="text-5xl md:text-7xl font-black text-red-400 mb-8 winner-explosion">{spy?.name} {isSpyMe && '(أنت)'}</div>
        <div className="text-2xl text-gray-300 mb-12 bg-white/5 p-6 rounded-3xl border border-white/10">السالفة كانت: <span className="text-green-400 font-bold">{room.gameData.word}</span></div>
        
        {isHost && (
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <button onClick={() => socket.emit('host_start_barra', { code })} className="btn-clean font-kufi bg-blue-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-transform">
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

  // --- MAFIA ---
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
            <button onClick={() => socket.emit('host_end_night', { code })} className="btn-clean font-kufi bg-white text-black px-8 py-3 rounded-2xl font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]">إنهاء الليل</button>
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
            <button onClick={() => socket.emit('host_execute_mafia', { code })} disabled={votesCount === 0} className="btn-clean font-kufi bg-white text-black px-8 py-3 rounded-2xl text-lg font-bold disabled:opacity-50">
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

  return null;
}

export function JoinRoom({ onBack }: { onBack: () => void }) {
  return <UnifiedRoom onBack={onBack} initialHost={false} />;
}

export function HostLobby({ onBack }: { onBack: () => void }) {
  return <UnifiedRoom onBack={onBack} initialHost={true} />;
}
