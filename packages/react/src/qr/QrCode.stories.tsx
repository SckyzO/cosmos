import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import {
  expectNoHorizontalOverflow,
  expectTextContrast,
  inDirection,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import { QrCode } from './QrCode';
import { qrMatrix, type QrEcc } from './qrMatrix';

// What an authenticator app reads when a person enrols: the account, the shared secret, the issuer.
const SETUP_URI = 'otpauth://totp/Cosmos:ann@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Cosmos';
const LEVELS: QrEcc[] = ['low', 'medium', 'quartile', 'high'];

const meta = {
  title: 'Media/QR Code',
  component: QrCode,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: SETUP_URI, label: 'Authenticator setup code' },
} satisfies Meta<typeof QrCode>;

export default meta;
type Story = StoryObj<typeof meta>;

// The `<svg>` of the code in the canvas, and the single path that draws its dark modules.
const codeOf = (canvasElement: HTMLElement, name: string) => {
  const svg = canvasElement.querySelector<SVGSVGElement>(`svg[aria-label="${name}"]`);
  if (!svg) throw new Error(`no QR code named "${name}"`);
  return svg;
};
const pathOf = (svg: SVGSVGElement) => svg.querySelector('path')!;

// Canvas round trip, as the shared helpers do it: any CSS colour (the `oklch` of the sand theme
// included) as red, green and blue bytes.
const rgb = (color: string) => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('No 2D canvas context');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
};

/** Dark modules on a light tile, with the quiet zone inside it. The size is the whole tile. */
export const Default: Story = {};

/** The same text at each level: a higher one draws more modules, so each module is smaller. */
export const ErrorCorrection: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-6">
      {LEVELS.map((ecc) => (
        <figure key={ecc} className="m-0">
          <QrCode {...args} ecc={ecc} size={160} label={`${args.label}, ${ecc} level`} />
          <figcaption className="mt-2 text-xs text-[var(--color-text-muted)]">{ecc}</figcaption>
        </figure>
      ))}
    </div>
  ),
};

/** `size` is a side in pixels. Choose it for the distance the code is read from. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-6">
      {[128, 192, 256].map((size) => (
        <figure key={size} className="m-0">
          <QrCode {...args} size={size} label={`${args.label}, ${size} pixels`} />
          <figcaption className="mt-2 text-xs text-[var(--color-text-muted)]">{size}px</figcaption>
        </figure>
      ))}
    </div>
  ),
};

/** A code wider than its parent shrinks with it, square, instead of widening the page. */
export const ShrinksOnAPhone: Story = {
  globals: mobileViewport,
  args: { size: 480 },
};

// ── Checks ───────────────────────────────────────────────────────────────────

export const DrawsOneCrispPathChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, canvasElement }) => {
    const code = codeOf(canvasElement, args.label);
    expect(canvas.getByRole('img', { name: args.label })).toBe(code);
    expect(code).not.toHaveAttribute('tabindex');
    // The size is the tile, and the tile is square.
    const box = code.getBoundingClientRect();
    expect(box.width).toBeCloseTo(192, 0);
    expect(box.height).toBeCloseTo(192, 0);
    // One path draws every dark module, with its edges on the pixel grid.
    expect(code.querySelectorAll('path')).toHaveLength(1);
    expect(code).toHaveAttribute('shape-rendering', 'crispEdges');
    expect(pathOf(code).getAttribute('d')).toMatch(/^M\d+ \d+h\d+v1h-\d+z/);
    // A QR symbol is 17 + 4 × version modules, and the tile adds the four of the quiet zone on
    // each side: the dark modules stop exactly four modules from every edge.
    const side = code.viewBox.baseVal.width;
    expect(code.viewBox.baseVal.height).toBe(side);
    expect((side - 8 - 17) % 4).toBe(0);
    const dark = pathOf(code).getBBox();
    expect(dark.x).toBeCloseTo(4, 5);
    expect(dark.y).toBeCloseTo(4, 5);
    expect(dark.x + dark.width).toBeCloseTo(side - 4, 5);
    expect(dark.y + dark.height).toBeCloseTo(side - 4, 5);
  },
};

/** Dark themes keep the light tile: the code reads the same in all four, never inverted. */
export const TileStaysLightInEveryThemeChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvasElement }) => {
    const code = codeOf(canvasElement, args.label);
    const modules = pathOf(code);
    inEachTheme(() => {
      const tile = rgb(getComputedStyle(code).backgroundColor);
      const dark = rgb(getComputedStyle(modules).fill);
      expect(Math.min(...tile), `the tile is ${tile}`).toBeGreaterThanOrEqual(240);
      expect(Math.max(...dark), `the modules are ${dark}`).toBeLessThanOrEqual(40);
      expectTextContrast(modules, 15);
    });
  },
};

export const ErrorCorrectionGrowsTheCodeChecks: Story = {
  ...ErrorCorrection,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvasElement }) => {
    const sides = LEVELS.map(
      (ecc) => codeOf(canvasElement, `${args.label}, ${ecc} level`).viewBox.baseVal.width
    );
    expect(sides).toEqual([...sides].sort((a, b) => a - b));
    expect(new Set(sides).size).toBe(4);
  },
};

export const ShrinksOnAPhoneChecks: Story = {
  ...ShrinksOnAPhone,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvasElement }) => {
    const code = codeOf(canvasElement, args.label);
    const box = code.getBoundingClientRect();
    expect(box.width).toBeLessThan(480);
    expect(box.width).toBeLessThanOrEqual(canvasElement.clientWidth);
    expect(box.height).toBeCloseTo(box.width, 0);
    expectNoHorizontalOverflow(canvasElement);
  },
};

/**
 * The code drawn is the matrix of its text at the default level, module for module, and it reads
 * the same under `dir="rtl"`: a mirrored QR code is one no reader decodes. Each module is hit-tested
 * at its centre, so a transform or a flipped axis shows.
 */
export const DrawsTheMatrixInBothDirectionsChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvasElement }) => {
    const code = codeOf(canvasElement, args.label);
    const matrix = qrMatrix(args.value, 'medium');
    expect(code.viewBox.baseVal.width).toBe(matrix.length);
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, () => {
        const tile = code.getBoundingClientRect();
        const module = tile.width / matrix.length;
        const wrong = matrix.flatMap((row, y) =>
          row.flatMap((dark, x) => {
            const hit = document.elementFromPoint(
              tile.left + (x + 0.5) * module,
              tile.top + (y + 0.5) * module
            );
            return (hit === pathOf(code)) === dark ? [] : [`${x},${y}`];
          })
        );
        expect(wrong, `${dir}: modules that differ from the matrix`).toEqual([]);
      });
    }
  },
};

// `ref` is a prop: it holds the `<svg>` of the code.
let received: SVGSVGElement | null = null;
export const RefIsTheSvgChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <QrCode
      {...args}
      ref={(element) => {
        received = element;
      }}
    />
  ),
  play: async ({ args, canvasElement }) => {
    expect(received).toBeInstanceOf(SVGSVGElement);
    expect(received).toBe(codeOf(canvasElement, args.label));
  },
};
