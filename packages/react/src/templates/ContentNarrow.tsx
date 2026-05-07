import { type ReactNode } from 'react';

export type ContentNarrowProps = {
  children: ReactNode;
  /** Max width in px. Default: 680 */
  maxWidth?: number;
  className?: string;
};

/**
 * ContentNarrow — centered constrained-width wrapper.
 *
 * Use inside PageCard or anywhere you want a readable column of content
 * (settings forms, prose, profile pages…). Default width is 680px.
 */
export const ContentNarrow = ({ children, maxWidth = 680, className }: ContentNarrowProps) => (
  <div className={`mx-auto w-full ${className ?? ''}`} style={{ maxWidth }}>
    {children}
  </div>
);
