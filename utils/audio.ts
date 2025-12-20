/**
 * Generative Christmas Audio Engine
 * Creates a "Music Box" / Celesta style sound with cheerful holiday harmonies.
 */

let audioCtx: AudioContext | null = null;
let isPlaying = false;
let timeoutIds: number[] = [];

// G Major Scale (High octaves for bell sound)
// G4, A4, B4, C5, D5, E5, F#5, G5, A5, B5, C6, D6
const scale = [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 739.99, 783.99, 880.00, 987.77, 1046.50, 1174.66];

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
};

const createReverb = () => {
  if (!audioCtx) return null;
  const convolver = audioCtx.createConvolver();
  // Simple impulse response simulation
  const rate = audioCtx.sampleRate;
  const length = rate * 2.0; // 2 seconds reverb
  const decay = 2.0;
  const impulse = audioCtx.createBuffer(2, length, rate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i / length;
    left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
    right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
  }
  convolver.buffer = impulse;
  return convolver;
};

let masterGain: GainNode | null = null;
let reverbNode: ConvolverNode | null = null;

const setupNodes = () => {
  if (!audioCtx) return;
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.3;
  
  reverbNode = createReverb();
  
  if (reverbNode) {
    masterGain.connect(reverbNode);
    reverbNode.connect(audioCtx.destination);
    // Also connect dry signal
    masterGain.connect(audioCtx.destination); 
  } else {
    masterGain.connect(audioCtx.destination);
  }
};

const playBell = (freq: number, volume: number = 0.1, pan: number = 0) => {
  if (!audioCtx || !masterGain) return;

  const osc = audioCtx.createOscillator();
  const overtone = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const panner = audioCtx.createStereoPanner();

  // Bell-like synthesis: Sine + slight detuned overtone
  osc.type = 'sine';
  osc.frequency.value = freq;
  
  overtone.type = 'sine';
  overtone.frequency.value = freq * 2 + Math.random() * 5; // An octave up + detune
  
  const now = audioCtx.currentTime;

  // Envelope: Sharp attack, long exponential decay
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

  panner.pan.value = pan;

  osc.connect(gain);
  overtone.connect(gain);
  gain.connect(panner);
  panner.connect(masterGain);

  osc.start(now);
  overtone.start(now);
  osc.stop(now + 3.0);
  overtone.stop(now + 3.0);
};

// Simple melody generator
const playMelody = () => {
  if (!isPlaying || !audioCtx) return;

  const now = audioCtx.currentTime;
  
  // Play a random chord or arpeggio based on the scale
  const rootIndex = Math.floor(Math.random() * (scale.length - 4));
  const note1 = scale[rootIndex];
  const note2 = scale[rootIndex + 2]; // 3rd
  const note3 = scale[rootIndex + 4]; // 5th

  // Strumming effect
  playBell(note1, 0.1, -0.5);
  setTimeout(() => playBell(note2, 0.08, 0), 100);
  setTimeout(() => playBell(note3, 0.08, 0.5), 200);

  // Occasional high sparkle
  if (Math.random() > 0.7) {
    setTimeout(() => playBell(scale[scale.length - 1], 0.05, (Math.random() * 2 - 1)), 400);
  }

  // Schedule next notes
  const nextTime = 800 + Math.random() * 1000;
  const id = window.setTimeout(playMelody, nextTime);
  timeoutIds.push(id);
};

export const audioManager = {
  start: async () => {
    initAudio();
    if (!masterGain) setupNodes();
    
    if (audioCtx?.state === 'suspended') {
      await audioCtx.resume();
    }
    
    if (!isPlaying) {
      isPlaying = true;
      playMelody();
    }
  },
  
  stop: () => {
    isPlaying = false;
    timeoutIds.forEach(id => clearTimeout(id));
    timeoutIds = [];
  },
  
  playInteractionSound: () => {
    initAudio();
    if (!masterGain) setupNodes();
    if (audioCtx?.state === 'suspended') audioCtx.resume();
    
    // Glitter sound
    const count = 5;
    for(let i=0; i<count; i++) {
        setTimeout(() => {
            const freq = scale[Math.floor(Math.random() * scale.length)] * 2;
            playBell(freq, 0.05, Math.random() * 2 - 1);
        }, i * 50);
    }
  }
};