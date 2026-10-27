import { clsx } from 'clsx';
import { useEffect, useId, useInsertionEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Extension } from '@tiptap/core';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { useControllableState } from '../hooks/useControllableState';
import { isSafeLinkUrl } from '../chat/httpUrl';
import { fieldClass, type FieldSize } from '../forms/fieldRecipe';
import { RequiredMark } from '../forms/RequiredMark';
import { BUBBLE_ACTIONS, RICH_TEXT_ACTIONS, type RichTextAction } from './actions';
import { FormattingToolbar } from './FormattingToolbar';
import { resolveLabels, type RichTextLabels } from './labels';

/** What `value` and `onChange` carry: the HTML string, or the ProseMirror JSON document. */
export type RichTextFormat = 'html' | 'json';
export type RichTextValue<F extends RichTextFormat> = F extends 'json' ? JSONContent : string;

/**
 * `toolbar`: the buttons on top of the text. `bubble`: a small toolbar over the selected text.
 * `minimal`: no toolbar, only the keyboard shortcuts and the Markdown-like input rules.
 */
export type RichTextVariant = 'toolbar' | 'bubble' | 'minimal';

export type RichTextEditorProps<F extends RichTextFormat = 'html'> = {
  /** What `value`, `defaultValue` and `onChange` carry. Default `html`. */
  format?: F;
  /** The content, when the host owns it. HTML is `''` when empty. */
  value?: RichTextValue<F>;
  /** The starting content, when the editor owns it. */
  defaultValue?: RichTextValue<F>;
  /** Called with the new content after every edit, in `format`. An empty document is `''` in HTML. */
  onChange?: (value: RichTextValue<F>) => void;
  /** Default `toolbar`. */
  variant?: RichTextVariant;
  /**
   * The buttons, in order. Default: all of `RICH_TEXT_ACTIONS` for `toolbar`, the inline marks and
   * the link for `bubble`. Ignored by `minimal`.
   */
  toolbar?: readonly RichTextAction[];
  /** Replaces any text the editor draws itself: the buttons, their tooltips, the link field. */
  labels?: RichTextLabels;
  label?: string;
  description?: string;
  /** Message under the editor, in red. The editable text is `aria-invalid` and described by it. */
  error?: string;
  /** Marks the field required: an asterisk after the label and `aria-required` on the text. */
  required?: boolean;
  /** Slot rendered next to the label text (e.g. a TooltipHelp). */
  labelTrailing?: ReactNode;
  /** Text size and padding, aligned on the other fields. Default `md`. */
  size?: FieldSize;
  placeholder?: string;
  /** The text can be selected and its links followed, not changed. The toolbar is hidden. */
  readOnly?: boolean;
  /** Greyed out: the text and the buttons do nothing and are skipped by Tab. */
  disabled?: boolean;
  /**
   * Most characters of text (markup not counted), with a `<used> / <max>` counter. Typing stops
   * at the limit and a paste is cut there. A `defaultValue` or first `value` over it is kept and
   * flagged as invalid (`aria-invalid`, red counter) until it is cut below; a later `value` that
   * puts the text over the limit is not loaded.
   */
  maxLength?: number;
  /** Minimum height, in lines of text. Default `4`. */
  rows?: number;
  /** Focus the text, caret at the end, on mount. Default `false`. */
  autoFocus?: boolean;
  /** Id of the editable text. Default: generated. */
  id?: string;
  /** Posts the content with a native form: a hidden input of this name holds it (JSON as text). */
  name?: string;
  /** Accessible name when there is no `label`. */
  'aria-label'?: string;
  className?: string;
};

type Latest = {
  format: RichTextFormat;
  placeholder?: string;
  setCurrent: (content: Content) => void;
  openLink: () => boolean;
};

const NO_PROPS: Latest = { format: 'html', setCurrent: () => {}, openLink: () => false };

const createStore = <T,>(initial: T) => {
  let value = initial;
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
    },
  };
};

const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

type Content = string | JSONContent;

const readContent = (editor: Editor, format: RichTextFormat): Content =>
  format === 'json' ? editor.getJSON() : editor.isEmpty ? '' : editor.getHTML();

const countCharacters = (editor: Editor) =>
  (editor.storage.characterCount?.characters() as number | undefined) ?? 0;

const sameContent = (a: Content, b: Content) =>
  typeof a === 'string' || typeof b === 'string'
    ? a === b
    : JSON.stringify(a) === JSON.stringify(b);

// Mod-k, bound only where a link field exists.
const LinkShortcut = Extension.create<{ open: () => boolean }>({
  name: 'linkShortcut',
  addOptions: () => ({ open: () => false }),
  addKeyboardShortcuts() {
    return { 'Mod-k': () => this.options.open() };
  },
});

// The look of the text and of what the schema can hold. The classes sit on the editable element,
// so a descendant variant reaches the nodes ProseMirror renders there.
// Written out in full: Tailwind finds a class by reading the source, not by running it.
const CONTENT_CLASS = [
  'min-w-0 outline-hidden break-words',
  '[&>*+*]:mt-2',
  '[&_h2]:text-lg [&_h2]:leading-snug [&_h2]:font-semibold',
  '[&_h3]:text-base [&_h3]:leading-snug [&_h3]:font-semibold',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li>p]:my-0',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-600',
  'dark:[&_blockquote]:border-gray-600 dark:[&_blockquote]:text-gray-300',
  '[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em]',
  'dark:[&_code]:bg-gray-800',
  '[&_a]:text-brand-600 dark:[&_a]:text-brand-400 [&_a]:underline [&_a]:underline-offset-2',
  '[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0',
  '[&_p.is-editor-empty:first-child]:before:text-gray-500 dark:[&_p.is-editor-empty:first-child]:before:text-gray-400',
  '[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
].join(' ');

/**
 * A formatted text field, built on Tiptap: bold, italic, strike, headings, lists, quote, code,
 * links, undo and redo, behind a toolbar, a bubble over the selection, or only keyboard shortcuts.
 * Part of the `@sckyzo/cosmos-react/editor` entry, which needs the optional peer dependencies
 * (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extensions`, `@tiptap/core`, `@tiptap/pm`).
 *
 * The schema holds paragraphs, headings (2 and 3), bullet and numbered lists, quotes, hard
 * breaks and the marks above: nothing else survives a paste or `value`. Links go through
 * `isSafeLinkUrl` (http(s), mailto, relative). That is the editor's guarantee, not the server's:
 * the HTML a host stores has to be sanitised again where it is read back.
 */
export function RichTextEditor<F extends RichTextFormat = 'html'>({
  format = 'html' as F,
  value,
  defaultValue,
  onChange,
  variant = 'toolbar',
  toolbar,
  labels: labelProps,
  label,
  description,
  error,
  required,
  labelTrailing,
  size = 'md',
  placeholder,
  readOnly = false,
  disabled = false,
  maxLength,
  rows = 4,
  autoFocus = false,
  id,
  name,
  'aria-label': ariaLabel,
  className,
}: RichTextEditorProps<F>) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const labelId = `${fieldId}-label`;
  const descId = `${fieldId}-desc`;
  const labels = useMemo(() => resolveLabels(labelProps), [labelProps]);
  const actions = toolbar ?? (variant === 'bubble' ? BUBBLE_ACTIONS : RICH_TEXT_ACTIONS);
  const hasLinkField = variant !== 'minimal' && actions.includes('link');
  const editable = !readOnly && !disabled;

  const [current, setCurrent] = useControllableState<Content>({
    value: value as Content | undefined,
    defaultValue: defaultValue ?? (format === 'json' ? EMPTY_DOC : ''),
    onChange: (next) => onChange?.(next as RichTextValue<F>),
    name: 'RichTextEditor.value',
  });
  const [linkOpen, setLinkOpen] = useState(false);
  // Read from the editor on creation and on every transaction, which the host's `value` shows too.
  const [characters, setCharacters] = useState(0);

  // What the editor's callbacks read: they are created once, with the editor, and the latest
  // props must reach them. A store of its own, not a ref, which a render must not read.
  const [latest] = useState(() => createStore(NO_PROPS));
  const [echoes] = useState(() => createStore<Content[]>([]));
  useInsertionEffect(() => {
    latest.set({
      format,
      placeholder,
      setCurrent,
      openLink: () => {
        if (!hasLinkField || !editable) return false;
        setLinkOpen(true);
        return true;
      },
    });
  });

  const editor = useEditor(
    {
      // Created after the first render: the server and the first client render agree.
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      editable,
      autofocus: autoFocus ? 'end' : false,
      content: current,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          // What the editor doesn't offer is out of the schema, so no paste or value brings it in.
          codeBlock: false,
          horizontalRule: false,
          underline: false,
          trailingNode: false,
          link: {
            openOnClick: false,
            markdownLinks: true,
            defaultProtocol: 'https',
            isAllowedUri: (url) => isSafeLinkUrl(url),
          },
        }),
        Placeholder.configure({ placeholder: () => latest.get().placeholder ?? '' }),
        ...(maxLength !== undefined ? [CharacterCount.configure({ limit: maxLength })] : []),
        LinkShortcut.configure({ open: () => latest.get().openLink() }),
      ],
      onCreate: ({ editor: created }) => setCharacters(countCharacters(created)),
      onTransaction: ({ editor: changed }) => setCharacters(countCharacters(changed)),
      onUpdate: ({ editor: updated }) => {
        const content = readContent(updated, latest.get().format);
        echoes.get().push(content);
        latest.get().setCurrent(content);
      },
    },
    [maxLength, format]
  );

  // The host changed the value (or reset it): the editor shows it, without reporting it back.
  // `echoes` is what the editor reported and the host has not handed back yet. Typing is faster
  // than a render: by the time `value` comes back as "Do", the editor holds "Doc", and loading
  // "Do" would eat the "c". A value found in the queue is the echo of an edit, however late;
  // anything else is the host changing the content.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const queue = echoes.get();
    const echo = queue.findIndex((sent) => sameContent(sent, current));
    if (echo >= 0) {
      queue.splice(0, echo + 1);
      return;
    }
    queue.length = 0;
    if (!sameContent(readContent(editor, format), current)) {
      editor.commands.setContent(current, { emitUpdate: false });
    }
  }, [editor, current, format, echoes]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.isEditable !== editable) {
      editor.setEditable(editable, false);
    }
  }, [editor, editable]);

  const overLimit = maxLength !== undefined && characters > maxLength;
  const invalid = !!error || overLimit;
  const hasDesc = !!(error || description);

  // The attributes of the editable element: its name, its description and its state, read by
  // assistive technology. `role="textbox"` is Tiptap's own.
  const attributes = useMemo(
    () => ({
      id: fieldId,
      class: clsx(CONTENT_CLASS, 'px-3 py-2'),
      style: `min-height: ${rows * 1.5 + 1}em`,
      'aria-multiline': 'true',
      ...(label ? { 'aria-labelledby': labelId } : ariaLabel ? { 'aria-label': ariaLabel } : {}),
      ...(hasDesc ? { 'aria-describedby': descId } : {}),
      ...(invalid ? { 'aria-invalid': 'true' } : {}),
      ...(required ? { 'aria-required': 'true' } : {}),
      ...(readOnly ? { 'aria-readonly': 'true' } : {}),
      ...(disabled ? { 'aria-disabled': 'true' } : {}),
      // A read-only text is still reachable by keyboard, to scroll it and follow its links.
      ...(!editable && !disabled ? { tabindex: '0' } : {}),
    }),
    [
      fieldId,
      rows,
      label,
      labelId,
      ariaLabel,
      hasDesc,
      descId,
      invalid,
      required,
      readOnly,
      disabled,
      editable,
    ]
  );
  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setOptions({ editorProps: { attributes } });
  }, [editor, attributes]);

  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const onFrameKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Alt+F10: into the bubble over the selection. Escape there brings the focus back.
    if (variant !== 'bubble' || !event.altKey || event.key !== 'F10') return;
    const stop = bubbleRef.current?.querySelector<HTMLElement>('button[tabindex="0"]');
    if (!stop) return;
    event.preventDefault();
    stop.focus();
  };

  const showToolbar = variant === 'toolbar' && !readOnly && editor;
  const counter = maxLength !== undefined;

  return (
    <div className={clsx('block', className)}>
      {label && (
        // The editable text isn't a labelable element, so the label names it by id.
        <span
          id={labelId}
          onClick={() => editor?.commands.focus()}
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {required ? (
            <span>
              {label}
              <RequiredMark />
            </span>
          ) : (
            label
          )}
          {labelTrailing}
        </span>
      )}
      <div
        onKeyDown={onFrameKeyDown}
        className={clsx(
          'block w-full',
          fieldClass({
            size,
            invalid,
            within: true,
            readOnly: readOnly || disabled,
            fixedHeight: false,
          }),
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {showToolbar && (
          <FormattingToolbar
            editor={editor}
            actions={actions}
            labels={labels}
            disabled={disabled}
            linkOpen={linkOpen}
            onLinkOpenChange={setLinkOpen}
            linkMode="popover"
            className="border-b border-gray-200 p-1 dark:border-gray-700"
          />
        )}
        <EditorContent editor={editor} />
        {variant === 'bubble' && editor && editable && (
          <BubbleMenu
            editor={editor}
            updateDelay={0}
            options={{
              strategy: 'fixed',
              placement: 'top',
              offset: 8,
              onHide: () => setLinkOpen(false),
            }}
            // The z-index scale of floating panels (`FLOATING_PANEL_Z`).
            className="z-[9999]"
          >
            <FormattingToolbar
              ref={bubbleRef}
              editor={editor}
              actions={actions}
              labels={labels}
              disabled={disabled}
              linkOpen={linkOpen}
              onLinkOpenChange={setLinkOpen}
              linkMode="inline"
              onEscape={() => {
                setLinkOpen(false);
                editor.commands.focus();
              }}
              className="rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            />
          </BubbleMenu>
        )}
      </div>
      <div className="mt-1 flex items-start justify-between gap-2">
        <span
          id={descId}
          className={clsx(
            'block min-h-[1rem] text-xs',
            error ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error ?? description ?? ''}
        </span>
        {counter && (
          <span
            aria-live="polite"
            className={clsx(
              'shrink-0 font-mono text-xs tabular-nums',
              overLimit ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {characters} / {maxLength}
          </span>
        )}
      </div>
      {name && (
        <input
          type="hidden"
          name={name}
          value={typeof current === 'string' ? current : JSON.stringify(current)}
        />
      )}
    </div>
  );
}
