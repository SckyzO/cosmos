import { describe, expect, it } from 'vitest';
import {
  cardBrand,
  cardCvcLength,
  cardNumberLengths,
  editCardNumber,
  editCvc,
  editExpiry,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  luhnValid,
  type CardBrand,
} from './cardFormat';

// A field's state as a string with the caret written as `|`, so an edit reads as before and after.
const raw = (marked: string, previous: string, deletion?: 'backward' | 'forward') => {
  const caret = marked.indexOf('|');
  return { text: marked.slice(0, caret) + marked.slice(caret + 1), caret, previous, deletion };
};
const shown = ({ text, caret }: { text: string; caret: number }) =>
  `${text.slice(0, caret)}|${text.slice(caret)}`;

describe('cardBrand', () => {
  const cases: [CardBrand, string[]][] = [
    ['visa', ['4', '4111111111111111', '4000056655665556']],
    ['mastercard', ['51', '55', '5555555555554444', '2221', '2500', '2720']],
    ['amex', ['34', '37', '378282246310005']],
    ['discover', ['6011', '6011111111111117', '644', '649', '65']],
    ['diners', ['300', '305', '3095', '36', '38', '39', '30569309025904']],
    ['jcb', ['3528', '3589', '3530111333300000']],
    ['unionpay', ['62', '6200000000000005']],
  ];
  for (const [brand, numbers] of cases) {
    it(`takes ${brand} for its prefixes`, () => {
      for (const number of numbers) expect(cardBrand(number), number).toBe(brand);
    });
  }

  it('stays null just outside a range', () => {
    for (const number of ['50', '56', '2220', '2721', '643', '3527', '3590', '306', '3090', '33']) {
      expect(cardBrand(number), number).toBeNull();
    }
  });

  it('stays null until the digits typed tell two brands apart', () => {
    // A leading 5 is a Mastercard from 51 to 55, a 2 only from 2221, a 3 is five brands.
    for (const number of ['', '2', '22', '222', '3', '5', '6', '60', '64']) {
      expect(cardBrand(number), number).toBeNull();
    }
  });

  it('reads a number as it is shown, with spaces and dashes', () => {
    expect(cardBrand('3741 852963 07413')).toBe('amex');
    expect(cardBrand('5412-4185-2963-0746')).toBe('mastercard');
  });
});

describe('cardNumberLengths and cardCvcLength', () => {
  it('lists the lengths a brand issues', () => {
    expect(cardNumberLengths('visa')).toEqual([13, 16, 19]);
    expect(cardNumberLengths('mastercard')).toEqual([16]);
    expect(cardNumberLengths('amex')).toEqual([15]);
    expect(cardNumberLengths('diners')).toContain(14);
    expect(cardNumberLengths('jcb')).toEqual([16, 17, 18, 19]);
  });

  it('takes 12 to 19 digits for a number with no brand yet', () => {
    expect(cardNumberLengths(null)).toEqual([12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('asks four digits of an Amex card and three of any other', () => {
    expect(cardCvcLength('amex')).toBe(4);
    for (const brand of ['visa', 'mastercard', 'discover', 'diners', 'jcb', 'unionpay'] as const) {
      expect(cardCvcLength(brand), brand).toBe(3);
    }
    expect(cardCvcLength(null)).toBe(3);
  });
});

describe('luhnValid', () => {
  it('accepts the test numbers of the card networks', () => {
    for (const number of [
      '4111111111111111',
      '5555555555554444',
      '378282246310005',
      '6011111111111117',
      '30569309025904',
      '3530111333300000',
      '4539144185296306',
    ]) {
      expect(luhnValid(number), number).toBe(true);
    }
  });

  it('rejects a number whose last digit is off, however long', () => {
    for (const number of [
      '4111111111111112',
      '378282246310006',
      '4539144185296307',
      '0000000000000001',
    ]) {
      expect(luhnValid(number), number).toBe(false);
    }
  });

  it('reads spaces and dashes, rejects anything else and an empty value', () => {
    expect(luhnValid('4111 1111 1111 1111')).toBe(true);
    expect(luhnValid('4111-1111-1111-1111')).toBe(true);
    expect(luhnValid('')).toBe(false);
    expect(luhnValid('4')).toBe(false);
    expect(luhnValid('4111 1111 1111 111a')).toBe(false);
  });
});

describe('expiryValid', () => {
  const today = new Date(2026, 10, 2); // 2 November 2026

  it('holds a card through the end of its month', () => {
    expect(expiryValid('1126', today)).toBe(true);
    expect(expiryValid('1226', today)).toBe(true);
    expect(expiryValid('0127', today)).toBe(true);
    expect(expiryValid('1228', today)).toBe(true);
  });

  it('rejects a month already over', () => {
    expect(expiryValid('1026', today)).toBe(false);
    expect(expiryValid('0126', today)).toBe(false);
    expect(expiryValid('1225', today)).toBe(false);
  });

  it('rejects a month that does not exist, and a value that is not complete', () => {
    expect(expiryValid('0028', today)).toBe(false);
    expect(expiryValid('1328', today)).toBe(false);
    expect(expiryValid('122', today)).toBe(false);
    expect(expiryValid('12', today)).toBe(false);
    expect(expiryValid('', today)).toBe(false);
  });

  it('reads the value as it is shown', () => {
    expect(expiryValid('12 / 28', today)).toBe(true);
    expect(expiryValid('12 / 25', today)).toBe(false);
  });

  it('defaults to today', () => {
    const next = new Date();
    next.setFullYear(next.getFullYear() + 2);
    const yy = String(next.getFullYear() % 100).padStart(2, '0');
    expect(expiryValid(`12${yy}`)).toBe(true);
    next.setFullYear(next.getFullYear() - 4);
    expect(expiryValid(`12${String(next.getFullYear() % 100).padStart(2, '0')}`)).toBe(false);
  });
});

describe('formatCardNumber', () => {
  it('groups four by four, with no trailing space', () => {
    expect(formatCardNumber('')).toBe('');
    expect(formatCardNumber('4111')).toBe('4111');
    expect(formatCardNumber('41111')).toBe('4111 1');
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(formatCardNumber('5412418529630746')).toBe('5412 4185 2963 0746');
  });

  it('groups an Amex 4-6-5 and a 14-digit Diners 4-6-4', () => {
    expect(formatCardNumber('374185296307413')).toBe('3741 852963 07413');
    expect(formatCardNumber('37418529')).toBe('3741 8529');
    expect(formatCardNumber('30569309025904')).toBe('3056 930902 5904');
  });

  it('keeps a long Visa in fours, and a Diners that runs past 14 digits too', () => {
    expect(formatCardNumber('4111111111111111111')).toBe('4111 1111 1111 1111 111');
    expect(formatCardNumber('3056930902590412')).toBe('3056 9309 0259 0412');
  });

  it('regroups when the prefix changes the brand', () => {
    expect(formatCardNumber('3741852963')).toBe('3741 852963');
    expect(formatCardNumber('4741852963')).toBe('4741 8529 63');
  });

  it('drops what is not a digit and what goes past the longest number of the brand', () => {
    expect(formatCardNumber('4111-1111 abcd 1111')).toBe('4111 1111 1111');
    expect(formatCardNumber('3741852963074139999')).toBe('3741 852963 07413');
    expect(formatCardNumber('5412418529630746123')).toBe('5412 4185 2963 0746');
    expect(formatCardNumber('4'.repeat(25))).toBe('4444 4444 4444 4444 444');
  });
});

describe('editCardNumber', () => {
  it('adds the space as the next group starts, caret at the end', () => {
    expect(shown(editCardNumber(raw('4111|', '411')))).toBe('4111|');
    expect(shown(editCardNumber(raw('41112|', '4111')))).toBe('4111 2|');
    expect(shown(editCardNumber(raw('4111 22222|', '4111 2222')))).toBe('4111 2222 2|');
  });

  it('keeps the caret after the digit typed in the middle', () => {
    expect(shown(editCardNumber(raw('419|11 1', '4111 1')))).toBe('419|1 11');
    // At a group edge: the digit lands before the separator that follows it.
    expect(shown(editCardNumber(raw('41119| 2222', '4111 2222')))).toBe('4111 9|222 2');
  });

  it('removes the digit before a space that Backspace deleted, instead of putting it back', () => {
    const result = editCardNumber(raw('4111|2222', '4111 2222', 'backward'));
    expect(result.digits).toBe('4112222');
    expect(shown(result)).toBe('411|2 222');
  });

  it('removes the digit after a space that Delete deleted', () => {
    const result = editCardNumber(raw('4111|2222', '4111 2222', 'forward'));
    expect(result.digits).toBe('4111222');
    expect(shown(result)).toBe('4111| 222');
  });

  it('lets a deletion of a digit through', () => {
    expect(shown(editCardNumber(raw('4111 |222', '4111 2222', 'backward')))).toBe('4111| 222');
    expect(shown(editCardNumber(raw('41|1 2222', '4111 2222', 'backward')))).toBe('41|12 222');
  });

  it('does not eat a digit at the very start', () => {
    const result = editCardNumber(raw('|4111', '4111', 'backward'));
    expect(result.digits).toBe('4111');
    expect(shown(result)).toBe('|4111');
  });

  it('takes a pasted number, with its separators, into an empty field', () => {
    const result = editCardNumber(raw('4111-1111-1111-1111|', ''));
    expect(result.digits).toBe('4111111111111111');
    expect(shown(result)).toBe('4111 1111 1111 1111|');
  });

  it('puts the caret after a number pasted in the middle', () => {
    // "4111| 1111" with "9999 8888" pasted at the caret.
    const result = editCardNumber(raw('41119999 8888| 1111', '4111 1111'));
    expect(result.digits).toBe('4111999988881111');
    expect(shown(result)).toBe('4111 9999 8888| 1111');
  });

  it('cuts a number too long for its brand, caret at the end', () => {
    const amex = editCardNumber(raw('371234567890123456|', ''));
    expect(amex.digits).toBe('371234567890123');
    expect(shown(amex)).toBe('3712 345678 90123|');
    const visa = editCardNumber(raw('4'.repeat(25) + '|', ''));
    expect(visa.digits).toBe('4'.repeat(19));
    expect(shown(visa)).toBe('4444 4444 4444 4444 444|');
  });

  it('drops letters and keeps the caret where it was', () => {
    expect(shown(editCardNumber(raw('4111a|', '4111')))).toBe('4111|');
    expect(shown(editCardNumber(raw('41a|11 1', '4111 1')))).toBe('41|11 1');
  });

  it('regroups as the brand shows up while typing', () => {
    expect(shown(editCardNumber(raw('37418|', '3741')))).toBe('3741 8|');
    expect(shown(editCardNumber(raw('3741 8529630|', '3741 852963')))).toBe('3741 852963 0|');
  });
});

describe('formatExpiry', () => {
  it('writes MM / YY, the separator as soon as the month is complete', () => {
    expect(formatExpiry('')).toBe('');
    expect(formatExpiry('1')).toBe('1');
    expect(formatExpiry('12')).toBe('12 / ');
    expect(formatExpiry('122')).toBe('12 / 2');
    expect(formatExpiry('1228')).toBe('12 / 28');
  });

  it('reads a value that is already shown, and drops what is past four digits', () => {
    expect(formatExpiry('12 / 28')).toBe('12 / 28');
    expect(formatExpiry('122800')).toBe('12 / 28');
  });
});

describe('editExpiry', () => {
  it('types a month from 2 to 9 as 02 to 09', () => {
    expect(shown(editExpiry(raw('1|', '')))).toBe('1|');
    expect(shown(editExpiry(raw('5|', '')))).toBe('05 / |');
    expect(shown(editExpiry(raw('0|', '')))).toBe('0|');
    expect(shown(editExpiry(raw('09|', '0')))).toBe('09 / |');
  });

  it('puts the caret after the separator when the month is complete', () => {
    expect(shown(editExpiry(raw('12|', '1')))).toBe('12 / |');
    expect(shown(editExpiry(raw('12 / 2|', '12 / ')))).toBe('12 / 2|');
    expect(shown(editExpiry(raw('12 / 28|', '12 / 2')))).toBe('12 / 28|');
  });

  it('stops at four digits', () => {
    const result = editExpiry(raw('12 / 283|', '12 / 28'));
    expect(result.digits).toBe('1228');
    expect(shown(result)).toBe('12 / 28|');
  });

  it('removes the last digit of the month when Backspace deletes the separator', () => {
    const result = editExpiry(raw('12 /|', '12 / ', 'backward'));
    expect(result.digits).toBe('1');
    expect(shown(result)).toBe('1|');
  });

  it('lets a deletion of a digit through, and does not zero-pad a month it shortened', () => {
    expect(shown(editExpiry(raw('12 / |', '12 / 2', 'backward')))).toBe('12 / |');
    expect(shown(editExpiry(raw('|2 / 28', '12 / 28', 'backward')))).toBe('|22 / 8');
    expect(editExpiry(raw('5|', '15', 'backward')).text).toBe('5');
  });

  it('takes a pasted month and year, with a two or four digit year', () => {
    expect(editExpiry(raw('12/28|', '')).digits).toBe('1228');
    expect(shown(editExpiry(raw('12/2028|', '')))).toBe('12 / 28|');
    expect(shown(editExpiry(raw('1228|', '')))).toBe('12 / 28|');
    expect(shown(editExpiry(raw('12 / 28|', '')))).toBe('12 / 28|');
  });

  it('drops letters', () => {
    expect(shown(editExpiry(raw('12a|', '12 / ')))).toBe('12 / |');
  });
});

describe('editCvc', () => {
  it('keeps digits only, up to the length of the brand', () => {
    expect(shown(editCvc(raw('123|', '12'), 3))).toBe('123|');
    expect(shown(editCvc(raw('1234|', '123'), 3))).toBe('123|');
    expect(shown(editCvc(raw('1234|', '123'), 4))).toBe('1234|');
    expect(editCvc(raw('1 2-3 4|', ''), 3).digits).toBe('123');
  });

  it('drops a letter and keeps the caret where it was', () => {
    expect(shown(editCvc(raw('12a|3', '123'), 3))).toBe('12|3');
    const result = editCvc(raw('1a|', '1'), 3);
    expect(result.digits).toBe('1');
    expect(shown(result)).toBe('1|');
  });
});
