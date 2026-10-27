import { clsx } from 'clsx';
import { AlertCircle, Check, RotateCw, X } from 'lucide-react';
import { useId, useState, type Ref } from 'react';
import { FILE_KIND_VISUAL, kindFromName, type FileKind } from '../lists/fileKind';
import { INTENT_STYLE } from '../ui/intent';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { formatBytes } from './formatBytes';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'failed';

export type UploadQueueItem = {
  /** Stable key of the upload: what `onRetry` and `onRemove` get back. */
  id: string;
  name: string;
  /** Bytes. Without it the row shows no size and the progress is a bare percentage. */
  size?: number;
  status: UploadStatus;
  /** 0 to 100, while `uploading`. Without it the bar is indeterminate. */
  progress?: number;
  /** Why it failed, shown in place of the progress while `failed`. */
  error?: string;
  /** Icon and tint. Default: read from the extension of `name`. */
  kind?: FileKind;
};

export type UploadQueueProps = {
  items: UploadQueueItem[];
  /** Adds a Retry button to the failed rows. */
  onRetry?: (id: string) => void;
  /**
   * Adds a button to every row: "Cancel {name}" while queued or uploading, "Dismiss {name}" once
   * done, "Remove {name}" when failed. The host stops the transfer and drops the item.
   */
  onRemove?: (id: string) => void;
  /** Title of the card and name of the region. Default `Uploads`. */
  label?: string;
  className?: string;
  /** Ref to the card (`<section>`). */
  ref?: Ref<HTMLElement>;
};

const REMOVE_VERB: Record<UploadStatus, string> = {
  queued: 'Cancel',
  uploading: 'Cancel',
  done: 'Dismiss',
  failed: 'Remove',
};

const percentOf = (progress: number) => Math.round(Math.max(0, Math.min(100, progress)));

const statusLine = (item: UploadQueueItem): string | undefined => {
  if (item.status === 'done') return `${item.name}: upload complete`;
  if (item.status === 'failed') return `${item.name}: upload failed`;
  return undefined;
};

/**
 * What a screen reader hears when a row changes: the rows that just finished or failed, since the
 * last render. A row already `done` or `failed` on first render is not announced.
 */
const useAnnouncement = (items: UploadQueueItem[]): string => {
  const [seen, setSeen] = useState(() => new Map(items.map((i) => [i.id, i.status])));
  const [message, setMessage] = useState('');
  const changed = items.some((i) => seen.get(i.id) !== i.status);
  if (changed || seen.size !== items.length) {
    // Adjusting state while rendering, as React documents, so the message lands with the rows.
    const next = items.filter((i) => seen.has(i.id) && seen.get(i.id) !== i.status);
    const lines = next.map(statusLine).filter((l): l is string => l !== undefined);
    setSeen(new Map(items.map((i) => [i.id, i.status])));
    if (lines.length > 0) setMessage(lines.join('. '));
  }
  return message;
};

/**
 * The uploads in progress, failed and done, as one card. The app owns the transfer, as it owns the
 * messages of a chat: it keeps `items` up to date and answers `onRetry` and `onRemove`. Pair it with
 * a `Dropzone` (`hideFileList`, `onFilesAdded`) so the zone and the queue do not both list the files.
 */
export const UploadQueue = ({
  items,
  onRetry,
  onRemove,
  label = 'Uploads',
  className,
  ref,
}: UploadQueueProps) => {
  const titleId = useId();
  const announcement = useAnnouncement(items);
  if (items.length === 0) return null;
  const done = items.filter((i) => i.status === 'done').length;

  return (
    <section
      ref={ref}
      aria-labelledby={titleId}
      className={clsx(
        'overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--color-bg-panel)] [--card-border:var(--color-border)] dark:[--card-border:var(--color-gray-600)]',
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3.5">
        <span id={titleId} className="text-sm font-semibold text-[var(--color-text-primary)]">
          {label}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          <bdi>
            {done} of {items.length} done
          </bdi>
        </span>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <ul className="divide-y divide-[var(--color-border)]">
        {items.map((item) => (
          <UploadRow key={item.id} item={item} onRetry={onRetry} onRemove={onRemove} />
        ))}
      </ul>
    </section>
  );
};

const UploadRow = ({
  item,
  onRetry,
  onRemove,
}: {
  item: UploadQueueItem;
  onRetry: UploadQueueProps['onRetry'];
  onRemove: UploadQueueProps['onRemove'];
}) => {
  const { id, name, size, status, progress, error } = item;
  const { icon: Icon, intent } = FILE_KIND_VISUAL[item.kind ?? kindFromName(name)];
  const tint = INTENT_STYLE[intent];
  const pct = progress === undefined ? undefined : percentOf(progress);

  // While uploading, the size line says how far it got.
  const uploaded =
    status === 'uploading' && pct !== undefined
      ? size === undefined
        ? `${pct}%`
        : `${formatBytes((size * pct) / 100)} of ${formatBytes(size)} · ${pct}%`
      : undefined;
  const sizeText = uploaded ?? (size === undefined ? undefined : formatBytes(size));

  return (
    <li
      data-status={status}
      className={clsx(
        'py-row-12 flex items-center gap-3 ps-4 pe-3',
        status === 'failed' && 'bg-red-50/40 dark:bg-red-500/5'
      )}
    >
      <span
        className={clsx(
          'flex size-9 shrink-0 items-center justify-center rounded-[10px]',
          tint.tile
        )}
      >
        <Icon className={clsx('size-[18px]', tint.iconColor)} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* On a narrow row the size wraps under the name rather than squeezing it. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
          <span
            title={name}
            className="max-w-full min-w-0 truncate font-semibold text-[var(--color-text-primary)]"
          >
            <bdi>{name}</bdi>
          </span>
          {sizeText && (
            <span className="shrink-0 text-xs text-[var(--color-text-muted)] tabular-nums">
              <bdi>{sizeText}</bdi>
            </span>
          )}
        </div>
        {status === 'uploading' && (
          <ProgressBar
            size="sm"
            value={pct}
            indeterminate={pct === undefined}
            aria-label={`Upload progress of ${name}`}
          />
        )}
        {status === 'failed' && (
          <span className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{error ?? 'Upload failed.'}</span>
          </span>
        )}
        {status === 'done' && (
          <span className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
            <Check className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
            Done
          </span>
        )}
        {status === 'queued' && (
          <span className="text-xs text-[var(--color-text-muted)]">Waiting</span>
        )}
      </div>
      {status === 'failed' && onRetry && (
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCw}
          aria-label={`Retry ${name}`}
          onClick={() => onRetry(id)}
          className="shrink-0"
        >
          {/* Icon only below `sm`, so the error keeps the width; the name says Retry either way. */}
          <span className="hidden sm:inline">Retry</span>
        </Button>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`${REMOVE_VERB[status]} ${name}`}
          onClick={() => onRemove(id)}
          className="focus-visible:focus-indicator flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/10"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </li>
  );
};
