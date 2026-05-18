import { clsx } from 'clsx';
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

// TUI Plus reference (Pattern 1 — "Simple"):
//   <nav class="flex flex-1 flex-col">
//     <ul role="list" class="-mx-2 space-y-1">
//       <li>
//         <a href="#" class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold
//                           bg-gray-50 text-indigo-600" aria-current="page">Dashboard</a>
//       </li>
//       <li><a class="… text-gray-700 hover:bg-gray-50 hover:text-indigo-600">Team</a></li>
//       …
//     </ul>
//   </nav>
//
// Pattern 2 — "With badges": same row + trailing badge pill.
// Pattern 3 — "With icons": leading icon (size-6 text-gray-400 group-hover:text-indigo-600).
// Pattern 6 — "On gray": switches the active state to white-on-gray-100 (subtle).

// ── Item ─────────────────────────────────────────────────────────────────────

export type VerticalNavigationItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** Leading icon (lucide-react component). */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  /** Trailing badge content (count, "new", etc.). */
  badge?: ReactNode;
  active?: boolean;
};

const Item = forwardRef<HTMLAnchorElement, VerticalNavigationItemProps>(function Item(
  { icon: Icon, badge, active = false, className, children, ...rest },
  ref,
) {
  return (
    <li>
      <a
        ref={ref}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          'group flex items-center gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
          active
            ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-indigo-400'
            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-indigo-400',
          className,
        )}
        {...rest}
      >
        {Icon && (
          <Icon
            className={clsx(
              'size-5 shrink-0',
              active
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400',
            )}
            aria-hidden
          />
        )}
        <span className="flex-1 truncate">{children}</span>
        {badge && (
          <span
            className={clsx(
              'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ring-1 ring-inset',
              active
                ? 'bg-white text-indigo-600 ring-indigo-600/20 dark:bg-gray-900 dark:text-indigo-400 dark:ring-indigo-400/30'
                : 'bg-white text-gray-700 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-white/10',
            )}
          >
            {badge}
          </span>
        )}
      </a>
    </li>
  );
});

// ── Section heading (between item groups) ───────────────────────────────────

export type VerticalNavigationSectionProps = HTMLAttributes<HTMLLIElement> & {
  /** Section label, rendered as a small uppercase header. */
  label: ReactNode;
};

const Section = ({ label, children, className, ...rest }: VerticalNavigationSectionProps) => (
  <li className={clsx('mt-4 first:mt-0', className)} {...rest}>
    <div className="px-2 text-xs/6 font-semibold text-gray-400 dark:text-gray-500">
      {label}
    </div>
    <ul role="list" className="-mx-2 mt-1 space-y-1">
      {children}
    </ul>
  </li>
);

// ── Root ─────────────────────────────────────────────────────────────────────

export type VerticalNavigationProps = HTMLAttributes<HTMLElement> & {
  /** Tighter padding (TUI "On gray" pattern), useful inside a gray-bg surface. */
  variant?: 'default' | 'on-gray';
  children: ReactNode;
};

const Root = forwardRef<HTMLElement, VerticalNavigationProps>(function VerticalNavigationRoot(
  { variant = 'default', className, children, ...rest },
  ref,
) {
  return (
    <nav
      ref={ref}
      aria-label="Sidebar"
      className={clsx(
        'flex flex-1 flex-col',
        variant === 'on-gray' && 'rounded-md bg-gray-50 p-3 dark:bg-gray-800/60',
        className,
      )}
      {...rest}
    >
      <ul role="list" className="-mx-2 space-y-1">
        {children}
      </ul>
    </nav>
  );
});

// ── Compound export ──────────────────────────────────────────────────────────

export const VerticalNavigation = Object.assign(Root, { Item, Section });
