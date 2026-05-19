import { AlertTriangle, Loader2, Save, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ConfirmationModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  onStay: () => void;
  onDiscard?: () => void;
  onSave?: () => void;
  saving?: boolean;
  stayLabel?: string;
  discardLabel?: string;
  saveLabel?: string;
  /** Hide the Save button — for simple confirm/cancel flows. */
  hideSave?: boolean;
};

/**
 * ConfirmationModal — focused dialog for unsaved-changes guards or
 * destructive-action confirmation. Three actions: Stay (cancel) /
 * Discard (negative) / Save (primary). Set `hideSave` for binary confirm.
 *
 * Renders via `createPortal` into `document.body` so the dialog escapes
 * any clipping container (cards, sidebars, overflow:hidden ancestors).
 * Clicking the backdrop or pressing `Escape` calls `onStay`.
 */
export const ConfirmationModal = ({
  open,
  title = 'Unsaved changes',
  message = 'You have unsaved changes. What would you like to do?',
  onStay,
  onDiscard,
  onSave,
  saving = false,
  stayLabel = 'Stay',
  discardLabel = 'Discard',
  saveLabel = 'Save & go',
  hideSave = false,
}: ConfirmationModalProps) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStay();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onStay]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cosmos-confirmation-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onStay}
        aria-hidden
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="cosmos-confirmation-title"
              className="font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </div>
          <button
            type="button"
            onClick={onStay}
            aria-label="Close"
            className="shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-nowrap items-center justify-end gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onStay}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {stayLabel}
          </button>
          {onDiscard && (
            <button
              type="button"
              onClick={onDiscard}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700/40 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              {discardLabel}
            </button>
          )}
          {!hideSave && onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="bg-brand-500 hover:bg-brand-600 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saveLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
