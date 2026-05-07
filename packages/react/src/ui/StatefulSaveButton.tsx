import { clsx } from 'clsx';
import { AlertCircle, Check, Loader2, Save } from 'lucide-react';
import type { ElementType } from 'react';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type StateConfig = {
  label: string;
  icon: ElementType;
  cls: string;
  spin?: boolean;
};

const STATE_CONFIG: Record<SaveState, StateConfig> = {
  idle: {
    label: 'Save Changes',
    icon: Save,
    cls: 'bg-brand-500 hover:bg-brand-600 text-white',
  },
  dirty: {
    label: 'Save Changes',
    icon: Save,
    cls: 'bg-brand-500 hover:bg-brand-600 text-white animate-pulse',
  },
  saving: {
    label: 'Saving…',
    icon: Loader2,
    cls: 'bg-brand-500 text-white opacity-70 cursor-not-allowed',
    spin: true,
  },
  saved: {
    label: 'Saved',
    icon: Check,
    cls: 'bg-green-500 text-white cursor-default',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    cls: 'bg-red-500 text-white',
  },
};

export type StatefulSaveButtonProps = {
  state: SaveState;
  onClick: () => void;
  /** Override label for `idle` / `dirty` states. */
  label?: string;
  /** Override label for `saved` state. */
  savedLabel?: string;
  className?: string;
};

/**
 * StatefulSaveButton — save button with 5 visual states cycling
 * idle → dirty → saving → saved → idle (or error on failure).
 */
export const StatefulSaveButton = ({
  state,
  onClick,
  label,
  savedLabel,
  className,
}: StatefulSaveButtonProps) => {
  const cfg = { ...STATE_CONFIG[state] };
  if (label && (state === 'idle' || state === 'dirty')) cfg.label = label;
  if (savedLabel && state === 'saved') cfg.label = savedLabel;
  const Icon = cfg.icon;
  const inactive = state === 'saving' || state === 'saved';

  return (
    <button
      type="button"
      onClick={inactive ? undefined : onClick}
      disabled={inactive}
      className={clsx(
        'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all disabled:cursor-not-allowed',
        cfg.cls,
        className
      )}
    >
      <Icon className={clsx('h-4 w-4 shrink-0', cfg.spin && 'animate-spin')} />
      {cfg.label}
    </button>
  );
};
