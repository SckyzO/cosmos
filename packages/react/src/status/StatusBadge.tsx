import { clsx } from 'clsx';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { BadgeAppearance, BadgeShape } from '../ui/Badge';
import { type HealthStatus, STATUS_PILL } from './types';

export type StatusBadgeProps = {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  /** Corners. `pill` (default) is fully rounded; `rounded` is a rounded rectangle, as on `Badge`. */
  shape?: BadgeShape;
  /**
   * `light` (default) is the filled pill. `outline` is a lighter tint with a border of the same
   * hue: the badge for a status that is the subject of a page or a card.
   */
  appearance?: Extract<BadgeAppearance, 'light' | 'outline'>;
  /**
   * Draws the icon of the status before the label (a check, a warning triangle, a cross, a
   * question mark, an info mark), so the status is not carried by color alone. The icon is
   * decorative: the label says the status.
   */
  icon?: boolean;
  /**
   * Text of the pill, default `status`. It sits in a `<bdi>`: "12 OK" keeps its order in a
   * right-to-left page.
   */
  label?: string;
  className?: string;
};

const SIZE_CLASS = {
  sm: 'px-1.5 py-0.5 text-3xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
} as const;

const SHAPE_CLASS: Record<BadgeShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded-md',
};

const ICON_CLASS = {
  sm: 'size-3',
  md: 'size-3.5',
  lg: 'size-4',
} as const;

const ICON_GAP = {
  sm: 'gap-1',
  md: 'gap-1.5',
  lg: 'gap-2',
} as const;

const STATUS_ICON: Record<HealthStatus, LucideIcon> = {
  OK: CheckCircle,
  WARN: AlertTriangle,
  CRIT: XCircle,
  UNKNOWN: HelpCircle,
  INFO: Info,
};

/** Tint, border and text per status for `appearance="outline"`: the same hues as `STATUS_PILL`. */
const STATUS_OUTLINE: Record<HealthStatus, string> = {
  OK: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400',
  WARN: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400',
  CRIT: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400',
  UNKNOWN:
    'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
  INFO: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400',
};

/**
 * StatusBadge — status badge (OK / WARN / CRIT / UNKNOWN / INFO).
 *
 * Three sizes: sm (inline in tables), md (default), lg (prominent display). A filled pill by
 * default; `appearance="outline"`, `shape="rounded"` and `icon` give the bordered badge with an
 * icon, for a status that is the subject of a page.
 */
export const StatusBadge = ({
  status,
  size = 'md',
  shape = 'pill',
  appearance = 'light',
  icon = false,
  label,
  className,
}: StatusBadgeProps) => {
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold',
        SHAPE_CLASS[shape],
        SIZE_CLASS[size],
        appearance === 'outline' ? clsx('border', STATUS_OUTLINE[status]) : STATUS_PILL[status],
        icon && ICON_GAP[size],
        className
      )}
    >
      {icon && <Icon className={clsx('shrink-0', ICON_CLASS[size])} aria-hidden />}
      <bdi>{label ?? status}</bdi>
    </span>
  );
};
