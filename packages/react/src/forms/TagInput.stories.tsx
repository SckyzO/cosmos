import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  expectFocusBorder,
  expectNoHorizontalOverflow,
  expectPlaceholderContrast,
  expectRefFocuses,
  inEachTheme,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { TagInput } from './TagInput';

const meta = {
  title: 'Forms/TagInput',
  component: TagInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const SUGGESTIONS = ['design', 'frontend', 'backend', 'infrastructure', 'security', 'docs'];

const page = within(document.body);

export const Basic: Story = {
  render: () => {
    const [v, setV] = useState<string[]>(['design', 'release']);
    return (
      <div className="max-w-md bg-white p-8 dark:bg-gray-900">
        <TagInput label="Tags" placeholder="Add a tag" value={v} onChange={setV} />
      </div>
    );
  },
};

export const WithSuggestions: Story = {
  parameters: portalDocsParams.lg(),
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <TagInput
        label="Tags"
        placeholder="Add a tag"
        suggestions={SUGGESTIONS}
        defaultValue={['design']}
        defaultOpen
      />
    </div>
  ),
};

/** `validate` turns a text down: it stays in the input and the field says why. */
export const WithValidation: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <TagInput
        label="Invite by email"
        placeholder="name@example.com"
        defaultValue={['leslie@example.com']}
        validate={(text) => /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(text)}
        invalidMessage="Enter a valid email address."
        helperText="Press Enter or comma to add an address."
        separators={['Enter', ',', ' ']}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Invite by email' }),
      'not-an-email{Enter}'
    );
  },
};

/** A pasted list adds each of its items. */
export const PasteAList: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <TagInput label="Tags" placeholder="Paste a list" />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('textbox', { name: 'Tags' }));
    await userEvent.paste('design, frontend,backend, , design,security');
    await expect(canvas.getAllByRole('button', { name: /^Remove/ })).toHaveLength(4);
  },
};

export const MaxTags: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <TagInput label="Tags" maxTags={3} defaultValue={['design', 'docs', 'release']} />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <TagInput label="Tags" required error="Add at least one tag." />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="max-w-md space-y-4 bg-white p-8 dark:bg-gray-900">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <TagInput key={size} label={size} size={size} defaultValue={['design', 'docs']} />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="max-w-md bg-white p-8 dark:bg-gray-900">
      <TagInput label="Tags" disabled defaultValue={['design', 'docs']} />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState<string[]>(['design']);
    return (
      <div className="max-w-md space-y-3 bg-white p-8 dark:bg-gray-900">
        <TagInput label="Tags" value={v} onChange={setV} />
        <p className="text-sm text-gray-600 dark:text-gray-300" data-testid="value">
          {v.length ? v.join(', ') : 'no tags'}
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
    await userEvent.type(canvas.getByRole('textbox', { name: 'Tags' }), 'docs{Enter}');
    await expect(canvas.getByTestId('value')).toHaveTextContent('design, docs');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(canvas.getByTestId('value')).toHaveTextContent('no tags');
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const EnterAndCommaAddTags: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    await userEvent.type(input, 'one{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['one']);
    await userEvent.type(input, 'two,');
    await expect(args.onChange).toHaveBeenLastCalledWith(['one', 'two']);
    // The comma is not typed, and the input is empty again.
    await expect(input).toHaveValue('');
    await userEvent.type(input, '  three  {Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['one', 'two', 'three']);
    // Nothing typed: nothing added.
    await userEvent.type(input, '{Enter},');
    await expect(args.onChange).toHaveBeenCalledTimes(3);
    await expect(input).toHaveValue('');
  },
};

export const SeparatorsAreConfigurable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', separators: [';', 'Tab'], onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    await expect(input).toHaveAccessibleDescription(/^Press semicolon or Tab to add a tag\./);
    // Enter and comma are text now.
    await userEvent.type(input, 'a,b{Enter}');
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.type(input, ';');
    await expect(args.onChange).toHaveBeenLastCalledWith(['a,b']);
    await userEvent.type(input, 'c{Tab}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['a,b', 'c']);
    await expect(input).toHaveFocus();
  },
};

export const PasteSplitsOnSeparators: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    await userEvent.click(input);
    await userEvent.paste('one, two,three,, one');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenLastCalledWith(['one', 'two', 'three']);
    await expect(input).toHaveValue('');
    // No separator in the text: it is typed in as any paste.
    await userEvent.paste('four');
    await expect(input).toHaveValue('four');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

export const NoDuplicates: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', defaultValue: ['Design'], onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    await userEvent.type(input, 'design{Enter}');
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(canvas.getAllByRole('button', { name: /^Remove/ })).toHaveLength(1);
    await expect(canvas.getByRole('status')).toHaveTextContent('design is already added');
  },
};

export const BackspaceRemovesTheLastTagOnlyWhenEmpty: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', defaultValue: ['one', 'two', 'three'], onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    await userEvent.click(input);
    await userEvent.type(input, 'x{Backspace}');
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{Backspace}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['one', 'two']);
    await userEvent.keyboard('{Backspace}{Backspace}');
    await expect(args.onChange).toHaveBeenLastCalledWith([]);
    await userEvent.keyboard('{Backspace}');
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

export const RemoveButtonRemovesAndFocusReturnsToTheInput: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', defaultValue: ['one', 'two'], onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Remove one' }));
    await expect(args.onChange).toHaveBeenCalledWith(['two']);
    await expect(canvas.getByRole('textbox')).toHaveFocus();
  },
};

export const ValidateRejectsWithTheError: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Tags',
    validate: (text: string) => /^[a-z]+$/.test(text),
    invalidMessage: 'Lowercase letters only.',
    onChange: fn(),
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    await userEvent.type(input, 'Nope{Enter}');
    await expect(args.onChange).not.toHaveBeenCalled();
    // The text stays for the user to fix, and the field says why.
    await expect(input).toHaveValue('Nope');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(/^Lowercase letters only\./);
    await expect(canvas.getByRole('status')).toHaveTextContent('Lowercase letters only.');
    await userEvent.clear(input);
    await userEvent.type(input, 'fine{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['fine']);
    await expect(input).not.toHaveAttribute('aria-invalid');
  },
};

export const DefaultMessageForARejectedText: Story = {
  tags: ['!dev'],
  args: { label: 'Tags', validate: () => false },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    await userEvent.type(input, 'abc{Enter}');
    await expect(input).toHaveAccessibleDescription(/^"abc" is not a valid tag\./);
  },
};

export const ErrorPropWinsOverValidation: Story = {
  tags: ['!dev'],
  args: { label: 'Tags', error: 'Add at least one tag.', validate: () => false },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    await userEvent.type(input, 'abc{Enter}');
    await expect(input).toHaveAccessibleDescription('Add at least one tag. 0 tags');
  },
};

export const MaxTagsRefusesMore: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', maxTags: 2, defaultValue: ['one', 'two'], onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    await expect(input).toHaveAccessibleDescription(/2 of 2 tags$/);
    await userEvent.type(input, 'three{Enter}');
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole('status')).toHaveTextContent('Maximum of 2 tags reached');
    // The refused text stays in the input; emptied, Backspace frees a place.
    await userEvent.clear(input);
    await userEvent.keyboard('{Backspace}');
    await userEvent.type(input, 'three{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['one', 'three']);
  },
};

export const SuggestionsPickWithTheKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', suggestions: SUGGESTIONS, defaultValue: ['design'], onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Tags' });
    await userEvent.click(input);
    const listbox = await page.findByRole('listbox', { name: 'Suggestions' });
    // The ones already added are not offered again.
    await expect(within(listbox).queryByRole('option', { name: 'design' })).toBeNull();
    await expect(within(listbox).getAllByRole('option')).toHaveLength(SUGGESTIONS.length - 1);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['design', 'backend']);
    // Stays open for the next one.
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await userEvent.type(input, 'sec');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(1);
    await userEvent.click(within(listbox).getByRole('option', { name: 'security' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['design', 'backend', 'security']);
  },
};

/** Enter adds the typed text, not the first suggestion, until an arrow key picks one. */
export const EnterAddsTheTypedTextNotTheFirstSuggestion: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', suggestions: SUGGESTIONS, onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.type(canvas.getByRole('combobox', { name: 'Tags' }), 'des{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['des']);
  },
};

export const AnnouncesAdditionsAndRemovals: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Tags', maxTags: 5 },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Tags' });
    const status = canvas.getByRole('status');
    await userEvent.type(input, 'one{Enter}');
    await expect(status).toHaveTextContent('one added, 1 tags');
    await userEvent.type(input, 'two{Enter}');
    await expect(status).toHaveTextContent('two added, 2 tags');
    await userEvent.keyboard('{Backspace}');
    await expect(status).toHaveTextContent('two removed, 1 tags');
    await userEvent.paste('a,b');
    await expect(status).toHaveTextContent('a, b added, 3 tags');
  },
};

export const HelperAndCountAreTheDescription: Story = {
  tags: ['!dev'],
  args: { label: 'Tags', defaultValue: ['one'] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Tags' })).toHaveAccessibleDescription(
      'Press Enter or comma to add a tag. 1 tag'
    );
  },
};

/** Only the remove buttons of the tags take Tab, then the input. */
export const TagsAreNotExtraTabStops: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <TagInput label="Tags" defaultValue={['one', 'two']} />
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas }) => {
    const stops = [
      canvas.getByRole('button', { name: 'Remove one' }),
      canvas.getByRole('button', { name: 'Remove two' }),
      canvas.getByRole('textbox'),
      canvas.getByRole('button', { name: 'After' }),
    ];
    stops[0]!.focus();
    for (const stop of stops.slice(1)) {
      await userEvent.tab();
      await expect(stop).toHaveFocus();
    }
  },
};

export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Tags' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await expectFocusBorder(input, { border: input.parentElement! });
  },
};

export const ErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Tags', error: 'Add a tag' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await expectFocusBorder(input, { border: input.parentElement!, token: '--color-red-500' });
  },
};

export const PlaceholderContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <TagInput label="Tags" placeholder="Add a tag…" />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    inEachTheme(() => expectPlaceholderContrast(input));
  },
};

export const EmptyFieldMatchesTheOtherFieldHeights: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md space-y-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <TagInput key={size} label={size} size={size} placeholder={size} />
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

const tagInputRef = createRef<HTMLInputElement>();

export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <TagInput ref={tagInputRef} label="Tags" />,
  play: async ({ canvas }) => {
    await expectRefFocuses(tagInputRef, canvas.getByRole('textbox', { name: 'Tags' }));
  },
};

// Only `undefined` means uncontrolled (#151): the held one reports the change and keeps its value.
export const DefaultValueOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <div className="max-w-md space-y-4">
      <TagInput label="Own" defaultValue={['one']} onChange={args.onChange} />
      <TagInput label="Held" value={['one']} onChange={args.onChange} />
    </div>
  ),
  play: async ({ args, canvas }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Own' }), 'two{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['one', 'two']);
    await expect(canvas.getAllByRole('button', { name: 'Remove two' })).toHaveLength(1);

    await userEvent.type(canvas.getByRole('textbox', { name: 'Held' }), 'three{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['one', 'three']);
    await expect(canvas.queryAllByRole('button', { name: 'Remove three' })).toHaveLength(0);
  },
};

export const OpenStateDefaultOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() },
  render: (args) => (
    <div className="max-w-md space-y-4">
      <TagInput
        label="Own"
        suggestions={SUGGESTIONS}
        defaultOpen
        onOpenChange={args.onOpenChange}
      />
      <div className="pt-64">
        <TagInput
          label="Held"
          suggestions={SUGGESTIONS}
          open={false}
          onOpenChange={args.onOpenChange}
        />
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

/** At 375px the tags wrap and the input keeps its minimum width: the page does not scroll sideways. */
export const MobileKeepsTheInputUsable: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <div className="p-4">
      <TagInput
        label="Tags"
        placeholder="Add a tag"
        defaultValue={[
          'design',
          'frontend',
          'backend',
          'infrastructure',
          'a-very-long-tag-name-that-must-truncate-not-widen-the-page',
        ]}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const input = canvas.getByRole('textbox');
    await expect(input.getBoundingClientRect().width).toBeGreaterThanOrEqual(96);
    await expect(input.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
  },
};
