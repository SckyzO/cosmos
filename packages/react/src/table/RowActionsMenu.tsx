import { MoreVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { Menu } from '../ui/Menu';

export type RowActionsMenuProps = {
  /** Name of the trigger. Name the row too ("Actions for node-100"): there is one per row. */
  'aria-label'?: string;
  /** Edge of the trigger the menu lines up with. Default `right`: the column is the table's last. */
  align?: 'left' | 'right';
  /** Tailwind width class of the menu. Default `w-48`. */
  width?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** `Menu.Item`s, `Menu.Group`s and `Menu.Separator`s. A destructive one takes `intent="danger"`. */
  children: ReactNode;
};

/**
 * RowActionsMenu — the ⋮ button of a table row and the `Menu` it opens: the content of a
 * `DataTable`'s `renderRowAction` when a row has several actions. The trigger is 32px, which the
 * action column holds, and a click on it or on the menu is not a click on the row.
 */
export const RowActionsMenu = ({
  'aria-label': ariaLabel = 'Row actions',
  align = 'right',
  width = 'w-48',
  open,
  defaultOpen,
  onOpenChange,
  children,
}: RowActionsMenuProps) => (
  <Menu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} align={align}>
    <Menu.Trigger
      aria-label={ariaLabel}
      className="h-ctrl-32 w-ctrl-32 flex shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
    >
      <MoreVertical aria-hidden className="h-4 w-4" />
    </Menu.Trigger>
    <Menu.Content width={width}>{children}</Menu.Content>
  </Menu>
);
