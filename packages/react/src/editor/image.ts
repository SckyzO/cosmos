import { Image } from '@tiptap/extension-image';
import { DOMParser } from '@tiptap/pm/model';
import { NodeSelection, Plugin, Selection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { isHttpUrl } from '../chat/httpUrl';

const isSafeSource = (src: unknown): src is string => typeof src === 'string' && isHttpUrl(src);

/**
 * Tiptap's image, held to what the editor guarantees for a link. It lives in the line, so the
 * block's alignment moves it with the text. Only `src` and `alt` are in the schema, and a `src`
 * that is not an http(s) URL (`javascript:`, `data:`, a relative path) is out of it: an `<img>`
 * with one in an HTML string is dropped, and one in a JSON document is drawn without a source.
 *
 * An image comes in through the field of the toolbar, which checks the address and asks for a
 * description, or in the document the host hands over (HTML or JSON). Never by paste or drop: the
 * parser of the clipboard has no rule for it, so a picture from another page is dropped before it
 * is a node, and never requested. The Markdown input rule is off for the same reason.
 */
export const RichTextImage = Image.extend({
  // Written out in full: `extend` calls `addOptions` again, and a `configure` before it is lost.
  addOptions() {
    return { inline: true, allowBase64: false, HTMLAttributes: {}, resize: false as const };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        renderHTML: ({ src }: { src?: unknown }) => (isSafeSource(src) ? { src } : {}),
      },
      // `alt=""` is kept, as it says the image is decorative: no `alt` says nothing.
      alt: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) =>
          isSafeSource((element as HTMLElement).getAttribute('src')) ? null : false,
      },
    ];
  },

  addInputRules() {
    return [];
  },

  addProseMirrorPlugins() {
    const { schema } = this.editor;
    const rules = DOMParser.fromSchema(schema).rules.filter(
      (rule) => !('node' in rule && rule.node === this.name)
    );
    // The same rules as everywhere else, less the image's: pasted or dropped content goes through
    // this parser, and `setContent` and `content` through the schema's.
    return [new Plugin({ props: { clipboardParser: new DOMParser(schema, rules) } })];
  },
});

/** The image the selection is on (one clicked, or reached with the arrows), else `undefined`. */
export const selectedImage = (editor: Editor) => {
  const { selection } = editor.state;
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== RichTextImage.name) {
    return undefined;
  }
  const { src, alt } = selection.node.attrs as { src: string | null; alt: string | null };
  return { src: src ?? '', alt };
};

/**
 * Where a new image goes: at the end of the selection, which stays as it was, in the line of text
 * nearest to it (a select-all ends at the end of the last block). `undefined` where no image can
 * go, in a code block.
 */
export const imagePosition = (editor: Editor) => {
  const end = Selection.near(editor.state.selection.$to, -1).$to;
  const image = editor.schema.nodes[RichTextImage.name];
  return image && end.parent.canReplaceWith(end.index(), end.index(), image) ? end.pos : undefined;
};
