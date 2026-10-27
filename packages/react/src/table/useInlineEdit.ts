import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { isThenable, rowChanges, saveErrorMessage, triggerId } from './editing';

type RowKey = string | number;

/** The one cell, or the one row, being edited. */
export type EditState =
  | {
      kind: 'cell';
      key: RowKey;
      column: string;
      draft: string;
      initial: string;
      /** A save waits for its promise: the editor is closed meanwhile. */
      saving: boolean;
      error: string | null;
      /** Whether the field takes the focus when it opens. */
      focusField: boolean;
    }
  | {
      kind: 'row';
      key: RowKey;
      drafts: Record<string, string>;
      initials: Record<string, string>;
      saving: boolean;
      error: string | null;
    };

type Options<T> = {
  onCellEdit?: (row: T, columnKey: string, value: string) => void | PromiseLike<unknown>;
  onRowEdit?: (row: T, changes: Record<string, string>) => void | PromiseLike<unknown>;
};

/** The id the Edit button of a row is registered under (no column has this key's shape). */
const ROW_BUTTON = '\u0001row';
/** … and the one of its Save button, which takes the focus back after a rejected save. */
const ROW_SAVE = '\u0001save';

/**
 * The state of DataTable's inline editing: one cell or one row at a time, its draft, its save and
 * its error, and the focus going back to the trigger it came from. The handlers read the state
 * through a ref, so a blur that follows an Enter in the same tick finds it already closed.
 *
 * Internal to the package, not exported.
 */
export const useInlineEdit = <T>({ onCellEdit, onRowEdit }: Options<T>) => {
  const [state, setState] = useState<EditState | null>(null);
  const current = useRef<EditState | null>(null);
  const set = (next: EditState | null) => {
    current.current = next;
    setState(next);
  };

  // The buttons that open an editor, so the focus can go back to one.
  const triggers = useRef(new Map<string, HTMLElement>());
  const focusBack = useRef<string | null>(null);
  const registerTrigger = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) triggers.current.set(id, el);
      else triggers.current.delete(id);
    },
    []
  );
  useLayoutEffect(() => {
    const id = focusBack.current;
    if (id === null) return;
    focusBack.current = null;
    triggers.current.get(id)?.focus();
  });
  // After an async save the editor is gone, and so is the focus that was in it.
  const focusWasLost = () => !document.activeElement || document.activeElement === document.body;

  const openCell = (key: RowKey, column: string, initial: string) => {
    if (current.current?.saving) return;
    set({
      kind: 'cell',
      key,
      column,
      draft: initial,
      initial,
      saving: false,
      error: null,
      focusField: true,
    });
  };
  const openRow = (key: RowKey, initials: Record<string, string>) => {
    if (current.current?.saving) return;
    set({ kind: 'row', key, drafts: { ...initials }, initials, saving: false, error: null });
  };
  const setDraft = (column: string, value: string) => {
    const cur = current.current;
    if (!cur || cur.saving) return;
    if (cur.kind === 'cell') set({ ...cur, draft: value, error: null });
    else set({ ...cur, drafts: { ...cur.drafts, [column]: value } });
  };

  const cancel = () => {
    const cur = current.current;
    if (!cur || cur.saving) return;
    focusBack.current =
      cur.kind === 'cell' ? triggerId(cur.key, cur.column) : triggerId(cur.key, ROW_BUTTON);
    set(null);
  };

  // Runs a save: its promise closes the editor, its rejection reopens it with the typed value.
  const run = (
    cur: EditState,
    save: () => void | PromiseLike<unknown>,
    refocus: string | null,
    reopenFocus: string
  ) => {
    let result: void | PromiseLike<unknown>;
    try {
      result = save();
    } catch (reason) {
      set({ ...cur, saving: false, error: saveErrorMessage(reason) });
      return;
    }
    if (refocus) focusBack.current = refocus;
    if (!isThenable(result)) {
      set(null);
      return;
    }
    const saving: EditState = { ...cur, saving: true, error: null };
    set(saving);
    result.then(
      () => {
        if (current.current !== saving) return;
        if (focusWasLost()) focusBack.current = refocus ?? reopenFocus;
        set(null);
      },
      (reason: unknown) => {
        if (current.current !== saving) return;
        if (focusWasLost()) focusBack.current = reopenFocus;
        const error = saveErrorMessage(reason);
        set(
          cur.kind === 'cell'
            ? { ...cur, saving: false, error, focusField: focusWasLost() || inTable() }
            : { ...cur, saving: false, error }
        );
      }
    );
  };
  // Focus still in the table (on the cell's trigger, say), not moved on to something else.
  const inTable = () => Boolean(document.activeElement?.closest('table'));

  /** Saves the open cell. `refocus`: the focus goes back to its trigger (Enter), not on blur. */
  const commitCell = (row: T, refocus: boolean) => {
    const cur = current.current;
    if (!cur || cur.kind !== 'cell' || cur.saving) return;
    const id = triggerId(cur.key, cur.column);
    if (cur.draft === cur.initial) {
      if (refocus) focusBack.current = id;
      set(null);
      return;
    }
    run(cur, () => onCellEdit?.(row, cur.column, cur.draft), refocus ? id : null, id);
  };

  /** Saves the open row: the cells that changed, in one call. */
  const saveRow = (row: T) => {
    const cur = current.current;
    if (!cur || cur.kind !== 'row' || cur.saving) return;
    const id = triggerId(cur.key, ROW_BUTTON);
    const changes = rowChanges(cur.initials, cur.drafts);
    if (Object.keys(changes).length === 0) {
      focusBack.current = id;
      set(null);
      return;
    }
    run(cur, () => onRowEdit?.(row, changes), id, triggerId(cur.key, ROW_SAVE));
  };

  return {
    state,
    openCell,
    openRow,
    setDraft,
    cancel,
    commitCell,
    saveRow,
    registerTrigger,
    rowButtonId: (key: RowKey) => triggerId(key, ROW_BUTTON),
    rowSaveId: (key: RowKey) => triggerId(key, ROW_SAVE),
  };
};
