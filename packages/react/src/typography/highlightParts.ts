export type HighlightPart = { text: string; match: boolean };

export type HighlightPartsOptions = {
  /** Match a letter whatever its accents, on both sides. Off by default. */
  ignoreAccents?: boolean;
};

const escapeRegExp = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The expression that finds any word of `query`, or `null` for a query with no word. Longest
 * word first, so `disks` is not cut short by `disk` where both start at the same place. Every
 * character is escaped: the query is text, never a pattern.
 */
const wordsExpression = (query: string): RegExp | null => {
  const words = [...new Set(query.split(/\s+/).filter(Boolean))].sort(
    (a, b) => b.length - a.length
  );
  return words.length > 0 ? new RegExp(words.map(escapeRegExp).join('|'), 'giu') : null;
};

/** `value` without the accents Unicode decomposes: `é` is `e`, `Å` is `A`, `ø` stays `ø`. */
const withoutAccents = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '');

/**
 * `text` without its accents, and for each UTF-16 unit of the result the span of `text` it came
 * from (`starts[i]` to `ends[i]`), so a match in the plain text maps back onto the text as written.
 * A mark of its own (the accent of a decomposed `é`) has no unit: it joins the letter before it, so
 * the match takes it along.
 */
const foldWithSpans = (text: string) => {
  let plain = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let at = 0;
  for (const char of text) {
    const next = at + char.length;
    const folded = withoutAccents(char);
    if (folded === '') {
      if (ends.length > 0) ends[ends.length - 1] = next;
    } else {
      for (let unit = 0; unit < folded.length; unit++) {
        starts.push(at);
        ends.push(next);
      }
      plain += folded;
    }
    at = next;
  }
  return { plain, starts, ends };
};

/**
 * `text` cut into the parts the words of `query` match and the parts they do not, in order and
 * with the case of `text`. A query with no word marks nothing. With `ignoreAccents`, the words are
 * looked for in the text and the query without their accents, and a part is still cut from `text`
 * as written.
 */
export const highlightParts = (
  text: string,
  query: string,
  { ignoreAccents = false }: HighlightPartsOptions = {}
): HighlightPart[] => {
  if (text === '') return [];
  const expression = wordsExpression(ignoreAccents ? withoutAccents(query) : query);
  if (expression === null) return [{ text, match: false }];
  const spans = ignoreAccents ? foldWithSpans(text) : null;
  const parts: HighlightPart[] = [];
  let end = 0;
  for (const found of (spans?.plain ?? text).matchAll(expression)) {
    const last = found.index + found[0].length - 1;
    // A letter that folds to several units (a Hangul syllable) can be found in two matches: the
    // second starts where the first ended.
    const from = Math.max(spans ? spans.starts[found.index]! : found.index, end);
    const to = spans ? spans.ends[last]! : last + 1;
    if (to <= from) continue;
    if (from > end) parts.push({ text: text.slice(end, from), match: false });
    parts.push({ text: text.slice(from, to), match: true });
    end = to;
  }
  if (end < text.length) parts.push({ text: text.slice(end), match: false });
  return parts.length > 0 ? parts : [{ text, match: false }];
};
