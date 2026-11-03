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

  it('tells an accent from its letter by default', () => {
    expect(marked('été', 'ete')).toEqual([]);
    expect(marked('ete', 'été')).toEqual([]);
    expect(marked('Élan vital', 'élan')).toEqual(['Élan']);
  });
});

describe('highlightParts with ignoreAccents', () => {
  const folded = (text: string, query: string) =>
    highlightParts(text, query, { ignoreAccents: true })
      .filter((part) => part.match)
      .map((part) => part.text);

  it('finds an accented word from its plain letters, with the text as written', () => {
    expect(folded('Un été à Zürich', 'ete zurich')).toEqual(['été', 'Zürich']);
    expect(highlightParts('Un été', 'ete', { ignoreAccents: true })).toEqual([
      { text: 'Un ', match: false },
      { text: 'été', match: true },
    ]);
  });

  it('finds a plain word from the accented query, and an accent from another accent', () => {
    expect(folded('Zurich et cafe', 'zürich café')).toEqual(['Zurich', 'cafe']);
    expect(folded('crème', 'creme')).toEqual(['crème']);
    expect(folded('crème', 'crèmé')).toEqual(['crème']);
  });

  it('keeps ignoring the case', () => {
    expect(folded('ÉTÉ indien', 'ete')).toEqual(['ÉTÉ']);
    expect(folded('Ångström', 'ANGSTROM')).toEqual(['Ångström']);
  });

  it('takes the marks of a decomposed letter along with it', () => {
    const decomposed = 'e\u0301te\u0301 chaud';
    expect(folded(decomposed, 'ete')).toEqual(['e\u0301te\u0301']);
    expect(folded(decomposed, 'e\u0301te\u0301')).toEqual(['e\u0301te\u0301']);
    expect(folded('caf\u00e9', 'cafe\u0301')).toEqual(['caf\u00e9']);
  });

  it('marks part of a word and leaves the rest as written', () => {
    expect(highlightParts('éléphant', 'ele', { ignoreAccents: true })).toEqual([
      { text: 'élé', match: true },
      { text: 'phant', match: false },
    ]);
  });

  it('rebuilds the text from its parts', () => {
    for (const text of [
      'Un été à Zürich, café crème',
      'e\u0301te\u0301 \u0301 stray mark',
      '\u{1F600} café \u{1F600}',
      '한국어 café',
    ]) {
      expect(
        highlightParts(text, 'e a cafe', { ignoreAccents: true })
          .map((part) => part.text)
          .join('')
      ).toBe(text);
    }
  });

  it('keeps the positions right after a character of two code units', () => {
    expect(folded('\u{1F600} café', 'cafe')).toEqual(['café']);
    expect(folded('\u{1F600}\u{1F600} été', 'ete')).toEqual(['été']);
  });

  it('does not fold a letter Unicode does not decompose', () => {
    expect(folded('Søren', 'soren')).toEqual([]);
    expect(folded('Søren', 'sø')).toEqual(['Sø']);
  });

  it('marks nothing for a query made of marks only', () => {
    expect(folded('été', '\u0301')).toEqual([]);
  });

  it('still reads the query as text', () => {
    expect(folded('prix (été) $5', '(ete)')).toEqual(['(été)']);
  });
});
