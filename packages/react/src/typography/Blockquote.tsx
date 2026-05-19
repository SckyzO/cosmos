import { clsx } from 'clsx';
import { Quote } from 'lucide-react';
import type { ReactNode } from 'react';

export type BlockquoteVariant = 'plain' | 'solid' | 'icon' | 'testimonial';
export type BlockquoteSize = 'sm' | 'md' | 'lg';
export type BlockquoteAlign = 'left' | 'center' | 'right';

export type BlockquoteProps = {
  children: ReactNode;
  /**
   * Visual treatment:
   * - `plain` (default): bare italic quote
   * - `solid`: muted background + brand-coloured left border
   * - `icon`: large quote glyph above the text
   * - `testimonial`: solid background + author block in the footer
   */
  variant?: BlockquoteVariant;
  size?: BlockquoteSize;
  align?: BlockquoteAlign;
  /** Author / source — required when `variant="testimonial"`. */
  author?: ReactNode;
  /** Author's role / company. Rendered below `author`. */
  role?: ReactNode;
  /** Optional avatar URL. Replaced by initials of `author` if it fails. */
  authorAvatar?: string;
  className?: string;
};

const SIZE: Record<BlockquoteSize, string> = {
  sm: 'text-base leading-relaxed',
  md: 'text-lg leading-relaxed',
  lg: 'text-2xl leading-snug',
};

const ALIGN: Record<BlockquoteAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const Blockquote = ({
  children,
  variant = 'plain',
  size = 'md',
  align = 'left',
  author,
  role,
  authorAvatar,
  className,
}: BlockquoteProps) => {
  const text = (
    <p className={clsx('font-medium text-gray-700 italic dark:text-gray-200', SIZE[size])}>
      {children}
    </p>
  );

  if (variant === 'icon') {
    return (
      <blockquote className={clsx(ALIGN[align], className)}>
        <Quote
          className={clsx(
            'text-gray-300 dark:text-gray-600',
            align === 'center' ? 'mx-auto mb-3' : 'mb-3',
            align === 'right' ? 'ms-auto' : ''
          )}
          aria-hidden
          size={32}
        />
        {text}
      </blockquote>
    );
  }

  if (variant === 'testimonial') {
    return (
      <figure
        className={clsx(
          'rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50',
          ALIGN[align],
          className
        )}
      >
        <blockquote>{text}</blockquote>
        {(author || role || authorAvatar) && (
          <figcaption
            className={clsx(
              'mt-5 flex items-center gap-3',
              align === 'center' && 'justify-center',
              align === 'right' && 'justify-end'
            )}
          >
            {authorAvatar && (
              <img
                src={authorAvatar}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            )}
            <div className={clsx(align === 'center' && 'text-center')}>
              {author && (
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{author}</div>
              )}
              {role && <div className="text-xs text-gray-500 dark:text-gray-400">{role}</div>}
            </div>
          </figcaption>
        )}
      </figure>
    );
  }

  if (variant === 'solid') {
    return (
      <blockquote
        className={clsx(
          'border-brand-500 rounded-r-lg border-l-4 bg-gray-50 p-4 dark:bg-gray-900/50',
          ALIGN[align],
          className
        )}
      >
        {text}
      </blockquote>
    );
  }

  // plain
  return (
    <blockquote
      className={clsx(
        'border-l-4 border-gray-200 pl-4 dark:border-gray-700',
        ALIGN[align],
        className
      )}
    >
      {text}
    </blockquote>
  );
};
