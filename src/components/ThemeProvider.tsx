import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  accent: string;
  accentRgb: string;
  accentGlow: string;
  accentSecondary: string;
  accentSecondaryRgb: string;
  glassBg: string;
  glassBorder: string;
  scrollbarThumb: string;
  sliderGlow: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
}

export interface Theme {
  id: string;
  name: string;
  icon: string;
  colors: ThemeColors;
}

export const THEMES: Theme[] = [
  {
    id: 'cosmic-void',
    name: 'Cosmic Void',
    icon: '🌌',
    colors: {
      bgPrimary: '#070811',
      bgSecondary: '#0a0d1a',
      accent: '#00f2fe',
      accentRgb: '0, 242, 254',
      accentGlow: 'rgba(0, 242, 254, 0.4)',
      accentSecondary: '#8b5cf6',
      accentSecondaryRgb: '139, 92, 246',
      glassBg: 'rgba(255, 255, 255, 0.03)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
      scrollbarThumb: 'rgba(0, 242, 254, 0.3)',
      sliderGlow: '#8b5cf6',
      gradientFrom: '#06b6d4',
      gradientVia: '#6366f1',
      gradientTo: '#a855f7',
    },
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    icon: '🔮',
    colors: {
      bgPrimary: '#0a0520',
      bgSecondary: '#120a2e',
      accent: '#a855f7',
      accentRgb: '168, 85, 247',
      accentGlow: 'rgba(168, 85, 247, 0.4)',
      accentSecondary: '#ec4899',
      accentSecondaryRgb: '236, 72, 153',
      glassBg: 'rgba(168, 85, 247, 0.04)',
      glassBorder: 'rgba(168, 85, 247, 0.15)',
      scrollbarThumb: 'rgba(168, 85, 247, 0.3)',
      sliderGlow: '#ec4899',
      gradientFrom: '#a855f7',
      gradientVia: '#ec4899',
      gradientTo: '#f43f5e',
    },
  },
  {
    id: 'neon-rose',
    name: 'Neon Rose',
    icon: '🌹',
    colors: {
      bgPrimary: '#0d0a12',
      bgSecondary: '#150e1e',
      accent: '#ec4899',
      accentRgb: '236, 72, 153',
      accentGlow: 'rgba(236, 72, 153, 0.4)',
      accentSecondary: '#f43f5e',
      accentSecondaryRgb: '244, 63, 94',
      glassBg: 'rgba(236, 72, 153, 0.04)',
      glassBorder: 'rgba(236, 72, 153, 0.15)',
      scrollbarThumb: 'rgba(236, 72, 153, 0.3)',
      sliderGlow: '#f43f5e',
      gradientFrom: '#ec4899',
      gradientVia: '#f43f5e',
      gradientTo: '#fb923c',
    },
  },
  {
    id: 'arctic-silver',
    name: 'Arctic Silver',
    icon: '❄️',
    colors: {
      bgPrimary: '#0e1117',
      bgSecondary: '#161b22',
      accent: '#94a3b8',
      accentRgb: '148, 163, 184',
      accentGlow: 'rgba(148, 163, 184, 0.3)',
      accentSecondary: '#64748b',
      accentSecondaryRgb: '100, 116, 139',
      glassBg: 'rgba(148, 163, 184, 0.04)',
      glassBorder: 'rgba(148, 163, 184, 0.12)',
      scrollbarThumb: 'rgba(148, 163, 184, 0.25)',
      sliderGlow: '#64748b',
      gradientFrom: '#94a3b8',
      gradientVia: '#64748b',
      gradientTo: '#475569',
    },
  },
  {
    id: 'solar-gold',
    name: 'Solar Gold',
    icon: '☀️',
    colors: {
      bgPrimary: '#0f0d08',
      bgSecondary: '#1a1608',
      accent: '#f59e0b',
      accentRgb: '245, 158, 11',
      accentGlow: 'rgba(245, 158, 11, 0.4)',
      accentSecondary: '#ef4444',
      accentSecondaryRgb: '239, 68, 68',
      glassBg: 'rgba(245, 158, 11, 0.04)',
      glassBorder: 'rgba(245, 158, 11, 0.15)',
      scrollbarThumb: 'rgba(245, 158, 11, 0.3)',
      sliderGlow: '#ef4444',
      gradientFrom: '#f59e0b',
      gradientVia: '#ef4444',
      gradientTo: '#ec4899',
    },
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    icon: '🌊',
    colors: {
      bgPrimary: '#020617',
      bgSecondary: '#0c1425',
      accent: '#14b8a6',
      accentRgb: '20, 184, 166',
      accentGlow: 'rgba(20, 184, 166, 0.4)',
      accentSecondary: '#06b6d4',
      accentSecondaryRgb: '6, 182, 212',
      glassBg: 'rgba(20, 184, 166, 0.04)',
      glassBorder: 'rgba(20, 184, 166, 0.12)',
      scrollbarThumb: 'rgba(20, 184, 166, 0.3)',
      sliderGlow: '#06b6d4',
      gradientFrom: '#14b8a6',
      gradientVia: '#06b6d4',
      gradientTo: '#6366f1',
    },
  },
];

const THEME_STORAGE_KEY = 'aetheria-theme';

interface ThemeContextType {
  theme: Theme;
  setThemeById: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[0],
  setThemeById: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty('--bg-primary', c.bgPrimary);
  root.style.setProperty('--bg-secondary', c.bgSecondary);
  root.style.setProperty('--accent', c.accent);
  root.style.setProperty('--accent-rgb', c.accentRgb);
  root.style.setProperty('--accent-glow', c.accentGlow);
  root.style.setProperty('--accent-secondary', c.accentSecondary);
  root.style.setProperty('--accent-secondary-rgb', c.accentSecondaryRgb);
  root.style.setProperty('--glass-bg', c.glassBg);
  root.style.setProperty('--glass-border', c.glassBorder);
  root.style.setProperty('--scrollbar-thumb', c.scrollbarThumb);
  root.style.setProperty('--slider-glow', c.sliderGlow);
  root.style.setProperty('--gradient-from', c.gradientFrom);
  root.style.setProperty('--gradient-via', c.gradientVia);
  root.style.setProperty('--gradient-to', c.gradientTo);
  document.body.style.backgroundColor = c.bgPrimary;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const found = THEMES.find((t) => t.id === saved);
        if (found) return found;
      }
    } catch {}
    return THEMES[0];
  });

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setThemeById = useCallback((id: string) => {
    const found = THEMES.find((t) => t.id === id);
    if (found) {
      setTheme(found);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, id);
      } catch {}
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setThemeById }}>
      {children}
    </ThemeContext.Provider>
  );
};
