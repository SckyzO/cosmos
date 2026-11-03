import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';

/**
 * The chevron of a row's disclosure button, passed as the `icon` of a `Button`, which gives it its
 * size. It points to the end of the line (turned around where that is the left) and turns down
 * while the button, its parent, is `aria-expanded`: the same element in both states, so the turn
 * is a transition and not a swap of icons.
 *
 * Internal to the package, not exported.
 */
export const RowChevron = ({ className }: { className?: string }) => (
  <ChevronRight
    className={clsx(
      className,
      'transition-transform duration-(--cosmos-motion-base) ease-(--cosmos-ease-in-out) rtl:rotate-180 [[aria-expanded=true]>&]:rotate-90'
    )}
  />
);
