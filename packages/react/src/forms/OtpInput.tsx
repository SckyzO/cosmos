import { clsx } from 'clsx';
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

export type OtpInputProps = {
  /** Number of cells. Default 6. */
  length?: number;
  /** Current value. Length should be ≤ `length`. */
  value: string;
  onChange: (value: string) => void;
  /** Fired when the user reaches `length` characters. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  /** Allow letters in addition to digits. Default `false` (digits only). */
  alphanumeric?: boolean;
  /** Render each filled cell as a `•` instead of the actual character. */
  mask?: boolean;
  autoFocus?: boolean;
  /** Hidden input `name` for native form submission. */
  name?: string;
  className?: string;
  ariaLabel?: string;
};

const sanitize = (raw: string, alphanumeric: boolean): string => {
  const re = alphanumeric ? /[^A-Za-z0-9]/g : /\D/g;
  return raw.replace(re, '');
};

export const OtpInput = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  alphanumeric = false,
  mask = false,
  autoFocus = false,
  name,
  className,
  ariaLabel = 'Verification code',
}: OtpInputProps) => {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setCell = (idx: number, char: string) => {
    const cleaned = sanitize(char, alphanumeric).slice(0, 1);
    const arr = value.padEnd(length, ' ').split('');
    arr[idx] = cleaned || ' ';
    // Trim trailing spaces but keep internal positions intact while building.
    const finalValue = arr
      .map((c) => (c === ' ' ? '' : c))
      .join('')
      .slice(0, length);
    onChange(finalValue);
    if (finalValue.length === length) onComplete?.(finalValue);
    return cleaned;
  };

  const focusCell = (idx: number) => {
    const target = refs.current[Math.max(0, Math.min(length - 1, idx))];
    target?.focus();
    target?.select();
  };

  const handleChange = (idx: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const inserted = setCell(idx, e.target.value);
    if (inserted) focusCell(idx + 1);
  };

  const handleKeyDown = (idx: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    const cell = value[idx] ?? '';
    if (e.key === 'Backspace') {
      if (cell.length === 0 && idx > 0) {
        e.preventDefault();
        // Clear previous cell and move focus there.
        const arr = value.split('');
        arr[idx - 1] = '';
        onChange(arr.join('').replace(/$/, ''));
        focusCell(idx - 1);
      } else if (cell.length > 0) {
        // Default behaviour also wipes — but we ensure the parent state stays consistent.
        const arr = value.split('');
        arr[idx] = '';
        onChange(arr.join(''));
      }
      return;
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      focusCell(idx - 1);
    }
    if (e.key === 'ArrowRight' && idx < length - 1) {
      e.preventDefault();
      focusCell(idx + 1);
    }
  };

  const handlePaste = (idx: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData('text');
    const cleaned = sanitize(raw, alphanumeric).slice(0, length - idx);
    if (!cleaned) return;
    const arr = value.padEnd(length, ' ').split('');
    cleaned.split('').forEach((c, i) => {
      arr[idx + i] = c;
    });
    const finalValue = arr
      .map((c) => (c === ' ' ? '' : c))
      .join('')
      .slice(0, length);
    onChange(finalValue);
    const nextFocus = Math.min(length - 1, idx + cleaned.length);
    focusCell(nextFocus);
    if (finalValue.length === length) onComplete?.(finalValue);
  };

  return (
    <div className={clsx('flex items-center gap-2', className)} role="group" aria-label={ariaLabel}>
      {Array.from({ length }).map((_, i) => {
        const cellChar = value[i] ?? '';
        const display = mask && cellChar ? '•' : cellChar;
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode={alphanumeric ? 'text' : 'numeric'}
            pattern={alphanumeric ? '[A-Za-z0-9]*' : '[0-9]*'}
            maxLength={1}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            value={display}
            disabled={disabled}
            aria-label={`${ariaLabel} digit ${i + 1}`}
            onChange={handleChange(i)}
            onKeyDown={handleKeyDown(i)}
            onPaste={handlePaste(i)}
            onFocus={(e) => e.target.select()}
            className={clsx(
              'focus:ring-brand-500/30 h-12 w-10 rounded-lg border bg-white text-center text-lg font-semibold text-gray-900 tabular-nums transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white',
              error
                ? 'border-red-400 focus:border-red-500 dark:border-red-500/60'
                : 'focus:border-brand-500 border-gray-200 dark:border-gray-700'
            )}
          />
        );
      })}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
};
