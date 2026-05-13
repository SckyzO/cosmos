import { clsx } from 'clsx';
import { CopyButton } from './CopyButton';

export type CodeBlockProps = {
  code: string;
  language?: string;
  /** Show the copy button (top-right, hover-revealed). Default `true`. */
  showCopy?: boolean;
  className?: string;
};

export const CodeBlock = ({ code, language, showCopy = true, className }: CodeBlockProps) => (
  <div
    className={clsx(
      'group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
      className,
    )}
  >
    {language && (
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-1.5 dark:border-gray-800">
        <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
          {language}
        </span>
      </div>
    )}
    <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-gray-800 dark:text-gray-200">
      <code>{code}</code>
    </pre>
    {showCopy && (
      <CopyButton value={code} floating className="absolute right-2 top-2" />
    )}
  </div>
);
