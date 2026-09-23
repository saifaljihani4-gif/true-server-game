// أصوات اللعبة بدون أي ملفات صوتية: تتولد مباشرة بـ WebAudio.
// الصوت ما يشتغل إلا بعد أول ضغطة من المستخدم (قيد المتصفحات).

const STORAGE_KEY = 'eighty-two-muted';

let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = window.localStorage.getItem(STORAGE_KEY) === '1';
} catch {
  muted = false;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, delay: number, duration: number, type: OscillatorType = 'sine', volume = 0.07, glideTo?: number) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  const start = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

export const sfx = {
  isMuted: () => muted,
  setMuted(value: boolean) {
    muted = value;
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      /* التخزين غير متاح، ما يهم */
    }
  },
  /** قلب البطاقة */
  flip() {
    tone(260, 0, 0.09, 'triangle', 0.06, 520);
  },
  /** اختيار جائزة أو خيار */
  select() {
    tone(660, 0, 0.07, 'triangle', 0.05);
  },
  /** آخر خمس ثواني */
  tick() {
    tone(920, 0, 0.06, 'square', 0.035);
  },
  /** انتهى الوقت */
  buzz() {
    tone(150, 0, 0.55, 'sawtooth', 0.07, 90);
  },
  /** فوز */
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.32, 'triangle', 0.07));
    tone(1319, 0.4, 0.6, 'sine', 0.05);
  },
  /** خسارة */
  lose() {
    tone(330, 0, 0.28, 'sawtooth', 0.05, 220);
    tone(220, 0.22, 0.4, 'sawtooth', 0.05, 130);
  },
};
