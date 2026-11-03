import { useLayoutEffect, useRef, useState, type ReactNode, type TransitionEvent } from 'react';
import { clsx } from 'clsx';

export type FoldProps = {
  /** Whether the content is unfolded. */
  open: boolean;
  /** `id` of the folding box, for the `aria-controls` of the button that toggles it. */
  id?: string;
  children: ReactNode;
};

/**
 * Fold — a block of content that unfolds and folds back, internal to the package (not exported).
 *
 * The height runs from 0 to its natural size (`grid-template-rows` from `0fr` to `1fr`, so the
 * content is never measured), while the content fades and slides 4px along the block axis, in
 * `--cosmos-motion-base`: out when it opens, in when it closes. The content stays mounted: a
 * closed fold is `inert` (out of the tab order and of the pointer's reach) and hidden from
 * assistive technology at once, whatever the animation still has to play.
 *
 * Unfolded and at rest the box stops clipping, so a focus ring or a shadow at the content's edge
 * is not cut. With no motion (`0s` durations, reduced motion) there is no animation to wait for:
 * it is at rest as soon as it opens.
 */
export const Fold = ({ open, id, children }: FoldProps) => {
  const box = useRef<HTMLDivElement>(null);
  const [rest, setRest] = useState(open);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    setRest(false);
  }

  // An unfold that starts no transition fires no `transitionend`. Once the open height is
  // committed, `getAnimations()`, which applies the pending style first, tells whether it runs.
  useLayoutEffect(() => {
    if (open && !rest && !box.current?.getAnimations?.().length) setRest(true);
  }, [open, rest]);

  // The end, or the cancel, of the unfold. A transition that ends or is cancelled while another
  // runs on the box (a fold reopened just after it closed) is not the unfold's: nothing to settle.
  const settle = (e: TransitionEvent<HTMLDivElement>) => {
    if (open && e.target === e.currentTarget && e.currentTarget.getAnimations().length === 0) {
      setRest(true);
    }
  };

  return (
    <div
      ref={box}
      id={id}
      inert={!open}
      aria-hidden={open ? undefined : true}
      onTransitionEnd={settle}
      onTransitionCancel={settle}
      className={clsx(
        // One column that never outgrows the box: an `auto` one would take the content's own width.
        'grid grid-cols-1 transition-[grid-template-rows] duration-(--cosmos-motion-base)',
        open
          ? 'grid-rows-[1fr] ease-(--cosmos-ease-out)'
          : 'grid-rows-[0fr] ease-(--cosmos-ease-in)'
      )}
    >
      <div className={clsx('min-h-0', open && rest ? 'overflow-visible' : 'overflow-hidden')}>
        <div
          className={clsx(
            'transition-[opacity,translate] duration-(--cosmos-motion-base)',
            open
              ? 'translate-none opacity-100 ease-(--cosmos-ease-out)'
              : '-translate-y-1 opacity-0 ease-(--cosmos-ease-in)'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
