import { useState } from 'react';
import { Check, ChevronLeft, Crown, Dices, Eye, Pause, Play, Plus, Skull, Trophy, X } from 'lucide-react';
import { INTENSITY_LABEL, type Card, type Intensity } from '@/game/data';

export type Fate = { winner: string; loser: string; prize: string; punishment: string };

/** حجم العنوان يتناسب مع طوله، والإيموجي أكبر */
export function titleSize(title: string, scale: 'card' | 'modal') {
  const emoji = /\p{Extended_Pictographic}/u.test(title);
  if (scale === 'card') {
    if (emoji) return 'text-2xl md:text-4xl';
    return title.length > 16 ? 'text-[.72rem] md:text-base' : title.length > 9 ? 'text-sm md:text-xl' : 'text-lg md:text-3xl';
  }
  if (emoji) return 'text-6xl md:text-8xl';
  return title.length > 24 ? 'text-2xl md:text-4xl' : title.length > 13 ? 'text-3xl md:text-5xl' : 'text-4xl md:text-7xl';
}

/* ---------------------------------------------------------------- */
/*  غرفة اللعب: اللاعبون + الجائزة + شدة العقوبة                     */
/* ---------------------------------------------------------------- */

type SetupProps = {
  modeLabel: string; round: number;
  p1: string; p2: string; setP1: (v: string) => void; setP2: (v: string) => void;
  prize: string; prizes: string[]; customPrizes: string[];
  onSelectPrize: (v: string) => void; onAddPrize: (v: string) => void; onRemovePrize: (v: string) => void; onRandomPrize: () => void;
  intensity: Intensity; setIntensity: (v: Intensity) => void;
  error: string; canCancel: boolean; onCancel: () => void; onStart: () => void;
};

export function SetupModal(props: SetupProps) {
  const { modeLabel, round, p1, p2, setP1, setP2, prize, prizes, customPrizes, onSelectPrize, onAddPrize, onRemovePrize, onRandomPrize, intensity, setIntensity, error, canCancel, onCancel, onStart } = props;
  const [draft, setDraft] = useState('');
  const ready = Boolean(p1.trim()) && Boolean(prize);
  const submitDraft = () => {
    if (!draft.trim()) return;
    onAddPrize(draft);
    setDraft('');
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <div className="room-sheet glass-panel modal-panel flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col rounded-3xl border-white/20">
        <div className="room-orbit" aria-hidden="true"><span /><span /><span /></div>

        <div className="relative z-10 shrink-0 px-6 pt-6 text-center md:px-9 md:pt-7">
          <div className="room-meta mb-2 justify-center"><span>{modeLabel}</span><span>الجولة {round}</span></div>
          <h2 id="setup-title" className="font-kufi text-3xl font-bold md:text-4xl">غرفة اللعب</h2>
        </div>

        <div className="relative z-10 flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5 md:px-9">
          {/* 1. اللاعبون */}
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="section-title">اللاعبون</h3>
              <span className="section-note">اسم واحد للفردي، اسمين للمواجهة</span>
            </div>
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
              <label>
                <span className="field-label">اللاعب الأول (مطلوب)</span>
                <input className="setup-input" value={p1} onChange={e => setP1(e.target.value)} placeholder="@اسمك" maxLength={20} autoFocus />
              </label>
              <span className="hidden pb-3.5 font-kufi text-xl font-bold text-white/30 md:block">VS</span>
              <label>
                <span className="field-label">اللاعب الثاني (اختياري)</span>
                <input className="setup-input" value={p2} onChange={e => setP2(e.target.value)} placeholder="اتركه فاضي للفردي" maxLength={20} />
              </label>
            </div>
          </section>

          {/* 2. الجائزة */}
          <section aria-labelledby="prize-title">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 id="prize-title" className="section-title flex items-center gap-2"><Trophy size={15} className="text-[color:var(--prize)]" /> الجائزة</h3>
              <span className="section-note">تنعطى للفائز، ولازم تتحدد قبل ما تبدأ</span>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="اختر الجائزة">
              {prizes.map(item => {
                const custom = customPrizes.includes(item);
                return (
                  <button key={item} type="button" className="chip" aria-pressed={prize === item} onClick={() => onSelectPrize(item)}>
                    {prize === item && <Check size={14} />}
                    {item}
                    {custom && (
                      <span
                        role="button" tabIndex={0} aria-label={`حذف ${item}`} className="chip-x"
                        onClick={e => { e.stopPropagation(); onRemovePrize(item); }}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onRemovePrize(item); } }}
                      ><X size={13} /></span>
                    )}
                  </button>
                );
              })}
              <button type="button" className="chip" onClick={onRandomPrize}><Dices size={15} /> اختر لي واحدة</button>
            </div>
            <div className="mt-2.5 flex gap-2">
              <input
                className="setup-input gold !py-2.5 !text-start !text-sm" value={draft} maxLength={24}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitDraft(); } }}
                placeholder="جائزة جديدة، مثل: بطاقة هدية" aria-label="اسم جائزة جديدة"
              />
              <button type="button" onClick={submitDraft} disabled={!draft.trim()} className="chip shrink-0 disabled:opacity-40"><Plus size={15} /> أضف</button>
            </div>
          </section>

          {/* 3. العقوبة */}
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="section-title flex items-center gap-2"><Skull size={15} className="text-white/70" /> شدة العقوبة</h3>
              <span className="section-note">للخاسر</span>
            </div>
            <div className="seg" role="group" aria-label="شدة العقوبة">
              {(Object.keys(INTENSITY_LABEL) as Intensity[]).map(level => (
                <button key={level} type="button" aria-pressed={intensity === level} onClick={() => setIntensity(level)}>{INTENSITY_LABEL[level]}</button>
              ))}
            </div>
          </section>
        </div>

        <div className="relative z-10 shrink-0 border-t border-white/10 px-6 py-4 md:px-9">
          {(error || !ready) && (
            <p className={`mb-3 text-center text-sm font-bold ${error ? 'text-rose-300' : 'text-gray-400'}`} role={error ? 'alert' : undefined}>
              {error || (!p1.trim() ? 'اكتب اسم اللاعب الأول' : 'اختر الجائزة عشان تبدأ')}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={onStart} disabled={!ready} className="btn-clean font-kufi inline-flex items-center gap-2 rounded-full bg-[#f0eee9] px-12 py-3 text-lg font-bold text-[#111216] shadow-lg disabled:opacity-40">
              <Play size={15} className="rtl:-scale-x-100" /> ابدأ المباراة
            </button>
            {canCancel && (
              <button onClick={onCancel} className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-gray-400 hover:border-white/30 hover:text-white">رجوع للبطاقة</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  البطاقة المفتوحة + المؤقت                                        */
/* ---------------------------------------------------------------- */

type ActiveProps = {
  active: Card; timer: number; timerTotal: number; timerActive: boolean;
  toggleTimer: () => void; addTime: () => void;
  p1: string; p2: string; prize: string;
  showAnswer: boolean; setShowAnswer: (v: boolean) => void;
  onCancel: () => void; onDeclare: (r: 1 | 2 | 'win' | 'lose') => void;
};

const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;

export function ActiveModal({ active, timer, timerTotal, timerActive, toggleTimer, addTime, p1, p2, prize, showAnswer, setShowAnswer, onCancel, onDeclare }: ActiveProps) {
  const danger = timerActive && timer > 0 && timer <= 5;
  const frac = Math.max(0, Math.min(1, timer / Math.max(1, timerTotal)));
  const ringColor = danger ? 'var(--danger)' : timer === 0 ? 'rgba(239,233,222,.25)' : '#efe9de';

  return (
    <div className="modal-backdrop fixed inset-0 z-40 flex flex-col items-center overflow-y-auto p-5 md:p-6" role="dialog" aria-modal="true" aria-labelledby="active-card-title">
      <div className="my-auto flex w-full flex-col items-center py-4">
        <div className="prize-plate prize-sheen mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold" key={prize}>
          <Trophy size={14} /> الجائزة: {prize}
        </div>

        <div className="relative mb-7 flex min-h-[230px] w-full max-w-xl flex-col items-center overflow-hidden rounded-3xl border border-white/20 bg-[url('/images/banner.png')] bg-cover bg-center text-center shadow-[0_30px_60px_rgba(0,0,0,.8)] md:mb-9">
          <div className="absolute inset-0 bg-black/78" />
          <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-4 p-7 md:p-11">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white/70">{active.type}</span>
              {active.tag && <span className="tag-pill">{active.tag}</span>}
            </div>
            <h2 id="active-card-title" className={`font-kufi font-bold leading-tight ${titleSize(active.title, 'modal')}`}>{active.title}</h2>
            {active.desc && <p className="arabic-text text-lg font-medium text-gray-300 md:text-2xl">{active.desc}</p>}
            {active.hint && <p className="card-quote arabic-text w-full max-w-md">{active.hint}</p>}
            {active.answer && (
              <div className="mt-1 flex w-full justify-center">
                {!showAnswer ? (
                  <button onClick={() => setShowAnswer(true)} className="btn-clean inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-bold hover:bg-white/20"><Eye size={15} /> عرض الحل</button>
                ) : (
                  <div className="rounded-2xl border border-green-500/50 bg-green-500/15 px-8 py-3"><p className="arabic-text text-2xl font-bold text-green-300 md:text-3xl">{active.answer}</p></div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`timer-ring mb-7 md:mb-9 ${danger ? 'danger' : ''}`} aria-live="off">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r={RING_R} fill="none" stroke="rgba(239,233,222,.12)" strokeWidth="4" />
            <circle cx="100" cy="100" r={RING_R} fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - frac)}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s ease' }} />
          </svg>
          <div className="digits" role="timer" aria-label={`${timer} ثانية`}>{String(timer).padStart(2, '0')}</div>
        </div>

        <div className="flex w-full max-w-3xl flex-wrap justify-center gap-3 md:gap-4">
          <button onClick={toggleTimer} disabled={timer === 0} className="btn-clean font-kufi flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-bold text-black disabled:opacity-60 md:w-auto md:flex-1 md:py-5">
            {timerActive ? <Pause size={16} /> : <Play size={16} className="rtl:-scale-x-100" />}
            {timerActive ? 'إيقاف مؤقت' : timer === 0 ? 'انتهى الوقت' : 'ابدأ الوقت'}
          </button>
          <button onClick={addTime} className="btn-clean flex items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/5 px-5 py-4 text-sm font-bold text-white/85 hover:bg-white/10 md:py-5"><Plus size={14} /> 10 ثواني</button>

          {p2 ? (
            <>
              <button onClick={() => onDeclare(1)} className="btn-clean flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-600/20 py-4 text-sm font-bold text-indigo-100 hover:bg-indigo-500 md:py-5"><Trophy size={15} /> فاز {p1}</button>
              <button onClick={() => onDeclare(2)} className="btn-clean flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-600/20 py-4 text-sm font-bold text-rose-100 hover:bg-rose-500 md:py-5"><Trophy size={15} /> فاز {p2}</button>
            </>
          ) : (
            <>
              <button onClick={() => onDeclare('win')} className="btn-clean flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-green-500/30 bg-green-600/20 py-4 text-sm font-bold text-green-100 hover:bg-green-500 md:py-5"><Check size={15} /> نجح {p1}</button>
              <button onClick={() => onDeclare('lose')} className="btn-clean flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-red-500/30 bg-red-600/20 py-4 text-sm font-bold text-red-100 hover:bg-red-500 md:py-5"><X size={15} /> فشل {p1}</button>
            </>
          )}
        </div>

        <button onClick={onCancel} className="mt-5 text-sm font-bold text-gray-500 hover:text-white">رجوع للبطاقات <span className="hidden text-gray-600 md:inline">(Esc)</span></button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  نتيجة الجولة                                                     */
/* ---------------------------------------------------------------- */

export function FateModal({ fate, onNext }: { fate: Fate; onNext: () => void }) {
  return (
    <div className="modal-backdrop fixed inset-0 z-[60] flex flex-col items-center overflow-y-auto p-5 md:p-6">
      <div className="my-auto flex w-full flex-col items-center py-4">
        <h2 className="font-kufi mb-8 text-center text-4xl font-bold md:mb-12 md:text-6xl">انتهت الجولة</h2>
        <div className="mb-8 flex w-full max-w-5xl flex-col items-stretch justify-center gap-5 md:mb-12 md:flex-row md:gap-8">
          {fate.winner && <FateCard winner name={fate.winner} label="الجائزة" text={fate.prize} Icon={Crown} />}
          {fate.loser && <FateCard name={fate.loser} label="العقوبة" text={fate.punishment} Icon={Skull} />}
        </div>
        <button onClick={onNext} className="btn-clean font-kufi inline-flex items-center gap-2 rounded-full bg-white px-12 py-3.5 text-lg font-bold text-black shadow-lg md:px-14">
          الجولة الجاية <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}

function FateCard({ winner, name, label, text, Icon }: { winner?: boolean; name: string; label: string; text: string; Icon: typeof Crown }) {
  return (
    <div className={`glass-panel relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center overflow-hidden rounded-[2rem] bg-[url('/images/banner.png')] bg-cover bg-center p-8 text-center md:p-10 ${winner ? 'fate-winner' : ''}`}>
      <div className="absolute inset-0 bg-black/78" />
      <div className="relative z-10 flex flex-col items-center">
        <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${winner ? 'prize-plate prize-sheen' : 'border-white/30 bg-white/10'}`}>
          <Icon className={`h-7 w-7 ${winner ? '' : 'text-red-400'}`} />
        </div>
        <h3 className="font-kufi mb-1 text-2xl font-bold md:text-3xl">{name}</h3>
        <p className={`mb-5 text-sm font-bold ${winner ? 'text-[color:var(--prize-soft)]' : 'text-red-400'}`}>{label}</p>
        <h4 className={`font-kufi text-3xl font-bold leading-tight md:text-5xl ${winner ? 'text-[color:var(--prize-soft)]' : ''}`}>{text}</h4>
      </div>
    </div>
  );
}

