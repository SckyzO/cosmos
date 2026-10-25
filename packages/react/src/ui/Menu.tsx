import { clsx } from 'clsx';
import {
  createContext,
  useContext,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type ComponentType,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import { FloatingPanel } from './FloatingPanel';
import type { Intent } from './intent';
import { mergeRefs } from './mergeRefs';
import { useControllableState } from '../hooks/useControllableState';

// An action menu: a button that opens a list of commands (WAI-ARIA menu button pattern). It is
// not a select: nothing is "selected", each item runs. `Dropdown` stays the select.

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  triggerId: string;
  align: 'left' | 'right';
  /** Item to focus when the menu opens: `last` after ArrowUp on the trigger. */
  initialItemRef: MutableRefObject<'first' | 'last'>;
};

// A disabled item is skipped by the arrows, Home, End and the typeahead.
const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';
const menuItems = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR));

const MenuContext = createContext<Ctx | null>(null);
const useCtx = (): Ctx => {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('Menu.* must be used inside <Menu>');
  return ctx;
};

// ── Root ─────────────────────────────────────────────────────────────────────

export type MenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Edge of the trigger the menu lines up with. Default `left`. */
  align?: 'left' | 'right';
  children: ReactNode;
};

const MenuRoot = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  align = 'left',
  children,
}: MenuProps) => {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Menu.open',
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initialItemRef = useRef<'first' | 'last'>('first');
  const triggerId = useId();

  return (
    <MenuContext.Provider value={{ open, setOpen, triggerRef, triggerId, align, initialItemRef }}>
      {children}
    </MenuContext.Provider>
  );
};

// ── Trigger ──────────────────────────────────────────────────────────────────

export type MenuTriggerProps = ComponentPropsWithRef<'button'>;

/** An unstyled button: give it a label or an icon with an `aria-label`, and your own classes. */
function MenuTrigger({ onClick, onKeyDown, className, ref, ...rest }: MenuTriggerProps) {
  const { open, setOpen, triggerRef, triggerId, initialItemRef } = useCtx();
  return (
    <button
      type="button"
      {...rest}
      ref={mergeRefs(triggerRef, ref)}
      id={triggerId}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        initialItemRef.current = 'first';
        setOpen(!open);
      }}
      // Menu button pattern: ArrowDown opens on the first item, ArrowUp on the last.
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
        e.preventDefault();
        initialItemRef.current = e.key === 'ArrowUp' ? 'last' : 'first';
        setOpen(true);
      }}
      className={clsx('focus-visible:focus-indicator', className)}
    />
  );
}

// ── Content (portal) ─────────────────────────────────────────────────────────

export type MenuContentProps = {
  /** Tailwind width class. Default `w-56` (224px). */
  width?: string;
  /** Name of the menu. Default: the trigger's. */
  'aria-label'?: string;
  className?: string;
  children: ReactNode;
};

// Typeahead: typing characters moves to the next item whose label starts with them.
const TYPEAHEAD_RESET_MS = 500;

const MenuContent = ({
  width = 'w-56',
  'aria-label': ariaLabel,
  className,
  children,
}: MenuContentProps) => {
  const { open, setOpen, triggerRef, triggerId, align, initialItemRef } = useCtx();
  const typed = useRef({ text: '', at: 0 });
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
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : triggerId}
      onKeyDown={(e) => {
        // Items are out of the tab order (Tab leaves the menu); arrows, Home and End move
        // between them, wrapping at both ends.
        const items = menuItems(e.currentTarget);
        if (items.length === 0) return;
        const i = items.indexOf(document.activeElement as HTMLElement);
        const n = items.length;
        let next: HTMLElement | undefined;
        if (e.key === 'ArrowDown') next = items[(i + 1) % n];
        else if (e.key === 'ArrowUp') next = items[(i - 1 + n) % n];
        else if (e.key === 'Home') next = items[0];
        else if (e.key === 'End') next = items[n - 1];
        else if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const now = Date.now();
          const text =
            (now - typed.current.at > TYPEAHEAD_RESET_MS ? '' : typed.current.text) +
            e.key.toLowerCase();
          typed.current = { text, at: now };
          // A repeated letter cycles through the items that start with it.
          const from = text.length === 1 ? i + 1 : Math.max(i, 0);
          next = [...items.slice(from), ...items.slice(0, from)].find((item) =>
            item.textContent?.trim().toLowerCase().startsWith(text)
          );
        }
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

// ── Group ────────────────────────────────────────────────────────────────────

export type MenuGroupProps = {
  /** Heading of the group. The group is named by it. */
  label?: string;
  className?: string;
  children: ReactNode;
};

const MenuGroup = ({ label, className, children }: MenuGroupProps) => {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={label ? labelId : undefined} className={className}>
      {label && (
        <div
          id={labelId}
          role="presentation"
          className="text-2xs px-4 pt-2 pb-1 font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
};

// ── Item ─────────────────────────────────────────────────────────────────────

export type MenuItemIntent = Extract<Intent, 'neutral' | 'danger'>;

export type MenuItemProps = Omit<ComponentPropsWithRef<'button'>, 'children' | 'onSelect'> & {
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** `danger` colors a destructive item (delete, sign out) red. Default `neutral`. */
  intent?: MenuItemIntent;
  /** Keyboard shortcut hint, shown at the end (e.g. "⌘D"). It is a hint, not a binding. */
  shortcut?: ReactNode;
  /** Trailing badge, before the shortcut: a `<Badge size="sm">` with a count or a tag. */
  badge?: ReactNode;
  /** Runs when the item is chosen, by click, Enter or Space. */
  onSelect?: () => void;
  /** Closes the menu once the item is chosen. Default true. */
  closeOnSelect?: boolean;
};

function MenuItem({
  icon: Icon,
  intent = 'neutral',
  shortcut,
  badge,
  onSelect,
  closeOnSelect = true,
  disabled,
  onClick,
  className,
  children,
  ref,
  ...rest
}: MenuItemProps) {
  const { setOpen } = useCtx();
  const danger = intent === 'danger';
  return (
    <button
      type="button"
      {...rest}
      ref={ref}
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        onSelect?.();
        if (closeOnSelect) setOpen(false);
      }}
      className={clsx(
        'focus-visible:focus-indicator flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors focus-visible:ring-inset',
        danger
          ? 'text-red-600 focus-visible:bg-red-50 dark:text-red-400 dark:focus-visible:bg-red-500/10'
          : 'text-gray-700 focus-visible:bg-gray-50 dark:text-gray-300 dark:focus-visible:bg-white/5',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : danger
            ? 'hover:bg-red-50 dark:hover:bg-red-500/10'
            : 'hover:bg-gray-50 dark:hover:bg-white/5',
        className
      )}
    >
      {Icon && (
        <Icon
          className={clsx(
            'h-4 w-4 shrink-0',
            danger ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'
          )}
          aria-hidden
        />
      )}
      <span className="flex-1 truncate">{children}</span>
      {badge}
      {shortcut && (
        <kbd className="text-2xs shrink-0 font-sans text-gray-500 dark:text-gray-400">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

// ── Separator ────────────────────────────────────────────────────────────────

const MenuSeparator = () => (
  <div role="separator" className="my-1 border-t border-gray-100 dark:border-gray-800" />
);

// ── Compound export ──────────────────────────────────────────────────────────

export const Menu = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Content: MenuContent,
  Group: MenuGroup,
  Item: MenuItem,
  Separator: MenuSeparator,
});
