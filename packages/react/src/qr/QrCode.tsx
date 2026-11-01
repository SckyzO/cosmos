import { clsx } from 'clsx';
import { useMemo, type Ref } from 'react';
import { matrixPath, qrMatrix, type QrEcc } from './qrMatrix';

export type QrCodeProps = {
  /**
   * The text to encode: a link, an `otpauth://` URI, a pairing code. A value too long for the
   * level (about 2.3 KB at `medium`) throws an error that names the level.
   */
  value: string;
  /**
   * Accessible name: what the code is for ("Authenticator setup code"). A screen reader cannot
   * read a code, so give the same data as text next to it.
   */
  label: string;
  /** Side of the square in pixels, quiet zone included. It shrinks in a narrower parent. Default `192`. */
  size?: number;
  /**
   * How much of the code can be lost and still scan: `low` 7%, `medium` 15%, `quartile` 25%,
   * `high` 30%. A higher level draws more modules for the same text. Default `medium`.
   */
  ecc?: QrEcc;
  className?: string;
  /** Ref to the `<svg>`. */
  ref?: Ref<SVGSVGElement>;
};

/**
 * QrCode — a QR code drawn as one SVG path, from the `qr` package (an optional peer dependency of
 * the `/qr` entry).
 *
 * The tile is white and the modules black in every theme, with the four-module quiet zone the
 * standard asks for inside it. A dark theme keeps the light tile instead of flipping the colors:
 * readers handle an inverted code unevenly. No semantic color variable fits (they all turn dark
 * with the theme), so the tile takes the two ends of the palette, `white` and `black`: the sand
 * theme tints the white slightly, and nothing else redefines either. Right to left does not
 * mirror it.
 */
export const QrCode = ({
  value,
  label,
  size = 192,
  ecc = 'medium',
  className,
  ref,
}: QrCodeProps) => {
  const { side, path } = useMemo(() => {
    const matrix = qrMatrix(value, ecc);
    return { side: matrix.length, path: matrixPath(matrix) };
  }, [value, ecc]);
  return (
    <svg
      ref={ref}
      role="img"
      aria-label={label}
      viewBox={`0 0 ${side} ${side}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={clsx('h-auto max-w-full rounded-sm bg-white text-black', className)}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
};
