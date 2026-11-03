import { clsx } from 'clsx';
import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ComponentPropsWithRef } from 'react';

export type ClipboardVariant = 'icon' | 'button';
export type ClipboardSize = 'sm' | 'md';

export type ClipboardProps = Omit<ComponentPropsWithRef<'button'>, 'onCopy'> & {
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
  /**
   * No border and no fill, a muted icon with a tint on hover: for a row of actions (the copy
   * button of a chat reply). The `copied` check turns green. Ignored with `floating`. Default
   * `false`.
   */
  plain?: boolean;
};

const SIZE_ICON: Record<ClipboardSize, { box: string; icon: string }> = {
  sm: { box: 'h-ctrl-28 w-ctrl-28', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-ctrl-36 w-ctrl-36', icon: 'h-4 w-4' },
};

const SIZE_BUTTON: Record<ClipboardSize, string> = {
  sm: 'h-ctrl-28 px-2 text-xs gap-1.5',
  md: 'h-ctrl-36 px-3 text-sm gap-2',
};

// The two icons share one cell and cross-fade, so the button keeps its size and the label its place.
// Both stay mounted, hidden from assistive technology: the name is the label.
const FADE = 'transition-opacity duration-(--cosmos-motion-fast) ease-(--cosmos-ease-out)';

const CopyIcons = ({
  copied,
  size,
  checkClass,
}: {
  copied: boolean;
  size: string;
  checkClass: string;
}) => (
  <span className="inline-grid shrink-0 place-items-center *:col-start-1 *:row-start-1">
    <Copy className={clsx(size, FADE, copied && 'opacity-0')} aria-hidden />
    <Check className={clsx(size, FADE, checkClass, !copied && 'opacity-0')} aria-hidden />
  </span>
);

export function Clipboard({
  value,
  variant = 'icon',
  size = 'sm',
  copyLabel = 'Copy',
  copiedLabel = 'Copied!',
  duration = 1500,
  onCopy,
  floating = false,
  plain = false,
  className,
  onClick,
  ref,
  ...rest
}: ClipboardProps) {
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

  const label = copied ? copiedLabel : copyLabel;
  const flatStyle = plain && !floating;
  const icons = (
    <CopyIcons
      copied={copied}
      size={SIZE_ICON[size].icon}
      checkClass={flatStyle ? 'text-green-600 dark:text-green-400' : 'text-green-500'}
    />
  );

  const baseClass = floating
    ? 'border border-gray-200 bg-white/90 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-700 focus-visible:opacity-100 focus-visible:focus-indicator dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:text-gray-200'
    : flatStyle
      ? 'text-[var(--color-text-muted)] transition-colors hover:bg-gray-100 hover:text-[var(--color-text-primary)] focus-visible:focus-indicator dark:hover:bg-gray-800'
      : 'border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus-visible:focus-indicator dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700';

  if (variant === 'icon') {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        onClick={handleClick}
        className={clsx(
          'inline-flex items-center justify-center',
          flatStyle ? 'rounded-lg' : 'rounded-md',
          SIZE_ICON[size].box,
          baseClass,
          className
        )}
        {...rest}
      >
        {icons}
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
      {icons}
      {label}
    </button>
  );
}
