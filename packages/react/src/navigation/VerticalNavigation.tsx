import { clsx } from 'clsx';
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
  type ComponentPropsWithRef,
} from 'react';
import { useIndicator } from '../hooks/useIndicator';
import { AppLink } from '../ui/AppLink';
import { mergeRefs } from '../ui/mergeRefs';
import { SlidingIndicator } from '../ui/SlidingIndicator';

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

// Whether the navigation's marker is in place: the active item then leaves its background to it.
// Until it is (server render, the first frame of a hydration) the item draws it itself.
const MarkedContext = createContext(false);

// ── Item ─────────────────────────────────────────────────────────────────────

export type VerticalNavigationItemProps = ComponentPropsWithRef<'a'> & {
  /** Leading icon (lucide-react component). */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  /** Trailing badge content (count, "new", etc.). */
  badge?: ReactNode;
  active?: boolean;
};

function Item({
  icon: Icon,
  badge,
  active = false,
  className,
  children,
  ref,
  ...rest
}: VerticalNavigationItemProps) {
  const marked = useContext(MarkedContext);
  return (
    <li>
      <AppLink
        ref={ref}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          'group focus-visible:focus-indicator flex items-center gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
          active
            ? clsx('text-indigo-600 dark:text-indigo-400', !marked && 'bg-gray-50 dark:bg-white/5')
            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-indigo-400',
          className
        )}
        {...rest}
      >
        {Icon && (
          <Icon
            className={clsx(
              'size-5 shrink-0',
              active
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400'
            )}
            aria-hidden
          />
        )}
        <span className="flex-1 truncate">
          <bdi>{children}</bdi>
        </span>
        {badge && (
          <span
            className={clsx(
              'ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ring-1 ring-inset',
              active
                ? 'bg-white text-indigo-600 ring-indigo-600/20 dark:bg-gray-900 dark:text-indigo-400 dark:ring-indigo-400/30'
                : 'bg-white text-gray-700 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-white/10'
            )}
          >
            <bdi>{badge}</bdi>
          </span>
        )}
      </AppLink>
    </li>
  );
}

// ── Section heading (between item groups) ───────────────────────────────────

export type VerticalNavigationSectionProps = HTMLAttributes<HTMLLIElement> & {
  /** Section label, rendered as a small uppercase header. */
  label: ReactNode;
};

const Section = ({ label, children, className, ...rest }: VerticalNavigationSectionProps) => (
  <li className={clsx('mt-4 first:mt-0', className)} {...rest}>
    <div className="px-2 text-xs/6 font-semibold text-gray-500 dark:text-gray-400">{label}</div>
    {/* No `-mx-2` here: the section sits in the root list, which already reaches 8px past the
        edge, so the items' icons and labels start where the root items' icons do. */}
    <ul role="list" className="mt-1 space-y-1">
      {children}
    </ul>
  </li>
);

// ── Root ─────────────────────────────────────────────────────────────────────

export type VerticalNavigationProps = ComponentPropsWithRef<'nav'> & {
  /** Tighter padding (TUI "On gray" pattern), useful inside a gray-bg surface. */
  variant?: 'default' | 'on-gray';
  children: ReactNode;
};

function VerticalNavigationRoot({
  variant = 'default',
  className,
  children,
  ref,
  ...rest
}: VerticalNavigationProps) {
  // The background of the active item is one element that slides from item to item.
  const navRef = useRef<HTMLElement>(null);
  const marker = useIndicator(navRef, { active: 'a[aria-current="page"]', options: 'a' });
  const mergedRef = useMemo(() => mergeRefs(navRef, ref), [ref]);
  return (
    <nav
      ref={mergedRef}
      aria-label="Sidebar"
      className={clsx(
        // `relative isolate`: the marker is placed against the nav and sits behind the items.
        'relative isolate flex flex-1 flex-col',
        variant === 'on-gray' && 'rounded-md bg-gray-50 p-3 dark:bg-gray-800/60',
        className
      )}
      {...rest}
    >
      <SlidingIndicator
        marker={marker}
        axes="both"
        className="rounded-md bg-gray-50 dark:bg-white/5"
      />
      <MarkedContext value={marker.box !== null}>
        <ul role="list" className="-mx-2 space-y-1">
          {children}
        </ul>
      </MarkedContext>
    </nav>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

export const VerticalNavigation = Object.assign(VerticalNavigationRoot, { Item, Section });
