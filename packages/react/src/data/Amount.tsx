import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';
import { formatMoney, type MoneySignDisplay, type MoneyTrailingZeroDisplay } from './money';

export type AmountProps = Omit<ComponentPropsWithRef<'bdi'>, 'children'> & {
  /** The amount, in units (`24.5`, not 2450 cents). */
  value: number;
  /** ISO 4217 code (`'EUR'`): writes the value as a price. Without it, as a plain number. */
  currency?: string;
  /** BCP 47 locale of the figure. Default: the user's. Pass it when the text around is in one. */
  locale?: string;
  /**
   * Which amounts get a sign. Default `negative`: a minus in front of a loss, nothing in front of
   * a gain or of zero (no `-$0.00`). See `formatMoney`.
   */
  signDisplay?: MoneySignDisplay;
  /**
   * `stripIfInteger` writes a whole amount with no decimals (`$24`) and keeps them on the others
   * (`$24.50`). Default `auto`: every decimal of the currency. See `formatMoney`.
   */
  trailingZeroDisplay?: MoneyTrailingZeroDisplay;
  /** Writes the value yourself, in place of `currency`, `locale`, `signDisplay` and the rest. */
  format?: (value: number) => string;
};

/**
 * Amount — a figure of money in running text, a cell or a row of totals. It is written by
 * `formatMoney`, so it follows the locale and the currency, in tabular digits that line up in a
 * column, on one line. It sits in a `<bdi>`, so the sign and the digits keep their order in a
 * right-to-left page and a minus never jumps to the other side of the figure. It takes the colour
 * and the weight of the text around it; tint it with `className`.
 */
export const Amount = ({
  value,
  currency,
  locale,
  signDisplay,
  trailingZeroDisplay,
  format,
  className,
  ...rest
}: AmountProps) => (
  <bdi className={clsx('whitespace-nowrap tabular-nums', className)} {...rest}>
    {format
      ? format(value)
      : formatMoney(value, { currency, locale, signDisplay, trailingZeroDisplay })}
  </bdi>
);
