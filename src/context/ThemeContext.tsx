import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type Palette = 'corporate' | 'mars' | 'cyan' | 'cobalt' | 'emerald';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  palette: Palette;
  setPalette: (p: Palette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('bio_attendance_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // High-tech futuristic dark by default
  });

  const [palette, setPaletteState] = useState<Palette>(() => {
    const saved = localStorage.getItem('bio_attendance_palette') as Palette;
    if (saved && ['corporate', 'mars', 'cyan', 'cobalt', 'emerald'].includes(saved)) return saved;
    return 'corporate'; // Default to Trustworthy Corporate & High-Tech theme (#0f2027, #203a43, #2c5364)
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bio_attendance_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette);
    localStorage.setItem('bio_attendance_palette', palette);
  }, [palette]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const setPalette = (p: Palette) => {
    setPaletteState(p);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, palette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
