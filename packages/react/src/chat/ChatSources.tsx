import { clsx } from 'clsx';
import { useId } from 'react';
import { hostOf, isHttpUrl } from './httpUrl';

export type ChatSource = {
  /** Title of the page, shown on one line (the full title is its tooltip). */
  title: string;
  /**
   * Where it lives. Only an http(s) URL becomes a link; anything else (`javascript:`, `file:`, a
   * relative path) shows as plain text.
   */
  href: string;
  /** Shown after the title. Defaults to the host of `href`, for an http(s) URL only. */
  domain?: string;
};

export type ChatSourcesProps = {
  sources: ChatSource[];
  /** Visible caption of the list, and its accessible name. Default `Sources`. */
  label?: string;
  className?: string;
};

const CHIP =
  'text-xs inline-flex max-w-[min(100%,16.25rem)] items-center gap-1.5 rounded-full border bg-[var(--color-bg-panel)] py-[3px] pe-2.5 ps-1 text-[var(--color-text-primary)]';

/**
 * Where an answer comes from: numbered chips under a "Sources" caption, wrapping onto several
 * lines. Put it in the `children` of a reply, under its text. Titles are text, never HTML.
 *
 * Only http(s) URLs link out (`target="_blank"`, `rel="noopener noreferrer"`), the same rule as
 * the links in `MessageText`; any other `href` is shown as a chip with a dashed border, not as a
 * link.
 */
export const ChatSources = ({ sources, label = 'Sources', className }: ChatSourcesProps) => {
  const captionId = useId();
  if (sources.length === 0) return null;
  return (
    <div className={className}>
      <p
        id={captionId}
        className="text-3xs mb-1.5 font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
      >
        {label}
      </p>
      <ol aria-labelledby={captionId} className="flex flex-wrap gap-1.5">
        {sources.map(({ title, href, domain }, i) => {
          const link = isHttpUrl(href);
          const shown = domain ?? hostOf(href);
          const inner = (
            <>
              <span
                aria-hidden
                className="text-3xs flex size-4.5 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {i + 1}
              </span>
              <span title={title} className="min-w-0 truncate font-medium">
                <bdi>{title}</bdi>
              </span>
              {shown && (
                <span className="text-2xs shrink-0 text-[var(--color-text-muted)]">
                  <bdi>{shown}</bdi>
                </span>
              )}
            </>
          );
          return (
            <li key={`${i}-${href}`} className="max-w-full min-w-0">
              {link ? (
                // A raw `<a>`, never `AppLink`: the URL is the model's or a document's, so it
                // opens a page of another site in a new tab and must not go through the app's
                // router (`LinkProvider`).
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    CHIP,
                    'focus-visible:focus-indicator border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-white/5'
                  )}
                >
                  {inner}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                <span className={clsx(CHIP, 'border-dashed border-[var(--color-border)]')}>
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
