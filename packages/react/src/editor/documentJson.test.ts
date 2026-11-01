import { describe, expect, it } from 'vitest';
import { withoutDefaultAlignment } from './documentJson';

describe('withoutDefaultAlignment', () => {
  it('drops the empty alignment the alignment extension writes on every block', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { textAlign: null }, content: [{ type: 'text', text: 'Hi' }] },
        { type: 'heading', attrs: { textAlign: null, level: 2 }, content: [] },
      ],
    };
    expect(withoutDefaultAlignment(doc)).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] },
        { type: 'heading', attrs: { level: 2 }, content: [] },
      ],
    });
  });

  it('keeps an alignment that is set, at any depth', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', attrs: { textAlign: 'center' } }],
            },
          ],
        },
      ],
    };
    expect(withoutDefaultAlignment(doc)).toEqual(doc);
  });

  it('leaves the attributes of marks and of other nodes alone', () => {
    const link = { type: 'link', attrs: { href: 'https://example.com', class: null } };
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: null },
          content: [
            { type: 'text', text: 'Docs', marks: [link] },
            { type: 'image', attrs: { src: 'https://example.com/a.png', alt: null } },
          ],
        },
      ],
    };
    expect(withoutDefaultAlignment(doc)).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Docs', marks: [link] },
            { type: 'image', attrs: { src: 'https://example.com/a.png', alt: null } },
          ],
        },
      ],
    });
  });

  it('does not change the document it is given', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', attrs: { textAlign: null } }] };
    withoutDefaultAlignment(doc);
    expect(doc.content[0]?.attrs).toEqual({ textAlign: null });
  });
});
