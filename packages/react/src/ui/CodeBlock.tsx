import { clsx } from 'clsx';
import { useRef, type ReactNode } from 'react';
import { useOverflows } from '../hooks/useOverflows';
import { Clipboard } from './Clipboard';

export type CodeBlockProps = {
  code: string;
  language?: string;
  /**
   * Turns `code` into highlighted nodes, rendered inside the block's `<code>`.
   * Cosmos ships no highlighter: plug one in (the story wires Shiki to the
   * `--color-code-*` theme tokens). Without it the code is plain text. The
   * copy button always copies `code`.
   */
  highlight?: (code: string, language?: string) => ReactNode;
  /** Show the copy button (top-right, hover-revealed). Default `true`. */
  showCopy?: boolean;
  className?: string;
};

export const CodeBlock = ({
  code,
  language,
  highlight,
  showCopy = true,
  className,
}: CodeBlockProps) => {
  const preRef = useRef<HTMLPreElement>(null);
  // A line wider than the block makes it scroll sideways: a keyboard must be able to reach it.
  const scrolls = useOverflows(preRef);
  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      {language && (
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-1.5 dark:border-gray-800">
          <span className="text-3xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
            {language}
          </span>
          {/* When a title bar is present, the copy button lives inside it so the
           *  bar doubles as the action surface — matches GitHub / Carbon / TUI. */}
          {showCopy && <Clipboard value={code} floating />}
        </div>
      )}
      <pre
        ref={preRef}
        tabIndex={scrolls ? 0 : undefined}
        role={scrolls ? 'region' : undefined}
        aria-label={scrolls ? (language ? `${language} code` : 'Code') : undefined}
        className="focus-visible:focus-indicator overflow-x-auto p-4 text-xs leading-relaxed text-gray-800 focus-visible:ring-inset dark:text-gray-200"
      >
        <code>{highlight ? highlight(code, language) : code}</code>
      </pre>
      {/* Without a title bar there is nothing to anchor the button to, so we float
       *  it over the code in the top-right corner (hover-revealed via `group`). */}
      {showCopy && !language && (
        <Clipboard value={code} floating className="absolute top-2 right-2" />
      )}
    </div>
  );
};
