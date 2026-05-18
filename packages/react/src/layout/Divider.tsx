import { clsx } from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

// TUI Plus reference (Pattern 1 — "With label"):
//   <div class="relative">
//     <div aria-hidden="true" class="absolute inset-0 flex items-center">
//       <div class="w-full border-t border-gray-300"></div>
//     </div>
//     <div class="relative flex justify-center">
//       <span class="bg-white px-2 text-sm text-gray-500">Continue</span>
//     </div>
//   </div>
//
// Pattern 2 — "With icon": replaces the centered <span> with a circular
//   icon chip: <div class="bg-white px-2"><PlusIcon class="size-5 text-gray-400" /></div>
//
// Pattern 3 — "With label on left": flex justify-start instead of center, with
//   left padding so the line still touches the right edge.
//
// Pattern 4-5 — "With title (left)": same as 1/3 but the inset content is a
//   larger text-base font-semibold instead of text-sm gray-500.
//
// Pattern 6 — "With button": instead of a line + centered inset, this is a
//   plain horizontal flex row: title left, action button right, both above a
//   border-bottom of the parent container — not a "line in the middle" layout.
//
// Pattern 7-8 — "With title and button" / "With toolbar": title left, buttons
//   right, both flanking a horizontal border below.

export type DividerAlign = 'left' | 'center' | 'right';

export type DividerProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Render an inset label/icon centered (or aligned) on top of the line.
   * Mutually exclusive with `bordered` row helpers (use `Divider.Row` for those).
   */
  inset?: ReactNode;
  /** Position of the inset element along the line. Default `center`. */
  align?: DividerAlign;
  /**
   * When `true`, the inset slot uses larger text (`text-base font-semibold
   * text-gray-900`) instead of the default `text-sm text-gray-500`.
   * Maps to TUI "With title" / "With title on left".
   */
  emphasis?: boolean;
  /**
   * Background color of the inset slot — must match the surrounding surface
   * so the line appears to pass behind. Default `bg-white dark:bg-gray-900`.
   */
  insetBg?: string;
};

// ── Root: classic "line with optional inset" divider ────────────────────────

const Root = ({
  inset,
  align = 'center',
  emphasis = false,
  insetBg = 'bg-white dark:bg-gray-900',
  className,
  ...rest
}: DividerProps) => {
  if (!inset) {
    return (
      <div
        role="separator"
        className={clsx('h-px w-full border-t border-gray-200 dark:border-white/10', className)}
        {...rest}
      />
    );
  }
  const justify =
    align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
  return (
    <div className={clsx('relative', className)} {...rest}>
      <div aria-hidden="true" className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-white/10" />
      </div>
      <div className={clsx('relative flex', justify)}>
        <span
          className={clsx(
            'px-2',
            insetBg,
            emphasis
              ? 'text-base font-semibold text-gray-900 dark:text-white'
              : 'text-sm text-gray-500 dark:text-gray-400'
          )}
        >
          {inset}
        </span>
      </div>
    </div>
  );
};

// ── Icon variant: same shape as Root with inset, but inset is an icon chip ──

export type DividerIconProps = Omit<DividerProps, 'inset' | 'emphasis'> & {
  icon: ElementType;
  /** Icon CSS class for sizing/color. Default `size-5 text-gray-400`. */
  iconClassName?: string;
};

const Icon = ({
  icon: IconCmp,
  iconClassName = 'size-5 text-gray-400 dark:text-gray-500',
  align = 'center',
  insetBg = 'bg-white dark:bg-gray-900',
  className,
  ...rest
}: DividerIconProps) => {
  const justify =
    align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
  return (
    <div className={clsx('relative', className)} {...rest}>
      <div aria-hidden="true" className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-white/10" />
      </div>
      <div className={clsx('relative flex', justify)}>
        <span className={clsx('flex px-2', insetBg)}>
          <IconCmp className={iconClassName} aria-hidden />
        </span>
      </div>
    </div>
  );
};

// ── Row variant: title + actions row above a horizontal border ──────────────

export type DividerRowProps = HTMLAttributes<HTMLDivElement> & {
  /** Left-aligned title. Use `null` to render only actions. */
  title?: ReactNode;
  /** Right-aligned trailing content — button, button group, toolbar, etc. */
  actions?: ReactNode;
  /**
   * Use a larger font size for the title (TUI "With title and button").
   * Default `true`. Set `false` to use plain text.
   */
  emphasis?: boolean;
};

const Row = ({ title, actions, emphasis = true, className, ...rest }: DividerRowProps) => (
  <div
    className={clsx(
      'flex items-center justify-between gap-x-4 border-b border-gray-200 pb-3 dark:border-white/10',
      className
    )}
    {...rest}
  >
    <div className="min-w-0">
      {title && (
        <h3
          className={clsx(
            emphasis
              ? 'text-base font-semibold text-gray-900 dark:text-white'
              : 'text-sm text-gray-500 dark:text-gray-400'
          )}
        >
          {title}
        </h3>
      )}
    </div>
    {actions && <div className="ml-3 flex shrink-0 items-center gap-x-2">{actions}</div>}
  </div>
);

// ── Compound export ──────────────────────────────────────────────────────────

export const Divider = Object.assign(Root, { Icon, Row });
