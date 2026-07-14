import React, { useState } from 'react';
import { Play, Pause, Search, Music, FolderPlus, Sparkles, Disc3 } from 'lucide-react';
import { generateBase64SvgCover } from '../utils/coverArt';

export interface PlaylistTrack {
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
  filePath?: string;
  coverArt?: string;
  demoType?: 'nebula' | 'pulsar' | 'orbit';
}

interface PlaylistTableProps {
  tracks: PlaylistTrack[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onSelectTrack: (track: PlaylistTrack) => void;
  onAddFiles: () => void;
  onAddFolder?: () => void;
  accentColor?: string;
  accentRgb?: string;
}

export const PlaylistTable: React.FC<PlaylistTableProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onSelectTrack,
  onAddFiles,
  onAddFolder,
  accentColor = 'var(--accent)',
  accentRgb = 'var(--accent-rgb)',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTracks = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full flex flex-col bg-black/40 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]"
      style={{ border: `1px solid var(--glass-border)` }}
    >
      {/* Верхняя панель управления списком */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-white/[0.02]"
        style={{ borderBottom: `1px solid var(--glass-border)` }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border"
            style={{
              background: `linear-gradient(135deg, rgba(${accentRgb}, 0.2), rgba(${accentRgb}, 0.05))`,
              borderColor: `rgba(${accentRgb}, 0.4)`,
              color: accentColor,
            }}
          >
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">AETHERIA HI-RES PLAYLIST</h3>
            <p className="text-xs text-white/50">{tracks.length} tracks in audiophile quality</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Поиск */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none transition-colors w-48 sm:w-64"
              style={{
                border: `1px solid var(--glass-border)`,
              }}
            />
          </div>

          {/* Кнопка добавления папки */}
          {onAddFolder && (
            <button
              onClick={onAddFolder}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-bold transition-all"
              style={{
                background: `rgba(${accentRgb}, 0.15)`,
                border: `1px solid rgba(${accentRgb}, 0.3)`,
                color: accentColor,
              }}
            >
              <FolderPlus className="w-4 h-4" />
              <span>Album</span>
            </button>
          )}

          {/* Кнопка добавления файлов из macOS */}
          <button
            onClick={onAddFiles}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition-all"
            style={{
              background: `linear-gradient(to right, var(--gradient-from), var(--gradient-via))`,
              boxShadow: `0 0 20px rgba(${accentRgb}, 0.3)`,
            }}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add FLAC / WAV</span>
          </button>
        </div>
      </div>

      {/* Таблица треков */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-white/40 text-[11px] uppercase font-mono tracking-wider"
              style={{ borderBottom: `1px solid var(--glass-border)` }}
            >
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Track / Artist</th>
              <th className="py-3 px-4">Album</th>
              <th className="py-3 px-4">Format & Quality</th>
              <th className="py-3 px-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-white/80">
            {filteredTracks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <FolderPlus className="w-10 h-10 mx-auto mb-3" style={{ color: `rgba(${accentRgb}, 0.5)` }} />
                  <p className="text-sm font-semibold text-white/80 mb-1">
                    No tracks in this category
                  </p>
                  <p className="text-xs text-white/40 mb-4">
                    Click "Add FLAC / WAV" to import your audiophile library
                  </p>
                  <button
                    onClick={onAddFiles}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: `rgba(${accentRgb}, 0.2)`,
                      border: `1px solid rgba(${accentRgb}, 0.4)`,
                      color: accentColor,
                    }}
                  >
                    Add FLAC / WAV
                  </button>
                </td>
              </tr>
            ) : (
              filteredTracks.map((track, index) => {
                const isCurrent = track.id === currentTrackId;
                return (
                  <tr
                    key={track.id}
                    onClick={() => onSelectTrack(track)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isCurrent
                        ? 'border-l-4'
                        : 'hover:bg-white/5'
                    }`}
                    style={
                      isCurrent
                        ? {
                            background: `linear-gradient(to right, rgba(${accentRgb}, 0.15), transparent)`,
                            borderLeftColor: accentColor,
                          }
                        : undefined
                    }
                  >
                    {/* Номер / Статус воспроизведения */}
                    <td className="py-3.5 px-4 text-center">
                      {isCurrent ? (
                        <div className="w-7 h-7 mx-auto rounded-full flex items-center justify-center"
                          style={{
                            background: `rgba(${accentRgb}, 0.2)`,
                            border: `1px solid ${accentColor}`,
                          }}
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" style={{ color: accentColor }} />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" style={{ color: accentColor }} />
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-white/40">{index + 1}</span>
                      )}
                    </td>

                    {/* Cover Art + Название и исполнитель */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* Album art thumbnail */}
                        <div
                          className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden"
                          style={{
                            border: `1px solid var(--glass-border)`,
                          }}
                        >
                          {(() => {
                            const coverSrc = track.coverArt || generateBase64SvgCover(track.album || track.title, accentColor);
                            const fallback = generateBase64SvgCover(track.album || track.title, accentColor);
                            return (
                              <img
                                src={coverSrc}
                                alt={track.album}
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
                        <div className="min-w-0">
                          <div className={`font-bold truncate ${isCurrent ? '' : 'text-white'}`}
                            style={isCurrent ? { color: accentColor } : undefined}
                          >
                            {track.title}
                          </div>
                          <div className="text-white/50 text-[11px] truncate">{track.artist}</div>
                        </div>
                      </div>
                    </td>

                    {/* Альбом */}
                    <td className="py-3.5 px-4 text-white/60">{track.album}</td>

                    {/* Формат и качество */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-white/10 font-mono font-semibold text-[11px] border border-white/10"
                          style={{ color: accentColor }}
                        >
                          {track.codec}
                        </span>
                        <span className="text-[11px] font-mono text-amber-300/80">
                          {track.bitDepth}bit / {track.sampleRate / 1000}kHz
                        </span>
                      </div>
                    </td>

                    {/* Длительность */}
                    <td className="py-3.5 px-4 text-right font-mono text-white/60">
                      {formatDuration(track.duration)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
