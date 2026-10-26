export type SeriesInput = { name: string; data: number[] };

/** The data key of series `index`. Series are keyed by position: a name may hold dots, which Recharts reads as a path. */
export const seriesKey = (index: number) => `s${index}`;

/** One row per category, with a value under each series key. */
export const toRows = (categories: readonly (string | number)[], series: readonly SeriesInput[]) =>
  categories.map((category, i) => ({
    category,
    ...Object.fromEntries(series.map((s, k) => [seriesKey(k), s.data[i]])),
  }));

/** Whether there is nothing to draw: no series, or only series without a point. */
export const hasNoData = (series: readonly { data: readonly unknown[] }[]): boolean =>
  series.every((s) => s.data.length === 0);

/** An id safe in `url(#…)`, from React's `useId` (`:r1:`). */
export const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');
