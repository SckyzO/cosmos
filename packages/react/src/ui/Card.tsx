import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

const PADDING_CLASS = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

const Root = ({ children, className, padding = 'md' }: CardProps) => (
  <div
    className={clsx(
      'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
      PADDING_CLASS[padding],
      className
    )}
  >
    {children}
  </div>
);

const Header = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800',
      className
    )}
  >
    {children}
  </div>
);

const Body = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('p-4', className)}>{children}</div>
);

const Footer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800',
      className
    )}
  >
    {children}
  </div>
);

export const Card = Object.assign(Root, { Header, Body, Footer });
