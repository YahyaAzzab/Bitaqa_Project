import type { CSSProperties } from 'react';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const INK = '#1a1612';
const PAPER = '#faf7f2';

export function isHexColor(value: string | null | undefined): value is string {
  return Boolean(value && HEX_COLOR.test(value));
}

function relativeLuminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Profile accents are arbitrary (sampled from logos), so the label colour must follow. */
export function readableOn(hex: string): string {
  const l = relativeLuminance(hex);
  const onInk = (l + 0.05) / (relativeLuminance(INK) + 0.05);
  const onPaper = (relativeLuminance(PAPER) + 0.05) / (l + 0.05);
  return onInk >= onPaper ? INK : PAPER;
}

export function accentVariables(hex: string): Record<string, string> {
  return {
    '--accent': hex,
    '--accent-hover': hex,
    '--accent-fg': readableOn(hex),
    '--ring': `${hex}8c`,
  };
}

export function accentStyle(hex: string | null | undefined): CSSProperties | undefined {
  return isHexColor(hex) ? (accentVariables(hex) as CSSProperties) : undefined;
}
