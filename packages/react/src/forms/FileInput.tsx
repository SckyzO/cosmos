import { clsx } from 'clsx';
import { Paperclip } from 'lucide-react';
import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react';

export type FileInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange' | 'value'
> & {
  label?: string;
  description?: string;
  error?: string;
  /** Called with the array of selected files. */
  onChange?: (files: File[]) => void;
  /** Browse button label. Default "Browse". */
  buttonLabel?: string;
  /** Placeholder when no file is selected. Default "No file chosen". */
  placeholder?: string;
  /** Show file size next to the name. Default true. */
  showSize?: boolean;
};

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const summarizeFiles = (files: File[], showSize: boolean): string => {
  if (files.length === 0) return '';
  if (files.length === 1) {
    const f = files[0];
    return showSize ? `${f.name} — ${formatBytes(f.size)}` : f.name;
  }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  return showSize ? `${files.length} files — ${formatBytes(total)} total` : `${files.length} files`;
};

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(function FileInput(
  {
    label,
    description,
    error,
    onChange,
    buttonLabel = 'Browse',
    placeholder = 'No file chosen',
    showSize = true,
    multiple,
    accept,
    disabled,
    id,
    name,
    className,
    ...rest
  },
  forwardedRef
) {
  const generatedId = useId();
  const fieldId = id ?? name ?? generatedId;
  const innerRef = useRef<HTMLInputElement>(null);
  const setRef = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles(list);
    onChange?.(list);
  };

  const summary = summarizeFiles(files, showSize);

  return (
    <div className={clsx('block', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div
        className={clsx(
          'flex h-9 w-full items-stretch overflow-hidden rounded-lg border bg-white transition-colors dark:bg-gray-800',
          error
            ? 'border-red-400 focus-within:border-red-500 dark:border-red-500/60'
            : 'focus-within:border-brand-500 border-gray-200 dark:border-gray-700',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <button
          type="button"
          onClick={() => innerRef.current?.click()}
          disabled={disabled}
          className="flex shrink-0 items-center gap-2 border-r border-inherit bg-gray-50 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Paperclip className="h-4 w-4" aria-hidden />
          {buttonLabel}
        </button>
        <span
          className={clsx(
            'flex min-w-0 flex-1 items-center px-3 text-sm',
            files.length === 0
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white'
          )}
        >
          <span className="truncate">{summary || placeholder}</span>
        </span>
        <input
          ref={setRef}
          id={fieldId}
          name={name}
          type="file"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
          {...rest}
        />
      </div>
      {(error || description) && (
        <p
          className={clsx(
            'mt-1 text-xs',
            error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error ?? description}
        </p>
      )}
    </div>
  );
});
