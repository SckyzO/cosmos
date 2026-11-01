export type HighlightPart = { text: string; match: boolean };

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

/**
 * `text` cut into the parts the words of `query` match and the parts they do not, in order and
 * with the case of `text`. A query with no word marks nothing.
 */
export const highlightParts = (text: string, query: string): HighlightPart[] => {
  if (text === '') return [];
  const expression = wordsExpression(query);
  if (expression === null) return [{ text, match: false }];
  const parts: HighlightPart[] = [];
  let end = 0;
  for (const found of text.matchAll(expression)) {
    if (found.index > end) parts.push({ text: text.slice(end, found.index), match: false });
    parts.push({ text: found[0], match: true });
    end = found.index + found[0].length;
  }
  if (end < text.length) parts.push({ text: text.slice(end), match: false });
  return parts.length > 0 ? parts : [{ text, match: false }];
};
