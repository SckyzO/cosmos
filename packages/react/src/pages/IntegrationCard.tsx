import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Badge } from '../ui/Badge';
import { Button, type ButtonVariant } from '../ui/Button';

export type IntegrationStatus = 'connected' | 'available' | 'error' | 'pending';

export type IntegrationCardProps = {
  /** SVG element or `<img>` for the provider logo. Rendered inside a 48 px square. */
  logo: ReactNode;
  name: string;
  description?: string;
  status?: IntegrationStatus;
  /** Optional small label rendered above the name (e.g. "Communication"). */
  category?: string;
  /** Primary action button label. */
  actionLabel?: string;
  actionVariant?: ButtonVariant;
  onAction?: () => void;
  /** Secondary action button label. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  loading?: boolean;
  className?: string;
};

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: 'Connected',
  available: 'Available',
  error: 'Error',
  pending: 'Pending',
};

const STATUS_VARIANT: Record<IntegrationStatus, 'success' | 'neutral' | 'danger' | 'warning'> = {
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
  actionLabel,
  actionVariant = 'primary',
  onAction,
  secondaryLabel,
  onSecondary,
  loading = false,
  className,
}: IntegrationCardProps) => (
  <div
    className={clsx(
      'flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
      className,
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-900 [&_svg]:h-7 [&_svg]:w-7 [&_img]:h-full [&_img]:w-full [&_img]:object-contain">
        {logo}
      </div>
      {status && (
        <Badge variant={STATUS_VARIANT[status]} appearance="light">
          {STATUS_LABEL[status]}
        </Badge>
      )}
    </div>
    <div className="mt-4 min-w-0 flex-1">
      {category && (
        <p className="font-mono text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {category}
        </p>
      )}
      <h3 className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
        {name}
      </h3>
      {description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
    {(actionLabel || secondaryLabel) && (
      <div className="mt-4 flex items-center justify-end gap-2">
        {secondaryLabel && (
          <Button variant="ghost" size="sm" onClick={onSecondary} disabled={loading}>
            {secondaryLabel}
          </Button>
        )}
        {actionLabel && (
          <Button
            variant={actionVariant}
            size="sm"
            onClick={onAction}
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
