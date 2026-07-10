import React, { useState, useEffect } from 'react';
import { CosmicVisualizer, VisualizerMode } from './components/CosmicVisualizer';
import { AudiophileEqualizer } from './components/AudiophileEqualizer';
import { HiResBadge } from './components/HiResBadge';
import { PlaylistTable } from './components/PlaylistTable';
import { DEMO_TRACKS, generateDemoAudioBuffer } from './demo/generator';
import { audioEngine } from './audio/AudioEngine';
import { AudioTrackMetadata } from './types/audio';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  ListMusic,
  Disc3,
  Library,
  FolderPlus,
  Radio,
  Layers,
  ShieldCheck,
  Headphones
} from 'lucide-react';

export const App: React.FC = () => {
  const [tracks, setTracks] = useState<AudioTrackMetadata[]>(DEMO_TRACKS as AudioTrackMetadata[]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrackMetadata>(DEMO_TRACKS[0] as AudioTrackMetadata);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(DEMO_TRACKS[0].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('orbital');
  const [activeCategory, setActiveCategory] = useState<'demo' | 'library' | 'favorites'>('demo');

  // Таймер обновления времени воспроизведения
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        const time = audioEngine.getCurrentTime();
        setCurrentTime(time);
        const dur = audioEngine.getDuration();
        if (dur > 0) setDuration(dur);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Загрузка и воспроизведение трека
  const loadAndPlayTrack = async (track: AudioTrackMetadata) => {
    audioEngine.stop();
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);

    try {
      if (track.demoType) {
        const ctx = (audioEngine as any).ctx || new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = generateDemoAudioBuffer(ctx, track.demoType);
        (audioEngine as any).currentBuffer = buffer;
        setDuration(track.duration);
        audioEngine.play(0);
        setIsPlaying(true);
      } else if (track.filePath && (window as any).electronAPI) {
        const buffer = await (window as any).electronAPI.readFileBuffer(track.filePath);
        await audioEngine.loadAudioBuffer(buffer);
        setDuration(audioEngine.getDuration());
        audioEngine.play(0);
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Ошибка воспроизведения:', e);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      if (currentTime === 0) {
        loadAndPlayTrack(currentTrack);
      } else {
        audioEngine.resume();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    audioEngine.seek(time);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    audioEngine.setVolume(newVol);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(0.85);
    } else {
      handleVolumeChange(0);
    }
  };

  const handleAddFiles = async () => {
    if (!(window as any).electronAPI) {
      alert('Импорт локальных файлов доступен в macOS .dmg версии (Electron)');
      return;
    }
    const filePaths: string[] = await (window as any).electronAPI.openAudioFiles();
    if (!filePaths || filePaths.length === 0) return;

    const newTracks: AudioTrackMetadata[] = [];
    for (const fp of filePaths) {
      const meta = await (window as any).electronAPI.readMetadata(fp);
      if (meta) {
        newTracks.push(meta);
      }
    }

    if (newTracks.length > 0) {
      setTracks((prev) => [...prev, ...newTracks]);
      setActiveCategory('library');
    }
  };

  const handleNext = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = tracks[(currentIndex + 1) % tracks.length];
    loadAndPlayTrack(nextTrack);
  };

  const handlePrevious = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevTrack = tracks[(currentIndex - 1 + tracks.length) % tracks.length];
    loadAndPlayTrack(prevTrack);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070811] text-white font-['Outfit',sans-serif] overflow-hidden select-none">
      {/* 1. ВЕРХНЯЯ ПАНЕЛЬ (HEADER) */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-2xl z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-[0_0_20px_rgba(0,242,254,0.4)]">
            <div className="w-full h-full bg-[#070811] rounded-[10px] flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent">
              AETHERIA
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
              APPLE SILICON M2 FLAGSHIP AUDIOPHILE
            </p>
          </div>
        </div>

        {/* Текущий режим работы и качество */}
        <div className="hidden lg:flex items-center gap-4">
          <HiResBadge
            codec={currentTrack.codec}
            sampleRate={currentTrack.sampleRate}
            bitDepth={currentTrack.bitDepth}
            bitrate={currentTrack.bitrate}
            isLossless={currentTrack.isLossless}
          />
        </div>

        {/* Импорт файлов */}
        <button
          onClick={handleAddFiles}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Добавить FLAC / WAV</span>
        </button>
      </header>

      {/* 2. ОСНОВНАЯ ОБЛАСТЬ (3 КОЛОНКИ: ЛЕВО, ЦЕНТР, ПРАВО) */}
      <main className="flex-1 flex overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА (САЙДБАР): Библиотека и Плейлисты */}
        <aside className="w-64 border-r border-white/10 bg-black/30 backdrop-blur-xl p-4 flex flex-col justify-between hidden md:flex">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-3 px-2">
              АУДИОФИЛЬСКАЯ БАЗА
            </div>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveCategory('demo')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === 'demo'
                    ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-500/40 text-cyan-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Hi-Res Demo Tracks</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10">
                  {DEMO_TRACKS.length}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('library')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === 'library'
                    ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-500/40 text-cyan-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <Library className="w-4 h-4 text-purple-400" />
                <span>Моя Библиотека</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10">
                  {tracks.length}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('favorites')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === 'favorites'
                    ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-500/40 text-cyan-300'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4 text-pink-400" />
                <span>Lossless Избранное</span>
              </button>
            </nav>
          </div>

          {/* Инфо-блок Apple Silicon M2 */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Apple Silicon M2 Native</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Прямой рендеринг через 64-битное ядро Web Audio DSP с нулевым джиттером.
            </p>
          </div>
        </aside>

        {/* ЦЕНТРАЛЬНАЯ КОЛОНКА: Визуализатор + Таблица треков */}
        <section className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 gap-6">
          {/* Интерактивный визуализатор в реальном времени */}
          <div className="w-full h-72 sm:h-80 flex-shrink-0">
            <CosmicVisualizer
              mode={visualizerMode}
              onModeChange={setVisualizerMode}
              isPlaying={isPlaying}
            />
          </div>

          {/* Таблица треков */}
          <div className="flex-1">
            <PlaylistTable
              tracks={tracks}
              currentTrackId={currentTrack.id}
              isPlaying={isPlaying}
              onSelectTrack={loadAndPlayTrack}
              onAddFiles={handleAddFiles}
            />
          </div>
        </section>

        {/* ПРАВАЯ КОЛОНКА: 10-полосный эквалайзер + Spatializer */}
        <aside className="w-96 border-l border-white/10 bg-black/30 backdrop-blur-xl p-4 overflow-y-auto hidden xl:block">
          <AudiophileEqualizer />
        </aside>
      </main>

      {/* 3. НИЖНЯЯ ПАНЕЛЬ ПЛЕЕРА (AUDIOPHILE DECK) */}
      <footer className="h-24 px-6 flex items-center justify-between border-t border-white/10 bg-black/70 backdrop-blur-2xl z-30">
        {/* Текущий трек */}
        <div className="flex items-center gap-4 w-1/4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center shadow-md">
            <Radio className="w-6 h-6 text-cyan-300" />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-sm truncate text-white">{currentTrack.title}</div>
            <div className="text-xs text-white/50 truncate flex items-center gap-2 mt-0.5">
              <span>{currentTrack.artist}</span>
              <span className="text-amber-400 font-mono text-[10px]">
                {currentTrack.bitDepth}b/{currentTrack.sampleRate / 1000}k
              </span>
            </div>
          </div>
        </div>

        {/* Управление воспроизведением и ползунок времени */}
        <div className="flex flex-col items-center gap-2 w-2/4 max-w-xl">
          <div className="flex items-center gap-6">
            <button
              onClick={handlePrevious}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* Прогресс-бар трека */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[11px] font-mono text-white/50 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 appearance-none bg-white/10 rounded-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[11px] font-mono text-white/50 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Громкость и аудиофильный индикатор */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          <Headphones className="w-4 h-4 text-cyan-400 hidden sm:block" />
          <button onClick={toggleMute} className="text-white/60 hover:text-white">
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1.5 appearance-none bg-white/10 rounded-full accent-cyan-400 cursor-pointer"
          />
        </div>
      </footer>
    </div>
  );
};
