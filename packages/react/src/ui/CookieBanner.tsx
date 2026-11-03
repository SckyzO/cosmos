import { clsx } from 'clsx';
import { Cookie } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { useExitTransition } from '../hooks/useExitTransition';
import { Button } from './Button';

export type CookieBannerPosition = 'bottom' | 'top' | 'floating';

// Where the banner waits out of sight: past the edge it is fixed to, along the block axis. It rises
// (or drops) in from there as it fades in, and leaves the same way. `starting:` gives it the same
// place on its first frame, so it comes in when it mounts, not only when it is shown again.
const AWAY: Record<CookieBannerPosition, { rest: string; first: string }> = {
  bottom: { rest: 'translate-y-full', first: 'starting:translate-y-full' },
  top: { rest: '-translate-y-full', first: 'starting:-translate-y-full' },
  // It floats 1rem off the edge: the whole of that gap goes too.
  floating: {
    rest: 'translate-y-[calc(100%_+_1rem)]',
    first: 'starting:translate-y-[calc(100%_+_1rem)]',
  },
};

export type CookieBannerProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  position?: CookieBannerPosition;
  title?: string;
  /**
   * Accessible name of the dialog, for a banner with no `title` to name it. With a `title`, the
   * dialog is named after it and this is unnecessary.
   */
  ariaLabel?: string;
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
  ariaLabel,
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
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'CookieBanner.open',
  });

  // Once closed, the banner stays until it has left; at once when nothing animates (durations at 0).
  const ref = useRef<HTMLDivElement>(null);
  const present = useExitTransition(open, ref);

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

  if (!present) return null;

  const positionClass: Record<CookieBannerPosition, string> = {
    bottom: 'fixed inset-x-0 bottom-0 border-t',
    top: 'fixed inset-x-0 top-0 border-b',
    floating: 'fixed inset-x-0 bottom-4 mx-auto max-w-3xl rounded-2xl border shadow-xl',
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={ariaLabel ?? (title || undefined)}
      // Leaving, it is out of the way: no focus, no clicks, and out of the accessibility tree.
      inert={!open}
      className={clsx(
        'z-50 border-gray-200 bg-white p-4 transition-[opacity,translate] dark:border-gray-700 dark:bg-gray-900',
        positionClass[position],
        // In over the base duration easing out, out over the shorter exit easing in.
        open
          ? clsx(
              'translate-none opacity-100 duration-(--cosmos-motion-base) ease-(--cosmos-ease-out) starting:opacity-0',
              AWAY[position].first
            )
          : clsx(
              'pointer-events-none opacity-0 duration-(--cosmos-motion-exit-lg) ease-(--cosmos-ease-in)',
              AWAY[position].rest
            ),
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {showIcon && <Cookie className="text-brand-500 mt-0.5 h-5 w-5 shrink-0" aria-hidden />}
          <div className="min-w-0 flex-1">
            {title && (
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                <bdi>{title}</bdi>
              </p>
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
