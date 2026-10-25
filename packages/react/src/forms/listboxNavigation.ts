import { useMemo, useState, type KeyboardEvent } from 'react';

/** What a text-filtered listbox needs of its options. */
export type ListboxItem = { label: string; disabled?: boolean };

/** The options whose label contains the typed query, case-insensitive; all of them for an empty one. */
export const filterByLabel = <T extends ListboxItem>(options: T[], query: string): T[] => {
  if (!query) return options;
  const q = query.toLowerCase();
  return options.filter((o) => o.label.toLowerCase().includes(q));
};

/** `filterByLabel`, memoized on the options and the query. */
export const useFilteredOptions = <T extends ListboxItem>(options: T[], query: string): T[] =>
  useMemo(() => filterByLabel(options, query), [options, query]);

type ListboxNavigationOptions<T extends ListboxItem> = {
  /** The options as listed (already filtered). */
  items: T[];
  open: boolean;
  /** Asked to open or close the list; the caller drops a request that changes nothing. */
  setOpen: (open: boolean) => void;
  /** Enter on the active option. */
  onPick: (item: T) => void;
};

/**
 * The keyboard handling of a listbox driven from its text input (Combobox, MultiSelect), focus
 * staying in the input with `aria-activedescendant`: arrows move the active option over the
 * disabled ones and stay put at either end, ArrowDown also opens the list, Enter picks the
 * active option of an open list, Tab closes it. The caller adds the keys of its own to
 * `onKeyDown`'s result, and resets the active option with `setActiveIndex(0)` when the query changes.
 */
export const useListboxNavigation = <T extends ListboxItem>({
  items,
  open,
  setOpen,
  onPick,
}: ListboxNavigationOptions<T>) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const moveActive = (step: 1 | -1) =>
    setActiveIndex((i) => {
      let next = i + step;
      while (items[next]?.disabled) next += step;
      return items[next] ? next : i;
    });

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter') {
      if (open && items[activeIndex]) {
        e.preventDefault();
        onPick(items[activeIndex]);
      }
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return { activeIndex, setActiveIndex, onKeyDown };
};
