import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type KbdSize = 'sm' | 'md';

export type KbdProps = {
  children: ReactNode;
  size?: KbdSize;
  className?: string;
};

const SIZE: Record<KbdSize, string> = {
  sm: 'h-5 min-w-[20px] px-1.5 text-3xs',
  md: 'h-6 min-w-[24px] px-2 text-xs',
};

/**
 * `Kbd` — represents a keyboard key. Use single instances for one-key shortcuts
 * (`⌘`, `K`) or compose multiple `<Kbd>` together with a `+` between them for
 * combos.
 *
 *     <Kbd>⌘</Kbd> <Kbd>K</Kbd>
 *
 * The component intentionally stays passive — no state, no overlay — so it can
 * sit inside tooltips, help screens, paragraphs and badges without coupling.
 */
export const Kbd = ({ children, size = 'md', className }: KbdProps) => (
  <kbd
    // A key keeps its glyphs in the order it is pressed in: an island, whatever the line reads.
    dir="ltr"
    className={clsx(
      'inline-flex shrink-0 items-center justify-center rounded-sm border border-gray-200 bg-gray-50 font-mono font-medium text-gray-700 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.04)]',
      SIZE[size],
      className
    )}
  >
    {children}
  </kbd>
);
