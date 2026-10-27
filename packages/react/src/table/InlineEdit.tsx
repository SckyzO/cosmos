import { clsx } from 'clsx';
import { Check, CircleAlert, LoaderCircle, Pencil, X } from 'lucide-react';
import { useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { columnText } from './mobileCards';
import type { CellEditor, ColumnDef } from './types';

// The parts of DataTable's inline editing that draw something: the trigger of an editable cell,
// its editor with the error under it, and the Edit / Cancel / Save of a row. Internal: not
// re-exported. The state is `useInlineEdit`'s.

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

// Where a pencil shows: on the hovered or focused row, always when there is no hover.
const SHOWN_ON_ROW =
  'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 [@media(hover:none)]:opacity-100';

// Fields draw no error of their own here: `aria-invalid` is what turns the border red.
const INVALID = 'aria-invalid:border-red-500 dark:aria-invalid:border-red-400';

/** The accessible name of an editable cell's field and trigger: "Rack for node-a02". */
export const editLabel = <T,>(col: ColumnDef<T>, key: string | number) =>
  `${columnText(col)} for ${key}`;

const Spinner = () => (
  <LoaderCircle
    role="img"
    aria-label="Saving"
    className="text-brand-600 dark:text-brand-400 h-4 w-4 shrink-0 animate-spin"
  />
);

type TriggerProps<T> = {
  col: ColumnDef<T>;
  row: T;
  rowKey: string | number;
  mode: 'cell' | 'button';
  /** This cell's save is waiting for its promise. */
  saving: boolean;
  /** Another cell or row is being saved: nothing else opens meanwhile. */
  locked: boolean;
  open: () => void;
  register: (el: HTMLElement | null) => void;
};

/**
 * The editable cell at rest. `'cell'`: its content in a button that fills the cell, which a click,
 * Enter or F2 turns into the editor. `'button'`: its content and a pencil button, shown on the
 * hovered or focused row.
 */
export const CellTrigger = <T,>({
  col,
  row,
  rowKey,
  mode,
  saving,
  locked,
  open,
  register,
}: TriggerProps<T>) => {
  const guarded = () => {
    if (!locked && !saving) open();
  };
  const content = col.render(row);
  if (mode === 'cell') {
    return (
      <button
        type="button"
        ref={register}
        aria-disabled={locked || saving || undefined}
        onClick={guarded}
        onKeyDown={(e) => {
          if (e.key !== 'F2') return;
          e.preventDefault();
          guarded();
        }}
        className={clsx(
          'focus-visible:focus-indicator -mx-2 -my-1.5 block w-[calc(100%+1rem)] cursor-text rounded-md border border-transparent px-[7px] py-[5px]',
          'hover:border-dashed hover:border-gray-400 hover:bg-gray-50 dark:hover:border-gray-500 dark:hover:bg-white/5',
          ALIGN[col.align ?? 'left'],
          saving && 'cursor-progress text-[var(--color-text-muted)]'
        )}
      >
        {content}
        <span className="sr-only">, edit {columnText(col)}</span>
        {saving && (
          <span className="ml-2 inline-block align-middle">
            <Spinner />
          </span>
        )}
      </button>
    );
  }
  return (
    <div
      className={clsx(
        '-my-1.5 flex min-h-8 items-center justify-between gap-2',
        saving && 'text-[var(--color-text-muted)]'
      )}
    >
      <div className="min-w-0">{content}</div>
      {saving ? (
        <Spinner />
      ) : (
        <Button
          ref={register}
          variant="ghost"
          size="sm"
          shape="square"
          icon={Pencil}
          aria-label={`Edit ${editLabel(col, rowKey)}`}
          aria-disabled={locked || undefined}
          onClick={guarded}
          className={SHOWN_ON_ROW}
        />
      )}
    </div>
  );
};

type EditorProps<T> = {
  col: ColumnDef<T>;
  row: T;
  rowKey: string | number;
  /** `'row'`: the editor of one cell of a row in edit, with no Save of its own. */
  mode: 'cell' | 'button' | 'row';
  draft: string;
  setDraft: (value: string) => void;
  /** Saves (a cell: Enter, blur; a row: Enter). `refocus` is for the keyboard. */
  commit: (refocus: boolean) => void;
  cancel: () => void;
  saving: boolean;
  /** The text of a rejected save, shown under a cell's editor (a row's goes under the row). */
  error: string | null;
  /** The id of the error that names this field's problem, under the cell or under the row. */
  errorId?: string;
  /** The field takes the focus when it opens. */
  focusField: boolean;
};

const FOCUSABLE = 'input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The editor of a cell: the column's `edit.render`, with Enter saving, Escape cancelling and, for
 * a cell edited alone, a blur that leaves it saving. Its error is under it.
 */
export const CellEditorBox = <T,>({
  col,
  row,
  rowKey,
  mode,
  draft,
  setDraft,
  commit,
  cancel,
  saving,
  error,
  errorId,
  focusField,
}: EditorProps<T>) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const ownErrorId = useId();
  const hintId = useId();
  useLayoutEffect(() => {
    if (!focusField) return;
    const field = boxRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    field?.focus();
    if (field instanceof HTMLInputElement) field.select();
    // Once, when the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // A row's error is under the row; a cell's, under the cell.
  const shownError = mode === 'row' ? null : error;
  const describedBy =
    mode === 'row' ? errorId : shownError ? ownErrorId : mode === 'cell' ? hintId : undefined;
  const editor: CellEditor<T> = {
    row,
    value: draft,
    setValue: setDraft,
    commit: () => commit(true),
    cancel,
    saving,
    fieldProps: {
      'aria-label': editLabel(col, rowKey),
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : undefined,
      disabled: saving || undefined,
      className: INVALID,
    },
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      commit(true);
    } else if (e.key === 'Escape') {
      // Handled here: the overlay stack leaves a prevented Escape alone.
      e.preventDefault();
      cancel();
    }
  };
  return (
    <div
      ref={boxRef}
      onKeyDown={onKeyDown}
      onBlur={
        mode === 'row'
          ? undefined
          : (e) => {
              // Focus that moved inside the editor (to its Save, say) stays; leaving saves.
              if (!e.currentTarget.contains(e.relatedTarget)) commit(false);
            }
      }
      className="-my-1.5 text-left whitespace-normal"
    >
      {mode === 'button' ? (
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">{col.edit?.render(editor)}</div>
          <Button
            variant="ghost"
            intent="success"
            size="sm"
            shape="square"
            icon={Check}
            aria-label="Save"
            onClick={() => commit(true)}
          />
          <Button
            variant="ghost"
            size="sm"
            shape="square"
            icon={X}
            aria-label="Cancel"
            onClick={cancel}
          />
        </div>
      ) : (
        col.edit?.render(editor)
      )}
      {mode !== 'row' &&
        (shownError ? (
          <p
            id={ownErrorId}
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400"
          >
            <CircleAlert aria-hidden className="mt-px h-3.5 w-3.5 shrink-0" />
            {shownError}
          </p>
        ) : mode === 'cell' ? (
          <p id={hintId} className="mt-2 text-xs text-[var(--color-text-muted)]">
            Enter saves · Esc cancels
          </p>
        ) : null)}
    </div>
  );
};

/** The error of a rejected row save, in a row of its own under the row. */
export const RowEditError = ({
  id,
  message,
  colSpan,
}: {
  id: string;
  message: string;
  colSpan: number;
}) => (
  <tr>
    <td colSpan={colSpan} className="px-4 pb-3">
      <p
        id={id}
        role="alert"
        className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400"
      >
        <CircleAlert aria-hidden className="mt-px h-3.5 w-3.5 shrink-0" />
        {message}
      </p>
    </td>
  </tr>
);

type RowActionsProps = {
  rowKey: string | number;
  editing: boolean;
  saving: boolean;
  locked: boolean;
  open: () => void;
  save: () => void;
  cancel: () => void;
  registerEdit: (el: HTMLElement | null) => void;
  registerSave: (el: HTMLElement | null) => void;
  /** The row's own actions (`renderRowAction`), after the Edit button. */
  children?: ReactNode;
};

/** The actions cell of a row with `editTrigger="row"`: Edit, then the row's own actions; or Cancel and Save. */
export const RowEditActions = ({
  rowKey,
  editing,
  saving,
  locked,
  open,
  save,
  cancel,
  registerEdit,
  registerSave,
  children,
}: RowActionsProps) =>
  editing ? (
    <div className="flex items-center justify-end gap-1.5">
      <Button variant="secondary" size="sm" disabled={saving} onClick={cancel}>
        Cancel
      </Button>
      <Button ref={registerSave} size="sm" loading={saving} onClick={save}>
        Save
      </Button>
    </div>
  ) : (
    <div className="flex items-center justify-end gap-1">
      <Button
        ref={registerEdit}
        variant="ghost"
        size="sm"
        icon={Pencil}
        aria-label={`Edit ${rowKey}`}
        aria-disabled={locked || undefined}
        onClick={() => {
          if (!locked) open();
        }}
      >
        Edit
      </Button>
      {children}
    </div>
  );
