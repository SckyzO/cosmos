import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectMirrored,
  startOffset,
  expectPickerSelected,
  expectRefFocuses,
  expectTextContrast,
  keyToEnd,
  keyToStart,
} from '../storybook-helpers';
import { AccentPicker, type AccentColor } from './AccentPicker';
import { ColorSwatch } from './ColorSwatch';

const meta = {
  title: 'Settings/Accent Picker',
  component: AccentPicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { colors: [], value: '', onChange: () => {} },
} satisfies Meta<typeof AccentPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

const ACCENTS: AccentColor[] = [
  { id: 'brand', label: 'Brand', hex: '#465fff' },
  { id: 'sky', label: 'Sky', hex: '#0ea5e9' },
  { id: 'emerald', label: 'Emerald', hex: '#10b981' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { id: 'fuchsia', label: 'Fuchsia', hex: '#d946ef' },
  { id: 'teal', label: 'Teal', hex: '#14b8a6' },
  { id: 'orange', label: 'Orange', hex: '#f97316' },
  { id: 'slate', label: 'Slate', hex: '#64748b' },
];

export const TenAccents: Story = {
  render: () => {
    const [value, setValue] = useState('brand');
    return (
      <Wrap>
        <AccentPicker colors={ACCENTS} value={value} onChange={setValue} />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};

// Inactive swatch labels (gray-400, 10px) fell under 4.5:1 (#151).
const swatchLabelContrastIn = (theme: string): Story => ({
  tags: ['!dev', '!autodocs'],
  globals: { theme },
  render: () => (
    <Wrap>
      <AccentPicker colors={ACCENTS} value="brand" onChange={() => {}} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Sky'));
  },
});

export const SwatchLabelContrastInLight = swatchLabelContrastIn('light');
export const SwatchLabelContrastInSand = swatchLabelContrastIn('sand');
export const SwatchLabelContrastInDark = swatchLabelContrastIn('dark');
export const SwatchLabelContrastInDeepBlue = swatchLabelContrastIn('deep-blue');

// ── Interaction tests ────────────────────────────────────────────────────────

// The picker is controlled: keep the value here and report each pick to `onChange`.
const ControlledAccents = ({
  initial,
  onChange,
}: {
  initial: string;
  onChange?: (id: string) => void;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <Wrap>
      <AccentPicker
        aria-label="Accent colour"
        colors={ACCENTS}
        value={value}
        onChange={(id) => {
          onChange?.(id);
          setValue(id);
        }}
      />
    </Wrap>
  );
};

/** Clicking a swatch reports its id and moves the checked state to it. */
export const ClickSelectsASwatch: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledAccents initial="brand" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('radiogroup', { name: 'Accent colour' })).toBeVisible();
    await expect(canvas.getAllByRole('radio')).toHaveLength(ACCENTS.length);
    await expect(canvas.getByRole('radio', { name: 'Brand', checked: true })).toBeVisible();

    await userEvent.click(canvas.getByRole('radio', { name: 'Emerald' }));
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith('emerald');
    await expect(canvas.getByRole('radio', { name: 'Emerald', checked: true })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Brand', checked: false })).toBeVisible();
    await expect(canvas.getAllByRole('radio', { checked: true })).toHaveLength(1);
  },
};

/** Only the checked swatch is a tab stop; arrows, Home and End move and check, wrapping. */
export const ArrowKeysMoveTheSelection: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledAccents initial="brand" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Brand' })).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('radio', { name: 'Sky' })).toHaveAttribute('tabindex', '-1');

    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Brand' })).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('radio', { name: 'Sky', checked: true })).toHaveFocus();
    await expect(args.onChange).toHaveBeenLastCalledWith('sky');
    // The tab stop follows the selection.
    await expect(canvas.getByRole('radio', { name: 'Sky' })).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('radio', { name: 'Brand' })).toHaveAttribute('tabindex', '-1');

    await userEvent.keyboard(`{${keyToStart()}}{${keyToStart()}}`);
    await expect(canvas.getByRole('radio', { name: 'Slate', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Brand', checked: true })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('radio', { name: 'Slate', checked: true })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('radio', { name: 'Brand', checked: true })).toHaveFocus();
  },
};

/** With no swatch checked, Tab lands on the first one, and Space or Enter check a focused one. */
export const NothingCheckedEntersOnTheFirstSwatch: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledAccents initial="" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.queryByRole('radio', { checked: true })).toBeNull();
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Brand', checked: false })).toHaveFocus();

    const teal = canvas.getByRole('radio', { name: 'Teal' });
    teal.focus();
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenLastCalledWith('teal');
    await expect(canvas.getByRole('radio', { name: 'Teal', checked: true })).toHaveFocus();

    canvas.getByRole('radio', { name: 'Amber' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('amber');
    await expect(canvas.getByRole('radio', { name: 'Amber', checked: true })).toHaveFocus();
  },
};

/** `cols` sets the number of grid columns. */
export const ColsSetsTheGridColumns: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <AccentPicker
        aria-label="Accent colour"
        colors={ACCENTS}
        value="brand"
        onChange={() => {}}
        cols={4}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Accent colour' });
    await expect(getComputedStyle(group).gridTemplateColumns.split(' ')).toHaveLength(4);
  },
};

// `smCols` is a `sm:` (640px) breakpoint class: the story picks a viewport on
// each side of it, and the test checks the viewport it got before the columns.
const columnsOf = (group: HTMLElement) => getComputedStyle(group).gridTemplateColumns.split(' ');

const columnsAt = (
  viewport: 'mobile' | 'tw-sm',
  props: Partial<React.ComponentProps<typeof AccentPicker>>,
  expected: { sm: boolean; columns: number }
): Story => ({
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: viewport, isRotated: false } },
  render: () => (
    <Wrap>
      <AccentPicker
        aria-label="Accent colour"
        colors={ACCENTS}
        value="brand"
        onChange={() => {}}
        {...props}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(window.matchMedia('(min-width: 640px)').matches).toBe(expected.sm);
    const group = canvas.getByRole('radiogroup', { name: 'Accent colour' });
    await expect(columnsOf(group)).toHaveLength(expected.columns);
  },
});

/** From the `sm` breakpoint up, `smCols` sets the number of grid columns. */
export const SmColsSetsTheColumnsFromSm = columnsAt(
  'tw-sm',
  { cols: 4, smCols: 6 },
  { sm: true, columns: 6 }
);

/** Below `sm`, `cols` still sets the number of grid columns, whatever `smCols` is. */
export const ColsStillAppliesBelowSm = columnsAt(
  'mobile',
  { cols: 4, smCols: 6 },
  { sm: false, columns: 4 }
);

/** Without `smCols`, the grid keeps `cols` columns from `sm` up. */
export const SmColsDefaultsToCols = columnsAt('tw-sm', { cols: 4 }, { sm: true, columns: 4 });

const swatchRef = createRef<HTMLButtonElement>();

/** The ref gets the swatch's `<button role="radio">`, and focusing through it works. */
export const ColorSwatchForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ColorSwatch ref={swatchRef} hex="#465fff" label="Brand" />,
  play: async ({ canvas }) => {
    await expectRefFocuses(swatchRef, canvas.getByRole('radio', { name: 'Brand' }));
  },
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

export const DefaultValueOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <Wrap>
      <div className="space-y-6">
        <AccentPicker
          aria-label="Uncontrolled"
          colors={ACCENTS}
          defaultValue="sky"
          onChange={args.onChange}
        />
        <AccentPicker
          aria-label="Controlled"
          colors={ACCENTS}
          value="brand"
          onChange={args.onChange}
        />
      </div>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('radiogroup', { name: 'Uncontrolled' }));
    await expect(own.getByRole('radio', { name: 'Sky' })).toBeChecked();
    await userEvent.click(own.getByRole('radio', { name: 'Teal' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('teal');
    await expect(own.getByRole('radio', { name: 'Teal' })).toBeChecked();

    const held = within(canvas.getByRole('radiogroup', { name: 'Controlled' }));
    await userEvent.click(held.getByRole('radio', { name: 'Teal' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('teal');
    await expect(held.getByRole('radio', { name: 'Brand' })).toBeChecked();
  },
};

/** The checked swatch has the brand border and the check badge, as the other pickers. */
export const SelectedSharesThePickerTreatment: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <AccentPicker aria-label="Accent" colors={ACCENTS} value="sky" />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectPickerSelected(canvas.getByRole('radiogroup', { name: 'Accent' }));
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The swatches run from the start edge, the check badge is on the end corner of the picked one,
 * and the arrow keys follow the line: ArrowRight picks the next swatch in left to right, the
 * previous one in right to left.
 */
export const PickerFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <AccentPicker colors={ACCENTS.slice(0, 4)} defaultValue="sky" aria-label="Accent" />
    )),
  play: async ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => within(box).getByRole('radio', { name: 'Brand' }));
    expectMirrored(canvasElement, (box) => within(box).getByRole('radio', { name: 'Amber' }));
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('radio', { name: 'Sky' }).querySelector('.bg-brand-500')
    );
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const sky = within(box).getByRole('radio', { name: 'Sky' });
      const mark = sky.querySelector<HTMLElement>('.bg-brand-500')!;
      await expect(endOffset(mark, sky), `${dir}: check on the end corner`).toBeLessThan(
        startOffset(mark, sky)
      );
      sky.focus();
      // Physical keys on purpose: they are what the user presses.
      await userEvent.keyboard('{ArrowRight}');
      await expect(
        within(box).getByRole('radio', { name: dir === 'ltr' ? 'Emerald' : 'Brand' })
      ).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      await expect(sky).toHaveFocus();
    }
  },
};
