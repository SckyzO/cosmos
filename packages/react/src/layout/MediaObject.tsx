import { clsx } from 'clsx';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

// TUI Plus reference (Pattern 1 — "Basic"):
//   <div class="flex">
//     <div class="mr-4 shrink-0">
//       <svg class="size-16">…</svg>            <!-- media (image/icon) -->
//     </div>
//     <div>
//       <h4 class="text-lg font-bold">Lorem ipsum</h4>
//       <p class="mt-1">Repudiandae sint…</p>
//     </div>
//   </div>
//
// Pattern 2 — "Aligned to center": adds `items-center` on the flex.
// Pattern 3 — "Aligned to bottom":  adds `items-end`.
// Pattern 4 — "Stretched to fit":   adds `items-stretch` + on the media,
//                                    use `self-stretch w-16 h-auto` so the
//                                    media spans the full body height.
// Pattern 5 — "Media on right": reverses with `flex-row-reverse` and swaps
//                                margin to `ml-4`.

export type MediaObjectAlign = 'start' | 'center' | 'bottom' | 'stretch';
export type MediaObjectPosition = 'left' | 'right';

const ALIGN_CLASS: Record<MediaObjectAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  bottom: 'items-end',
  stretch: 'items-stretch',
};

// ── Root ─────────────────────────────────────────────────────────────────────

export type MediaObjectProps = HTMLAttributes<HTMLDivElement> & {
  align?: MediaObjectAlign;
  mediaPosition?: MediaObjectPosition;
  /** Gap between the media and the body. Default `gap-x-4` (16px). */
  gapClassName?: string;
};

const Root = forwardRef<HTMLDivElement, MediaObjectProps>(function MediaObjectRoot(
  {
    align = 'start',
    mediaPosition = 'left',
    gapClassName = 'gap-x-4',
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      data-media-position={mediaPosition}
      className={clsx(
        'flex',
        mediaPosition === 'right' && 'flex-row-reverse',
        ALIGN_CLASS[align],
        gapClassName,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

// ── Media slot ──────────────────────────────────────────────────────────────

export type MediaObjectImageProps = HTMLAttributes<HTMLDivElement>;

const ImageSlot = forwardRef<HTMLDivElement, MediaObjectImageProps>(function MediaObjectImage(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={clsx('shrink-0', className)} {...rest}>
      {children}
    </div>
  );
});

// ── Body slot ───────────────────────────────────────────────────────────────

export type MediaObjectBodyProps = HTMLAttributes<HTMLDivElement>;

const Body = forwardRef<HTMLDivElement, MediaObjectBodyProps>(function MediaObjectBody(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={clsx('min-w-0 flex-1', className)} {...rest}>
      {children}
    </div>
  );
});

// ── Title + Description shortcuts (optional helpers) ────────────────────────

const Title = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode }) => (
  <h4
    className={clsx('text-lg font-bold text-gray-900 dark:text-white', className)}
    {...rest}
  >
    {children}
  </h4>
);

const Description = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement> & { children?: ReactNode }) => (
  <p
    className={clsx('mt-1 text-sm text-gray-600 dark:text-gray-400', className)}
    {...rest}
  >
    {children}
  </p>
);

// ── Compound export ──────────────────────────────────────────────────────────

export const MediaObject = Object.assign(Root, {
  Image: ImageSlot,
  Body,
  Title,
  Description,
});
