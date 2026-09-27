'use client';

import { useEffect, useState } from 'react';

/** Hauteur du clavier virtuel, pour garder une barre fixe visible au-dessus. */
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const sync = () => {
      setOffset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    };

    sync();
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
    };
  }, []);

  return offset;
}
