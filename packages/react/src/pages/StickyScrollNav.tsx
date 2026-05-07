import { clsx } from 'clsx';

export type StickyScrollNavSection = {
  id: string;
  label: string;
};

export type StickyScrollNavProps = {
  sections: StickyScrollNavSection[];
  /** Custom scroll behavior — defaults to `scrollIntoView({ behavior: 'smooth', block: 'start' })`. */
  onNavigate?: (id: string) => void;
  /** CSS top offset (px) — pass the height of any fixed header above. */
  topOffset?: number;
  className?: string;
};

/**
 * StickyScrollNav — sticky horizontal nav row that scrolls to in-page
 * sections by id. Useful for long template gallery pages and docs.
 */
export const StickyScrollNav = ({
  sections,
  onNavigate,
  topOffset = 0,
  className,
}: StickyScrollNavProps) => {
  const handleClick = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      style={{ top: topOffset }}
      className={clsx(
        'sticky z-20 -mx-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90',
        className
      )}
    >
      <div className="flex gap-1">
        {sections.map(({ id, label }) => (
          <button
            type="button"
            key={id}
            onClick={() => handleClick(id)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
};
