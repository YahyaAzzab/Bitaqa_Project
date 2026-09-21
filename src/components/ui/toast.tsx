'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/lib/utils';

type ToastVariant = 'neutral' | 'success' | 'error';

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastItem = ToastInput & { id: number };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { ...input, id }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[max(16px,env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit="exit"
              className={cn(
                'pointer-events-auto w-full max-w-sm rounded-md border px-4 py-3 shadow-[var(--shadow-dialog)]',
                item.variant === 'success' && 'border-success/40 bg-surface text-text',
                item.variant === 'error' && 'border-error/40 bg-surface text-text',
                (!item.variant || item.variant === 'neutral') && 'border-border bg-surface-raised',
              )}
            >
              <p className="text-[15px] font-medium">{item.title}</p>
              {item.description ? (
                <p className="text-text-secondary mt-1 text-[13px]">{item.description}</p>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
