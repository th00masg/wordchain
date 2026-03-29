// Fun sound effects using Web Audio API — no files needed!

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Ensure AudioContext is resumed after user gesture
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  detune = 0
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detune;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Happy "ding" when a word is submitted
export function playWordSubmit() {
  playTone(880, 0.15, "sine", 0.25);
  setTimeout(() => playTone(1100, 0.2, "sine", 0.2), 80);
}

// Extra sparkly sound for long words (bonus points!)
export function playLongWord() {
  playTone(523, 0.12, "sine", 0.2);
  setTimeout(() => playTone(659, 0.12, "sine", 0.2), 100);
  setTimeout(() => playTone(784, 0.12, "sine", 0.2), 200);
  setTimeout(() => playTone(1047, 0.3, "sine", 0.25), 300);
}

// Your turn! Attention grabber
export function playYourTurn() {
  playTone(440, 0.1, "square", 0.12);
  setTimeout(() => playTone(554, 0.1, "square", 0.12), 120);
  setTimeout(() => playTone(659, 0.15, "square", 0.15), 240);
}

// Tick sound when timer is low
export function playTick() {
  playTone(800, 0.05, "square", 0.1);
}

// Urgent ticking (last 3 seconds)
export function playUrgentTick() {
  playTone(1000, 0.08, "square", 0.18);
}

// Player eliminated — sad descending tone
export function playElimination() {
  playTone(440, 0.15, "sawtooth", 0.15);
  setTimeout(() => playTone(370, 0.15, "sawtooth", 0.12), 150);
  setTimeout(() => playTone(294, 0.3, "sawtooth", 0.1), 300);
}

// Victory fanfare!
export function playVictory() {
  const notes = [523, 523, 523, 659, 784, 784, 659, 784, 1047];
  const times = [0, 120, 240, 400, 550, 650, 800, 950, 1100];
  const durs = [0.1, 0.1, 0.15, 0.15, 0.1, 0.15, 0.15, 0.15, 0.4];

  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, durs[i], "sine", 0.2), times[i]);
  });
}

// Error buzz
export function playError() {
  playTone(200, 0.15, "sawtooth", 0.12);
  setTimeout(() => playTone(180, 0.2, "sawtooth", 0.1), 100);
}

// Button click
export function playClick() {
  playTone(600, 0.04, "sine", 0.1);
}

// Game start countdown beep
export function playCountdownBeep() {
  playTone(660, 0.1, "sine", 0.15);
}

// Game start GO!
export function playGo() {
  playTone(880, 0.3, "sine", 0.25);
  setTimeout(() => playTone(880, 0.3, "sine", 0.2, 5), 50);
}
