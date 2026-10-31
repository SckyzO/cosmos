import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import type { DataTableBulkAction } from './types';

// The `bulkActionItems` of a DataTable, in the selection bar. Internal: not re-exported.
//
// Which form shows is settled in CSS, against the width of the bar (a container query, so the
// table in a narrow column folds too, whatever the screen): from 1152px every action is a button,
// under it the first one stays a button and the others are an "Actions" menu. With
// `mobileLayout="cards"` a phone gets icon buttons instead, as the cards do. All forms are in the
// DOM and the ones out of play are `display: none`, so a screen reader meets each action once.

type DataTableBulkActionsProps<T> = {
  items: DataTableBulkAction<T>[];
  selectedRows: T[];
  /** Cards mode: below `sm` the actions are icon buttons. */
  phoneIcons: boolean;
};

const MENU_TRIGGER =
  'h-ctrl-36 inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700';

export const DataTableBulkActions = <T,>({
  items,
  selectedRows,
  phoneIcons,
}: DataTableBulkActionsProps<T>) => {
  if (items.length === 0) return null;
  const [first, ...rest] = items;
  const button = (item: DataTableBulkAction<T>, primary: boolean) => (
    <Button
      key={item.key}
      variant={primary ? 'primary' : 'secondary'}
      intent={item.intent === 'danger' ? 'danger' : 'brand'}
      size="md"
      icon={item.icon}
      disabled={item.disabled}
      onClick={() => item.onClick(selectedRows)}
      // A label on one line: a narrow bar sends the next action to the line below instead.
      className="shrink-0"
    >
      {item.label}
    </Button>
  );
  return (
    <>
      <div className={clsx('flex flex-wrap items-center gap-2', phoneIcons && 'max-sm:hidden')}>
        {button(first!, true)}
        {rest.length > 0 && (
          <>
            <div className="hidden items-center gap-2 @min-[1152px]:flex">
              {rest.map((item) => button(item, false))}
            </div>
            <div className="@min-[1152px]:hidden">
              <Menu align="start">
                <Menu.Trigger className={MENU_TRIGGER}>
                  Actions
                  <ChevronDown aria-hidden className="h-4 w-4 text-gray-400" />
                </Menu.Trigger>
                <Menu.Content aria-label="Actions" width="w-48">
                  {rest.map((item) => (
                    <Menu.Item
                      key={item.key}
                      icon={item.icon}
                      intent={item.intent}
                      disabled={item.disabled}
                      onSelect={() => item.onClick(selectedRows)}
                    >
                      {item.label}
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu>
            </div>
          </>
        )}
      </div>
      {phoneIcons && (
        <div className="ms-auto hidden items-center gap-1.5 max-sm:flex">
          {items.map((item, i) => (
            <Button
              key={item.key}
              variant={i === 0 ? 'primary' : 'secondary'}
              intent={item.intent === 'danger' ? 'danger' : 'brand'}
              size="md"
              shape={item.icon ? 'square' : undefined}
              icon={item.icon}
              aria-label={item.label}
              disabled={item.disabled}
              onClick={() => item.onClick(selectedRows)}
            >
              {item.icon ? undefined : item.label}
            </Button>
          ))}
        </div>
      )}
    </>
  );
};
