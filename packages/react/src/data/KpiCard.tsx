import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type KpiCardProps = {
  label: string;
  value: ReactNode;
  /** Smaller text under the value — e.g. "across 3 sites". */
  sub?: ReactNode;
  className?: string;
};

/**
 * KpiCard — single key metric card : label + large value + optional sub-text.
 * Use in dashboards as the top-row at-a-glance panel.
 */
export const KpiCard = ({ label, value, sub, className }: KpiCardProps) => (
  <div
    className={clsx(
      'flex flex-col rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900',
      className
    )}
  >
    <p className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
      {label}
    </p>
    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
  </div>
);
