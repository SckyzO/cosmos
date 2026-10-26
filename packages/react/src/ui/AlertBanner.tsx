import { clsx } from 'clsx';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { INTENT_ICON_SIZE, INTENT_STYLE, type Intent } from './intent';

export type AlertBannerIntent = Extract<Intent, 'success' | 'danger' | 'warning' | 'info'>;
export type AlertBannerAppearance = 'tinted' | 'accent';
export type AlertBannerBodyTone = 'intent' | 'neutral';

export type AlertBannerProps = {
  /** Color and icon of the banner. Default `info`. */
  intent?: AlertBannerIntent;
  /**
   * Surface. `tinted` (default) = a full border and the tinted background. `accent` = the same
   * background with a 4px edge on the left in the intent color and no other border.
   */
  appearance?: AlertBannerAppearance;
  /** Bold first line. The icon aligns with it instead of centering on the whole banner. */
  title?: ReactNode;
  /**
   * Color of the body under the `title`. `intent` (default) = the intent color, as the title.
   * `neutral` = gray, while the title keeps the intent color: for a long body. Without a `title`
   * the body is the only line and keeps the intent color.
   */
  bodyTone?: AlertBannerBodyTone;
  children: ReactNode;
  /** Right-side slot: a Link or a Button. */
  action?: ReactNode;
  /** Shows a close button that calls this. The host removes the banner. */
  onDismiss?: () => void;
  className?: string;
};

export const AlertBanner = ({
  intent = 'info',
  appearance = 'tinted',
  title,
  bodyTone = 'intent',
  children,
  action,
  onDismiss,
  className,
}: AlertBannerProps) => {
  const v = INTENT_STYLE[intent];
  const Icon = v.icon;
  const hasTitle = title !== undefined && title !== null && title !== false;
  const bodyText = hasTitle && bodyTone === 'neutral' ? INTENT_STYLE.neutral.text : v.text;
  return (
    <div
      role="alert"
      className={clsx(
        'flex gap-3 rounded-lg px-5 py-3.5',
        hasTitle ? 'items-start' : 'items-center',
        appearance === 'accent' ? ['border-l-4', v.edge, v.fill] : ['border', v.surface],
        className
      )}
    >
      <Icon
        className={clsx(INTENT_ICON_SIZE.inline, 'shrink-0', hasTitle && 'mt-0.5', v.iconColor)}
      />
      <div className="min-w-0 flex-1">
        {hasTitle && <p className={clsx('text-sm font-semibold', v.text)}>{title}</p>}
        <p className={clsx('text-sm', hasTitle ? 'mt-0.5 font-normal' : 'font-medium', bodyText)}>
          {children}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={onDismiss}
          className={clsx(
            'focus-visible:focus-indicator -my-1 -mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-60 transition-colors hover:bg-black/5 hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-white/10',
            v.text
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
