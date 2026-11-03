import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { isFading, scrimLook, themeColor } from '../storybook-motion';
import { Backdrop, type BackdropVariant } from './Backdrop';

const meta = {
  title: 'Atoms/Backdrop',
  component: Backdrop,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Backdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClickToToggle: Story = {
  render: () => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative h-screen w-full bg-[var(--color-bg-base)]">
        <div className="p-6">
          <button
            type="button"
            onClick={() => setShow(true)}
            className="bg-brand-500 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            Show backdrop
          </button>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Click the backdrop to dismiss it.
          </p>
        </div>
        {show && <Backdrop onClick={() => setShow(false)} />}
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** The backdrop covers the viewport above the page, and a click on it calls `onClick`. */
export const ClickDismissesIt: Story = {
  tags: ['!dev', '!autodocs'],
  render: ClickToToggle.render,
  play: async ({ canvas, canvasElement }) => {
    const backdrop = () => canvasElement.querySelector<HTMLElement>('div[aria-hidden]');
    await expect(backdrop()).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Show backdrop' }));
    const layer = backdrop();
    await expect(layer).not.toBeNull();
    const { top, left, width, height } = layer!.getBoundingClientRect();
    await expect([top, left, width, height]).toEqual([
      0,
      0,
      document.documentElement.clientWidth,
      window.innerHeight,
    ]);
    await expect(getComputedStyle(layer!).zIndex).toBe('30');

    await userEvent.click(layer!);
    await expect(backdrop()).toBeNull();
  },
};

// ── Variants ─────────────────────────────────────────────────────────────────

const VARIANTS: { variant: BackdropVariant; note: string }[] = [
  { variant: 'dim', note: 'The colour alone. No blur: the cheapest on a large page.' },
  { variant: 'blur', note: 'An 8px blur under a light veil: the page stays recognisable.' },
  { variant: 'blur-dark', note: 'An 8px blur under a dark veil: the page recedes.' },
];

// A transformed box is the containing block of its fixed children, so each scrim covers its own
// card and not the viewport.
const Card = ({ variant, note }: { variant: BackdropVariant; note: string }) => (
  <div
    data-variant={variant}
    className="relative h-56 translate-x-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4 text-[var(--color-text-primary)]"
  >
    <h3 className="text-sm font-semibold">{variant}</h3>
    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{note}</p>
    <div className="mt-4 flex gap-2">
      <span className="bg-brand-500 h-8 w-20 rounded-md" />
      <span className="h-8 w-20 rounded-md bg-gray-300 dark:bg-gray-600" />
      <span className="h-8 w-20 rounded-md bg-[var(--color-border)]" />
    </div>
    <p className="mt-4 text-base font-medium">The page behind the scrim, in a box.</p>
    <Backdrop variant={variant} zIndex={1} />
  </div>
);

/**
 * The three scrims side by side, each over the same page in a box: `dim` (the default, colour
 * alone), `blur` and `blur-dark`. The colours are the theme's, one set per theme: switch the
 * Theme menu to see them.
 */
export const Variants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      {VARIANTS.map(({ variant, note }) => (
        <Card key={variant} variant={variant} note={note} />
      ))}
    </div>
  ),
};

const SCRIM_COLOUR: Record<BackdropVariant, string> = {
  dim: '--color-scrim-dim',
  blur: '--color-scrim-blur',
  'blur-dark': '--color-scrim-blur-dark',
};

/**
 * Each variant paints its theme colour, and only the blurred ones blur (8px). Holds in every
 * theme: the colour is compared with the variable's, read through a probe.
 */
export const VariantsLookTheirPart: Story = {
  tags: ['!dev', '!autodocs'],
  render: Variants.render,
  play: async ({ canvasElement }) => {
    const colours = new Set<string>();
    for (const { variant } of VARIANTS) {
      const scrim = canvasElement.querySelector<HTMLElement>(
        `[data-variant="${variant}"] [data-slot="backdrop"]`
      )!;
      const look = scrimLook(scrim);
      await expect(look.colour, variant).toBe(themeColor(SCRIM_COLOUR[variant]));
      await expect(look.filter, variant).toBe(variant === 'dim' ? 'none' : 'blur(8px)');
      colours.add(look.colour);
    }
    // Three veils, not one.
    await expect(colours.size).toBe(3);
  },
};

/** The default is `dim`: the colour alone, no blur. */
export const DimIsTheDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="relative h-40 translate-x-0 overflow-hidden">
      <Backdrop zIndex={1} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const look = scrimLook(canvasElement.querySelector<HTMLElement>('[data-slot="backdrop"]')!);
    await expect(look.colour).toBe(themeColor('--color-scrim-dim'));
    await expect(look.filter).toBe('none');
  },
};

/** A scrim fades in on mount and out when `open` turns false, with the clicks cut as it goes. */
export const FadesInAndOut: Story = {
  parameters: { layout: 'padded', settleMotion: false },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative h-56 translate-x-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4">
        <button
          type="button"
          onClick={() => setOpen((was) => !was)}
          className="bg-brand-500 rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          {open ? 'Hide the scrim' : 'Show the scrim'}
        </button>
        <Backdrop zIndex={1} open={open} onClick={() => setOpen(false)} />
      </div>
    );
  },
};

export const FadesInAndOutChecks: Story = {
  ...FadesInAndOut,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const scrim = () => canvasElement.querySelector<HTMLElement>('[data-slot="backdrop"]')!;
    // Closed: transparent and out of the pointer's way.
    await expect(getComputedStyle(scrim()).opacity).toBe('0');
    await expect(getComputedStyle(scrim()).pointerEvents).toBe('none');

    await userEvent.click(canvas.getByRole('button', { name: 'Show the scrim' }));
    // Just shown, it is on its way up, not there yet.
    await expect(isFading(scrim())).toBe(true);
    await waitFor(() => expect(getComputedStyle(scrim()).opacity).toBe('1'));
    await expect(getComputedStyle(scrim()).pointerEvents).toBe('auto');

    await userEvent.click(scrim());
    await waitFor(() => expect(getComputedStyle(scrim()).opacity).toBe('0'));
    await expect(getComputedStyle(scrim()).pointerEvents).toBe('none');
  },
};
