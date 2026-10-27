export type DiffPart = {
  type: 'equal' | 'delete' | 'insert';
  text: string;
};

/**
 * Most cells of the LCS table (tokens of the old text × tokens of the new one, after the common
 * start and end are cut off). 250,000 is two paragraphs of about 500 tokens each (250 words and the
 * spaces between them) and 1 MB of memory; past it, a diff would cost the page more than it tells
 * the reader, and the whole old value is shown against the whole new one.
 */
export const MAX_DIFF_CELLS = 250_000;

/** Words and runs of whitespace, so joining the tokens gives the text back exactly. */
const tokenize = (text: string) => text.match(/\s+|\S+/g) ?? [];

/** Fewer words than this on both sides: a short value reads better as before and after. */
const MIN_WORDS = 4;

const wordCount = (text: string) => text.match(/\S+/g)?.length ?? 0;

/** Whether two values are long enough for a word diff to help (and are both non-empty). */
export const isLongText = (before: string, after: string) =>
  before !== '' && after !== '' && Math.max(wordCount(before), wordCount(after)) >= MIN_WORDS;

const push = (parts: DiffPart[], type: DiffPart['type'], text: string) => {
  if (text === '') return;
  const last = parts[parts.length - 1];
  if (last && last.type === type) last.text += text;
  else parts.push({ type, text });
};

/**
 * Word-level diff of two texts, by longest common subsequence of their tokens. The `equal` and
 * `delete` parts joined give `before`, the `equal` and `insert` parts joined give `after`. Past
 * `MAX_DIFF_CELLS` it returns the whole old text deleted and the whole new one inserted.
 */
export const wordDiff = (before: string, after: string): DiffPart[] => {
  if (before === after) return before === '' ? [] : [{ type: 'equal', text: before }];
  const a = tokenize(before);
  const b = tokenize(after);

  // The common start and end need no table.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const parts: DiffPart[] = [];
  push(parts, 'equal', a.slice(0, start).join(''));

  const n = endA - start;
  const m = endB - start;
  if ((n + 1) * (m + 1) > MAX_DIFF_CELLS) {
    // The start and end stay equal: only the middle falls back to a replace.
    push(parts, 'delete', a.slice(start, endA).join(''));
    push(parts, 'insert', b.slice(start, endB).join(''));
  } else {
    // lcs[i][j]: length of the LCS of the last n - i old tokens and the last m - j new ones.
    const width = m + 1;
    const lcs = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        lcs[i * width + j] =
          a[start + i] === b[start + j]
            ? lcs[(i + 1) * width + j + 1] + 1
            : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (a[start + i] === b[start + j]) {
        push(parts, 'equal', a[start + i]);
        i++;
        j++;
      } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) {
        push(parts, 'delete', a[start + i++]);
      } else {
        push(parts, 'insert', b[start + j++]);
      }
    }
    while (i < n) push(parts, 'delete', a[start + i++]);
    while (j < m) push(parts, 'insert', b[start + j++]);
  }

  push(parts, 'equal', a.slice(endA).join(''));
  return parts;
};
