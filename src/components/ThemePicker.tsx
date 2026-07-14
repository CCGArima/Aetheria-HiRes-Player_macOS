import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { THEMES, useTheme } from './ThemeProvider';

export const ThemePicker: React.FC = () => {
  const { theme, setThemeById } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{
          background: `rgba(${theme.colors.accentRgb}, 0.1)`,
          border: `1px solid rgba(${theme.colors.accentRgb}, 0.3)`,
          color: theme.colors.accent,
        }}
        title="Change Theme"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">{theme.icon} {theme.name}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-2xl"
          style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.glassBorder}`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 30px ${theme.colors.accentGlow}`,
          }}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 px-3 py-2">
            Select Theme
          </div>
          {THEMES.map((t) => {
            const isActive = t.id === theme.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setThemeById(t.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: isActive
                    ? `rgba(${t.colors.accentRgb}, 0.15)`
                    : 'transparent',
                  border: isActive
                    ? `1px solid rgba(${t.colors.accentRgb}, 0.3)`
                    : '1px solid transparent',
                  color: isActive ? t.colors.accent : 'rgba(255,255,255,0.7)',
                }}
              >
                {/* Color preview circle */}
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${t.colors.gradientFrom}, ${t.colors.gradientVia}, ${t.colors.gradientTo})`,
                    boxShadow: isActive
                      ? `0 0 10px ${t.colors.accentGlow}`
                      : 'none',
                  }}
                />
                <span>{t.icon} {t.name}</span>
                {isActive && (
                  <span className="ml-auto text-[10px] font-mono" style={{ color: t.colors.accent }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
