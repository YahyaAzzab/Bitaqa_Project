'use client';

import { MotionConfig } from 'framer-motion';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { easeOutExpo } from '@/lib/motion';
import { ToastProvider } from '@/components/ui/toast';

export type ThemeName = 'noir' | 'ivoire';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  accent: string | null;
  setAccent: (accent: string | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within AppProviders');
  }
  return ctx;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('noir');
  const [accent, setAccent] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (accent) {
      document.documentElement.style.setProperty('--accent', accent);
    } else {
      document.documentElement.style.removeProperty('--accent');
    }
  }, [theme, accent]);

  const value = useMemo(() => ({ theme, setTheme, accent, setAccent }), [theme, accent]);

  return (
    <ThemeContext.Provider value={value}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: easeOutExpo }}>
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </ThemeContext.Provider>
  );
}
