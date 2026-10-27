import { createElement, Fragment, isValidElement, type ReactNode } from 'react';

// Pure helpers behind CodeBlock's line-based variants (line numbers, highlighted
// lines, diff, terminal). They work on strings and React nodes, with no DOM.

export type CodeRowKind = 'plain' | 'add' | 'remove' | 'command' | 'continued' | 'output';

export type CodeRow = {
  /** What the row shows, without the diff sign or the prompt. */
  text: string;
  kind: CodeRowKind;
};

export type CodeMode = 'plain' | 'diff' | 'terminal';

export type ParsedCode = {
  rows: CodeRow[];
  /** What the highlighter gets: the rows that are code, signs and prompts left out. */
  highlightText: string;
  /** What the copy button writes. */
  copyText: string;
};

const PROMPT = '$ ';

/** `a\nb\n` is two lines, not three: a final newline ends the last line. */
const toLines = (code: string) => {
  const lines = code.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
};

/**
 * Splits `code` into the rows CodeBlock draws.
 *
 * - `plain`: one row per line, the code is copied as is.
 * - `diff`: the first column of a line is its sign, as in a unified diff: `+` is an added row, `-`
 *   a removed one, a space an unchanged one. The sign is dropped from the text (CodeBlock draws it
 *   in a gutter nobody copies) and so from the copy. A line with no sign is kept as written.
 * - `terminal`: a line starting with `$ ` is a command, the lines a trailing `\` continues are part
 *   of it (`continued` rows), any other line is output. Only the commands are highlighted and copied, without the
 *   prompt.
 */
export const parseCode = (code: string, mode: CodeMode = 'plain'): ParsedCode => {
  const lines = toLines(code);
  let rows: CodeRow[];
  if (mode === 'diff') {
    rows = lines.map((line): CodeRow => {
      if (line.startsWith('+')) return { text: line.slice(1), kind: 'add' };
      if (line.startsWith('-')) return { text: line.slice(1), kind: 'remove' };
      // The first column is the sign column, as in a unified diff: a space marks an unchanged line.
      return { text: line.startsWith(' ') ? line.slice(1) : line, kind: 'plain' };
    });
  } else if (mode === 'terminal') {
    let continued = false;
    rows = lines.map((line): CodeRow => {
      const isCommand = line.startsWith(PROMPT);
      if (!isCommand && !continued) return { text: line, kind: 'output' };
      const text = isCommand ? line.slice(PROMPT.length) : line;
      continued = text.endsWith('\\');
      return { text, kind: isCommand ? 'command' : 'continued' };
    });
  } else {
    rows = lines.map((text): CodeRow => ({ text, kind: 'plain' }));
  }
  if (mode === 'plain') return { rows, highlightText: code, copyText: code };
  const text = rows
    .filter((row) => row.kind !== 'output')
    .map((row) => row.text)
    .join('\n');
  return { rows, highlightText: text, copyText: text };
};

/** The 1-based line numbers a `highlightLines` list names: `[3, '5-7']` is 3, 5, 6 and 7. */
export const parseLineRanges = (spec: ReadonlyArray<number | string>): Set<number> => {
  const lines = new Set<number>();
  for (const item of spec) {
    if (typeof item === 'number') {
      if (Number.isInteger(item) && item > 0) lines.add(item);
      continue;
    }
    const match = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(item);
    if (!match) continue;
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    for (let n = Math.max(1, Math.min(from, to)); n <= Math.max(from, to); n++) lines.add(n);
  }
  return lines;
};

/** The text a node renders. */
export const textOf = (node: ReactNode): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
};

const join = (parts: ReactNode[][][]): ReactNode[][] => {
  const lines: ReactNode[][] = [[]];
  for (const part of parts) {
    lines[lines.length - 1].push(...part[0]);
    lines.push(...part.slice(1));
  }
  return lines;
};

const split = (node: ReactNode): ReactNode[][] => {
  if (node == null || typeof node === 'boolean') return [[]];
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
      .split('\n')
      .map((text) => (text ? [text] : []));
  }
  if (Array.isArray(node)) return join(node.map(split));
  if (isValidElement<{ children?: ReactNode }>(node)) {
    const { children } = node.props;
    if (children === undefined) return [[node]];
    const lines = split(children);
    // No newline inside: the element stays whole, and so does its key.
    if (lines.length === 1) return [[node]];
    // Not `cloneElement(node, undefined, ...pieces)`: with no pieces it keeps the original children.
    return lines.map((pieces) => [
      createElement(node.type, { ...node.props, key: node.key, children: undefined }, ...pieces),
    ]);
  }
  return [[node]];
};

/**
 * Cuts the nodes a highlighter returned for the whole code into one node per line, closing and
 * reopening an element (a multi-line comment) at each newline.
 *
 * Highlighting the whole code keeps what only a whole-text pass knows (a string or a comment that
 * spans lines). The cut holds for any highlighter that renders its tokens as elements with
 * children; when the text of the lines is not the text of `lines` (a highlighter that renders the
 * code some other way), the plain text is used.
 */
export const splitLines = (lines: string[], highlighted: ReactNode): ReactNode[] => {
  const parts = split(highlighted);
  if (parts.length > 1 && parts[parts.length - 1].length === 0) parts.pop();
  // Static children: the pieces need no keys.
  const nodes = parts.map((pieces) => createElement(Fragment, null, ...pieces));
  const sameText =
    nodes.length === lines.length && nodes.every((node, i) => textOf(node) === lines[i]);
  return sameText ? nodes : lines;
};
