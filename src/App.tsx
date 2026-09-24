import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center bg-black text-white">
          <h2 className="font-kufi text-2xl font-bold mb-4 text-red-400">حدث خطأ غير متوقع</h2>
          <p className="text-gray-400 text-sm max-w-md mb-6">{this.state.error?.message || 'تعذر عرض الصفحة'}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-transform"
          >
            إعادة تحميل اللعبة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  DEFAULT_PRIZES, fillDialectCard, makeCards, modeMeta, randomPunishment, pick,
  type Card, type Intensity, type Mode,
} from '@/game/data';
import { sfx } from '@/game/sfx';
import { Categories, Game, Home } from '@/components/game/screens';
import { JoinRoom, HostLobby } from '@/components/game/multiplayer';
import type { Fate } from '@/components/game/modals';

type Screen = 'home' | 'categories' | 'game' | 'join' | 'host';

const queryClient = new QueryClient();
const SCORES_KEY = 'eighty-two-scores';
const PRIZES_KEY = 'eighty-two-prizes';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* التخزين غير متاح */
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<Mode>('dialects');
  const [cards, setCards] = useState<Card[]>([]);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [setup, setSetup] = useState(false);
  const [active, setActive] = useState<Card | null>(null);
  const [timer, setTimer] = useState(30);
  const [timerTotal, setTimerTotal] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [fate, setFate] = useState<Fate | null>(null);
  const [scores, setScores] = useState<Record<string, number>>(() => load(SCORES_KEY, {}));
  const [celebration, setCelebration] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [flippingId, setFlippingId] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const [dealing, setDealing] = useState(false);
  const [muted, setMuted] = useState(() => sfx.isMuted());

  // الجائزة والعقوبة: تتحددان في غرفة اللعب قبل ما تبدأ المباراة
  const [prize, setPrize] = useState('');
  const [customPrizes, setCustomPrizes] = useState<string[]>(() => load<string[]>(PRIZES_KEY, []));
  const [intensity, setIntensity] = useState<Intensity>('medium');
  const prizes = useMemo(() => [...DEFAULT_PRIZES, ...customPrizes], [customPrizes]);

  useEffect(() => { save(SCORES_KEY, scores); }, [scores]);
  useEffect(() => { save(PRIZES_KEY, customPrizes); }, [customPrizes]);

  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => setTimer(t => {
      if (t <= 1) { setTimerActive(false); return 0; }
      return t - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [timerActive]);

  // تكتكة آخر 5 ثواني + صافرة النهاية
  const prevTimer = useRef(timer);
  useEffect(() => {
    if (timerActive && timer > 0 && timer <= 5) sfx.tick();
    if (timer === 0 && prevTimer.current > 0 && active) sfx.buzz();
    prevTimer.current = timer;
  }, [timer, timerActive, active]);

  const resetTimer = (forMode: Mode = mode) => {
    const seconds = modeMeta(forMode).time;
    setTimerActive(false);
    setTimer(seconds);
    setTimerTotal(seconds);
  };
  const addTime = () => {
    setTimer(t => t + 10);
    setTimerTotal(t => Math.max(t, timer + 10));
  };

  const chooseMode = (next: Mode) => {
    setMode(next);
    setCards(makeCards(next));
    setP1(''); setP2('');
    setSetupError('');
    setRound(1);
    setScreen('game');
    setSetup(true);
    resetTimer(next);
  };

  /* ---- الجوائز ---- */
  const selectPrize = (value: string) => { sfx.select(); setPrize(value); setSetupError(''); };
  const addPrize = (raw: string) => {
    const value = raw.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (!value) return;
    const exists = prizes.find(p => p.toLocaleLowerCase() === value.toLocaleLowerCase());
    if (!exists) setCustomPrizes(list => [...list, value].slice(-8));
    sfx.select();
    setPrize(exists ?? value);
    setSetupError('');
  };
  const removePrize = (value: string) => {
    setCustomPrizes(list => list.filter(p => p !== value));
    if (prize === value) setPrize('');
  };
  const randomPrize = () => { sfx.select(); setPrize(pick(prizes)); setSetupError(''); };

  const startRound = () => {
    const first = p1.trim();
    const second = p2.trim();
    if (!first) { setSetupError('اكتب اسم اللاعب الأول عشان تبدأ.'); return; }
    if (!prize) { setSetupError('اختر الجائزة قبل ما تبدأ المباراة.'); return; }
    if (second && first.toLocaleLowerCase() === second.toLocaleLowerCase()) { setSetupError('استخدم اسمين مختلفين في المواجهة.'); return; }
    setP1(first);
    setP2(second);
    setSetupError('');
    setScores(s => ({ ...s, [first]: s[first] || 0, ...(second ? { [second]: s[second] || 0 } : {}) }));
    setSetup(false);
    if (round === 1) {
      setDealing(true);
      window.setTimeout(() => setDealing(false), 1200);
    }
  };

  const pickCard = (card: Card) => {
    if (card.used || active || setup || flippingId !== null) return;
    const next = mode === 'dialects' ? fillDialectCard(card, Boolean(p2.trim())) : { ...card };
    sfx.flip();
    setCards(cs => cs.map(c => (c.id === card.id ? { ...next, flipped: true } : c)));
    setFlippingId(card.id);
    window.setTimeout(() => {
      setActive(next);
      setFlippingId(null);
    }, 500);
    setShowAnswer(false);
  };

  const declareWinner = (result: 1 | 2 | 'win' | 'lose') => {
    setTimerActive(false);
    const winner = result === 1 ? p1 : result === 2 ? p2 : result === 'win' ? p1 : '';
    const loser = result === 1 ? p2 : result === 2 ? p1 : result === 'lose' ? p1 : '';
    if (winner) {
      setScores(s => ({ ...s, [winner]: (s[winner] || 0) + 1 }));
      setCelebration(true);
      window.setTimeout(() => setCelebration(false), 2100);
      sfx.win();
    } else {
      sfx.lose();
    }
    setFate({
      winner,
      loser,
      prize: winner ? prize : '',
      punishment: loser ? randomPunishment(intensity) : '',
    });
    if (active) setCards(cs => cs.map(c => (c.id === active.id ? { ...c, used: true } : c)));
  };

  const closeFate = () => {
    setFate(null);
    setActive(null);
    resetTimer();
    setSetupError('');
    setRound(v => v + 1);
    setSetup(true);
  };
  const cancelActive = () => {
    if (!active) return;
    setCards(cs => cs.map(c => (c.id === active.id ? { ...c, flipped: false } : c)));
    setActive(null);
    setShowAnswer(false);
    resetTimer();
  };
  const exitGame = () => { setActive(null); setFate(null); resetTimer(); setScreen('categories'); };
  const toggleMute = () => { const next = !muted; sfx.setMuted(next); setMuted(next); if (!next) sfx.select(); };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <div className="stage-app selection:bg-white/20">
            <div className="global-bg" /><div className="global-overlay" /><div className="grain" />
            <div dir="ltr" className="pointer-events-none fixed bottom-4 right-6 z-50 text-[10px] font-bold uppercase tracking-[.2em] text-gray-500">By <span className="text-white">sr6h</span></div>
            {celebration && <VictoryLight />}
            {screen === 'home' && <Home onEnter={() => setScreen('categories')} onJoin={() => setScreen('join')} onHost={() => setScreen('host')} />}
            {screen === 'categories' && <Categories onBack={() => setScreen('home')} onSelect={chooseMode} />}
            {screen === 'game' && (
              <Game
                mode={mode} modeLabel={modeMeta(mode).name} round={round} dealing={dealing} cards={cards} active={active}
                setup={setup} setSetup={setSetup} p1={p1} p2={p2} setP1={setP1} setP2={setP2} scores={scores} setupError={setupError}
                prize={prize} prizes={prizes} customPrizes={customPrizes}
                onSelectPrize={selectPrize} onAddPrize={addPrize} onRemovePrize={removePrize} onRandomPrize={randomPrize}
                intensity={intensity} setIntensity={setIntensity}
                timer={timer} timerTotal={timerTotal} timerActive={timerActive}
                toggleTimer={() => setTimerActive(v => (timer > 0 ? !v : false))} addTime={addTime}
                showAnswer={showAnswer} setShowAnswer={setShowAnswer} muted={muted} onToggleMute={toggleMute}
                onExit={exitGame} onPick={pickCard} onStart={startRound} onCancelActive={cancelActive} onDeclare={declareWinner}
                fate={fate} onCloseFate={closeFate}
              />
            )}
          
            {screen === 'join' && <JoinRoom onBack={() => setScreen('home')} />}
            {screen === 'host' && <HostLobby onBack={() => setScreen('home')} />}
          </div>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function VictoryLight() {
  return (
    <div className="victory-light" aria-hidden="true">
      <div className="victory-flare" />
      <div className="victory-aura" />
      {Array.from({ length: 12 }, (_, index) => <i key={index} className="victory-spark" style={{ ['--spark-index' as string]: index }} />)}
    </div>
  );
}

export default App;
