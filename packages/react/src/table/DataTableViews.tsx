import { Bookmark, BookmarkPlus, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Input } from '../forms/Input';
import { Button } from '../ui/Button';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { Menu } from '../ui/Menu';
import { Modal } from '../ui/Modal';
import type { DataTableLabels } from './labels';
import { viewMatches, viewNameError, type ViewState } from './savedViews';
import { TOOLBAR_BUTTON } from './toolbarButton';
import type { ColumnDef, DataTableView } from './types';

// The "Views" button of a DataTable's toolbar: the saved views as a radio group, then save as,
// rename and delete. Internal: not re-exported. It owns the dialogs only; the views, the active
// one and the state of the table stay in DataTable.

type DataTableViewsProps<T> = {
  views: DataTableView[];
  /** Id of the active view, or `null`. */
  activeId: string | null;
  /** The table's state now, to tell whether the active view was modified. */
  current: ViewState;
  columns: ColumnDef<T>[];
  onApply: (view: DataTableView) => void;
  onSave: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  labels: DataTableLabels;
};

type Dialog = 'save' | 'rename' | 'delete' | null;

export const DataTableViews = <T,>({
  views,
  activeId,
  current,
  columns,
  onApply,
  onSave,
  onRename,
  onDelete,
  labels,
}: DataTableViewsProps<T>) => {
  const [dialog, setDialog] = useState<Dialog>(null);
  const active = views.find((v) => v.id === activeId) ?? null;
  const modified = active !== null && !viewMatches(active, current, columns);
  const label = active ? (modified ? labels.viewModified(active.name) : active.name) : labels.views;
  const close = () => setDialog(null);

  return (
    <>
      <Menu align="end">
        <Menu.Trigger aria-label={label} className={TOOLBAR_BUTTON}>
          <Bookmark aria-hidden className="h-4 w-4" />
          <span data-toolbar-label className="max-w-40 truncate max-sm:hidden">
            {label}
          </span>
          <ChevronDown
            aria-hidden
            data-toolbar-label
            className="h-4 w-4 text-gray-400 max-sm:hidden"
          />
        </Menu.Trigger>
        <Menu.Content aria-label={labels.views} width="w-64">
          <Menu.Group label={labels.views}>
            {views.length === 0 && (
              <div role="presentation" className="px-4 py-2 text-sm text-[var(--color-text-muted)]">
                {labels.noViews}
              </div>
            )}
            {views.map((view) => (
              <Menu.RadioItem
                key={view.id}
                checked={view.id === active?.id}
                onSelect={() => onApply(view)}
              >
                {view.name}
              </Menu.RadioItem>
            ))}
          </Menu.Group>
          <Menu.Separator />
          <Menu.Item icon={BookmarkPlus} onSelect={() => setDialog('save')}>
            {labels.saveViewAs}
          </Menu.Item>
          <Menu.Item icon={Pencil} disabled={!active} onSelect={() => setDialog('rename')}>
            {labels.renameView}
          </Menu.Item>
          <Menu.Item
            icon={Trash2}
            intent="danger"
            disabled={!active}
            onSelect={() => setDialog('delete')}
          >
            {labels.deleteView}
          </Menu.Item>
        </Menu.Content>
      </Menu>

      <Modal open={dialog === 'save'} onClose={close} size="sm">
        <NameForm
          title={labels.saveViewTitle}
          submitLabel={labels.save}
          labels={labels}
          initialName=""
          views={views}
          onSubmit={(name) => {
            onSave(name);
            close();
          }}
          onCancel={close}
        />
      </Modal>
      <Modal open={dialog === 'rename' && active !== null} onClose={close} size="sm">
        <NameForm
          title={labels.renameViewTitle}
          submitLabel={labels.rename}
          labels={labels}
          initialName={active?.name ?? ''}
          exceptId={active?.id}
          views={views}
          onSubmit={(name) => {
            onRename(name);
            close();
          }}
          onCancel={close}
        />
      </Modal>
      <ConfirmationModal
        open={dialog === 'delete' && active !== null}
        onClose={close}
        intent="danger"
        title={labels.deleteViewTitle(active?.name ?? '')}
        message={labels.deleteViewMessage}
        stayLabel={labels.cancel}
        discardLabel={labels.deleteView}
        hideSave
        onDiscard={() => {
          onDelete();
          close();
        }}
      />
    </>
  );
};

// Rendered inside the Modal, which unmounts its content on close: the field and its error start
// fresh each time. No close icon in the header, so that the field is the first thing to focus.
const NameForm = ({
  title,
  submitLabel,
  initialName,
  exceptId,
  views,
  onSubmit,
  onCancel,
  labels,
}: {
  title: string;
  submitLabel: string;
  initialName: string;
  exceptId?: string;
  views: DataTableView[];
  onSubmit: (name: string) => void;
  onCancel: () => void;
  labels: DataTableLabels;
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problem = viewNameError(name, views, exceptId);
    if (problem) setError(problem === 'empty' ? labels.viewNameEmpty : labels.viewNameTaken);
    else onSubmit(name.trim());
  };
  return (
    <>
      <Modal.Header title={title} />
      <form onSubmit={submit} noValidate>
        <Modal.Body>
          <Input
            label={labels.viewName}
            value={name}
            error={error}
            autoComplete="off"
            onChange={(e) => {
              setName(e.target.value);
              setError(undefined);
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={() => onCancel()}>
            {labels.cancel}
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </Modal.Footer>
      </form>
    </>
  );
};
