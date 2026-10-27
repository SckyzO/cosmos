import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  expectFocusBorder,
  expectFocusRing,
  expectNoHorizontalOverflow,
  expectRefFocuses,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import { ColorInput, type ColorPreset } from './ColorInput';
import { FormRow } from './FormRow';

const meta = {
  title: 'Forms/Color Input',
  component: ColorInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Event colour' },
} satisfies Meta<typeof ColorInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Presets a host might bring: pale and dark colours are where the check and the border matter.
const BRAND_PRESETS: ColorPreset[] = [
  { value: '#465fff', label: 'Cosmos blue' },
  { value: '#fef3c7', label: 'Cream' },
  { value: '#ffffff', label: 'White' },
  { value: '#101828', label: 'Ink' },
  { value: '#0f766e', label: 'Deep teal' },
];

export const Default: Story = { args: { defaultValue: '#14b8a6' } };

export const NoColourYet: Story = {
  args: { description: 'Pick a preset or type a hex value.' },
};

export const CustomPresets: Story = {
  args: { presets: BRAND_PRESETS, defaultValue: '#fef3c7' },
};

export const HexFieldOnly: Story = {
  args: { presets: [], defaultValue: '#8b5cf6', label: 'Accent colour' },
};

export const WithDescription: Story = {
  args: { defaultValue: '#ec4899', description: 'Shown on the calendar and in the invitation.' },
};

export const Required: Story = { args: { defaultValue: '#3b82f6', required: true } };

export const Error: Story = {
  args: { defaultValue: '#14b8a6', error: 'Pick a colour that is not already used.' },
};

export const Disabled: Story = { args: { defaultValue: '#3b82f6', disabled: true } };

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <ColorInput label="Small" size="sm" defaultValue="#22c55e" />
      <ColorInput label="Medium" size="md" defaultValue="#22c55e" />
      <ColorInput label="Large" size="lg" defaultValue="#22c55e" />
    </div>
  ),
};

/** A bare field is named by its row, as the other controls are. */
export const InAFormRow: Story = {
  render: () => (
    <div className="max-w-2xl rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
      <FormRow label="Event colour" description="Shown on the calendar">
        <ColorInput presets={BRAND_PRESETS.slice(0, 4)} defaultValue="#465fff" />
      </FormRow>
    </div>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Event colour' });
    await expect(field).toHaveAccessibleDescription('Shown on the calendar');
  },
};

/** At 375px the swatches wrap and the field stays inside the screen. */
export const MobileWrapsTheSwatches: Story = {
  globals: mobileViewport,
  render: () => (
    <div className="p-4">
      <ColorInput label="Event colour" defaultValue="#14b8a6" description="Shown on the calendar" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

// ── Interaction tests ───────────────────────────────────────────────────────

const swatch = (
  canvas: { getByRole: (r: 'radio', o: { name: string }) => HTMLElement },
  n: string
) => canvas.getByRole('radio', { name: n });

/** Arrow keys move across the swatches, wrapping, and check the one they land on. */
export const ArrowKeysMoveAcrossSwatches: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: '#14b8a6', onChange: fn() },
  play: async ({ canvas, args }) => {
    swatch(canvas, 'Teal').focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(swatch(canvas, 'Blue')).toHaveFocus();
    await expect(swatch(canvas, 'Blue')).toBeChecked();
    await expect(swatch(canvas, 'Teal')).not.toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith('#3b82f6');
    await userEvent.keyboard('{End}');
    await expect(swatch(canvas, 'Pink')).toBeChecked();
    await userEvent.keyboard('{ArrowRight}');
    await expect(swatch(canvas, 'Red')).toBeChecked();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(swatch(canvas, 'Pink')).toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith('#ec4899');
  },
};

/** The checked swatch is the group's only tab stop, and the hex field follows it. */
export const TabStopIsTheCheckedSwatch: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: '#8b5cf6' },
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(swatch(canvas, 'Violet')).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('textbox', { name: 'Event colour' })).toHaveFocus();
  },
};

/** Picking a swatch fills the hex field and the preview square. */
export const PickingASwatchFillsTheField: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = canvas.getByRole('textbox', { name: 'Event colour' });
    await expect(field).toHaveValue('');
    await userEvent.click(swatch(canvas, 'Orange'));
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith('#f97316');
    await expect(field).toHaveValue('#f97316');
    const preview = field.previousElementSibling as HTMLElement;
    await expect(getComputedStyle(preview).backgroundColor).toBe('rgb(249, 115, 22)');
  },
};

/** `abc`, `#abc` and `#AABBCC` all reach `onChange` as `#aabbcc`, and only when complete. */
export const TypingAHexNormalisesIt: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: '#14b8a6', onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = canvas.getByRole('textbox', { name: 'Event colour' });
    await userEvent.clear(field);
    await userEvent.type(field, 'ab');
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.type(field, 'c');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith('#aabbcc');
    // The draft is what was typed until the field is left.
    await expect(field).toHaveValue('abc');
    await userEvent.tab();
    await expect(field).toHaveValue('#aabbcc');
    await expect(swatch(canvas, 'Teal')).not.toBeChecked();

    await userEvent.clear(field);
    await userEvent.type(field, '#3B82F6');
    await expect(args.onChange).toHaveBeenLastCalledWith('#3b82f6');
    await userEvent.tab();
    await expect(swatch(canvas, 'Blue')).toBeChecked();
  },
};

/** An invalid draft never reaches `onChange`, shows an error on blur and keeps the value. */
export const InvalidDraftShowsAnErrorOnBlur: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: '#14b8a6', onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = canvas.getByRole('textbox', { name: 'Event colour' });
    await userEvent.clear(field);
    await userEvent.type(field, '#12g4');
    // No error while typing.
    await expect(canvas.queryByText('Enter a hex colour, such as #14b8a6.')).toBeNull();
    await userEvent.tab();
    const message = canvas.getByText('Enter a hex colour, such as #14b8a6.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription('Enter a hex colour, such as #14b8a6.');
    await expect(message).toBeVisible();
    await expect(args.onChange).not.toHaveBeenCalled();
    // The value is still teal: its swatch is checked and the preview shows it.
    await expect(swatch(canvas, 'Teal')).toBeChecked();
    await expect(getComputedStyle(field.previousElementSibling!).backgroundColor).toBe(
      'rgb(20, 184, 166)'
    );
    // Typing again takes the error away.
    await userEvent.type(field, '5');
    await expect(canvas.queryByText('Enter a hex colour, such as #14b8a6.')).toBeNull();
  },
};

/** Leaving the field empty puts the value back instead of clearing it. */
export const ClearedFieldGetsTheValueBack: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: '#14b8a6', onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = canvas.getByRole('textbox', { name: 'Event colour' });
    await userEvent.clear(field);
    await userEvent.tab();
    await expect(field).toHaveValue('#14b8a6');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** A value the host passes in replaces the draft, and a typed `abc` is not rewritten under the cursor. */
export const ControlledValueFollowsTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [value, setValue] = useState('#14b8a6');
    return (
      <div className="flex flex-col gap-4">
        <ColorInput label="Event colour" value={value} onChange={setValue} />
        <button type="button" onClick={() => setValue('#ef4444')}>
          Use red
        </button>
        <output aria-label="Stored">{value}</output>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Event colour' });
    await userEvent.click(canvas.getByRole('button', { name: 'Use red' }));
    await expect(field).toHaveValue('#ef4444');
    await expect(swatch(canvas, 'Red')).toBeChecked();
    await userEvent.clear(field);
    await userEvent.type(field, 'abc');
    await expect(canvas.getByLabelText('Stored')).toHaveTextContent('#aabbcc');
    await expect(field).toHaveValue('abc');
  },
};

const hexRef = createRef<HTMLInputElement>();

export const RefFocusesTheHexField: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ref: hexRef, defaultValue: '#14b8a6' },
  play: async ({ canvas }) => {
    await expectRefFocuses(hexRef, canvas.getByRole('textbox', { name: 'Event colour' }));
  },
};

export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { defaultValue: '#14b8a6' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Event colour' });
    await expectFocusBorder(field, { border: field.parentElement as HTMLElement });
  },
};

/** With no colour picked the first swatch is the tab stop and shows the keyboard focus ring. */
export const UnselectedSwatchFocusRing: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expectFocusRing(swatch(canvas, 'Red'));
  },
};

/** The selected swatch keeps its ring set off by a gap and thickens it under keyboard focus. */
export const SelectedSwatchFocusRing: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: '#14b8a6' },
  play: async ({ canvas }) => {
    const teal = swatch(canvas, 'Teal');
    await expect(getComputedStyle(teal).boxShadow).toContain('4px');
    await expect(getComputedStyle(teal).boxShadow).not.toContain('6px');
    await userEvent.tab();
    await expect(teal).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(teal).boxShadow).toContain('6px'));
  },
};

/** In every theme: the selected swatch is ringed, the check is legible and the border is there. */
export const SelectedSwatchReadsInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { presets: BRAND_PRESETS, defaultValue: '#fef3c7' },
  play: async ({ canvas }) => {
    inEachTheme(() => {
      const pale = swatch(canvas, 'Cream');
      const dark = swatch(canvas, 'Ink');
      // Cream is pale: its check is the dark ink. The ring is the accent, 2px past a 2px gap.
      expect(pale.querySelector('svg')).not.toBeNull();
      expect(getComputedStyle(pale.querySelector('svg')!).color).toBe('rgb(16, 24, 40)');
      expect(getComputedStyle(pale).boxShadow).toContain('4px');
      // An unselected swatch has no check, no ring and a visible border.
      expect(dark.querySelector('svg')).toBeNull();
      expect(getComputedStyle(dark).boxShadow).toBe('none');
      expect(getComputedStyle(dark).borderTopWidth).toBe('1px');
      expect(getComputedStyle(dark).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    });
    await userEvent.click(swatch(canvas, 'Ink'));
    inEachTheme(() => {
      // Ink is dark: its check is white.
      expect(getComputedStyle(swatch(canvas, 'Ink').querySelector('svg')!).color).toBe(
        'rgb(255, 255, 255)'
      );
    });
  },
};
