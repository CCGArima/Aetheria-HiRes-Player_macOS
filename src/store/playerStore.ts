import { AudioTrackMetadata, EqualizerPreset, VisualizerMode } from '../types/audio';
import { DEMO_TRACKS } from '../demo/generator';

export interface PlayerStoreState {
  playlist: AudioTrackMetadata[];
  currentTrack: AudioTrackMetadata;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  visualizerMode: VisualizerMode;
  spatializerEnabled: boolean;
  eqPresetName: string;
  eqGains: number[];
}

export const initialPlayerState: PlayerStoreState = {
  playlist: DEMO_TRACKS as AudioTrackMetadata[],
  currentTrack: DEMO_TRACKS[0] as AudioTrackMetadata,
  isPlaying: false,
  currentTime: 0,
  duration: DEMO_TRACKS[0].duration,
  volume: 0.85,
  isMuted: false,
  visualizerMode: 'orbital',
  spatializerEnabled: true,
  eqPresetName: 'Pure Direct',
  eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
