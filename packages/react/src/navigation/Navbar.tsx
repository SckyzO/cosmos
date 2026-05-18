import { clsx } from 'clsx';
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

// TUI Plus reference (Pattern 1 — "Simple dark with menu button on left"):
//   <nav class="bg-gray-800">
//     <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//       <div class="flex h-16 items-center justify-between">
//         <div class="flex items-center">
//           <button>menu</button>           <!-- mobile hamburger -->
//           <img class="size-8" />          <!-- brand -->
//           <div class="hidden md:block">
//             <div class="ml-10 flex items-baseline space-x-4">
//               <a class="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
//                  aria-current="page">Dashboard</a>
//               <a class="text-gray-300 hover:bg-gray-700 hover:text-white …">Team</a>
//               ...
//             </div>
//           </div>
//         </div>
//         <div class="hidden md:block">
//           <div class="ml-4 flex items-center md:ml-6">
//             {/* notifications + avatar dropdown */}
//           </div>
//         </div>
//       </div>
//     </div>
//   </nav>

export type NavbarTheme = 'light' | 'dark';

const ROOT_BG: Record<NavbarTheme, string> = {
  light: 'bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-white/10',
  dark: 'bg-gray-800',
};

const ITEM_BASE: Record<NavbarTheme, string> = {
  light:
    'rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5',
  dark: 'rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white',
};

const ITEM_ACTIVE: Record<NavbarTheme, string> = {
  light: 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white',
  dark: 'bg-gray-900 text-white',
};

// ── Root ─────────────────────────────────────────────────────────────────────

export type NavbarProps = HTMLAttributes<HTMLElement> & {
  theme?: NavbarTheme;
  /** Constrain inner content to a max width container. Default `7xl`. */
  maxWidth?: 'none' | '7xl';
  /** Override the inner row height. Default `h-16` (64px). */
  heightClassName?: string;
  children: ReactNode;
};

const RootCmp = forwardRef<HTMLElement, NavbarProps>(function NavbarRoot(
  { theme = 'light', maxWidth = '7xl', heightClassName = 'h-16', className, children, ...rest },
  ref
) {
  return (
    <nav ref={ref} className={clsx(ROOT_BG[theme], className)} data-theme={theme} {...rest}>
      <div className={clsx('px-4 sm:px-6 lg:px-8', maxWidth === '7xl' && 'mx-auto max-w-7xl')}>
        <div className={clsx('flex items-center justify-between', heightClassName)}>{children}</div>
      </div>
    </nav>
  );
});

// ── Brand ────────────────────────────────────────────────────────────────────

const Brand = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('flex shrink-0 items-center', className)} {...rest}>
    {children}
  </div>
);

// ── Items (the horizontal main nav, hidden on mobile by default) ────────────

const Items = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('hidden md:ml-10 md:block', className)} {...rest}>
    <div className="flex items-baseline space-x-4">{children}</div>
  </div>
);

// ── Item (anchor or button) ─────────────────────────────────────────────────

export type NavbarItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  active?: boolean;
  /** Resolve theme from the parent `<Navbar>` data attribute. Defaults to `light`. */
  theme?: NavbarTheme;
};

const Item = ({
  active = false,
  theme = 'light',
  className,
  children,
  ...rest
}: NavbarItemProps) => (
  <a
    aria-current={active ? 'page' : undefined}
    className={clsx(ITEM_BASE[theme], active && ITEM_ACTIVE[theme], className)}
    {...rest}
  >
    {children}
  </a>
);

// ── Actions (right-aligned slot for notifications, avatar, quick action) ───

const Actions = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('hidden md:block', className)} {...rest}>
    <div className="ml-4 flex items-center gap-3 md:ml-6">{children}</div>
  </div>
);

// ── MobileMenuButton (hamburger for narrow viewports) ──────────────────────

export type NavbarMobileMenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  theme?: NavbarTheme;
};

const MobileMenuButton = ({
  theme = 'light',
  className,
  children,
  ...rest
}: NavbarMobileMenuButtonProps) => (
  <button
    type="button"
    aria-label="Toggle menu"
    className={clsx(
      'relative inline-flex size-10 items-center justify-center rounded-md md:hidden',
      theme === 'dark'
        ? 'text-gray-400 hover:bg-gray-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500',
      className
    )}
    {...rest}
  >
    {children ?? (
      <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    )}
  </button>
);

// ── Compound export ──────────────────────────────────────────────────────────

export const Navbar = Object.assign(RootCmp, {
  Brand,
  Items,
  Item,
  Actions,
  MobileMenuButton,
});
