import React, { useState, useEffect } from 'react';
import { CosmicVisualizer, VisualizerMode } from './components/CosmicVisualizer';
import { AudiophileEqualizer } from './components/AudiophileEqualizer';
import { HiResBadge } from './components/HiResBadge';
import { PlaylistTable } from './components/PlaylistTable';
import { CoverFlow, AlbumCover } from './components/CoverFlow';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { ThemePicker } from './components/ThemePicker';
import { DEMO_TRACKS, generateDemoAudioBuffer } from './demo/generator';
import { audioEngine } from './audio/AudioEngine';
import { AudioTrackMetadata } from './types/audio';
import { generateBase64SvgCover } from './utils/coverArt';
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
  Layers,
  ShieldCheck,
  Headphones,
  LayoutGrid,
  Waves,
} from 'lucide-react';

const LIBRARY_STORAGE_KEY = 'aetheria-user-library';

// Проверка, является ли трек демонстрационным
function isDemoTrack(t: AudioTrackMetadata): boolean {
  return Boolean(t.demoType || t.id?.startsWith('demo-'));
}

// Подготовить треки для сохранения (убрать демо-треки, сохранить coverArt)
function prepareTracksForSave(allTracks: AudioTrackMetadata[]): object[] {
  return allTracks.filter((t) => !isDemoTrack(t));
}

function isCorruptCoverArt(url?: string): boolean {
  if (!url) return true;
  if (url.startsWith('data:image/svg+xml;utf8,')) return true;
  const base64Idx = url.indexOf(';base64,');
  if (base64Idx !== -1) {
    const payload = url.slice(base64Idx + 8);
    if (payload.includes(',')) return true;
  }
  return false;
}

// Ensure track has coverArt (and replace corrupt data URIs)
function ensureTrackCoverArt(t: AudioTrackMetadata): AudioTrackMetadata {
  if (t.coverArt && !isCorruptCoverArt(t.coverArt)) return t;
  t.coverArt = generateBase64SvgCover(t.album || t.title, '#00f2fe');
  return t;
}

type CenterView = 'visualizer' | 'coverflow';

const AppInner: React.FC = () => {
  const { theme } = useTheme();
  const c = theme.colors;

  const [tracks, setTracks] = useState<AudioTrackMetadata[]>(DEMO_TRACKS as AudioTrackMetadata[]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrackMetadata>(DEMO_TRACKS[0] as AudioTrackMetadata);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(DEMO_TRACKS[0].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('orbital');
  const [activeCategory, setActiveCategory] = useState<'all' | 'demo' | 'library' | 'favorites'>('demo');
  const [centerView, setCenterView] = useState<CenterView>('visualizer');
  const libraryLoaded = React.useRef(false);

  // Загрузка сохранённой библиотеки при старте
  useEffect(() => {
    const load = async () => {
      let savedTracks: AudioTrackMetadata[] = [];

      // 1. Попытка загрузки из файла через Electron IPC
      try {
        const api = (window as any).electronAPI;
        if (api?.loadLibrary) {
          const fromFile = await api.loadLibrary();
          if (Array.isArray(fromFile) && fromFile.length > 0) {
            savedTracks = fromFile;
          }
        }
      } catch (e) {
        console.warn('electronAPI.loadLibrary не доступен:', e);
      }

      // 2. Fallback: загрузка из localStorage
      if (savedTracks.length === 0) {
        try {
          const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              savedTracks = parsed;
            }
          }
        } catch (e) {
          console.warn('localStorage загрузка не удалась:', e);
        }
      }

      if (savedTracks.length > 0) {
        // Re-extract cover art for tracks that were saved without it
        const api = (window as any).electronAPI;
        if (api?.readMetadata) {
          for (const track of savedTracks) {
            if (track.filePath && (!track.coverArt || track.coverArt.startsWith('data:image/svg+xml') || isCorruptCoverArt(track.coverArt))) {
              try {
                const meta = await api.readMetadata(track.filePath);
                if (meta?.coverArt && !meta.coverArt.startsWith('data:image/svg+xml')) {
                  track.coverArt = meta.coverArt;
                }
              } catch {}
            }
          }
        }

        const tracksWithCovers = savedTracks.map(ensureTrackCoverArt);

        setTracks((prev) => {
          // Исключаем дубликаты (по id и filePath)
          const existingIds = new Set(prev.map((t) => t.id));
          const existingPaths = new Set(prev.map((t) => t.filePath).filter(Boolean));
          const newTracks = tracksWithCovers.filter(
            (t) => !existingIds.has(t.id) && (!t.filePath || !existingPaths.has(t.filePath))
          );
          return newTracks.length > 0 ? [...prev, ...newTracks] : prev;
        });
        setActiveCategory('library');
      }

      libraryLoaded.current = true;
    };
    load();
  }, []);

  // Автосохранение при изменении треков (ТОЛЬКО после успешного завершения стартовой загрузки!)
  useEffect(() => {
    if (!libraryLoaded.current) {
      return;
    }

    const tracksToSave = prepareTracksForSave(tracks);

    // Сохраняем в localStorage
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(tracksToSave));
    } catch (e) {
      console.warn('localStorage сохранение не удалось:', e);
    }

    // Сохраняем в файл через Electron IPC
    try {
      const api = (window as any).electronAPI;
      if (api?.saveLibrary) {
        api.saveLibrary(tracksToSave);
      }
    } catch (e) {
      console.warn('electronAPI.saveLibrary не удалось:', e);
    }
  }, [tracks]);

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

  const libraryTracksCount = React.useMemo(
    () => tracks.filter((t) => !isDemoTrack(t)).length,
    [tracks]
  );
  const demoTracksCount = React.useMemo(
    () => tracks.filter((t) => isDemoTrack(t)).length,
    [tracks]
  );
  const favoritesTracksCount = React.useMemo(
    () => tracks.filter((t) => t.isLossless).length,
    [tracks]
  );

  const displayedTracks = React.useMemo(() => {
    if (activeCategory === 'demo') {
      return tracks.filter((t) => isDemoTrack(t));
    }
    if (activeCategory === 'library') {
      return tracks.filter((t) => !isDemoTrack(t));
    }
    if (activeCategory === 'favorites') {
      return tracks.filter((t) => t.isLossless);
    }
    return tracks;
  }, [tracks, activeCategory]);

  // Build album list for Cover Flow
  const albumCovers = React.useMemo<AlbumCover[]>(() => {
    const albumMap = new Map<string, { artist: string; coverArt?: string; count: number }>();
    for (const t of tracks) {
      const existing = albumMap.get(t.album);
      if (existing) {
        existing.count++;
        if (!existing.coverArt && t.coverArt) {
          existing.coverArt = t.coverArt;
        }
      } else {
        albumMap.set(t.album, {
          artist: t.artist,
          coverArt: t.coverArt,
          count: 1,
        });
      }
    }
    return Array.from(albumMap.entries()).map(([album, info]) => ({
      album,
      artist: info.artist,
      coverArt: info.coverArt,
      trackCount: info.count,
    }));
  }, [tracks]);

  // Загрузка и воспроизведение трека
  const loadAndPlayTrack = async (track: AudioTrackMetadata) => {
    audioEngine.stop();
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);

    try {
      if (track.demoType) {
        const ctx = audioEngine.getContext();
        const buffer = generateDemoAudioBuffer(ctx, track.demoType);
        audioEngine.loadBuffer(buffer);
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

  // Import individual audio files
  const importFiles = async (filePaths: string[]) => {
    if (!filePaths || filePaths.length === 0) return;

    const newTracks: AudioTrackMetadata[] = [];
    for (const fp of filePaths) {
      const meta = await (window as any).electronAPI.readMetadata(fp);
      if (meta) {
        newTracks.push(ensureTrackCoverArt(meta));
      }
    }

    if (newTracks.length > 0) {
      libraryLoaded.current = true;
      setTracks((prev) => {
        const newByPath = new Map(newTracks.filter((t) => t.filePath).map((t) => [t.filePath, t]));
        const updatedPrev = prev.map((oldTrack) => {
          if (oldTrack.filePath && newByPath.has(oldTrack.filePath)) {
            const fresh = newByPath.get(oldTrack.filePath)!;
            return { ...oldTrack, ...fresh };
          }
          return oldTrack;
        });
        const existingPaths = new Set(prev.map((t) => t.filePath).filter(Boolean));
        const uniqueNew = newTracks.filter((t) => !t.filePath || !existingPaths.has(t.filePath));
        const updated = [...updatedPrev, ...uniqueNew];
        const tracksToSave = prepareTracksForSave(updated);
        try {
          localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(tracksToSave));
        } catch (e) {}
        try {
          const api = (window as any).electronAPI;
          if (api?.saveLibrary) {
            api.saveLibrary(tracksToSave);
          }
        } catch (e) {}
        return updated;
      });
      setActiveCategory('library');
    }
  };

  const handleAddFiles = async () => {
    if (!(window as any).electronAPI) {
      alert('Importing local files is available in the macOS .dmg version (Electron)');
      return;
    }
    const filePaths: string[] = await (window as any).electronAPI.openAudioFiles();
    await importFiles(filePaths);
  };

  const handleAddFolder = async () => {
    if (!(window as any).electronAPI?.openAudioFolder) {
      alert('Folder import is available in the macOS .dmg version (Electron)');
      return;
    }
    const filePaths: string[] = await (window as any).electronAPI.openAudioFolder();
    await importFiles(filePaths);
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

  const handleSelectAlbum = (albumName: string) => {
    // Filter tracks by this album - switch to 'all' view to show them
    setActiveCategory('all');
    // Could add album filter here in the future
  };

  return (
    <div
      className="flex flex-col h-screen w-screen text-white font-['Outfit',sans-serif] overflow-hidden select-none"
      style={{ backgroundColor: c.bgPrimary }}
    >
      {/* 1. ВЕРХНЯЯ ПАНЕЛЬ (HEADER) */}
      <header
        className="h-16 px-6 flex items-center justify-between backdrop-blur-2xl z-30"
        style={{
          borderBottom: `1px solid ${c.glassBorder}`,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl p-0.5"
            style={{
              background: `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientVia}, ${c.gradientTo})`,
              boxShadow: `0 0 20px ${c.accentGlow}`,
            }}
          >
            <div
              className="w-full h-full rounded-[10px] flex items-center justify-center"
              style={{ backgroundColor: c.bgPrimary }}
            >
              <Disc3 className="w-5 h-5 animate-spin" style={{ animationDuration: '10s', color: c.accent }} />
            </div>
          </div>
          <div>
            <h1
              className="text-base font-extrabold tracking-wider bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, white, ${c.accent}, ${c.accentSecondary})`,
              }}
            >
              AETHERIA
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
              APPLE SILICON FLAGSHIP AUDIOPHILE
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

        <div className="flex items-center gap-3">
          {/* Theme Picker */}
          <ThemePicker />

          {/* Импорт файлов */}
          <button
            onClick={handleAddFiles}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all"
            style={{
              background: `linear-gradient(to right, ${c.gradientFrom}, ${c.gradientVia})`,
              boxShadow: `0 0 20px ${c.accentGlow}`,
            }}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add FLAC / WAV</span>
          </button>
        </div>
      </header>

      {/* 2. ОСНОВНАЯ ОБЛАСТЬ (3 КОЛОНКИ: ЛЕВО, ЦЕНТР, ПРАВО) */}
      <main className="flex-1 flex overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА (САЙДБАР): Библиотека и Плейлисты */}
        <aside
          className="w-64 backdrop-blur-xl p-4 flex flex-col justify-between hidden md:flex"
          style={{
            borderRight: `1px solid ${c.glassBorder}`,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        >
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-3 px-2">
              AUDIOPHILE DATABASE
            </div>
            <nav className="flex flex-col gap-1">
              {/* View toggle: Visualizer / Cover Flow */}
              <div className="flex gap-1 mb-3">
                <button
                  onClick={() => setCenterView('visualizer')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: centerView === 'visualizer' ? `rgba(${c.accentRgb}, 0.2)` : 'transparent',
                    border: centerView === 'visualizer' ? `1px solid rgba(${c.accentRgb}, 0.3)` : '1px solid transparent',
                    color: centerView === 'visualizer' ? c.accent : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Waves className="w-3.5 h-3.5" />
                  Visualizer
                </button>
                <button
                  onClick={() => setCenterView('coverflow')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: centerView === 'coverflow' ? `rgba(${c.accentRgb}, 0.2)` : 'transparent',
                    border: centerView === 'coverflow' ? `1px solid rgba(${c.accentRgb}, 0.3)` : '1px solid transparent',
                    color: centerView === 'coverflow' ? c.accent : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Cover Flow
                </button>
              </div>

              <button
                onClick={() => setActiveCategory('all')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: activeCategory === 'all' ? `linear-gradient(to right, rgba(${c.accentRgb}, 0.15), rgba(${c.accentSecondaryRgb}, 0.1))` : 'transparent',
                  border: activeCategory === 'all' ? `1px solid rgba(${c.accentRgb}, 0.3)` : '1px solid transparent',
                  color: activeCategory === 'all' ? c.accent : 'rgba(255,255,255,0.7)',
                }}
              >
                <ListMusic className="w-4 h-4" style={{ color: c.accent }} />
                <span>All Tracks</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10">
                  {tracks.length}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('library')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: activeCategory === 'library' ? `linear-gradient(to right, rgba(${c.accentRgb}, 0.15), rgba(${c.accentSecondaryRgb}, 0.1))` : 'transparent',
                  border: activeCategory === 'library' ? `1px solid rgba(${c.accentRgb}, 0.3)` : '1px solid transparent',
                  color: activeCategory === 'library' ? c.accent : 'rgba(255,255,255,0.7)',
                }}
              >
                <Library className="w-4 h-4" style={{ color: c.accentSecondary }} />
                <span>My Library</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10">
                  {libraryTracksCount}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('demo')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: activeCategory === 'demo' ? `linear-gradient(to right, rgba(${c.accentRgb}, 0.15), rgba(${c.accentSecondaryRgb}, 0.1))` : 'transparent',
                  border: activeCategory === 'demo' ? `1px solid rgba(${c.accentRgb}, 0.3)` : '1px solid transparent',
                  color: activeCategory === 'demo' ? c.accent : 'rgba(255,255,255,0.7)',
                }}
              >
                <Sparkles className="w-4 h-4" style={{ color: c.accent }} />
                <span>Hi-Res Demo</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10">
                  {demoTracksCount}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('favorites')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: activeCategory === 'favorites' ? `linear-gradient(to right, rgba(${c.accentRgb}, 0.15), rgba(${c.accentSecondaryRgb}, 0.1))` : 'transparent',
                  border: activeCategory === 'favorites' ? `1px solid rgba(${c.accentRgb}, 0.3)` : '1px solid transparent',
                  color: activeCategory === 'favorites' ? c.accent : 'rgba(255,255,255,0.7)',
                }}
              >
                <Layers className="w-4 h-4" style={{ color: c.accentSecondary }} />
                <span>Lossless Favorites</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10">
                  {favoritesTracksCount}
                </span>
              </button>
            </nav>
          </div>

          {/* Инфо-блок Apple Silicon */}
          <div
            className="p-3.5 rounded-xl text-xs"
            style={{
              background: c.glassBg,
              border: `1px solid ${c.glassBorder}`,
            }}
          >
            <div className="flex items-center gap-2 font-bold mb-1" style={{ color: c.accent }}>
              <ShieldCheck className="w-4 h-4" />
              <span>Apple Silicon Native</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              64-bit Web Audio DSP rendering with zero-jitter playback.
            </p>
          </div>
        </aside>

        {/* ЦЕНТРАЛЬНАЯ КОЛОНКА: Визуализатор/CoverFlow + Таблица треков */}
        <section className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 gap-6">
          {/* Top view: Visualizer or Cover Flow */}
          <div className="w-full h-72 sm:h-80 flex-shrink-0">
            {centerView === 'visualizer' ? (
              <CosmicVisualizer
                mode={visualizerMode}
                onModeChange={setVisualizerMode}
                isPlaying={isPlaying}
              />
            ) : (
              <CoverFlow
                albums={albumCovers}
                onSelectAlbum={handleSelectAlbum}
                accentColor={c.accent}
                accentRgb={c.accentRgb}
              />
            )}
          </div>

          {/* Таблица треков */}
          <div className="flex-1">
            <PlaylistTable
              tracks={displayedTracks}
              currentTrackId={currentTrack.id}
              isPlaying={isPlaying}
              onSelectTrack={loadAndPlayTrack}
              onAddFiles={handleAddFiles}
              onAddFolder={handleAddFolder}
              accentColor={c.accent}
              accentRgb={c.accentRgb}
            />
          </div>
        </section>

        {/* ПРАВАЯ КОЛОНКА: 10-полосный эквалайзер + Spatializer */}
        <aside
          className="w-96 backdrop-blur-xl p-4 overflow-y-auto hidden xl:block"
          style={{
            borderLeft: `1px solid ${c.glassBorder}`,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        >
          <AudiophileEqualizer />
        </aside>
      </main>

      {/* 3. НИЖНЯЯ ПАНЕЛЬ ПЛЕЕРА (AUDIOPHILE DECK) */}
      <footer
        className="h-24 px-6 flex items-center justify-between backdrop-blur-2xl z-30"
        style={{
          borderTop: `1px solid ${c.glassBorder}`,
          backgroundColor: 'rgba(0,0,0,0.7)',
        }}
      >
        {/* Текущий трек с обложкой */}
        <div className="flex items-center gap-4 w-1/4">
          <div
            className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden shadow-lg"
            style={{
              border: `1px solid ${c.glassBorder}`,
              boxShadow: currentTrack.coverArt ? `0 0 20px ${c.accentGlow}` : undefined,
            }}
          >
            {(() => {
              const coverSrc = currentTrack.coverArt || generateBase64SvgCover(currentTrack.album || currentTrack.title, c.accent);
              const fallback = generateBase64SvgCover(currentTrack.album || currentTrack.title, c.accent);
              return (
                <img
                  src={coverSrc}
                  alt={currentTrack.album}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
              );
            })()}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-sm truncate text-white">{currentTrack.title}</div>
            <div className="text-xs text-white/50 truncate flex items-center gap-2 mt-0.5">
              <span>{currentTrack.artist}</span>
              <span className="font-mono text-[10px]" style={{ color: c.accent }}>
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
              className="w-12 h-12 rounded-full text-white flex items-center justify-center hover:scale-105 transition-transform"
              style={{
                background: `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientVia}, ${c.gradientTo})`,
                boxShadow: `0 0 25px ${c.accentGlow}`,
              }}
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
              className="flex-1 h-1.5 appearance-none bg-white/10 rounded-full cursor-pointer"
            />
            <span className="text-[11px] font-mono text-white/50 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Громкость и аудиофильный индикатор */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          <Headphones className="w-4 h-4 hidden sm:block" style={{ color: c.accent }} />
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
            className="w-24 h-1.5 appearance-none bg-white/10 rounded-full cursor-pointer"
          />
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
};
