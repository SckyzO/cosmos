import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { bothDirections, expectReadsLeftToRight } from '../storybook-helpers';
import { TrendDelta } from './TrendDelta';

const meta = {
  title: 'Data/Trend Delta',
  component: TrendDelta,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 12.4 },
} satisfies Meta<typeof TrendDelta>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A rise is good by default: green pill, upward arrow. */
export const Up: Story = { args: { value: 12.4, label: 'vs last month' } };

/** A drop on a metric that should grow: red pill, downward arrow. */
export const Down: Story = { args: { value: -3.1, label: 'vs last month' } };

/** No change: neutral pill and a flat arrow. */
export const Zero: Story = { args: { value: 0, label: 'vs last month' } };

/**
 * `goodDirection="down"` is for a metric that should shrink (churn, latency, cost): the arrow
 * follows the sign, the color follows whether that is good news. Churn down by 0.6% is green.
 */
export const GoodDirectionDown: Story = {
  args: { value: -0.6, goodDirection: 'down', label: 'vs last month' },
};

export const GoodDirectionDownRising: Story = {
  args: { value: 18, goodDirection: 'down', format: (v) => `${v > 0 ? '+' : ''}${v} ms` },
};

/** `format` writes the value; the default is signed, one decimal, a percent. */
export const CustomFormat: Story = {
  args: { value: 1280, format: (v) => `+${v.toLocaleString('en-US')} users`, label: 'this week' },
};

export const Small: Story = { args: { value: 4.2, size: 'sm', label: 'vs yesterday' } };

/** The comparison text wraps under the pill when the room runs out. */
export const LabelWraps: Story = {
  args: { value: 4.2, label: 'compared with the same period of the previous quarter' },
  render: (args) => (
    <div className="w-48">
      <TrendDelta {...args} />
    </div>
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <TrendDelta value={12.4} label="up, good" />
      <TrendDelta value={-3.1} label="down, bad" />
      <TrendDelta value={0} label="no change" />
      <TrendDelta value={-0.6} goodDirection="down" label="down, good" />
      <TrendDelta value={2.5} goodDirection="down" label="up, bad" />
      <TrendDelta value={12.4} size="sm" label="small" />
    </div>
  ),
};

const pillOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[class*="rounded-full"]') as HTMLElement;

/** The colour follows `goodDirection`, not the sign: only the arrow follows the sign. */
export const ColorFollowsGoodDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <span data-testid="rise-up">
        <TrendDelta value={2} />
      </span>
      <span data-testid="drop-down">
        <TrendDelta value={-2} goodDirection="down" />
      </span>
      <span data-testid="drop-up">
        <TrendDelta value={-2} />
      </span>
      <span data-testid="rise-down">
        <TrendDelta value={2} goodDirection="down" />
      </span>
      <span data-testid="zero">
        <TrendDelta value={0} />
      </span>
    </div>
  ),
  play: async ({ canvas }) => {
    const style = (id: string) => getComputedStyle(pillOf(canvas.getByTestId(id)));
    const good = style('rise-up');
    const bad = style('drop-up');
    expect(style('drop-down').color).toBe(good.color);
    expect(style('drop-down').backgroundColor).toBe(good.backgroundColor);
    expect(style('rise-down').color).toBe(bad.color);
    expect(good.color).not.toBe(bad.color);
    expect(style('zero').color).not.toBe(good.color);
    expect(style('zero').color).not.toBe(bad.color);
    // The arrow follows the sign, whatever the color: a drop is a down arrow even when it is good.
    const arrow = (id: string) =>
      pillOf(canvas.getByTestId(id)).querySelector('svg')?.getAttribute('class');
    expect(arrow('drop-down')).toContain('lucide-trending-down');
    expect(arrow('drop-up')).toContain('lucide-trending-down');
    expect(arrow('rise-down')).toContain('lucide-trending-up');
    expect(arrow('zero')).toContain('lucide-minus');
  },
};

/** The arrow is decorative; hidden text says which way it went, so color is never the only cue. */
export const AccessibleText: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <ul className="flex flex-col items-start gap-2">
      <li data-testid="up">
        <TrendDelta value={12.4} label="vs last month" />
      </li>
      <li data-testid="down">
        <TrendDelta value={-3.1} />
      </li>
      <li data-testid="zero">
        <TrendDelta value={0} />
      </li>
    </ul>
  ),
  play: async ({ canvas }) => {
    const text = (id: string) => canvas.getByTestId(id).textContent;
    expect(text('up')).toBe('increase +12.4%vs last month');
    expect(text('down')).toBe('decrease -3.1%');
    expect(text('zero')).toBe('no change 0.0%');
    expect(canvas.getByTestId('up').querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    // Visually hidden, not display:none: assistive technology still reads it.
    const hidden = canvas.getByTestId('up').querySelector('.sr-only') as HTMLElement;
    expect(getComputedStyle(hidden).position).toBe('absolute');
    expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The value keeps its sign and its percent in a right-to-left page; the arrow still points up or down. */
export const ValueReadsLeftToRightInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-2">
        <TrendDelta value={12.4} />
        <TrendDelta value={-3.1} label="vs last week" />
        <TrendDelta value={0.4} label="30 days" />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const box of canvasElement.querySelectorAll<HTMLElement>('[data-direction]')) {
      expectReadsLeftToRight(within(box).getByText('+12.4%'));
      expectReadsLeftToRight(within(box).getByText('-3.1%'));
      expectReadsLeftToRight(within(box).getByText('30 days'));
      // An arrow that points up or down is not turned around.
      for (const name of ['trending-up', 'trending-down'])
        expect(getComputedStyle(box.querySelector(`svg.lucide-${name}`)!).scale).toBe('none');
    }
  },
};
