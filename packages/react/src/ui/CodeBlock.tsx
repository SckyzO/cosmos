import { clsx } from 'clsx';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Clipboard } from './Clipboard';
import { parseCode, parseLineRanges, splitLines, type CodeRow } from './codeLines';

export type CodeBlockProps = {
  code: string;
  language?: string;
  /**
   * Turns `code` into highlighted nodes, rendered inside the block's `<code>`.
   * Without it the code is plain text; `@sckyzo/cosmos-react/code` exports a
   * `CodeBlock` with a Shiki highlighter plugged in, and any other highlighter
   * can be given here. A highlighter that renders its tokens as elements keeps
   * working with `lineNumbers`, `highlightLines`, `diff` and `variant="terminal"`.
   * The copy button always copies the code, not the highlighted nodes.
   */
  highlight?: (code: string, language?: string) => ReactNode;
  /** Show the copy button (top corner at the end of the line, hover-revealed). Default `true`. */
  showCopy?: boolean;
  /** A line-number gutter. It is not selected and not copied. Default `false`. */
  lineNumbers?: boolean;
  /** Lines to emphasise, 1-based: `[3, '5-7']`. */
  highlightLines?: ReadonlyArray<number | string>;
  /**
   * A header with the file name (and the language), next to the copy button. The file name
   * also names the scrolling region of `maxHeight`.
   */
  filename?: string;
  /** Wrap long lines instead of scrolling sideways. Default `false`. */
  wrap?: boolean;
  /**
   * Scroll inside the block past this height (a number is pixels, a string any CSS length). The
   * block then takes the focus (Tab) and scrolls with the arrow keys, so a keyboard user can
   * read it all; it is a labelled region.
   */
  maxHeight?: number | string;
  /**
   * Show `code` as a diff, written as a unified diff is: the first column of each line is its
   * sign, `+` added, `-` removed, a space unchanged. Added and removed lines are tinted and
   * marked in a gutter with `+` and `−`; the sign column is not part of the copy.
   */
  diff?: boolean;
  /**
   * `terminal` shows a shell session: a line starting with `$ ` is a command (the prompt is drawn
   * apart, a trailing `\` continues it onto the next line), any other line is its output. Only
   * the commands are highlighted (as `bash`) and copied. Default `default`.
   */
  variant?: 'default' | 'terminal';
  className?: string;
};

// The tint is the colour over white (light themes) or black (dark ones), at the percentages
// packages/theme/scripts/check-contrast.mjs checks every code token against: over the block's own
// gray the text tokens, checked on that gray, would fall under 4.5:1. The bar and the sign carry
// what a faint tint cannot. Whole class names, so that Tailwind finds them.
const ADD =
  'bg-[color-mix(in_srgb,var(--color-code-token-inserted)_5%,var(--color-white))] shadow-[inset_2px_0_0_var(--color-code-token-inserted)] dark:bg-[color-mix(in_srgb,var(--color-code-token-inserted)_14%,black)]';
const REMOVE =
  'bg-[color-mix(in_srgb,var(--color-code-token-deleted)_5%,var(--color-white))] shadow-[inset_2px_0_0_var(--color-code-token-deleted)] dark:bg-[color-mix(in_srgb,var(--color-code-token-deleted)_14%,black)]';
const EMPHASIS =
  'bg-[color-mix(in_srgb,var(--color-brand-500)_5%,var(--color-white))] shadow-[inset_2px_0_0_var(--color-brand-500)] dark:bg-[color-mix(in_srgb,var(--color-brand-500)_14%,black)]';

// One tint per row: a diff row wins over an emphasised one.
const rowTint = (kind: CodeRow['kind'], highlighted: boolean) =>
  kind === 'add' ? ADD : kind === 'remove' ? REMOVE : highlighted ? EMPHASIS : undefined;

/**
 * Whether the block scrolls, in either direction. A region that scrolls must be a keyboard stop
 * (axe: scrollable-region-focusable): a long line makes the block scroll sideways, and it did so
 * with no way to reach it without a mouse (#450).
 */
const useScrolls = (maxHeight: CodeBlockProps['maxHeight']) => {
  const ref = useRef<HTMLPreElement>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const pre = ref.current;
    if (!pre || typeof ResizeObserver === 'undefined') return;
    const measure = () =>
      setOverflows(pre.scrollWidth > pre.clientWidth || pre.scrollHeight > pre.clientHeight);
    measure();
    // The box changes with the viewport, and the content with `code`, `wrap` and the font.
    const observer = new ResizeObserver(measure);
    observer.observe(pre);
    if (pre.firstElementChild) observer.observe(pre.firstElementChild);
    return () => observer.disconnect();
  }, []);
  return { ref, scrolls: maxHeight !== undefined || overflows };
};

export const CodeBlock = ({
  code,
  language,
  highlight,
  showCopy = true,
  lineNumbers = false,
  highlightLines,
  filename,
  wrap = false,
  maxHeight,
  diff = false,
  variant = 'default',
  className,
}: CodeBlockProps) => {
  const terminal = variant === 'terminal';
  const mode = terminal ? 'terminal' : diff ? 'diff' : 'plain';
  const { rows, highlightText, copyText } = parseCode(code, mode);
  const emphasised = highlightLines ? parseLineRanges(highlightLines) : undefined;
  const byRow = mode !== 'plain' || lineNumbers || (emphasised?.size ?? 0) > 0;
  const { ref, scrolls } = useScrolls(maxHeight);
  const hasHeader = Boolean(language || filename);
  const wrapClass = wrap && 'break-words whitespace-pre-wrap';

  let content: ReactNode;
  if (!byRow) {
    content = highlight ? highlight(code, language) : code;
  } else {
    // One node per row. The rows that are code go through the highlighter together, so a string
    // or a comment that spans lines is still coloured as one.
    const codeRows = rows.filter((row) => row.kind !== 'output');
    const nodes = highlight
      ? splitLines(
          codeRows.map((row) => row.text),
          highlight(highlightText, terminal ? 'bash' : language)
        )
      : codeRows.map((row) => row.text);
    const digits = String(rows.length).length;
    let next = 0;
    content = rows.map((row, i) => {
      const body = row.kind === 'output' ? row.text : nodes[next++];
      const highlighted = emphasised?.has(i + 1) ?? false;
      return (
        <span
          key={i}
          data-line={i + 1}
          data-kind={row.kind}
          data-highlighted={highlighted || undefined}
          className={clsx(
            'flex min-h-lh px-4',
            rowTint(row.kind, highlighted),
            row.kind === 'output' && 'text-[var(--color-code-token-comment)]'
          )}
        >
          {lineNumbers && (
            <span
              aria-hidden
              className="me-4 shrink-0 text-end text-[var(--color-code-token-comment)] select-none"
              style={{ minWidth: `${digits}ch` }}
            >
              {i + 1}
            </span>
          )}
          {mode === 'diff' && (
            <span className="me-2 w-[1ch] shrink-0 text-center select-none">
              {row.kind === 'add' ? '+' : row.kind === 'remove' ? '−' : ''}
            </span>
          )}
          {row.kind === 'command' && (
            <span className="shrink-0 text-[var(--color-code-token-keyword)] select-none">
              {'$ '}
            </span>
          )}
          {row.kind === 'continued' && (
            // A continuation lines up with the command above it.
            <span aria-hidden className="shrink-0 select-none">
              {'  '}
            </span>
          )}
          <span className={clsx('min-w-0', wrapClass)}>{body}</span>
        </span>
      );
    });
  }

  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-1.5 dark:border-gray-800">
          {filename ? (
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                <bdi>{filename}</bdi>
              </span>
              {language && (
                <span className="text-3xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  {language}
                </span>
              )}
            </span>
          ) : (
            <span className="text-3xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {language}
            </span>
          )}
          {/* When a title bar is present, the copy button lives inside it so the
           *  bar doubles as the action surface — matches GitHub / Carbon / TUI. */}
          {showCopy && <Clipboard value={copyText} floating />}
        </div>
      )}
      <pre
        ref={ref}
        // Code reads left to right whatever the page does: its lines, its number gutter and its
        // scroll origin stay put. The title bar and the copy button around it follow the page.
        dir="ltr"
        // A region that scrolls is a keyboard stop (axe: scrollable-region-focusable), named
        // after what it holds.
        {...(scrolls && {
          tabIndex: 0,
          role: 'region',
          'aria-label': `${filename ?? language ?? 'Code'}, code`,
        })}
        style={maxHeight === undefined ? undefined : { maxHeight }}
        className={clsx(
          'text-xs leading-relaxed text-gray-800 dark:text-gray-200',
          byRow ? 'py-4' : 'p-4',
          scrolls
            ? 'focus-visible:focus-indicator overflow-auto focus-visible:ring-inset'
            : 'overflow-x-auto'
        )}
      >
        <code
          className={(byRow ? clsx('block min-w-full', !wrap && 'w-max') : wrapClass) || undefined}
        >
          {content}
        </code>
      </pre>
      {/* Without a title bar there is nothing to anchor the button to, so we float
       *  it over the code in the top corner at the end of the line (hover-revealed via `group`). */}
      {showCopy && !hasHeader && (
        <Clipboard value={copyText} floating className="inset-e-2 absolute top-2" />
      )}
    </div>
  );
};
