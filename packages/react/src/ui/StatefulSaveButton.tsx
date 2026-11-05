import { clsx } from 'clsx';
import { Check, Save } from 'lucide-react';
import type { ElementType, Ref } from 'react';
import { useLabels } from '../labels/labelsContext';
import { Button, type ButtonProps } from './Button';
import { STATEFUL_SAVE_BUTTON_LABELS, type StatefulSaveButtonLabels } from './labels';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type StateConfig = {
  /** The key of `StatefulSaveButtonLabels` the state reads. */
  label: keyof StatefulSaveButtonLabels;
  icon?: ElementType;
  intent?: ButtonProps['intent'];
  loading?: boolean;
  cls?: string;
};

const STATE_CONFIG: Record<SaveState, StateConfig> = {
  idle: { label: 'save', icon: Save },
  dirty: { label: 'save', icon: Save, cls: 'animate-pulse motion-reduce:animate-none' },
  saving: { label: 'saving', loading: true },
  // The `success` intent carries the dark text on green (white on green-500 is about 2.3:1).
  saved: { label: 'saved', icon: Check, intent: 'success' },
  // What to do next, not the name of the state: the save failed, the click saves again.
  error: { label: 'retry', intent: 'danger' },
};

export type StatefulSaveButtonProps = {
  state: SaveState;
  onClick: () => void;
  /** Text of the `idle` and `dirty` states. Default `labels.save`. */
  label?: string;
  /** Text of the `saved` state. Default `labels.saved`. */
  savedLabel?: string;
  /** The texts it writes, over `LabelsProvider`'s `statefulSaveButton` and the English defaults. */
  labels?: Partial<StatefulSaveButtonLabels>;
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
  labels: ownLabels,
  className,
  ref,
}: StatefulSaveButtonProps) => {
  const labels = useLabels('statefulSaveButton', STATEFUL_SAVE_BUTTON_LABELS, ownLabels);
  const cfg = STATE_CONFIG[state];
  let text = labels[cfg.label];
  if (label && (state === 'idle' || state === 'dirty')) text = label;
  if (savedLabel && state === 'saved') text = savedLabel;
  const inactive = state === 'saving' || state === 'saved';

  return (
    <Button
      ref={ref}
      intent={cfg.intent}
      icon={cfg.icon}
      loading={cfg.loading}
      // `saved` ignores clicks without the native `disabled`, which would dim it.
      aria-disabled={state === 'saved' || undefined}
      onClick={inactive ? undefined : () => onClick()}
      className={clsx(cfg.cls, className)}
    >
      {text}
    </Button>
  );
};
