import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ElementType, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type DrawerSide = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<DrawerSize, string> = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[28rem]',
};

// Close-outside button offset = panel width. Used to position the X exactly
// next to the panel edge, on the backdrop.
const OUTSIDE_OFFSET_RIGHT: Record<DrawerSize, string> = {
  sm: 'right-72',
  md: 'right-96',
  lg: 'right-[28rem]',
};
const OUTSIDE_OFFSET_LEFT: Record<DrawerSize, string> = {
  sm: 'left-72',
  md: 'left-96',
  lg: 'left-[28rem]',
};

const SIDE_CLASS: Record<DrawerSide, string> = {
  left: 'left-0 border-r',
  right: 'right-0 border-l',
};

const SIDE_TRANSFORM: Record<DrawerSide, { open: string; closed: string }> = {
  left: { open: 'translate-x-0', closed: '-translate-x-full' },
  right: { open: 'translate-x-0', closed: 'translate-x-full' },
};

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  size?: DrawerSize;
  /**
   * Render a translucent overlay behind the panel that closes on click.
   * Default `true`. Set `false` for the TUI "Empty" slide-over pattern
   * where the page stays interactive behind the panel.
   */
  withBackdrop?: boolean;
  /**
   * Render the close button on the backdrop (outside the panel), opposite
   * the chosen `side`. Mirrors the TUI "With close button on outside"
   * pattern. When `true`, no close button is rendered inside `Drawer.Header`
   * — handle the X via this overlay button instead.
   * Has no effect when `withBackdrop` is `false`.
   */
  closeOutside?: boolean;
  className?: string;
  children: ReactNode;
};

const Root = ({
  open,
  onClose,
  side = 'right',
  size = 'md',
  withBackdrop = true,
  closeOutside = false,
  className,
  children,
}: DrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Portal into document.body so the drawer escapes any clipping ancestor
  // (cards, sidebars, overflow:hidden containers). Without this, calling
  // Drawer from inside e.g. a SectionCard or modal renders it in a
  // confined coordinate space and the panel never appears.
  return createPortal(
    <>
      {withBackdrop && (
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-gray-500/75 transition-opacity duration-300 dark:bg-gray-900/75',
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={onClose}
          aria-hidden
        />
      )}
      {withBackdrop && closeOutside && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close drawer"
          className={clsx(
            'fixed top-4 z-50 flex size-10 items-center justify-center rounded-full text-gray-300 transition-opacity duration-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
            // Position close button adjacent to the panel edge, on the backdrop.
            side === 'right' ? OUTSIDE_OFFSET_RIGHT[size] : OUTSIDE_OFFSET_LEFT[size],
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
        >
          <X className="size-6" aria-hidden />
        </button>
      )}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 z-50 flex flex-col border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900',
          SIDE_CLASS[side],
          SIZE_CLASS[size],
          open ? SIDE_TRANSFORM[side].open : SIDE_TRANSFORM[side].closed,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </aside>
    </>,
    document.body
  );
};

export type DrawerHeaderProps = {
  title: ReactNode;
  icon?: ElementType;
  description?: ReactNode;
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
};

const Header = ({
  title,
  icon: Icon,
  description,
  onClose,
  className,
  children,
}: DrawerHeaderProps) => (
  <div
    className={clsx(
      'flex shrink-0 items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800',
      className
    )}
  >
    <div className="flex min-w-0 items-center gap-2.5">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
      )}
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {children}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close drawer"
          className="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  </div>
);

const Body = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('flex-1 overflow-y-auto p-5', className)}>{children}</div>
);

const Footer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/50',
      className
    )}
  >
    {children}
  </div>
);

export const Drawer = Object.assign(Root, { Header, Body, Footer });
