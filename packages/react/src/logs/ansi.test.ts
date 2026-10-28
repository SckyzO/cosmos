import { describe, expect, it } from 'vitest';
import {
  ANSI_COLORS,
  PLAIN_STYLE,
  ansi256Color,
  markAnsiSegments,
  nearestAnsiColor,
  parseAnsi,
  stripAnsi,
} from './ansi';

const ESC = '\x1b';
const sgr = (codes: string) => `${ESC}[${codes}m`;
const texts = (input: string) => parseAnsi(input).map((segment) => segment.text);

describe('parseAnsi: plain text', () => {
  it('returns nothing for an empty line', () => {
    expect(parseAnsi('')).toEqual([]);
  });

  it('returns one plain segment for a line without escapes', () => {
    expect(parseAnsi('pnpm test')).toEqual([{ text: 'pnpm test', style: PLAIN_STYLE }]);
  });

  it('keeps markup as text', () => {
    expect(texts('<img src=x onerror=alert(1)>')).toEqual(['<img src=x onerror=alert(1)>']);
  });

  it('keeps tabs and drops the other control characters', () => {
    expect(texts('a\tb\x07c\x08d\x7fe')).toEqual(['a\tbcde']);
  });
});

describe('parseAnsi: the 16 colours', () => {
  it('reads the 8 normal foregrounds and backgrounds', () => {
    ANSI_COLORS.slice(0, 8).forEach((color, index) => {
      expect(parseAnsi(`${sgr(String(30 + index))}x`)[0]!.style.fg).toBe(color);
      expect(parseAnsi(`${sgr(String(40 + index))}x`)[0]!.style.bg).toBe(color);
    });
  });

  it('reads the 8 bright foregrounds and backgrounds', () => {
    ANSI_COLORS.slice(8).forEach((color, index) => {
      expect(parseAnsi(`${sgr(String(90 + index))}x`)[0]!.style.fg).toBe(color);
      expect(parseAnsi(`${sgr(String(100 + index))}x`)[0]!.style.bg).toBe(color);
    });
  });

  it('combines a foreground, a background and attributes in one sequence', () => {
    expect(parseAnsi(`${sgr('1;31;44')}x`)).toEqual([
      { text: 'x', style: { ...PLAIN_STYLE, bold: true, fg: 'red', bg: 'blue' } },
    ]);
  });

  it('resets the default foreground (39) and background (49) on their own', () => {
    const [, second] = parseAnsi(`${sgr('31;42')}a${sgr('39')}b`);
    expect(second!.style).toEqual({ ...PLAIN_STYLE, bg: 'green' });
    const [, third] = parseAnsi(`${sgr('31;42')}a${sgr('49')}b`);
    expect(third!.style).toEqual({ ...PLAIN_STYLE, fg: 'red' });
  });
});

describe('parseAnsi: attributes', () => {
  it('reads bold, dim, italic and underline', () => {
    expect(parseAnsi(`${sgr('1')}a`)[0]!.style.bold).toBe(true);
    expect(parseAnsi(`${sgr('2')}a`)[0]!.style.dim).toBe(true);
    expect(parseAnsi(`${sgr('3')}a`)[0]!.style.italic).toBe(true);
    expect(parseAnsi(`${sgr('4')}a`)[0]!.style.underline).toBe(true);
  });

  it('turns them off with 22, 23 and 24 (22 clears bold and dim)', () => {
    const style = parseAnsi(`${sgr('1;2;3;4')}a${sgr('22')}b${sgr('23')}c${sgr('24')}d`).map(
      (segment) => segment.style
    );
    expect(style[1]).toEqual({ ...PLAIN_STYLE, italic: true, underline: true });
    expect(style[2]).toEqual({ ...PLAIN_STYLE, underline: true });
    expect(style[3]).toEqual(PLAIN_STYLE);
  });

  it('resets everything with 0 and with an empty sequence', () => {
    expect(parseAnsi(`${sgr('1;31;42')}a${sgr('0')}b`)[1]!.style).toEqual(PLAIN_STYLE);
    expect(parseAnsi(`${sgr('1;31;42')}a${sgr('')}b`)[1]!.style).toEqual(PLAIN_STYLE);
  });

  it('ignores the codes it does not draw (blink, reverse, strike)', () => {
    expect(parseAnsi(`${sgr('5;7;9')}a`)).toEqual([{ text: 'a', style: PLAIN_STYLE }]);
  });
});

describe('parseAnsi: segments', () => {
  it('cuts the line where the style changes', () => {
    expect(parseAnsi(`ok ${sgr('32')}passed${sgr('0')} in 4s`)).toEqual([
      { text: 'ok ', style: PLAIN_STYLE },
      { text: 'passed', style: { ...PLAIN_STYLE, fg: 'green' } },
      { text: ' in 4s', style: PLAIN_STYLE },
    ]);
  });

  it('merges adjacent runs of the same style', () => {
    expect(parseAnsi(`${sgr('31')}a${sgr('31')}b`)).toEqual([
      { text: 'ab', style: { ...PLAIN_STYLE, fg: 'red' } },
    ]);
  });

  it('draws no segment for a sequence with no text', () => {
    expect(parseAnsi(`${sgr('31')}${sgr('0')}`)).toEqual([]);
  });

  it('carries the style over a sequence that is dropped', () => {
    expect(parseAnsi(`${sgr('31')}a${ESC}[2Kb`)).toEqual([
      { text: 'ab', style: { ...PLAIN_STYLE, fg: 'red' } },
    ]);
  });
});

describe('parseAnsi: 256 colours and truecolor', () => {
  it('maps the first 16 indexes to the colours themselves', () => {
    expect(parseAnsi(`${sgr('38;5;1')}x`)[0]!.style.fg).toBe('red');
    expect(parseAnsi(`${sgr('38;5;12')}x`)[0]!.style.fg).toBe('brightBlue');
    expect(parseAnsi(`${sgr('48;5;15')}x`)[0]!.style.bg).toBe('brightWhite');
  });

  it('maps the cube and the gray ramp to the nearest of the 16', () => {
    expect(parseAnsi(`${sgr('38;5;196')}x`)[0]!.style.fg).toBe('brightRed');
    expect(parseAnsi(`${sgr('38;5;46')}x`)[0]!.style.fg).toBe('brightGreen');
    expect(parseAnsi(`${sgr('38;5;232')}x`)[0]!.style.fg).toBe('black');
    expect(parseAnsi(`${sgr('38;5;244')}x`)[0]!.style.fg).toBe('brightBlack');
    expect(parseAnsi(`${sgr('38;5;255')}x`)[0]!.style.fg).toBe('white');
  });

  it('maps a truecolor triplet to the nearest of the 16', () => {
    expect(parseAnsi(`${sgr('38;2;255;0;0')}x`)[0]!.style.fg).toBe('brightRed');
    expect(parseAnsi(`${sgr('38;2;200;10;10')}x`)[0]!.style.fg).toBe('red');
    expect(parseAnsi(`${sgr('48;2;0;0;40')}x`)[0]!.style.bg).toBe('black');
  });

  it('reads the colon forms', () => {
    expect(parseAnsi(`${sgr('38:5:196')}x`)[0]!.style.fg).toBe('brightRed');
    expect(parseAnsi(`${sgr('38:2::255:0:0')}x`)[0]!.style.fg).toBe('brightRed');
    expect(parseAnsi(`${sgr('48:2:0:0:238')}x`)[0]!.style.bg).toBe('blue');
  });

  it('does not read the arguments of an extended colour as codes of their own', () => {
    // 38;5;1 is a color index, not bold (1): the line stays regular.
    const [segment] = parseAnsi(`${sgr('38;5;1')}x`);
    expect(segment!.style.bold).toBe(false);
    expect(parseAnsi(`${sgr('38;2;1;1;1;31')}x`)[0]!.style.fg).toBe('red');
  });

  it('ignores an index or a channel out of range', () => {
    expect(parseAnsi(`${sgr('38;5;300')}x`)[0]!.style.fg).toBeNull();
    expect(parseAnsi(`${sgr('38;2;999;0;0')}x`)[0]!.style.fg).toBeNull();
    expect(parseAnsi(`${sgr('38;5')}x`)[0]!.style.fg).toBeNull();
  });
});

describe('nearestAnsiColor and ansi256Color', () => {
  it('picks the closest of the 16 by distance in RGB', () => {
    expect(nearestAnsiColor(0, 0, 0)).toBe('black');
    expect(nearestAnsiColor(255, 255, 255)).toBe('brightWhite');
    expect(nearestAnsiColor(130, 130, 130)).toBe('brightBlack');
    expect(nearestAnsiColor(0, 200, 210)).toBe('cyan');
    expect(nearestAnsiColor(-20, 300, 0)).toBe('brightGreen');
  });

  it('returns null for an index that is not 0 to 255', () => {
    expect(ansi256Color(-1)).toBeNull();
    expect(ansi256Color(256)).toBeNull();
    expect(ansi256Color(1.5)).toBeNull();
  });
});

describe('parseAnsi: the sequences that are dropped', () => {
  it('drops cursor moves and erases', () => {
    expect(texts(`${ESC}[2K${ESC}[1Gdone${ESC}[3A${ESC}[?25l`)).toEqual(['done']);
  });

  it('drops a private SGR-looking sequence', () => {
    expect(texts(`${ESC}[>4;2mdone`)).toEqual(['done']);
    expect(parseAnsi(`${ESC}[>4;2mdone`)[0]!.style).toEqual(PLAIN_STYLE);
  });

  it('drops an OSC sequence ended by BEL or by ST', () => {
    expect(texts(`${ESC}]0;title\x07shown`)).toEqual(['shown']);
    expect(texts(`${ESC}]8;;https://example.com${ESC}\\link${ESC}]8;;${ESC}\\`)).toEqual(['link']);
  });

  it('drops a string sequence with no terminator up to the end', () => {
    expect(texts(`shown${ESC}]0;title`)).toEqual(['shown']);
  });

  it('drops a two-byte escape and a charset selection', () => {
    expect(texts(`${ESC}ca${ESC}(Bb${ESC}7c`)).toEqual(['abc']);
  });

  it('drops a CSI cut short by the end, and a lone escape', () => {
    expect(texts(`a${ESC}[31`)).toEqual(['a']);
    expect(texts(`a${ESC}`)).toEqual(['a']);
  });

  it('reads the C1 form of the CSI', () => {
    expect(parseAnsi('\x9b31mred')[0]!.style.fg).toBe('red');
  });
});

describe('parseAnsi: carriage return', () => {
  it('keeps only the last segment of the line', () => {
    expect(texts('10%\r50%\r100% done')).toEqual(['100% done']);
  });

  it('keeps the style set before the carriage return', () => {
    expect(parseAnsi(`${sgr('32')}old\rnew`)).toEqual([
      { text: 'new', style: { ...PLAIN_STYLE, fg: 'green' } },
    ]);
  });

  it('ignores a trailing carriage return or newline, as a CRLF line has', () => {
    expect(texts('built\r')).toEqual(['built']);
    expect(texts('built\r\n')).toEqual(['built']);
  });

  it('reads a line with a long run of line ends inside it in linear time', () => {
    // A trailing `/[\r\n]+$/` retries the whole run from each of its characters: 2 s here.
    const line = `${'\n'.repeat(50_000)}x`;
    const start = performance.now();
    expect(parseAnsi(line)).toEqual([{ text: line, style: PLAIN_STYLE }]);
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe('stripAnsi', () => {
  it('gives the text a reader sees', () => {
    expect(stripAnsi(`${sgr('1;32')}ok${sgr('0')} ${ESC}[2Kdone`)).toBe('ok done');
    expect(stripAnsi('50%\r100%')).toBe('100%');
  });

  it('returns a plain line as it is', () => {
    expect(stripAnsi('plain line')).toBe('plain line');
  });
});

describe('markAnsiSegments', () => {
  const red = { ...PLAIN_STYLE, fg: 'red' } as const;
  const segments = [
    { text: 'ab', style: PLAIN_STYLE },
    { text: 'cdef', style: red },
    { text: 'gh', style: PLAIN_STYLE },
  ];

  it('returns the segments unmarked without a range', () => {
    expect(markAnsiSegments(segments, [])).toEqual(segments.map((s) => ({ ...s, match: false })));
  });

  it('cuts a segment at the edges of a match and keeps its style', () => {
    expect(markAnsiSegments(segments, [[1, 3]])).toEqual([
      { text: 'a', style: PLAIN_STYLE, match: false },
      { text: 'b', style: PLAIN_STYLE, match: true },
      { text: 'c', style: red, match: true },
      { text: 'def', style: red, match: false },
      { text: 'gh', style: PLAIN_STYLE, match: false },
    ]);
  });

  it('marks a match that spans segments and several matches in one', () => {
    const pieces = markAnsiSegments(segments, [
      [1, 7],
      [7, 8],
    ]);
    expect(pieces.filter((p) => p.match).map((p) => p.text)).toEqual(['b', 'cdef', 'g', 'h']);
    expect(pieces.map((p) => p.text).join('')).toBe('abcdefgh');
  });

  it('marks a whole line', () => {
    expect(markAnsiSegments(segments, [[0, 8]]).every((piece) => piece.match)).toBe(true);
  });
});
