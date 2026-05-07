import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

export type DrawerSide = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg';

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  size?: DrawerSize;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

const SIZE_CLASS: Record<DrawerSize, string> = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[28rem]',
};

const SIDE_CLASS: Record<DrawerSide, string> = {
  left: 'left-0',
  right: 'right-0',
};

export const Drawer = ({
  open,
  onClose,
  side = 'right',
  size = 'md',
  title,
  children,
  footer,
  className,
}: DrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={clsx(
          'absolute top-0 bottom-0 flex flex-col border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900',
          SIDE_CLASS[side],
          SIZE_CLASS[size],
          side === 'left' ? 'border-r' : 'border-l',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/50">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
};
