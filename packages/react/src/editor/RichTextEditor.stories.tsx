import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectFocusBorder,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  expectTextContrast,
  inDirection,
  inEachTheme,
  keyToEnd,
  keyToStart,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { RichTextEditor } from './RichTextEditor';
import { InEachDensity, expectDensitySteps } from '../storybook-density';

const meta = {
  title: 'Forms/Rich Text Editor',
  component: RichTextEditor,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Message', placeholder: 'Write your message…' },
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE = [
  '<h2>Release notes</h2>',
  '<p>The <strong>2.4</strong> release ships <em>faster</em> deploys and a <s>flaky</s> retry fix.',
  ' Read the <a href="https://example.com/changelog">changelog</a> or run <code>make ci</code>.</p>',
  '<ul><li><p>Rolling restarts</p></li><li><p>Audit log export</p></li></ul>',
  '<ol><li><p>Pull the image</p></li><li><p>Restart the pods</p></li></ol>',
  '<blockquote><p>Nothing here changes a default.</p></blockquote>',
].join('');

// The editor is created after the first render, so every test waits for its text.
const textbox = (canvasElement: HTMLElement, name = 'Message') =>
  within(canvasElement).findByRole('textbox', { name });

// The last value `onChange` reported.
const lastValue = (onChange: unknown) =>
  (onChange as ReturnType<typeof fn>).mock.lastCall?.[0] as unknown;

// ── Visible stories: no interaction ──────────────────────────────────────────

export const Empty: Story = {};

export const WithContent: Story = {
  args: { defaultValue: SAMPLE, description: 'Headings, lists, quotes, code and links.' },
};

export const ReadOnly: Story = {
  args: { defaultValue: SAMPLE, readOnly: true },
};

export const Disabled: Story = {
  args: { defaultValue: '<p>You cannot edit me.</p>', disabled: true },
};

export const WithError: Story = {
  args: {
    label: 'Reply',
    required: true,
    error: 'Write a reply before sending.',
  },
};

export const CharacterLimit: Story = {
  args: {
    label: 'Product summary',
    maxLength: 160,
    description: 'Shown in the catalogue. Typing stops at the limit.',
    defaultValue: '<p>A rack-mounted power distribution unit with per-outlet metering.</p>',
  },
};

export const OverTheLimit: Story = {
  args: {
    label: 'Product summary',
    maxLength: 20,
    defaultValue: '<p>This summary was written before the limit existed.</p>',
  },
};

export const Bubble: Story = {
  args: {
    variant: 'bubble',
    label: 'Page content',
    description:
      'Select some text: a small toolbar opens over it. Alt+F10 moves the focus into it.',
    defaultValue: SAMPLE,
  },
};

export const Minimal: Story = {
  args: {
    variant: 'minimal',
    label: 'Comment',
    placeholder: 'Type **bold**, _italic_, "## " for a heading, "- " for a list…',
    description: 'No toolbar: shortcuts and Markdown-like input rules.',
  },
};

export const SomeButtons: Story = {
  args: {
    toolbar: ['bold', 'italic', 'link', 'undo', 'redo'],
    defaultValue: '<p>Only the buttons the host picked.</p>',
  },
};

export const TranslatedLabels: Story = {
  args: {
    label: 'Message',
    toolbar: ['bold', 'italic', 'link'],
    labels: { bold: 'Gras', italic: 'Italique', link: 'Lien', toolbar: 'Mise en forme' },
  },
};

export const JsonFormat: Story = {
  render: function Render(args) {
    const [json, setJson] = useState<unknown>();
    return (
      <div className="space-y-3">
        <RichTextEditor
          label={args.label}
          placeholder={args.placeholder}
          format="json"
          onChange={setJson}
        />
        <pre className="max-h-48 overflow-auto rounded-lg bg-gray-100 p-3 text-xs dark:bg-gray-800">
          {json ? JSON.stringify(json, null, 2) : 'Type to see the document.'}
        </pre>
      </div>
    );
  },
};

export const Controlled: Story = {
  render: function Render(args) {
    const [html, setHtml] = useState('<p>Controlled by the page.</p>');
    return (
      <div className="space-y-3">
        <RichTextEditor
          label={args.label}
          placeholder={args.placeholder}
          value={html}
          onChange={setHtml}
        />
        <button
          type="button"
          onClick={() => setHtml('')}
          className="focus-visible:focus-indicator rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600"
        >
          Clear from the page
        </button>
        <pre className="overflow-auto rounded-lg bg-gray-100 p-3 text-xs dark:bg-gray-800">
          {html || '(empty)'}
        </pre>
      </div>
    );
  },
};

export const Narrow: Story = {
  globals: mobileViewport,
  args: { defaultValue: SAMPLE },
  play: async ({ canvasElement }) => {
    await textbox(canvasElement);
    expectNoHorizontalOverflow(canvasElement);
  },
};

// ── Tests: hidden from the sidebar and the docs ─────────────────────────────

const test = { tags: ['!dev', '!autodocs'] };

const MARKS: ReadonlyArray<[name: string, tag: string]> = [
  ['Bold', '<strong>'],
  ['Italic', '<em>'],
  ['Strikethrough', '<s>'],
  ['Heading', '<h2>'],
  ['Bulleted list', '<ul>'],
  ['Numbered list', '<ol>'],
  ['Quote', '<blockquote>'],
  ['Code', '<code>'],
];

export const ButtonsApplyAndShowTheirState: Story = {
  ...test,
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('Hello world');
    await userEvent.keyboard('{Control>}a{/Control}');
    for (const [name, tag] of MARKS) {
      const button = canvas.getByRole('button', { name });
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      await userEvent.click(button);
      await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
      await waitFor(() => expect(lastValue(args.onChange)).toContain(tag));
      // The text keeps the focus and its selection: the next button acts on the same words.
      await expect(text).toHaveFocus();
      await userEvent.click(button);
      await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
      await waitFor(() => expect(lastValue(args.onChange)).not.toContain(tag));
    }
  },
};

const SHORTCUTS: ReadonlyArray<[name: string, keys: string, tag: string]> = [
  ['Bold', '{Control>}b{/Control}', '<strong>'],
  ['Italic', '{Control>}i{/Control}', '<em>'],
  ['Strikethrough', '{Control>}{Shift>}s{/Shift}{/Control}', '<s>'],
  ['Heading', '{Control>}{Alt>}2{/Alt}{/Control}', '<h2>'],
  ['Bulleted list', '{Control>}{Shift>}8{/Shift}{/Control}', '<ul>'],
  ['Numbered list', '{Control>}{Shift>}7{/Shift}{/Control}', '<ol>'],
  ['Quote', '{Control>}{Shift>}b{/Shift}{/Control}', '<blockquote>'],
  ['Code', '{Control>}e{/Control}', '<code>'],
];

export const ShortcutsApplyAndShowTheirState: Story = {
  ...test,
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('Hello world');
    await userEvent.keyboard('{Control>}a{/Control}');
    for (const [name, keys, tag] of SHORTCUTS) {
      const button = canvas.getByRole('button', { name });
      await userEvent.keyboard(keys);
      await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
      await waitFor(() => expect(lastValue(args.onChange)).toContain(tag));
      await userEvent.keyboard(keys);
      await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    }
  },
};

export const ButtonsAnnounceTheirShortcut: Story = {
  ...test,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await textbox(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+B Meta+B'
    );
    await expect(canvas.getByRole('button', { name: 'Redo' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+Shift+Z Meta+Shift+Z'
    );
    // Nothing to undo yet: the button stays reachable and says it does nothing.
    await expect(canvas.getByRole('button', { name: 'Undo' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  },
};

export const ToolbarIsOneTabStopWithArrowKeys: Story = {
  ...test,
  args: { autoFocus: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const toolbar = canvas.getByRole('toolbar', { name: 'Text formatting' });
    const buttons = within(toolbar).getAllByRole('button');
    await expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    await expect(buttons[0]).toHaveAttribute('tabindex', '0');

    // Shift+Tab leaves the text for the toolbar's one Tab stop.
    await userEvent.tab({ shift: true });
    await expect(buttons[0]).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(buttons[1]).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(buttons[buttons.length - 1]).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(buttons[0]).toHaveFocus();
    await userEvent.keyboard(`{${keyToStart()}}`);
    await expect(buttons[buttons.length - 1]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(buttons[0]).toHaveFocus();
    // The stop follows the focus: leaving and coming back lands on the last button used.
    await userEvent.keyboard(`{${keyToEnd()}}{${keyToEnd()}}`);
    await userEvent.tab();
    await expect(text).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(buttons[2]).toHaveFocus();
  },
};

export const LinkFieldRefusesScripts: Story = {
  ...test,
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('Docs');
    await userEvent.keyboard('{Control>}a{/Control}');
    await userEvent.click(canvas.getByRole('button', { name: 'Link' }));

    const dialog = await within(document.body).findByRole('dialog', { name: 'Edit link' });
    const url = within(dialog).getByRole('textbox', { name: 'Link URL' });
    await waitFor(() => expect(url).toHaveFocus());

    for (const refused of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,x']) {
      await userEvent.clear(url);
      await userEvent.type(url, `${refused}{Enter}`);
      await expect(url).toHaveAttribute('aria-invalid', 'true');
      await expect(
        within(dialog).getByText('Enter an http(s), mailto or relative link.')
      ).toBeVisible();
      await expect(url).toHaveAccessibleDescription('Enter an http(s), mailto or relative link.');
      await expect(text.querySelector('a')).toBeNull();
    }

    // A bare host is completed, and the selected word becomes the link.
    await userEvent.clear(url);
    await userEvent.type(url, 'example.com{Enter}');
    await waitFor(() =>
      expect(text.querySelector('a')).toHaveAttribute('href', 'https://example.com')
    );
    await expect(text.querySelector('a')).toHaveTextContent('Docs');
    await expect(lastValue(args.onChange)).toContain('href="https://example.com"');
    await expect(lastValue(args.onChange)).not.toContain('javascript');
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
  },
};

export const LinkFieldEditsAndRemovesALink: Story = {
  ...test,
  args: {
    autoFocus: true,
    defaultValue: '<p><a href="https://example.com/a">Docs</a> and more</p>',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    // Mod-k opens the field on the link in the selection, with its address.
    await userEvent.keyboard('{Control>}a{/Control}');
    await userEvent.keyboard('{Control>}k{/Control}');
    const dialog = await within(document.body).findByRole('dialog', { name: 'Edit link' });
    const url = within(dialog).getByRole('textbox', { name: 'Link URL' });
    await expect(url).toHaveValue('https://example.com/a');
    await userEvent.clear(url);
    await userEvent.type(url, '/relative/page{Enter}');
    await waitFor(() => expect(text.querySelector('a')).toHaveAttribute('href', '/relative/page'));

    await userEvent.click(canvas.getByRole('button', { name: 'Link' }));
    const again = await within(document.body).findByRole('dialog', { name: 'Edit link' });
    await userEvent.click(within(again).getByRole('button', { name: 'Remove link' }));
    await waitFor(() => expect(text.querySelector('a')).toBeNull());
    await expect(lastValue(args.onChange)).not.toContain('<a');
  },
};

export const PastedAndTypedScriptsBecomeNoLink: Story = {
  ...test,
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());

    const data = new DataTransfer();
    data.setData(
      'text/html',
      '<p><a href="javascript:alert(1)">bad</a> <a href="https://ok.example/x">good</a></p>'
    );
    data.setData('text/plain', 'bad good');
    await userEvent.paste(data);
    await waitFor(() => expect(text).toHaveTextContent('bad good'));
    const links = Array.from(text.querySelectorAll('a'));
    await expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://ok.example/x']);

    // The Markdown link rule and the URL autolinker go through the same check.
    await userEvent.keyboard(' [[x](javascript:alert(1)) ');
    await userEvent.keyboard('javascript:alert(1) data:text/html,x ');
    await expect(text.querySelectorAll('a')).toHaveLength(1);
    await expect(lastValue(args.onChange)).not.toMatch(/href="(?!https:\/\/ok\.example)/);

    // Safe ones still become links as they are typed.
    await userEvent.keyboard('[[ok](https://safe.example/p) ');
    await waitFor(() => expect(text.querySelectorAll('a')).toHaveLength(2));
    await expect(text.querySelectorAll('a')[1]).toHaveAttribute('href', 'https://safe.example/p');
  },
};

export const SchemaKeepsToItsNodes: Story = {
  ...test,
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const data = new DataTransfer();
    data.setData(
      'text/html',
      '<h1>Title</h1><p onclick="x()">kept <img src="x" onerror="y()"><script>z()</script></p><table><tr><td>cell</td></tr></table>'
    );
    data.setData('text/plain', 'Title kept cell');
    await userEvent.paste(data);
    await waitFor(() => expect(text).toHaveTextContent('kept'));
    const html = lastValue(args.onChange) as string;
    for (const forbidden of ['<img', '<script', '<table', 'onclick', 'onerror', '<h1']) {
      await expect(html).not.toContain(forbidden);
    }
  },
};

export const OnChangeGivesTheHtml: Story = {
  ...test,
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('Hello');
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith('<p>Hello</p>'));
    await userEvent.keyboard('{Backspace>5/}');
    // An empty document is the empty string, as a Textarea's.
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith(''));
  },
};

export const OnChangeGivesTheJson: Story = {
  ...test,
  args: { autoFocus: true, format: 'json', onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('Hi');
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }],
      })
    );
  },
};

export const ControlledValueFollowsTheHost: Story = {
  ...test,
  render: function Render(args) {
    const [html, setHtml] = useState('<p>Start</p>');
    return (
      <div>
        <RichTextEditor
          label={args.label}
          placeholder={args.placeholder}
          value={html}
          onChange={setHtml}
        />
        <button type="button" onClick={() => setHtml('<p>Reset by the host</p>')}>
          Reset
        </button>
        <output data-testid="html">{html}</output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await expect(text).toHaveTextContent('Start');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(text).toHaveTextContent('Reset by the host'));
    // The host's own value is not echoed back as an edit.
    await expect(canvas.getByTestId('html')).toHaveTextContent('<p>Reset by the host</p>');
  },
};

export const LabelAndErrorAreLinkedToTheField: Story = {
  ...test,
  args: {
    label: 'Reply',
    required: true,
    description: 'Visible to the customer.',
    error: 'Write a reply before sending.',
  },
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement, 'Reply');
    await expect(text).toHaveAccessibleName('Reply');
    await expect(text).toHaveAttribute('aria-invalid', 'true');
    await expect(text).toHaveAttribute('aria-required', 'true');
    await expect(text).toHaveAttribute('aria-multiline', 'true');
    // The error replaces the description, in the one element the field points at.
    await expect(text).toHaveAccessibleDescription('Write a reply before sending.');
    // A click on the label puts the caret in the text.
    await userEvent.click(within(canvasElement).getByText('Reply'));
    await waitFor(() => expect(text).toHaveFocus());
  },
};

export const DescriptionIsLinkedWithoutAnError: Story = {
  ...test,
  args: { description: 'Markdown shortcuts work.' },
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    await expect(text).toHaveAccessibleDescription('Markdown shortcuts work.');
    await expect(text).not.toHaveAttribute('aria-invalid');
  },
};

export const AriaLabelNamesAFieldWithoutALabel: Story = {
  ...test,
  args: { label: undefined, 'aria-label': 'Internal note' },
  play: async ({ canvasElement }) => {
    await expect(await textbox(canvasElement, 'Internal note')).toBeVisible();
  },
};

export const MaxLengthStopsTypingAndFlagsOverflow: Story = {
  ...test,
  args: {
    autoFocus: true,
    maxLength: 5,
    defaultValue: '<p>abc</p>',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const canvas = within(canvasElement);
    await expect(canvas.getByText('3 / 5')).toBeVisible();
    await userEvent.keyboard('defgh');
    // Blocked, not flagged: the text stops at the limit and stays valid.
    await waitFor(() => expect(canvas.getByText('5 / 5')).toBeVisible());
    await expect(text).toHaveTextContent('abcde');
    await expect(text).not.toHaveAttribute('aria-invalid');
    await expect(args.onChange).toHaveBeenLastCalledWith('<p>abcde</p>');

    // A paste is cut at the limit too.
    await userEvent.keyboard('{Backspace>2/}');
    const data = new DataTransfer();
    data.setData('text/plain', 'WXYZ');
    await userEvent.paste(data);
    await waitFor(() => expect(text.textContent?.length).toBeLessThanOrEqual(5));
  },
};

export const MaxLengthFlagsContentThatArrivedOver: Story = {
  ...test,
  args: { ...OverTheLimit.args, onChange: fn() },
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement, 'Product summary');
    await waitFor(() => expect(text).toHaveAttribute('aria-invalid', 'true'));
    const counter = within(canvasElement).getByText(/\/ 20$/);
    await expect(counter).toHaveTextContent('50 / 20');
    inEachTheme(() => expectTextContrast(counter));
  },
};

export const ReadOnlyRefusesEdits: Story = {
  ...test,
  args: { readOnly: true, defaultValue: '<p>Fixed text</p>', onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await expect(text).toHaveAttribute('contenteditable', 'false');
    await expect(text).toHaveAttribute('aria-readonly', 'true');
    // No toolbar to change anything with, but the text is a Tab stop.
    await expect(canvas.queryByRole('toolbar')).toBeNull();
    await expect(text).toHaveAttribute('tabindex', '0');
    await userEvent.click(text);
    await userEvent.keyboard('typed{Control>}b{/Control}');
    await expect(text).toHaveTextContent('Fixed text');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const ReadOnlyLinksAreFollowable: Story = {
  ...test,
  args: { readOnly: true, defaultValue: '<p><a href="https://example.com/a">Docs</a></p>' },
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole('link', { name: 'Docs' });
    await expect(link).toHaveAttribute('href', 'https://example.com/a');
    await expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  },
};

export const DisabledDoesNothing: Story = {
  ...test,
  args: { disabled: true, defaultValue: '<p>Locked</p>', onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await expect(text).toHaveAttribute('aria-disabled', 'true');
    await expect(text).not.toHaveAttribute('tabindex', '0');
    await userEvent.click(canvas.getByRole('button', { name: 'Bold' }));
    await expect(canvas.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const BubbleOpensOverTheSelection: Story = {
  ...test,
  args: {
    variant: 'bubble',
    autoFocus: true,
    defaultValue: '<p>Select these words</p>',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    // No selection, no bubble, and no toolbar on top.
    const idle = canvas.queryByRole('toolbar', { hidden: true });
    if (idle) await expect(idle).not.toBeVisible();

    await userEvent.keyboard('{Control>}a{/Control}');
    const toolbar = await canvas.findByRole('toolbar', { name: 'Text formatting' });
    await waitFor(() => expect(toolbar).toBeVisible());
    await expect(within(toolbar).queryByRole('button', { name: 'Undo' })).toBeNull();

    // Alt+F10 moves the focus into it, Escape gives it back to the text.
    await userEvent.keyboard('{Alt>}{F10}{/Alt}');
    const bold = within(toolbar).getByRole('button', { name: 'Bold' });
    await expect(bold).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(within(toolbar).getByRole('button', { name: 'Italic' })).toHaveFocus();
    await userEvent.keyboard(`{${keyToStart()}}{Enter}`);
    await waitFor(() => expect(lastValue(args.onChange)).toContain('<strong>'));
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(text).toHaveFocus());
    // The selection survived the round trip.
    await waitFor(() => expect(toolbar).toBeVisible());
  },
};

export const BubbleLinkFieldIsInlineAndRefusesScripts: Story = {
  ...test,
  args: {
    variant: 'bubble',
    autoFocus: true,
    defaultValue: '<p>Docs</p>',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('{Control>}a{/Control}');
    await userEvent.keyboard('{Control>}k{/Control}');
    const url = await within(canvasElement).findByRole('textbox', { name: 'Link URL' });
    await waitFor(() => expect(url).toHaveFocus());
    await userEvent.type(url, 'javascript:alert(1){Enter}');
    await expect(url).toHaveAttribute('aria-invalid', 'true');
    await expect(text.querySelector('a')).toBeNull();
    await userEvent.clear(url);
    await userEvent.type(url, 'https://example.com{Enter}');
    await waitFor(() => expect(lastValue(args.onChange)).toContain('href="https://example.com"'));
  },
};

export const MinimalHasShortcutsAndInputRules: Story = {
  ...test,
  args: { variant: 'minimal', autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await expect(canvas.queryByRole('toolbar')).toBeNull();
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);

    await userEvent.keyboard('## Title{Enter}');
    await userEvent.keyboard('- one{Enter}two{Enter}{Enter}');
    await userEvent.keyboard('1. first{Enter}{Enter}');
    await userEvent.keyboard('**bold** and _soft_ and `code` ');
    await waitFor(() => {
      const html = lastValue(args.onChange) as string;
      expect(html).toContain('<h2>Title</h2>');
      expect(html).toContain('<ul><li><p>one</p></li><li><p>two</p></li></ul>');
      expect(html).toContain('<ol><li><p>first</p></li></ol>');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>soft</em>');
      expect(html).toContain('<code>code</code>');
    });
    // The shortcuts work without the buttons.
    await userEvent.keyboard('{Control>}a{/Control}{Control>}b{/Control}');
    await waitFor(() =>
      expect(lastValue(args.onChange)).toContain('<h2><strong>Title</strong></h2>')
    );
  },
};

// Typing outruns a render: a host that echoes the value back must not make the editor load an
// older one over what was typed since.
export const FastTypingKeepsEveryCharacter: Story = {
  ...test,
  render: function Render() {
    const [html, setHtml] = useState('');
    return <RichTextEditor label="Message" autoFocus value={html} onChange={setHtml} />;
  },
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const typed = 'The quick brown fox jumps over the lazy dog, twice over.';
    await userEvent.keyboard(typed, { delay: null });
    await waitFor(() => expect(text).toHaveTextContent(typed));
    // And once it has settled, nothing is rewritten under the caret.
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(text).toHaveTextContent(typed);
  },
};

export const FocusShowsTheFieldBorder: Story = {
  ...test,
  args: { autoFocus: true },
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    // The border is the frame's: the editable text sits in a wrapper, itself in the frame.
    const frame = text.parentElement?.parentElement;
    if (!frame) throw new Error('the editor frame is missing');
    await expectFocusBorder(text, { border: frame });
  },
};

export const ContentIsReadableInEveryTheme: Story = {
  ...test,
  args: { defaultValue: SAMPLE, description: 'A hint.' },
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    const paragraph = text.querySelector('p') as HTMLElement;
    const link = text.querySelector('a') as HTMLElement;
    const quote = text.querySelector('blockquote p') as HTMLElement;
    const code = text.querySelector('code') as HTMLElement;
    inEachTheme(() => {
      for (const el of [paragraph, link, quote, code]) expectTextContrast(el);
      expectTextContrast(canvasElement.querySelector('[id$="-desc"]') as HTMLElement);
    });
  },
};

export const PlaceholderShowsWhileEmpty: Story = {
  ...test,
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    const empty = text.querySelector('p.is-editor-empty') as HTMLElement;
    await expect(empty).toHaveAttribute('data-placeholder', 'Write your message…');
    await expect(getComputedStyle(empty, '::before').content).toBe('"Write your message…"');
  },
};

/** The toolbar buttons follow the page's `data-density`; compact keeps them at 24px. */
export const ToolbarFollowsPageDensity: Story = {
  ...test,
  render: (args) => (
    <InEachDensity>
      <RichTextEditor {...args} />
    </InEachDensity>
  ),
  play: async ({ canvas }) => {
    await expectDensitySteps(canvas, (scope) => scope.findByRole('button', { name: 'Bold' }), {
      control: true,
    });
  },
};

/** The link field follows `data-density`. The dialog opens in a portal, so the attribute goes on `<html>`. */
export const LinkFieldFollowsPageDensity: Story = {
  ...test,
  args: { defaultValue: '<p>Read the changelog.</p>' },
  play: async ({ canvas, canvasElement }) => {
    const root = document.documentElement;
    const before = root.getAttribute('data-density');
    const heights: number[] = [];
    try {
      for (const density of ['compact', 'default', 'comfortable']) {
        root.dataset.density = density;
        const text = await textbox(canvasElement);
        await userEvent.click(text);
        await userEvent.keyboard('{Control>}a{/Control}');
        await userEvent.click(canvas.getByRole('button', { name: 'Link' }));
        const dialog = await within(document.body).findByRole('dialog', { name: 'Edit link' });
        heights.push(
          within(dialog).getByRole('textbox', { name: 'Link URL' }).getBoundingClientRect().height
        );
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
      }
    } finally {
      if (before === null) delete root.dataset.density;
      else root.dataset.density = before;
    }
    const [compact, normal, comfortable] = heights as [number, number, number];
    await expect(compact).toBeLessThan(normal);
    await expect(comfortable).toBeGreaterThan(normal);
    await expect(compact).toBeGreaterThanOrEqual(24);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The frame follows the page (the first button at the start, the character count at the end, the
 * icons that point along the line turned around) and so does the text it holds: lists are
 * indented and a quote is edged on the start side.
 */
export const ToolbarAndTextFollowTheReadingDirection: Story = {
  ...test,
  args: { maxLength: 400, defaultValue: SAMPLE },
  render: (args) => bothDirections(() => <RichTextEditor {...args} />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const canvas = within(box);
      const text = await canvas.findByRole('textbox', { name: 'Message' });
      const bold = canvas.getByRole('button', { name: 'Bold' });
      const redo = canvas.getByRole('button', { name: 'Redo' });
      expect(startOffset(bold, box), `${dir}: first button at the start`).toBeLessThan(
        startOffset(redo, box)
      );
      const scale = (name: string) =>
        getComputedStyle(canvas.getByRole('button', { name }).querySelector('svg')!).scale;
      expect(scale('Undo'), `${dir}: undo`).toBe(dir === 'rtl' ? '-1 1' : 'none');
      expect(scale('Bulleted list'), `${dir}: list`).toBe(dir === 'rtl' ? '-1 1' : 'none');
      expect(scale('Bold'), `${dir}: bold`).toBe('none');

      const [near, far] =
        dir === 'ltr' ? (['Left', 'Right'] as const) : (['Right', 'Left'] as const);
      const must = (selector: string) => {
        const found = text.querySelector(selector);
        if (!found) throw new Error(`${dir}: no ${selector} in ${text.innerHTML}`);
        return found;
      };
      const list = getComputedStyle(must('ul'));
      expect(parseFloat(list[`padding${near}`]), `${dir}: list indent`).toBe(20);
      expect(parseFloat(list[`padding${far}`]), `${dir}: list far side`).toBe(0);
      const quote = getComputedStyle(must('blockquote'));
      expect(parseFloat(quote[`border${near}Width`]), `${dir}: quote edge`).toBe(4);
      expect(parseFloat(quote[`border${far}Width`]), `${dir}: quote far side`).toBe(0);

      expectReadsLeftToRight(canvas.getByText(/^\d+ \/ 400$/));
    }
    expectMirrored(canvasElement, (box) => within(box).getByText('Message'));
    expectMirrored(canvasElement, (box) => within(box).getByRole('button', { name: 'Bold' }));
    expectMirrored(canvasElement, (box) => within(box).getByText(/^\d+ \/ 400$/));
  },
};

/** The arrows along the toolbar swap in right to left, however the direction was set. */
export const ToolbarArrowsFollowTheDirectionOfThePage: Story = {
  ...test,
  args: { autoFocus: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const button = (name: string) => canvas.getByRole('button', { name });
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, async () => {
        button('Bold').focus();
        await userEvent.keyboard('{ArrowRight}');
        // ArrowRight is the next button in left to right and the previous one, wrapping, in right to left.
        await expect(button(dir === 'ltr' ? 'Italic' : 'Redo')).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        await expect(button('Bold')).toHaveFocus();
      });
    }
  },
};

/** Each block follows what is typed in it: Arabic starts at the right and Latin at the left, in either page direction. */
export const BlocksFollowWhatIsTypedInThem: Story = {
  ...test,
  args: { defaultValue: '<p>مرحبا بالعالم</p><p>Hello world</p>' },
  render: (args) => bothDirections(() => <RichTextEditor {...args} />),
  play: async ({ canvasElement }) => {
    const textEdges = (block: Element) => {
      const range = document.createRange();
      range.selectNodeContents(block);
      return range.getBoundingClientRect();
    };
    for (const dir of ['ltr', 'rtl'] as const) {
      const text = await within(directionBox(canvasElement, dir)).findByRole('textbox', {
        name: 'Message',
      });
      const [arabic, latin] = [...text.querySelectorAll('p')];
      if (!arabic || !latin) throw new Error('two paragraphs expected');
      const field = text.getBoundingClientRect();
      expect(
        Math.abs(textEdges(arabic).right - arabic.getBoundingClientRect().right),
        `${dir}: Arabic ends at the right`
      ).toBeLessThan(2);
      expect(
        Math.abs(textEdges(latin).left - latin.getBoundingClientRect().left),
        `${dir}: Latin starts at the left`
      ).toBeLessThan(2);
      expect(field.width).toBeGreaterThan(textEdges(arabic).width);
    }
  },
};

/** An address reads left to right: the link field keeps that direction in a right-to-left page. */
export const LinkFieldReadsLeftToRight: Story = {
  ...test,
  args: { autoFocus: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await textbox(canvasElement);
    await inDirection('rtl', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Link' }));
      const dialog = await within(document.body).findByRole('dialog', { name: 'Edit link' });
      const url = within(dialog).getByRole('textbox', { name: 'Link URL' });
      expect(getComputedStyle(url).direction).toBe('ltr');
      await userEvent.type(url, '{Escape}');
    });
  },
};
