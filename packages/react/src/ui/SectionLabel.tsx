import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type SectionLabelProps = {
  children: ReactNode;
  className?: string;
};

/**
 * SectionLabel — small upper-cased label used as a quiet section divider
 * inside drawers, settings panels, and form groups.
 */
export const SectionLabel = ({ children, className }: SectionLabelProps) => (
  <p
    className={clsx(
      'text-[10px] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-600',
      className
    )}
  >
    {children}
  </p>
);
