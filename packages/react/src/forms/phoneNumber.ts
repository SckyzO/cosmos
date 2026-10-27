import { MAIN_COUNTRIES, PHONE_COUNTRIES } from './phoneCountries';

/** Fewest digits of the national number (after the country code) PhoneInput accepts. */
export const MIN_NATIONAL_DIGITS = 4;
/** E.164's own bound: the country code and the national number together. */
export const MAX_TOTAL_DIGITS = 15;

/** Shown under a number that does not pass the light check. */
export const PHONE_ERROR = 'Enter a phone number with 4 to 15 digits.';

/** The ISO codes PhoneInput knows, in the order of the table. */
export const ALL_COUNTRIES: readonly string[] = Object.keys(PHONE_COUNTRIES);

/** The country calling code of an ISO code, digits only; `undefined` for a code not in the table. */
export const dialCodeOf = (iso: string): string | undefined => PHONE_COUNTRIES[iso];

/**
 * The flag of an ISO code: the two regional-indicator letters that form it. Decorative only:
 * Windows draws them as the two letters.
 */
export const flagEmoji = (iso: string): string =>
  [...iso.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');

/** Digits of what the user typed, whatever they put between them. */
export const digitsOf = (text: string): string => text.replace(/\D/g, '');

/**
 * The allow-list a host passes, cleaned: upper-cased, without duplicates or codes not in the
 * table. Every country when it is missing, or when nothing in it is known.
 */
export const resolveCountries = (countries: readonly string[] | undefined): readonly string[] => {
  const known = [
    ...new Set((countries ?? []).map((c) => c.toUpperCase()).filter((c) => c in PHONE_COUNTRIES)),
  ];
  return known.length > 0 ? known : ALL_COUNTRIES;
};

/**
 * Light check: the national number has at least `MIN_NATIONAL_DIGITS` digits, and with the
 * country code no more than `MAX_TOTAL_DIGITS`. Real per-country rules need metadata a host can
 * bring through `validate`.
 */
export const isPlausibleNumber = (dial: string, national: string): boolean =>
  national.length >= MIN_NATIONAL_DIGITS && dial.length + national.length <= MAX_TOTAL_DIGITS;

/** `+` and the digits, or `''` when there is no national number. */
export const toE164 = (dial: string, national: string): string =>
  national ? `+${dial}${national}` : '';

type DialMatch = { country: string; rest: string };

/**
 * The country a number's leading calling code points to, and the digits after the code. Codes
 * are prefix-free, so the first length that matches is the code. A code shared by several
 * countries keeps `current` when it has that code, else takes the code's main country (the
 * first of `countries` when the main one is not allowed). `null` when no allowed country has the
 * code.
 */
export const matchDialPrefix = (
  digits: string,
  countries: readonly string[],
  current: string
): DialMatch | null => {
  for (let length = 1; length <= 3 && length <= digits.length; length += 1) {
    const dial = digits.slice(0, length);
    const sharing = countries.filter((c) => PHONE_COUNTRIES[c] === dial);
    if (sharing.length === 0) continue;
    const main = MAIN_COUNTRIES[dial];
    const country = sharing.includes(current)
      ? current
      : main && sharing.includes(main)
        ? main
        : sharing[0]!;
    return { country, rest: digits.slice(length) };
  }
  return null;
};

/** Case-insensitive match on the country name, the ISO code or the dial code (`33` or `+33`). */
export const filterCountries = <T extends { code: string; name: string; dial: string }>(
  options: T[],
  query: string
): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  const dialQuery = q.replace(/^\+/, '');
  return options.filter(
    (o) =>
      o.name.toLowerCase().includes(q) ||
      o.code.toLowerCase().startsWith(q) ||
      (dialQuery !== '' && /^\d+$/.test(dialQuery) && o.dial.startsWith(dialQuery))
  );
};
