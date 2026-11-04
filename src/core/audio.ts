// 칩튠 사운드: 외부 음원 없이 WebAudio로 효과음·BGM을 합성한다 (라이선스 이슈 없음)

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let sfxBus: GainNode;
let recordDest: MediaStreamAudioDestinationNode | null = null;

export function audioCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.35;
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.5;
    sfxBus.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 녹화 시 오디오 트랙을 뽑기 위한 스트림
export function audioStream(): MediaStream {
  const c = audioCtx();
  if (!recordDest) {
    recordDest = c.createMediaStreamDestination();
    master.connect(recordDest);
  }
  return recordDest.stream;
}

type Wave = OscillatorType | 'noise';

function tone(freq: number, dur: number, wave: Wave = 'square', vol = 0.3, when = 0, slideTo?: number, bus?: GainNode) {
  const c = audioCtx();
  const t0 = c.currentTime + when;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  g.connect(bus ?? sfxBus);
  if (wave === 'noise') {
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = freq;
    src.connect(f).connect(g);
    src.start(t0);
    src.stop(t0 + dur);
    return;
  }
  const o = c.createOscillator();
  o.type = wave;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  o.connect(g);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

export const sfx = {
  move: () => tone(N(84), 0.05, 'square', 0.12),
  select: () => { tone(N(79), 0.06, 'square', 0.18); tone(N(86), 0.08, 'square', 0.18, 0.05); },
  wrong: () => { tone(N(50), 0.15, 'sawtooth', 0.2); tone(N(47), 0.2, 'sawtooth', 0.2, 0.12); },
  coin: () => { tone(N(88), 0.06, 'square', 0.16); tone(N(95), 0.18, 'square', 0.16, 0.06); },
  pop: () => tone(N(72), 0.09, 'triangle', 0.3, 0, N(96)),
  jump: () => tone(N(60), 0.15, 'square', 0.15, 0, N(84)),
  whoosh: () => tone(800, 0.35, 'noise', 0.18),
  shutter: () => { tone(3000, 0.05, 'noise', 0.4); tone(1500, 0.12, 'noise', 0.25, 0.06); },
  bell: () => { tone(N(93), 0.8, 'triangle', 0.3); tone(N(100), 0.6, 'sine', 0.15, 0.01); },
  step: () => tone(300, 0.04, 'noise', 0.06),
  sparkle: () => [0, 1, 2, 3].forEach((i) => tone(N(88 + i * 4), 0.08, 'square', 0.08, i * 0.04)),
  clear: () => [72, 76, 79, 84, 79, 84].forEach((n, i) => tone(N(n), i === 5 ? 0.4 : 0.1, 'square', 0.18, i * 0.09)),
  levelup: () => {
    [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(N(n), 0.12, 'square', 0.2, i * 0.07));
    [84, 88, 91, 96].forEach((n, i) => tone(N(n), 0.5, 'triangle', 0.18, 0.55 + i * 0.03));
  },
  firework: () => { tone(200, 0.5, 'noise', 0.25); tone(N(40), 0.4, 'triangle', 0.3, 0, N(28)); },
  launch: () => tone(N(60), 0.6, 'triangle', 0.08, 0, N(96)),
  typing: () => tone(N(96 + Math.floor(Math.random() * 4)), 0.02, 'square', 0.04),
  plane: () => tone(120, 2.5, 'noise', 0.08),
  hit: () => tone(N(91), 0.05, 'square', 0.12),
};

// ---------------- BGM 시퀀서 ----------------
// 트랙은 스텝 시퀀스: 멜로디/베이스/드럼. 값은 MIDI 노트, 0은 쉼표.
export interface Track {
  bpm: number;
  steps: number; // 16분음표 스텝 수
  lead: number[];
  bass: number[];
  arp?: number[];
  drums?: string; // k=킥, s=스네어, h=하이햇, .=쉼
  leadWave?: OscillatorType;
}

// 오음계 기반으로 결정적인 멜로디를 만든다 (같은 seed → 같은 곡)
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

function compose(seed: number, root: number, bpm: number, chords: number[], scale: number[], drums: string, leadWave: OscillatorType = 'square'): Track {
  const r = rng(seed);
  const bars = chords.length;
  const steps = bars * 16;
  const lead: number[] = [], bass: number[] = [], arp: number[] = [];
  let deg = 2;
  for (let b = 0; b < bars; b++) {
    const ch = chords[b];
    for (let s = 0; s < 16; s++) {
      // 베이스: 8분음표 루트-5도
      bass.push(s % 4 === 0 ? root - 24 + ch : s % 4 === 2 ? root - 24 + ch + 7 : 0);
      arp.push(s % 2 === 0 ? root + ch + [0, 4, 7, 12][(s / 2) % 4] : 0);
      // 멜로디: 박마다 확률적으로 음 배치
      const onBeat = s % 4 === 0;
      if ((onBeat && r() < 0.85) || (!onBeat && s % 2 === 0 && r() < 0.45)) {
        deg = Math.max(0, Math.min(scale.length * 2 - 1, deg + Math.round((r() - 0.5) * 4)));
        const oct = Math.floor(deg / scale.length);
        lead.push(root + 12 + scale[deg % scale.length] + oct * 12 + (b % 4 === 3 && s >= 12 ? 0 : 0));
      } else lead.push(0);
    }
  }
  // 마지막 마디는 근음으로 해결
  lead[steps - 16] = root + 12;
  return { bpm, steps, lead, bass, arp, drums, leadWave };
}

const PENTA = [0, 2, 4, 7, 9];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

export const TRACKS: Record<string, Track> = {
  title: compose(7, 60, 128, [0, 5, 9, 7, 0, 5, 7, 7], MAJOR, 'k.h.s.h.k.k.s.h.'),
  stage1: compose(21, 62, 112, [0, 5, 0, 7, 0, 5, 7, 0], PENTA, 'k...h...s...h...', 'triangle'),
  stage2: compose(42, 64, 124, [0, 9, 5, 7, 0, 9, 5, 7], MAJOR, 'k.h.s.h.k.h.s.hh'),
  stage3: compose(99, 65, 118, [0, 3, 8, 10, 0, 3, 8, 7], PENTA, 'k..hs.h.k.khs.h.'),
  dance: compose(2027, 63, 120, [0, 8, 3, 10, 0, 8, 3, 10, 0, 8, 3, 10, 5, 7, 8, 10], PENTA, 'k.hhs.hhk.hks.hh'),
  ending: compose(31, 60, 96, [0, 7, 9, 5, 0, 7, 5, 7], MAJOR, 'k.......s.......', 'triangle'),
};

let current: { name: string; timer: number; step: number; start: number } | null = null;

// 반환값: 첫 스텝이 울리는 AudioContext 시각 (리듬게임 싱크용)
export function playMusic(name: string, restart = false): number {
  if (current?.name === name && !restart) return current.start;
  stopMusic();
  const tr = TRACKS[name];
  if (!tr) return 0;
  const c = audioCtx();
  const stepDur = 60 / tr.bpm / 4;
  let next = c.currentTime + 0.05;
  const state = { name, timer: 0, step: 0, start: next };
  const tick = () => {
    // 100ms 앞까지 미리 스케줄
    while (next < c.currentTime + 0.12) {
      const i = state.step % tr.steps;
      const when = next - c.currentTime;
      if (tr.lead[i]) tone(N(tr.lead[i]), stepDur * 1.8, tr.leadWave ?? 'square', 0.16, when, undefined, musicBus);
      if (tr.bass[i]) tone(N(tr.bass[i]), stepDur * 1.6, 'triangle', 0.4, when, undefined, musicBus);
      if (tr.arp?.[i]) tone(N(tr.arp[i]), stepDur * 0.8, 'square', 0.05, when, undefined, musicBus);
      const d = tr.drums?.[i % tr.drums.length];
      if (d === 'k') tone(N(36), 0.12, 'sine', 0.6, when, N(24), musicBus);
      if (d === 's') tone(1200, 0.1, 'noise', 0.25, when, undefined, musicBus);
      if (d === 'h') tone(7000, 0.03, 'noise', 0.1, when, undefined, musicBus);
      next += stepDur;
      state.step++;
    }
  };
  state.timer = window.setInterval(tick, 25);
  tick();
  current = state;
  return state.start;
}

export function stopMusic() {
  if (current) window.clearInterval(current.timer);
  current = null;
}

export function musicStepTime(bpm: number) {
  return 60 / bpm / 4;
}
