import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Select } from '../forms/Select';

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
   * 'Jump to section'; a translated app passes its own wording.
   */
  jumpLabel?: string;
  className?: string;
};

// The scroll container the sticky nav sticks in: its nearest scrolling
// ancestor, or null for the viewport.
const scrollContainerOf = (el: HTMLElement): HTMLElement | null => {
  for (let node = el.parentElement; node; node = node.parentElement) {
    if (/auto|scroll|overlay/.test(getComputedStyle(node).overflowY)) return node;
  }
  return null;
};

/**
 * StickyScrollNav — sticky horizontal nav row that scrolls to in-page
 * sections by id, each landing just below the nav. Useful for long template
 * gallery pages, docs and settings pages. Below `sm` the row folds into a jump
 * menu (a native select) that shows the section being read and moves to the
 * one picked.
 */
export const StickyScrollNav = ({
  sections,
  onNavigate,
  topOffset = 0,
  jumpLabel = 'Jump to section',
  className,
}: StickyScrollNavProps) => {
  const navRef = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(sections[0]?.id ?? '');

  // The jump menu names the section being read: the last one whose top has reached the bottom
  // of the nav, or the last one at the end of the scroll, which may never reach it.
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
      <div className="hidden gap-1 sm:flex">
        {sections.map(({ id, label }) => (
          <button
            type="button"
            key={id}
            onClick={() => handleClick(id)}
            className="focus-visible:focus-indicator py-row-6 shrink-0 rounded-lg px-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:ring-inset dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="sm:hidden">
        <Select
          aria-label={jumpLabel}
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
