import { clsx } from 'clsx';
import { AlertTriangle, Save, Trash2, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Input } from '../forms/Input';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { INTENT_STYLE, type Intent } from './intent';
import { useDialogTitleId } from './overlayA11y';

export type ConfirmationModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  /** Called by the Stay button, the close icon, the backdrop and Escape. */
  onClose: () => void;
  onDiscard?: () => void;
  onSave?: () => void;
  saving?: boolean;
  stayLabel?: string;
  discardLabel?: string;
  saveLabel?: string;
  /** Hide the Save button — for simple confirm/cancel flows. */
  hideSave?: boolean;
  /**
   * What the dialog warns about. `warning` (default) is the amber triangle and a quiet discard
   * button; `danger` is a red tile with a trash icon and a solid red discard button.
   */
  intent?: Extract<Intent, 'warning' | 'danger'>;
  /**
   * Text the user has to type, exactly (case-sensitive), before the discard action is enabled:
   * a field appears, and Enter in it triggers `onDiscard` once it matches. The field is empty each
   * time the dialog opens.
   */
  requireText?: string;
  /** Label of the `requireText` field, for translations. Default `Type "<requireText>" to confirm`. */
  requireTextLabel?: string;
};

/**
 * ConfirmationModal — focused dialog for unsaved-changes guards or
 * destructive-action confirmation. Three actions: Stay (cancel) /
 * Discard (negative) / Save (primary). Set `hideSave` for binary confirm.
 *
 * Built on the dialog `Modal` uses: portaled into `document.body`, focus
 * trapped inside and given back on close, an `alertdialog` named by its title
 * and described by its message. The Stay button, the close icon, the backdrop
 * and `Escape` call `onClose`.
 */
export const ConfirmationModal = ({ open, onClose, ...content }: ConfirmationModalProps) => {
  const messageId = useId();
  return (
    <Dialog open={open} onClose={onClose} role="alertdialog" ariaDescribedBy={messageId}>
      <ConfirmationContent {...content} onClose={onClose} messageId={messageId} />
    </Dialog>
  );
};

// Rendered inside the Dialog, so the title can take the id the dialog is labelled by.
const ConfirmationContent = ({
  title = 'Unsaved changes',
  message = 'You have unsaved changes. What would you like to do?',
  onClose,
  onDiscard,
  onSave,
  saving = false,
  stayLabel = 'Stay',
  discardLabel = 'Discard',
  saveLabel = 'Save & go',
  hideSave = false,
  intent = 'warning',
  requireText,
  requireTextLabel,
  messageId,
}: Omit<ConfirmationModalProps, 'open'> & { messageId: string }) => {
  const titleId = useDialogTitleId();
  // Rendered inside the Dialog, which unmounts its content on close: the field starts empty.
  const [typed, setTyped] = useState('');
  const danger = intent === 'danger';
  const confirmed = requireText === undefined || typed === requireText;
  return (
    <>
      <div className="flex items-start gap-4 p-6">
        <div
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            danger ? INTENT_STYLE.danger.tile : 'bg-amber-50 dark:bg-amber-500/10'
          )}
        >
          {danger ? (
            <Trash2 className={clsx('h-5 w-5', INTENT_STYLE.danger.iconColor)} aria-hidden />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p id={messageId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
          {requireText !== undefined && (
            <div className="mt-4">
              <Input
                label={requireTextLabel ?? `Type "${requireText}" to confirm`}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  // isComposing: the Enter that confirms an IME candidate must not act.
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing && confirmed) {
                    e.preventDefault();
                    onDiscard?.();
                  }
                }}
                placeholder={requireText}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          shape="circle"
          size="sm"
          icon={X}
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-2 shrink-0"
        />
      </div>

      <div className="flex flex-nowrap items-center justify-end gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
        <Button variant="secondary" onClick={onClose} className="shrink-0">
          {stayLabel}
        </Button>
        {onDiscard && (
          <Button
            variant={danger ? 'primary' : 'secondary'}
            intent="danger"
            disabled={!confirmed}
            onClick={onDiscard}
            className="shrink-0"
          >
            {discardLabel}
          </Button>
        )}
        {!hideSave && onSave && (
          <Button icon={Save} loading={saving} onClick={onSave} className="shrink-0">
            {saveLabel}
          </Button>
        )}
      </div>
    </>
  );
};
