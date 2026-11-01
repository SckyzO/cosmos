import { Fragment } from 'react';
import { highlightParts } from './highlightParts';

export type HighlightProps = {
  /** The text. It is drawn as text: markup in it shows as written. */
  text: string;
  /**
   * What was searched for. Each word (split on spaces) is marked wherever it occurs in `text`,
   * whatever its case, and every character in it is plain text, never a pattern. Nothing is marked
   * for an empty query.
   */
  query: string;
};

/**
 * `Highlight` — `text` with the words of `query` wrapped in `<mark>`, for a search result or a
 * filtered list. It renders inline and takes the style of where it sits, so it goes inside a
 * heading, a link or a table cell:
 *
 *     <Highlight text="Disk alert on rack B4" query="alert" />
 *
 * Built from text nodes and `<mark>` elements only, never `dangerouslySetInnerHTML`.
 */
export const Highlight = ({ text, query }: HighlightProps) => (
  <>
    {highlightParts(text, query).map((part, index) =>
      part.match ? (
        <mark
          key={index}
          // The accent tint with the primary text color on top: the matched word keeps 4.5:1 over
          // the tint in every theme, wherever the surrounding text is muted or colored.
          className="bg-brand-500/25 rounded-xs text-[var(--color-text-primary)]"
        >
          {part.text}
        </mark>
      ) : (
        <Fragment key={index}>{part.text}</Fragment>
      )
    )}
  </>
);
