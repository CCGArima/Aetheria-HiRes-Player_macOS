import React from 'react';
import { Disc, Zap, ShieldCheck, Activity } from 'lucide-react';

interface HiResBadgeProps {
  codec: string;
  sampleRate: number;
  bitDepth: number;
  bitrate: number;
  isLossless: boolean;
}

export const HiResBadge: React.FC<HiResBadgeProps> = ({
  codec,
  sampleRate,
  bitDepth,
  bitrate,
  isLossless
}) => {
  const isUltraHiRes = sampleRate >= 96000 || bitDepth >= 24;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Главный значок Hi-Res Audio (Золотой / Неоновый стиль аудиофилов) */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold tracking-wider text-xs shadow-lg transition-all ${
          isUltraHiRes
            ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            : 'bg-white/10 border-white/20 text-white'
        }`}
      >
        <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>HI-RES AUDIO</span>
        <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 text-[10px]">
          {bitDepth}-BIT / {sampleRate / 1000} kHZ
        </span>
      </div>

      {/* Кодек и Lossless статус */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
        <Disc className="w-3.5 h-3.5" />
        <span>{codec}</span>
        {isLossless && (
          <span className="ml-1 px-1.5 py-0.2 rounded bg-cyan-400/20 text-[10px] uppercase font-bold text-cyan-200">
            LOSSLESS
          </span>
        )}
      </div>

      {/* Битрейт */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs">
        <Activity className="w-3.5 h-3.5" />
        <span>{bitrate} kbps</span>
      </div>

      {/* Индикатор бит-перфект аудиофильного выхода */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>BIT-PERFECT DIRECT</span>
      </div>
    </div>
  );
};
