import type { Editor } from '@tiptap/react';
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  type LucideIcon,
} from 'lucide-react';

/** The buttons a toolbar can hold, in the order `RICH_TEXT_ACTIONS` lists them. */
export type RichTextAction =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'code'
  | 'link'
  | 'undo'
  | 'redo';

export const RICH_TEXT_ACTIONS: readonly RichTextAction[] = [
  'bold',
  'italic',
  'strike',
  'heading',
  'bulletList',
  'orderedList',
  'blockquote',
  'code',
  'link',
  'undo',
  'redo',
];

/** What the `bubble` variant shows when `toolbar` doesn't say: the inline marks and the link. */
export const BUBBLE_ACTIONS: readonly RichTextAction[] = [
  'bold',
  'italic',
  'strike',
  'code',
  'link',
];

export type ActionSpec = {
  icon: LucideIcon;
  label: string;
  /** `Mod` is Cmd on macOS and Ctrl elsewhere. Matches the shortcut Tiptap binds. */
  shortcut: readonly string[];
  isActive: (editor: Editor) => boolean;
  /** Whether the action does nothing right now (nothing to undo). */
  isIdle?: (editor: Editor) => boolean;
  /** Not for `link`, which opens its own field. */
  run?: (editor: Editor) => void;
};

// Commands run without `.focus()`: a mouse press on a button is kept off the editor's focus
// (`onMouseDown` prevents it), so the text stays focused, and a keyboard press leaves the focus on
// the button, as a toolbar does.
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
    shortcut: ['Mod', 'Alt', '2'],
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
    run: (editor) => editor.chain().toggleHeading({ level: 2 }).run(),
  },
  bulletList: {
    icon: List,
    label: 'Bulleted list',
    shortcut: ['Mod', 'Shift', '8'],
    isActive: (editor) => editor.isActive('bulletList'),
    run: (editor) => editor.chain().toggleBulletList().run(),
  },
  orderedList: {
    icon: ListOrdered,
    label: 'Numbered list',
    shortcut: ['Mod', 'Shift', '7'],
    isActive: (editor) => editor.isActive('orderedList'),
    run: (editor) => editor.chain().toggleOrderedList().run(),
  },
  blockquote: {
    icon: Quote,
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
  link: {
    icon: Link,
    label: 'Link',
    shortcut: ['Mod', 'K'],
    isActive: (editor) => editor.isActive('link'),
  },
  undo: {
    icon: Undo2,
    label: 'Undo',
    shortcut: ['Mod', 'Z'],
    isActive: () => false,
    isIdle: (editor) => !editor.can().undo(),
    run: (editor) => editor.chain().undo().run(),
  },
  redo: {
    icon: Redo2,
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
