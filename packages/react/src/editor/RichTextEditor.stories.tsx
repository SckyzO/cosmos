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
import { RICH_TEXT_ACTIONS } from './actions';
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

// A picture the story's own server holds: an editor image is an http(s) URL, and a story shows no
// other origin. Read when the story renders, so the page's base URL is the one in use.
const sampleImage = () => new URL('favicon.svg', document.baseURI).href;

const formatsSample = () =>
  [
    '<h1>Release notes</h1>',
    '<p>Mark what matters: <u>underlined</u>, <strong>bold</strong> or <code>inline code</code>.</p>',
    '<p style="text-align: center">A line in the middle.</p>',
    '<p style="text-align: end">A line at the end.</p>',
    '<h2>Deploy</h2>',
    '<pre><code>make build\nmake deploy ENV=staging</code></pre>',
    `<p>The logo <img src="${sampleImage()}" alt="Storybook logo"> sits in the line.</p>`,
  ].join('');

// ProseMirror adds its own `img.ProseMirror-separator` after an image that ends a line.
const IMAGES = 'img:not(.ProseMirror-separator)';

// The arrow key that goes toward the start of the line, as a browser sends it. ProseMirror reads
// `keyCode`, which `userEvent.keyboard` leaves at 0, so its own arrow handling (a caret after an
// image selects the image) needs this event. Left to right that is ArrowLeft, right to left
// ArrowRight.
const arrowToStart = (text: HTMLElement) => {
  const left = getComputedStyle(text).direction !== 'rtl';
  text.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: left ? 'ArrowLeft' : 'ArrowRight',
      keyCode: left ? 37 : 39,
      bubbles: true,
      cancelable: true,
    })
  );
};

// The editor is created after the first render, so every test waits for its text.
const textbox = (canvasElement: HTMLElement, name = 'Message') =>
  within(canvasElement).findByRole('textbox', { name });

// The last value `onChange` reported.
const lastValue = (onChange: unknown) =>
  (onChange as ReturnType<typeof fn>).mock.lastCall?.[0] as unknown;

// Every text the new controls draw, for the story that translates them.
const FRENCH_FORMATS = {
  underline: 'Souligne',
  heading: 'Titre',
  paragraph: 'Paragraphe',
  heading1: 'Titre 1',
  heading2: 'Titre 2',
  heading3: 'Titre 3',
  codeBlock: 'Bloc de code',
  align: 'Alignement',
  alignStart: 'Aligner au debut',
  alignCenter: 'Centrer',
  alignEnd: 'Aligner a la fin',
  image: 'Image',
  imageDialog: 'Details de image',
  imageUrl: 'Adresse de image',
  imageAlt: 'Description',
  imageDecorative: 'Image decorative',
  imageApply: 'Inserer',
  imageInvalid: 'Adresse http(s) attendue.',
  imageAltRequired: 'Decrivez image ou cochez decorative.',
};

// ── Visible stories: no interaction ──────────────────────────────────────────

export const Empty: Story = {};

export const WithContent: Story = {
  args: { defaultValue: SAMPLE, description: 'Headings, lists, quotes, code and links.' },
};

export const Formats: Story = {
  args: { description: 'Underline, three heading levels, code block, alignment and an image.' },
  render: (args) => <RichTextEditor {...args} defaultValue={formatsSample()} />,
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

export const TranslatedFormats: Story = {
  args: { label: 'Message', labels: FRENCH_FORMATS },
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
};

export const NarrowChecks: Story = {
  ...Narrow,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await textbox(canvasElement);
    expectNoHorizontalOverflow(canvasElement);
  },
};

export const NarrowFormats: Story = {
  ...Formats,
  globals: mobileViewport,
};

export const NarrowFormatsChecks: Story = {
  ...NarrowFormats,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    // The wide toolbar wraps onto more lines, and neither it nor a code line widens the page.
    expectNoHorizontalOverflow(canvasElement);
    await expect(text.querySelector('pre')).not.toBeNull();
    await expect(
      text.querySelector(IMAGES)?.getBoundingClientRect().width ?? 0
    ).toBeLessThanOrEqual(text.getBoundingClientRect().width);
  },
};

// ── Tests: hidden from the sidebar and the docs ─────────────────────────────

const test = { tags: ['!dev', '!autodocs'] };

const MARKS: ReadonlyArray<[name: string, tag: string]> = [
  ['Bold', '<strong>'],
  ['Italic', '<em>'],
  ['Underline', '<u>'],
  ['Strikethrough', '<s>'],
  ['Bulleted list', '<ul>'],
  ['Numbered list', '<ol>'],
  ['Quote', '<blockquote>'],
  ['Code', '<code>'],
  ['Code block', '<pre>'],
];

export const ButtonsApplyAndShowTheirState: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
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
  ['Underline', '{Control>}u{/Control}', '<u>'],
  ['Strikethrough', '{Control>}{Shift>}s{/Shift}{/Control}', '<s>'],
  ['Heading', '{Control>}{Alt>}2{/Alt}{/Control}', '<h2>'],
  ['Bulleted list', '{Control>}{Shift>}8{/Shift}{/Control}', '<ul>'],
  ['Numbered list', '{Control>}{Shift>}7{/Shift}{/Control}', '<ol>'],
  ['Quote', '{Control>}{Shift>}b{/Shift}{/Control}', '<blockquote>'],
  ['Code', '{Control>}e{/Control}', '<code>'],
  ['Code block', '{Control>}{Alt>}c{/Alt}{/Control}', '<pre>'],
];

export const ShortcutsApplyAndShowTheirState: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
    await expect(canvas.getByRole('button', { name: 'Underline' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+U Meta+U'
    );
    await expect(canvas.getByRole('button', { name: 'Code block' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+Alt+C Meta+Alt+C'
    );
    // Nothing to undo yet: the button stays reachable and says it does nothing.
    await expect(canvas.getByRole('button', { name: 'Undo' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  },
};

export const EveryButtonHasANameAndAPressedState: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await textbox(canvasElement);
    const buttons = within(canvas.getByRole('toolbar', { name: 'Text formatting' })).getAllByRole(
      'button'
    );
    await expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Heading',
      'Bulleted list',
      'Numbered list',
      'Quote',
      'Code',
      'Code block',
      'Text alignment',
      'Link',
      'Image',
      'Undo',
      'Redo',
    ]);
    await expect(buttons).toHaveLength(RICH_TEXT_ACTIONS.length);
    for (const button of buttons) {
      await expect(button).toHaveAccessibleName();
      await expect(button, button.getAttribute('aria-label') ?? '').toHaveAttribute(
        'aria-pressed',
        'false'
      );
    }
    // The ones that open something say so.
    for (const name of ['Heading', 'Text alignment']) {
      await expect(canvas.getByRole('button', { name })).toHaveAttribute('aria-haspopup', 'menu');
    }
    for (const name of ['Link', 'Image']) {
      await expect(canvas.getByRole('button', { name })).toHaveAttribute('aria-haspopup', 'dialog');
    }
  },
};

// A menu of a toolbar button: it opens from the button, the arrows, Home and End move inside it
// (the toolbar's own Home and End must not steal them), and a choice brings the focus back to the
// text.
const openMenu = async (canvas: ReturnType<typeof within>, name: string) => {
  await userEvent.click(canvas.getByRole('button', { name }));
  return within(document.body).findByRole('menu', { name });
};

export const HeadingMenuSetsTheLevel: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('Title');
    const trigger = canvas.getByRole('button', { name: 'Heading' });
    await expect(trigger).toHaveAttribute('aria-pressed', 'false');

    const menu = await openMenu(canvas, 'Heading');
    const items = within(menu).getAllByRole('menuitemradio');
    await expect(items.map((item) => item.textContent)).toEqual([
      'Paragraph',
      'Heading 1',
      'Heading 2',
      'Heading 3',
    ]);
    await expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
    // The shortcuts the editor binds are announced on their items.
    await expect(items[2]).toHaveAttribute('aria-keyshortcuts', 'Control+Alt+2 Meta+Alt+2');
    await userEvent.keyboard('{End}');
    await expect(items[3]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(items[0]).toHaveFocus();

    await userEvent.click(items[1]!);
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith('<h1>Title</h1>'));
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    await expect(text).toHaveFocus();
    await expect(trigger).toHaveAttribute('aria-pressed', 'true');

    // The checked item follows the caret; choosing the checked one keeps it.
    const again = within(await openMenu(canvas, 'Heading')).getAllByRole('menuitemradio');
    await expect(again[1]).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(again[1]!);
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    await expect(args.onChange).toHaveBeenLastCalledWith('<h1>Title</h1>');

    const third = within(await openMenu(canvas, 'Heading')).getAllByRole('menuitemradio');
    await userEvent.click(third[3]!);
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith('<h3>Title</h3>'));
    const last = within(await openMenu(canvas, 'Heading')).getAllByRole('menuitemradio');
    await userEvent.click(last[0]!);
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith('<p>Title</p>'));
    await expect(trigger).toHaveAttribute('aria-pressed', 'false');
  },
};

export const HeadingMenuOpensFromTheKeyboard: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, defaultValue: '<p>Title</p>', onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const trigger = canvas.getByRole('button', { name: 'Heading' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = await within(document.body).findByRole('menu', { name: 'Heading' });
    const items = within(menu).getAllByRole('menuitemradio');
    await expect(items[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith('<h2>Title</h2>'));
    // Escape closes a menu, and the focus goes back to its button.
    await userEvent.click(trigger);
    await within(document.body).findByRole('menu', { name: 'Heading' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

export const AlignMenuAlignsTheBlock: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('Line');
    const trigger = canvas.getByRole('button', { name: 'Text alignment' });
    await expect(trigger).toHaveAttribute('aria-pressed', 'false');

    const items = within(await openMenu(canvas, 'Text alignment')).getAllByRole('menuitemradio');
    await expect(items.map((item) => item.textContent)).toEqual([
      'Align start',
      'Align center',
      'Align end',
    ]);
    await expect(items[0]).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(items[1]!);
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith('<p style="text-align: center;">Line</p>')
    );
    await expect(text.querySelector('p')).toHaveStyle({ textAlign: 'center' });
    await expect(trigger).toHaveAttribute('aria-pressed', 'true');
    await expect(text).toHaveFocus();

    const second = within(await openMenu(canvas, 'Text alignment')).getAllByRole('menuitemradio');
    await expect(second[1]).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(second[2]!);
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith('<p style="text-align: end;">Line</p>')
    );

    // Start is the default: the style goes away instead of being written out.
    const third = within(await openMenu(canvas, 'Text alignment')).getAllByRole('menuitemradio');
    await userEvent.click(third[0]!);
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith('<p>Line</p>'));
    await expect(trigger).toHaveAttribute('aria-pressed', 'false');
  },
};

export const AlignmentHasNoKeyThatTheMenuDoesNotAnnounce: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('Line');
    // Tiptap's own Ctrl+Shift+E centers a block; here nothing binds it.
    await userEvent.keyboard('{Control>}{Shift>}e{/Shift}{/Control}');
    await expect(args.onChange).toHaveBeenLastCalledWith('<p>Line</p>');
    await expect(text.querySelector('p')).not.toHaveAttribute('style');
  },
};

export const AlignmentAppliesToHeadingsAndEveryBlockSelected: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: {
    autoFocus: true,
    defaultValue: '<h2>Title</h2><p>One</p><p>Two</p>',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('{Control>}a{/Control}');
    const items = within(await openMenu(canvas, 'Text alignment')).getAllByRole('menuitemradio');
    await userEvent.click(items[1]!);
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith(
        '<h2 style="text-align: center;">Title</h2><p style="text-align: center;">One</p><p style="text-align: center;">Two</p>'
      )
    );
  },
};

/**
 * Start and end are the sides of the line, and a block's line follows what is typed in it: the end
 * of Latin text is its right, the end of Arabic its left, in either page direction. Center is
 * center.
 */
export const AlignmentFollowsTheDirectionOfTheText: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: {
    defaultValue:
      '<p style="text-align: end">Ends here</p><p style="text-align: end">ينتهي هنا</p>' +
      '<p style="text-align: center">Middle</p>',
  },
  render: (args) => bothDirections(() => <RichTextEditor {...args} />),
  play: async ({ canvasElement }) => {
    const edges = (block: Element) => {
      const range = document.createRange();
      range.selectNodeContents(block);
      return range.getBoundingClientRect();
    };
    for (const dir of ['ltr', 'rtl'] as const) {
      const text = await within(directionBox(canvasElement, dir)).findByRole('textbox', {
        name: 'Message',
      });
      const [latin, arabic, middle] = [...text.querySelectorAll('p')];
      if (!latin || !arabic || !middle) throw new Error('three paragraphs expected');
      const box = (block: Element) => block.getBoundingClientRect();
      expect(
        Math.abs(edges(latin).right - box(latin).right),
        `${dir}: Latin ends at the right`
      ).toBeLessThan(2);
      expect(
        Math.abs(edges(arabic).left - box(arabic).left),
        `${dir}: Arabic ends at the left`
      ).toBeLessThan(2);
      expect(
        Math.abs(edges(middle).left - box(middle).left - (box(middle).right - edges(middle).right)),
        `${dir}: centered`
      ).toBeLessThan(2);
    }
  },
};

export const CodeBlockKeepsItsLines: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.click(canvas.getByRole('button', { name: 'Code block' }));
    await userEvent.keyboard('make build{Enter}make deploy');
    const html = '<pre><code>make build\nmake deploy</code></pre>';
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith(html));
    // A code block holds no marks, so a mark shortcut does nothing there.
    await userEvent.keyboard('{Control>}a{/Control}{Control>}b{/Control}');
    await expect(args.onChange).toHaveBeenLastCalledWith(html);
  },
};

export const MinimalOpensACodeBlockFromTheFence: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { variant: 'minimal', autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('```{Enter}ls -l');
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith('<pre><code>ls -l</code></pre>')
    );
    await userEvent.keyboard('{Control>}a{/Control}{Control>}u{/Control}');
    // No marks inside a code block: the underline shortcut does nothing there.
    await expect(args.onChange).toHaveBeenLastCalledWith('<pre><code>ls -l</code></pre>');
  },
};

/** Code reads left to right in any page, as `CodeBlock` does: the block keeps its direction and starts at the left. */
export const CodeBlockReadsLeftToRight: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: '<pre><code>make ci</code></pre>' },
  render: (args) => bothDirections(() => <RichTextEditor {...args} />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const text = await within(directionBox(canvasElement, dir)).findByRole('textbox', {
        name: 'Message',
      });
      const pre = text.querySelector('pre') as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(pre.querySelector('code') as HTMLElement);
      const padding = parseFloat(getComputedStyle(pre).paddingLeft);
      expect(getComputedStyle(pre).direction, `${dir}: direction`).toBe('ltr');
      expect(
        Math.abs(range.getBoundingClientRect().left - pre.getBoundingClientRect().left - padding),
        `${dir}: the code starts at the left`
      ).toBeLessThan(2);
    }
  },
};

export const ToolbarIsOneTabStopWithArrowKeys: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
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

export const NewControlsTakeTheirTextFromLabels: Story = {
  ...TranslatedFormats,
  tags: ['!dev', '!autodocs'],
  args: { ...TranslatedFormats.args, autoFocus: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    for (const name of ['Souligne', 'Bloc de code', 'Titre', 'Alignement', 'Image']) {
      await expect(canvas.getByRole('button', { name })).toBeVisible();
    }
    const heading = within(await openMenu(canvas, 'Titre')).getAllByRole('menuitemradio');
    await expect(heading.map((item) => item.textContent)).toEqual([
      'Paragraphe',
      'Titre 1',
      'Titre 2',
      'Titre 3',
    ]);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    const align = within(await openMenu(canvas, 'Alignement')).getAllByRole('menuitemradio');
    await expect(align.map((item) => item.textContent)).toEqual([
      'Aligner au debut',
      'Centrer',
      'Aligner a la fin',
    ]);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());

    await userEvent.click(canvas.getByRole('button', { name: 'Image' }));
    const dialog = await within(document.body).findByRole('dialog', { name: 'Details de image' });
    const url = within(dialog).getByRole('textbox', { name: 'Adresse de image' });
    await expect(within(dialog).getByRole('textbox', { name: 'Description' })).toBeVisible();
    await expect(within(dialog).getByRole('checkbox', { name: 'Image decorative' })).toBeVisible();
    await userEvent.type(url, 'nope{Enter}');
    await expect(url).toHaveAccessibleDescription('Adresse http(s) attendue.');
    await userEvent.clear(url);
    await userEvent.type(url, 'https://example.com/a.png');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Inserer' }));
    await expect(
      within(dialog).getByRole('textbox', { name: 'Description' })
    ).toHaveAccessibleDescription('Decrivez image ou cochez decorative.');
  },
};

export const LinkFieldRefusesScripts: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const data = new DataTransfer();
    data.setData(
      'text/html',
      '<h1>Title</h1><h4>Small</h4><hr>' +
        '<p onclick="x()">kept <img src="x" onerror="y()"><img src="javascript:alert(1)">' +
        '<img src="data:image/png;base64,AAAA"><img src="/relative.png">' +
        '<img src="https://ok.example/a.png" alt="ok" title="t" width="9999" onerror="z()">' +
        '<script>z()</script></p><table><tr><td>cell</td></tr></table>'
    );
    data.setData('text/plain', 'Title Small kept cell');
    await userEvent.paste(data);
    await waitFor(() => expect(text).toHaveTextContent('kept'));
    const html = lastValue(args.onChange) as string;
    // Level 1 is a heading now; level 4 is not.
    await expect(html).toContain('<h1>Title</h1>');
    // Of six pasted images, the one with an http(s) source stays, with a source and a description.
    await expect(html.match(/<img/g)).toHaveLength(1);
    await expect(html).toContain('<img src="https://ok.example/a.png" alt="ok">');
    for (const forbidden of [
      '<h4',
      '<hr',
      '<script',
      '<table',
      'onclick',
      'onerror',
      'javascript',
      'data:',
      'relative.png',
      'src="x"',
      'width=',
      'title=',
    ]) {
      await expect(html).not.toContain(forbidden);
    }
  },
};

export const PastedFormatsKeepOnlyWhatTheEditorHolds: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const data = new DataTransfer();
    data.setData(
      'text/html',
      // The first and last blocks of a paste join the paragraph around the caret, and keep none of
      // their own attributes: the ones under test sit between two plain paragraphs.
      '<p>first</p><p style="text-align: center; color: red"><u>under</u></p>' +
        '<pre><code class="language-ts">let a = 1;</code></pre>' +
        '<p style="text-align: left">l</p><p style="text-align: justify">j</p>' +
        '<p style="text-align: right">r</p><p style="text-align: end">e</p><p>last</p>'
    );
    data.setData('text/plain', 'first under let a = 1; l j r e last');
    await userEvent.paste(data);
    await waitFor(() => expect(text).toHaveTextContent('under'));
    const html = lastValue(args.onChange) as string;
    await expect(html).toContain('<p style="text-align: center;"><u>under</u></p>');
    await expect(html).toContain('<pre><code class="language-ts">let a = 1;</code></pre>');
    await expect(html).toContain('<p style="text-align: end;">e</p>');
    // The editor writes center and end only: the physical sides and justify are dropped, and no
    // other style survives.
    for (const dropped of ['left', 'right', 'justify', 'color']) {
      await expect(html).not.toContain(dropped);
    }
  },
};

// ── Images ──────────────────────────────────────────────────────────────────

const openImageForm = async (canvas: ReturnType<typeof within>) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Image' }));
  const dialog = await within(document.body).findByRole('dialog', { name: 'Image details' });
  const field = (name: string) => within(dialog).getByRole('textbox', { name });
  return {
    dialog,
    url: field('Image URL'),
    alt: field('Description (alt text)'),
    decorative: within(dialog).getByRole('checkbox', { name: 'Decorative image, no description' }),
    apply: within(dialog).getByRole('button', { name: 'Apply' }),
  };
};

export const ImageFormInsertsAnImageWithItsDescription: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, defaultValue: '<p>Before</p>', onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const { url, alt, apply } = await openImageForm(canvas);
    await waitFor(() => expect(url).toHaveFocus());
    await userEvent.type(url, 'https://example.com/diagram.png');

    // A description is required: say so, name the field, and put the focus there.
    await userEvent.click(apply);
    await expect(alt).toHaveAttribute('aria-invalid', 'true');
    await expect(alt).toHaveAccessibleDescription('Describe the image, or mark it decorative.');
    await waitFor(() => expect(alt).toHaveFocus());
    await expect(text.querySelector(IMAGES)).toBeNull();

    await userEvent.type(alt, 'Network diagram{Enter}');
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith(
        '<p>Before<img src="https://example.com/diagram.png" alt="Network diagram"></p>'
      )
    );
    await expect(await within(text).findByRole('img', { name: 'Network diagram' })).toBeVisible();
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
    await expect(text).toHaveFocus();
  },
};

export const ImageFormTakesADecorativeImageWithAnEmptyDescription: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const { url, alt, decorative, apply } = await openImageForm(canvas);
    await userEvent.type(url, 'https://example.com/rule.png');
    await userEvent.type(alt, 'Dropped when the image is marked decorative');
    await userEvent.click(decorative);
    await expect(alt).toBeDisabled();
    await userEvent.click(apply);
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith(
        '<p><img src="https://example.com/rule.png" alt=""></p>'
      )
    );
    // `alt=""` is kept: it says "decorative", where no `alt` says nothing.
    await expect(text.querySelector(IMAGES)).toHaveAttribute('alt', '');
  },
};

export const ImageFormRefusesAddressesThatAreNotHttp: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const { url, alt } = await openImageForm(canvas);
    await userEvent.type(alt, 'Anything');
    for (const refused of [
      'javascript:alert(1)',
      'data:image/png;base64,AAAA',
      '/uploads/a.png',
      'example.com/a.png',
      'ftp://example.com/a.png',
    ]) {
      await userEvent.clear(url);
      await userEvent.type(url, `${refused}{Enter}`);
      await expect(url).toHaveAttribute('aria-invalid', 'true');
      await expect(url).toHaveAccessibleDescription('Enter an http(s) image address.');
      await waitFor(() => expect(url).toHaveFocus());
      await expect(text.querySelector(IMAGES)).toBeNull();
    }
    await expect(args.onChange).not.toHaveBeenCalled();
    // The error goes as soon as the address is edited.
    await userEvent.type(url, 'x');
    await expect(url).not.toHaveAttribute('aria-invalid');
  },
};

export const ImageFormEditsTheSelectedImage: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: {
    autoFocus: true,
    defaultValue: '<p>Look: <img src="https://example.com/a.png" alt="Old"></p>',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const button = canvas.getByRole('button', { name: 'Image' });
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    // The caret is after the image, at the end: an arrow key toward the start selects it.
    arrowToStart(text);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));

    // The field opens on the image that is selected, and changing it keeps it one image.
    const { url, alt } = await openImageForm(canvas);
    await expect(url).toHaveValue('https://example.com/a.png');
    await expect(alt).toHaveValue('Old');
    await userEvent.clear(alt);
    await userEvent.type(alt, 'New{Enter}');
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith(
        '<p>Look: <img src="https://example.com/a.png" alt="New"></p>'
      )
    );
    await expect(text.querySelectorAll(IMAGES)).toHaveLength(1);
  },
};

export const ImageFormShowsADecorativeImageAsSuch: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: {
    autoFocus: true,
    defaultValue: '<p><img src="https://example.com/rule.png" alt=""></p>',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    arrowToStart(text);
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Image' })).toHaveAttribute('aria-pressed', 'true')
    );
    const { decorative, alt } = await openImageForm(canvas);
    await expect(decorative).toBeChecked();
    await expect(alt).toBeDisabled();
  },
};

export const ImageButtonWaitsOutsideACodeBlock: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, defaultValue: '<pre><code>make ci</code></pre>' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    const button = canvas.getByRole('button', { name: 'Image' });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button);
    await expect(within(document.body).queryByRole('dialog')).toBeNull();
  },
};

export const BubbleHeadingMenuKeepsTheBubbleAndGivesBackItsButton: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: {
    variant: 'bubble',
    toolbar: ['bold', 'heading'],
    autoFocus: true,
    defaultValue: '<p>Pick</p>',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('{Control>}a{/Control}');
    const toolbar = await within(canvasElement).findByRole('toolbar', { name: 'Text formatting' });
    const trigger = within(toolbar).getByRole('button', { name: 'Heading' });

    // The menu is portaled out of the bubble, which stays where it is. Escape closes the menu
    // alone, and the focus goes back to its button: the toolbar leaves a key of the menu alone.
    await userEvent.click(trigger);
    await within(document.body).findByRole('menu', { name: 'Heading' });
    await expect(toolbar).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(toolbar).toBeVisible();

    const items = within(await openMenu(within(toolbar), 'Heading')).getAllByRole('menuitemradio');
    await userEvent.click(items[2]!);
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith('<h2>Pick</h2>'));
    await expect(text).toHaveFocus();
  },
};

export const BubbleImageFieldIsInline: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: {
    variant: 'bubble',
    toolbar: ['bold', 'image'],
    autoFocus: true,
    defaultValue: '<p>Pick</p>',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    await userEvent.keyboard('{Control>}a{/Control}');
    const toolbar = await within(canvasElement).findByRole('toolbar', { name: 'Text formatting' });
    await userEvent.click(within(toolbar).getByRole('button', { name: 'Image' }));
    // In place of the buttons, as the link field is.
    const url = await within(canvasElement).findByRole('textbox', { name: 'Image URL' });
    await waitFor(() => expect(url).toHaveFocus());
    await expect(within(toolbar).queryByRole('button', { name: 'Bold' })).toBeNull();
    await userEvent.type(url, 'https://example.com/a.png');
    await userEvent.type(
      within(canvasElement).getByRole('textbox', { name: 'Description (alt text)' }),
      'Chart{Enter}'
    );
    // The selected words stay: the image goes after them.
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith(
        '<p>Pick<img src="https://example.com/a.png" alt="Chart"></p>'
      )
    );
  },
};

export const TypedMarkdownImageIsNotInserted: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true, onChange: fn() },
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text).toHaveFocus());
    // Images come in through the field, which checks the address and asks for a description.
    await userEvent.keyboard('![[x](javascript:alert(1)) ![[y](https://example.com/a.png) ');
    await expect(text).toHaveTextContent(
      '![x](javascript:alert(1)) ![y](https://example.com/a.png)'
    );
    await expect(text.querySelector(IMAGES)).toBeNull();
  },
};

// A document handed over as JSON skips the HTML parser, so the source is checked where the image is
// drawn too.
export const ImageWithAnUnsafeSourceInJsonHasNoSource: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  render: () => (
    <RichTextEditor
      label="Message"
      format="json"
      defaultValue={{
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'image', attrs: { src: 'javascript:alert(1)', alt: 'Unsafe' } },
              { type: 'image', attrs: { src: 'https://example.com/a.png', alt: 'Safe' } },
            ],
          },
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    await waitFor(() => expect(text.querySelectorAll(IMAGES)).toHaveLength(2));
    const [unsafe, safe] = [...text.querySelectorAll(IMAGES)];
    await expect(unsafe).not.toHaveAttribute('src');
    await expect(safe).toHaveAttribute('src', 'https://example.com/a.png');
  },
};

export const OnChangeGivesTheHtml: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
  args: { description: 'Markdown shortcuts work.' },
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    await expect(text).toHaveAccessibleDescription('Markdown shortcuts work.');
    await expect(text).not.toHaveAttribute('aria-invalid');
  },
};

export const AriaLabelNamesAFieldWithoutALabel: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { label: undefined, 'aria-label': 'Internal note' },
  play: async ({ canvasElement }) => {
    await expect(await textbox(canvasElement, 'Internal note')).toBeVisible();
  },
};

export const MaxLengthStopsTypingAndFlagsOverflow: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
  args: { readOnly: true, defaultValue: '<p><a href="https://example.com/a">Docs</a></p>' },
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole('link', { name: 'Docs' });
    await expect(link).toHaveAttribute('href', 'https://example.com/a');
    await expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  },
};

export const DisabledDoesNothing: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
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
    // The buttons that open a menu or a field do not open it.
    for (const name of ['Heading', 'Text alignment']) {
      await userEvent.click(canvas.getByRole('button', { name }));
      await expect(within(document.body).queryByRole('menu')).toBeNull();
    }
    canvas.getByRole('button', { name: 'Text alignment' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(within(document.body).queryByRole('menu')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Image' }));
    await expect(within(document.body).queryByRole('dialog')).toBeNull();
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const BubbleOpensOverTheSelection: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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

export const FormatsAreReadableInEveryTheme: Story = {
  ...Formats,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const text = await textbox(canvasElement);
    const shown = ['h1', 'h2', 'u', 'pre code', 'p[style]'].map(
      (selector) => text.querySelector(selector) as HTMLElement
    );
    inEachTheme(() => {
      for (const el of shown) expectTextContrast(el);
    });
  },
};

export const PlaceholderShowsWhileEmpty: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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
 * The frame follows the page: the first button at the start, the character count at the end, the
 * icons that point along the line turned around. The text it holds follows what is typed in it
 * (`BlocksFollowWhatIsTypedInThem`, `ListsAndQuotesFollowWhatIsTypedInThem`).
 */
export const ToolbarAndTextFollowTheReadingDirection: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { maxLength: 400, defaultValue: SAMPLE },
  render: (args) => bothDirections(() => <RichTextEditor {...args} />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const canvas = within(box);
      await canvas.findByRole('textbox', { name: 'Message' });
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
      // Align start points along the line, so it turns around too.
      expect(scale('Text alignment'), `${dir}: alignment`).toBe(dir === 'rtl' ? '-1 1' : 'none');

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
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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

/**
 * A list and a quote follow what is typed in them too, so a bullet, a number and a quote's edge
 * stay with their text: at the left of Latin, at the right of Arabic, in either page direction.
 */
export const ListsAndQuotesFollowWhatIsTypedInThem: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: {
    defaultValue:
      '<ul><li><p>Rolling restarts</p></li></ul><ol><li><p>إعادة التشغيل</p></li></ol>' +
      '<blockquote><p>Nothing changes</p></blockquote><blockquote><p>لا شيء يتغير</p></blockquote>',
  },
  render: (args) => bothDirections(() => <RichTextEditor {...args} />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const text = await within(directionBox(canvasElement, dir)).findByRole('textbox', {
        name: 'Message',
      });
      const [latinItem, arabicItem] = [...text.querySelectorAll('li')];
      const [latinQuote, arabicQuote] = [...text.querySelectorAll('blockquote')];
      if (!latinItem || !arabicItem || !latinQuote || !arabicQuote)
        throw new Error('two lists and two quotes expected');
      // A marker sits on the start side of its item, and a list's indent and a quote's edge on
      // their start side: the side `direction` names, on the item, the list and the quote.
      for (const [item, quote, side, near, far] of [
        [latinItem, latinQuote, 'ltr', 'Left', 'Right'],
        [arabicItem, arabicQuote, 'rtl', 'Right', 'Left'],
      ] as const) {
        const list = getComputedStyle(item.parentElement!);
        expect(getComputedStyle(item).direction, `${dir}: ${side} item`).toBe(side);
        expect(list.direction, `${dir}: ${side} list`).toBe(side);
        expect(parseFloat(list[`padding${near}`]), `${dir}: ${side} list indent`).toBe(20);
        expect(parseFloat(list[`padding${far}`]), `${dir}: ${side} list far side`).toBe(0);
        const edge = getComputedStyle(quote);
        expect(parseFloat(edge[`border${near}Width`]), `${dir}: ${side} quote edge`).toBe(4);
        expect(parseFloat(edge[`border${far}Width`]), `${dir}: ${side} quote far side`).toBe(0);
      }
    }
  },
};

/** An address reads left to right: the link field keeps that direction in a right-to-left page. */
export const LinkFieldReadsLeftToRight: Story = {
  ...test,
  tags: ['!dev', '!autodocs'],
  args: { autoFocus: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = await textbox(canvasElement);
    // The editor takes its focus after it mounts: opened before, the field would lose it to the
    // editor and close.
    await waitFor(() => expect(text).toHaveFocus());
    await inDirection('rtl', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Link' }));
      const dialog = await within(document.body).findByRole('dialog', { name: 'Edit link' });
      const url = within(dialog).getByRole('textbox', { name: 'Link URL' });
      expect(getComputedStyle(url).direction).toBe('ltr');
      await userEvent.type(url, '{Escape}');
    });
  },
};
