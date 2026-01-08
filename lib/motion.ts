/**
 * Shared Motion Presets
 * 
 * Centralized motion language for consistent animations across the UI.
 * All motion should use these presets - no ad-hoc animations.
 * 
 * Motion communicates state change, not decoration.
 */

import { Variants } from 'framer-motion';

/**
 * Phase Container Animation
 * Used for mounting/unmounting phase transitions (input → resolving → result)
 */
export const phaseContainer = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: 'easeOut' },
} as const;

/**
 * Stagger Container
 * Used to create sequential reveals within a section
 * Children animate with a delay between each
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

/**
 * Item Fade Animation
 * Used for individual items within a staggered container
 */
export const itemFade: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

