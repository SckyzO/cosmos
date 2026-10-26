import { type Ref } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { useShell } from './shellContext';

export type SidebarToggleVariant = 'hamburger' | 'panel';

export type SidebarToggleProps = {
  /**
   * `hamburger` (default): a 40px bordered square with a three-line glyph, for a header; its
   * name shows as a tooltip. `panel`: a full-width row with a panel icon and a "Collapse"
   * label, icon only once collapsed (the tooltip then), for the bottom of the sidebar.
   */
  variant?: SidebarToggleVariant;
  /**
   * Whether the sidebar is collapsed, when the host owns the state. Leave it out inside a
   * `Shell`: the toggle then shows and moves the Shell's state. Outside a Shell, without it,
   * the toggle renders nothing.
   */
  collapsed?: boolean;
  /**
   * Called with the state to move to (`!collapsed`) when the toggle is pressed. Without
   * `collapsed`, inside a Shell, it is called after the Shell moves, never instead.
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * `id` of the element the toggle collapses, for `aria-controls`. Without `collapsed`, inside
   * a Shell, it defaults to the Shell's Sidebar.
   */
  controls?: string;
  /** Extra classes on the button. */
  className?: string;
  /** Ref to the `<button>`. */
  ref?: Ref<HTMLButtonElement>;
};

/**
 * SidebarToggle — the button that collapses and expands the sidebar.
 *
 * Inside a `Shell` it needs no props: it reads the Shell's collapsed state, so it works in the
 * Topbar (which renders one), at the bottom of the Sidebar (`collapseControl="sidebar"`, or in
 * its `footer`), or in any custom header placed in the Shell, and every toggle stays in sync.
 * Outside a Shell, the host passes `collapsed` and `onCollapsedChange`; `collapsed` set
 * inside a Shell also takes over from the Shell, for a toggle that drives something else.
 *
 * Named "Collapse sidebar" or "Expand sidebar", it says the current state with
 * `aria-expanded` and the element it collapses with `aria-controls`. Below `lg`, inside a Shell,
 * the sidebar is a drawer: the toggle is named "Open navigation" or "Close navigation", opens and
 * closes it, and `onCollapsedChange` is not called (the collapsed state doesn't move).
 */
export const SidebarToggle = ({
  variant = 'hamburger',
  collapsed: collapsedProp,
  onCollapsedChange,
  controls,
  className,
  ref,
}: SidebarToggleProps) => {
  const shell = useShell();
  // `collapsed` set means the host owns the state; otherwise the Shell's, if any.
  const fromShell = collapsedProp === undefined ? shell : null;
  // Below `lg` the Shell's sidebar is a drawer: the toggle opens and closes it, and the collapsed
  // state is not in play.
  const drawer = fromShell?.isMobile ? fromShell : null;
  const collapsed = drawer ? false : (collapsedProp ?? fromShell?.collapsed);
  if (collapsed === undefined) return null;

  const label = drawer
    ? drawer.open
      ? 'Close navigation'
      : 'Open navigation'
    : collapsed
      ? 'Expand sidebar'
      : 'Collapse sidebar';
  const expanded = drawer ? drawer.open : !collapsed;
  const panel = variant === 'panel';
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        if (drawer) {
          // Some browsers don't focus a clicked button: the drawer returns focus to it on close.
          e.currentTarget.focus();
          drawer.setOpen(!drawer.open);
          return;
        }
        fromShell?.setCollapsed(!collapsed);
        onCollapsedChange?.(!collapsed);
      }}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls ?? fromShell?.navId}
      // The panel row shows "Collapse" while expanded: the tooltip only adds to the icon alone.
      title={panel && !collapsed && !drawer ? undefined : label}
      className={clsx(
        'focus-visible:focus-indicator flex shrink-0 items-center text-[var(--color-text-secondary)] transition-colors hover:bg-black/5 dark:hover:bg-white/5',
        panel
          ? [
              'w-full gap-3 rounded-lg py-2 text-sm font-medium hover:text-[var(--color-text-primary)]',
              collapsed ? 'justify-center px-2' : 'px-3',
            ]
          : 'h-10 w-10 justify-center rounded-lg border border-[var(--color-border)]',
        className
      )}
    >
      {panel ? (
        <>
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          {!collapsed && <span>{drawer ? 'Close' : 'Collapse'}</span>}
        </>
      ) : (
        // TailAdmin asymmetric hamburger — distinctive 3-line glyph
        <svg
          className="fill-current"
          width="16"
          height="12"
          viewBox="0 0 16 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
          />
        </svg>
      )}
    </button>
  );
};
