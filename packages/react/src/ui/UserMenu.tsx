import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { ComponentType, ReactNode, ComponentPropsWithRef } from 'react';
import { Avatar, type AvatarProps } from './Avatar';
import { Menu, type MenuItemIntent } from './Menu';

// The avatar always sits next to the user's name, in the trigger and in the header, so it is
// hidden from assistive technology: it would add a second image to read, with the name as its
// alt text (`image-redundant-alt`). In the header it is also not a child a `menu` may have.
const DecorativeAvatar = (props: AvatarProps) => (
  <span aria-hidden className="flex shrink-0">
    <Avatar {...props} />
  </span>
);

// ── Root ─────────────────────────────────────────────────────────────────────

export type UserMenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Side of the trigger the menu anchors to. Default `right`. */
  align?: 'left' | 'right';
  children: ReactNode;
};

const UserMenuRoot = ({ align = 'right', ...rest }: UserMenuProps) => (
  <Menu align={align} {...rest} />
);

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
  ...rest
}: UserMenuTriggerProps) {
  return (
    <Menu.Trigger
      className={clsx(
        'group py-row-6 flex items-center gap-2 rounded-lg border border-gray-200 pr-3 pl-2 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-white/5',
        className
      )}
      {...rest}
    >
      <DecorativeAvatar src={avatarSrc} name={name} size="sm" />
      {/* Named by its content, "User menu for <name>", not by an `aria-label`: the visible text,
          the initials of an avatar with no image included, is then part of the name. */}
      <span className="sr-only">User menu for </span>
      <span
        className={clsx(
          hideName ? 'sr-only' : 'text-sm font-medium text-gray-700 dark:text-gray-200'
        )}
      >
        {name}
      </span>
      <ChevronDown
        className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-aria-expanded:rotate-180"
        aria-hidden
      />
    </Menu.Trigger>
  );
}

// ── Content (portal) ─────────────────────────────────────────────────────────

export type UserMenuContentProps = {
  /** Tailwind width class. Default `w-56` (224px). */
  width?: string;
  className?: string;
  children: ReactNode;
};

const UserMenuContent = (props: UserMenuContentProps) => (
  <Menu.Content aria-label="User menu" {...props} />
);

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
    <DecorativeAvatar src={avatarSrc} name={name} size="md" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
      {email && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{email}</p>}
    </div>
  </div>
);

// ── Items (vertical group wrapper) ───────────────────────────────────────────

const UserMenuItems = ({ children }: { children: ReactNode }) => (
  <Menu.Group className="py-1">{children}</Menu.Group>
);

// ── Item ─────────────────────────────────────────────────────────────────────

export type UserMenuItemIntent = MenuItemIntent;

export type UserMenuItemProps = Omit<ComponentPropsWithRef<'button'>, 'children' | 'onSelect'> & {
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** `danger` colors a destructive item (sign out, delete) red. Default `neutral`. */
  intent?: UserMenuItemIntent;
  /** Auto-close the menu after click. Default true. */
  closeOnClick?: boolean;
};

function UserMenuItem({ closeOnClick = true, ...rest }: UserMenuItemProps) {
  return <Menu.Item closeOnSelect={closeOnClick} {...rest} />;
}

// ── Separator ────────────────────────────────────────────────────────────────

const UserMenuSeparator = () => <Menu.Separator />;

// ── Compound export ──────────────────────────────────────────────────────────

export const UserMenu = Object.assign(UserMenuRoot, {
  Trigger: UserMenuTrigger,
  Content: UserMenuContent,
  Header: UserMenuHeader,
  Items: UserMenuItems,
  Item: UserMenuItem,
  Separator: UserMenuSeparator,
});
