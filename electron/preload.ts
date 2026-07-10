import { contextBridge, ipcRenderer } from 'electron';

export interface AudioTrackMetadata {
  filePath: string;
  fileName: string;
  title: string;
  artist: string;
  album: string;
  codec: string;
  sampleRate: number;
  bitDepth: number;
  bitrate: number;
  fileSize: number;
  isLossless: boolean;
}

const electronAPI = {
  openAudioFiles: (): Promise<string[]> => ipcRenderer.invoke('dialog:openAudioFiles'),
  readMetadata: (filePath: string): Promise<AudioTrackMetadata | null> =>
    ipcRenderer.invoke('audio:readMetadata', filePath),
  readFileBuffer: (filePath: string): Promise<ArrayBuffer> =>
    ipcRenderer.invoke('audio:readFileBuffer', filePath)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
