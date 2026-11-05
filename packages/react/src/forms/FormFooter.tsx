import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useLabels } from '../labels/labelsContext';
import { Button, type ButtonIntent, type ButtonVariant } from '../ui/Button';
import { FORM_FOOTER_LABELS, type FormFooterLabels } from './labels';

export type FormFooterAlign = 'end' | 'between';

export type FormFooterProps = {
  /** Cancel button handler. Hidden when omitted. */
  onCancel?: () => void;
  /** Text of the cancel button. Default `labels.cancel`. */
  cancelLabel?: string;
  /** Text of the submit button, a `<button type="submit">`. Default `labels.submit`. */
  submitLabel?: string;
  /** When true, the submit button shows a spinner and is disabled. */
  submitting?: boolean;
  /** Disable the submit button (e.g. form invalid / not dirty). */
  submitDisabled?: boolean;
  /** Emphasis of the submit button. Default `primary`. */
  submitVariant?: ButtonVariant;
  /** Meaning of the submit button. `danger` for a destructive submit. Default `brand`. */
  submitIntent?: ButtonIntent;
  /** Form name attribute (used by submit when the button is outside the form). */
  formId?: string;
  /** Where to render the buttons: `end` is the end edge (the left one in right to left). Default `end`. */
  align?: FormFooterAlign;
  /** Render a top border separator. Default `true`. */
  bordered?: boolean;
  /** Optional content shown opposite the buttons (helper text, last-saved indicator…). */
  extra?: ReactNode;
  /** Replace the entire button row (still keeps padding + border). */
  children?: ReactNode;
  /** The texts it writes, over `LabelsProvider`'s `formFooter` and the English defaults. */
  labels?: Partial<FormFooterLabels>;
  className?: string;
};

export const FormFooter = ({
  onCancel,
  cancelLabel,
  submitLabel,
  submitting = false,
  submitDisabled = false,
  submitVariant = 'primary',
  submitIntent = 'brand',
  formId,
  align = 'end',
  bordered = true,
  extra,
  children,
  labels: ownLabels,
  className,
}: FormFooterProps) => {
  const labels = useLabels('formFooter', FORM_FOOTER_LABELS, ownLabels);
  const buttons = children ?? (
    <>
      {onCancel && (
        <Button type="button" variant="secondary" onClick={() => onCancel()} disabled={submitting}>
          {cancelLabel ?? labels.cancel}
        </Button>
      )}
      <Button
        type="submit"
        variant={submitVariant}
        intent={submitIntent}
        loading={submitting}
        disabled={submitDisabled || submitting}
        form={formId}
      >
        {submitLabel ?? labels.submit}
      </Button>
    </>
  );

  return (
    <div
      className={clsx(
        'flex items-center gap-3 pt-4',
        bordered && 'border-t border-gray-100 dark:border-gray-800',
        align === 'between' ? 'justify-between' : 'justify-end',
        className
      )}
    >
      {extra && <div className="text-xs text-gray-500 dark:text-gray-400">{extra}</div>}
      <div className={clsx('flex items-center gap-3', align === 'end' && 'ms-auto')}>{buttons}</div>
    </div>
  );
};
