import { Fragment, type ReactNode } from 'react';
import { URL_PATTERN, trimTrailingPunctuation } from './httpUrl';

/**
 * Renders message text as text, turning http(s) URLs into links. Every part
 * goes through React as a string, never through `innerHTML`, so markup in a
 * message shows up verbatim.
 */
export const MessageText = ({ text }: { text: string }) => {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = trimTrailingPunctuation(match[0]);
    const start = match.index;
    if (start > last) parts.push(text.slice(last, start));
    // A raw `<a>`, never `AppLink`: the URL is the sender's, so it opens a page of another site in a
    // new tab and must not go through the app's router (`LinkProvider`).
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
