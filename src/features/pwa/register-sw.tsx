'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

/** SW uniquement en production — en dev il ralentit et cache des builds cassés. */
export function RegisterSW() {
  const t = useTranslations('common');
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // En dev : désinstaller tout SW déjà installé (cache lent / stale).
    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      return;
    }

    let cancelled = false;

    void navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (cancelled) return;

        if (reg.waiting) {
          setWaiting(reg.waiting);
        }

        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaiting(worker);
            }
          });
        });
      })
      .catch(() => {
        /* enregistrement optionnel */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      className="border-border bg-surface-raised fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-lg items-center gap-3 border px-4 py-3 shadow-[var(--shadow-dialog)] md:bottom-4"
      role="status"
    >
      <p className="text-text min-w-0 flex-1 text-[13px] font-medium">{t('updateAvailable')}</p>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          waiting.postMessage({ type: 'SKIP_WAITING' });
          setWaiting(null);
          window.location.reload();
        }}
      >
        {t('updateNow')}
      </Button>
    </div>
  );
}
