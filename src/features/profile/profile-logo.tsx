'use client';

import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '@/components/ui/avatar';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { springSheet, transitionBase, transitionFast } from '@/lib/motion';

const AVATAR_SIZE = 96;
const ZOOM_SIZE = 280;

type Props = {
  name: string;
  src?: string | null;
  priority?: boolean;
  zoomable: boolean;
  zoomLabel: string;
  closeLabel: string;
};

export function ProfileLogo({ name, src, priority, zoomable, zoomLabel, closeLabel }: Props) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  // The portal only exists after the first tap: no <body> access during SSR or hydration.
  const [portalReady, setPortalReady] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const trigger = triggerRef.current;
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [open]);

  const avatar = (
    <Avatar
      name={name}
      src={src}
      size={AVATAR_SIZE}
      priority={priority}
      className="rounded-lg border-0"
    />
  );

  if (!zoomable || !src) return avatar;

  const svg = src.toLowerCase().endsWith('.svg');

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={zoomLabel}
        aria-haspopup="dialog"
        onClick={() => {
          setPortalReady(true);
          setOpen(true);
        }}
        className="pressable focus-ring block rounded-lg"
      >
        {avatar}
      </button>

      {portalReady
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <m.div
                  key="logo-zoom"
                  role="dialog"
                  aria-modal="true"
                  aria-label={name}
                  className="fixed inset-0 z-50 grid place-items-center px-8"
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: transitionBase }}
                  exit={{ opacity: 0, transition: transitionFast }}
                >
                  <div aria-hidden className="bg-bg/90 absolute inset-0 backdrop-blur-sm" />
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label={closeLabel}
                    className="pressable focus-ring border-border bg-surface text-text-secondary absolute end-4 top-[max(1rem,env(safe-area-inset-top))] grid size-12 place-items-center rounded-full border"
                  >
                    <X className="size-5" strokeWidth={1.75} aria-hidden />
                  </button>
                  <m.div
                    className="border-border bg-surface relative rounded-[24px] border p-1.5"
                    initial={reduced ? false : { scale: AVATAR_SIZE / ZOOM_SIZE, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      transition: reduced ? transitionFast : springSheet,
                    }}
                    exit={
                      reduced
                        ? { opacity: 0, transition: transitionFast }
                        : { scale: 0.85, opacity: 0, transition: transitionFast }
                    }
                  >
                    <Image
                      src={src}
                      alt=""
                      width={ZOOM_SIZE}
                      height={ZOOM_SIZE}
                      sizes={`${ZOOM_SIZE}px`}
                      unoptimized={svg}
                      className="size-[min(72vw,280px)] rounded-[18px] object-cover"
                    />
                  </m.div>
                </m.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
