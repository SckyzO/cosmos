import { clsx } from 'clsx';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export type CodeBlockProps = {
  code: string;
  language?: string;
  showCopy?: boolean;
  className?: string;
};

export const CodeBlock = ({ code, language, showCopy = true, className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently noop
    }
  };

  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
        className
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
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white/90 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
};
