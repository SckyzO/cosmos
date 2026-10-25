import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export type PageContainerWidth = 'narrow' | 'default' | 'full';

export type PageContainerProps = {
  children: ReactNode;
  /**
   * Width of the page column: `narrow` (768px, a form or a profile), `default` (960px, a
   * settings screen) or `full` (the whole content area, a dashboard). Default: `default`.
   */
  width?: PageContainerWidth;
  className?: string;
};

const WIDTH_CLASS: Record<PageContainerWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-[960px]',
  full: '',
};

/**
 * PageContainer — the padded, centered column of a page inside `Shell`.
 *
 * Every page composition uses it, so they share one padding (24px, 32px from `lg`) and pick
 * one of three widths instead of their own `max-w-*`.
 */
export const PageContainer = ({ children, width = 'default', className }: PageContainerProps) => (
  <div className={clsx('mx-auto w-full p-6 lg:p-8', WIDTH_CLASS[width], className)}>{children}</div>
);
