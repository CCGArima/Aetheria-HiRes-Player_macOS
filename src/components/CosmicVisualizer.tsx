import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';

export type VisualizerMode = 'orbital' | 'warp' | 'aurora';

interface CosmicVisualizerProps {
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
  isPlaying: boolean;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

export const CosmicVisualizer: React.FC<CosmicVisualizerProps> = React.memo(({ mode, onModeChange, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const peaksRef = useRef<number[]>(new Array(64).fill(0));
  const reqIdRef = useRef<number | null>(null);

  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 220; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2200,
        y: (Math.random() - 0.5) * 2200,
        z: Math.random() * 1000 + 1,
        size: Math.random() * 2 + 1
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let time = 0;

    const render = () => {
      reqIdRef.current = requestAnimationFrame(render);
      time += 0.018;

      // Ограничиваем dpr до 2 для стабильных 60+ FPS на Retina 4K/5K экранах
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // Фон глубокого космоса
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.75);
      bgGrad.addColorStop(0, '#0f1126');
      bgGrad.addColorStop(0.65, '#070814');
      bgGrad.addColorStop(1, '#04050b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const freqData = audioEngine.getFrequencyData();
      const timeData = audioEngine.getTimeDomainData();

      // Оценка баса
      let bassEnergy = 0;
      const count = Math.min(32, freqData.length || 1);
      for (let i = 0; i < count; i++) {
        bassEnergy += freqData[i] || 0;
      }
      bassEnergy = (bassEnergy / count) / 255;

      if (mode === 'orbital') {
        renderOrbitalReactor(ctx, width, height, freqData, bassEnergy, time, isPlaying);
      } else if (mode === 'warp') {
        renderStellarWarp(ctx, width, height, freqData, timeData, bassEnergy, starsRef.current);
      } else {
        renderAuroraSpectrum(ctx, width, height, freqData, peaksRef.current);
      }
    };

    render();

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [mode, isPlaying]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(99,102,241,0.15)] bg-black/40 backdrop-blur-2xl">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Панель переключения режимов визуализатора */}
      <div className="absolute top-4 right-4 flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 z-10">
        <button
          onClick={() => onModeChange('orbital')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
            mode === 'orbital'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Orbital Core
        </button>
        <button
          onClick={() => onModeChange('warp')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
            mode === 'warp'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Stellar Warp
        </button>
        <button
          onClick={() => onModeChange('aurora')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
            mode === 'aurora'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold shadow-[0_0_15px_rgba(0,242,254,0.5)]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Aurora Spectrum
        </button>
      </div>
    </div>
  );
});

// 1. ORBITAL CORE REACTOR
function renderOrbitalReactor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  bassEnergy: number,
  time: number,
  isPlaying: boolean
) {
  const cx = width / 2;
  const cy = height / 2;
  const baseRadius = Math.min(width, height) * 0.18;
  const coreRadius = baseRadius * (1 + bassEnergy * 0.35);

  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 2.2);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.25, '#00f2fe');
  coreGrad.addColorStop(0.65, '#8b5cf6');
  coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#070814';
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius * 0.75, 0, Math.PI * 2);
  ctx.fill();

  const numBars = 120;
  const angleStep = (Math.PI * 2) / numBars;

  for (let i = 0; i < numBars; i++) {
    const angle = i * angleStep + time * 0.15;
    const dataIndex = Math.floor((i / numBars) * Math.min(180, freqData.length || 1));
    const val = freqData[dataIndex] || (isPlaying ? Math.sin(time + i) * 30 + 30 : 5);
    const barHeight = (val / 255) * Math.min(width, height) * 0.22 + 4;

    const x1 = cx + Math.cos(angle) * coreRadius;
    const y1 = cy + Math.sin(angle) * coreRadius;
    const x2 = cx + Math.cos(angle) * (coreRadius + barHeight);
    const y2 = cy + Math.sin(angle) * (coreRadius + barHeight);

    ctx.strokeStyle = i % 2 === 0 ? '#00f2fe' : '#ec4899';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

// 2. STELLAR WARP DRIVE
function renderStellarWarp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  timeData: Uint8Array,
  bassEnergy: number,
  stars: Star[]
) {
  const cx = width / 2;
  const cy = height / 2;
  const speed = 7 + bassEnergy * 28;

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    star.z -= speed;
    if (star.z <= 0) {
      star.z = 1000;
      star.x = (Math.random() - 0.5) * 2200;
      star.y = (Math.random() - 0.5) * 2200;
    }

    const scale = 500 / star.z;
    const x = star.x * scale;
    const y = star.y * scale;
    const size = star.size * scale;
    const alpha = Math.min(1, (1000 - star.z) / 800);

    ctx.fillStyle = `rgba(0, 242, 254, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.8, size), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if (timeData && timeData.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3;
    const sliceWidth = width / timeData.length;
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] / 128.0;
      const y = (v * height) / 3 + height / 3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
  }
}

// 3. AURORA CYBER SPECTRUM
function renderAuroraSpectrum(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  peaks: number[]
) {
  const numBands = 64;
  const barWidth = (width - 40) / numBands;
  const maxBarHeight = height * 0.7;
  const baselineY = height - 30;

  for (let i = 0; i < numBands; i++) {
    const dataIdx = Math.floor((i / numBands) * Math.min(180, freqData.length || 1));
    const val = freqData[dataIdx] || 0;
    const barHeight = (val / 255) * maxBarHeight;

    if (barHeight > peaks[i]) {
      peaks[i] = barHeight;
    } else {
      peaks[i] = Math.max(0, peaks[i] - 1.4);
    }

    const x = 20 + i * barWidth;
    const y = baselineY - barHeight;

    ctx.fillStyle = i % 3 === 0 ? '#00f2fe' : i % 3 === 1 ? '#8b5cf6' : '#ec4899';
    ctx.beginPath();
    ctx.roundRect(x + 2, y, barWidth - 4, barHeight, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, baselineY - peaks[i] - 4, barWidth - 4, 3);
  }
}
