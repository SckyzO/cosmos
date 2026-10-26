import { clsx } from 'clsx';
import { File as FileIcon, Upload, X } from 'lucide-react';
import {
  useCallback,
  useId,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { formatBytes } from './formatBytes';
import { useControllableState } from '../hooks/useControllableState';

/** A file `Dropzone` turned down, and why, in the words it would have shown. */
export type DropzoneRejection = {
  file: File;
  reason: string;
};

export type DropzoneProps = {
  label?: string;
  description?: string;
  error?: string;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  /** Called with the new list of accepted files. */
  onChange?: (files: File[]) => void;
  /** Controlled file list. */
  value?: File[];
  /**
   * Called with only the files just accepted, in the order they came, so the host can start
   * uploading them. `onChange` and `value` are unchanged: they carry the whole list. Not called when
   * nothing was accepted.
   */
  onFilesAdded?: (files: File[]) => void;
  /**
   * Switches the zone to per-file validation: the valid files of a drop are accepted, and the
   * others come here one by one with their reason (type, size, or `maxFiles` once the list is
   * full). The zone then draws no error line of its own, the host reports them (`error`, a toast,
   * an `UploadQueue` row). Without it, one invalid file rejects the whole drop, as before.
   */
  onReject?: (rejections: DropzoneRejection[]) => void;
  /** Cap on file count when `multiple` is true. */
  maxFiles?: number;
  /** Max bytes per file. */
  maxSize?: number;
  /** Custom content shown inside the drop area (overrides defaults). */
  children?: ReactNode;
  /** Hide the file list rendered below the drop area. Default `false`. */
  hideFileList?: boolean;
  className?: string;
  /** Ref to the drop area (`<div role="button">`), the focusable element, not the hidden file input. */
  ref?: Ref<HTMLDivElement>;
};

const matchesAccept = (file: File, accept: string): boolean => {
  // accept is a comma-separated list of mime types or extensions: "image/*,.pdf"
  return accept.split(',').some((token) => {
    const t = token.trim().toLowerCase();
    if (!t) return false;
    if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t);
    if (t.endsWith('/*')) return file.type.startsWith(t.slice(0, -1));
    return file.type === t;
  });
};

export const Dropzone = ({
  label,
  description,
  error: errorProp,
  multiple = false,
  accept,
  disabled = false,
  onChange,
  value,
  onFilesAdded,
  onReject,
  maxFiles,
  maxSize,
  children,
  hideFileList = false,
  className,
  ref,
}: DropzoneProps) => {
  const fieldId = useId();
  const labelId = useId();
  const contentId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, apply] = useControllableState<File[]>({
    value,
    defaultValue: [],
    onChange,
    name: 'Dropzone.value',
  });
  const [internalError, setInternalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const error = errorProp ?? internalError;

  const validate = useCallback(
    (incoming: File[]): { ok: File[]; error?: string } => {
      const ok: File[] = [];
      for (const f of incoming) {
        if (accept && !matchesAccept(f, accept))
          return { ok: [], error: `"${f.name}" type not allowed (${accept}).` };
        if (maxSize !== undefined && f.size > maxSize)
          return { ok: [], error: `"${f.name}" exceeds ${formatBytes(maxSize)}.` };
        ok.push(f);
      }
      const merged = multiple ? [...files, ...ok] : ok.slice(0, 1);
      if (multiple && maxFiles !== undefined && merged.length > maxFiles)
        return { ok: [], error: `Too many files (max ${maxFiles}).` };
      return { ok: merged };
    },
    [accept, files, maxFiles, maxSize, multiple]
  );

  // Per-file validation, for a host that handles `onReject`: nothing rejects the drop as a whole.
  const handleEachFile = (incoming: File[], reject: (rejections: DropzoneRejection[]) => void) => {
    const rejected: DropzoneRejection[] = [];
    let added: File[] = [];
    for (const file of incoming) {
      if (accept && !matchesAccept(file, accept))
        rejected.push({ file, reason: `Type not allowed (${accept}).` });
      else if (maxSize !== undefined && file.size > maxSize)
        rejected.push({ file, reason: `Exceeds ${formatBytes(maxSize)}.` });
      else added.push(file);
    }
    if (!multiple) added = added.slice(0, 1);
    else if (maxFiles !== undefined) {
      const room = Math.max(0, maxFiles - files.length);
      for (const file of added.slice(room))
        rejected.push({ file, reason: `Too many files (max ${maxFiles}).` });
      added = added.slice(0, room);
    }
    setInternalError(null);
    if (added.length > 0) {
      apply(multiple ? [...files, ...added] : added);
      onFilesAdded?.(added);
    }
    if (rejected.length > 0) reject(rejected);
  };

  const handleFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    if (onReject) {
      handleEachFile(incoming, onReject);
      return;
    }
    const { ok, error: validationError } = validate(incoming);
    if (validationError) {
      setInternalError(validationError);
      return;
    }
    setInternalError(null);
    apply(ok);
    // `ok` is the whole list when `multiple`: the new files are its tail.
    onFilesAdded?.(multiple ? ok.slice(files.length) : ok);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const removeAt = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    apply(next);
    setInternalError(null);
  };

  return (
    <div className={clsx('block', className)}>
      {label && (
        <label
          id={labelId}
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      {/* The zone is the control: it is named by its own text, after the label
          when there is one, and the file input sits outside it, hidden, so the
          button holds nothing focusable. */}
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={label ? `${labelId} ${contentId}` : undefined}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={handleDrop}
        className={clsx(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : clsx(
                'cursor-pointer',
                error ? 'focus-visible:field-focus-error' : 'focus-visible:field-focus'
              ),
          error
            ? 'border-red-300 bg-red-50/40 dark:border-red-500/40 dark:bg-red-500/5'
            : dragOver
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
              : 'hover:border-brand-400 dark:hover:border-brand-500 border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40'
        )}
      >
        <div id={contentId} className="flex w-full flex-col items-center justify-center gap-2">
          {children ?? (
            <>
              <Upload className="h-7 w-7 text-gray-400 dark:text-gray-500" aria-hidden />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                <span className="text-brand-600 dark:text-brand-400 font-semibold">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              {/* A space between the blocks: axe joins their text without one,
                  and then misreads the name as not matching the visible text. */}
              {description && ' '}
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
              )}
            </>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        hidden
        onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      {!hideFileList && files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, idx) => (
            <li
              key={`${f.name}-${idx}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <FileIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900 dark:text-white">{f.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(idx);
                }}
                aria-label={`Remove ${f.name}`}
                className="focus-visible:focus-indicator flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
