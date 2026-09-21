'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useBodyLock } from '@/hooks/use-body-lock';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { fade, fadeScale } from '@/lib/motion';
import { IconButton } from './icon-button';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
};

export function Dialog({ open, onClose, title, children, footer, closeLabel }: DialogProps) {
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
            aria-labelledby="dialog-title"
            variants={reduced ? fade : fadeScale}
            initial="hidden"
            animate="show"
            exit="exit"
            className="border-border bg-surface-raised relative z-10 w-full max-w-md rounded-lg border shadow-[var(--shadow-dialog)]"
          >
            <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 id="dialog-title" className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              <IconButton label={closeLabel} onClick={onClose} className="size-10">
                <X size={18} strokeWidth={1.75} />
              </IconButton>
            </div>
            <div className="px-4 py-4">{children}</div>
            {footer ? <div className="border-border border-t px-4 py-3">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
