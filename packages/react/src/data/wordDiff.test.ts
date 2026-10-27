import { describe, expect, it } from 'vitest';
import { isLongText, MAX_DIFF_CELLS, wordDiff, type DiffPart } from './wordDiff';

const side = (parts: DiffPart[], keep: 'delete' | 'insert') =>
  parts
    .filter((part) => part.type === 'equal' || part.type === keep)
    .map((part) => part.text)
    .join('');

const types = (parts: DiffPart[]) => parts.map((part) => part.type);

describe('wordDiff', () => {
  it('is one equal part for identical texts', () => {
    expect(wordDiff('same words here', 'same words here')).toEqual([
      { type: 'equal', text: 'same words here' },
    ]);
  });

  it('is nothing for two empty texts', () => {
    expect(wordDiff('', '')).toEqual([]);
  });

  it('marks an inserted word', () => {
    const parts = wordDiff('the quick fox', 'the quick brown fox');
    expect(parts).toEqual([
      { type: 'equal', text: 'the quick ' },
      { type: 'insert', text: 'brown ' },
      { type: 'equal', text: 'fox' },
    ]);
  });

  it('marks a deleted word', () => {
    const parts = wordDiff('the quick brown fox', 'the quick fox');
    expect(parts).toEqual([
      { type: 'equal', text: 'the quick ' },
      { type: 'delete', text: 'brown ' },
      { type: 'equal', text: 'fox' },
    ]);
  });

  it('marks a replaced word as a delete and an insert', () => {
    const parts = wordDiff('the quick brown fox', 'the quick red fox');
    expect(parts).toEqual([
      { type: 'equal', text: 'the quick ' },
      { type: 'delete', text: 'brown' },
      { type: 'insert', text: 'red' },
      { type: 'equal', text: ' fox' },
    ]);
  });

  it('rebuilds both texts exactly, whitespace included', () => {
    const before = 'one  two\tthree\nfour   five ';
    const after = ' one two  three\nsix five';
    const parts = wordDiff(before, after);
    expect(side(parts, 'delete')).toBe(before);
    expect(side(parts, 'insert')).toBe(after);
  });

  it('sees a change of whitespace only', () => {
    const parts = wordDiff('a b', 'a  b');
    expect(types(parts)).toContain('insert');
    expect(side(parts, 'delete')).toBe('a b');
    expect(side(parts, 'insert')).toBe('a  b');
  });

  it('deletes everything against an empty text, and inserts everything from one', () => {
    expect(wordDiff('gone now', '')).toEqual([{ type: 'delete', text: 'gone now' }]);
    expect(wordDiff('', 'new text')).toEqual([{ type: 'insert', text: 'new text' }]);
  });

  it('keeps the common start and end when it falls back past the size limit', () => {
    const words = Math.ceil(Math.sqrt(MAX_DIFF_CELLS));
    const middle = (prefix: string) =>
      Array.from({ length: words }, (_, i) => `${prefix}${i}`).join(' ');
    const before = `head ${middle('a')} tail`;
    const after = `head ${middle('b')} tail`;
    const parts = wordDiff(before, after);
    expect(types(parts)).toEqual(['equal', 'delete', 'insert', 'equal']);
    expect(parts[0].text).toBe('head ');
    expect(parts[3].text).toBe(' tail');
    expect(side(parts, 'delete')).toBe(before);
    expect(side(parts, 'insert')).toBe(after);
  });

  it('falls back to a whole replace on two long texts with nothing in common', () => {
    const words = Math.ceil(Math.sqrt(MAX_DIFF_CELLS));
    const text = (prefix: string) =>
      Array.from({ length: words }, (_, i) => `${prefix}${i}`).join(' ');
    const parts = wordDiff(text('a'), text('b'));
    expect(parts).toEqual([
      { type: 'delete', text: text('a') },
      { type: 'insert', text: text('b') },
    ]);
  });

  it('still diffs word by word just under the limit', () => {
    // 200 words reversed: no common start or end to cut, a 399 x 399 table.
    const forward = Array.from({ length: 200 }, (_, i) => `w${i}`);
    const before = forward.join(' ');
    const after = [...forward].reverse().join(' ');
    const parts = wordDiff(before, after);
    expect(types(parts)).toContain('equal');
    expect(side(parts, 'delete')).toBe(before);
    expect(side(parts, 'insert')).toBe(after);
  });
});

describe('isLongText', () => {
  it('is false for short values', () => {
    expect(isLongText('Viewer', 'Admin')).toBe(false);
    expect(isLongText('two words', 'three more words')).toBe(false);
  });

  it('is true once either side has enough words', () => {
    expect(isLongText('one two three four', 'one')).toBe(true);
  });

  it('is false when a side is empty: there is nothing to compare', () => {
    expect(isLongText('', 'one two three four five')).toBe(false);
  });
});
