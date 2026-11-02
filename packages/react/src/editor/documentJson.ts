import type { JSONContent } from '@tiptap/react';

/**
 * `node` and everything under it without the `textAlign: null` the alignment extension writes on
 * every paragraph and heading. A document with no alignment set reads as it did before the editor
 * could align: the host's stored JSON gains nothing, and an alignment that is set stays. The input
 * is not changed.
 */
export const withoutDefaultAlignment = (node: JSONContent): JSONContent => {
  const { attrs, content, ...rest } = node;
  const result: JSONContent = { ...rest };
  if (attrs) {
    const { textAlign, ...others } = attrs;
    const kept = textAlign == null ? others : { ...others, textAlign };
    if (Object.keys(kept).length > 0) result.attrs = kept;
  }
  if (content) result.content = content.map(withoutDefaultAlignment);
  return result;
};
