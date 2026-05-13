import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from './Avatar';

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  triggerRect: DOMRect | null;
  refreshRect: () => void;
  align: 'left' | 'right';
};

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
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const refreshRect = useCallback(() => {
    if (triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect());
  }, []);

  const setOpen = useCallback(
    (v: boolean) => {
      if (v) refreshRect();
      if (!isControlled) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange, refreshRect],
  );

  useEffect(() => {
    if (!open) return;
    const handler = () => refreshRect();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [open, refreshRect]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  return (
    <UserMenuContext.Provider value={{ open, setOpen, triggerRef, triggerRect, refreshRect, align }}>
      {children}
    </UserMenuContext.Provider>
  );
};

// ── Trigger ──────────────────────────────────────────────────────────────────

export type UserMenuTriggerProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'children'
> & {
  /** Display name shown next to the avatar. Also used for initials fallback. */
  name: string;
  /** Avatar image URL. Falls back to initials of `name`. */
  avatarSrc?: string;
  /** Hide the textual name (icon-only trigger). Useful on small viewports. */
  hideName?: boolean;
};

const UserMenuTrigger = forwardRef<HTMLButtonElement, UserMenuTriggerProps>(
  function UserMenuTrigger(
    { name, avatarSrc, hideName = false, className, ...rest },
    forwardedRef,
  ) {
    const { open, setOpen, triggerRef, refreshRect } = useCtx();
    const setRef = (node: HTMLButtonElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };
    useEffect(() => {
      if (open) refreshRect();
    }, [open, refreshRect]);
    return (
      <button
        ref={setRef}
        type="button"
        aria-label={`User menu for ${name}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex items-center gap-2 rounded-lg border border-gray-200 py-1.5 pr-3 pl-2 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-white/5',
          className,
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
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
    );
  },
);

// ── Content (portal) ─────────────────────────────────────────────────────────

export type UserMenuContentProps = {
  /** Tailwind width class. Default `w-56` (224px). */
  width?: string;
  className?: string;
  children: ReactNode;
};

const UserMenuContent = ({ width = 'w-56', className, children }: UserMenuContentProps) => {
  const { open, setOpen, triggerRect, align } = useCtx();
  if (!open || !triggerRect) return null;
  const top = triggerRect.bottom + 8;
  const positionStyle =
    align === 'right'
      ? { top, right: window.innerWidth - triggerRect.right }
      : { top, left: triggerRect.left };
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        role="menu"
        aria-label="User menu"
        style={positionStyle}
        className={clsx(
          'fixed z-[9999] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900',
          width,
          className,
        )}
      >
        {children}
      </div>
    </>,
    document.body,
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
      className,
    )}
  >
    <Avatar src={avatarSrc} name={name} size="md" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
      {email && (
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{email}</p>
      )}
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

export type UserMenuItemVariant = 'default' | 'danger';

export type UserMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ComponentType<{ className?: string }>;
  variant?: UserMenuItemVariant;
  /** Auto-close the menu after click. Default true. */
  closeOnClick?: boolean;
};

const UserMenuItem = forwardRef<HTMLButtonElement, UserMenuItemProps>(function UserMenuItem(
  { icon: Icon, variant = 'default', closeOnClick = true, onClick, className, children, ...rest },
  ref,
) {
  const { setOpen } = useCtx();
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        if (closeOnClick && !e.defaultPrevented) setOpen(false);
      }}
      className={clsx(
        'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
        variant === 'danger'
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5',
        className,
      )}
      {...rest}
    >
      {Icon && (
        <Icon
          className={clsx(
            'h-4 w-4 shrink-0',
            variant === 'danger'
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-400 dark:text-gray-500',
          )}
          aria-hidden
        />
      )}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
});

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
