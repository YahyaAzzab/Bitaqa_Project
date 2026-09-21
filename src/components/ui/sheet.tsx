'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { useBodyLock } from '@/hooks/use-body-lock';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { fade, springSheet } from '@/lib/motion';
import { cn } from '@/lib/utils';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
};

export function Sheet({ open, onClose, title, children, footer, closeLabel }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useBodyLock(open);
  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label={closeLabel}
            className="bg-overlay absolute inset-0"
            variants={fade}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 88 || info.velocity.y > 500) {
                onClose();
              }
            }}
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '100%' }}
            transition={reduced ? { duration: 0.01 } : springSheet}
            className={cn(
              'border-border bg-surface-raised relative z-10 w-full max-w-lg rounded-t-lg border pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-sheet)]',
            )}
          >
            <div className="flex justify-center pt-2">
              <span className="bg-border h-1 w-10 rounded-full" />
            </div>
            <h2 id="sheet-title" className="px-4 pt-3 text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <div className="max-h-[70dvh] overflow-y-auto px-4 py-4">{children}</div>
            {footer ? <div className="border-border border-t px-4 py-3">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
