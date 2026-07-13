export interface EqualizerPreset {
  name: string;
  category: 'audiophile' | 'genre' | 'spatial';
  gains: number[]; // 10 полос: 31.5, 63, 125, 250, 500, 1k, 2k, 4k, 8k, 16k
}

export const EQ_FREQUENCIES = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: EqualizerPreset[] = [
  // АУДИОФИЛЬСКИЕ / РЕФЕРЕНСНЫЕ ПРЕСЕТЫ
  { name: 'Pure Direct (Flat)', category: 'audiophile', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Studio Master Reference', category: 'audiophile', gains: [1.5, 1.0, 0.5, 0, 0, 0.5, 1.0, 1.5, 2.5, 3.0] },
  { name: 'Cosmic Immersion', category: 'audiophile', gains: [4.5, 3.5, 2.0, 0.5, -1.0, 0, 1.5, 3.0, 4.5, 5.5] },
  { name: 'Deep Nebula Bass', category: 'audiophile', gains: [6.5, 5.5, 4.0, 1.5, 0, -0.5, 0, 1.0, 2.0, 2.5] },
  { name: 'Vocal Presence & Air', category: 'audiophile', gains: [-1.5, -0.5, 0, 1.0, 2.5, 4.0, 3.5, 3.0, 3.5, 4.5] },

  // ЖАНРОВЫЕ ПРЕСЕТЫ (GENRES)
  { name: 'Electronic / EDM', category: 'genre', gains: [5.5, 4.5, 2.0, 0, -1.5, 1.0, 2.0, 3.5, 4.5, 5.0] },
  { name: 'Synthwave / Cyberpunk', category: 'genre', gains: [4.5, 3.5, 1.5, 0.5, 0, 1.5, 3.0, 4.0, 4.5, 5.0] },
  { name: 'Rock / Heavy Metal', category: 'genre', gains: [4.0, 3.0, 1.0, -1.0, -1.5, 0.5, 2.5, 4.0, 4.5, 5.0] },
  { name: 'Jazz Lounge & Acoustic', category: 'genre', gains: [3.0, 2.5, 1.5, 1.0, 0.5, 1.5, 2.0, 2.5, 3.5, 4.0] },
  { name: 'Symphonic Classical', category: 'genre', gains: [3.5, 2.5, 1.0, 0, 0, 0.5, 1.5, 2.5, 3.5, 4.5] },
  { name: 'Hip-Hop & 808 Trap', category: 'genre', gains: [7.0, 5.5, 3.0, 0.5, -1.0, 0.5, 1.0, 2.0, 3.0, 3.5] },
  { name: 'Modern Pop Stage', category: 'genre', gains: [2.5, 2.0, 1.0, 0.5, 1.5, 2.5, 3.0, 3.5, 4.0, 4.5] },
  { name: 'Lofi Chill & Ambient', category: 'genre', gains: [4.0, 3.5, 2.0, 1.0, 0.5, 0, 0.5, 1.0, 1.5, 1.0] }
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];

  private currentBuffer: AudioBuffer | null = null;
  private startedAt = 0;
  private pausedAt = 0;
  private isPlayingState = false;

  // Оптимизированные внутренние буферы для FFT, чтобы избежать лишней сборки мусора (GC)
  private freqDataBuffer: Uint8Array | null = null;
  private timeDataBuffer: Uint8Array | null = null;

  constructor() {}

  /** Инициализирует и возвращает AudioContext движка */
  public getContext(): AudioContext {
    this.initContext();
    return this.ctx!;
  }

  /** Загружает демо-буфер напрямую */
  public loadBuffer(buffer: AudioBuffer) {
    this.initContext();
    this.currentBuffer = buffer;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 96000 });

      // Анализатор спектра с высоким разрешением FFT (4096 точек)
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 4096;
      this.analyserNode.smoothingTimeConstant = 0.82;

      this.freqDataBuffer = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeDataBuffer = new Uint8Array(this.analyserNode.frequencyBinCount);

      // Главный регулятор громкости
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.85;

      // Создаем 10 фильтров эквалайзера в цепочке
      this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.ctx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.414;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Соединяем фильтры последовательно
      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }

      // Выход эквалайзера -> Анализатор -> Громкость -> Выход AudioContext
      const lastEq = this.eqFilters[this.eqFilters.length - 1];
      lastEq.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    }
  }

  public async loadAudioBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    this.initContext();
    const copiedBuffer = arrayBuffer.slice(0);
    const decoded = await this.ctx!.decodeAudioData(copiedBuffer);
    this.currentBuffer = decoded;
    return decoded;
  }

  public play(offsetSeconds = 0) {
    this.initContext();
    if (this.ctx!.state === 'suspended') {
      this.ctx!.resume();
    }
    this.stop();

    if (!this.currentBuffer) return;

    this.sourceNode = this.ctx!.createBufferSource();
    this.sourceNode.buffer = this.currentBuffer;
    this.sourceNode.connect(this.eqFilters[0]);

    this.pausedAt = offsetSeconds;
    this.startedAt = this.ctx!.currentTime - offsetSeconds;
    this.sourceNode.start(0, offsetSeconds);
    this.isPlayingState = true;
  }

  public pause() {
    if (!this.isPlayingState) return;
    this.pausedAt = this.getCurrentTime();
    this.stopSource();
    this.isPlayingState = false;
  }

  public resume() {
    if (this.isPlayingState || !this.currentBuffer) return;
    this.play(this.pausedAt);
  }

  public stop() {
    this.stopSource();
    this.pausedAt = 0;
    this.isPlayingState = false;
  }

  private stopSource() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // Source already stopped
      }
      this.sourceNode = null;
    }
  }

  public seek(targetSeconds: number) {
    const wasPlaying = this.isPlayingState;
    this.pausedAt = targetSeconds;
    if (wasPlaying) {
      this.play(targetSeconds);
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlayingState) return this.pausedAt;
    if (!this.ctx || !this.currentBuffer) return 0;
    const elapsed = this.ctx.currentTime - this.startedAt;
    return Math.min(elapsed, this.currentBuffer.duration);
  }

  public getDuration(): number {
    return this.currentBuffer ? this.currentBuffer.duration : 0;
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public setVolume(volume: number) {
    this.initContext();
    if (this.gainNode && this.ctx) {
      // Плавное изменение громкости без щелчков (Zero-click DSP transition)
      const clamped = Math.max(0, Math.min(1, volume));
      this.gainNode.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.03);
    }
  }

  public setEqGain(bandIndex: number, gainDb: number) {
    this.initContext();
    if (this.eqFilters[bandIndex] && this.ctx) {
      // Плавная интерполяция усиления для исключения щелчков
      this.eqFilters[bandIndex].gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.04);
    }
  }

  public setEqPreset(preset: EqualizerPreset) {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    preset.gains.forEach((gain, i) => {
      if (this.eqFilters[i]) {
        this.eqFilters[i].gain.setTargetAtTime(gain, now, 0.04);
      }
    });
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode || !this.freqDataBuffer) return new Uint8Array(0);
    this.analyserNode.getByteFrequencyData(this.freqDataBuffer);
    return this.freqDataBuffer;
  }

  public getTimeDomainData(): Uint8Array {
    if (!this.analyserNode || !this.timeDataBuffer) return new Uint8Array(0);
    this.analyserNode.getByteTimeDomainData(this.timeDataBuffer);
    return this.timeDataBuffer;
  }

  public getAudioContextSampleRate(): number {
    return this.ctx ? this.ctx.sampleRate : 96000;
  }
}

export const audioEngine = new AudioEngine();
