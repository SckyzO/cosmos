import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  expectBelow,
  expectFocusBorder,
  expectOutsideClip,
  expectPlaceholderContrast,
  expectRefFocuses,
  inEachTheme,
  scrollAnchor,
} from '../storybook-helpers';
import { Combobox } from './Combobox';

const meta = {
  title: 'Forms/Combobox',
  component: Combobox,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options: [] },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const PEOPLE = [
  { value: 'leslie', label: 'Leslie Alexander' },
  { value: 'michael', label: 'Michael Foster' },
  { value: 'dries', label: 'Dries Vincent' },
  { value: 'lindsay', label: 'Lindsay Walton' },
  { value: 'courtney', label: 'Courtney Henry' },
  { value: 'tom', label: 'Tom Cook' },
  { value: 'whitney', label: 'Whitney Francis' },
];

// TUI Plus pattern "Simple" — label + input + dropdown of plain names.
export const Simple: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <div className="max-w-md bg-white p-8 dark:bg-gray-900">
        <Combobox label="Assigned to" value={v} onChange={setV} options={PEOPLE} />
      </div>
    );
  },
};

// TUI Plus pattern "With status indicator" — option carries a leading status dot.
export const WithStatusIndicator: Story = {
  render: () => {
    const [v, setV] = useState('');
    const opts = PEOPLE.map((p, i) => ({
      ...p,
      leading: (
        <span
          className={
            i % 3 === 0
              ? 'block size-2 rounded-full bg-green-400'
              : i % 3 === 1
                ? 'block size-2 rounded-full bg-gray-300'
                : 'block size-2 rounded-full bg-amber-400'
          }
          aria-hidden
        />
      ),
    }));
    return (
      <div className="max-w-md bg-white p-8 dark:bg-gray-900">
        <Combobox label="Assigned to" value={v} onChange={setV} options={opts} />
      </div>
    );
  },
};

// TUI Plus pattern "With secondary text" — secondary text on the right of each row.
export const WithSecondaryText: Story = {
  render: () => {
    const [v, setV] = useState('');
    const opts = PEOPLE.map((p) => ({
      ...p,
      secondary: `@${p.value}`,
      leading: undefined as undefined,
    }));
    void opts; // narrow type
    return (
      <div className="max-w-md bg-white p-8 dark:bg-gray-900">
        <Combobox
          label="Assigned to"
          value={v}
          onChange={setV}
          options={PEOPLE.map((p) => ({ ...p, secondary: `@${p.value}` }))}
        />
      </div>
    );
  },
};

// Helper text + error states.
export const WithError: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <Combobox label="Assigned to" options={PEOPLE} error="This field is required." />
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const InputHasComboboxRole: Story = {
  render: () => <Combobox label="X" options={PEOPLE} />,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input[role="combobox"]');
    await expect(input).not.toBeNull();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  },
};

export const TypingFiltersAndPickingFires: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <div data-testid="wrap">
        <Combobox label="X" value={v} onChange={setV} options={PEOPLE} />
        <p data-testid="value">{v ?? '—'}</p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input[role="combobox"]') as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.type(input, 'tom');
    // Listbox shows Tom Cook; press Enter to pick.
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    const out = canvasElement.querySelector('[data-testid="value"]');
    await expect(out?.textContent).toBe('tom');
  },
};

// In the dark themes `dark:border-*` used to win over `focus:border-*` (#151).
export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Assigned to', options: PEOPLE },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('combobox'));
  },
};

export const ErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Assigned to', options: PEOPLE, error: 'Pick someone' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('combobox'), { token: '--color-red-500' });
  },
};

export const ErrorIsLinkedAsDescription: Story = {
  tags: ['!dev'],
  args: { label: 'Assigned to', options: PEOPLE, error: 'Pick someone' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Assigned to' });
    await expect(field).toHaveAccessibleDescription('Pick someone');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

export const DescriptionIsLinked: Story = {
  tags: ['!dev'],
  args: { label: 'Assigned to', options: PEOPLE, helperText: 'Owner of the ticket.' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Assigned to' });
    await expect(field).toHaveAccessibleDescription('Owner of the ticket.');
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

// Tab and a blur used to leave the listbox open over the next field (#151).
const WithNeighbour = (props: { options: typeof PEOPLE }) => (
  <div>
    <Combobox label="Assigned to" {...props} />
    <button type="button">After</button>
  </div>
);

export const ClosesOnTab: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <WithNeighbour options={PEOPLE} />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await userEvent.tab();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  },
};

export const ClosesWhenFocusLeaves: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <WithNeighbour options={PEOPLE} />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    canvas.getByRole('button', { name: 'After' }).focus();
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
  },
};

export const ArrowKeysSkipDisabledOptions: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Assigned to',
    options: [
      { value: 'a', label: 'Alice' },
      { value: 'b', label: 'Bob', disabled: true },
      { value: 'c', label: 'Carol' },
    ],
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');
    const active = input.getAttribute('aria-activedescendant') ?? '';
    await expect(document.getElementById(active)).toHaveTextContent('Carol');
    await userEvent.keyboard('{ArrowUp}');
    const back = input.getAttribute('aria-activedescendant') ?? '';
    await expect(document.getElementById(back)).toHaveTextContent('Alice');
    // Announced as unavailable, and its dimmed text exempt from axe's contrast check.
    const options = within(document.body);
    await expect(options.getByRole('option', { name: 'Bob' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    await expect(options.getByRole('option', { name: 'Alice' })).not.toHaveAttribute(
      'aria-disabled'
    );
  },
};

// Native placeholders sat under 4.5:1 on light and sand (#151).
export const PlaceholderContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Combobox label="Person" options={PEOPLE} placeholder="Find a person…" />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    inEachTheme(() => expectPlaceholderContrast(input));
  },
};

const comboboxRef = createRef<HTMLInputElement>();

/** The ref gets the combobox `<input>`, not the toggle button, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Combobox ref={comboboxRef} label="Assigned to" options={PEOPLE} />,
  play: async ({ canvas }) => {
    await expectRefFocuses(comboboxRef, canvas.getByRole('combobox', { name: 'Assigned to' }));
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
    <div className="max-w-md space-y-4">
      <Combobox label="Own" options={PEOPLE} defaultValue="tom" onChange={args.onChange} />
      <Combobox label="Held" options={PEOPLE} value="tom" onChange={args.onChange} />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = canvas.getByRole('combobox', { name: 'Own' });
    await expect(own).toHaveValue('Tom Cook');
    await userEvent.clear(own);
    await userEvent.type(own, 'Dries');
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('dries');
    await expect(own).toHaveValue('Dries Vincent');

    const held = canvas.getByRole('combobox', { name: 'Held' });
    await userEvent.clear(held);
    await userEvent.type(held, 'Dries');
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('dries');
    // Closed again, the field mirrors the value it is given.
    await expect(held).toHaveValue('Tom Cook');
  },
};

// ── Open state (#151) ────────────────────────────────────────────────────────
// `open` / `defaultOpen` / `onOpenChange`, only `undefined` meaning uncontrolled.
// `defaultOpen` starts it open and it closes on its own; held at a fixed `open`,
// it reports what the user asks for and keeps the state it is given.

export const OpenStateDefaultOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() },
  render: (args) => (
    <div className="max-w-md space-y-4">
      <Combobox label="Own" options={PEOPLE} defaultOpen onOpenChange={args.onOpenChange} />
      <div className="pt-64">
        <Combobox label="Held" options={PEOPLE} open={false} onOpenChange={args.onOpenChange} />
      </div>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = canvas.getByRole('combobox', { name: 'Own' });
    await expect(own).toHaveAttribute('aria-expanded', 'true');
    // Focus asks to open a list already open: nothing to report.
    await userEvent.click(own);
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(own).toHaveAttribute('aria-expanded', 'false');

    const held = canvas.getByRole('combobox', { name: 'Held' });
    await userEvent.click(held);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await expect(held).toHaveAttribute('aria-expanded', 'false');
    await expect(within(document.body).queryByRole('listbox')).toBeNull();
  },
};

// ── Floating listbox (#151) ──────────────────────────────────────────────────
// The listbox renders in a portal: no `overflow: hidden` ancestor clips it, and
// it follows its field while the page scrolls.

const page = within(document.body);

/** A card that clips its content no longer cuts the listbox off. */
export const ListboxEscapesOverflowHidden: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="clip" className="h-28 max-w-md overflow-hidden rounded-lg border p-3">
      <Combobox label="Assigned to" options={PEOPLE} />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'));
    expectOutsideClip(await page.findByRole('listbox'), canvas.getByTestId('clip'));
  },
};

/** The listbox follows its field on scroll, as wide; Escape and an outside click close it. */
export const ListboxFollowsFieldAndCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="scroller" className="h-64 overflow-y-auto">
      <div className="max-w-md space-y-4 p-6 pb-[600px]">
        <Combobox label="Assigned to" options={PEOPLE} />
        <button type="button">Outside</button>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    const field = input.parentElement!;
    await userEvent.click(input);
    const listbox = await page.findByRole('listbox');
    await scrollAnchor(canvas.getByTestId('scroller'), field);
    await waitFor(() => expectBelow(listbox, field, { offset: 4, align: 'start' }));
    await expect(listbox.getBoundingClientRect().width).toBeCloseTo(
      field.getBoundingClientRect().width,
      0
    );

    await userEvent.keyboard('{Escape}');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(page.queryByRole('listbox')).toBeNull();
    await expect(input).toHaveFocus();

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle options' }));
    await page.findByRole('listbox');
    await userEvent.click(canvas.getByRole('button', { name: 'Outside' }));
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(page.queryByRole('listbox')).toBeNull();
  },
};

/** A click on an option picks it: the listbox in its portal is still part of the field. */
export const ClickOnAnOptionPicks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <Combobox label="Assigned to" options={PEOPLE} onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.click(await page.findByRole('option', { name: 'Tom Cook' }));
    await expect(args.onChange).toHaveBeenCalledWith('tom');
    await expect(input).toHaveValue('Tom Cook');
    await expect(input).toHaveFocus();
    await expect(page.queryByRole('listbox')).toBeNull();
  },
};

// A disabled option shows the not-allowed cursor, not the pointer of its default (#290).
export const DisabledOptionShowsNotAllowedCursor: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Assigned to',
    options: [
      { value: 'a', label: 'Alice' },
      { value: 'b', label: 'Bob', disabled: true },
    ],
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'));
    const options = within(document.body);
    await expect(getComputedStyle(options.getByRole('option', { name: 'Bob' })).cursor).toBe(
      'not-allowed'
    );
    await expect(getComputedStyle(options.getByRole('option', { name: 'Alice' })).cursor).toBe(
      'pointer'
    );
  },
};
