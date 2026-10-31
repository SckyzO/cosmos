import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectMirrored,
  expectReadsLeftToRight,
  expectFocusRing,
  expectGraphicContrast,
  inEachTheme,
  keyToEnd,
  keyToStart,
  startOffset,
} from '../storybook-helpers';
import { Rating } from './Rating';
import { SectionLabel } from './SectionLabel';

const meta = {
  title: 'Feedback/Rating',
  component: Rating,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 4.5, allowHalf: true, readOnly: true, showValue: true, count: '(128 reviews)' },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {};

export const ReadOnlyChecks: Story = {
  ...ReadOnly,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const stars = canvas.getByRole('img', { name: 'Rated 4.5 out of 5' });
    await expect(stars).toBeVisible();
    await expect(canvas.getByText('4.5')).toBeVisible();
    await expect(canvas.getByText('(128 reviews)')).toBeVisible();
    await expect(canvas.queryByRole('radio')).toBeNull();
  },
};

export const HalfStars: Story = {
  args: { value: 3.5, count: undefined },
  render: (args) => (
    <div className="flex flex-col gap-3">
      {[0, 0.5, 1.5, 3.5, 4.5, 5].map((v) => (
        <Rating key={v} {...args} value={v} />
      ))}
    </div>
  ),
};

export const HalfStarsChecks: Story = {
  ...HalfStars,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    // A half star clips the filled glyph at 50%, over the empty outline: no second icon.
    const half = canvas.getByRole('img', { name: 'Rated 3.5 out of 5' });
    const clips = half.querySelectorAll<HTMLElement>('span[style]');
    await expect(clips).toHaveLength(4);
    await expect(clips[3]!.style.width).toBe('50%');
    await expect(clips[2]!.style.width).toBe('100%');
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <div key={s} className="flex flex-col gap-1">
          <SectionLabel>{s}</SectionLabel>
          <Rating {...args} size={s} />
        </div>
      ))}
    </div>
  ),
};

export const WithLabel: Story = {
  args: { label: 'Walnut desk lamp', count: undefined },
};

export const WithLabelChecks: Story = {
  ...WithLabel,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Walnut desk lamp: 4.5 out of 5' })).toBeVisible();
  },
};

export const CountOnly: Story = { args: { showValue: false, value: 4 } };

export const Interactive: Story = {
  tags: ['!autodocs'],
  args: {
    readOnly: false,
    allowHalf: false,
    showValue: false,
    count: undefined,
    size: 'lg',
    value: undefined,
    defaultValue: 0,
    label: 'Your rating',
    onChange: fn(),
  },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Rating {...args} />
    </div>
  ),
};

export const InteractiveClick: Story = {
  ...Interactive,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, args }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Your rating' });
    await expect(within(group).getAllByRole('radio')).toHaveLength(5);
    await userEvent.click(canvas.getByRole('radio', { name: '3 stars' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(3);
    await expect(canvas.getByRole('radio', { name: '3 stars' })).toBeChecked();
    // Only the picked radio is checked; the others are not.
    await expect(canvas.getByRole('radio', { name: '4 stars' })).not.toBeChecked();
    await expect(canvas.getByRole('radio', { name: '1 star' })).toBeInTheDocument();
  },
};

export const InteractiveKeyboard: Story = {
  ...Interactive,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, args }) => {
    // One tab stop: the first radio while nothing is picked.
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: '1 star' })).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
    await expect(canvas.getByRole('radio', { name: '2 stars' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(args.onChange).toHaveBeenLastCalledWith(5);
    await userEvent.keyboard('{Home}');
    await expect(args.onChange).toHaveBeenLastCalledWith(1);
    await userEvent.keyboard(`{${keyToStart()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith(5);
    await expect(canvas.getByRole('radio', { name: '5 stars' })).toBeChecked();
    // The picked radio is the only tab stop.
    await expect(canvas.getByRole('radio', { name: '1 star' })).toHaveAttribute('tabindex', '-1');
    await expect(canvas.getByRole('radio', { name: '5 stars' })).toHaveAttribute('tabindex', '0');
  },
};

export const InteractiveFocusRing: Story = {
  ...Interactive,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('radio', { name: '1 star' }));
  },
};

export const InteractiveHalfStars: Story = {
  ...Interactive,
  tags: ['!dev', '!autodocs'],
  args: { ...Interactive.args, allowHalf: true },
  play: async ({ canvas, args }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Your rating' });
    await expect(within(group).getAllByRole('radio')).toHaveLength(10);
    await userEvent.click(canvas.getByRole('radio', { name: '3.5 stars' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(3.5);
    await expect(canvas.getByRole('radio', { name: '3.5 stars' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: '4 stars' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(4);
    await userEvent.keyboard(`{${keyToStart()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith(3.5);
  },
};

export const Hover: Story = {
  ...Interactive,
  tags: ['!dev', '!autodocs'],
  args: { ...Interactive.args, defaultValue: 2 },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Your rating' });
    const filledCount = () => group.querySelectorAll('span[style*="width: 100%"]').length;
    await expect(filledCount()).toBe(2);
    await userEvent.hover(canvas.getByRole('radio', { name: '4 stars' }));
    await expect(filledCount()).toBe(4);
    await userEvent.unhover(canvas.getByRole('radio', { name: '4 stars' }));
    await expect(filledCount()).toBe(2);
  },
};

export const Controlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { readOnly: false, showValue: true, count: undefined, label: 'Rate this' },
  render: (args) => {
    const [value, setValue] = useState(2);
    return <Rating {...args} value={value} onChange={setValue} />;
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('2.0')).toBeVisible();
    await userEvent.click(canvas.getByRole('radio', { name: '4 stars' }));
    await expect(canvas.getByText('4.0')).toBeVisible();
  },
};

export const Disabled: Story = {
  args: { readOnly: false, disabled: true, value: 3, allowHalf: false, count: undefined },
};

export const DisabledChecks: Story = {
  ...Disabled,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).toBeDisabled();
    await expect(canvas.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
  },
};

export const ReadOnlyIgnoresClicks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('img', { name: 'Rated 4.5 out of 5' }));
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const StarsHoldContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 3, allowHalf: false, showValue: false, count: undefined },
  play: async ({ canvas }) => {
    const stars = canvas.getByRole('img', { name: 'Rated 3 out of 5' });
    inEachTheme(() => {
      // WCAG 1.4.11: the filled star and the outline of an empty one reach 3:1 on the card.
      for (const filled of stars.querySelectorAll('.fill-current'))
        expectGraphicContrast(filled, 'color');
      for (const empty of stars.querySelectorAll('svg:not(.fill-current)'))
        expectGraphicContrast(empty, 'color');
    });
  },
};

/** The first star is at the start edge, a half star fills from the start, and the text after the stars keeps its order. */
export const StarsFillFromTheStart: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <Rating readOnly allowHalf value={3.5} showValue count="(128 reviews)" label="Product" />
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const stars = within(box).getByRole('img');
      const [first, , , half] = [...stars.children];
      expect(startOffset(first!, stars)).toBeCloseTo(0, 1);
      // The half star's fill starts at the star's start edge and covers half of it.
      const fill = half!.querySelector<HTMLElement>('span[aria-hidden]')!;
      expect(startOffset(fill, half!)).toBeCloseTo(0, 1);
      expect(fill.getBoundingClientRect().width).toBeCloseTo(
        half!.getBoundingClientRect().width / 2,
        0
      );
      // The value and the count come after the stars.
      const value = within(box).getByText('3.5');
      expect(startOffset(value, box)).toBeGreaterThan(
        startOffset(stars, box) + stars.getBoundingClientRect().width - 1
      );
      expectReadsLeftToRight(within(box).getByText('(128 reviews)').parentElement!);
    }
    expectMirrored(canvasElement, (box) => within(box).getByRole('img').children[0]);
    expectMirrored(canvasElement, (box) => within(box).getByText('3.5'));
  },
};

/** With half stars, the first half of a star is the one at the start edge, and picks the lower value. */
export const HalfStarsPickFromTheStartHalf: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => bothDirections(() => <Rating allowHalf defaultValue={0} label="Your rating" />),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const group = within(directionBox(canvasElement, dir)).getByRole('radiogroup');
      const lower = within(group).getByRole('radio', { name: '0.5 stars' });
      const upper = within(group).getByRole('radio', { name: '1 star' });
      const star = lower.parentElement!;
      expect(startOffset(lower, star)).toBeCloseTo(0, 1);
      expect(endOffset(upper, star)).toBeCloseTo(0, 1);
      // The second star is after the first one, toward the end.
      const next = within(group).getByRole('radio', { name: '1.5 stars' });
      expect(startOffset(next, group)).toBeGreaterThan(startOffset(upper, group));
    }
  },
};
