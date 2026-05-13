import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Button, type ButtonVariant } from '../ui/Button';

export type FormFooterAlign = 'right' | 'between';

export type FormFooterProps = {
  /** Cancel button handler. Hidden when omitted. */
  onCancel?: () => void;
  cancelLabel?: string;
  /** Submit button. Defaults to `<button type="submit">`. Override via `submitProps.type`. */
  submitLabel?: string;
  /** When true, the submit button shows a spinner and is disabled. */
  submitting?: boolean;
  /** Disable the submit button (e.g. form invalid / not dirty). */
  submitDisabled?: boolean;
  /** Visual variant for the submit button. Default `primary`. */
  submitVariant?: ButtonVariant;
  /** Form name attribute (used by submit when the button is outside the form). */
  formId?: string;
  /** Where to render the buttons. Default `right`. */
  align?: FormFooterAlign;
  /** Render a top border separator. Default `true`. */
  bordered?: boolean;
  /** Optional content shown opposite the buttons (helper text, last-saved indicator…). */
  extra?: ReactNode;
  /** Replace the entire button row (still keeps padding + border). */
  children?: ReactNode;
  className?: string;
};

export const FormFooter = ({
  onCancel,
  cancelLabel = 'Cancel',
  submitLabel = 'Save changes',
  submitting = false,
  submitDisabled = false,
  submitVariant = 'primary',
  formId,
  align = 'right',
  bordered = true,
  extra,
  children,
  className,
}: FormFooterProps) => {
  const buttons = children ?? (
    <>
      {onCancel && (
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        variant={submitVariant}
        loading={submitting}
        disabled={submitDisabled || submitting}
        form={formId}
      >
        {submitLabel}
      </Button>
    </>
  );

  return (
    <div
      className={clsx(
        'flex items-center gap-3 pt-4',
        bordered && 'border-t border-gray-100 dark:border-gray-800',
        align === 'between' ? 'justify-between' : 'justify-end',
        className,
      )}
    >
      {extra && <div className="text-xs text-gray-500 dark:text-gray-400">{extra}</div>}
      <div className={clsx('flex items-center gap-3', align === 'right' && 'ml-auto')}>
        {buttons}
      </div>
    </div>
  );
};
