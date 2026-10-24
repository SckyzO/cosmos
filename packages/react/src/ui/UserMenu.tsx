import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import {
  createContext,
  useContext,
  useRef,
  type ComponentType,
  type ReactNode,
  type ComponentPropsWithRef,
} from 'react';
import { Avatar } from './Avatar';
import { FloatingPanel } from './FloatingPanel';
import type { Intent } from './intent';
import { mergeRefs } from './mergeRefs';
import { useControllableState } from '../hooks/useControllableState';

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  align: 'left' | 'right';
  /** Item to focus when the menu opens: `last` after ArrowUp on the trigger. */
  initialItemRef: React.MutableRefObject<'first' | 'last'>;
};

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';
const menuItems = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR));

const UserMenuContext = createContext<Ctx | null>(null);
const useCtx = (): Ctx => {
  const ctx = useContext(UserMenuContext);
  if (!ctx) throw new Error('UserMenu.* must be used inside <UserMenu>');
  return ctx;
};

// ── Root ─────────────────────────────────────────────────────────────────────

export type UserMenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Side of the trigger the menu anchors to. Default `right`. */
  align?: 'left' | 'right';
  children: ReactNode;
};

const UserMenuRoot = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  align = 'right',
  children,
}: UserMenuProps) => {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'UserMenu.open',
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initialItemRef = useRef<'first' | 'last'>('first');

  return (
    <UserMenuContext.Provider value={{ open, setOpen, triggerRef, align, initialItemRef }}>
      {children}
    </UserMenuContext.Provider>
  );
};

// ── Trigger ──────────────────────────────────────────────────────────────────

export type UserMenuTriggerProps = Omit<ComponentPropsWithRef<'button'>, 'onClick' | 'children'> & {
  /** Display name shown next to the avatar. Also used for initials fallback. */
  name: string;
  /** Avatar image URL. Falls back to initials of `name`. */
  avatarSrc?: string;
  /** Hide the textual name (icon-only trigger). Useful on small viewports. */
  hideName?: boolean;
};

function UserMenuTrigger({
  name,
  avatarSrc,
  hideName = false,
  className,
  ref,
  ...rest
}: UserMenuTriggerProps) {
  const { open, setOpen, triggerRef, initialItemRef } = useCtx();
  return (
    <button
      ref={mergeRefs(triggerRef, ref)}
      type="button"
      aria-label={`User menu for ${name}`}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => {
        initialItemRef.current = 'first';
        setOpen(!open);
      }}
      // Menu button pattern: ArrowDown opens on the first item, ArrowUp on the last.
      onKeyDown={(e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        initialItemRef.current = e.key === 'ArrowUp' ? 'last' : 'first';
        setOpen(true);
      }}
      className={clsx(
        'focus-visible:focus-indicator flex items-center gap-2 rounded-lg border border-gray-200 py-1.5 pr-3 pl-2 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-white/5',
        className
      )}
      {...rest}
    >
      <Avatar src={avatarSrc} name={name} size="sm" />
      {!hideName && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{name}</span>
      )}
      <ChevronDown
        className={clsx(
          'h-4 w-4 shrink-0 text-gray-400 transition-transform',
          open && 'rotate-180'
        )}
        aria-hidden
      />
    </button>
  );
}

// ── Content (portal) ─────────────────────────────────────────────────────────

export type UserMenuContentProps = {
  /** Tailwind width class. Default `w-56` (224px). */
  width?: string;
  className?: string;
  children: ReactNode;
};

const UserMenuContent = ({ width = 'w-56', className, children }: UserMenuContentProps) => {
  const { open, setOpen, triggerRef, align, initialItemRef } = useCtx();
  return (
    <FloatingPanel
      open={open}
      onClose={() => setOpen(false)}
      triggerRef={triggerRef}
      placement={{ side: 'bottom', align: align === 'right' ? 'end' : 'start', offset: 8 }}
      initialFocus={(menu) => {
        const items = menuItems(menu);
        return initialItemRef.current === 'last' ? items[items.length - 1] : items[0];
      }}
      role="menu"
      tabIndex={-1}
      aria-label="User menu"
      onKeyDown={(e) => {
        // Items are out of the tab order (Tab leaves the menu); arrows,
        // Home and End move between them, wrapping at both ends.
        const items = menuItems(e.currentTarget);
        if (items.length === 0) return;
        const i = items.indexOf(document.activeElement as HTMLElement);
        const n = items.length;
        const next =
          e.key === 'ArrowDown'
            ? items[(i + 1) % n]
            : e.key === 'ArrowUp'
              ? items[(i - 1 + n) % n]
              : e.key === 'Home'
                ? items[0]
                : e.key === 'End'
                  ? items[n - 1]
                  : undefined;
        if (!next) return;
        e.preventDefault();
        next.focus();
      }}
      className={clsx(
        'overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg outline-none dark:border-gray-700 dark:bg-gray-900',
        width,
        className
      )}
    >
      {children}
    </FloatingPanel>
  );
};

// ── Header (avatar + name + email) ───────────────────────────────────────────

export type UserMenuHeaderProps = {
  name: string;
  email?: string;
  avatarSrc?: string;
  className?: string;
};

const UserMenuHeader = ({ name, email, avatarSrc, className }: UserMenuHeaderProps) => (
  <div
    className={clsx(
      'flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800',
      className
    )}
  >
    <Avatar src={avatarSrc} name={name} size="md" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
      {email && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{email}</p>}
    </div>
  </div>
);

// ── Items (vertical group wrapper) ───────────────────────────────────────────

const UserMenuItems = ({ children }: { children: ReactNode }) => (
  <div role="group" className="py-1">
    {children}
  </div>
);

// ── Item ─────────────────────────────────────────────────────────────────────

export type UserMenuItemIntent = Extract<Intent, 'neutral' | 'danger'>;

export type UserMenuItemProps = ComponentPropsWithRef<'button'> & {
  icon?: ComponentType<{ className?: string }>;
  /** `danger` colors a destructive item (sign out, delete) red. Default `neutral`. */
  intent?: UserMenuItemIntent;
  /** Auto-close the menu after click. Default true. */
  closeOnClick?: boolean;
};

function UserMenuItem({
  icon: Icon,
  intent = 'neutral',
  closeOnClick = true,
  onClick,
  className,
  children,
  ref,
  ...rest
}: UserMenuItemProps) {
  const { setOpen } = useCtx();
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={(e) => {
        onClick?.(e);
        if (closeOnClick && !e.defaultPrevented) setOpen(false);
      }}
      className={clsx(
        'focus-visible:focus-indicator flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors focus-visible:ring-inset',
        intent === 'danger'
          ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:bg-red-500/10'
          : 'text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 dark:focus-visible:bg-white/5',
        className
      )}
      {...rest}
    >
      {Icon && (
        <Icon
          className={clsx(
            'h-4 w-4 shrink-0',
            intent === 'danger'
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-400 dark:text-gray-500'
          )}
          aria-hidden
        />
      )}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

// ── Separator ────────────────────────────────────────────────────────────────

const UserMenuSeparator = () => (
  <div role="separator" className="my-1 border-t border-gray-100 dark:border-gray-800" />
);

// ── Compound export ──────────────────────────────────────────────────────────

export const UserMenu = Object.assign(UserMenuRoot, {
  Trigger: UserMenuTrigger,
  Content: UserMenuContent,
  Header: UserMenuHeader,
  Items: UserMenuItems,
  Item: UserMenuItem,
  Separator: UserMenuSeparator,
});
