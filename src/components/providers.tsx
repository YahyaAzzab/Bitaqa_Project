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

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const INK = '#1a1612';
const PAPER = '#faf7f2';

function relativeLuminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Profile accents are arbitrary (sampled from logos), so the label colour must follow. */
function readableOn(hex: string): string {
  const l = relativeLuminance(hex);
  const onInk = (l + 0.05) / (relativeLuminance(INK) + 0.05);
  const onPaper = (relativeLuminance(PAPER) + 0.05) / (l + 0.05);
  return onInk >= onPaper ? INK : PAPER;
}

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
    if (accent && HEX_COLOR.test(accent)) {
      root.style.setProperty('--accent', accent);
      root.style.setProperty('--accent-hover', accent);
      root.style.setProperty('--accent-fg', readableOn(accent));
      root.style.setProperty('--ring', `${accent}8c`);
    } else {
      for (const prop of ['--accent', '--accent-hover', '--accent-fg', '--ring']) {
        root.style.removeProperty(prop);
      }
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
