// The pure part of `BumpChart`: periods, ranks, ties and the change in rank
// from one period to the previous, in words.

export type BumpPoint = { x: string; rank: number };
export type BumpSeries = { name: string; data: BumpPoint[] };

/** A rank per period, `undefined` where the series is not in the ranking. */
export type RanksByPeriod = (number | undefined)[];

/**
 * The periods of the chart, left to right: every `x` once, in the order they
 * first appear. A series that enters late adds no period of its own as long as
 * an earlier series lists it.
 */
export const periodsOf = (series: readonly BumpSeries[]): string[] => {
  const seen = new Set<string>();
  for (const s of series) for (const point of s.data) seen.add(point.x);
  return [...seen];
};

/**
 * The rank of each series in each period, `ranks[series][period]`. A series
 * without a point in a period (it has not entered yet, or left) has
 * `undefined` there. A period listed twice keeps its last rank; a rank that is
 * not a finite number counts as missing.
 */
export const ranksOf = (series: readonly BumpSeries[], periods: readonly string[]) => {
  const index = new Map(periods.map((period, i) => [period, i]));
  return series.map((s) => {
    const ranks: RanksByPeriod = periods.map(() => undefined);
    for (const point of s.data) {
      const at = index.get(point.x);
      if (at !== undefined && Number.isFinite(point.rank)) ranks[at] = point.rank;
    }
    return ranks;
  });
};

/** How far apart, in ranks, series tied on one rank are drawn. */
export const TIE_SPREAD = 0.5;

/**
 * Where each rank is drawn. Series tied on a rank in a period are spread
 * around it, in series order, so that their points do not sit on one another;
 * everything else is drawn on its rank. The tooltip and the point labels keep
 * the real rank.
 */
export const plottedRanks = (ranks: readonly RanksByPeriod[]): RanksByPeriod[] => {
  const plotted = ranks.map((r) => [...r]);
  const periods = Math.max(0, ...ranks.map((r) => r.length));
  for (let p = 0; p < periods; p++) {
    const groups = new Map<number, number[]>();
    ranks.forEach((r, s) => {
      const rank = r[p];
      if (rank !== undefined) groups.set(rank, [...(groups.get(rank) ?? []), s]);
    });
    for (const [rank, members] of groups) {
      members.forEach((s, k) => {
        plotted[s][p] = rank + (k - (members.length - 1) / 2) * TIE_SPREAD;
      });
    }
  }
  return plotted;
};

/** The change in rank of a series in a period, against the period before. */
export type RankChange =
  | { direction: 'up' | 'down'; by: number; versus: string }
  | { direction: 'same'; versus: string }
  | { direction: 'new' };

/**
 * The change in rank in period `index`: `up` when the rank number got smaller
 * (closer to 1), `down` when it got larger. `undefined` for the first period,
 * which has nothing to compare with, and for a period the series is not in. A
 * series with no rank in the previous period is `new`.
 */
export const rankChange = (
  ranks: RanksByPeriod,
  periods: readonly string[],
  index: number
): RankChange | undefined => {
  const rank = ranks[index];
  if (index === 0 || rank === undefined) return undefined;
  const before = ranks[index - 1];
  if (before === undefined) return { direction: 'new' };
  const versus = periods[index - 1];
  if (rank === before) return { direction: 'same', versus };
  return rank < before
    ? { direction: 'up', by: before - rank, versus }
    : { direction: 'down', by: rank - before, versus };
};

/**
 * The change in words, so that it never rests on a color or an arrow:
 * "unchanged vs May", "up 2 vs Apr", "down 1 vs Mar", "new entry".
 */
export const describeChange = (change: RankChange): string => {
  switch (change.direction) {
    case 'same':
      return `unchanged vs ${change.versus}`;
    case 'new':
      return 'new entry';
    default:
      return `${change.direction} ${change.by} vs ${change.versus}`;
  }
};

/** The first and last period a series has a rank in, or `undefined` when it has none. */
export const rankSpan = (ranks: RanksByPeriod): { first: number; last: number } | undefined => {
  const first = ranks.findIndex((r) => r !== undefined);
  if (first === -1) return undefined;
  let last = ranks.length - 1;
  while (ranks[last] === undefined) last--;
  return { first, last };
};

/** A name cut to `max` characters with an ellipsis; the tooltip keeps the full name. */
export const shortName = (name: string, max: number): string =>
  name.length > max ? `${name.slice(0, Math.max(1, max - 1))}…` : name;
