/**
 * The narrowest a column is drawn when its own `width` doesn't hold it (a percentage, or none):
 * about a sortable, filterable header label. Below the sum the table scrolls sideways.
 */
export const DEFAULT_COLUMN_MIN_WIDTH = '8rem';

// A number has one way to match ("12", "12.5", ".5"), so a long run of digits that ends in
// something else fails in linear time: `\d*\.?\d+` tried every split of the run.
const NUMBER = String.raw`(?:\d+(?:\.\d+)?|\.\d+)`;
const LENGTH = new RegExp(`^${NUMBER}(?:px|rem|em|ch)$`);
const PERCENT = new RegExp(`^(${NUMBER})%$`);

type Sized = { width?: string; minWidth?: string };

const ratio = (n: number) => Number(n.toFixed(4));

/**
 * The `min-width` of a fixed-layout table that draws no column under its minimum. In that layout
 * a column with a length keeps it, a percentage is a share of the table, and the columns without a
 * width split what is left in equal parts: so the table needs `minimum / share` for each
 * percentage, and `(lengths + count × widest minimum) / (1 - shares)` for the rest. Narrower than
 * that, the table overflows its scroller, which scrolls, instead of squeezing every column.
 *
 * `fixed` are the widths of the columns the table adds (selection, toggle, actions).
 * `takesTheRest` is the index of a column drawn without its width so that it takes what is left:
 * its stated width is then its minimum.
 */
export const tableMinWidth = (columns: Sized[], fixed: string[], takesTheRest?: number) => {
  if (columns.length === 0) return undefined;
  const lengths = [...fixed];
  const autoMins: string[] = [];
  const percents: { share: number; min: string }[] = [];
  columns.forEach((c, i) => {
    const width = c.width?.trim() ?? '';
    const min = c.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH;
    const share = PERCENT.exec(width);
    if (i === takesTheRest) autoMins.push(LENGTH.test(width) ? width : min);
    else if (LENGTH.test(width)) lengths.push(width);
    else if (share) percents.push({ share: Number(share[1]) / 100, min });
    else autoMins.push(min);
  });

  const bounds = percents.map((p) => `calc(${p.min} / ${ratio(p.share)})`);
  const left = ratio(1 - percents.reduce((sum, p) => sum + p.share, 0));
  const widest = [...new Set(autoMins)];
  const parts = [
    ...lengths,
    ...(autoMins.length > 0
      ? [`${autoMins.length} * ${widest.length === 1 ? widest[0] : `max(${widest.join(', ')})`}`]
      : []),
  ];
  // Percentages that take the whole table leave the other columns nothing to share: those keep
  // what they get, as before.
  if (parts.length > 0 && left > 0) {
    bounds.push(
      left === 1 ? `calc(${parts.join(' + ')})` : `calc((${parts.join(' + ')}) / ${left})`
    );
  }
  const distinct = [...new Set(bounds)];
  if (distinct.length === 0) return undefined;
  return distinct.length === 1 ? distinct[0] : `max(${distinct.join(', ')})`;
};
