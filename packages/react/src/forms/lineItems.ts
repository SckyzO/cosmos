// The arithmetic and the focus rule behind `LineItemsEditor`, apart from the component so they
// can be tested without a DOM.

/** One line of an invoice or an order. `quantity` and `rate` are numbers, `rate` in units. */
export type LineItem = {
  /** Identifies the line across edits and removals: the key of its row and of its `errors`. */
  id: string;
  /** What is sold: free text, or the label of a catalogue entry. */
  item: string;
  quantity: number;
  /** Price of one unit, in units of the currency (`24.5`, not 2450 cents). */
  rate: number;
};

/** What the lines add up to: given to a page that draws the total itself. */
export type LineItemsSummary = {
  /** The sum of the amounts shown, each rounded to the minor unit of the currency. */
  subtotal: number;
};

const formatterOptions = (currency?: string): Intl.NumberFormatOptions | undefined =>
  currency ? { style: 'currency', currency } : undefined;

/**
 * How many decimals the formatter that writes an amount keeps: 2 for USD, 0 for JPY, 3 for KWD,
 * and what a plain number shows (3) without a currency. Rounding a line to it makes the figure
 * shown and the figure summed the same one. A malformed currency code throws a `RangeError`, as
 * `formatMoney` does.
 */
export const minorUnitDigits = (currency?: string, locale?: string): number =>
  new Intl.NumberFormat(locale, formatterOptions(currency)).resolvedOptions()
    .maximumFractionDigits ?? 2;

/**
 * The sign of the currency on its own (`$`, `€`, `¥`): the short form, `$` and not `US$` in a
 * locale that has a dollar of its own. `undefined` without a currency.
 */
export const currencySymbol = (currency?: string, locale?: string): string | undefined => {
  if (!currency) return undefined;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value;
};

/**
 * `value` rounded to `digits` decimals, a half away from zero, as the figure reads in decimal.
 * `Math.round(x * 100) / 100` and `toFixed` round `1.005` down to `1`, since it is
 * `1.00499999999999989…` in binary; the digits are shifted as text instead, after the floating
 * point noise of a product (`28.499999999999996` for `28.5`) is cut at 15 significant digits.
 * What is not a finite number is `0`, and a negative that rounds to nothing is `0`, not `-0`.
 */
export const roundTo = (value: number, digits: number): number => {
  if (!Number.isFinite(value)) return 0;
  const magnitude = Number(Math.abs(value).toPrecision(15));
  const text = String(magnitude);
  // A magnitude written with an exponent (1e-7, 1e21) cannot be shifted as text.
  const shifted = text.includes('e') ? NaN : Math.round(Number(`${text}e${digits}`));
  const rounded = Number.isSafeInteger(shifted)
    ? Number(`${shifted}e-${digits}`)
    : Math.round(magnitude * 10 ** digits) / 10 ** digits;
  return rounded === 0 ? 0 : value < 0 ? -rounded : rounded;
};

/** The amount of a line: quantity times rate, rounded to the minor unit of the currency. */
export const lineAmount = (quantity: number, rate: number, digits: number): number =>
  roundTo(quantity * rate, digits);

/**
 * The sum of the amounts of `lines`, each rounded first, so the subtotal always equals what the
 * rows show added up (three lines of 0.335 show 0.34 each, and the subtotal is 1.02).
 */
export const subtotalOf = (
  lines: readonly Pick<LineItem, 'quantity' | 'rate'>[],
  digits: number
): number =>
  lines.reduce(
    (sum, line) => roundTo(sum + lineAmount(line.quantity, line.rate, digits), digits),
    0
  );

/** The part of a line the focus can be sent to. */
export type LineControl = 'item' | 'remove';

/** Where the focus goes: a control of the line at `line`, or the button that adds one. */
export type FocusTarget = { line: number; control: LineControl } | 'add';

/**
 * Where the focus goes once the line at `removed` (of `count` lines before the removal) is gone:
 * the remove button of the line that took its place (`line` is its index among the lines left),
 * the one of the new last line when the last was removed, or the add button when none is left.
 * It is never a field, whose focus would open the list of a catalogue, and never the page.
 */
export const focusAfterRemove = (removed: number, count: number): FocusTarget =>
  count <= 1 ? 'add' : { line: Math.min(removed, count - 2), control: 'remove' };

/**
 * The summary of `lines` as the editor reports it to `onChange`, for a page that holds lines it
 * did not just receive (a draft loaded from a server) and shows the total outside the editor.
 */
export const summarizeLineItems = (
  lines: readonly Pick<LineItem, 'quantity' | 'rate'>[],
  { currency, locale }: { currency?: string; locale?: string } = {}
): LineItemsSummary => ({ subtotal: subtotalOf(lines, minorUnitDigits(currency, locale)) });
