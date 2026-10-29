import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type ComponentPropsWithRef,
} from 'react';
import { AppLink } from '../ui/AppLink';
import { Menu } from '../ui/Menu';

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

// The light bar follows the page theme, so the page's text colour suits it. The
// dark bar stays dark on light pages: it sets its own text colour.
const ROOT_BG: Record<NavbarTheme, string> = {
  light: 'bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-white/10',
  dark: 'bg-gray-800 text-white',
};

const ITEM_BASE = 'rounded-md px-3 py-row-8 text-sm font-medium focus-visible:focus-indicator';

// Idle and active styles are exclusive: an idle item's hover background would
// otherwise repaint the active item under the pointer.
const ITEM_IDLE: Record<NavbarTheme, string> = {
  light: 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5',
  dark: 'text-gray-300 hover:bg-gray-700 hover:text-white',
};

const ITEM_ACTIVE: Record<NavbarTheme, string> = {
  light: 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white',
  dark: 'bg-gray-900 text-white',
};

// Parts without a `theme` prop take the theme of their `<Navbar>` (`light`
// when rendered outside one).
const NavbarThemeContext = createContext<NavbarTheme>('light');

// ── Root ─────────────────────────────────────────────────────────────────────

export type NavbarProps = ComponentPropsWithRef<'nav'> & {
  /**
   * `light` follows the page theme (white, gray-800 in the dark themes);
   * `dark` stays dark in every theme. Also the default theme of the parts.
   * Default `light`.
   */
  theme?: NavbarTheme;
  /** Constrain inner content to a max width container. Default `7xl`. */
  maxWidth?: 'none' | '7xl';
  /** Override the inner row height. Default `h-16` (64px). */
  heightClassName?: string;
  children: ReactNode;
};

function NavbarRoot({
  theme = 'light',
  maxWidth = '7xl',
  heightClassName = 'h-16',
  className,
  children,
  ref,
  ...rest
}: NavbarProps) {
  return (
    <nav ref={ref} className={clsx(ROOT_BG[theme], className)} data-theme={theme} {...rest}>
      <div className={clsx('px-4 sm:px-6 lg:px-8', maxWidth === '7xl' && 'mx-auto max-w-7xl')}>
        <div className={clsx('flex items-center justify-between', heightClassName)}>
          <NavbarThemeContext.Provider value={theme}>{children}</NavbarThemeContext.Provider>
        </div>
      </div>
    </nav>
  );
}

// ── Brand ────────────────────────────────────────────────────────────────────

// Tells a Brand that an `Items` sits inside it: the Brand then takes the room the bar leaves
// (`Items` measures its own width to move what does not fit into "More") instead of staying as
// wide as its content.
const BrandContext = createContext<((hasItems: boolean) => void) | null>(null);

const Brand = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => {
  const [hasItems, setHasItems] = useState(false);
  return (
    <div
      className={clsx('flex items-center', hasItems ? 'min-w-0 flex-1' : 'shrink-0', className)}
      {...rest}
    >
      <BrandContext.Provider value={setHasItems}>{children}</BrandContext.Provider>
    </div>
  );
};

// ── Trigger (the button of a Menu and of "More") ────────────────────────────

type NavbarTriggerProps = {
  label: ReactNode;
  active: boolean;
  theme: NavbarTheme;
  className?: string;
};

function NavbarTrigger({ label, active, theme, className }: NavbarTriggerProps) {
  return (
    <Menu.Trigger
      // A button has no "current page": `true` marks the group that holds it.
      aria-current={active ? 'true' : undefined}
      className={clsx(
        ITEM_BASE,
        'group inline-flex items-center gap-1',
        active ? ITEM_ACTIVE[theme] : ITEM_IDLE[theme],
        className
      )}
    >
      {label}
      <ChevronDown
        className="size-4 shrink-0 transition-transform group-aria-expanded:rotate-180"
        aria-hidden
      />
    </Menu.Trigger>
  );
}

// ── Menu (a dropdown group of links) ────────────────────────────────────────

export type NavbarMenuProps = {
  /** Text of the trigger. It also names the group in the "More" menu when the bar is full. */
  label: string;
  /**
   * Marks the group as holding the current page, the way `Navbar.Item`'s `active` marks a page.
   * Mark the current link itself with `aria-current="page"`.
   */
  active?: boolean;
  /** Defaults to the theme of the parent `<Navbar>`. */
  theme?: NavbarTheme;
  /** Open state, when controlled. */
  open?: boolean;
  /** Initial open state, when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called with the open state to move to. */
  onOpenChange?: (open: boolean) => void;
  /** Edge of the trigger the panel lines up with. Default `start`. */
  align?: 'start' | 'end';
  /** Tailwind width class of the panel. Default `w-56` (224px). */
  width?: string;
  className?: string;
  /** The links: `Menu.Item` with an `href`, `Menu.Group`, `Menu.Separator`. */
  children: ReactNode;
};

/**
 * A dropdown group of links in a `Navbar`: a trigger with a chevron that opens a `Menu` (the
 * menu button pattern: Enter, Space and the arrows open it, the arrows move between the links,
 * Escape closes it and gives the focus back to the trigger, Tab leaves it).
 */
const NavbarMenu = ({
  label,
  active = false,
  theme,
  open,
  defaultOpen,
  onOpenChange,
  align = 'start',
  width,
  className,
  children,
}: NavbarMenuProps) => {
  const inherited = useContext(NavbarThemeContext);
  return (
    <Menu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} align={align}>
      <NavbarTrigger
        label={label}
        active={active}
        theme={theme ?? inherited}
        className={className}
      />
      <Menu.Content width={width}>{children}</Menu.Content>
    </Menu>
  );
};

// ── Items (the horizontal main nav, hidden on mobile by default) ────────────

export type NavbarItemsProps = HTMLAttributes<HTMLDivElement> & {
  /** Label of the menu that takes the items that do not fit. Default `More`. */
  moreLabel?: string;
};

type Movable = ReactElement<NavbarItemProps> | ReactElement<NavbarMenuProps>;

// Only these can go into the "More" menu: any other child stays in the bar.
const isMovable = (node: ReactNode): node is Movable =>
  isValidElement(node) && (node.type === Item || node.type === NavbarMenu);

/** How many movable entries, counted from the last, do not fit in `available` px. */
function countHidden(
  widths: number[],
  movable: boolean[],
  more: number,
  gap: number,
  available: number
) {
  const slots = widths.length;
  const movableCount = movable.filter(Boolean).length;
  const flow = (hidden: number) => {
    // The last `hidden` movable entries leave the row; "More" joins it.
    let skip = hidden;
    let width = hidden > 0 ? more : 0;
    let count = hidden > 0 ? 1 : 0;
    for (let i = slots - 1; i >= 0; i -= 1) {
      if (movable[i] && skip > 0) {
        skip -= 1;
        continue;
      }
      width += widths[i];
      count += 1;
    }
    return width + gap * Math.max(count - 1, 0);
  };
  let hidden = 0;
  while (hidden < movableCount && flow(hidden) > available) hidden += 1;
  return hidden;
}

const Items = ({ className, children, moreLabel = 'More', ...rest }: NavbarItemsProps) => {
  const theme = useContext(NavbarThemeContext);
  const setHasItems = useContext(BrandContext);
  const rootRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(0);
  const entries = Children.toArray(children);

  useLayoutEffect(() => {
    setHasItems?.(true);
    return () => setHasItems?.(false);
  }, [setHasItems]);

  const slotCount = entries.length;
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const row = root.firstElementChild as HTMLElement;
    const measure = () => {
      // Out of the layout below `md`: nothing to fit, and the last count stays.
      const available = root.clientWidth;
      if (available === 0) return;
      const slots = Array.from(row.querySelectorAll<HTMLElement>(':scope > [data-navbar-slot]'));
      const more = row.querySelector<HTMLElement>(':scope > [data-navbar-more]');
      const widths = slots.map((slot) => slot.getBoundingClientRect().width);
      const movable = slots.map((slot) => slot.dataset.navbarSlot === 'movable');
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const next = countHidden(
        widths,
        movable,
        more?.getBoundingClientRect().width ?? 0,
        gap,
        available
      );
      setHidden(next);
    };
    // The first report of the observer comes after paint: measure now, so the first frame fits.
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const child of row.children) observer.observe(child);
    return () => observer.disconnect();
  }, [slotCount]);

  // The last `hidden` movable entries leave the bar for "More".
  const movableKeys = entries.filter(isMovable).map((entry) => entry.key);
  const hiddenKeys = new Set(hidden > 0 ? movableKeys.slice(-hidden) : []);
  const overflow = entries.filter(isMovable).filter((entry) => hiddenKeys.has(entry.key));
  const moreActive = overflow.some((entry) => entry.props.active);

  return (
    <div
      ref={rootRef}
      className={clsx('hidden md:ms-10 md:block', setHasItems && 'min-w-0 flex-1', className)}
      {...rest}
    >
      <div className="relative flex items-baseline gap-x-4 whitespace-nowrap">
        {entries.map((entry) => {
          const movable = isMovable(entry);
          const out = movable && hiddenKeys.has(entry.key);
          return (
            // A hidden entry keeps its box (out of the flow, invisible, not focusable): its width
            // is what brings it back when there is room.
            <div
              key={isValidElement(entry) ? entry.key : undefined}
              data-navbar-slot={movable ? 'movable' : 'fixed'}
              className={clsx(
                // flex keeps the entry a block box, so its padding sizes the slot.
                'flex shrink-0',
                out && 'inset-s-0 pointer-events-none invisible absolute top-0'
              )}
            >
              {entry}
            </div>
          );
        })}
        {movableKeys.length > 0 && (
          <div
            data-navbar-more=""
            className={clsx(
              'flex shrink-0',
              hidden === 0 && 'inset-s-0 pointer-events-none invisible absolute top-0'
            )}
          >
            <Menu>
              <NavbarTrigger label={moreLabel} active={moreActive} theme={theme} />
              <Menu.Content>
                {overflow.map((entry) => (
                  <OverflowEntry key={entry.key} entry={entry} />
                ))}
              </Menu.Content>
            </Menu>
          </div>
        )}
      </div>
    </div>
  );
};

// An entry that left the bar, as it reads in the "More" menu: an item is a link, a menu is a
// labelled group of its links.
function OverflowEntry({ entry }: { entry: Movable }) {
  if (entry.type === NavbarMenu) {
    const { label, children } = entry.props as NavbarMenuProps;
    return <Menu.Group label={label}>{children}</Menu.Group>;
  }
  // The menu has its own surface: the bar's `theme` and classes do not apply to it.
  const { active, children, ...rest } = { ...(entry.props as NavbarItemProps) };
  delete rest.className;
  delete rest.theme;
  return (
    <Menu.Item
      {...(rest as Record<string, unknown>)}
      onClick={rest.onClick as ((e: MouseEvent<HTMLElement>) => void) | undefined}
      aria-current={active ? 'page' : undefined}
      className={active ? 'font-semibold' : undefined}
    >
      {children}
    </Menu.Item>
  );
}

// ── Item (anchor or button) ─────────────────────────────────────────────────

export type NavbarItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  active?: boolean;
  /** Defaults to the theme of the parent `<Navbar>`. */
  theme?: NavbarTheme;
};

const Item = ({ active = false, theme, className, children, ...rest }: NavbarItemProps) => {
  const inherited = useContext(NavbarThemeContext);
  const resolved = theme ?? inherited;
  return (
    <AppLink
      aria-current={active ? 'page' : undefined}
      className={clsx(ITEM_BASE, active ? ITEM_ACTIVE[resolved] : ITEM_IDLE[resolved], className)}
      {...rest}
    >
      {children}
    </AppLink>
  );
};

// ── Actions (end-aligned slot for notifications, avatar, quick action) ───

const Actions = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('hidden md:block', className)} {...rest}>
    <div className="ms-4 flex items-center gap-3 md:ms-6">{children}</div>
  </div>
);

// ── MobileMenuButton (hamburger for narrow viewports) ──────────────────────

export type NavbarMobileMenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Defaults to the theme of the parent `<Navbar>`. */
  theme?: NavbarTheme;
};

const MobileMenuButton = ({ theme, className, children, ...rest }: NavbarMobileMenuButtonProps) => {
  const inherited = useContext(NavbarThemeContext);
  const resolved = theme ?? inherited;
  return (
    <button
      type="button"
      aria-label="Toggle menu"
      className={clsx(
        'focus-visible:focus-indicator relative inline-flex size-10 items-center justify-center rounded-md md:hidden',
        resolved === 'dark'
          ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
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
};

// ── Compound export ──────────────────────────────────────────────────────────

export const Navbar = Object.assign(NavbarRoot, {
  Brand,
  Items,
  Item,
  Menu: NavbarMenu,
  Actions,
  MobileMenuButton,
});
