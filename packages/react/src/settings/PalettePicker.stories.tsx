import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { expectPickerSelected, expectRefFocuses, keyToEnd, keyToStart } from '../storybook-helpers';
import {
  expectKeepsItsPlace,
  expectLiftsOnHover,
  LIFTED,
  tokenMs,
  transitionMs,
  transitions,
} from '../storybook-motion';
import { COSMOS_SYSTEM_THEME, COSMOS_THEMES } from './appearance';
import { PaletteCard } from './PaletteCard';
import { PalettePicker } from './PalettePicker';

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

/** The four themes of `@sckyzo/cosmos-theme`, from `COSMOS_THEMES`: what `AppearanceSettings` and `Customizer` hand to the picker. */
export const CosmosThemes: Story = {
  parameters: { settleMotion: false },
  render: () => {
    const [value, setValue] = useState('dark');
    return (
      <Wrap>
        <PalettePicker palettes={COSMOS_THEMES} value={value} onChange={setValue} />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};

/** `COSMOS_SYSTEM_THEME` first adds the opt-in `system` choice, which follows the device. */
export const WithSystem: Story = {
  render: () => {
    const [value, setValue] = useState('system');
    return (
      <Wrap>
        <PalettePicker
          palettes={[COSMOS_SYSTEM_THEME, ...COSMOS_THEMES]}
          value={value}
          cols={5}
          onChange={setValue}
        />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * Palettes without `preview.text`: each label takes a gray that reads on its
 * own surface, dark on the light ones and light on the dark ones, active or
 * not. axe checks the contrast.
 */
export const LabelsWithoutTextReadOnTheirSurface: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const withoutText = COSMOS_THEMES.map((theme) => ({
      ...theme,
      preview: { ...theme.preview, text: undefined },
    }));
    return (
      <Wrap>
        <PalettePicker palettes={withoutText} value="dark" onChange={() => {}} />
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    const labelColor = (name: string) =>
      getComputedStyle(canvas.getByText(name)).getPropertyValue('color');
    await expect(labelColor('Light')).toBe('rgb(75, 85, 99)');
    await expect(labelColor('Sand')).toBe('rgb(75, 85, 99)');
    await expect(labelColor('Dark')).toBe('rgb(209, 213, 219)');
    await expect(labelColor('Deep Blue')).toBe('rgb(209, 213, 219)');
  },
};

/**
 * In a narrow grid a long label wraps and stretches its row: every card's
 * label row must still reach the bottom of the card, with no gap under it.
 */
export const UnevenLabelsFillCards: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="w-80 max-w-full">
        <PalettePicker
          palettes={[
            ...COSMOS_THEMES.slice(0, 3),
            { ...COSMOS_THEMES[3], label: 'Deep Blue with a long name' },
          ]}
          value="light"
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
  onChange?: (id: string) => void;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <Wrap>
      <PalettePicker
        aria-label="Theme"
        palettes={COSMOS_THEMES}
        value={value}
        onChange={(id) => {
          onChange?.(id);
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
  render: (args) => <ControlledPalettes initial="light" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('radiogroup', { name: 'Theme' })).toBeVisible();
    await expect(canvas.getAllByRole('radio')).toHaveLength(COSMOS_THEMES.length);
    await expect(canvas.getByRole('radio', { name: 'Light', checked: true })).toBeVisible();

    await userEvent.click(canvas.getByRole('radio', { name: 'Dark' }));
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith('dark');
    await expect(canvas.getByRole('radio', { name: 'Dark', checked: true })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Light', checked: false })).toBeVisible();
    await expect(canvas.getAllByRole('radio', { checked: true })).toHaveLength(1);
  },
};

/** Only the checked palette is a tab stop; arrows, Home and End move and check, wrapping. */
export const ArrowKeysMoveTheSelection: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledPalettes initial="light" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Light' })).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('radio', { name: 'Sand' })).toHaveAttribute('tabindex', '-1');

    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Light' })).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('radio', { name: 'Sand', checked: true })).toHaveFocus();
    await expect(args.onChange).toHaveBeenLastCalledWith('sand');
    // The tab stop follows the selection.
    await expect(canvas.getByRole('radio', { name: 'Sand' })).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('radio', { name: 'Light' })).toHaveAttribute('tabindex', '-1');

    await userEvent.keyboard(`{${keyToStart()}}{${keyToStart()}}`);
    await expect(canvas.getByRole('radio', { name: 'Deep Blue', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Light', checked: true })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('radio', { name: 'Deep Blue', checked: true })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('radio', { name: 'Light', checked: true })).toHaveFocus();
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
    await expect(canvas.getByRole('radio', { name: 'Light', checked: false })).toHaveFocus();

    canvas.getByRole('radio', { name: 'Dark' }).focus();
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenLastCalledWith('dark');
    await expect(canvas.getByRole('radio', { name: 'Dark', checked: true })).toHaveFocus();

    canvas.getByRole('radio', { name: 'Sand' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('sand');
    await expect(canvas.getByRole('radio', { name: 'Sand', checked: true })).toHaveFocus();
  },
};

const cardRef = createRef<HTMLButtonElement>();

/** The ref gets the card's `<button role="radio">`, and focusing through it works. */
export const PaletteCardForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <PaletteCard ref={cardRef} meta={COSMOS_THEMES[0]} />,
  play: async ({ canvas }) => {
    await expectRefFocuses(cardRef, canvas.getByRole('radio', { name: 'Light' }));
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
        <PalettePicker
          aria-label="Uncontrolled"
          palettes={COSMOS_THEMES}
          defaultValue="sand"
          onChange={args.onChange}
        />
        <PalettePicker
          aria-label="Controlled"
          palettes={COSMOS_THEMES}
          value="light"
          onChange={args.onChange}
        />
      </div>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('radiogroup', { name: 'Uncontrolled' }));
    await expect(own.getByRole('radio', { name: 'Sand' })).toBeChecked();
    await userEvent.click(own.getByRole('radio', { name: 'Dark' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('dark');
    await expect(own.getByRole('radio', { name: 'Dark' })).toBeChecked();

    const held = within(canvas.getByRole('radiogroup', { name: 'Controlled' }));
    await userEvent.click(held.getByRole('radio', { name: 'Dark' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('dark');
    await expect(held.getByRole('radio', { name: 'Light' })).toBeChecked();
  },
};

/** The checked card has the brand border and the check badge, as the other pickers. */
export const SelectedSharesThePickerTreatment: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <PalettePicker aria-label="Palette" palettes={COSMOS_THEMES} value="dark" />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectPickerSelected(canvas.getByRole('radiogroup', { name: 'Palette' }));
  },
};

const columnsAt = (viewport: 'mobile' | 'tw-sm', sm: boolean, columns: number): Story => ({
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: viewport, isRotated: false } },
  render: () => (
    <Wrap>
      <PalettePicker aria-label="Palette" palettes={COSMOS_THEMES} cols={4} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(window.matchMedia('(min-width: 640px)').matches).toBe(sm);
    const group = canvas.getByRole('radiogroup', { name: 'Palette' });
    await expect(getComputedStyle(group).gridTemplateColumns.split(' ')).toHaveLength(columns);
  },
});

/** Two columns below `sm` (640px), whatever `cols` is. */
export const TwoColumnsBelowSm: Story = {
  ...columnsAt('mobile', false, 2),
  tags: ['!dev', '!autodocs'],
};

/** From `sm` up, `cols` sets the number of columns. */
export const ColsApplyFromSm: Story = {
  ...columnsAt('tw-sm', true, 4),
  tags: ['!dev', '!autodocs'],
};

// ── Motion ───────────────────────────────────────────────────────────────────

const LiftingPalettes = () => (
  <Wrap>
    <PalettePicker palettes={COSMOS_THEMES} value="light" onChange={() => {}} />
  </Wrap>
);

/** The cards rise 2px with a soft shadow under the pointer, and the one with the focus rises. */
export const PaletteCardsLift: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LiftingPalettes />,
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('radio');
    for (const card of cards) expectLiftsOnHover(card);

    await userEvent.tab();
    const checked = canvas.getByRole('radio', { checked: true });
    await expect(checked).toHaveFocus();
    await expect(getComputedStyle(checked).translate).toBe(LIFTED);
    for (const card of cards.filter((other) => other !== checked)) {
      await expect(getComputedStyle(card).translate).toBe('none');
    }
  },
};

/** The raised card keeps the place it had under the pointer, so a pointer on its lower edge holds. */
export const PaletteCardKeepsItsPlace: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LiftingPalettes />,
  play: async ({ canvas }) => {
    for (const card of canvas.getAllByRole('radio')) expectKeepsItsPlace(card);
  },
};

/**
 * The card no longer clips its parts (a clip would cut the strip that keeps its place): each part
 * rounds its own outer corners to the card's, one border's width inside, and clips its content.
 */
export const PaletteCardPartsRoundTheCorners: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LiftingPalettes />,
  play: async ({ canvas }) => {
    for (const card of canvas.getAllByRole('radio')) {
      const outer = parseFloat(getComputedStyle(card).borderTopLeftRadius);
      const border = parseFloat(getComputedStyle(card).borderTopWidth);
      await expect(getComputedStyle(card).overflow).toBe('visible');
      const [mockup, label] = Array.from(card.children) as HTMLElement[];
      for (const [part, corners] of [
        [mockup, ['borderTopLeftRadius', 'borderTopRightRadius']],
        [label, ['borderBottomLeftRadius', 'borderBottomRightRadius']],
      ] as const) {
        await expect(getComputedStyle(part).overflow).toBe('hidden');
        for (const corner of corners) {
          await expect(parseFloat(getComputedStyle(part)[corner])).toBe(outer - border);
        }
      }
    }
  },
};

/** At its real speed the card moves over the base duration, 200 ms. */
export const PaletteCardMovesOnTheBaseToken: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <LiftingPalettes />,
  play: async ({ canvas }) => {
    const [card] = canvas.getAllByRole('radio');
    await expect(transitionMs(card)).toBe(tokenMs('--cosmos-motion-base'));
    await expect(transitions(card, 'translate', 'box-shadow', 'border-color')).toBe(true);
  },
};
