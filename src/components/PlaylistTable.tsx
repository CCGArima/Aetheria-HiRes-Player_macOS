import React, { useState } from 'react';
import { Play, Pause, Plus, Search, Music, FolderPlus, Sparkles } from 'lucide-react';

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
  demoType?: 'nebula' | 'pulsar' | 'orbit';
}

interface PlaylistTableProps {
  tracks: PlaylistTrack[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onSelectTrack: (track: PlaylistTrack) => void;
  onAddFiles: () => void;
}

export const PlaylistTable: React.FC<PlaylistTableProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onSelectTrack,
  onAddFiles
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
    <div className="w-full flex flex-col bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      {/* Верхняя панель управления списком */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">AETHERIA HI-RES PLAYLIST</h3>
            <p className="text-xs text-white/50">{tracks.length} треков в аудиофильном качестве</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Поиск */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Поиск по трекам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors w-48 sm:w-64"
            />
          </div>

          {/* Кнопка добавления файлов из macOS */}
          <button
            onClick={onAddFiles}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Добавить FLAC / WAV</span>
          </button>
        </div>
      </div>

      {/* Таблица треков */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-[11px] uppercase font-mono tracking-wider">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Трек / Исполнитель</th>
              <th className="py-3 px-4">Альбом</th>
              <th className="py-3 px-4">Формат & Качество</th>
              <th className="py-3 px-4 text-right">Время</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-white/80">
            {filteredTracks.map((track, index) => {
              const isCurrent = track.id === currentTrackId;
              return (
                <tr
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className={`cursor-pointer transition-all duration-200 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent border-l-4 border-cyan-400'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Номер / Статус воспроизведения */}
                  <td className="py-3.5 px-4 text-center">
                    {isCurrent ? (
                      <div className="w-7 h-7 mx-auto rounded-full bg-cyan-400/20 border border-cyan-400 flex items-center justify-center">
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300" />
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-white/40">{index + 1}</span>
                    )}
                  </td>

                  {/* Название и исполнитель */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div>
                        <div className={`font-bold ${isCurrent ? 'text-cyan-300' : 'text-white'}`}>
                          {track.title}
                        </div>
                        <div className="text-white/50 text-[11px]">{track.artist}</div>
                      </div>
                    </div>
                  </td>

                  {/* Альбом */}
                  <td className="py-3.5 px-4 text-white/60">{track.album}</td>

                  {/* Формат и качество */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/10 font-mono font-semibold text-[11px] text-cyan-300 border border-white/10">
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
