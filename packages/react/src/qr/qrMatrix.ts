import { encodeQR } from 'qr';

/** How much of the symbol the error correction can lose: 7%, 15%, 25% and 30%. */
export type QrEcc = 'low' | 'medium' | 'quartile' | 'high';

/** Light modules around the symbol on every side: the 4 the QR standard (ISO/IEC 18004) asks for. */
export const QUIET_ZONE = 4;

/**
 * The modules of the QR code for `value`, the quiet zone included, `true` for a dark one. Only the
 * encoding can fail (a text that does not fit), so only it is wrapped: the library's own message
 * ("Capacity overflow") says nothing of the component or of the level that was asked for, and is
 * kept in the new one.
 */
export const qrMatrix = (value: string, ecc: QrEcc): boolean[][] => {
  try {
    return encodeQR(value, 'raw', { ecc, border: QUIET_ZONE });
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`QrCode: cannot encode the value at ecc="${ecc}" (${reason}).`, { cause });
  }
};

/**
 * One SVG path for the dark modules of `matrix`, on a grid of unit squares: a run of dark modules
 * along a row is one rectangle, which keeps the path short.
 */
export const matrixPath = (matrix: boolean[][]): string => {
  let path = '';
  matrix.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      const start = x;
      while (row[x + 1]) x++;
      const run = x - start + 1;
      path += `M${start} ${y}h${run}v1h-${run}z`;
    }
  });
  return path;
};
