import { clsx } from 'clsx';
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { StackedList, type StackedListItemProps } from './StackedList';

// ── Root ─────────────────────────────────────────────────────────────────────
// TUI reference (Pattern 6 — "In card with links"):
//   <div class="overflow-hidden bg-white shadow-sm sm:rounded-md ring-1 ring-gray-200">
//     <ul role="list" class="divide-y divide-gray-100">
//       <li class="px-4 py-5 sm:px-6">  …same as Pattern 1 li…  </li>
//     </ul>
//   </div>
//
// Each <li> gains horizontal padding because the surrounding card removes the
// edge whitespace that pattern 1 relies on. We achieve this by cloning each
// <StackedList.Item> child with an extra className.

export type StackedListInCardProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Children must be `<StackedList.Item>` elements. */
  children: ReactNode;
};

const ITEM_INSET_CLASS = 'px-4 sm:px-6';

const isStackedListItem = (node: ReactNode): node is ReactElement<StackedListItemProps> =>
  isValidElement(node) && node.type === StackedList.Item;

export const StackedListInCard = forwardRef<HTMLDivElement, StackedListInCardProps>(
  function StackedListInCard({ className, children, ...rest }, ref) {
    const insetChildren = Children.map(children, (child) => {
      if (!isStackedListItem(child)) return child;
      return cloneElement(child, {
        className: clsx(ITEM_INSET_CLASS, child.props.className),
      });
    });

    return (
      <div
        ref={ref}
        className={clsx(
          'overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-md dark:bg-gray-900 dark:ring-white/10',
          className
        )}
        {...rest}
      >
        <StackedList>{insetChildren}</StackedList>
      </div>
    );
  }
);
