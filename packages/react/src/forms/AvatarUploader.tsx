import { clsx } from 'clsx';
import { AlertCircle, Camera, Trash2 } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useLabels } from '../labels/labelsContext';
import { Avatar, type AvatarSize } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { AVATAR_UPLOADER_LABELS, type AvatarUploaderLabels } from './labels';

export type AvatarUploaderSize = 'md' | 'lg';

export type AvatarUploaderProps = {
  /** Current avatar URL (data URL or http). null/undefined → initials fallback. */
  src?: string | null;
  /** Used for the initials fallback when `src` is empty. */
  name?: string;
  /** Visual size. `md` = 80px (default), `lg` = 96px. */
  size?: AvatarUploaderSize;
  /** Called with the picked file once type/size validation has passed. */
  onUpload: (file: File) => void | Promise<void>;
  /** Called when the user clicks Remove. Hidden when omitted. */
  onRemove?: () => void | Promise<void>;
  /** Override the loading spinner externally (controlled). */
  loading?: boolean;
  /** External error message. Overrides any internal validation error. */
  error?: string;
  /** Helper text below the actions. */
  helperText?: string;
  /** Max file size in megabytes. Default 5. */
  maxSizeMB?: number;
  /** File picker accept attribute. Default `image/*`. */
  accept?: string;
  disabled?: boolean;
  /** Override the upload button label. Default toggles `labels.change` / `labels.upload`. */
  uploadLabel?: string;
  /** Override the remove button label. Default `labels.remove`. */
  removeLabel?: string;
  /** The texts it writes, over `LabelsProvider`'s `avatarUploader` and the English defaults. */
  labels?: Partial<AvatarUploaderLabels>;
  className?: string;
};

const SIZE_TO_AVATAR: Record<AvatarUploaderSize, AvatarSize> = {
  md: '2xl',
  lg: '3xl',
};

const SIZE_BOX: Record<AvatarUploaderSize, string> = {
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
};

export const AvatarUploader = ({
  src,
  name,
  size = 'md',
  onUpload,
  onRemove,
  loading: loadingProp,
  error: errorProp,
  helperText,
  maxSizeMB = 5,
  accept = 'image/*',
  disabled = false,
  uploadLabel,
  removeLabel,
  labels: ownLabels,
  className,
}: AvatarUploaderProps) => {
  const labels = useLabels('avatarUploader', AVATAR_UPLOADER_LABELS, ownLabels);
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const loading = loadingProp ?? internalLoading;
  const error = errorProp ?? internalError;
  const hasAvatar = !!src;
  const isBusy = disabled || loading;
  const defaultUploadLabel = hasAvatar ? labels.change : labels.upload;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setInternalError(labels.notImage);
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setInternalError(labels.tooLarge(maxSizeMB));
      return;
    }
    setInternalError(null);
    setInternalLoading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setInternalError(err instanceof Error ? err.message : labels.failed);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleRemove = () => {
    if (!onRemove || isBusy) return;
    setInternalError(null);
    void onRemove();
  };

  return (
    <div className={clsx('flex items-center gap-6', className)}>
      <div className={clsx('relative shrink-0', SIZE_BOX[size])}>
        <Avatar
          src={src ?? undefined}
          name={name}
          size={SIZE_TO_AVATAR[size]}
          className="ring-2 ring-gray-200 dark:ring-gray-700"
        />
        {loading && (
          <div
            role="status"
            aria-label={labels.uploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"
          >
            <Spinner size="sm" onDark />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFile}
          aria-label={labels.input}
          disabled={isBusy}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Camera}
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {uploadLabel ?? defaultUploadLabel}
          </Button>
          {hasAvatar && onRemove && (
            <Button
              type="button"
              variant="ghost"
              intent="danger"
              size="sm"
              icon={Trash2}
              disabled={isBusy}
              onClick={handleRemove}
            >
              {removeLabel ?? labels.remove}
            </Button>
          )}
        </div>
        {error ? (
          <p className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {helperText ?? labels.helper(maxSizeMB)}
          </p>
        )}
      </div>
    </div>
  );
};
