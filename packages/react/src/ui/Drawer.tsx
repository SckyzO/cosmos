import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ElementType, ReactNode } from 'react';

export type DrawerSide = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<DrawerSize, string> = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[28rem]',
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
  className?: string;
  children: ReactNode;
};

const Root = ({ open, onClose, side = 'right', size = 'md', className, children }: DrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />
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
    </>
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
