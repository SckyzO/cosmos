import { clsx } from 'clsx';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'h-full w-full max-w-none rounded-none',
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

  const isFull = size === 'full';

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex',
        isFull ? 'items-stretch justify-stretch' : 'items-center justify-center p-4',
      )}
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
          'relative w-full overflow-hidden border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900',
          isFull ? '' : 'rounded-2xl',
          SIZE_CLASS[size],
          className,
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
      className,
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
      className,
    )}
  >
    {children}
  </div>
);

// ── Alert (convenience) ──────────────────────────────────────────────────────

export type ModalAlertIntent = 'info' | 'warning' | 'danger' | 'success';

const ALERT_ICON: Record<ModalAlertIntent, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
  success: CheckCircle2,
};

const ALERT_CHIP: Record<ModalAlertIntent, string> = {
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  success: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400',
};

const ALERT_PRIMARY_VARIANT: Record<ModalAlertIntent, ButtonVariant> = {
  info: 'primary',
  warning: 'primary',
  danger: 'danger',
  success: 'primary',
};

export type ModalAlertProps = {
  open: boolean;
  onClose: () => void;
  intent?: ModalAlertIntent;
  title: string;
  message?: ReactNode;
  /** Primary action label. Default `OK`. */
  confirmLabel?: string;
  /** Cancel action label. When omitted, no cancel button is rendered. */
  cancelLabel?: string;
  /** Called when the primary action is clicked. Defaults to `onClose`. */
  onConfirm?: () => void;
  /** Called when Cancel is clicked. Defaults to `onClose`. */
  onCancel?: () => void;
  /** When true, the primary button shows a spinner and both buttons are disabled. */
  loading?: boolean;
};

const Alert = ({
  open,
  onClose,
  intent = 'info',
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
}: ModalAlertProps) => {
  const Icon = ALERT_ICON[intent];
  return (
    <Root open={open} onClose={onClose} size="sm">
      <div className="p-6 text-center">
        <div
          className={clsx(
            'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
            ALERT_CHIP[intent],
          )}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {message && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</div>
        )}
        <div className="mt-5 flex items-center justify-center gap-2">
          {cancelLabel && (
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => (onCancel ? onCancel() : onClose())}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={ALERT_PRIMARY_VARIANT[intent]}
            loading={loading}
            disabled={loading}
            onClick={() => (onConfirm ? onConfirm() : onClose())}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Root>
  );
};

export const Modal = Object.assign(Root, { Header, Body, Footer, Alert });
