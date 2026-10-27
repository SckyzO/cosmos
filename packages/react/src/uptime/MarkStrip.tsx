import { clsx } from 'clsx';
import { useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { FloatingPanel } from '../ui/FloatingPanel';

/** One mark of a strip: a beat, a day. */
export type StripMark = {
  /** Its accessible name: what the mark says, in words. */
  name: string;
  /** The lines of its tooltip, the first in bold: what the name says, one fact a line. */
  lines: string[];
  /** The look of the mark: size and colour. */
  className: string;
};

export type MarkStripProps = {
  marks: StripMark[];
  /** Accessible name of the group. */
  ariaLabel: string;
  /** The element the strip draws in, for the width it takes. */
  stripRef: RefObject<HTMLDivElement | null>;
  /** The layout of the strip: direction, gap, height. */
  className: string;
};

const MARK_ATTR = 'data-mark';

const markOf = (target: EventTarget | null): HTMLElement | null =>
  target instanceof Element ? target.closest<HTMLElement>(`[${MARK_ATTR}]`) : null;

/**
 * A row of marks that are one tab stop. The marks are images with a name and are reached with
 * the arrow keys (Home and End to the ends), the way a toolbar is. Hovering or focusing one shows
 * its tooltip: the same words as its name, since the colour of a mark says nothing to a screen
 * reader. Escape hides the tooltip.
 *
 * The tab stop is the newest mark (the last) until one is focused. Internal to the package, not
 * exported: `HeartbeatBar` and `UptimeBars` draw their marks with it.
 */
export const MarkStrip = ({ marks, ariaLabel, stripRef, className }: MarkStripProps) => {
  // The mark that is the tab stop, by index; the last one until a mark is focused.
  const [active, setActive] = useState<number | null>(null);
  // The mark the tooltip is on: where the pointer is, else where the focus is.
  const [shown, setShown] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const hoverRef = useRef<HTMLElement | null>(null);
  const focusRef = useRef<HTMLElement | null>(null);

  const sync = () => {
    const next = hoverRef.current ?? focusRef.current;
    anchorRef.current = next;
    setShown(next);
  };

  const last = marks.length - 1;
  const tabStop = active !== null && active <= last ? active : last;
  const shownMark = shown ? marks[Number(shown.getAttribute(MARK_ATTR))] : undefined;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const mark = markOf(event.target);
    if (!mark || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = Number(mark.getAttribute(MARK_ATTR));
    const next: Record<string, number> = {
      ArrowRight: Math.min(index + 1, last),
      ArrowLeft: Math.max(index - 1, 0),
      Home: 0,
      End: last,
    };
    const target = next[event.key];
    if (target === undefined) return;
    event.preventDefault();
    stripRef.current?.querySelector<HTMLElement>(`[${MARK_ATTR}="${target}"]`)?.focus();
  };

  return (
    <div
      ref={stripRef}
      role="group"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      onMouseOver={(event) => {
        const mark = markOf(event.target);
        if (mark === hoverRef.current) return;
        hoverRef.current = mark;
        sync();
      }}
      onMouseLeave={() => {
        hoverRef.current = null;
        sync();
      }}
      onFocus={(event) => {
        const mark = markOf(event.target);
        if (!mark) return;
        focusRef.current = mark;
        setActive(Number(mark.getAttribute(MARK_ATTR)));
        sync();
      }}
      onBlur={() => {
        focusRef.current = null;
        sync();
      }}
      className={className}
    >
      {marks.map((mark, index) => (
        <span
          key={index}
          role="img"
          aria-label={mark.name}
          data-mark={index}
          tabIndex={index === tabStop ? 0 : -1}
          className={clsx('focus-visible:focus-indicator', mark.className)}
        />
      ))}
      <FloatingPanel
        open={shownMark !== undefined}
        onClose={() => {
          hoverRef.current = null;
          focusRef.current = null;
          sync();
        }}
        triggerRef={anchorRef}
        moveFocus={false}
        placement={{ side: 'top', align: 'center', offset: 8 }}
        role="tooltip"
        className="pointer-events-none w-max max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white shadow-[0_0_20px_rgba(0,0,0,0.35)] dark:bg-gray-700"
      >
        {shownMark?.lines.map((line, index) => (
          <span
            key={index}
            className={clsx('block', index === 0 ? 'font-semibold' : 'text-gray-300')}
          >
            {line}
          </span>
        ))}
      </FloatingPanel>
    </div>
  );
};
