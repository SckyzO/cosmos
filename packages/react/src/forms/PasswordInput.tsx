import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { TooltipHelp } from '../ui/Tooltip';
import { Input, type InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'type' | 'icon' | 'rightSlot' | 'labelTrailing'> & {
  /** Tooltip text shown next to the label (uses TooltipHelp). */
  helpText?: string;
  /** Override the visibility-toggle button labels (defaults: "Show/Hide password"). */
  showLabel?: string;
  hideLabel?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      helpText,
      showLabel = 'Show password',
      hideLabel = 'Hide password',
      autoComplete = 'current-password',
      disabled,
      ...rest
    },
    ref,
  ) {
    const [show, setShow] = useState(false);
    const ToggleIcon = show ? EyeOff : Eye;
    return (
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        disabled={disabled}
        labelTrailing={helpText ? <TooltipHelp text={helpText} /> : undefined}
        rightSlot={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            disabled={disabled}
            aria-label={show ? hideLabel : showLabel}
            aria-pressed={show}
            className="pointer-events-auto -my-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <ToggleIcon className="h-4 w-4" aria-hidden />
          </button>
        }
        {...rest}
      />
    );
  },
);
