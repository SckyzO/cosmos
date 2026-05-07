import { clsx } from 'clsx';
import { useState } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type AvatarProps = {
  src?: string;
  alt?: string;
  /** Used to compute initials if `src` not provided or fails to load. */
  name?: string;
  size?: AvatarSize;
  className?: string;
};

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const initialsOf = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
};

export const Avatar = ({ src, alt, name, size = 'md', className }: AvatarProps) => {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  return (
    <span
      className={clsx(
        'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        SIZE_CLASS[size],
        className
      )}
      aria-label={alt ?? name}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? name ?? ''}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initialsOf(name)}</span>
      )}
    </span>
  );
};
