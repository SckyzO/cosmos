import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

export type ButtonGroupProps = {
  /** Stacking direction. Default `horizontal`. */
  orientation?: ButtonGroupOrientation;
  /** Render as attached (shared border, rounded only on outer edges). Default `true`. */
  attached?: boolean;
  /** Gap between buttons when `attached={false}`. Tailwind size token. Default `gap-2`. */
  gap?: string;
  className?: string;
  children: ReactNode;
};

/**
 * ButtonGroup — wraps `<Button>` (or any button-like) children to render
 * them as a connected segment row/column. The wrapper applies CSS
 * selectors so the inner buttons keep their own variant/size/icon props.
 *
 * Patterns: period selectors (Day/Week/Month), toolbars, paginators,
 * grouped actions (Save/Delete).
 */
export const ButtonGroup = ({
  orientation = 'horizontal',
  attached = true,
  gap = 'gap-2',
  className,
  children,
}: ButtonGroupProps) => {
  if (!attached) {
    return (
      <div
        className={clsx(
          'inline-flex',
          orientation === 'vertical' ? 'flex-col' : 'flex-row',
          gap,
          className,
        )}
        role="group"
      >
        {children}
      </div>
    );
  }
  return (
    <div
      role="group"
      className={clsx(
        'isolate inline-flex',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        // Reset corner radii on every child, then re-apply to the outer ones.
        '[&>button]:rounded-none',
        // Bring the focused button on top so its focus ring is fully visible.
        '[&>button:focus-visible]:z-10 [&>button:focus]:z-10',
        orientation === 'horizontal' && [
          '[&>button:first-child]:rounded-l-lg',
          '[&>button:last-child]:rounded-r-lg',
          // Collapse adjacent borders by pulling each subsequent button 1px left.
          '[&>button:not(:first-child)]:-ml-px',
        ],
        orientation === 'vertical' && [
          '[&>button:first-child]:rounded-t-lg',
          '[&>button:last-child]:rounded-b-lg',
          '[&>button:not(:first-child)]:-mt-px',
        ],
        className,
      )}
    >
      {children}
    </div>
  );
};
