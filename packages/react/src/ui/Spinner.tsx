import { clsx } from 'clsx';
import type { Intent } from './intent';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** What the arc means: the accent (`brand`, default), a plain gray, an outcome or a problem. */
export type SpinnerIntent = Extract<Intent, 'brand' | 'neutral' | 'success' | 'warning' | 'danger'>;

const SIZE_CLASS: Record<SpinnerSize, string> = {
  // The size of the icon of an `xs` Button.
  xs: 'h-3 w-3 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-10 w-10 border-4',
};

// One whole set per intent, track and arc: a default with an override on top is settled by the
// order of the generated CSS, not by the order here. The arc is `-600` in the light themes and
// `-500` in the dark ones, except `brand`, which keeps `brand-500` in both (it already reaches 3:1
// on every theme, and the default spinner does not change). It is repeated under `dark:` because
// `dark:border-*` for the track would otherwise paint over it.
const INTENT_CLASS: Record<SpinnerIntent, string> = {
  brand: 'border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-500',
  neutral: 'border-gray-200 border-t-gray-500 dark:border-gray-700 dark:border-t-gray-400',
  success: 'border-gray-200 border-t-green-600 dark:border-gray-700 dark:border-t-green-500',
  warning: 'border-gray-200 border-t-amber-600 dark:border-gray-700 dark:border-t-amber-500',
  danger: 'border-gray-200 border-t-red-600 dark:border-gray-700 dark:border-t-red-500',
};

// A white arc over a 30% white track, in every theme.
const ON_DARK_CLASS = 'border-white/30 border-t-white';

export type SpinnerProps = {
  size?: SpinnerSize;
  /**
   * What the arc means. `brand` (default) follows the accent, `neutral` is a plain gray. Ignored
   * when `onDark` is set.
   */
  intent?: SpinnerIntent;
  /**
   * A white arc over a translucent white track, whatever the theme, for a spinner on a dark or
   * photographic surface (the overlay of `AvatarUploader`). It takes the place of `intent`.
   */
  onDark?: boolean;
  /** Layout only (margin, position): the colors come from `intent` and `onDark`. */
  className?: string;
};

export const Spinner = ({
  size = 'md',
  intent = 'brand',
  onDark = false,
  className,
}: SpinnerProps) => (
  <div
    role="status"
    aria-label="Loading"
    className={clsx(
      'animate-spin rounded-full',
      onDark ? ON_DARK_CLASS : INTENT_CLASS[intent],
      SIZE_CLASS[size],
      className
    )}
  />
);
