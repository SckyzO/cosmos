import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useLabels } from '../labels/labelsContext';
import { TooltipHelp } from '../ui/Tooltip';
import { Input, type InputProps } from './Input';
import { PASSWORD_INPUT_LABELS, type PasswordInputLabels } from './labels';

export type PasswordInputProps = Omit<InputProps, 'type' | 'icon' | 'endSlot' | 'labelTrailing'> & {
  /** Tooltip text shown next to the label (uses TooltipHelp). */
  helpText?: string;
  /** Override the visibility-toggle button labels. Defaults `labels.show` and `labels.hide`. */
  showLabel?: string;
  hideLabel?: string;
  /** The texts it writes, over `LabelsProvider`'s `passwordInput` and the English defaults. */
  labels?: Partial<PasswordInputLabels>;
};

export function PasswordInput({
  helpText,
  showLabel,
  hideLabel,
  labels: ownLabels,
  autoComplete = 'current-password',
  disabled,
  ref,
  ...rest
}: PasswordInputProps) {
  const labels = useLabels('passwordInput', PASSWORD_INPUT_LABELS, ownLabels);
  const [show, setShow] = useState(false);
  const ToggleIcon = show ? EyeOff : Eye;
  return (
    <Input
      ref={ref}
      type={show ? 'text' : 'password'}
      autoComplete={autoComplete}
      disabled={disabled}
      labelTrailing={helpText ? <TooltipHelp text={helpText} /> : undefined}
      endSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          disabled={disabled}
          aria-label={show ? (hideLabel ?? labels.hide) : (showLabel ?? labels.show)}
          aria-pressed={show}
          className="focus-visible:focus-indicator h-ctrl-28 w-ctrl-28 pointer-events-auto -my-0.5 inline-flex items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        >
          <ToggleIcon className="h-4 w-4" aria-hidden />
        </button>
      }
      {...rest}
    />
  );
}
