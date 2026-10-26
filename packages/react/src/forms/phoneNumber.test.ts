import { describe, expect, it } from 'vitest';
import { MAIN_COUNTRIES, PHONE_COUNTRIES } from './phoneCountries';
import {
  ALL_COUNTRIES,
  digitsOf,
  filterCountries,
  flagEmoji,
  isPlausibleNumber,
  matchDialPrefix,
  resolveCountries,
  toE164,
} from './phoneNumber';

describe('PHONE_COUNTRIES', () => {
  it('holds an ISO alpha-2 code and a 1 to 3 digit calling code per row', () => {
    for (const [iso, dial] of Object.entries(PHONE_COUNTRIES)) {
      expect(iso, iso).toMatch(/^[A-Z]{2}$/);
      expect(dial, iso).toMatch(/^[1-9]\d{0,2}$/);
    }
  });

  it('has prefix-free calling codes, so the first match in a number is the code', () => {
    const codes = [...new Set(Object.values(PHONE_COUNTRIES))];
    for (const a of codes) {
      for (const b of codes) if (a !== b) expect(b.startsWith(a), `${a} / ${b}`).toBe(false);
    }
  });

  it('names a main country that has the code, for every code it lists', () => {
    for (const [dial, iso] of Object.entries(MAIN_COUNTRIES)) {
      expect(PHONE_COUNTRIES[iso], dial).toBe(dial);
    }
  });
});

describe('flagEmoji', () => {
  it('turns an ISO code into its two regional indicators', () => {
    expect(flagEmoji('FR')).toBe('\u{1F1EB}\u{1F1F7}');
    expect(flagEmoji('us')).toBe('\u{1F1FA}\u{1F1F8}');
  });
});

describe('digitsOf and toE164', () => {
  it('keeps the digits only', () => {
    expect(digitsOf('+33 (0)6.12-34')).toBe('330612' + '34');
    expect(digitsOf('abc')).toBe('');
  });

  it('joins the calling code and the national digits, or gives an empty string', () => {
    expect(toE164('33', '612345678')).toBe('+33612345678');
    expect(toE164('33', '')).toBe('');
  });
});

describe('isPlausibleNumber', () => {
  it('needs 4 national digits', () => {
    expect(isPlausibleNumber('49', '123')).toBe(false);
    expect(isPlausibleNumber('49', '1234')).toBe(true);
  });

  it('caps the country code and the national number at 15 digits', () => {
    expect(isPlausibleNumber('33', '1'.repeat(13))).toBe(true);
    expect(isPlausibleNumber('33', '1'.repeat(14))).toBe(false);
    expect(isPlausibleNumber('1', '1'.repeat(14))).toBe(true);
  });
});

describe('matchDialPrefix', () => {
  it('finds the country of a unique calling code and the rest of the digits', () => {
    expect(matchDialPrefix('33612345678', ALL_COUNTRIES, 'US')).toEqual({
      country: 'FR',
      rest: '612345678',
    });
    expect(matchDialPrefix('353', ALL_COUNTRIES, 'US')).toEqual({ country: 'IE', rest: '' });
  });

  it('returns null while the digits are not a code yet or are none', () => {
    expect(matchDialPrefix('', ALL_COUNTRIES, 'US')).toBeNull();
    expect(matchDialPrefix('21', ALL_COUNTRIES, 'US')).toBeNull();
    expect(matchDialPrefix('999', ALL_COUNTRIES, 'US')).toBeNull();
  });

  it('keeps the current country when it shares the code', () => {
    expect(matchDialPrefix('14155550100', ALL_COUNTRIES, 'CA')?.country).toBe('CA');
    expect(matchDialPrefix('447911123456', ALL_COUNTRIES, 'JE')?.country).toBe('JE');
    expect(matchDialPrefix('77012345678', ALL_COUNTRIES, 'KZ')?.country).toBe('KZ');
  });

  it('takes the main country of a shared code when the current one has another code', () => {
    expect(matchDialPrefix('14155550100', ALL_COUNTRIES, 'FR')?.country).toBe('US');
    expect(matchDialPrefix('447911123456', ALL_COUNTRIES, 'FR')?.country).toBe('GB');
    expect(matchDialPrefix('79123456789', ALL_COUNTRIES, 'FR')?.country).toBe('RU');
  });

  it('only looks at the allowed countries', () => {
    expect(matchDialPrefix('4915112345678', ['FR', 'BE'], 'FR')).toBeNull();
    // The main country of +44 is not allowed: the first allowed one stands for the code.
    expect(matchDialPrefix('447911123456', ['FR', 'JE', 'GG'], 'FR')?.country).toBe('JE');
  });
});

describe('resolveCountries', () => {
  it('upper-cases, de-duplicates and drops what the table does not know', () => {
    expect(resolveCountries(['fr', 'DE', 'FR', 'ZZ'])).toEqual(['FR', 'DE']);
  });

  it('is every country when the list is missing or holds none the table knows', () => {
    expect(resolveCountries(undefined)).toBe(ALL_COUNTRIES);
    expect(resolveCountries([])).toBe(ALL_COUNTRIES);
    expect(resolveCountries(['ZZ'])).toBe(ALL_COUNTRIES);
  });
});

describe('filterCountries', () => {
  const options = [
    { code: 'DE', name: 'Germany', dial: '49' },
    { code: 'DZ', name: 'Algeria', dial: '213' },
    { code: 'NE', name: 'Niger', dial: '227' },
    { code: 'NG', name: 'Nigeria', dial: '234' },
  ];

  it('matches the name anywhere in it', () => {
    expect(filterCountries(options, 'ger').map((o) => o.code)).toEqual(['DE', 'DZ', 'NE', 'NG']);
  });

  it('matches the start of an ISO code, and the dial code with or without the plus', () => {
    expect(filterCountries(options, 'dz').map((o) => o.code)).toEqual(['DZ']);
    expect(filterCountries(options, '+2').map((o) => o.code)).toEqual(['DZ', 'NE', 'NG']);
    expect(filterCountries(options, '49').map((o) => o.code)).toEqual(['DE']);
  });

  it('keeps every option for an empty query', () => {
    expect(filterCountries(options, '  ')).toBe(options);
  });
});
