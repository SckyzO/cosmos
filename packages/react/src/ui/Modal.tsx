import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  className?: string;
  children: ReactNode;
};

const Root = ({ open, onClose, size = 'md', className, children }: ModalProps) => {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={clsx(
          'relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900',
          SIZE_CLASS[size],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export type ModalHeaderProps = {
  title?: ReactNode;
  description?: ReactNode;
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
};

const Header = ({ title, description, onClose, className, children }: ModalHeaderProps) => (
  <div
    className={clsx(
      'flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800',
      className
    )}
  >
    <div className="min-w-0 flex-1">
      {title && (
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      )}
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {children}
    </div>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        aria-label="Close modal"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);

const Body = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('px-5 py-4', className)}>{children}</div>
);

const Footer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/50',
      className
    )}
  >
    {children}
  </div>
);

export const Modal = Object.assign(Root, { Header, Body, Footer });
