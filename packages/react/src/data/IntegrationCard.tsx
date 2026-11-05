import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useLabels } from '../labels/labelsContext';
import { Badge } from '../ui/Badge';
import type { Intent } from '../ui/intent';
import { Button, type ButtonIntent, type ButtonVariant } from '../ui/Button';
import { INTEGRATION_CARD_LABELS, type IntegrationCardLabels } from './labels';

export type IntegrationStatus = 'connected' | 'available' | 'error' | 'pending';

export type IntegrationCardProps = {
  /** SVG element or `<img>` for the provider logo. Rendered inside a 48 px square. */
  logo: ReactNode;
  name: string;
  description?: string;
  status?: IntegrationStatus;
  /** Optional small label rendered above the name (e.g. "Communication"). */
  category?: string;
  /** Extra line under the description (e.g. "Last synced 2 min ago", a version, a count). */
  meta?: ReactNode;
  /** Primary action button label. */
  actionLabel?: string;
  /** Emphasis of the primary action button. Default `primary`. */
  actionVariant?: ButtonVariant;
  /** Meaning of the primary action button: `danger` for a disconnect. Default `brand`. */
  actionIntent?: ButtonIntent;
  onAction?: () => void;
  /** Secondary action button label. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  loading?: boolean;
  /** The texts it writes (the status badge), over `LabelsProvider`'s `integrationCard` and English. */
  labels?: Partial<IntegrationCardLabels>;
  className?: string;
};

const STATUS_INTENT: Record<IntegrationStatus, Intent> = {
  connected: 'success',
  available: 'neutral',
  error: 'danger',
  pending: 'warning',
};

export const IntegrationCard = ({
  logo,
  name,
  description,
  status,
  category,
  meta,
  actionLabel,
  actionVariant = 'primary',
  actionIntent = 'brand',
  onAction,
  secondaryLabel,
  onSecondary,
  loading = false,
  labels: ownLabels,
  className,
}: IntegrationCardProps) => {
  const labels = useLabels('integrationCard', INTEGRATION_CARD_LABELS, ownLabels);
  return (
    <div
      className={clsx(
        'flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-900 [&_img]:h-full [&_img]:w-full [&_img]:object-contain [&_svg]:h-7 [&_svg]:w-7">
          {logo}
        </div>
        {status && (
          <Badge intent={STATUS_INTENT[status]} appearance="light">
            {labels[status]}
          </Badge>
        )}
      </div>
      <div className="mt-4 min-w-0 flex-1">
        {category && (
          <p className="text-2xs font-mono tracking-wide text-gray-500 uppercase dark:text-gray-400">
            {category}
          </p>
        )}
        <h3 className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
          <bdi>{name}</bdi>
        </h3>
        {description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        {meta && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{meta}</div>}
      </div>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-4 flex items-center justify-end gap-2">
          {secondaryLabel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSecondary && (() => onSecondary())}
              disabled={loading}
            >
              {secondaryLabel}
            </Button>
          )}
          {actionLabel && (
            <Button
              variant={actionVariant}
              intent={actionIntent}
              size="sm"
              onClick={onAction && (() => onAction())}
              loading={loading}
              disabled={loading}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
