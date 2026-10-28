import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';

/**
 * The closed state of a row's disclosure button: a chevron toward the end of the line, turned
 * around where that is the left. Passed as the `icon` of a `Button`, which gives it its size.
 *
 * Internal to the package, not exported.
 */
export const RowChevron = ({ className }: { className?: string }) => (
  <ChevronRight className={clsx(className, 'rtl:-scale-x-100')} />
);
