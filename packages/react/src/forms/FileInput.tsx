import { clsx } from 'clsx';
import { Paperclip } from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef } from 'react';
import { useLabels } from '../labels/labelsContext';
import { mergeRefs } from '../ui/mergeRefs';
import { FieldMessage } from './FieldMessage';
import { FILE_INPUT_LABELS, type FileInputLabels } from './labels';

export type FileInputProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'onChange' | 'value'> & {
  label?: string;
  description?: string;
  error?: string;
  /** Called with the array of selected files. */
  onChange?: (files: File[]) => void;
  /** Placeholder when no file is selected. Default `labels.placeholder`, "No file chosen". */
  placeholder?: string;
  /** Show file size next to the name. Default true. */
  showSize?: boolean;
  /** The texts it writes, over `LabelsProvider`'s `fileInput` and the English defaults. */
  labels?: Partial<FileInputLabels>;
};

const summarizeFiles = (files: File[], showSize: boolean, labels: FileInputLabels): string => {
  if (files.length === 0) return '';
  if (files.length === 1) {
    const f = files[0]!;
    return labels.file(f.name, showSize ? labels.fileSize(f.size) : undefined);
  }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  return labels.files(files.length, showSize ? labels.fileSize(total) : undefined);
};

export function FileInput({
  label,
  description,
  error,
  onChange,
  placeholder,
  showSize = true,
  labels: ownLabels,
  multiple,
  accept,
  disabled,
  id,
  name,
  className,
  ref,
  ...rest
}: FileInputProps) {
  const labels = useLabels('fileInput', FILE_INPUT_LABELS, ownLabels);
  const generatedId = useId();
  const fieldId = id ?? name ?? generatedId;
  const innerRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles(list);
    onChange?.(list);
  };

  const summary = summarizeFiles(files, showSize, labels);

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
        // The file name is dimmed with the disabled field: aria-disabled tells
        // axe it belongs to an inactive control, exempt from contrast (WCAG 1.4.3).
        aria-disabled={disabled || undefined}
        className={clsx(
          'h-ctrl-36 flex w-full items-stretch overflow-hidden rounded-lg border bg-white transition-colors dark:bg-gray-800',
          error
            ? 'focus-within:field-focus-error border-red-400 dark:border-red-500/60'
            : 'focus-within:field-focus border-gray-200 dark:border-gray-700',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <button
          type="button"
          onClick={() => innerRef.current?.click()}
          disabled={disabled}
          className="flex shrink-0 items-center gap-2 border-e border-inherit bg-gray-50 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none disabled:cursor-not-allowed dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Paperclip className="h-4 w-4" aria-hidden />
          {labels.browse}
        </button>
        <span
          className={clsx(
            'flex min-w-0 flex-1 items-center px-3 text-sm',
            files.length === 0
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-900 dark:text-white'
          )}
        >
          <span className="truncate">
            <bdi>{summary || (placeholder ?? labels.placeholder)}</bdi>
          </span>
        </span>
        <input
          ref={mergeRefs(innerRef, ref)}
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
      <FieldMessage
        show={!!(error || description)}
        as="p"
        className={clsx(
          'mt-1 text-xs',
          error ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
        )}
      >
        {error ?? description}
      </FieldMessage>
    </div>
  );
}
