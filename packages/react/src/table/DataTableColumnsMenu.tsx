import { ChevronDown, Columns3 } from 'lucide-react';
import { Menu } from '../ui/Menu';
import type { DataTableLabels } from './labels';
import { TOOLBAR_BUTTON } from './toolbarButton';
import { canToggleColumn, type ColumnVisibility } from './columnVisibility';
import type { ColumnDef } from './types';

// The "Columns" button of a DataTable's toolbar and the menu of checkboxes it opens. Internal:
// not re-exported.

type DataTableColumnsMenuProps<T> = {
  columns: ColumnDef<T>[];
  /** Resolved visibility: an entry for every column. */
  shown: ColumnVisibility;
  onToggle: (key: string, visible: boolean) => void;
  labels: DataTableLabels;
};

export const DataTableColumnsMenu = <T,>({
  columns,
  shown,
  onToggle,
  labels,
}: DataTableColumnsMenuProps<T>) => (
  <Menu align="end">
    <Menu.Trigger aria-label={labels.columns} className={TOOLBAR_BUTTON}>
      <Columns3 aria-hidden className="h-4 w-4" />
      <span data-toolbar-label className="max-sm:hidden">
        {labels.columns}
      </span>
      <ChevronDown aria-hidden data-toolbar-label className="h-4 w-4 text-gray-400 max-sm:hidden" />
    </Menu.Trigger>
    <Menu.Content aria-label={labels.columns} width="w-56">
      <Menu.Group label={labels.columns}>
        {columns.map((col) => (
          <Menu.CheckboxItem
            key={col.key}
            checked={shown[col.key]}
            disabled={!canToggleColumn(columns, shown, col.key)}
            onCheckedChange={(visible) => onToggle(col.key, visible)}
          >
            {col.label}
          </Menu.CheckboxItem>
        ))}
      </Menu.Group>
    </Menu.Content>
  </Menu>
);
