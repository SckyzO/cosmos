import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode, ComponentPropsWithRef } from 'react';

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

export type MediaObjectProps = ComponentPropsWithRef<'div'> & {
  /**
   * Where the media sits against the body: `start` (top), `center`, `bottom`,
   * or `stretch` (the media slot takes the body's height; size the media
   * `h-full`). Default `start`.
   */
  align?: MediaObjectAlign;
  /** Side of the body the media sits on. `right` reverses the row. Default `left`. */
  mediaPosition?: MediaObjectPosition;
  /** Gap between the media and the body. Default `gap-x-4` (16px). */
  gapClassName?: string;
};

/**
 * MediaObject — an image or icon beside a block of text: a comment, a
 * notification, a list row. Compose `MediaObject.Image` (the media, kept at
 * its size) with `MediaObject.Body` (takes the remaining width);
 * `MediaObject.Title` and `MediaObject.Description` are optional helpers.
 */
function MediaObjectRoot({
  align = 'start',
  mediaPosition = 'left',
  gapClassName = 'gap-x-4',
  className,
  children,
  ref,
  ...rest
}: MediaObjectProps) {
  return (
    <div
      ref={ref}
      data-media-position={mediaPosition}
      className={clsx(
        'flex',
        mediaPosition === 'right' && 'flex-row-reverse',
        ALIGN_CLASS[align],
        gapClassName,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Media slot ──────────────────────────────────────────────────────────────

export type MediaObjectImageProps = ComponentPropsWithRef<'div'>;

function MediaObjectImage({ className, children, ref, ...rest }: MediaObjectImageProps) {
  return (
    <div ref={ref} className={clsx('shrink-0', className)} {...rest}>
      {children}
    </div>
  );
}

// ── Body slot ───────────────────────────────────────────────────────────────

export type MediaObjectBodyProps = ComponentPropsWithRef<'div'>;

function MediaObjectBody({ className, children, ref, ...rest }: MediaObjectBodyProps) {
  return (
    <div ref={ref} className={clsx('min-w-0 flex-1', className)} {...rest}>
      {children}
    </div>
  );
}

// ── Title + Description shortcuts (optional helpers) ────────────────────────

/**
 * Optional title. Renders an `<h4>`: where that level doesn't fit the page
 * outline, put your own heading in `MediaObject.Body` instead.
 */
const Title = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode }) => (
  <h4 className={clsx('text-lg font-bold text-gray-900 dark:text-white', className)} {...rest}>
    {children}
  </h4>
);

const Description = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement> & { children?: ReactNode }) => (
  <p className={clsx('mt-1 text-sm text-gray-600 dark:text-gray-400', className)} {...rest}>
    {children}
  </p>
);

// ── Compound export ──────────────────────────────────────────────────────────

export const MediaObject = Object.assign(MediaObjectRoot, {
  Image: MediaObjectImage,
  Body: MediaObjectBody,
  Title,
  Description,
});
