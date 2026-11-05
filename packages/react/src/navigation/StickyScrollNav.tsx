import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Select } from '../forms/Select';
import { useIndicator } from '../hooks/useIndicator';
import { useLabels } from '../labels/labelsContext';
import { SlidingIndicator } from '../ui/SlidingIndicator';
import { STICKY_SCROLL_NAV_LABELS, type StickyScrollNavLabels } from './labels';

export type StickyScrollNavSection = {
  id: string;
  label: string;
};

export type StickyScrollNavProps = {
  sections: StickyScrollNavSection[];
  /**
   * Custom scroll behavior. Replaces the default, a smooth scroll that puts the
   * top of the section just below the nav.
   */
  onNavigate?: (id: string) => void;
  /**
   * CSS top offset (px) of the sticky nav — pass the height of any fixed header
   * above. A jump lands the section below the nav, so below that header too.
   */
  topOffset?: number;
  /**
   * Name of the jump menu shown below `sm`, in place of the row of buttons. Default
   * `labels.jump`, 'Jump to section'.
   */
  jumpLabel?: string;
  /** The texts it writes, over `LabelsProvider`'s `stickyScrollNav` and the English defaults. */
  labels?: Partial<StickyScrollNavLabels>;
  className?: string;
};

// Idle and being read are exclusive: the read button's hover would otherwise repaint it.
const BUTTON_IDLE =
  'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white';
const BUTTON_READING =
  'bg-brand-500/10 text-brand-600 hover:bg-brand-500/15 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/20';
// Once the marker is in place it draws the fill, and the button keeps its text.
const BUTTON_READING_MARKED = 'text-brand-600 dark:text-brand-400';
const MARKER_FILL = 'rounded-lg bg-brand-500/10 dark:bg-brand-500/15';

// The scroll container the sticky nav sticks in: its nearest scrolling
// ancestor, or null for the viewport.
const scrollContainerOf = (el: HTMLElement): HTMLElement | null => {
  for (let node = el.parentElement; node; node = node.parentElement) {
    if (/auto|scroll|overlay/.test(getComputedStyle(node).overflowY)) return node;
  }
  return null;
};

/**
 * StickyScrollNav — on a long page, a row of buttons stays pinned at the top. Each one scrolls to
 * its section, found by `id`, and lands just under the bar, so the heading stays visible. The
 * button of the section being read is marked (`aria-current="location"`), by a fill that slides
 * from one button to the next as the page scrolls. On a phone the row becomes a select that shows
 * the section you are reading and moves to the one picked. For settings pages, docs and long
 * template pages.
 */
export const StickyScrollNav = ({
  sections,
  onNavigate,
  topOffset = 0,
  jumpLabel,
  labels: ownLabels,
  className,
}: StickyScrollNavProps) => {
  const labels = useLabels('stickyScrollNav', STICKY_SCROLL_NAV_LABELS, ownLabels);
  const navRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(sections[0]?.id ?? '');
  // The fill of the button being read is one element that slides from button to button. The row
  // is hidden below `sm`: it has no layout there, and so no marker, and the buttons are not shown.
  const marker = useIndicator(rowRef, {
    active: 'button[aria-current="location"]',
    options: 'button',
  });
  // Until it is in place (server render, the first frame of a hydration) the button fills itself.
  const marked = marker.box !== null;

  // The section being read, which the jump menu names and the row of buttons marks: the last one
  // whose top has reached the bottom of the nav, or the last one at the end of the scroll, which
  // may never reach it.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const container = scrollContainerOf(nav);
    const scroller: HTMLElement | Window = container ?? window;
    const update = () => {
      const navBottom = nav.getBoundingClientRect().bottom;
      const root = container ?? document.documentElement;
      const atEnd =
        root.scrollTop > 0 && root.scrollTop + root.clientHeight >= root.scrollHeight - 1;
      let reading = sections[0]?.id ?? '';
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= navBottom + 4) reading = id;
      }
      if (atEnd && sections.length > 0) reading = sections[sections.length - 1]!.id;
      setCurrent(reading);
    };
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [sections]);

  const handleClick = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    const nav = navRef.current;
    if (!el || !nav) return;
    // scrollIntoView would put the section under the nav, hiding its heading.
    // Scroll so its top meets the bottom of the nav, once the nav is stuck
    // `topOffset` px below the top of its scroll container. A container's
    // padding counts: the nav sticks inside it, not on its padding edge.
    const container = scrollContainerOf(nav);
    const containerTop = container
      ? container.getBoundingClientRect().top +
        container.clientTop +
        parseFloat(getComputedStyle(container).paddingTop)
      : 0;
    const navBottom = containerTop + topOffset + nav.getBoundingClientRect().height;
    const options: ScrollToOptions = {
      top: el.getBoundingClientRect().top - navBottom,
      behavior: 'smooth',
    };
    if (container) container.scrollBy(options);
    else window.scrollBy(options);
  };

  return (
    <nav
      ref={navRef}
      style={{ top: topOffset }}
      className={clsx(
        'sticky z-20 -mx-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90',
        className
      )}
    >
      {/* `relative isolate`: the marker is placed against the row and sits behind the buttons. */}
      <div ref={rowRef} className="relative isolate hidden gap-1 sm:flex">
        <SlidingIndicator marker={marker} axes="both" className={MARKER_FILL} />
        {sections.map(({ id, label }) => {
          const reading = id === current;
          return (
            <button
              type="button"
              key={id}
              onClick={() => handleClick(id)}
              aria-current={reading ? 'location' : undefined}
              className={clsx(
                'focus-visible:focus-indicator py-row-6 shrink-0 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:ring-inset',
                reading ? (marked ? BUTTON_READING_MARKED : BUTTON_READING) : BUTTON_IDLE
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="sm:hidden">
        <Select
          aria-label={jumpLabel ?? labels.jump}
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            handleClick(e.target.value);
          }}
          options={sections.map(({ id, label }) => ({ value: id, label }))}
        />
      </div>
    </nav>
  );
};
