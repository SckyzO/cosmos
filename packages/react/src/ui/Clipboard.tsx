import { clsx } from 'clsx';
import { Check, Copy } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
} from 'react';

export type ClipboardVariant = 'icon' | 'button';
export type ClipboardSize = 'sm' | 'md';

export type ClipboardProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onCopy'> & {
  /** Text written to the clipboard on click. */
  value: string;
  /** `icon` (default) → square icon-only button. `button` → icon + label. */
  variant?: ClipboardVariant;
  size?: ClipboardSize;
  /** Override the label (only shown when `variant="button"`). */
  copyLabel?: string;
  copiedLabel?: string;
  /** Milliseconds the "copied" state stays visible. Default 1500. */
  duration?: number;
  /** Fires after the value is copied. */
  onCopy?: (value: string) => void;
  /**
   * Style for floating on top of a code block (translucent bg, hover-revealed
   * via parent's `group` class). Pair with a `group` parent and absolute
   * positioning. Default `false`.
   */
  floating?: boolean;
};

const SIZE_ICON: Record<ClipboardSize, { box: string; icon: string }> = {
  sm: { box: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-9 w-9', icon: 'h-4 w-4' },
};

const SIZE_BUTTON: Record<ClipboardSize, string> = {
  sm: 'h-7 px-2 text-xs gap-1.5',
  md: 'h-9 px-3 text-sm gap-2',
};

export const Clipboard = forwardRef<HTMLButtonElement, ClipboardProps>(function Clipboard(
  {
    value,
    variant = 'icon',
    size = 'sm',
    copyLabel = 'Copy',
    copiedLabel = 'Copied!',
    duration = 1500,
    onCopy,
    floating = false,
    className,
    onClick,
    ...rest
  },
  ref
) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        onCopy?.(value);
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setCopied(false), duration);
      } catch {
        // Clipboard API unavailable — silent noop
      }
    },
    [value, duration, onClick, onCopy]
  );

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    []
  );

  const Icon = copied ? Check : Copy;
  const label = copied ? copiedLabel : copyLabel;
  const iconClass = clsx(SIZE_ICON[size].icon, copied && 'text-green-500');

  const baseClass = floating
    ? 'border border-gray-200 bg-white/90 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:text-gray-200'
    : 'border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700';

  if (variant === 'icon') {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        onClick={handleClick}
        className={clsx(
          'inline-flex items-center justify-center rounded-md',
          SIZE_ICON[size].box,
          baseClass,
          className
        )}
        {...rest}
      >
        <Icon className={iconClass} aria-hidden />
      </button>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-medium',
        SIZE_BUTTON[size],
        baseClass,
        className
      )}
      {...rest}
    >
      <Icon className={iconClass} aria-hidden />
      {label}
    </button>
  );
});
