import { createElement, Fragment, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { parseCode, parseLineRanges, splitLines, textOf } from './codeLines';

describe('parseCode', () => {
  it('plain: one row per line, a final newline ends the last line, the copy is the code', () => {
    const parsed = parseCode('a\n\nb\n');
    expect(parsed.rows.map((row) => row.text)).toEqual(['a', '', 'b']);
    expect(parsed.copyText).toBe('a\n\nb\n');
    expect(parsed.highlightText).toBe('a\n\nb\n');
    expect(parseCode('').rows).toEqual([{ text: '', kind: 'plain' }]);
  });

  it('diff: marks the added and removed lines, drops the signs from the text and the copy', () => {
    const parsed = parseCode('   keep\n-old: 1\n+new: 2\n+new: 3\n@@ hunk', 'diff');
    expect(parsed.rows).toEqual([
      { text: '  keep', kind: 'plain' },
      { text: 'old: 1', kind: 'remove' },
      { text: 'new: 2', kind: 'add' },
      { text: 'new: 3', kind: 'add' },
      { text: '@@ hunk', kind: 'plain' },
    ]);
    expect(parsed.copyText).toBe('  keep\nold: 1\nnew: 2\nnew: 3\n@@ hunk');
    expect(parsed.highlightText).toBe(parsed.copyText);
  });

  it('terminal: commands lose their prompt, output stays apart, only commands are copied', () => {
    const parsed = parseCode('$ ls -l\ntotal 0\n$ echo hi\nhi', 'terminal');
    expect(parsed.rows).toEqual([
      { text: 'ls -l', kind: 'command' },
      { text: 'total 0', kind: 'output' },
      { text: 'echo hi', kind: 'command' },
      { text: 'hi', kind: 'output' },
    ]);
    expect(parsed.copyText).toBe('ls -l\necho hi');
    expect(parsed.highlightText).toBe('ls -l\necho hi');
  });

  it('terminal: a trailing backslash continues the command onto the next lines', () => {
    const parsed = parseCode(
      '$ helm install x \\\n  --namespace y \\\n  --wait\nready',
      'terminal'
    );
    expect(parsed.rows.map((row) => row.kind)).toEqual([
      'command',
      'continued',
      'continued',
      'output',
    ]);
    expect(parsed.copyText).toBe('helm install x \\\n  --namespace y \\\n  --wait');
  });

  it('terminal: a session with no command copies nothing', () => {
    expect(parseCode('just output', 'terminal').copyText).toBe('');
  });
});

describe('parseLineRanges', () => {
  it('reads numbers and ranges, 1-based', () => {
    expect([...parseLineRanges([3, '5-7'])]).toEqual([3, 5, 6, 7]);
    expect([...parseLineRanges(['2', ' 4 - 5 '])]).toEqual([2, 4, 5]);
  });

  it('takes a reversed range in order and ignores what is not a line', () => {
    expect([...parseLineRanges(['7-5'])]).toEqual([5, 6, 7]);
    expect([...parseLineRanges([0, -1, 1.5, 'a', '', '3-'])]).toEqual([]);
  });

  it('takes linear time on a long run of spaces that does not match', () => {
    // Two `\s*` side by side made the old regex backtrack quadratically on a host's string.
    const start = performance.now();
    expect([...parseLineRanges([`9${' '.repeat(30_000)}x`])]).toEqual([]);
    expect(performance.now() - start).toBeLessThan(50);
  });
});

const span = (...children: ReactNode[]) => createElement('span', null, ...children);

describe('splitLines', () => {
  it('cuts the nodes of a whole-code highlight into one node per line', () => {
    const highlighted = createElement(Fragment, null, span('a'), '\n', span('b'), '\n', span('c'));
    const nodes = splitLines(['a', 'b', 'c'], highlighted);
    expect(nodes.map(textOf)).toEqual(['a', 'b', 'c']);
  });

  it('closes and reopens an element that spans lines', () => {
    // A multi-line comment is one token for the highlighter.
    const nodes = splitLines(['/* a', ' b */', 'x'], [span('/* a\n b */'), '\nx']);
    expect(nodes.map(textOf)).toEqual(['/* a', ' b */', 'x']);
    expect(nodes[0]).toMatchObject({ type: Fragment });
  });

  it('cuts an element that starts or ends with a newline, leaving the empty piece empty', () => {
    // One fragment per line, the newline inside the next one: how the built-in highlighter renders.
    const highlighted = [
      createElement(Fragment, { key: 0 }, span('a')),
      createElement(Fragment, { key: 1 }, '\n', span('b')),
      createElement(Fragment, { key: 2 }, '\n', span('c'), '\n'),
    ];
    expect(splitLines(['a', 'b', 'c'], highlighted).map(textOf)).toEqual(['a', 'b', 'c']);
  });

  it('ignores the newline that ends the text', () => {
    expect(splitLines(['a', 'b'], span('a\nb\n')).map(textOf)).toEqual(['a', 'b']);
  });

  it('falls back to the plain lines when the nodes are not the code', () => {
    expect(splitLines(['a', 'b'], span('something else'))).toEqual(['a', 'b']);
    expect(splitLines(['a', 'b'], null)).toEqual(['a', 'b']);
    expect(splitLines(['a', 'b'], 'a')).toEqual(['a', 'b']);
  });
});
