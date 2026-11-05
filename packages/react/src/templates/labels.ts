// The English the template components write, their part of `CosmosLabels` (`englishLabels`).

export type SectionCardLabels = {
  /** The title of the empty state when the host gives no `emptyMessage`. Default `No data`. */
  empty: string;
  /** The label by the title of a `stale` card when the host gives no `staleLabel`. Default `Stale`. */
  stale: string;
  /** What a screen reader hears while the card loads, from its title (empty when it has none). Default `Loading Sales…`. */
  loading: (title: string) => string;
  /** Name of the toggle of a `collapsible` card, from its title. Default `Toggle Sales`. */
  toggle: (title: string) => string;
};

export const SECTION_CARD_LABELS: SectionCardLabels = {
  empty: 'No data',
  stale: 'Stale',
  loading: (title) => (title ? `Loading ${title}…` : 'Loading…'),
  toggle: (title) => `Toggle ${title}`,
};
