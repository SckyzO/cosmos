import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

// ICU writes the group separator of French as a narrow no-break space and puts a no-break space
// before the sign of the currency; older versions used other spaces.
const plain = (s: string) => s.replace(/[\s\u00a0\u202f]/g, ' ');

describe('formatMoney: locales and currencies', () => {
  it('writes a price in English', () => {
    expect(formatMoney(1234.5, { currency: 'USD', locale: 'en-US' })).toBe('$1,234.50');
    expect(formatMoney(24.5, { currency: 'USD', locale: 'en-US' })).toBe('$24.50');
    expect(formatMoney(148.9, { currency: 'EUR', locale: 'en-GB' })).toBe('€148.90');
  });

  it('writes the same price in French, with its own separators and the sign after the number', () => {
    expect(plain(formatMoney(1234.5, { currency: 'EUR', locale: 'fr-FR' }))).toBe('1 234,50 €');
    expect(plain(formatMoney(1234.5, { currency: 'USD', locale: 'fr-FR' }))).toBe('1 234,50 $US');
  });

  it('keeps the minus of the locale', () => {
    expect(formatMoney(-12.5, { currency: 'USD', locale: 'en-US' })).toBe('-$12.50');
    expect(plain(formatMoney(-1234.5, { currency: 'EUR', locale: 'fr-FR' }))).toBe('-1 234,50 €');
    // Swedish writes a real minus sign (U+2212), not a hyphen.
    expect(formatMoney(-1234.5, { currency: 'SEK', locale: 'sv-SE' })).toContain('\u2212');
  });

  it('writes the digits of a right-to-left locale', () => {
    const positive = formatMoney(1234.5, { currency: 'EGP', locale: 'ar-EG' });
    // Arabic-Indic digits and no Latin one: the figure is not the English one pasted in.
    expect(positive).toMatch(/[\u0660-\u0669]/);
    expect(positive).not.toMatch(/[0-9]/);
    const negative = formatMoney(-1234.5, { currency: 'EGP', locale: 'ar-EG' });
    expect(negative).toContain('-');
    expect(negative).toMatch(/[\u0660-\u0669]/);
    // Hebrew keeps Latin digits, with the currency sign next to them.
    const hebrew = formatMoney(1234.5, { currency: 'ILS', locale: 'he-IL' });
    expect(hebrew).toContain('1,234.50');
    expect(hebrew).toContain('₪');
  });

  it('writes no decimal for a currency that has none', () => {
    expect(formatMoney(1234, { currency: 'JPY', locale: 'en-US' })).toBe('¥1,234');
    expect(formatMoney(1234.5, { currency: 'JPY', locale: 'en-US' })).toBe('¥1,235');
    expect(formatMoney(-1234, { currency: 'JPY', locale: 'en-US' })).toBe('-¥1,234');
  });

  it('writes three decimals for a currency that has three', () => {
    expect(formatMoney(1.5, { currency: 'KWD', locale: 'en-US' })).toBe('KWD\u00a01.500');
  });

  it('writes a plain number when there is no currency', () => {
    expect(formatMoney(24.5, { locale: 'en-US' })).toBe('24.5');
    expect(formatMoney(1234.567, { locale: 'en-US' })).toBe('1,234.567');
    expect(plain(formatMoney(1234.567, { locale: 'fr-FR' }))).toBe('1 234,567');
    expect(formatMoney(-3, { locale: 'en-US' })).toBe('-3');
  });

  it("takes the user's locale when none is given", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      // Not in the ES2022 typings of the repository.
      signDisplay: 'negative' as Intl.NumberFormatOptions['signDisplay'],
    }).format(-1234.5);
    expect(formatMoney(-1234.5, { currency: 'USD' })).toBe(expected);
  });

  it('keeps each combination apart', () => {
    // The same formatter is reused for the same options: another currency, locale or sign never
    // gets the first one's.
    expect(formatMoney(5, { currency: 'USD', locale: 'en-US' })).toBe('$5.00');
    expect(formatMoney(5, { currency: 'EUR', locale: 'en-US' })).toBe('€5.00');
    expect(plain(formatMoney(5, { currency: 'EUR', locale: 'fr-FR' }))).toBe('5,00 €');
    expect(formatMoney(5, { currency: 'USD', locale: 'en-US', signDisplay: 'always' })).toBe(
      '+$5.00'
    );
    expect(formatMoney(5, { currency: 'USD', locale: 'en-US' })).toBe('$5.00');
  });

  it('lets an unknown locale or currency throw, rather than showing a wrong amount', () => {
    expect(() => formatMoney(1, { currency: 'EU', locale: 'en-US' })).toThrow(RangeError);
    expect(() => formatMoney(1, { currency: 'EUR', locale: 'not a locale' })).toThrow(RangeError);
  });
});

describe('formatMoney: sign', () => {
  const usd = { currency: 'USD', locale: 'en-US' } as const;

  it('writes the minus of a negative amount and nothing in front of the others, by default', () => {
    expect(formatMoney(-12.5, usd)).toBe('-$12.50');
    expect(formatMoney(12.5, usd)).toBe('$12.50');
    expect(formatMoney(0, usd)).toBe('$0.00');
  });

  it('never writes -$0.00', () => {
    expect(formatMoney(-0, usd)).toBe('$0.00');
    // A loss too small to show: the figure rounds to zero, so no sign.
    expect(formatMoney(-0.001, usd)).toBe('$0.00');
    expect(formatMoney(-0.004, { currency: 'EUR', locale: 'fr-FR' }).startsWith('-')).toBe(false);
    expect(formatMoney(-0.4, { currency: 'JPY', locale: 'en-US' })).toBe('¥0');
    // A plain number keeps up to three decimals, so it takes a smaller loss to round to zero.
    expect(formatMoney(-0.0001, { locale: 'en-US' })).toBe('0');
  });

  it('is what the platform does not do: its own default writes -$0.00', () => {
    const platform = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    expect(platform.format(-0.001)).toBe('-$0.00');
  });

  it('writes a plus in front of gains with exceptZero, and still nothing in front of zero', () => {
    const o = { ...usd, signDisplay: 'exceptZero' } as const;
    expect(formatMoney(12.5, o)).toBe('+$12.50');
    expect(formatMoney(-12.5, o)).toBe('-$12.50');
    expect(formatMoney(0, o)).toBe('$0.00');
    expect(formatMoney(-0.001, o)).toBe('$0.00');
    expect(formatMoney(0.001, o)).toBe('$0.00');
  });

  it('writes a sign in front of every amount with always', () => {
    const o = { ...usd, signDisplay: 'always' } as const;
    expect(formatMoney(12.5, o)).toBe('+$12.50');
    expect(formatMoney(-12.5, o)).toBe('-$12.50');
    expect(formatMoney(0, o)).toBe('+$0.00');
  });

  it('writes no sign at all with never', () => {
    const o = { ...usd, signDisplay: 'never' } as const;
    expect(formatMoney(-12.5, o)).toBe('$12.50');
    expect(formatMoney(12.5, o)).toBe('$12.50');
  });

  it('gives the platform default back with auto', () => {
    const o = { ...usd, signDisplay: 'auto' } as const;
    expect(formatMoney(-12.5, o)).toBe('-$12.50');
    expect(formatMoney(-0.001, o)).toBe('-$0.00');
  });

  it('puts the plus where the locale puts the sign', () => {
    const o = { currency: 'EUR', locale: 'fr-FR', signDisplay: 'exceptZero' } as const;
    expect(plain(formatMoney(1234.5, o))).toBe('+1 234,50 €');
    expect(plain(formatMoney(-1234.5, o))).toBe('-1 234,50 €');
  });
});

describe('formatMoney: trailing zeros', () => {
  const usd = { currency: 'USD', locale: 'en-US' } as const;

  it('drops the decimals of a whole amount with stripIfInteger, and only of a whole one', () => {
    const o = { ...usd, trailingZeroDisplay: 'stripIfInteger' } as const;
    expect(formatMoney(24, o)).toBe('$24');
    expect(formatMoney(24.5, o)).toBe('$24.50');
    expect(formatMoney(24.99, o)).toBe('$24.99');
    expect(formatMoney(1234, o)).toBe('$1,234');
    expect(formatMoney(0, o)).toBe('$0');
    // A figure that rounds to a whole number is whole.
    expect(formatMoney(24.001, o)).toBe('$24');
  });

  it('keeps the sign, the locale and the currency of the amount', () => {
    const o = { trailingZeroDisplay: 'stripIfInteger' } as const;
    expect(formatMoney(-12, { ...usd, ...o })).toBe('-$12');
    expect(formatMoney(12, { ...usd, ...o, signDisplay: 'always' })).toBe('+$12');
    expect(plain(formatMoney(1200, { currency: 'EUR', locale: 'fr-FR', ...o }))).toBe('1 200 €');
    expect(formatMoney(12, { locale: 'en-US', ...o })).toBe('12');
  });

  it('writes every decimal by default and with auto', () => {
    expect(formatMoney(24, usd)).toBe('$24.00');
    expect(formatMoney(24, { ...usd, trailingZeroDisplay: 'auto' })).toBe('$24.00');
  });

  it('keeps each combination apart from the same one without it', () => {
    expect(formatMoney(24, { ...usd, trailingZeroDisplay: 'stripIfInteger' })).toBe('$24');
    expect(formatMoney(24, usd)).toBe('$24.00');
  });
});
