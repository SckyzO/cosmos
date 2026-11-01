import { describe, expect, it } from 'vitest';
import { matrixPath, qrMatrix, QUIET_ZONE, type QrEcc } from './qrMatrix';

const OTP_URI = 'otpauth://totp/Acme:ann@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Acme';
const LEVELS: QrEcc[] = ['low', 'medium', 'quartile', 'high'];

// The path's own commands read back into a grid, so the drawing is compared with the matrix and
// not with another copy of the code that built it.
const rasterize = (path: string, size: number) => {
  const grid = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  for (const [, x, y, run] of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    for (let i = 0; i < Number(run); i++) grid[Number(y)][Number(x) + i] = true;
  }
  return grid;
};

describe('qrMatrix', () => {
  it('is a square: a QR symbol of 17 + 4 × version modules, and the quiet zone on every side', () => {
    const matrix = qrMatrix(OTP_URI, 'medium');
    const side = matrix.length;
    expect(matrix.every((row) => row.length === side)).toBe(true);
    expect((side - 2 * QUIET_ZONE - 17) % 4).toBe(0);
    expect(side - 2 * QUIET_ZONE).toBeGreaterThanOrEqual(21);
  });

  it('leaves four light modules around the symbol, as the standard asks', () => {
    expect(QUIET_ZONE).toBe(4);
    for (const ecc of LEVELS) {
      const matrix = qrMatrix(OTP_URI, ecc);
      const last = matrix.length - 1;
      for (let i = 0; i < QUIET_ZONE; i++) {
        expect(matrix[i].some(Boolean), `${ecc}: row ${i}`).toBe(false);
        expect(matrix[last - i].some(Boolean), `${ecc}: row ${last - i}`).toBe(false);
        expect(
          matrix.some((row) => row[i]),
          `${ecc}: column ${i}`
        ).toBe(false);
        expect(
          matrix.some((row) => row[last - i]),
          `${ecc}: column ${last - i}`
        ).toBe(false);
      }
    }
  });

  it('starts the symbol with the three finder patterns, a dark ring of 7 modules', () => {
    const matrix = qrMatrix('hello', 'medium');
    const symbol = matrix.length - 2 * QUIET_ZONE;
    const at = (x: number, y: number) => matrix[QUIET_ZONE + y][QUIET_ZONE + x];
    for (const [x0, y0] of [
      [0, 0],
      [symbol - 7, 0],
      [0, symbol - 7],
    ]) {
      for (let i = 0; i < 7; i++) {
        expect(at(x0 + i, y0)).toBe(true);
        expect(at(x0 + i, y0 + 6)).toBe(true);
        expect(at(x0, y0 + i)).toBe(true);
        expect(at(x0 + 6, y0 + i)).toBe(true);
      }
      // The ring is lit, the line inside it is not, and the centre is.
      expect(at(x0 + 1, y0 + 1)).toBe(false);
      expect(at(x0 + 3, y0 + 3)).toBe(true);
    }
  });

  it('grows with the error correction level for the same text', () => {
    const sides = LEVELS.map((ecc) => qrMatrix(OTP_URI, ecc).length);
    expect(sides).toEqual([...sides].sort((a, b) => a - b));
    expect(new Set(sides).size).toBe(4);
  });

  it('encodes UTF-8 text', () => {
    expect(qrMatrix('héllo, wörld €', 'medium').length).toBeGreaterThan(2 * QUIET_ZONE + 17);
  });

  it('names the component, the level and the reason when the text does not fit, cause kept', () => {
    let error: Error | undefined;
    try {
      qrMatrix('x'.repeat(4000), 'low');
    } catch (thrown) {
      error = thrown as Error;
    }
    expect(error?.message).toMatch(/^QrCode: .*ecc="low"/);
    expect(error?.cause).toBeInstanceOf(Error);
    expect(error?.message).toContain((error?.cause as Error).message);
  });

  it('holds more text at a lower level', () => {
    const text = 'x'.repeat(2000);
    expect(() => qrMatrix(text, 'low')).not.toThrow();
    expect(() => qrMatrix(text, 'high')).toThrow(/QrCode/);
  });
});

describe('matrixPath', () => {
  it('draws a horizontal run of dark modules as one rectangle, row by row', () => {
    expect(
      matrixPath([
        [true, true, false],
        [false, true, false],
        [true, false, true],
      ])
    ).toBe('M0 0h2v1h-2zM1 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1z');
  });

  it('draws nothing for a light matrix', () => {
    expect(matrixPath([[false, false]])).toBe('');
  });

  it('draws exactly the dark modules of a real symbol, at every level', () => {
    for (const ecc of LEVELS) {
      const matrix = qrMatrix(OTP_URI, ecc);
      expect(rasterize(matrixPath(matrix), matrix.length), ecc).toEqual(matrix);
    }
  });

  it('keeps the quiet zone out of the path', () => {
    const matrix = qrMatrix(OTP_URI, 'medium');
    const path = matrixPath(matrix);
    const xs = [...path.matchAll(/M(\d+) (\d+)h(\d+)/g)].flatMap(([, x, , run]) => [
      Number(x),
      Number(x) + Number(run),
    ]);
    const ys = [...path.matchAll(/M\d+ (\d+)/g)].flatMap(([, y]) => [Number(y), Number(y) + 1]);
    const side = matrix.length;
    expect(Math.min(...xs, ...ys)).toBeGreaterThanOrEqual(QUIET_ZONE);
    expect(Math.max(...xs, ...ys)).toBeLessThanOrEqual(side - QUIET_ZONE);
  });
});
