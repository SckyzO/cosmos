import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';
import type { Intent } from './intent';

// A button has a name: its text, or here its `aria-label` or the elements `aria-labelledby` points at.
type Named =
  | { 'aria-label': string; 'aria-labelledby'?: undefined }
  | { 'aria-label'?: undefined; 'aria-labelledby': string };

export type IconButtonProps = Omit<
  ComponentPropsWithRef<'button'>,
  'aria-label' | 'aria-labelledby'
> &
  Named & {
    /**
     * `md` (default) is a 32px box; `sm` is the dense control height (28px, following the density
     * setting), for a row that is already tight.
     */
    size?: 'sm' | 'md';
    /**
     * `neutral` (default), or `danger`: also neutral at rest, red only on hover and focus, so a
     * list of delete buttons does not shout.
     */
    intent?: Extract<Intent, 'neutral' | 'danger'>;
  };

const SIZE = {
  sm: 'h-ctrl-28 w-ctrl-28',
  md: 'size-8',
};

const INTENT = {
  neutral:
    'text-[var(--color-text-muted)] hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/10',
  danger:
    'text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-700 focus-visible:text-red-700 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:focus-visible:text-red-400',
};

/** The look of an `IconButton`, for a control that renders its own button (a `Menu.Trigger`). */
export const iconButtonClass = ({
  size = 'md',
  intent = 'neutral',
}: Pick<IconButtonProps, 'size' | 'intent'> = {}) =>
  clsx(
    'focus-visible:focus-indicator flex shrink-0 items-center justify-center rounded-lg transition-colors [&>svg]:size-4',
    SIZE[size],
    INTENT[intent]
  );

/**
 * IconButton — the icon-only control at the end of a row (mark as read, delete, star, remove): a
 * 32px box around a 16px icon, muted at rest, tinted on hover, with the focus indicator. Its icon
 * is its child (any `svg` takes 16px); the name is required, since there is no text.
 *
 * Internal to the package, not exported: the rows that carry it (`FileTile`, `StackedList`,
 * `UploadQueue`) and the stories of `NotificationRow`'s `actions` share one recipe.
 */
export const IconButton = ({
  size,
  intent,
  type = 'button',
  className,
  ref,
  ...rest
}: IconButtonProps) => (
  <button
    ref={ref}
    type={type}
    className={clsx(iconButtonClass({ size, intent }), className)}
    {...rest}
  />
);
