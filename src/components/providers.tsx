'use client';

import { MotionConfig } from 'framer-motion';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { accentVariables, isHexColor } from '@/lib/color';
import { easeOutExpo } from '@/lib/motion';
import type { ThemeName } from '@/lib/profile/themes';
import { ToastProvider } from '@/components/ui/toast';

export type { ThemeName } from '@/lib/profile/themes';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  accent: string | null;
  setAccent: (accent: string | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ACCENT_PROPS = ['--accent', '--accent-hover', '--accent-fg', '--ring'];

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
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (isHexColor(accent)) {
      for (const [prop, value] of Object.entries(accentVariables(accent))) {
        root.style.setProperty(prop, value);
      }
    } else {
      for (const prop of ACCENT_PROPS) root.style.removeProperty(prop);
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
