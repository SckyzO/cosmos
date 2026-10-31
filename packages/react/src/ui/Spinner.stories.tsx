import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { expect } from 'storybook/test';
import { inEachTheme } from '../storybook-helpers';
import { Button } from './Button';
import { Spinner, type SpinnerIntent } from './Spinner';

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Xs: Story = { args: { size: 'xs' } };
export const Sm: Story = { args: { size: 'sm' } };
export const Md: Story = { args: { size: 'md' } };
export const Lg: Story = { args: { size: 'lg' } };
export const Xl: Story = { args: { size: 'xl' } };

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

const INTENTS = [
  'brand',
  'neutral',
  'success',
  'warning',
  'danger',
] as const satisfies readonly SpinnerIntent[];

export const Intents: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      {INTENTS.map((intent) => (
        <div key={intent} className="flex flex-col items-center gap-2">
          <Spinner intent={intent} size="lg" />
          <span className="text-xs text-gray-600 dark:text-gray-400">{intent}</span>
        </div>
      ))}
    </div>
  ),
};

// `Intents` follows the toolbar's theme menu; this one stays in light.
export const IntentsInLight: Story = {
  ...Intents,
  globals: { theme: 'light' },
};

export const OnDark: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6 rounded-lg bg-black/70 p-6">
      <Spinner size="sm" onDark />
      <Spinner size="md" onDark />
      <Spinner size="lg" onDark />
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// A color as the browser resolves it, read off a probe so the comparison does not depend on how
// the browser writes it (`rgb()`, `color(srgb …)`).
const colorOf = (value: string) => {
  const probe = document.createElement('div');
  probe.style.color = value;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

const isDark = () => {
  const root = document.documentElement;
  return root.classList.contains('dark') || root.classList.contains('deep-blue');
};

// The theme token each arc reads: `-600` in the light themes, `-500` in the dark ones. `brand` keeps
// `brand-500` in both, as the spinner always had.
const ARC_TOKEN: Record<SpinnerIntent, { light: string; dark: string }> = {
  brand: { light: '--color-brand-500', dark: '--color-brand-500' },
  neutral: { light: '--color-gray-500', dark: '--color-gray-400' },
  success: { light: '--color-green-600', dark: '--color-green-500' },
  warning: { light: '--color-amber-600', dark: '--color-amber-500' },
  danger: { light: '--color-red-600', dark: '--color-red-500' },
};

const trackToken = () => (isDark() ? 'var(--color-gray-700)' : 'var(--color-gray-200)');

// The arc is the top border, the track the three others.
const expectRing = (spinner: HTMLElement, arc: string, track: string) => {
  const style = getComputedStyle(spinner);
  expect(style.borderTopColor, 'arc').toBe(colorOf(arc));
  for (const side of [style.borderRightColor, style.borderBottomColor, style.borderLeftColor]) {
    expect(side, 'track').toBe(colorOf(track));
  }
};

export const NoPropRendersTheBrandArc: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner />
      <Spinner intent="brand" />
    </div>
  ),
  play: async ({ canvas }) => {
    // The role and the name are what assistive technology reads: they do not move with the props.
    const spinners = canvas.getAllByRole('status', { name: 'Loading' });
    await expect(spinners).toHaveLength(2);
    inEachTheme(() => {
      for (const spinner of spinners) expectRing(spinner, 'var(--color-brand-500)', trackToken());
    });
  },
};

export const EachIntentSetsItsArc: Story = {
  ...Intents,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const spinners = canvas.getAllByRole('status', { name: 'Loading' });
    await expect(spinners).toHaveLength(INTENTS.length);
    inEachTheme(() => {
      INTENTS.forEach((intent, i) => {
        const arc = ARC_TOKEN[intent][isDark() ? 'dark' : 'light'];
        try {
          expectRing(spinners[i], `var(${arc})`, trackToken());
        } catch (error) {
          throw new Error(`${intent}: ${(error as Error).message}`, { cause: error });
        }
      });
      // Neutral aside, no two intents share an arc: the sets are told apart.
      const arcs = spinners.map((spinner) => getComputedStyle(spinner).borderTopColor);
      expect(new Set(arcs).size, 'two intents share an arc').toBe(INTENTS.length);
    });
  },
};

export const OnDarkIsWhiteInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-wrap items-center gap-6 rounded-lg bg-black/70 p-6">
      <Spinner onDark />
      {/* `onDark` takes the place of `intent`. */}
      <Spinner onDark intent="danger" />
    </div>
  ),
  play: async ({ canvas }) => {
    const spinners = canvas.getAllByRole('status', { name: 'Loading' });
    inEachTheme(() => {
      for (const spinner of spinners) {
        expectRing(
          spinner,
          'var(--color-white)',
          'color-mix(in oklab, var(--color-white) 30%, transparent)'
        );
      }
    });
  },
};

export const XsIsTheSizeOfAnXsButtonIcon: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner size="xs" />
      <Button size="xs" icon={Plus}>
        Add
      </Button>
      <Button size="xs" loading>
        Saving
      </Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const xs = canvas.getByRole('status', { name: 'Loading' });
    const icon = canvas.getByRole('button', { name: 'Add' }).querySelector('svg')!;
    const ring = canvas
      .getByRole('button', { name: 'Saving' })
      .querySelector<HTMLElement>('span[aria-hidden]')!;
    // `offsetWidth`, not the bounding box: the spinner is rotating.
    await expect([xs.offsetWidth, xs.offsetHeight]).toEqual([12, 12]);
    await expect(getComputedStyle(xs).borderTopWidth).toBe('2px');
    await expect(icon.getBoundingClientRect().width).toBe(12);
    // The ring a loading `xs` Button draws for itself has the same box and border.
    await expect([ring.offsetWidth, ring.offsetHeight]).toEqual([12, 12]);
    await expect(getComputedStyle(ring).borderTopWidth).toBe('2px');
  },
};
