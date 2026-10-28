// The ANSI escape codes of a job's output, read as text and styles. Pure, so it is tested in Node.
// Only the SGR codes (colours and text attributes) are kept; every other escape sequence is
// dropped. The result is a list of text segments, never HTML: the component draws each as a span.

/** The 16 colours of the terminal, in SGR order: the 8 normal ones, then their bright variants. */
export const ANSI_COLORS = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite',
] as const;

export type AnsiColor = (typeof ANSI_COLORS)[number];

/** How a run of text is drawn. `null` is the default colour of the tone. */
export type AnsiStyle = {
  fg: AnsiColor | null;
  bg: AnsiColor | null;
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
};

/** A run of text and its style. */
export type AnsiSegment = { text: string; style: AnsiStyle };

/** No colour, no attribute: what a reset gives. */
export const PLAIN_STYLE: AnsiStyle = {
  fg: null,
  bg: null,
  bold: false,
  dim: false,
  italic: false,
  underline: false,
};

// The 16 colours as a terminal draws them (xterm's palette): what a 256-colour index or an RGB
// triplet is compared with.
const REFERENCE: readonly (readonly [number, number, number])[] = [
  [0, 0, 0],
  [205, 0, 0],
  [0, 205, 0],
  [205, 205, 0],
  [0, 0, 238],
  [205, 0, 205],
  [0, 205, 205],
  [229, 229, 229],
  [127, 127, 127],
  [255, 0, 0],
  [0, 255, 0],
  [255, 255, 0],
  [92, 92, 255],
  [255, 0, 255],
  [0, 255, 255],
  [255, 255, 255],
];

const clamp = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

/** The one of the 16 colours closest to `r`, `g`, `b` (0 to 255 each), by distance in RGB. */
export const nearestAnsiColor = (r: number, g: number, b: number): AnsiColor => {
  const [red, green, blue] = [clamp(r), clamp(g), clamp(b)];
  let best = 0;
  let bestDistance = Infinity;
  REFERENCE.forEach(([cr, cg, cb], index) => {
    const distance = (red - cr) ** 2 + (green - cg) ** 2 + (blue - cb) ** 2;
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return ANSI_COLORS[best]!;
};

const CUBE = [0, 95, 135, 175, 215, 255];

/**
 * The colour of a 256-colour index: 0 to 15 are the 16 colours themselves, 16 to 231 a 6x6x6
 * cube and 232 to 255 a gray ramp, the last two matched to the nearest of the 16. `null` for
 * anything that is not an index of 0 to 255.
 */
export const ansi256Color = (index: number): AnsiColor | null => {
  if (!Number.isInteger(index) || index < 0 || index > 255) return null;
  if (index < 16) return ANSI_COLORS[index]!;
  if (index >= 232) {
    const level = 8 + (index - 232) * 10;
    return nearestAnsiColor(level, level, level);
  }
  const cube = index - 16;
  return nearestAnsiColor(
    CUBE[Math.floor(cube / 36)]!,
    CUBE[Math.floor(cube / 6) % 6]!,
    CUBE[cube % 6]!
  );
};

const sameStyle = (a: AnsiStyle, b: AnsiStyle) =>
  a.fg === b.fg &&
  a.bg === b.bg &&
  a.bold === b.bold &&
  a.dim === b.dim &&
  a.italic === b.italic &&
  a.underline === b.underline;

/** A channel of a truecolor sequence: a whole number of 0 to 255, or `null`. */
const channel = (token: string | undefined): number | null => {
  if (token === undefined || token === '' || !/^\d+$/.test(token)) return null;
  const value = Number(token);
  return value <= 255 ? value : null;
};

const fromIndex = (token: string | undefined): AnsiColor | null =>
  token === undefined || !/^\d+$/.test(token) ? null : ansi256Color(Number(token));

const fromRgb = (r?: string, g?: string, b?: string): AnsiColor | null => {
  const [red, green, blue] = [channel(r), channel(g), channel(b)];
  return red === null || green === null || blue === null
    ? null
    : nearestAnsiColor(red, green, blue);
};

/** Applies the parameters of one SGR sequence (`1;31`, empty for a reset) to `current`. */
const applySgr = (current: AnsiStyle, parameters: string): AnsiStyle => {
  const tokens = parameters === '' ? ['0'] : parameters.split(';');
  let style = current;
  for (let at = 0; at < tokens.length; at++) {
    const token = tokens[at]!;
    // The colon form of an extended colour: `38:5:196`, `38:2::255:0:0`, `38:2:255:0:0`.
    if (token.includes(':')) {
      const [head, mode, ...rest] = token.split(':');
      if (head !== '38' && head !== '48') continue;
      const color =
        mode === '5' ? fromIndex(rest[0]) : mode === '2' ? fromRgb(...rest.slice(-3)) : null;
      if (color !== null) style = head === '38' ? { ...style, fg: color } : { ...style, bg: color };
      continue;
    }
    if (token !== '' && !/^\d+$/.test(token)) continue;
    const code = token === '' ? 0 : Number(token);
    if (code === 0) style = PLAIN_STYLE;
    else if (code === 1) style = { ...style, bold: true };
    else if (code === 2) style = { ...style, dim: true };
    else if (code === 3) style = { ...style, italic: true };
    else if (code === 4) style = { ...style, underline: true };
    else if (code === 22) style = { ...style, bold: false, dim: false };
    else if (code === 23) style = { ...style, italic: false };
    else if (code === 24) style = { ...style, underline: false };
    else if (code >= 30 && code <= 37) style = { ...style, fg: ANSI_COLORS[code - 30]! };
    else if (code >= 90 && code <= 97) style = { ...style, fg: ANSI_COLORS[code - 90 + 8]! };
    else if (code >= 40 && code <= 47) style = { ...style, bg: ANSI_COLORS[code - 40]! };
    else if (code >= 100 && code <= 107) style = { ...style, bg: ANSI_COLORS[code - 100 + 8]! };
    else if (code === 39) style = { ...style, fg: null };
    else if (code === 49) style = { ...style, bg: null };
    else if (code === 38 || code === 48) {
      // The semicolon form: `38;5;n` or `38;2;r;g;b`. Its arguments are consumed even when they
      // are not valid, so they are not read as codes of their own.
      const mode = tokens[at + 1];
      const color =
        mode === '5'
          ? fromIndex(tokens[at + 2])
          : mode === '2'
            ? fromRgb(tokens[at + 2], tokens[at + 3], tokens[at + 4])
            : null;
      at += mode === '5' ? 2 : mode === '2' ? 4 : 0;
      if (color !== null) style = code === 38 ? { ...style, fg: color } : { ...style, bg: color };
    }
  }
  return style;
};

// One token of the input, besides plain text: a CSI sequence (captured: its parameters, its
// intermediate bytes and its final byte), a string sequence (OSC, DCS, SOS, PM, APC) up to its
// terminator or the end, a CSI sequence cut short by the end, any other escape sequence, a carriage return, or a control character.
const TOKEN =
  // eslint-disable-next-line no-control-regex
  /(?:\x1b\[|\x9b)([0-?]*)([ -/]*)([@-~])|\x1b[\]PX^_][\s\S]*?(?:\x07|\x1b\\|$)|\x1b\[[0-?]*[ -/]*$|\x1b[ -/]*[0-~]?|\r|[\x00-\x08\x0b\x0c\x0e-\x1a\x1c-\x1f\x7f]/g;
// eslint-disable-next-line no-control-regex
const HAS_CONTROL = /[\x00-\x08\x0b-\x1f\x7f\x9b]/;

/**
 * `input` without the `\r` and `\n` at its end. A loop, since `/[\r\n]+$/` is quadratic on a long
 * run of them followed by text.
 */
const trimLineEnd = (input: string): string => {
  let end = input.length;
  while (end > 0 && (input[end - 1] === '\n' || input[end - 1] === '\r')) end--;
  return input.slice(0, end);
};

/**
 * The text of a line of output as segments, each with its style. SGR sequences set the style
 * (the 16 colours and their bright variants, bold, dim, italic, underline, reset; a 256-colour
 * index or a truecolor triplet becomes the nearest of the 16). Every other escape sequence and
 * control character is dropped. A carriage return erases what came before it on the line, as a
 * progress bar does, so only the last segment is kept (a line's trailing `\r` or `\n` is just
 * its end). Adjacent runs of one style are one segment; an empty line has no segment.
 */
export const parseAnsi = (input: string): AnsiSegment[] => {
  const line = trimLineEnd(input);
  if (!HAS_CONTROL.test(line)) return line === '' ? [] : [{ text: line, style: PLAIN_STYLE }];
  let segments: AnsiSegment[] = [];
  let style = PLAIN_STYLE;
  const push = (text: string) => {
    if (text === '') return;
    const last = segments[segments.length - 1];
    if (last && sameStyle(last.style, style)) last.text += text;
    else segments.push({ text, style });
  };
  let from = 0;
  for (const token of line.matchAll(TOKEN)) {
    push(line.slice(from, token.index));
    from = token.index + token[0].length;
    if (token[0] === '\r') segments = [];
    else if (token[3] === 'm' && /^[\d;:]*$/.test(token[1]!) && token[2] === '') {
      style = applySgr(style, token[1]!);
    }
  }
  push(line.slice(from));
  return segments;
};

/** The text of a line of output without its escape sequences, as `parseAnsi` reads it. */
export const stripAnsi = (input: string): string =>
  HAS_CONTROL.test(input)
    ? parseAnsi(input)
        .map((segment) => segment.text)
        .join('')
    : input;

/** A piece of a segment: the text, the style of the segment and whether a search matches it. */
export type AnsiPiece = AnsiSegment & { match: boolean };

/**
 * `segments` cut at the edges of `ranges`, the `[start, end)` offsets of the matches in the
 * plain text of the line (ascending, not overlapping). A piece inside a range is a match.
 */
export const markAnsiSegments = (
  segments: readonly AnsiSegment[],
  ranges: readonly (readonly [number, number])[]
): AnsiPiece[] => {
  if (ranges.length === 0) return segments.map((segment) => ({ ...segment, match: false }));
  const pieces: AnsiPiece[] = [];
  let offset = 0;
  let range = 0;
  for (const segment of segments) {
    const end = offset + segment.text.length;
    let at = offset;
    while (at < end) {
      while (range < ranges.length && ranges[range]![1] <= at) range++;
      const current = ranges[range];
      if (current === undefined || current[0] >= end) {
        pieces.push({ ...segment, text: segment.text.slice(at - offset), match: false });
        break;
      }
      if (current[0] > at) {
        pieces.push({
          ...segment,
          text: segment.text.slice(at - offset, current[0] - offset),
          match: false,
        });
        at = current[0];
      }
      const stop = Math.min(current[1], end);
      pieces.push({
        ...segment,
        text: segment.text.slice(at - offset, stop - offset),
        match: true,
      });
      at = stop;
    }
    offset = end;
  }
  return pieces;
};
