import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { PalettePicker } from './PalettePicker';
import type { PaletteMeta } from './PaletteCard';

const meta = {
  title: 'Settings/Palette Picker',
  component: PalettePicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { palettes: [], value: '', onChange: () => {} },
} satisfies Meta<typeof PalettePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

const LIGHT_THEMES: PaletteMeta[] = [
  {
    id: 'pure',
    label: 'Pure',
    desc: 'White surfaces',
    preview: { bg: '#f9fafb', surface: '#ffffff', border: '#e5e7eb' },
  },
  {
    id: 'warm',
    label: 'Warm',
    desc: 'Cream tone',
    preview: { bg: '#fefcf8', surface: '#fffaf0', border: '#f3e8d0' },
  },
  {
    id: 'cool',
    label: 'Cool',
    desc: 'Blue tint',
    preview: { bg: '#f3f6fc', surface: '#ffffff', border: '#dbe5f5' },
  },
  {
    id: 'paper',
    label: 'Paper',
    desc: 'Slight grain',
    preview: { bg: '#f4f3ee', surface: '#fafaf7', border: '#dad8d0' },
  },
];

const DARK_THEMES: PaletteMeta[] = [
  {
    id: 'cosmos',
    label: 'Cosmos',
    desc: 'Default deep blue',
    preview: { bg: '#0c111d', surface: '#101828', border: '#1f2937' },
  },
  {
    id: 'void',
    label: 'Void',
    desc: 'NOC near-black',
    preview: { bg: '#000000', surface: '#0a0a0a', border: '#262626' },
  },
  {
    id: 'slate',
    label: 'Slate',
    desc: 'Neutral grey',
    preview: { bg: '#1f2937', surface: '#293241', border: '#3a4659' },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    desc: 'Indigo wash',
    preview: { bg: '#10162b', surface: '#1a2240', border: '#2d3563' },
  },
];

export const LightThemes: Story = {
  render: () => {
    const [value, setValue] = useState('pure');
    return (
      <Wrap>
        <PalettePicker palettes={LIGHT_THEMES} value={value} onChange={setValue} />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};

export const DarkThemes: Story = {
  render: () => {
    const [value, setValue] = useState('cosmos');
    return (
      <Wrap>
        <PalettePicker palettes={DARK_THEMES} value={value} onChange={setValue} />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * In a narrow grid a long label wraps and stretches its row: every card's
 * label row must still reach the bottom of the card, with no gap under it.
 */
export const UnevenLabelsFillCards: Story = {
  render: () => (
    <Wrap>
      <div className="w-80">
        <PalettePicker
          palettes={[
            ...LIGHT_THEMES.slice(0, 3),
            { ...LIGHT_THEMES[3], label: 'Paper with a long name' },
          ]}
          value="pure"
          onChange={() => {}}
        />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('radio');
    const heights = new Set(cards.map((c) => c.getBoundingClientRect().height));
    await expect(heights.size).toBe(1);
    for (const card of cards) {
      const labelRow = card.lastElementChild as HTMLElement;
      const borderBottom = parseFloat(getComputedStyle(card).borderBottomWidth);
      await expect(labelRow.getBoundingClientRect().bottom).toBeCloseTo(
        card.getBoundingClientRect().bottom - borderBottom,
        1
      );
    }
  },
};

// The picker is controlled: keep the value here and report each pick to `onChange`.
const ControlledPalettes = ({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (id: string) => void;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <Wrap>
      <PalettePicker
        aria-label="Light palette"
        palettes={LIGHT_THEMES}
        value={value}
        onChange={(id) => {
          onChange(id);
          setValue(id);
        }}
      />
    </Wrap>
  );
};

/** Clicking a palette reports its id and moves the checked state to it. */
export const ClickSelectsAPalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledPalettes initial="pure" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('radiogroup', { name: 'Light palette' })).toBeVisible();
    await expect(canvas.getAllByRole('radio')).toHaveLength(LIGHT_THEMES.length);
    await expect(canvas.getByRole('radio', { name: 'Pure', checked: true })).toBeVisible();

    await userEvent.click(canvas.getByRole('radio', { name: 'Cool' }));
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith('cool');
    await expect(canvas.getByRole('radio', { name: 'Cool', checked: true })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Pure', checked: false })).toBeVisible();
    await expect(canvas.getAllByRole('radio', { checked: true })).toHaveLength(1);
  },
};

/** Only the checked palette is a tab stop; arrows, Home and End move and check, wrapping. */
export const ArrowKeysMoveTheSelection: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledPalettes initial="pure" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Pure' })).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('radio', { name: 'Warm' })).toHaveAttribute('tabindex', '-1');

    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Pure' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Warm', checked: true })).toHaveFocus();
    await expect(args.onChange).toHaveBeenLastCalledWith('warm');
    // The tab stop follows the selection.
    await expect(canvas.getByRole('radio', { name: 'Warm' })).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('radio', { name: 'Pure' })).toHaveAttribute('tabindex', '-1');

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(canvas.getByRole('radio', { name: 'Paper', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Pure', checked: true })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('radio', { name: 'Paper', checked: true })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('radio', { name: 'Pure', checked: true })).toHaveFocus();
  },
};

/** With no palette checked, Tab lands on the first one, and Space or Enter check a focused one. */
export const NothingCheckedEntersOnTheFirstPalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledPalettes initial="" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.queryByRole('radio', { checked: true })).toBeNull();
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Pure', checked: false })).toHaveFocus();

    canvas.getByRole('radio', { name: 'Cool' }).focus();
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenLastCalledWith('cool');
    await expect(canvas.getByRole('radio', { name: 'Cool', checked: true })).toHaveFocus();

    canvas.getByRole('radio', { name: 'Warm' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('warm');
    await expect(canvas.getByRole('radio', { name: 'Warm', checked: true })).toHaveFocus();
  },
};
