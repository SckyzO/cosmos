// An amount of money as text. One function writes every amount of the package (`Amount`,
// `Totals`, `TableAmountCell`), so a page never shows the same figure two ways.

/** When the sign of an amount is written: the values of `Intl.NumberFormat`'s `signDisplay`. */
export type MoneySignDisplay = 'auto' | 'always' | 'exceptZero' | 'negative' | 'never';

/** When the zeros after the decimal point are written: `Intl.NumberFormat`'s `trailingZeroDisplay`. */
export type MoneyTrailingZeroDisplay = 'auto' | 'stripIfInteger';

export type FormatMoneyOptions = {
  /** ISO 4217 code (`'EUR'`): writes the value as a price. Without it, as a plain number. */
  currency?: string;
  /** BCP 47 locale of the figure (`'fr-FR'`, `'ar-EG'`). Default: the user's. */
  locale?: string;
  /**
   * Which amounts get a sign. Default `negative`: a minus in front of a loss, nothing in front of
   * a gain or of zero, and no `-$0.00` for a loss too small to show. `exceptZero` adds a plus in
   * front of a gain, `always` and `never` write a sign in front of every amount or none.
   */
  signDisplay?: MoneySignDisplay;
  /**
   * Default `auto`: every decimal of the currency (`$24.00`). `stripIfInteger` drops them from a
   * whole amount and only from a whole one (`$24`, but `$24.50`), for a price tag.
   */
  trailingZeroDisplay?: MoneyTrailingZeroDisplay;
};

// Building a formatter costs far more than using one, and a table writes an amount per row: one
// per combination of options, kept. The combinations an app uses are few.
const formatters = new Map<string, Intl.NumberFormat>();

const formatterFor = (
  currency: string | undefined,
  locale: string | undefined,
  signDisplay: MoneySignDisplay,
  trailingZeroDisplay: MoneyTrailingZeroDisplay
) => {
  const key = `${locale ?? ''}|${currency ?? ''}|${signDisplay}|${trailingZeroDisplay}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    // `negative` and `trailingZeroDisplay` (ES2023) are not in the ES2022 typings the repository
    // compiles against.
    formatter = new Intl.NumberFormat(locale, {
      ...(currency ? { style: 'currency', currency } : {}),
      signDisplay,
      trailingZeroDisplay,
    } as Intl.NumberFormatOptions);
    formatters.set(key, formatter);
  }
  return formatter;
};

/**
 * `value` written as an amount, in units (`24.5`, not 2450 cents), by `Intl.NumberFormat`: the
 * separators, the digits, the number of decimals of the currency (none for JPY) and the place of
 * its sign come from `locale`. For a string, a toast, an `aria-label` or an export; to draw the
 * figure on a page, use `Amount`, which also isolates it from the text around it.
 *
 * An unknown locale or a malformed currency code throws a `RangeError`: a wrong amount on a page
 * is worse than an error.
 */
export const formatMoney = (
  value: number,
  {
    currency,
    locale,
    signDisplay = 'negative',
    trailingZeroDisplay = 'auto',
  }: FormatMoneyOptions = {}
): string => formatterFor(currency, locale, signDisplay, trailingZeroDisplay).format(value);
