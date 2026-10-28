import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useState, type ElementType, type ReactNode } from 'react';
import { INTENT_ICON_SIZE, INTENT_STYLE, type Intent } from './intent';

export type AnnouncementBarIntent = Extract<
  Intent,
  'info' | 'success' | 'warning' | 'danger' | 'brand'
>;

export type AnnouncementBarProps = {
  intent?: AnnouncementBarIntent;
  /** Override the default icon for the intent. Pass `null` to hide. */
  icon?: ElementType | null;
  message: ReactNode;
  /** Slot at the end of the line — a Link, Button, etc. */
  action?: ReactNode;
  /** Render a close button. */
  dismissible?: boolean;
  /** Called when the user clicks close. */
  onDismiss?: () => void;
  /** Stick to the top of the viewport. */
  sticky?: boolean;
  className?: string;
};

// The brand bar is a solid fill, louder than the tinted surface of the other intents.
const BRAND_SOLID =
  'bg-brand-500 text-white border-brand-600 dark:bg-brand-600 dark:border-brand-500';

export const AnnouncementBar = ({
  intent = 'info',
  icon,
  message,
  action,
  dismissible = false,
  onDismiss,
  sticky = false,
  className,
}: AnnouncementBarProps) => {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const Icon = icon === null ? null : (icon ?? INTENT_STYLE[intent].icon);
  return (
    <div
      role="status"
      className={clsx(
        'flex w-full items-center gap-3 border-b px-4 py-2 text-sm',
        intent === 'brand'
          ? BRAND_SOLID
          : clsx(INTENT_STYLE[intent].surface, INTENT_STYLE[intent].text),
        sticky && 'sticky top-0 z-40',
        className
      )}
    >
      {Icon && (
        <Icon
          className={clsx(
            INTENT_ICON_SIZE.inline,
            'shrink-0',
            intent === 'brand' ? 'text-white' : INTENT_STYLE[intent].iconColor
          )}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1">{message}</span>
      {action && <span className="shrink-0">{action}</span>}
      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            setOpen(false);
            onDismiss?.();
          }}
          className={clsx(
            'h-ctrl-28 w-ctrl-28 flex shrink-0 items-center justify-center rounded-md transition-colors',
            // The brand bar is brand-500: a brand-500 ring would vanish on it.
            intent === 'brand'
              ? 'focus-visible:focus-indicator-on-accent text-white/80 hover:bg-white/15 hover:text-white'
              : 'focus-visible:focus-indicator text-current opacity-60 hover:bg-black/5 hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-white/10'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
