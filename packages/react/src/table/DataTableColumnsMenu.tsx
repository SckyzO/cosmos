import { ChevronDown, Columns3 } from 'lucide-react';
import { Menu } from '../ui/Menu';
import { canToggleColumn, type ColumnVisibility } from './columnVisibility';
import type { ColumnDef } from './types';

// The "Columns" button of a DataTable's toolbar and the menu of checkboxes it opens. Internal:
// not re-exported.

type DataTableColumnsMenuProps<T> = {
  columns: ColumnDef<T>[];
  /** Resolved visibility: an entry for every column. */
  shown: ColumnVisibility;
  onToggle: (key: string, visible: boolean) => void;
};

export const DataTableColumnsMenu = <T,>({
  columns,
  shown,
  onToggle,
}: DataTableColumnsMenuProps<T>) => (
  <Menu align="right">
    <Menu.Trigger
      aria-label="Columns"
      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:px-3.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      <Columns3 aria-hidden className="h-4 w-4" />
      <span className="max-sm:hidden">Columns</span>
      <ChevronDown aria-hidden className="h-4 w-4 text-gray-400 max-sm:hidden" />
    </Menu.Trigger>
    <Menu.Content aria-label="Columns" width="w-56">
      <Menu.Group label="Columns">
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
