export type AudioCodec = 'FLAC' | 'WAV' | 'ALAC' | 'AIFF' | 'MP3' | 'AAC' | 'OGG' | 'STUDIO MASTER 32-BIT FLOAT';

export interface AudioTrackMetadata {
  id: string;
  filePath?: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  sampleRate: number;
  bitDepth: number;
  bitrate: number;
  channels: number;
  codec: AudioCodec | string;
  isLossless: boolean;
  dynamicRange: number; // e.g. DR14
  coverArt?: string; // base64 / data URL
  demoType?: 'nebula' | 'pulsar' | 'orbit';
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
}

export interface EqualizerPreset {
  name: string;
  gains: number[];
}

export type VisualizerMode = 'orbital' | 'warp' | 'aurora';
