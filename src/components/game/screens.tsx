import { useEffect } from 'react';
import {
  Tv, ArrowLeftRight, Ban, ChevronRight, Crown, Gamepad2, Hand, ListOrdered, Mic2, Puzzle, ShoppingBag, Smile, Theater, Timer, Trophy, Users, Volume2, VolumeX,
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
    <main className="fade-screen flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-between py-5 px-4 sm:py-7 sm:px-6">
      {/* Top Tag */}
      <div className="w-full flex justify-center items-center pt-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-950/40 px-3.5 py-1 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.15)]">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-kufi text-[11px] sm:text-xs font-bold text-purple-200">سيرفر ترو الرسمي • True Server</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="fade-in-up flex flex-col items-center text-center my-auto py-3 max-w-md w-full">
        {/* Animated Badge / Logo with purple aura */}
        <div className="relative mb-3 sm:mb-4 group">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-black/60 border border-purple-400/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] backdrop-blur-lg overflow-hidden p-2">
            <img
              src="/images/icon.gif"
              alt="True Icon"
              className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
            />
          </div>
        </div>

        {/* Info banner / title */}
        <img
          src="/images/info.png"
          alt="True Server"
          className="h-8 sm:h-11 w-auto object-contain mx-auto mb-2 drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]"
        />

        <p className="font-kufi text-xs sm:text-sm font-medium text-gray-300 max-w-xs sm:max-w-sm leading-relaxed mb-4">
          تحديات جماعية ومسابقات تفاعلية مع أصدقائك في الديسكورد
        </p>

        {/* Feature Pills showcase */}
        <div className="flex flex-wrap justify-center items-center gap-1.5 max-w-xs sm:max-w-sm">
          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">تحدي الحروف</span>
          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">عدّد</span>
          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">برا السالفة</span>
          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">مافيا</span>
          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">كود نيمز</span>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="fade-in-up flex w-full max-w-xs sm:max-w-sm flex-col gap-2.5 pb-12 sm:pb-8">
        <button
          onClick={onHost}
          className="btn-clean relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#581c87] via-[#7e22ce] to-[#6b21a8] hover:from-[#6b21a8] hover:via-[#9333ea] hover:to-[#7e22ce] text-white border border-purple-300/40 px-5 py-3.5 text-base sm:text-lg font-bold shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_30px_rgba(147,51,234,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
        >
          <Crown size={18} className="text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]" />
          <span>إنشاء روم جديد</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onJoin}
            className="btn-clean rounded-2xl bg-[#140e24]/85 hover:bg-[#1f1538] border border-white/15 hover:border-purple-400/50 px-3 py-3 text-xs sm:text-sm font-bold text-gray-100 hover:text-white shadow-lg backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Users size={15} className="text-purple-300" />
            <span>الانضمام لروم</span>
          </button>
          
          <button
            onClick={onEnter}
            className="btn-clean rounded-2xl bg-[#140e24]/85 hover:bg-[#1f1538] border border-white/15 hover:border-purple-400/50 px-3 py-3 text-xs sm:text-sm font-bold text-gray-100 hover:text-white shadow-lg backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Gamepad2 size={15} className="text-pink-300" />
            <span>ألعاب التحدي</span>
          </button>
        </div>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- */

export function Categories({ onBack, onSelect }: { onBack: () => void; onSelect: (mode: Mode) => void }) {
  return (
    <main className="fade-screen relative flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col items-center justify-start py-3 px-3 sm:py-5 sm:px-4">
      <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl flex flex-col items-stretch">
        <div className="w-full flex items-center justify-start mb-2 pt-1">
          <button onClick={onBack} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors">
            <ChevronRight size={14} /> الرئيسية
          </button>
        </div>

        <div className="fade-in-up mb-3 sm:mb-5 text-center w-full">
          <img src="/images/info.png" alt="True Server" className="h-8 sm:h-10 w-auto object-contain mx-auto mb-1.5 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
          <h2 className="font-kufi text-xl sm:text-2xl md:text-3xl font-bold text-white">اختر اللعبة</h2>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-gray-400">{MODES.length} ألعاب، والجائزة تحددها قبل ما تبدأ</p>
        </div>

        <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 pb-8">
          {MODES.map((item, i) => {
            const Icon = MODE_ICONS[item.id];
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="mode-card mode-row glass-panel fade-in-up group flex items-center gap-2.5 sm:gap-3 rounded-xl p-2.5 sm:p-3 w-full text-right transition-all"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <span className="mode-icon flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white">
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-kufi text-sm sm:text-base font-bold text-white truncate">{item.name}</span>
                    {item.isNew && <span className="tag-pill gold text-[10px] px-1.5 py-0.5">جديد</span>}
                  </span>
                  <span className="arabic-text mt-0.5 block text-[11px] sm:text-xs font-medium text-gray-400 line-clamp-1">{item.copy}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-bold text-gray-500">
                    <span className="inline-flex items-center gap-1"><Timer size={10} /> {item.time} ثانية</span>
                    <span className="h-2 w-px bg-white/15" />
                    <span className="truncate">{item.tags.join(' / ')}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
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
