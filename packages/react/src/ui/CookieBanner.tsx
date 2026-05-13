import { clsx } from 'clsx';
import { Cookie } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from './Button';

export type CookieBannerPosition = 'bottom' | 'top' | 'floating';

export type CookieBannerProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  position?: CookieBannerPosition;
  title?: string;
  message: ReactNode;
  /** Render the Settings button. Hidden if no handler. */
  onSettings?: () => void;
  settingsLabel?: string;
  /** Render the Deny All button. Hidden if no handler. */
  onDeny?: () => void;
  denyLabel?: string;
  /** Required Accept handler — primary action. */
  onAccept: () => void;
  acceptLabel?: string;
  /** Show the Cookie icon next to the title. Default `true`. */
  showIcon?: boolean;
  className?: string;
};

export const CookieBanner = ({
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  position = 'bottom',
  title = 'We use cookies',
  message,
  onSettings,
  settingsLabel = 'Cookie settings',
  onDeny,
  denyLabel = 'Deny all',
  onAccept,
  acceptLabel = 'Accept all',
  showIcon = true,
  className,
}: CookieBannerProps) => {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? openProp : internalOpen;

  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const handleAccept = () => {
    onAccept();
    setOpen(false);
  };
  const handleDeny = () => {
    onDeny?.();
    setOpen(false);
  };
  const handleSettings = () => {
    onSettings?.();
    // Settings doesn't auto-close — typically opens a sub-modal.
  };

  if (!open) return null;

  const positionClass: Record<CookieBannerPosition, string> = {
    bottom: 'fixed inset-x-0 bottom-0 border-t',
    top: 'fixed inset-x-0 top-0 border-b',
    floating:
      'fixed inset-x-0 bottom-4 mx-auto max-w-3xl rounded-2xl border shadow-xl',
  };

  return (
    <div
      role="dialog"
      aria-label={title}
      className={clsx(
        'z-50 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900',
        positionClass[position],
        className,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {showIcon && (
            <Cookie
              className="text-brand-500 mt-0.5 h-5 w-5 shrink-0"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            {title && (
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
            )}
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{message}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onSettings && (
            <Button variant="ghost" size="sm" onClick={handleSettings}>
              {settingsLabel}
            </Button>
          )}
          {onDeny && (
            <Button variant="secondary" size="sm" onClick={handleDeny}>
              {denyLabel}
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleAccept}>
            {acceptLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
