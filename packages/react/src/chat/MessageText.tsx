import { Fragment, type ReactNode } from 'react';

// http(s) URLs only: other schemes (javascript:, data:) stay plain text.
const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;
// Punctuation that ends a sentence rather than the URL.
const TRAILING = /[.,;:!?)\]]+$/;

/**
 * Renders message text as text, turning http(s) URLs into links. Every part
 * goes through React as a string, never through `innerHTML`, so markup in a
 * message shows up verbatim.
 */
export const MessageText = ({ text }: { text: string }) => {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING, '');
    const start = match.index;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <a
        key={start}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-visible:focus-indicator rounded-sm break-all underline underline-offset-2"
      >
        {url}
      </a>
    );
    last = start + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
};
