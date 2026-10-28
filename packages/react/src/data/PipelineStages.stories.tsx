import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectFocusRing,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  keyToEnd,
  keyToStart,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { PipelineStages, type PipelineStage } from './PipelineStages';

const meta = {
  title: 'Data/Pipeline Stages',
  component: PipelineStages,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { stages: [] },
} satisfies Meta<typeof PipelineStages>;

export default meta;
type Story = StoryObj<typeof meta>;

const DEALS: PipelineStage[] = [
  { id: 'lead', label: 'Lead', count: 248, amount: '$1.24M' },
  { id: 'qualified', label: 'Qualified', count: 136, amount: '$842k' },
  { id: 'proposal', label: 'Proposal', count: 64, amount: '$512k' },
  { id: 'negotiation', label: 'Negotiation', count: 31, amount: '$298k' },
  { id: 'won', label: 'Won', count: 18, amount: '$186k', intent: 'success' },
];

const COUNTS_ONLY: PipelineStage[] = DEALS.map(({ amount: _amount, ...stage }) => stage);

const stageOf = (canvas: ReturnType<typeof within>, name: RegExp) =>
  canvas.getByRole('radio', { name });

export const Default: Story = {
  args: { stages: DEALS, 'aria-label': 'Deal pipeline' },
};

/** Any of `selectedId`, `defaultSelectedId` or `onSelectedChange` makes the stages pickable. */
export const Selectable: Story = {
  args: { stages: DEALS, defaultSelectedId: 'qualified', 'aria-label': 'Deal pipeline' },
};

/** The host owns the pick, here to filter the list under the strip. */
export const Controlled: Story = {
  args: { stages: DEALS, 'aria-label': 'Deal pipeline' },
  render: (args) => {
    const [selectedId, setSelectedId] = useState('proposal');
    const label = DEALS.find((stage) => stage.id === selectedId)?.label;
    return (
      <div className="grid gap-4">
        <PipelineStages {...args} selectedId={selectedId} onSelectedChange={setSelectedId} />
        <p className="text-sm text-[var(--color-text-secondary)]">Selected: {label}</p>
      </div>
    );
  },
};

/** `showConversion={false}` keeps the arrows and drops the rates. */
export const WithoutConversion: Story = {
  args: { stages: DEALS, showConversion: false, 'aria-label': 'Deal pipeline' },
};

export const WithoutAmounts: Story = {
  args: { stages: COUNTS_ONLY, 'aria-label': 'Hiring pipeline' },
};

/** A stage larger than the one before it shows a rate over 100%. */
export const CountGrows: Story = {
  args: {
    'aria-label': 'Renewals',
    stages: [
      { id: 'due', label: 'Due', count: 16 },
      { id: 'renewed', label: 'Renewed', count: 18, intent: 'success' },
    ],
  },
};

/** At 375px the stages stack, one row each, with the arrow and the rate between two rows. */
export const OnNarrowScreen: Story = {
  globals: mobileViewport,
  tags: ['!autodocs'],
  args: { stages: DEALS, defaultSelectedId: 'qualified', 'aria-label': 'Deal pipeline' },
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const boxes = canvas.getAllByRole('radio').map((radio) => radio.getBoundingClientRect());
    for (let i = 1; i < boxes.length; i += 1) {
      expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
      expect(Math.round(boxes[i].left)).toBe(Math.round(boxes[0].left));
      expect(boxes[i].height).toBeGreaterThanOrEqual(44);
    }
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

/** Not selectable: an ordered list, one item per stage, nothing to click, decorative connectors. */
export const StaticIsAnOrderedList: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS, 'aria-label': 'Deal pipeline' },
  play: async ({ canvas, canvasElement }) => {
    const list = canvas.getByRole('list', { name: 'Deal pipeline' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(canvas.queryAllByRole('radio')).toHaveLength(0);
    expect(canvas.queryAllByRole('radiogroup')).toHaveLength(0);
    expect(canvasElement.querySelectorAll('button, a')).toHaveLength(0);
    const arrows = Array.from(canvasElement.querySelectorAll('svg'));
    expect(arrows.length).toBeGreaterThan(0);
    for (const arrow of arrows) expect(arrow.closest('[aria-hidden="true"]')).not.toBeNull();
  },
};

/** The rate is read with the stage, from the previous one; the first stage has none. */
export const RateIsReadWithTheStage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS },
  play: async ({ canvas }) => {
    const [lead, qualified, proposal] = canvas.getAllByRole('listitem');
    expect(within(lead).queryByText(/from/)).toBeNull();
    expect(within(qualified).getByText('54.8% from Lead')).toBeInTheDocument();
    expect(within(proposal).getByText('47.1% from Qualified')).toBeInTheDocument();
    // The chip between the cards is the same rate, hidden from assistive technology.
    const chip = canvas.getAllByText('54.8%').find((el) => el.closest('[aria-hidden="true"]'));
    expect(chip).toBeVisible();
  },
};

/** Without a string label on the previous stage, the rate says "the previous stage". */
export const RateNamesAnElementLabelGenerically: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    stages: [
      { id: 'a', label: <strong>Lead</strong>, count: 10 },
      { id: 'b', label: 'Qualified', count: 5 },
    ],
  },
  play: async ({ canvas }) => {
    expect(canvas.getByText('50.0% from the previous stage')).toBeInTheDocument();
  },
};

/** `showConversion={false}`: no rate anywhere, neither seen nor read; the arrows stay. */
export const NoRateWithoutConversion: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS, showConversion: false },
  play: async ({ canvas, canvasElement }) => {
    expect(canvasElement.textContent).not.toMatch(/%/);
    expect(canvas.queryByText(/from/)).toBeNull();
    expect(canvasElement.querySelectorAll('svg').length).toBeGreaterThan(0);
  },
};

/** A stage after a stage at 0 has no rate to show, and the next one divides by that stage. */
export const NoRateAfterAnEmptyStage: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    stages: [
      { id: 'a', label: 'A', count: 10 },
      { id: 'b', label: 'B', count: 0 },
      { id: 'c', label: 'C', count: 5 },
      { id: 'd', label: 'D', count: 3 },
    ],
  },
  play: async ({ canvas, canvasElement }) => {
    const [, b, c, d] = canvas.getAllByRole('listitem');
    expect(within(b).getByText('0.0% from A')).toBeInTheDocument();
    expect(within(c).queryByText(/from/)).toBeNull();
    expect(within(d).getByText('60.0% from C')).toBeInTheDocument();
    // The arrow before C stays.
    expect(c.querySelector('svg')).not.toBeNull();
    expect(canvasElement.textContent).not.toMatch(/Infinity|NaN/);
  },
};

/** The count is written with grouped digits, or with the host's `formatCount`. */
export const CountsAreFormatted: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-6">
      <div data-testid="default">
        <PipelineStages stages={[{ id: 'a', label: 'Visits', count: 12480 }]} />
      </div>
      <div data-testid="custom">
        <PipelineStages
          stages={[{ id: 'a', label: 'Visits', count: 12480 }]}
          formatCount={(count) => `${count / 1000}k`}
        />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    expect(within(canvas.getByTestId('default')).getByText('12,480')).toBeVisible();
    expect(within(canvas.getByTestId('custom')).getByText('12.48k')).toBeVisible();
  },
};

/** No stages, nothing rendered. */
export const NoStagesRenderNothing: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: [] },
  play: async ({ canvas, canvasElement }) => {
    expect(canvas.queryByRole('list')).toBeNull();
    expect(canvas.queryByRole('radiogroup')).toBeNull();
    expect(canvasElement.children.length).toBeLessThanOrEqual(1);
    expect(canvasElement.textContent).toBe('');
  },
};

/** From `sm` up the stages sit in one row, cards of one width. */
export const StagesShareOneRow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS },
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('listitem').map((li) => li.lastElementChild as HTMLElement);
    const boxes = cards.map((card) => card.getBoundingClientRect());
    for (const box of boxes) {
      expect(Math.round(box.top)).toBe(Math.round(boxes[0].top));
      expect(Math.abs(box.width - boxes[0].width)).toBeLessThan(1.5);
    }
    // Room for the arrow between two cards, whichever side the next one is on.
    const gap = Math.max(boxes[1].left - boxes[0].right, boxes[0].left - boxes[1].right);
    expect(gap).toBeGreaterThanOrEqual(60);
  },
};

/** Selectable: a radiogroup named by `aria-label`, one radio per stage, no list. */
export const SelectableIsARadiogroup: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS, defaultSelectedId: 'qualified', 'aria-label': 'Deal pipeline' },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Deal pipeline' });
    expect(within(group).getAllByRole('radio')).toHaveLength(5);
    expect(canvas.queryByRole('list')).toBeNull();
    expect(stageOf(canvas, /^Qualified/)).toBeChecked();
    expect(stageOf(canvas, /^Qualified/)).toHaveAccessibleName(/54\.8% from Lead/);
    expect(stageOf(canvas, /^Lead/)).not.toBeChecked();
  },
};

/** Nothing is checked until the user picks; clicking the checked stage keeps it checked. */
export const ClickPicksAndStaysPicked: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS, onSelectedChange: fn(), 'aria-label': 'Deal pipeline' },
  play: async ({ canvas, args }) => {
    expect(canvas.queryAllByRole('radio', { checked: true })).toHaveLength(0);
    await userEvent.click(stageOf(canvas, /^Proposal/));
    expect(stageOf(canvas, /^Proposal/)).toBeChecked();
    expect(args.onSelectedChange).toHaveBeenCalledTimes(1);
    expect(args.onSelectedChange).toHaveBeenLastCalledWith('proposal');
    await userEvent.click(stageOf(canvas, /^Proposal/));
    expect(stageOf(canvas, /^Proposal/)).toBeChecked();
    expect(args.onSelectedChange).toHaveBeenCalledTimes(1);
    await userEvent.click(stageOf(canvas, /^Won/));
    expect(stageOf(canvas, /^Won/)).toBeChecked();
    expect(stageOf(canvas, /^Proposal/)).not.toBeChecked();
    expect(canvas.getAllByRole('radio', { checked: true })).toHaveLength(1);
    expect(args.onSelectedChange).toHaveBeenLastCalledWith('won');
  },
};

/** Controlled: the click is reported, and the pick moves only when the host passes it back. */
export const ControlledWaitsForTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    stages: DEALS,
    selectedId: 'proposal',
    onSelectedChange: fn(),
    'aria-label': 'Deal pipeline',
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(stageOf(canvas, /^Won/));
    expect(args.onSelectedChange).toHaveBeenCalledWith('won');
    expect(stageOf(canvas, /^Proposal/)).toBeChecked();
    expect(stageOf(canvas, /^Won/)).not.toBeChecked();
  },
};

/** Tab lands on the first stage when none is checked, then the arrow keys move and check. */
export const KeyboardWithNothingChecked: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS, onSelectedChange: fn(), 'aria-label': 'Deal pipeline' },
  play: async ({ canvas, args }) => {
    const radios = canvas.getAllByRole('radio');
    expect(radios.filter((radio) => radio.tabIndex === 0)).toEqual([radios[0]]);
    await expectFocusRing(radios[0]);
    await userEvent.keyboard(`{${keyToEnd()}}`);
    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toBeChecked();
    await userEvent.keyboard('{ArrowDown}');
    expect(radios[2]).toHaveFocus();
    expect(radios[2]).toBeChecked();
    await userEvent.keyboard(`{${keyToStart()}}`);
    expect(radios[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(radios[0]).toHaveFocus();
    expect(radios[0]).toBeChecked();
    await userEvent.keyboard('{End}');
    expect(radios[4]).toHaveFocus();
    expect(radios[4]).toBeChecked();
    await userEvent.keyboard('{Home}');
    expect(radios[0]).toHaveFocus();
    expect(canvas.getAllByRole('radio', { checked: true })).toHaveLength(1);
    expect(args.onSelectedChange).toHaveBeenLastCalledWith('lead');
  },
};

/** The checked stage is the group's only tab stop. */
export const TabLandsOnTheCheckedStage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS, defaultSelectedId: 'proposal', 'aria-label': 'Deal pipeline' },
  play: async ({ canvas }) => {
    const radios = canvas.getAllByRole('radio');
    expect(radios.filter((radio) => radio.tabIndex === 0)).toEqual([radios[2]]);
    await userEvent.tab();
    expect(radios[2]).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    expect(radios[3]).toHaveFocus();
    expect(radios[3]).toBeChecked();
    expect(radios[2]).not.toBeChecked();
  },
};

/** The checked card has the brand border and tint; an unchecked one the default border. */
export const CheckedCardHasTheBrandBorder: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS, defaultSelectedId: 'qualified', 'aria-label': 'Deal pipeline' },
  play: async ({ canvas }) => {
    const brand = document.createElement('div');
    brand.style.borderColor = 'var(--color-brand-500)';
    brand.style.borderStyle = 'solid';
    document.body.append(brand);
    const brandColor = getComputedStyle(brand).borderTopColor;
    brand.remove();
    const checked = stageOf(canvas, /^Qualified/);
    const unchecked = stageOf(canvas, /^Lead/);
    expect(getComputedStyle(checked).borderTopColor).toBe(brandColor);
    expect(getComputedStyle(unchecked).borderTopColor).not.toBe(brandColor);
    expect(getComputedStyle(checked).backgroundColor).not.toBe(
      getComputedStyle(unchecked).backgroundColor
    );
    await userEvent.click(unchecked);
    expect(getComputedStyle(unchecked).borderTopColor).toBe(brandColor);
    expect(getComputedStyle(checked).borderTopColor).not.toBe(brandColor);
  },
};

/** Picking a stage does not move anything: the card keeps its size. */
export const PickingDoesNotMoveTheLayout: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS, onSelectedChange: fn(), 'aria-label': 'Deal pipeline' },
  play: async ({ canvas }) => {
    const target = stageOf(canvas, /^Proposal/);
    const before = target.getBoundingClientRect();
    await userEvent.click(target);
    const after = target.getBoundingClientRect();
    expect(after.width).toBe(before.width);
    expect(after.height).toBe(before.height);
    expect(after.left).toBe(before.left);
  },
};

/** The dot shows only for a stage with an `intent`. */
export const IntentDotOnlyWhenGiven: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS },
  play: async ({ canvas }) => {
    const dots = (li: HTMLElement) => li.querySelectorAll('.rounded-full.size-2');
    const items = canvas.getAllByRole('listitem');
    expect(dots(items[0])).toHaveLength(0);
    expect(dots(items[4])).toHaveLength(1);
    expect(getComputedStyle(dots(items[4])[0]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

/** Label, count and amount are readable on the card and on the picked card, in the four themes. */
export const ContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { stages: DEALS, defaultSelectedId: 'qualified', 'aria-label': 'Deal pipeline' },
  play: async ({ canvas }) => {
    inEachTheme(() => {
      for (const name of [/^Lead/, /^Qualified/]) {
        const card = within(stageOf(canvas, name));
        expectTextContrast(card.getByText(/^(Lead|Qualified)$/));
        expectTextContrast(card.getByText(/^(248|136)$/));
        expectTextContrast(card.getByText(/^\$/));
      }
      expectTextContrast(canvas.getByText('54.8%'));
    });
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The first stage is at the start, each arrow points at the next stage (turned around in right to
 * left), and the arrow of the stacked layout, which points down, does not change.
 */
export const StagesAndArrowsMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => bothDirections(() => <PipelineStages stages={DEALS} />),
  play: ({ canvasElement }) => {
    const stage = (box: HTMLElement, index: number) => within(box).getAllByRole('listitem')[index];
    expectMirrored(canvasElement, (box) => stage(box, 0));
    expectMirrored(canvasElement, (box) => stage(box, 4));
    expectMirrored(canvasElement, (box) => within(box).getByText('Lead'));
    for (const [dir, scale] of [
      ['ltr', 'none'],
      ['rtl', '-1 1'],
    ] as const) {
      const box = directionBox(canvasElement, dir);
      const connector = within(box).getAllByRole('listitem')[1].firstElementChild!;
      const arrow = connector.querySelector('.lucide-arrow-right')!;
      expect(arrow).toBeVisible();
      expect(getComputedStyle(arrow).scale).toBe(scale);
      expect(getComputedStyle(connector.querySelector('.lucide-arrow-down')!).scale).toBe('none');
      // The next stage is further along the line than the first.
      expect(startOffset(stage(box, 1), box)).toBeGreaterThan(startOffset(stage(box, 0), box));
    }
  },
};
