import { describe, expect, it } from 'vitest';
import { highlightParts } from './highlightParts';

const marked = (text: string, query: string) =>
  highlightParts(text, query)
    .filter((part) => part.match)
    .map((part) => part.text);

describe('highlightParts', () => {
  it('marks the query in the text and keeps the text in order', () => {
    expect(highlightParts('Disk alert on rack B4', 'alert')).toEqual([
      { text: 'Disk ', match: false },
      { text: 'alert', match: true },
      { text: ' on rack B4', match: false },
    ]);
  });

  it('is case-insensitive and keeps the case of the text', () => {
    expect(marked('Disk ALERT cleared', 'alert')).toEqual(['ALERT']);
    expect(marked('Disk alert cleared', 'ALERT')).toEqual(['alert']);
    expect(marked('Élan vital', 'élan')).toEqual(['Élan']);
  });

  it('marks every occurrence', () => {
    expect(marked('a1 a2 a3', 'a')).toEqual(['a', 'a', 'a']);
  });

  it('marks each word of the query on its own', () => {
    expect(marked('Disk alert on rack B4', 'alert disk')).toEqual(['Disk', 'alert']);
  });

  it('prefers the longest word where two start at the same place', () => {
    expect(marked('three disks, one disk', 'disk disks')).toEqual(['disks', 'disk']);
  });

  it('marks nothing for an empty query or one made of spaces', () => {
    expect(highlightParts('Disk alert', '')).toEqual([{ text: 'Disk alert', match: false }]);
    expect(highlightParts('Disk alert', '   \t')).toEqual([{ text: 'Disk alert', match: false }]);
  });

  it('marks nothing when the text has no match', () => {
    expect(highlightParts('Disk alert', 'zzz')).toEqual([{ text: 'Disk alert', match: false }]);
  });

  it('gives no part for an empty text', () => {
    expect(highlightParts('', 'a')).toEqual([]);
  });

  it('reads regular expression characters as plain text', () => {
    expect(marked('abc a.c', 'a.c')).toEqual(['a.c']);
    expect(marked('C++ and c', 'c++')).toEqual(['C++']);
    expect(marked('price (net) $5', '(net)')).toEqual(['(net)']);
    expect(marked('pick [a-z] or a', '[a-z]')).toEqual(['[a-z]']);
    expect(marked('a|b and a', 'a|b')).toEqual(['a|b']);
    expect(marked('1+1=2 \\ done', '\\')).toEqual(['\\']);
  });

  it('does not throw on a query that is not a valid expression', () => {
    expect(() => highlightParts('text', '(')).not.toThrow();
    expect(() => highlightParts('text', '[')).not.toThrow();
    expect(() => highlightParts('text', '*')).not.toThrow();
    expect(() => highlightParts('text', '\\')).not.toThrow();
  });

  it('does not read markup in the text or the query as markup', () => {
    expect(highlightParts('<b>bold</b>', 'bold')).toEqual([
      { text: '<b>', match: false },
      { text: 'bold', match: true },
      { text: '</b>', match: false },
    ]);
    expect(marked('<b>bold</b>', '<b>')).toEqual(['<b>']);
  });

  it('rebuilds the text from its parts', () => {
    const text = 'Ana Ruiz asked Li Wei and Sam about the backup';
    expect(
      highlightParts(text, 'a li')
        .map((part) => part.text)
        .join('')
    ).toBe(text);
  });
});
