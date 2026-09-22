'use client';

import { useEffect } from 'react';

/** Enregistre un scan sans bloquer le rendu. */
export function ScanBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const controller = new AbortController();
    const run = () => {
      void fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
        signal: controller.signal,
        keepalive: true,
      }).catch(() => {
        /* silencieux — jamais bloquer la page */
      });
    };
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(run, { timeout: 2000 });
      return () => {
        cancelIdleCallback(id);
        controller.abort();
      };
    }
    const t = window.setTimeout(run, 400);
    return () => {
      window.clearTimeout(t);
      controller.abort();
    };
  }, [slug]);

  return null;
}
