import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectFocusBorder,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectPlaceholderContrast,
  expectReadsLeftToRight,
  expectRefFocuses,
  inEachTheme,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { MultiSelect } from './MultiSelect';

const meta = {
  title: 'Forms/MultiSelect',
  component: MultiSelect,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options: [] },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'billing', label: 'Billing' },
  { value: 'support', label: 'Support' },
  { value: 'auditor', label: 'Auditor' },
];

const WITH_SECONDARY = [
  { value: 'admin', label: 'Administrator', secondary: 'Full access to the workspace' },
  { value: 'editor', label: 'Editor', secondary: 'Create and edit content' },
  { value: 'viewer', label: 'Viewer', secondary: 'Read-only access' },
  { value: 'billing', label: 'Billing', secondary: 'Invoices and payment methods' },
  { value: 'support', label: 'Support', secondary: 'Answer tickets', disabled: true },
];

const page = within(document.body);

export const Basic: Story = {
  render: () => {
    const [v, setV] = useState<string[]>(['editor']);
    return (
      <div className="max-w-md bg-white p-8 dark:bg-gray-900">
        <MultiSelect
          label="Roles"
          placeholder="Pick roles"
          value={v}
          onChange={setV}
          options={ROLES}
          helperText="A user can hold several roles."
        />
      </div>
    );
  },
};

/** The open list: a checkbox, the label, the secondary line; chosen labels are semibold. */
export const WithSecondaryText: Story = {
  parameters: portalDocsParams.lg(),
  render: () => {
    const [v, setV] = useState<string[]>(['editor', 'viewer']);
    return (
      <div className="max-w-md bg-white p-8 dark:bg-gray-900">
        <MultiSelect label="Roles" value={v} onChange={setV} options={WITH_SECONDARY} defaultOpen />
      </div>
    );
  },
};

/** Every value stays visible: the field grows onto more lines. */
export const ManyValues: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <MultiSelect
        label="Roles"
        defaultValue={['admin', 'editor', 'viewer', 'billing', 'support', 'auditor']}
        options={ROLES}
      />
    </div>
  ),
};

export const MaxItems: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <MultiSelect
        label="Roles"
        maxItems={2}
        defaultValue={['admin', 'editor']}
        options={ROLES}
        helperText="At most two roles."
      />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <MultiSelect label="Roles" options={ROLES} error="Pick at least one role." required />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="max-w-md space-y-4 bg-white p-8 dark:bg-gray-900">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <MultiSelect
          key={size}
          label={size}
          size={size}
          defaultValue={['admin', 'editor']}
          options={ROLES}
        />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <MultiSelect label="Roles" disabled defaultValue={['admin', 'editor']} options={ROLES} />
    </div>
  ),
};

/** Held by the host: the chosen values are shown below, and cleared from outside. */
export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState<string[]>(['admin']);
    return (
      <div className="max-w-md space-y-3 bg-white p-8 dark:bg-gray-900">
        <MultiSelect label="Roles" value={v} onChange={setV} options={ROLES} />
        <p className="text-sm text-gray-600 dark:text-gray-300" data-testid="value">
          {v.length ? v.join(', ') : 'nothing chosen'}
        </p>
        <button
          type="button"
          onClick={() => setV([])}
          className="focus-visible:focus-indicator text-brand-600 dark:text-brand-400 rounded-md text-sm underline"
        >
          Clear
        </button>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Roles' }));
    await userEvent.click(await page.findByRole('option', { name: 'Billing' }));
    await expect(canvas.getByTestId('value')).toHaveTextContent('admin, billing');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(canvas.getByTestId('value')).toHaveTextContent('nothing chosen');
    await expect(canvas.queryByRole('button', { name: /^Remove/ })).toBeNull();
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const KeyboardPicksAndKeepsTheListOpen: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Roles', options: ROLES, onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Roles' });
    await userEvent.click(input);
    const listbox = await page.findByRole('listbox');
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    // The first option is active when the list opens.
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['admin']);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['admin', 'viewer']);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('option', { name: 'Administrator' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.getByRole('option', { name: 'Editor' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
    await expect(canvas.getByRole('button', { name: 'Remove Administrator' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Remove Viewer' })).toBeVisible();
  },
};

export const PickingAChosenOptionRemovesIt: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Roles', options: ROLES, defaultValue: ['admin', 'editor'], onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(await page.findByRole('option', { name: 'Administrator' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['editor']);
    await expect(canvas.queryByRole('button', { name: 'Remove Administrator' })).toBeNull();
    await expect(page.getByRole('listbox')).toBeVisible();
  },
};

export const TypingFiltersTheList: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Roles', options: ROLES, onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'aud');
    await expect(page.getAllByRole('option')).toHaveLength(1);
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenCalledWith(['auditor']);
    // A pick empties the query, the whole list is back for the next one.
    await expect(input).toHaveValue('');
    await expect(page.getAllByRole('option')).toHaveLength(ROLES.length);
    await userEvent.type(input, 'zzz');
    await expect(page.getByText('No matches found.')).toBeVisible();
  },
};

export const BackspaceRemovesTheLastValueOnlyWhenEmpty: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Roles',
    options: ROLES,
    defaultValue: ['admin', 'editor', 'viewer'],
    onChange: fn(),
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'ab');
    await userEvent.keyboard('{Backspace}');
    // Erasing a letter does not touch the tags.
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{Backspace}');
    await userEvent.keyboard('{Backspace}');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenLastCalledWith(['admin', 'editor']);
    await expect(input).toHaveFocus();
    await userEvent.keyboard('{Backspace}{Backspace}');
    await expect(args.onChange).toHaveBeenLastCalledWith([]);
    // Nothing left to remove.
    await userEvent.keyboard('{Backspace}');
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

export const RemoveButtonRemovesAndFocusReturnsToTheInput: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Roles', options: ROLES, defaultValue: ['admin', 'editor'], onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Administrator' }));
    await expect(args.onChange).toHaveBeenCalledWith(['editor']);
    await expect(canvas.getByRole('combobox')).toHaveFocus();
  },
};

export const MaxItemsDisablesTheOtherOptions: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Roles', options: ROLES, maxItems: 2, defaultValue: ['admin'], onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox');
    await expect(input).toHaveAccessibleDescription('1 of 2 selected');
    await userEvent.click(input);
    await userEvent.click(await page.findByRole('option', { name: 'Editor' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['admin', 'editor']);
    await expect(page.getByRole('option', { name: 'Viewer' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    await userEvent.click(page.getByRole('option', { name: 'Viewer' }));
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    // A chosen one can still be unchosen, which frees the others.
    await userEvent.click(page.getByRole('option', { name: 'Editor' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['admin']);
    await expect(page.getByRole('option', { name: 'Viewer' })).not.toHaveAttribute('aria-disabled');
  },
};

/** The arrows step over a disabled option. */
export const ArrowKeysSkipDisabledOptions: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Roles', options: WITH_SECONDARY.slice(2).concat(WITH_SECONDARY.slice(0, 1)) },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    const active = document.getElementById(input.getAttribute('aria-activedescendant') ?? '');
    // Viewer, Billing, Support (disabled), Administrator: the third step lands on the last.
    await expect(active).toHaveTextContent('Administrator');
  },
};

export const AnnouncesChanges: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Roles', options: ROLES },
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.keyboard('{Enter}');
    await expect(status).toHaveTextContent('Administrator added, 1 selected');
    await userEvent.keyboard('{Backspace}');
    await expect(status).toHaveTextContent('Administrator removed, 0 selected');
  },
};

export const CountIsInTheDescription: Story = {
  tags: ['!dev'],
  args: {
    label: 'Roles',
    options: ROLES,
    defaultValue: ['admin', 'editor'],
    helperText: 'A user can hold several roles.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: 'Roles' })).toHaveAccessibleDescription(
      'A user can hold several roles. 2 selected'
    );
  },
};

export const ErrorIsLinkedAsDescription: Story = {
  tags: ['!dev'],
  args: { label: 'Roles', options: ROLES, error: 'Pick at least one role.' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Roles' });
    await expect(field).toHaveAccessibleDescription('Pick at least one role. None selected');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

/** Only the remove buttons of the tags take Tab, then the input; the toggle is for the pointer. */
export const TagsAreNotExtraTabStops: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <MultiSelect label="Roles" options={ROLES} defaultValue={['admin', 'editor']} />
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas }) => {
    const stops = [
      canvas.getByRole('button', { name: 'Remove Administrator' }),
      canvas.getByRole('button', { name: 'Remove Editor' }),
      canvas.getByRole('combobox'),
      canvas.getByRole('button', { name: 'After' }),
    ];
    stops[0]!.focus();
    for (const stop of stops.slice(1)) {
      await userEvent.tab();
      await expect(stop).toHaveFocus();
    }
    await expect(canvas.getByRole('button', { name: 'Toggle options' })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  },
};

// A tag chosen last is still shown: the field grows instead of collapsing to "+N".
export const AllTagsStayVisibleAndWrap: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="w-72">
      <MultiSelect
        label="Roles"
        options={ROLES}
        defaultValue={ROLES.map((r) => r.value)}
        size="md"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    const field = input.parentElement!;
    const tops = new Set<number>();
    for (const b of canvas.getAllByRole('button', { name: /^Remove/ })) {
      await expect(b).toBeVisible();
      tops.add(Math.round(b.getBoundingClientRect().top));
    }
    await expect(canvas.getAllByRole('button', { name: /^Remove/ })).toHaveLength(ROLES.length);
    await expect(tops.size).toBeGreaterThan(1);
    // Grown past the height of a single-row field (md: 36px).
    await expect(field.getBoundingClientRect().height).toBeGreaterThan(36);
    await expect(input.getBoundingClientRect().width).toBeGreaterThanOrEqual(96);
  },
};

// A single row of tags keeps the height of the other fields of its size.
export const EmptyFieldMatchesTheOtherFieldHeights: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md space-y-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <MultiSelect key={size} label={size} size={size} options={ROLES} placeholder={size} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const heights = { sm: 32, md: 36, lg: 44 };
    for (const [size, height] of Object.entries(heights)) {
      const field = canvas.getByPlaceholderText(size).parentElement!;
      await expect(field.getBoundingClientRect().height).toBe(height);
    }
  },
};

export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Roles', options: ROLES },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await expectFocusBorder(input, { border: input.parentElement! });
  },
};

export const ErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Roles', options: ROLES, error: 'Pick a role' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await expectFocusBorder(input, { border: input.parentElement!, token: '--color-red-500' });
  },
};

export const PlaceholderContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <MultiSelect label="Roles" options={ROLES} placeholder="Pick roles…" />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    inEachTheme(() => expectPlaceholderContrast(input));
  },
};

const multiSelectRef = createRef<HTMLInputElement>();

/** The ref gets the combobox `<input>`, not the toggle button. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <MultiSelect ref={multiSelectRef} label="Roles" options={ROLES} />,
  play: async ({ canvas }) => {
    await expectRefFocuses(multiSelectRef, canvas.getByRole('combobox', { name: 'Roles' }));
  },
};

// Only `undefined` means uncontrolled (#151): the held one reports the change and keeps its value.
export const DefaultValueOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <div className="max-w-md space-y-4">
      <MultiSelect label="Own" options={ROLES} defaultValue={['admin']} onChange={args.onChange} />
      <MultiSelect label="Held" options={ROLES} value={['admin']} onChange={args.onChange} />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = canvas.getByRole('combobox', { name: 'Own' });
    await userEvent.click(own);
    await userEvent.click(await page.findByRole('option', { name: 'Editor' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['admin', 'editor']);
    await expect(canvas.getAllByRole('button', { name: 'Remove Editor' })).toHaveLength(1);

    const held = canvas.getByRole('combobox', { name: 'Held' });
    await userEvent.click(held);
    await userEvent.click(await page.findByRole('option', { name: 'Viewer' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['admin', 'viewer']);
    // The host did not pass it back.
    await expect(canvas.queryAllByRole('button', { name: 'Remove Viewer' })).toHaveLength(0);
  },
};

export const OpenStateDefaultOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() },
  render: (args) => (
    <div className="max-w-md space-y-4">
      <MultiSelect label="Own" options={ROLES} defaultOpen onOpenChange={args.onOpenChange} />
      <div className="pt-64">
        <MultiSelect label="Held" options={ROLES} open={false} onOpenChange={args.onOpenChange} />
      </div>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = canvas.getByRole('combobox', { name: 'Own' });
    await expect(own).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(own);
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(own).toHaveAttribute('aria-expanded', 'false');

    const held = canvas.getByRole('combobox', { name: 'Held' });
    await userEvent.click(held);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await expect(held).toHaveAttribute('aria-expanded', 'false');
    await expect(page.queryByRole('listbox')).toBeNull();
  },
};

export const ClosesOnTabAndWhenFocusLeaves: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <MultiSelect label="Roles" options={ROLES} />
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await userEvent.tab();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(input);
    canvas.getByRole('button', { name: 'After' }).focus();
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
  },
};

/** A press on the empty part of the box puts the caret in the input and opens the list. */
export const PressingTheBoxFocusesTheInput: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Roles', options: ROLES, defaultValue: ['admin'] },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.click(input.parentElement!);
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  },
};

/** At 375px the tags wrap and the input keeps its minimum width: the page does not scroll sideways. */
export const MobileKeepsTheInputUsable: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <div className="p-4">
      <MultiSelect
        label="Roles"
        options={ROLES}
        defaultValue={ROLES.map((r) => r.value)}
        placeholder="Pick roles"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const input = canvas.getByRole('combobox');
    await expect(input.getBoundingClientRect().width).toBeGreaterThanOrEqual(96);
    await expect(input.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** `labelHidden` keeps the label for assistive technology and takes its row out of the layout. */
export const LabelHiddenTakesNoRoom: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Roles',
    labelHidden: true,
    options: ROLES,
    defaultValue: ['admin', 'editor'],
    className: 'w-72',
  },
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'Roles' });
    const root = canvasElement.querySelector<HTMLElement>('.w-72')!;
    const field = input.closest<HTMLElement>('.relative')!;
    await expect(Math.round(field.getBoundingClientRect().top)).toBe(
      Math.round(root.getBoundingClientRect().top)
    );
    await expect(canvas.getByText('2 selected').closest('span')).toHaveClass('sr-only');
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The tags start at the start edge and the toggle sits on the end one. */
export const TagsAndToggleMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <MultiSelect label="Roles" options={ROLES} defaultValue={['editor']} onChange={() => {}} />
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('button', { name: 'Toggle options' })
    );
    expectMirrored(
      canvasElement,
      (box) => box.querySelector('[role="combobox"]')!.previousElementSibling
    );
    for (const dir of ['ltr', 'rtl'] as const) {
      expectReadsLeftToRight(within(directionBox(canvasElement, dir)).getByText('1 selected'));
    }
  },
};
