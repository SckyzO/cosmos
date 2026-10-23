import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { expectFocusBorder, expectPlaceholderContrast, inEachTheme } from '../storybook-helpers';
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
    const [v, setV] = useState<string | undefined>();
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
    const [v, setV] = useState<string | undefined>();
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
    const [v, setV] = useState<string | undefined>();
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
    const [v, setV] = useState<string | undefined>();
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
  args: { options: PEOPLE },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('combobox'));
  },
};

export const ErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { options: PEOPLE, error: 'Pick someone' },
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
