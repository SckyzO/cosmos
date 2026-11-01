import type { Editor } from '@tiptap/react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignStart,
  Underline,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { imagePosition, selectedImage } from './image';

/** The buttons a toolbar can hold, in the order `RICH_TEXT_ACTIONS` lists them. */
export type RichTextAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'code'
  | 'codeBlock'
  | 'align'
  | 'link'
  | 'image'
  | 'undo'
  | 'redo';

export const RICH_TEXT_ACTIONS: readonly RichTextAction[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'heading',
  'bulletList',
  'orderedList',
  'blockquote',
  'code',
  'codeBlock',
  'align',
  'link',
  'image',
  'undo',
  'redo',
];

/** What the `bubble` variant shows when `toolbar` doesn't say: the inline marks and the link. */
export const BUBBLE_ACTIONS: readonly RichTextAction[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'link',
];

/** The items of the menus a button opens: one of them is checked. */
export type RichTextChoice =
  'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'alignStart' | 'alignCenter' | 'alignEnd';

/** The fields a button opens, beside the buttons that run on their own. */
export type RichTextForm = 'link' | 'image';

export type ChoiceSpec = {
  id: RichTextChoice;
  label: string;
  /** Shown on the button while this is the checked item. */
  icon: LucideIcon;
  mirror?: boolean;
  /** Matches the shortcut Tiptap binds, announced on the item. */
  shortcut?: readonly string[];
  run: (editor: Editor) => void;
};

export type MenuSpec = {
  choices: readonly ChoiceSpec[];
  /** The item checked when nothing is set: the button is not pressed then. */
  rest: RichTextChoice;
  /** The item that holds at the caret, or `rest`. */
  current: (editor: Editor) => RichTextChoice;
};

export type ActionSpec = {
  icon: LucideIcon;
  /** The icon points along the line (an indented list, undo): it turns around in right to left. */
  mirror?: boolean;
  label: string;
  /** `Mod` is Cmd on macOS and Ctrl elsewhere. Matches the shortcut Tiptap binds. */
  shortcut?: readonly string[];
  isActive: (editor: Editor) => boolean;
  /** Whether the action does nothing right now (nothing to undo). */
  isIdle?: (editor: Editor) => boolean;
  /** Only for a button that runs on its own. */
  run?: (editor: Editor) => void;
  /** The button opens a menu of choices instead. */
  menu?: MenuSpec;
  /** The button opens this field (a popover, or in place of the buttons in a bubble) instead. */
  form?: RichTextForm;
};

// The levels of the heading menu, after the paragraph it starts with.
const HEADINGS = [
  { id: 'heading1', level: 1, icon: Heading1 },
  { id: 'heading2', level: 2, icon: Heading2 },
  { id: 'heading3', level: 3, icon: Heading3 },
] as const;

// Commands run without `.focus()`: a mouse press on a button is kept off the editor's focus
// (`onMouseDown` prevents it), so the text stays focused, and a keyboard press leaves the focus on
// the button, as a toolbar does. The choice of a menu is the exception: the menu took the focus, so
// its command gives it back to the text.
export const ACTION_SPECS: Record<RichTextAction, ActionSpec> = {
  bold: {
    icon: Bold,
    label: 'Bold',
    shortcut: ['Mod', 'B'],
    isActive: (editor) => editor.isActive('bold'),
    run: (editor) => editor.chain().toggleBold().run(),
  },
  italic: {
    icon: Italic,
    label: 'Italic',
    shortcut: ['Mod', 'I'],
    isActive: (editor) => editor.isActive('italic'),
    run: (editor) => editor.chain().toggleItalic().run(),
  },
  underline: {
    icon: Underline,
    label: 'Underline',
    shortcut: ['Mod', 'U'],
    isActive: (editor) => editor.isActive('underline'),
    run: (editor) => editor.chain().toggleUnderline().run(),
  },
  strike: {
    icon: Strikethrough,
    label: 'Strikethrough',
    shortcut: ['Mod', 'Shift', 'S'],
    isActive: (editor) => editor.isActive('strike'),
    run: (editor) => editor.chain().toggleStrike().run(),
  },
  heading: {
    icon: Heading2,
    label: 'Heading',
    isActive: (editor) => editor.isActive('heading'),
    menu: {
      rest: 'paragraph',
      current: (editor) =>
        HEADINGS.find(({ level }) => editor.isActive('heading', { level }))?.id ?? 'paragraph',
      choices: [
        {
          id: 'paragraph',
          label: 'Paragraph',
          icon: Pilcrow,
          shortcut: ['Mod', 'Alt', '0'],
          run: (editor) => editor.chain().focus().setParagraph().run(),
        },
        ...HEADINGS.map(({ id, level, icon }) => ({
          id,
          label: `Heading ${level}`,
          icon,
          shortcut: ['Mod', 'Alt', String(level)],
          run: (editor: Editor) => editor.chain().focus().setHeading({ level }).run(),
        })),
      ],
    },
  },
  bulletList: {
    icon: List,
    mirror: true,
    label: 'Bulleted list',
    shortcut: ['Mod', 'Shift', '8'],
    isActive: (editor) => editor.isActive('bulletList'),
    run: (editor) => editor.chain().toggleBulletList().run(),
  },
  orderedList: {
    icon: ListOrdered,
    mirror: true,
    label: 'Numbered list',
    shortcut: ['Mod', 'Shift', '7'],
    isActive: (editor) => editor.isActive('orderedList'),
    run: (editor) => editor.chain().toggleOrderedList().run(),
  },
  blockquote: {
    icon: Quote,
    mirror: true,
    label: 'Quote',
    shortcut: ['Mod', 'Shift', 'B'],
    isActive: (editor) => editor.isActive('blockquote'),
    run: (editor) => editor.chain().toggleBlockquote().run(),
  },
  code: {
    icon: Code,
    label: 'Code',
    shortcut: ['Mod', 'E'],
    isActive: (editor) => editor.isActive('code'),
    run: (editor) => editor.chain().toggleCode().run(),
  },
  codeBlock: {
    icon: SquareCode,
    label: 'Code block',
    shortcut: ['Mod', 'Alt', 'C'],
    isActive: (editor) => editor.isActive('codeBlock'),
    run: (editor) => editor.chain().toggleCodeBlock().run(),
  },
  align: {
    icon: TextAlignStart,
    mirror: true,
    label: 'Text alignment',
    isActive: (editor) =>
      editor.isActive({ textAlign: 'center' }) || editor.isActive({ textAlign: 'end' }),
    menu: {
      rest: 'alignStart',
      current: (editor) =>
        editor.isActive({ textAlign: 'center' })
          ? 'alignCenter'
          : editor.isActive({ textAlign: 'end' })
            ? 'alignEnd'
            : 'alignStart',
      choices: [
        {
          id: 'alignStart',
          label: 'Align start',
          icon: TextAlignStart,
          mirror: true,
          // The start is what a block has when nothing is set.
          run: (editor) => editor.chain().focus().unsetTextAlign().run(),
        },
        {
          id: 'alignCenter',
          label: 'Align center',
          icon: TextAlignCenter,
          run: (editor) => editor.chain().focus().setTextAlign('center').run(),
        },
        {
          id: 'alignEnd',
          label: 'Align end',
          icon: TextAlignEnd,
          mirror: true,
          run: (editor) => editor.chain().focus().setTextAlign('end').run(),
        },
      ],
    },
  },
  link: {
    icon: Link,
    label: 'Link',
    shortcut: ['Mod', 'K'],
    isActive: (editor) => editor.isActive('link'),
    form: 'link',
  },
  image: {
    icon: ImageIcon,
    label: 'Image',
    isActive: (editor) => selectedImage(editor) !== undefined,
    // An image lives in a line of text, and a code block has none.
    isIdle: (editor) => selectedImage(editor) === undefined && imagePosition(editor) === undefined,
    form: 'image',
  },
  undo: {
    icon: Undo2,
    mirror: true,
    label: 'Undo',
    shortcut: ['Mod', 'Z'],
    isActive: () => false,
    isIdle: (editor) => !editor.can().undo(),
    run: (editor) => editor.chain().undo().run(),
  },
  redo: {
    icon: Redo2,
    mirror: true,
    label: 'Redo',
    shortcut: ['Mod', 'Shift', 'Z'],
    isActive: () => false,
    isIdle: (editor) => !editor.can().redo(),
    run: (editor) => editor.chain().redo().run(),
  },
};

const isApple = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

const KEY_NAMES: Record<string, [apple: string, other: string]> = {
  Mod: ['⌘', 'Ctrl'],
  Shift: ['⇧', 'Shift'],
  Alt: ['⌥', 'Alt'],
};

/** The keys of a shortcut as the tooltip shows them on this platform (`['⌘', 'B']`, `['Ctrl', 'B']`). */
export const shortcutKeys = (shortcut: readonly string[]) =>
  shortcut.map((key) => (KEY_NAMES[key] ? KEY_NAMES[key][isApple() ? 0 : 1] : key));

/**
 * The shortcut for `aria-keyshortcuts`: both platforms' modifier, since the attribute is read
 * before the platform is known on the server (`Control+B Meta+B`).
 */
export const ariaShortcut = (shortcut: readonly string[]) =>
  ['Control', 'Meta']
    .map((mod) => shortcut.map((key) => (key === 'Mod' ? mod : key)).join('+'))
    .join(' ');
