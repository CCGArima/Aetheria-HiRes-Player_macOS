import React, { useState } from 'react';
import { EQ_FREQUENCIES, EQ_PRESETS, EqualizerPreset, audioEngine } from '../audio/AudioEngine';
import { Sliders, Sparkles, Music2, ShieldCheck } from 'lucide-react';

export const AudiophileEqualizer: React.FC = () => {
  const [gains, setGains] = useState<number[]>(new Array(10).fill(0));
  const [selectedPreset, setSelectedPreset] = useState<string>('Pure Direct (Flat)');
  const [spatializerEnabled, setSpatializerEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'audiophile' | 'genre'>('audiophile');

  const handleGainChange = (index: number, value: number) => {
    const nextGains = [...gains];
    nextGains[index] = value;
    setGains(nextGains);
    setSelectedPreset('Custom Manual');
    audioEngine.setEqGain(index, value);
  };

  const handleSelectPreset = (preset: EqualizerPreset) => {
    setSelectedPreset(preset.name);
    setGains([...preset.gains]);
    audioEngine.setEqPreset(preset);
  };

  const formatFrequency = (freq: number) => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  const audiophilePresets = EQ_PRESETS.filter((p) => p.category === 'audiophile');
  const genrePresets = EQ_PRESETS.filter((p) => p.category === 'genre');

  return (
    <div className="w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_0_40px_rgba(139,92,246,0.15)] text-white">
      {/* Заголовок эквалайзера и пространственный переключатель */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
              10-BAND AUDIOPHILE DSP
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                Zero-Click 64-bit
              </span>
            </h3>
            <p className="text-[11px] text-white/50">Прецизионная цифровая фильтрация с плавной интерполяцией</p>
          </div>
        </div>

        {/* Переключатель Nebula Spatializer */}
        <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
          <Sparkles className={`w-4 h-4 ${spatializerEnabled ? 'text-cyan-400 animate-pulse' : 'text-white/40'}`} />
          <span className="text-xs font-semibold">Nebula 3D</span>
          <button
            onClick={() => setSpatializerEnabled(!spatializerEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              spatializerEnabled ? 'bg-gradient-to-r from-cyan-400 to-indigo-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                spatializerEnabled ? 'left-6 shadow-[0_0_8px_#fff]' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Выбор категории пресетов (Аудиофильные / Жанровые) */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setActiveTab('audiophile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'audiophile'
              ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400 text-cyan-300'
              : 'text-white/60 hover:text-white bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Референсные / Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('genre')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'genre'
              ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-pink-400 text-pink-300'
              : 'text-white/60 hover:text-white bg-white/5'
          }`}
        >
          <Music2 className="w-3.5 h-3.5 text-pink-400" />
          <span>Жанровые пресеты</span>
        </button>
      </div>

      {/* Список кнопок пресетов */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        {(activeTab === 'audiophile' ? audiophilePresets : genrePresets).map((preset) => (
          <button
            key={preset.name}
            onClick={() => handleSelectPreset(preset)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              selectedPreset === preset.name
                ? 'bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Ползунки 10 полос */}
      <div className="grid grid-cols-10 gap-1.5 sm:gap-3 py-2">
        {EQ_FREQUENCIES.map((freq, index) => {
          const currentGain = gains[index];
          return (
            <div key={freq} className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-cyan-300">
                {currentGain > 0 ? `+${currentGain}` : currentGain} dB
              </span>

              {/* Вертикальный ползунок */}
              <div className="relative h-36 flex items-center justify-center">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={currentGain}
                  onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
                  className="h-36 w-2 appearance-none bg-white/10 rounded-full accent-cyan-400 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                />
              </div>

              <span className="text-[10px] font-mono text-white/60 font-semibold">{formatFrequency(freq)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
