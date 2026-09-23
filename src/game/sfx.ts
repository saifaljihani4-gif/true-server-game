const STORAGE_KEY = 'eighty-two-muted';

let muted = false;

try {
  muted = window.localStorage.getItem(STORAGE_KEY) === '1';
} catch {
  muted = false;
}

const loadAudio = (src: string) => {
  if (typeof window === 'undefined') return { play: () => Promise.resolve() } as HTMLAudioElement;
  const a = new Audio(src);
  a.preload = 'auto';
  return a;
};

// أصوات حقيقية MP3
const sounds: Record<string, HTMLAudioElement> = {
  win: loadAudio('/sfx/win.mp3'),
  lose: loadAudio('/sfx/lose.mp3'),
  flip: loadAudio('/sfx/flip.mp3'),
  tick: loadAudio('/sfx/tick.mp3'),
  buzz: loadAudio('/sfx/buzz.mp3'),
};

const play = (name: string) => {
  if (muted) return;
  const a = sounds[name];
  if (a) {
    a.currentTime = 0;
    a.play().catch(() => {
       // Ignore autoplay blocks
    });
  }
};

export const sfx = {
  isMuted: () => muted,
  setMuted(value: boolean) {
    muted = value;
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  },
  flip: () => play('flip'),
  select: () => play('tick'),
  tick: () => play('tick'),
  buzz: () => play('buzz'),
  win: () => play('win'),
  lose: () => play('lose'),
};
