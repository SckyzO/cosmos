// The English the rich text editor writes, its part of `CosmosLabels`. The `/editor` entry is built
// apart from the rest of the package, so `englishLabels` does not hold it: `RICH_TEXT_EDITOR_LABELS`
// is exported from `@sckyzo/cosmos-react/editor`.

/**
 * The name of each button of the toolbar, then of each item of the menus they open: what the
 * toolbar draws and what a screen reader reads.
 */
export type RichTextNamed =
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
  | 'redo'
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'alignStart'
  | 'alignCenter'
  | 'alignEnd';

/**
 * Every text the editor draws itself, so a host can translate it. The buttons are named by their
 * action (`bold`, `heading`, `align`, `image`…) and the items of the heading and alignment menus
 * by their choice (`paragraph`, `heading1`, `alignCenter`…).
 */
export type RichTextEditorLabels = Record<RichTextNamed, string> & {
  /** Accessible name of the toolbar. Default `Text formatting`. */
  toolbar: string;
  /** Accessible name of the field where a link's URL is typed. Default `Link URL`. */
  linkUrl: string;
  /** Placeholder of that field. Default `https://`. */
  linkPlaceholder: string;
  /** Accessible name of the link popover. Default `Edit link`. */
  linkDialog: string;
  /** Default `Apply`. */
  linkApply: string;
  /** Default `Remove link`. */
  linkRemove: string;
  /** Shown when the URL is refused. Default `Enter an http(s), mailto or relative link.` */
  linkInvalid: string;
  /** Accessible name of the image popover. Default `Image details`. */
  imageDialog: string;
  /** Label of the field where an image's URL is typed. Default `Image URL`. */
  imageUrl: string;
  /** Placeholder of that field. Default `https://`. */
  imagePlaceholder: string;
  /** Label of the description field, the image's `alt`. Default `Description (alt text)`. */
  imageAlt: string;
  /** Label of the box that marks an image as decorative. Default `Decorative image, no description`. */
  imageDecorative: string;
  /** Default `Apply`. */
  imageApply: string;
  /** Shown when the URL is refused. Default `Enter an http(s) image address.` */
  imageInvalid: string;
  /** Shown when an image has no description and is not marked decorative. Default `Describe the image, or mark it decorative.` */
  imageAltRequired: string;
};

/** What a host gives `RichTextEditor`'s `labels`: any of the texts. */
export type RichTextLabels = Partial<RichTextEditorLabels>;

/** Every text, once the editor's labels, the provider's and the English defaults are merged. */
export type ResolvedLabels = RichTextEditorLabels;

export const RICH_TEXT_EDITOR_LABELS: RichTextEditorLabels = {
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strike: 'Strikethrough',
  heading: 'Heading',
  bulletList: 'Bulleted list',
  orderedList: 'Numbered list',
  blockquote: 'Quote',
  code: 'Code',
  codeBlock: 'Code block',
  align: 'Text alignment',
  link: 'Link',
  image: 'Image',
  undo: 'Undo',
  redo: 'Redo',
  paragraph: 'Paragraph',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  alignStart: 'Align start',
  alignCenter: 'Align center',
  alignEnd: 'Align end',
  toolbar: 'Text formatting',
  linkUrl: 'Link URL',
  linkPlaceholder: 'https://',
  linkDialog: 'Edit link',
  linkApply: 'Apply',
  linkRemove: 'Remove link',
  linkInvalid: 'Enter an http(s), mailto or relative link.',
  imageDialog: 'Image details',
  imageUrl: 'Image URL',
  imagePlaceholder: 'https://',
  imageAlt: 'Description (alt text)',
  imageDecorative: 'Decorative image, no description',
  imageApply: 'Apply',
  imageInvalid: 'Enter an http(s) image address.',
  imageAltRequired: 'Describe the image, or mark it decorative.',
};
