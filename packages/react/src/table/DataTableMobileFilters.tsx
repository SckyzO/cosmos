import { SlidersHorizontal } from 'lucide-react';
import { Checkbox } from '../forms/Checkbox';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import type { DataTableLabels } from './labels';
import type { ColumnDef } from './types';

// DataTable's `mobileLayout="cards"` has no column headers below `sm`, so no column filters: a
// "Filters" button on the toolbar's second line opens this bottom sheet, which drives the same
// `filters` state as the headers do. Internal: not re-exported.

type FiltersButtonProps = {
  /** How many values are filtered, over every column. */
  count: number;
  open: boolean;
  onClick: () => void;
  labels: DataTableLabels;
};

export const DataTableFiltersButton = ({ count, open, onClick, labels }: FiltersButtonProps) => (
  <Button
    variant="secondary"
    size="md"
    icon={SlidersHorizontal}
    aria-haspopup="dialog"
    aria-expanded={open}
    onClick={() => onClick()}
    className="shrink-0"
  >
    {labels.filters}
    {count > 0 && (
      <span className="bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 text-2xs rounded-full px-1.5 py-0.5 font-semibold">
        {count}
      </span>
    )}
  </Button>
);

type FiltersSheetProps<T> = {
  open: boolean;
  onClose: () => void;
  /** The filterable columns. */
  columns: ColumnDef<T>[];
  /** The values each column offers (`columnFilterValues`). */
  values: Record<string, string[]>;
  filters: Record<string, Set<string>>;
  onToggle: (key: string, value: string) => void;
  onClearAll: () => void;
  /** The rows the filters keep right now. */
  rowCount: number;
  /** How many values are filtered, over every column. */
  count: number;
  labels: DataTableLabels;
};

export const DataTableFiltersSheet = <T,>({
  open,
  onClose,
  columns,
  values,
  filters,
  onToggle,
  onClearAll,
  rowCount,
  count,
  labels,
}: FiltersSheetProps<T>) => (
  <Drawer open={open} onClose={onClose} side="bottom" swipeToClose>
    <Drawer.Header title={labels.filters} onClose={onClose} />
    <Drawer.Body className="flex flex-col gap-5">
      {columns.map((col) => (
        <fieldset key={col.key}>
          <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <bdi>{col.label}</bdi>
          </legend>
          <div className="flex flex-col items-start gap-2.5">
            {(values[col.key] ?? []).map((value) => (
              <Checkbox
                key={value}
                label={<bdi>{value}</bdi>}
                checked={filters[col.key]?.has(value) ?? false}
                onChange={() => onToggle(col.key, value)}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </Drawer.Body>
    <Drawer.Footer className="justify-between">
      <Button variant="secondary" disabled={count === 0} onClick={() => onClearAll()}>
        {labels.clearAll}
      </Button>
      <Button onClick={() => onClose()}>{labels.showRows(rowCount)}</Button>
    </Drawer.Footer>
  </Drawer>
);
