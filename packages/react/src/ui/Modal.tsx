import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

  // Portal into document.body so the dialog escapes any clipping ancestor
  // (cards, sidebars, overflow:hidden containers).
  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-50 flex',
        isFull ? 'items-stretch justify-stretch' : 'items-center justify-center p-4'
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
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
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

export type ModalAlertLayout = 'centered' | 'horizontal';

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
  /**
   * Visual layout. `centered` (default): icon + title + buttons stacked
   * vertically and centered (TUI "Centered with single action").
   * `horizontal`: icon to the left of the title/message, with buttons in
   * a separate gray footer right-aligned (TUI "Simple with gray footer").
   */
  layout?: ModalAlertLayout;
  /**
   * In `centered` layout, render the primary action as a single
   * full-width button (TUI "Centered with single action" pattern).
   * Has no effect in `horizontal` layout.
   */
  fullWidthAction?: boolean;
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
  layout = 'centered',
  fullWidthAction = false,
}: ModalAlertProps) => {
  const Icon = ALERT_ICON[intent];
  const primaryVariant = ALERT_PRIMARY_VARIANT[intent];
  const handleConfirm = () => (onConfirm ? onConfirm() : onClose());
  const handleCancel = () => (onCancel ? onCancel() : onClose());

  if (layout === 'horizontal') {
    return (
      <Root open={open} onClose={onClose} size="lg">
        <div className="bg-white sm:flex sm:items-start sm:p-6 dark:bg-gray-900">
          <div
            className={clsx(
              'mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10',
              ALERT_CHIP[intent]
            )}
          >
            <Icon className="size-6" aria-hidden />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            {message && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 bg-gray-50 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 dark:bg-gray-800/50">
          {cancelLabel && (
            <Button variant="secondary" disabled={loading} onClick={handleCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={primaryVariant}
            loading={loading}
            disabled={loading}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </Root>
    );
  }

  return (
    <Root open={open} onClose={onClose} size="sm">
      <div className="p-6 text-center">
        <div
          className={clsx(
            'mx-auto flex size-12 items-center justify-center rounded-full',
            ALERT_CHIP[intent]
          )}
        >
          <Icon className="size-6" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        {message && <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</div>}
        <div
          className={clsx(
            'mt-5',
            fullWidthAction ? 'flex flex-col gap-2' : 'flex items-center justify-center gap-2'
          )}
        >
          {cancelLabel && (
            <Button
              variant="secondary"
              disabled={loading}
              onClick={handleCancel}
              className={clsx(fullWidthAction && 'w-full')}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={primaryVariant}
            loading={loading}
            disabled={loading}
            onClick={handleConfirm}
            className={clsx(fullWidthAction && 'w-full')}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Root>
  );
};

export const Modal = Object.assign(Root, { Header, Body, Footer, Alert });
