import type { Transition, Variants } from 'framer-motion';

/** Courbe principale du produit — uniquement transform / opacity. */
export const easeOutExpo: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const duration = {
  fast: 0.15,
  base: 0.22,
  slow: 0.35,
} as const;

export const transitionBase: Transition = {
  duration: duration.base,
  ease: easeOutExpo,
};

export const transitionFast: Transition = {
  duration: duration.fast,
  ease: easeOutExpo,
};

export const springSheet: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.9,
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: transitionBase },
  exit: { opacity: 0, transition: transitionFast },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: transitionBase },
  exit: { opacity: 0, y: 8, transition: transitionFast },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: transitionBase },
  exit: { opacity: 0, scale: 0.98, transition: transitionFast },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.04,
    },
  },
};

export const reducedMotionFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
};

export function variantsFor(reduced: boolean, animated: Variants): Variants {
  return reduced ? reducedMotionFade : animated;
}
