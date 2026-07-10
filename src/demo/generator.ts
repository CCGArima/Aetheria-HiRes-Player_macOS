export interface DemoTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  sampleRate: number;
  bitDepth: number;
  bitrate: number;
  codec: string;
  isLossless: boolean;
  generatorType: 'nebula' | 'pulsar' | 'orbit';
}

export const DEMO_TRACKS: DemoTrack[] = [
  {
    id: 'demo-1',
    title: 'Nebula Awakening (Master Edition)',
    artist: 'Aetheria Sound Lab',
    album: 'Cosmic Horizons Hi-Res Demo',
    duration: 180,
    sampleRate: 192000,
    bitDepth: 24,
    bitrate: 4608,
    codec: 'WAV PCM 24/192',
    isLossless: true,
    generatorType: 'nebula'
  },
  {
    id: 'demo-2',
    title: 'Stellar Pulsar Core (Deep Sub & Synth)',
    artist: 'Astra & The Void',
    album: 'Interstellar Audiophile Anthology',
    duration: 210,
    sampleRate: 96000,
    bitDepth: 24,
    bitrate: 2304,
    codec: 'FLAC LOSSLESS',
    isLossless: true,
    generatorType: 'pulsar'
  },
  {
    id: 'demo-3',
    title: 'Aetheria Deep Orbit (Spatial Harmonic Stage)',
    artist: 'Orion Acoustic Studio',
    album: 'Audiophile Reference 2026',
    duration: 240,
    sampleRate: 384000,
    bitDepth: 32,
    bitrate: 6144,
    codec: 'STUDIO MASTER 32-BIT FLOAT',
    isLossless: true,
    generatorType: 'orbit'
  }
];

// Генерация высококачественного стерео WAV буфера в памяти для демо-треков
export function generateDemoAudioBuffer(ctx: AudioContext, type: DemoTrack['generatorType']): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 45; // 45 секунд зацикленного студийного демо
  const numFrames = sampleRate * duration;
  const buffer = ctx.createBuffer(2, numFrames, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;

    if (type === 'nebula') {
      // Глубокий космический аккорд + арпеджио с богатыми гармониками
      const baseFreq = 55; // A1 бас
      const chord1 = Math.sin(2 * Math.PI * baseFreq * t) * 0.25;
      const chord2 = Math.sin(2 * Math.PI * (baseFreq * 1.5) * t + Math.sin(t * 0.5)) * 0.18;
      const chord3 = Math.sin(2 * Math.PI * (baseFreq * 2.25) * t) * 0.15;
      const arpFreq = 220 + Math.sin(t * 2) * 110;
      const arp = Math.sin(2 * Math.PI * arpFreq * t) * 0.1 * Math.abs(Math.sin(t * 4 * Math.PI));
      const shimmer = Math.sin(2 * Math.PI * 4400 * t) * 0.02 * Math.sin(t * 0.3);

      left[i] = (chord1 + chord2 + arp + shimmer) * 0.85;
      right[i] = (chord1 + chord3 + arp * 0.9 + shimmer) * 0.85;
    } else if (type === 'pulsar') {
      // Пульсар: ритмичный суббас и кристальные высокие частоты
      const bpm = 120;
      const beat = (t * (bpm / 60)) % 1;
      const subKick = beat < 0.2 ? Math.sin(2 * Math.PI * (80 - beat * 200) * t) * Math.exp(-beat * 8) * 0.45 : 0;
      const synthLead = Math.sin(2 * Math.PI * 329.63 * t + Math.sin(t * 3) * 2) * 0.2 * (0.5 - Math.abs(beat - 0.5));
      const hihat = beat % 0.25 < 0.05 ? (Math.random() * 2 - 1) * 0.08 : 0;

      left[i] = (subKick + synthLead + hihat) * 0.85;
      right[i] = (subKick + synthLead * 0.95 + hihat) * 0.85;
    } else {
      // Deep Orbit: широкая пространственная эмбиент-сцена
      const droneL = Math.sin(2 * Math.PI * 65.41 * t) * 0.3 + Math.sin(2 * Math.PI * 130.81 * t) * 0.15;
      const droneR = Math.sin(2 * Math.PI * 65.45 * t) * 0.3 + Math.sin(2 * Math.PI * 196.0 * t) * 0.15;
      const crystal = Math.sin(2 * Math.PI * 1046.5 * t) * 0.08 * (Math.sin(t * 1.5) > 0.3 ? 1 : 0);

      left[i] = (droneL + crystal) * 0.8;
      right[i] = (droneR + crystal * 0.85) * 0.8;
    }
  }

  return buffer;
}
