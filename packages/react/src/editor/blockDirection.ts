import { Extension } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// The scripts written from right to left; any other letter reads from left to right.
const RTL_LETTER =
  /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Adlam}\p{Script=Samaritan}\p{Script=Mandaic}]/u;
const LETTER = /\p{L}/u;

/**
 * The direction of the first letter of `text`, the one `dir="auto"` goes by; `undefined` when it
 * has no letter, so the block keeps the direction around it.
 */
export const firstLetterDirection = (text: string): 'ltr' | 'rtl' | undefined => {
  const letter = LETTER.exec(text)?.[0];
  if (letter === undefined) return undefined;
  return RTL_LETTER.test(letter) ? 'rtl' : 'ltr';
};

// Paragraphs and headings follow their text with `unicode-bidi: plaintext` (`CONTENT_CLASS`), but
// that moves the text only. The bullet or number of a list item, the indent of a list and the edge
// of a quote sit on the side their `direction` names, so these get a `dir` of their own.
const CONTAINERS = new Set(['bulletList', 'orderedList', 'listItem', 'blockquote']);

const directionOf = (node: Node) => {
  let direction: 'ltr' | 'rtl' | undefined;
  node.descendants((child) => {
    if (direction) return false;
    if (child.isText) direction = firstLetterDirection(child.text ?? '');
    return !direction;
  });
  return direction;
};

const decorate = (doc: Node) => {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (node.isTextblock) return false;
    if (!CONTAINERS.has(node.type.name)) return true;
    const dir = directionOf(node);
    if (dir) decorations.push(Decoration.node(pos, pos + node.nodeSize, { dir }));
    return true;
  });
  return DecorationSet.create(doc, decorations);
};

const key = new PluginKey<DecorationSet>('blockDirection');

/**
 * Lists, list items and quotes take the direction of what is typed in them, as a paragraph does.
 * A decoration, so the `dir` is on the screen only: the value the editor hands back is unchanged.
 */
export const BlockDirection = Extension.create({
  name: 'blockDirection',
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: (_, { doc }) => decorate(doc),
          apply: (tr, decorations) => (tr.docChanged ? decorate(tr.doc) : decorations),
        },
        props: { decorations: (state) => key.getState(state) },
      }),
    ];
  },
});
