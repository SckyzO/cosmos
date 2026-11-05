// The English the list components write, their part of `CosmosLabels` (`englishLabels`).

export type FileTileLabels = {
  /** The badge of a shared file, given `shared`. Default `Shared`. */
  shared: string;
  /** Name of the star button, given the file's name. Default `Star report.pdf`. */
  star: (name: string) => string;
};

export type StackedListLabels = {
  /** Name of the select-all checkbox of a selection bar (`StackedList.Header`). Default `Select all`. */
  selectAll: string;
  /**
   * The word a row's checkbox is named with, before the title: `Select Ana Ruiz`. When the box
   * does something else than pick the row, say it (`Mark done:` for a task). Default `Select`.
   */
  select: string;
  /** Read before the title of an unread row. Default `Unread:`. */
  unread: string;
  /** The word a row's star is named with, before the title: `Star Ana Ruiz`. Default `Star`. */
  star: string;
  /** Name of the menu a phone folds the row's actions into. Default `More actions`. */
  moreActions: string;
};

export const FILE_TILE_LABELS: FileTileLabels = {
  shared: 'Shared',
  star: (name) => `Star ${name}`,
};

export const STACKED_LIST_LABELS: StackedListLabels = {
  selectAll: 'Select all',
  select: 'Select',
  unread: 'Unread:',
  star: 'Star',
  moreActions: 'More actions',
};
