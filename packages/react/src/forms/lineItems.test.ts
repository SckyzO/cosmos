import { describe, expect, it } from 'vitest';
import {
  currencySymbol,
  focusAfterRemove,
  lineAmount,
  minorUnitDigits,
  roundTo,
  subtotalOf,
  summarizeLineItems,
} from './lineItems';

describe('minorUnitDigits', () => {
  it('reads the decimals of the currency', () => {
    expect(minorUnitDigits('USD', 'en-US')).toBe(2);
    expect(minorUnitDigits('EUR', 'fr-FR')).toBe(2);
    expect(minorUnitDigits('JPY', 'en-US')).toBe(0);
    expect(minorUnitDigits('KWD', 'en-US')).toBe(3);
  });

  it('is the one of the formatter that writes the amount, whatever the locale', () => {
    expect(minorUnitDigits('JPY', 'fr-FR')).toBe(0);
    expect(minorUnitDigits('USD', 'de-DE')).toBe(2);
  });

  it('keeps what a plain number shows when there is no currency', () => {
    expect(minorUnitDigits(undefined, 'en-US')).toBe(3);
  });

  it('refuses a malformed currency code, as the formatter does', () => {
    expect(() => minorUnitDigits('EURO', 'en-US')).toThrow(RangeError);
  });
});

describe('roundTo', () => {
  it('rounds a half up, as the figure reads in decimal', () => {
    // 1.005 is 1.00499999999999989… in binary: toFixed and Math.round would give 1.00.
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(2.675, 2)).toBe(2.68);
    expect(roundTo(1.255, 2)).toBe(1.26);
    expect(roundTo(0.5, 0)).toBe(1);
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(1.0005, 3)).toBe(1.001);
  });

  it('rounds the rest to the nearest unit', () => {
    expect(roundTo(1.004, 2)).toBe(1);
    expect(roundTo(1.4, 0)).toBe(1);
    expect(roundTo(1234567.891, 2)).toBe(1234567.89);
  });

  it('does not let floating point noise decide a half', () => {
    expect(roundTo(0.1 + 0.2, 2)).toBe(0.3);
    // 100 * 0.285 is 28.499999999999996 in binary, 28.5 in decimal.
    expect(roundTo(100 * 0.285, 0)).toBe(29);
  });

  it('rounds a negative amount away from zero on a half, and never returns -0', () => {
    expect(roundTo(-1.005, 2)).toBe(-1.01);
    expect(roundTo(-2.5, 0)).toBe(-3);
    expect(Object.is(roundTo(-0.001, 2), 0)).toBe(true);
  });

  it('survives values the decimal shift cannot write', () => {
    expect(roundTo(1e-7, 2)).toBe(0);
    expect(roundTo(1.6e-6, 6)).toBe(0.000002);
    expect(Number.isFinite(roundTo(1e21, 2))).toBe(true);
  });

  it('turns what is not a number into zero', () => {
    expect(roundTo(NaN, 2)).toBe(0);
    expect(roundTo(Infinity, 2)).toBe(0);
  });
});

describe('lineAmount', () => {
  it('is quantity times rate, to the minor unit', () => {
    expect(lineAmount(2, 950, 2)).toBe(1900);
    expect(lineAmount(3, 0.1, 2)).toBe(0.3);
    expect(lineAmount(1.5, 0.77, 2)).toBe(1.16);
    expect(lineAmount(12, 45, 2)).toBe(540);
  });

  it('rounds to the decimals of the currency', () => {
    expect(lineAmount(3, 333.5, 0)).toBe(1001);
    expect(lineAmount(3, 0.3335, 3)).toBe(1.001);
  });

  it('counts a value that is not a number as zero', () => {
    expect(lineAmount(NaN, 10, 2)).toBe(0);
    expect(lineAmount(2, Infinity, 2)).toBe(0);
  });
});

describe('subtotalOf', () => {
  it('adds the amounts of the lines', () => {
    const lines = [
      { quantity: 1, rate: 1800 },
      { quantity: 2, rate: 950 },
      { quantity: 1, rate: 60 },
    ];
    expect(subtotalOf(lines, 2)).toBe(3760);
  });

  it('is the sum of the amounts shown, each already rounded', () => {
    // Three lines of 0.335 show 0.34 each; their subtotal is 1.02, not the 1.01 of 1.005.
    const lines = [1, 2, 3].map(() => ({ quantity: 1, rate: 0.335 }));
    expect(subtotalOf(lines, 2)).toBe(1.02);
  });

  it('carries no floating point drift', () => {
    const lines = [0.1, 0.2, 0.3].map((rate) => ({ quantity: 1, rate }));
    expect(subtotalOf(lines, 2)).toBe(0.6);
  });

  it('is zero without lines', () => {
    expect(subtotalOf([], 2)).toBe(0);
  });
});

describe('focusAfterRemove', () => {
  it('goes to the line that took the place of the one removed', () => {
    expect(focusAfterRemove(0, 3)).toBe(0);
    expect(focusAfterRemove(1, 3)).toBe(1);
  });

  it('goes to the line before when the last one is removed', () => {
    expect(focusAfterRemove(2, 3)).toBe(1);
    expect(focusAfterRemove(1, 2)).toBe(0);
  });

  it('goes to the add button when no line is left', () => {
    expect(focusAfterRemove(0, 1)).toBe('add');
  });
});

describe('summarizeLineItems', () => {
  const lines = [
    { quantity: 3, rate: 333.5 },
    { quantity: 1, rate: 12.4 },
  ];

  it('rounds each line to the minor unit of the currency before adding', () => {
    expect(summarizeLineItems(lines, { currency: 'JPY', locale: 'en-US' })).toEqual({
      subtotal: 1013,
    });
    expect(summarizeLineItems(lines, { currency: 'USD', locale: 'en-US' })).toEqual({
      subtotal: 1012.9,
    });
  });

  it('is zero for no lines, and works without a currency', () => {
    expect(summarizeLineItems([])).toEqual({ subtotal: 0 });
    expect(summarizeLineItems(lines)).toEqual({ subtotal: 1012.9 });
  });
});

describe('currencySymbol', () => {
  it('is the short sign of the currency', () => {
    expect(currencySymbol('USD', 'en-US')).toBe('$');
    expect(currencySymbol('EUR', 'fr-FR')).toBe('€');
    expect(currencySymbol('JPY', 'en-US')).toBe('¥');
  });

  it('is the narrow form in a locale with a dollar of its own', () => {
    expect(currencySymbol('USD', 'en-CA')).toBe('$');
    expect(currencySymbol('CAD', 'en-US')).toBe('$');
  });

  it('is the code when the currency has no sign', () => {
    expect(currencySymbol('CHF', 'en-US')).toBe('CHF');
  });

  it('is nothing without a currency', () => {
    expect(currencySymbol(undefined, 'en-US')).toBeUndefined();
  });
});
