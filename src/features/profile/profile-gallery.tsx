'use client';

import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { springSheet, transitionBase } from '@/lib/motion';

type Item = { url: string; caption?: string };

type Props = {
  items: Item[];
  preview?: boolean;
};

export function ProfileGallery({ items, preview = false }: Props) {
  const t = useTranslations('profile');
  const reduced = useReducedMotion();
  const [index, setIndex] = useState<number | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  const current = index !== null ? items[index] : null;

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIndex(null);
      if (event.key === 'ArrowRight' && index !== null) {
        setIndex((index + 1) % items.length);
      }
      if (event.key === 'ArrowLeft' && index !== null) {
        setIndex((index - 1 + items.length) % items.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, index, items.length]);

  if (items.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="gallery-heading">
      <h2
        id="gallery-heading"
        className="text-text-muted text-[12px] font-medium tracking-[0.14em] uppercase"
      >
        {t('gallery')}
      </h2>
      <ul className="mt-3 grid grid-cols-3 gap-1.5 overflow-hidden rounded-lg">
        {items.map((item, i) => (
          <li key={`${item.url}-${i}`} className="relative aspect-square">
            <button
              type="button"
              disabled={preview}
              aria-label={t('galleryOpen', { n: i + 1 })}
              onClick={() => {
                if (preview) return;
                setPortalReady(true);
                setIndex(i);
              }}
              className="pressable focus-ring relative block size-full overflow-hidden rounded-[6px]"
            >
              <Image
                src={item.url}
                alt={item.caption || ''}
                fill
                sizes="140px"
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {portalReady && current
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <m.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={t('gallery')}
                  className="bg-bg/92 fixed inset-0 z-[80] flex flex-col items-center justify-center px-4 backdrop-blur-sm"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={transitionBase}
                  onClick={() => setIndex(null)}
                >
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label={t('close')}
                    onClick={() => setIndex(null)}
                    className="pressable focus-ring border-border bg-surface text-text absolute end-4 top-[max(1rem,env(safe-area-inset-top))] inline-flex size-12 items-center justify-center rounded-full border"
                  >
                    <X className="size-5" strokeWidth={1.75} aria-hidden />
                  </button>
                  <m.div
                    className="relative w-full max-w-md overflow-hidden rounded-lg"
                    style={{ aspectRatio: '1' }}
                    initial={reduced ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
                    transition={springSheet}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={current.url}
                      alt={current.caption || ''}
                      fill
                      sizes="(max-width: 430px) 100vw, 448px"
                      className="object-contain"
                      priority
                    />
                  </m.div>
                  {current.caption ? (
                    <p className="text-text-secondary mt-4 max-w-sm text-center text-[14px] leading-relaxed">
                      {current.caption}
                    </p>
                  ) : null}
                </m.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </section>
  );
}
