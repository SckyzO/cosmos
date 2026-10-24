import { clsx } from 'clsx';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { ElementType, ReactNode } from 'react';
import type { Intent } from './intent';

export type AlertBannerIntent = Extract<Intent, 'success' | 'danger' | 'warning' | 'info'>;

type IntentConfig = {
  border: string;
  bg: string;
  icon: ElementType;
  iconCls: string;
  text: string;
};

const INTENT_CONFIG: Record<AlertBannerIntent, IntentConfig> = {
  success: {
    border: 'border-green-200 dark:border-green-500/20',
    bg: 'bg-green-50 dark:bg-green-500/10',
    icon: CheckCircle,
    iconCls: 'text-green-500',
    text: 'text-green-700 dark:text-green-400',
  },
  danger: {
    border: 'border-red-200 dark:border-red-500/20',
    bg: 'bg-red-50 dark:bg-red-500/10',
    icon: AlertCircle,
    iconCls: 'text-red-500',
    text: 'text-red-700 dark:text-red-400',
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-500/20',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    icon: AlertTriangle,
    iconCls: 'text-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    border: 'border-blue-200 dark:border-blue-500/20',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    icon: Info,
    iconCls: 'text-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
  },
};

export type AlertBannerProps = {
  /** Color and icon of the banner. Default `info`. */
  intent?: AlertBannerIntent;
  children: ReactNode;
  className?: string;
};

export const AlertBanner = ({ intent = 'info', children, className }: AlertBannerProps) => {
  const v = INTENT_CONFIG[intent];
  const Icon = v.icon;
  return (
    <div
      role="alert"
      className={clsx(
        'flex items-center gap-3 rounded-2xl border px-5 py-3.5',
        v.border,
        v.bg,
        className
      )}
    >
      <Icon className={clsx('h-4 w-4 shrink-0', v.iconCls)} />
      <p className={clsx('text-sm font-medium', v.text)}>{children}</p>
    </div>
  );
};
