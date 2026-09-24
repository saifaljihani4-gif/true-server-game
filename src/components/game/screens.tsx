import { useEffect } from 'react';
import {
  Tv, ArrowLeftRight, Ban, ChevronRight, Hand, ListOrdered, Mic2, Puzzle, ShoppingBag, Smile, Theater, Timer, Trophy, Volume2, VolumeX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { INTENSITY_LABEL, MODES, type Card, type Intensity, type Mode } from '@/game/data';
import { ActiveModal, FateModal, SetupModal, titleSize, type Fate } from './modals';

export const MODE_ICONS: Record<Mode, LucideIcon> = {
  dialects: Mic2, letters: Ban, gibberish: Puzzle, improv: Theater,
  taboo: Hand, emoji: Smile, lists: ListOrdered, sell: ShoppingBag,
 series: Tv,
};

/* ---------------------------------------------------------------- */

export function Home({ onEnter, onJoin, onHost }: { onEnter: () => void; onJoin: () => void; onHost: () => void }) {
  return (
    <main className="fade-screen flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
      <div className="fade-in-up flex w-full max-w-2xl flex-col items-center text-center">
        {/* True Server Glowing Logo */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-2xl animate-pulse" />
          <img
            src="/images/icon.png"
            alt="True Server"
            className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-2 border-white/20 object-cover shadow-[0_0_35px_rgba(168,85,247,0.35)]"
          />
        </div>

        <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-purple-300 mb-2">منصة الألعاب الجماعية</span>
        
        <h1 dir="ltr" className="home-title font-display fade-in-up text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-8 tracking-wider">TRUE SERVER</h1>
        
        <div className="flex flex-col gap-3.5 w-full max-w-sm mx-auto">
          <button onClick={onHost} className="btn-clean font-kufi rounded-2xl bg-white px-6 py-3.5 sm:py-4 text-base sm:text-lg font-bold text-black shadow-[0_0_30px_rgba(255,255,255,.25)] hover:scale-[1.03] transition-transform">
            إنشاء روم جديد
          </button>
          
          <div className="flex gap-3">
            <button onClick={onJoin} className="flex-1 btn-clean font-kufi rounded-2xl bg-white/10 border border-white/20 px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-white/20 transition-all">
              الانضمام لروم
            </button>
            <button onClick={onEnter} className="flex-1 btn-clean font-kufi rounded-2xl bg-purple-950/40 border border-purple-500/30 px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-purple-200 hover:bg-purple-900/40 transition-all">
              ألعاب التحدي
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- */

export function Categories({ onBack, onSelect }: { onBack: () => void; onSelect: (mode: Mode) => void }) {
  return (
    <main className="fade-screen relative flex min-h-[100dvh] flex-col items-center justify-center p-5 md:p-8">
      <button onClick={onBack} className="absolute start-5 top-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white md:start-8 md:top-8">
        <ChevronRight size={15} /> الرئيسية
      </button>

      <div className="fade-in-up mb-8 mt-14 text-center md:mb-10 md:mt-6">
        <h2 className="font-kufi text-4xl font-bold md:text-6xl">اختر اللعبة</h2>
        <p className="mt-3 text-sm font-medium text-gray-400 md:text-base">{MODES.length} ألعاب، والجائزة تحددها قبل ما تبدأ</p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {MODES.map((item, i) => {
          const Icon = MODE_ICONS[item.id];
          return (
            <button key={item.id} onClick={() => onSelect(item.id)} className="mode-card mode-row glass-panel fade-in-up group flex items-center gap-4 rounded-2xl p-4 md:gap-5 md:p-5" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="mode-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white">
                <Icon size={22} strokeWidth={1.6} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-kufi text-xl font-bold md:text-2xl">{item.name}</span>
                  {item.isNew && <span className="tag-pill gold">جديد</span>}
                </span>
                <span className="arabic-text mt-1 block text-sm font-medium text-gray-400">{item.copy}</span>
                <span className="mt-2.5 flex items-center gap-3 text-xs font-bold text-gray-500">
                  <span className="inline-flex items-center gap-1"><Timer size={12} /> {item.time} ثانية</span>
                  <span className="h-3 w-px bg-white/15" />
                  <span>{item.tags.join(' / ')}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- */

export type GameProps = {
  mode: Mode; modeLabel: string; round: number; dealing: boolean; cards: Card[]; active: Card | null;
  setup: boolean; setSetup: (v: boolean) => void;
  p1: string; p2: string; setP1: (v: string) => void; setP2: (v: string) => void;
  scores: Record<string, number>; setupError: string;
  prize: string; prizes: string[]; customPrizes: string[];
  onSelectPrize: (v: string) => void; onAddPrize: (v: string) => void; onRemovePrize: (v: string) => void; onRandomPrize: () => void;
  intensity: Intensity; setIntensity: (v: Intensity) => void;
  timer: number; timerTotal: number; timerActive: boolean; toggleTimer: () => void; addTime: () => void;
  showAnswer: boolean; setShowAnswer: (v: boolean) => void;
  muted: boolean; onToggleMute: () => void;
  onExit: () => void; onPick: (c: Card) => void; onStart: () => void; onCancelActive: () => void; onDeclare: (r: 1 | 2 | 'win' | 'lose') => void;
  fate: Fate | null; onCloseFate: () => void;
};

export function Game(props: GameProps) {
  const {
    mode, modeLabel, round, dealing, cards, active, setup, setSetup, p1, p2, setP1, setP2, scores, setupError,
    prize, prizes, customPrizes, onSelectPrize, onAddPrize, onRemovePrize, onRandomPrize, intensity, setIntensity,
    timer, timerTotal, timerActive, toggleTimer, addTime, showAnswer, setShowAnswer, muted, onToggleMute,
    onExit, onPick, onStart, onCancelActive, onDeclare, fate, onCloseFate,
  } = props;
  const ModeIcon = MODE_ICONS[mode];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (setup || typing || !active || fate) return;
      if (event.code === 'Space') { event.preventDefault(); toggleTimer(); }
      if (event.key === 'Escape') onCancelActive();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, fate, onCancelActive, setup, toggleTimer]);

  const wide = mode !== 'letters';

  return (
    <main className="fade-screen relative flex min-h-[100dvh] flex-col">
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 shadow-xl md:px-6 md:py-4">
        <button onClick={onExit} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-gray-400 hover:text-white md:px-4">
          <ChevronRight size={15} /> <span>خروج</span>
        </button>

        <button onClick={() => setSetup(true)} title="تغيير اللاعبين والجائزة" className="flex min-w-0 items-center gap-3 rounded-full border border-white/10 bg-black/60 px-3 py-2 shadow-inner hover:bg-white/10 md:gap-8 md:px-8">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="max-w-[80px] truncate text-xs font-bold text-gray-300 md:text-sm">{p1 || 'اللاعب 1'}</span>
            <strong className="font-kufi text-2xl md:text-3xl">{scores[p1] || 0}</strong>
          </div>
          {p2 && (
            <>
              <div className="flex items-center gap-1 text-xs font-bold italic text-gray-600 md:text-lg"><span>VS</span><ArrowLeftRight size={10} /></div>
              <div className="flex items-center gap-2 md:gap-4">
                <strong className="font-kufi text-2xl md:text-3xl">{scores[p2] || 0}</strong>
                <span className="max-w-[80px] truncate text-xs font-bold text-gray-300 md:text-sm">{p2}</span>
              </div>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <button onClick={onToggleMute} aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'} aria-pressed={muted} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-white">
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-300 sm:inline-flex"><ModeIcon size={14} /> {modeLabel}</span>
        </div>
      </header>

      {/* شريط الجائزة: يشوفه الكل طول الجولة */}
      <div className="flex justify-center px-4 pt-4">
        <button onClick={() => setSetup(true)} className="prize-plate prize-sheen prize-strip" key={prize} title="تغيير الجائزة">
          <span className="inline-flex items-center gap-1.5"><Trophy size={14} /> الجائزة: <b className="font-kufi text-base">{prize || 'ما تحددت'}</b></span>
          <span className="divider" />
          <span className="muted">العقوبة {INTENSITY_LABEL[intensity]}</span>
        </button>
      </div>

      <div className={`game-scroll flex-1 overflow-y-auto p-5 pb-32 md:p-8 ${dealing ? 'cards-dealing' : ''}`}>
        <div className={`mx-auto grid max-w-7xl gap-3 md:gap-4 ${wide ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8' : 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10'}`}>
          {cards.map((card, i) => (
            <button
              key={card.id} onClick={() => onPick(card)} disabled={card.used || !!active || setup} aria-label={`بطاقة ${card.id}`}
              className={`card-container fade-in-up aspect-[2/3] w-full ${card.flipped ? 'flipped' : ''} ${card.used ? 'used opacity-30 grayscale' : ''}`}
              style={{ animationDelay: `${Math.min(i * 0.018, 0.36)}s` }}
            >
              <div className="card-inner">
                <div className="card-face card-back">
                  <div className="card-content gap-2">
                    <span className="font-kufi text-xs font-bold text-gray-400">{card.id}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10"><ModeIcon size={13} /></span>
                  </div>
                </div>
                <div className="card-face card-front">
                  <div className="card-content gap-1.5">
                    <span className="text-[.55rem] font-bold opacity-60 md:text-[.62rem]">{card.type}</span>
                    <span className={`font-kufi text-center font-bold leading-snug ${titleSize(card.title, 'card')}`}>{card.title}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {setup && (
        <SetupModal
          modeLabel={modeLabel} round={round} p1={p1} p2={p2} setP1={setP1} setP2={setP2}
          prize={prize} prizes={prizes} customPrizes={customPrizes}
          onSelectPrize={onSelectPrize} onAddPrize={onAddPrize} onRemovePrize={onRemovePrize} onRandomPrize={onRandomPrize}
          intensity={intensity} setIntensity={setIntensity}
          error={setupError} canCancel={true} onCancel={() => { if (active) setSetup(false); else onExit(); }} onStart={onStart}
        />
      )}
      {active && !fate && (
        <ActiveModal
          active={active} timer={timer} timerTotal={timerTotal} timerActive={timerActive} toggleTimer={toggleTimer} addTime={addTime}
          p1={p1} p2={p2} prize={prize} showAnswer={showAnswer} setShowAnswer={setShowAnswer} onCancel={onCancelActive} onDeclare={onDeclare}
        />
      )}
      {fate && <FateModal fate={fate} onNext={onCloseFate} />}
    </main>
  );
}
