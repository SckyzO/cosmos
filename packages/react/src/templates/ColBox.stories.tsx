import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { endEdge, startEdge } from '../storybook-helpers';
import { ColBox } from './ColBox';

const meta = {
  title: 'Layout/Col Box',
  component: ColBox,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: '50%' },
} satisfies Meta<typeof ColBox>;

export default meta;
type Story = StoryObj<typeof meta>;

// The checks of a visible story live in a hidden twin: out of the sidebar and the docs page.
const HIDDEN = ['!dev', '!autodocs'];
// A laptop, past `lg` (1024px), where the sidebar layout is in place.
const LAPTOP = { viewport: { value: 'laptop', isRotated: false } } as const;

/** A box takes the width its parent gives it: here half of the row, in a `w-1/2` wrapper. */
export const Default: Story = {
  render: (args) => (
    <div data-testid="row">
      <div className="w-1/2">
        <ColBox {...args} />
      </div>
    </div>
  ),
};

/** `grid-cols-2`: two equal columns. */
export const Halves: Story = {
  render: () => (
    <div data-testid="row" className="grid grid-cols-2 gap-4">
      <ColBox label="50%" />
      <ColBox label="50%" />
    </div>
  ),
};

/** `grid-cols-[1fr_3fr_1fr]`: a content column between two narrow ones, in the ratio 1:3:1. */
export const Triple: Story = {
  render: () => (
    <div data-testid="row" className="grid grid-cols-[1fr_3fr_1fr] gap-4">
      <ColBox label="20%" />
      <ColBox label="60%" />
      <ColBox label="20%" />
    </div>
  ),
};

/** `grid-cols-4`: four equal columns. */
export const Quarters: Story = {
  render: () => (
    <div data-testid="row" className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((n) => (
        <ColBox key={n} label="25%" />
      ))}
    </div>
  ),
};

/** `lg:grid-cols-[18rem_1fr]`: a fixed sidebar and a content column that takes the rest, stacked below `lg`. */
export const SidebarAndContent: Story = {
  render: () => (
    <div data-testid="row" className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <ColBox label="18rem" height={160} />
      <ColBox label="1fr" height={160} />
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * Each label tells the truth: a `%` is the box's share of the room the boxes divide among them
 * (the row less the gaps, which is what `fr` columns split), a `rem` is that many rems. A label
 * that said 20 / 60 / 20 over three equal thirds once passed unnoticed.
 */
const labelsAreTrue: Story['play'] = async ({ canvas }) => {
  const row = canvas.getByTestId('row');
  const boxes = [...row.querySelectorAll<HTMLElement>('span')].map((label) => label.parentElement!);
  const columns = getComputedStyle(row).gridTemplateColumns.split(' ').length;
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const room = row.clientWidth - gap * (columns - 1);
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  await expect(boxes.length).toBeGreaterThan(0);
  let measured = 0;
  for (const box of boxes) {
    const label = box.textContent!;
    const width = box.getBoundingClientRect().width;
    const percent = /^(\d+(?:\.\d+)?)%$/.exec(label)?.[1];
    const rems = /^(\d+(?:\.\d+)?)rem$/.exec(label)?.[1];
    if (percent) {
      await expect(Math.abs((width / room) * 100 - Number(percent)), label).toBeLessThanOrEqual(1);
      measured++;
    } else if (rems) {
      await expect(Math.abs((width / (Number(rems) * rem) - 1) * 100), label).toBeLessThanOrEqual(
        1
      );
      measured++;
    }
  }
  await expect(measured).toBeGreaterThan(0);
};

export const DefaultLabelIsTrue: Story = { ...Default, tags: HIDDEN, play: labelsAreTrue };
export const HalvesLabelsAreTrue: Story = { ...Halves, tags: HIDDEN, play: labelsAreTrue };
export const TripleLabelsAreTrue: Story = { ...Triple, tags: HIDDEN, play: labelsAreTrue };
export const QuartersLabelsAreTrue: Story = { ...Quarters, tags: HIDDEN, play: labelsAreTrue };
export const SidebarAndContentLabelsAreTrue: Story = {
  ...SidebarAndContent,
  tags: HIDDEN,
  globals: LAPTOP,
  play: async (context) => {
    await labelsAreTrue(context);
    // The content column takes what the sidebar leaves.
    const [sidebar, content] = ['18rem', '1fr'].map((label) =>
      context.canvas.getByText(label).parentElement!.getBoundingClientRect()
    );
    await expect(startEdge(content)).toBeGreaterThanOrEqual(endEdge(sidebar));
    await expect(content.width).toBeGreaterThan(sidebar.width);
  },
};
