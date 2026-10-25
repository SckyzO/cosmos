import { clsx } from 'clsx';
import { Check, Save } from 'lucide-react';
import type { ElementType, Ref } from 'react';
import { Button, type ButtonProps } from './Button';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type StateConfig = {
  label: string;
  icon?: ElementType;
  intent?: ButtonProps['intent'];
  loading?: boolean;
  cls?: string;
};

const STATE_CONFIG: Record<SaveState, StateConfig> = {
  idle: { label: 'Save Changes', icon: Save },
  dirty: { label: 'Save Changes', icon: Save, cls: 'animate-pulse' },
  saving: { label: 'Saving…', loading: true },
  // Dark text on green: white on green-500 is about 2.3:1, under the 4.5:1 of
  // text. The `!` modifiers beat Button's own `disabled:` brand background,
  // since a saved button is disabled.
  saved: {
    label: 'Saved',
    icon: Check,
    cls: 'bg-green-500! text-gray-900! disabled:cursor-default!',
  },
  error: { label: 'Error', intent: 'danger' },
};

export type StatefulSaveButtonProps = {
  state: SaveState;
  onClick: () => void;
  /** Override label for `idle` / `dirty` states. */
  label?: string;
  /** Override label for `saved` state. */
  savedLabel?: string;
  className?: string;
  /** Ref to the `<button>`. */
  ref?: Ref<HTMLButtonElement>;
};

/**
 * StatefulSaveButton — a `Button` with 5 visual states cycling
 * idle → dirty → saving → saved → idle (or error on failure).
 */
export const StatefulSaveButton = ({
  state,
  onClick,
  label,
  savedLabel,
  className,
  ref,
}: StatefulSaveButtonProps) => {
  const cfg = { ...STATE_CONFIG[state] };
  if (label && (state === 'idle' || state === 'dirty')) cfg.label = label;
  if (savedLabel && state === 'saved') cfg.label = savedLabel;
  const inactive = state === 'saving' || state === 'saved';

  return (
    <Button
      ref={ref}
      intent={cfg.intent}
      icon={cfg.icon}
      loading={cfg.loading}
      disabled={state === 'saved'}
      onClick={inactive ? undefined : onClick}
      className={clsx(cfg.cls, className)}
    >
      {cfg.label}
    </Button>
  );
};
