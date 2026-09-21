'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type TabItem = {
  id: string;
  label: string;
  panel: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  defaultId?: string;
};

export function Tabs({ items, defaultId }: TabsProps) {
  const [active, setActive] = useState(defaultId ?? items[0]?.id ?? '');
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ start: 0, width: 0 });
  const baseId = useId();

  useLayoutEffect(() => {
    function measure() {
      const list = listRef.current;
      if (!list) return;
      const button = list.querySelector<HTMLButtonElement>(`[data-tab-id="${active}"]`);
      if (!button) return;
      const listRect = list.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const isRtl = getComputedStyle(list).direction === 'rtl';
      const start = isRtl ? listRect.right - buttonRect.right : buttonRect.left - listRect.left;
      setIndicator({ start, width: buttonRect.width });
    }

    measure();
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active, items]);

  const current = items.find((item) => item.id === active) ?? items[0];

  return (
    <div>
      <div
        ref={listRef}
        role="tablist"
        className="border-border relative flex gap-1 border-b"
        onKeyDown={(event) => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
          event.preventDefault();
          const isRtl = getComputedStyle(event.currentTarget).direction === 'rtl';
          const forward =
            (event.key === 'ArrowRight' && !isRtl) || (event.key === 'ArrowLeft' && isRtl);
          const index = items.findIndex((item) => item.id === active);
          const nextIndex = forward
            ? (index + 1) % items.length
            : (index - 1 + items.length) % items.length;
          const next = items[nextIndex];
          if (!next) return;
          setActive(next.id);
          const button = event.currentTarget.querySelector<HTMLButtonElement>(
            `[data-tab-id="${next.id}"]`,
          );
          button?.focus();
        }}
      >
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              data-tab-id={item.id}
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                'focus-ring relative min-h-12 px-3 text-sm font-medium transition-colors duration-[150ms]',
                selected ? 'text-text' : 'text-text-muted hover:text-text-secondary',
              )}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          );
        })}
        <span
          aria-hidden
          className="bg-accent pointer-events-none absolute bottom-0 h-0.5 transition-[inset-inline-start,width] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ insetInlineStart: indicator.start, width: indicator.width }}
        />
      </div>
      <AnimatePresence mode="wait">
        {current ? (
          <motion.div
            key={current.id}
            role="tabpanel"
            id={`${baseId}-panel-${current.id}`}
            aria-labelledby={`${baseId}-tab-${current.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="pt-4"
          >
            {current.panel}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
