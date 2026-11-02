// The logic behind the card fields: which brand a number is, how digits are grouped as they are
// typed and where the caret goes after they are, and the checks a page can run on a value. Pure,
// no DOM: the fields call it and `cardFormat.test.ts` covers it. A card value is always digits
// (the expiry as `MMYY`); the spaces and the slash only exist in what the field shows.

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay';

type BrandRule = {
  /** The name shown in the pill of the number field. */
  name: string;
  /** Inclusive ranges of leading digits, as strings of one length (`['2221', '2720']`). */
  prefixes: readonly (readonly [from: string, to: string])[];
  /** The numbers of digits the network issues. */
  lengths: readonly number[];
  /** Digits of the security code. */
  cvc: 3 | 4;
};

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// No two brands share a prefix, so the order of the table does not matter. UnionPay takes the whole
// 62 range, including the part of it Discover also accepts.
const BRANDS: Record<CardBrand, BrandRule> = {
  visa: { name: 'Visa', prefixes: [['4', '4']], lengths: [13, 16, 19], cvc: 3 },
  mastercard: {
    name: 'Mastercard',
    prefixes: [
      ['51', '55'],
      ['2221', '2720'],
    ],
    lengths: [16],
    cvc: 3,
  },
  amex: {
    name: 'Amex',
    prefixes: [
      ['34', '34'],
      ['37', '37'],
    ],
    lengths: [15],
    cvc: 4,
  },
  discover: {
    name: 'Discover',
    prefixes: [
      ['6011', '6011'],
      ['644', '649'],
      ['65', '65'],
    ],
    lengths: range(16, 19),
    cvc: 3,
  },
  diners: {
    name: 'Diners Club',
    prefixes: [
      ['300', '305'],
      ['3095', '3095'],
      ['36', '36'],
      ['38', '39'],
    ],
    lengths: range(14, 19),
    cvc: 3,
  },
  jcb: { name: 'JCB', prefixes: [['3528', '3589']], lengths: range(16, 19), cvc: 3 },
  unionpay: { name: 'UnionPay', prefixes: [['62', '62']], lengths: range(16, 19), cvc: 3 },
};

/** What a number with no brand yet may hold: the shortest and longest PAN of any network. */
const UNKNOWN_LENGTHS = range(12, 19);

const digits = (text: string) => text.replace(/\D/g, '');

/**
 * The brand a card number belongs to, from its leading digits, or `null` while they do not tell yet
 * (a lone 5 is a Mastercard only from 51 to 55) or no brand has the prefix. Reads a number as it is
 * shown, spaces and dashes included.
 */
export const cardBrand = (number: string): CardBrand | null => {
  const d = digits(number);
  for (const brand of Object.keys(BRANDS) as CardBrand[]) {
    for (const [from, to] of BRANDS[brand].prefixes) {
      if (d.length < from.length) continue;
      const lead = d.slice(0, from.length);
      if (lead >= from && lead <= to) return brand;
    }
  }
  return null;
};

/** The text of the brand pill: `Visa`, `Mastercard`, `Amex`, `Discover`, `Diners Club`, `JCB`, `UnionPay`. */
export const cardBrandName = (brand: CardBrand): string => BRANDS[brand].name;

/** The numbers of digits the brand issues; 12 to 19 while the brand is `null`. */
export const cardNumberLengths = (brand: CardBrand | null): readonly number[] =>
  brand ? BRANDS[brand].lengths : UNKNOWN_LENGTHS;

const maxNumberLength = (brand: CardBrand | null) => Math.max(...cardNumberLengths(brand));

/** Digits of the security code: 4 for Amex, 3 for every other brand and while there is none. */
export const cardCvcLength = (brand: CardBrand | null): 3 | 4 => (brand ? BRANDS[brand].cvc : 3);

/**
 * The Luhn checksum of a card number (spaces and dashes are ignored; any other character, or a
 * single digit, fails). It catches a mistyped digit, not a card that does not exist. Some UnionPay
 * numbers are issued without the checksum.
 */
export const luhnValid = (number: string): boolean => {
  const d = number.replace(/[\s-]/g, '');
  if (!/^\d{2,}$/.test(d)) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = d.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
};

/**
 * Whether an expiry (`MMYY`, or as it is shown, `MM / YY`) is a real month that is not over: a
 * card holds through the end of the month it names. The year is read in `today`'s century. A date
 * far in the future passes: the page may add a horizon of its own. `today` is the date to compare
 * with, for a test; it defaults to now.
 */
export const expiryValid = (expiry: string, today: Date = new Date()): boolean => {
  const d = digits(expiry);
  if (d.length !== 4) return false;
  const month = Number(d.slice(0, 2));
  if (month < 1 || month > 12) return false;
  const thisYear = today.getFullYear();
  const year = Math.floor(thisYear / 100) * 100 + Number(d.slice(2));
  return year > thisYear || (year === thisYear && month >= today.getMonth() + 1);
};

// ── What the fields show ────────────────────────────────────────────────────

// An Amex groups its 15 digits 4-6-5 and a Diners Club its 14 digits 4-6-4. Anything else, a Diners
// Club of 15 digits or more included, goes in fours.
const spaced = (d: string, brand: CardBrand | null) => {
  const sixes = brand === 'amex' || (brand === 'diners' && d.length <= 14);
  let out = '';
  for (let i = 0; i < d.length; i += 1) {
    if (sixes ? i === 4 || i === 10 : i > 0 && i % 4 === 0) out += ' ';
    out += d[i];
  }
  return out;
};

const limitNumber = (d: string) => d.slice(0, maxNumberLength(cardBrand(d)));

const showNumber = (d: string) => spaced(d, cardBrand(d));

/**
 * The digits of a card number grouped as they are written on the card, with no trailing space:
 * `4111 1111 1111 1111`, an Amex `3782 822463 10005`. Anything that is not a digit goes, and so do
 * the digits past the longest number the brand issues.
 */
export const formatCardNumber = (value: string): string => showNumber(limitNumber(digits(value)));

const limitExpiry = (d: string, typing: boolean) => {
  // A year pasted in four digits (12/2028) keeps its last two.
  let kept = d.length === 6 && d.slice(2, 4) === '20' ? d.slice(0, 2) + d.slice(4) : d;
  kept = kept.slice(0, 4);
  // A first digit from 2 to 9 can only be a month from 02 to 09. Not while deleting: a month
  // shortened to its second digit stays what it is.
  if (typing && kept.length === 1 && kept > '1') kept = `0${kept}`;
  return kept;
};

const showExpiry = (d: string) => (d.length >= 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d);

/** The digits of an expiry as `MM / YY`, with the separator as soon as the month is complete. */
export const formatExpiry = (value: string): string => showExpiry(digits(value).slice(0, 4));

// ── Typing ──────────────────────────────────────────────────────────────────

/** A field right after the user's edit, as the browser left it. */
export type FieldEdit = {
  /** What the field holds now, before it is reformatted. */
  text: string;
  /** The caret in `text` (`selectionStart`). */
  caret: number;
  /** What the field held before the edit, as it was shown. */
  previous: string;
  /** Set when the edit was a deletion (Backspace, Delete, cut), and which way it went. */
  deletion?: 'backward' | 'forward';
};

/** What the field shows after the edit, with the value it stands for and where the caret goes. */
export type EditedField = { digits: string; text: string; caret: number };

type Layout = {
  limit: (d: string, typing: boolean) => string;
  show: (d: string) => string;
};

// The position right after the `count`-th digit of `text`: the caret keeps its place among the
// digits however the separators move around it.
const caretAfter = (text: string, count: number) => {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (/\d/.test(text[i]!)) {
      seen += 1;
      if (seen === count) return i + 1;
    }
  }
  return text.length;
};

const edit = (layout: Layout, { text, caret, previous, deletion }: FieldEdit): EditedField => {
  let d = digits(text);
  let before = digits(text.slice(0, caret)).length;
  // A deletion that took only a separator (Backspace on the space between two groups) changes no
  // digit: showing the same digits again would put the separator back and the caret nowhere. The
  // digit next to it goes instead, the one the user was reaching for.
  if (deletion && d === digits(previous)) {
    const at = deletion === 'backward' ? before - 1 : before;
    if (at >= 0 && at < d.length) {
      d = d.slice(0, at) + d.slice(at + 1);
      before = at;
    }
  }
  const kept = layout.limit(d, !deletion);
  if (kept.length > d.length) before += kept.length - d.length;
  before = Math.min(before, kept.length);
  const shown = layout.show(kept);
  // At the end of the digits, the caret goes to the end of the text, past a separator that follows.
  return {
    digits: kept,
    text: shown,
    caret: before >= kept.length ? shown.length : caretAfter(shown, before),
  };
};

const NUMBER: Layout = { limit: limitNumber, show: showNumber };
const EXPIRY: Layout = { limit: limitExpiry, show: showExpiry };

/**
 * Reformats a card number after an edit: digits grouped by brand, the extra ones cut, the caret kept
 * after the digit it was after (a digit typed or a number pasted in the middle), a deleted separator
 * taking the neighbouring digit with it.
 */
export const editCardNumber = (change: FieldEdit): EditedField => edit(NUMBER, change);

/** Reformats an expiry after an edit: `MM / YY`, a month from 2 to 9 padded, a pasted `12/2028` cut to `12 / 28`. */
export const editExpiry = (change: FieldEdit): EditedField => edit(EXPIRY, change);

/** Keeps the digits of a security code, at most `length` of them. */
export const editCvc = (change: FieldEdit, length: number): EditedField =>
  edit({ limit: (d) => d.slice(0, length), show: (d) => d }, change);
