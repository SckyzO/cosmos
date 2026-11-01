import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import { AppLink } from '../ui/AppLink';
import { mergeRefs } from '../ui/mergeRefs';
import { Popover } from '../ui/Popover';
import { Tooltip } from '../ui/Tooltip';
import { OverlayLayerProvider, useOverlayLayer } from '../ui/overlayA11y';
import { fitLabel, useContentWidth } from '../hooks/useContentWidth';
import { useControllableState } from '../hooks/useControllableState';
import { useClamped } from '../hooks/useClamped';
import { useExpandOnHover } from '../hooks/useExpandOnHover';
import { useKeepFocus } from '../hooks/useKeepFocus';
import { useShell } from './shellContext';
import { SidebarToggle } from './SidebarToggle';

// ─── Internal context ─────────────────────────────────────────────────────────
// Threads the `collapsed` state from <Sidebar> down to all subcomponents
// (Brand / Item / Group / Section / SubMenu) without forcing the consumer to
// pass it manually to each child.
//
// Subcomponents always allow an explicit `collapsed` prop that wins over the
// context — useful for one-off overrides or stories that mount a child in
// isolation.

/** How the active row is drawn: a tinted pill (default) or a filled one. */
export type SidebarActiveStyle = 'tint' | 'solid';

/**
 * How the collapsed sidebar expands while the pointer rests on it or keyboard focus is inside:
 * `false` (never), `overlay` (opens above the page, which stays put) or `push` (the page makes
 * room for it).
 */
export type SidebarExpandOnHover = false | 'overlay' | 'push';

/**
 * The shape of the sidebar: `default` (expanded, or collapsed to an icon rail) or `compact`, a
 * fixed narrow rail with the label under each icon.
 */
export type SidebarVariant = 'default' | 'compact';

/**
 * How far the rows sit from the sidebar's edges: `default` (20 px) or `tight` (10 px, the floating
 * Shell's).
 */
export type SidebarGutter = 'default' | 'tight';

// The distance of the expanded rows from the edges. A CSS variable, so an app can set its own
// (`--cosmos-sidebar-gutter: 12px`); `gutter="tight"` sets it on the sidebar. Every position in
// the sidebar that follows the rows is computed from it.
const GUTTER = 'var(--cosmos-sidebar-gutter,20px)';
const TIGHT_GUTTER = '10px';

// The compact rail's width (px).
const COMPACT_WIDTH = 88;

// How far rows sit from the edge of their container: the gutter (`wide`, 20 px by default), or less
// where it doesn't fit or is already given. `tight` (8 px): the collapsed rail, the collapsed
// sub-menu's panel, and the footer, whose own padding brings its rows to the gutter. `none`: the
// collapsed footer, whose
// padding alone fills the 72 px rail.
type RowInset = 'wide' | 'tight' | 'none';

type SidebarContextValue = {
  collapsed: boolean;
  /** The compact rail: top-level rows stack their icon over a short label. */
  compact: boolean;
  inDrawer: boolean;
  inset: RowInset;
  activeStyle: SidebarActiveStyle;
  /** Where the first nested level's label starts, when not under a top-level row (px). */
  labelOrigin?: number;
  /** The rows (by label id) whose label the width cap cuts: they show it in a tooltip. */
  truncated?: ReadonlySet<string>;
};

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  compact: false,
  inDrawer: false,
  inset: 'wide',
  activeStyle: 'tint',
});

// A row collapsed on its own (the `collapsed` prop) can't keep the wide margin.
const useRowInset = (collapsed: boolean): RowInset => {
  const { inset } = useContext(SidebarContext);
  return inset === 'wide' && collapsed ? 'tight' : inset;
};

const useSidebarCollapsed = (override?: boolean): boolean => {
  const ctx = useContext(SidebarContext);
  return override ?? ctx.collapsed;
};

// Nesting level: each Sidebar.SubMenu gives its children its own depth + 1, so
// nested items indent without a `depth` prop.
const SidebarDepthContext = createContext(0);

// Margin of a row, the width a `<button>` row needs to keep it (an `<a>` row is a block and fills
// the rest by itself), and the margin as a CSS length. Rows stand 4 px apart (`mb-1`: one margin,
// so nothing collapses it, and blocks put their space in padding for the same reason).
const ROW_INSET: Record<RowInset, { margin: string; width: string; px: string }> = {
  wide: {
    margin: 'mx-[var(--cosmos-sidebar-gutter,20px)]',
    width: 'w-[calc(100%-2*var(--cosmos-sidebar-gutter,20px))]',
    px: GUTTER,
  },
  tight: { margin: 'mx-2', width: 'w-[calc(100%-1rem)]', px: '8px' },
  none: { margin: 'mx-0', width: 'w-full', px: '0px' },
};

// Inside a top-level row: 12 px of padding, the 16 px icon, a 12 px gap, then the label.
const ROW_PADDING = 12;
const ICON = 16;
const TOP_LABEL = ROW_PADDING + ICON + 12;

// ─── Tree levels ──────────────────────────────────────────────────────────────
// The top level shows an icon. Nested levels show the label alone, smaller and shorter as they go
// down, so the depth reads at a glance: 32, 28, 26 then 24 px rows at the default density, which
// moves them all. Three levels read best; a fourth takes the third's text.

const LEVEL = [
  { text: 'text-sm', py: 'py-row-6' },
  { text: 'text-sm', py: 'py-row-4' },
  { text: 'text-xs', py: 'py-row-5' },
  { text: 'text-xs', py: 'py-row-4' },
] as const;
const level = (depth: number) => LEVEL[Math.min(depth, LEVEL.length - 1)];

// Where a nested row's label starts, from the edge of the rows' container. The first nested level
// lines up under the top-level label (`TOP_LABEL` past the row margin),
// or, in the collapsed sub-menu's panel, which has no top-level row, at the panel's edge; each
// level after it is 16 px further. A nested row's pill starts 10 px before its label, so the guide
// lines on its start side stay visible.
const NESTED_PADDING = 10;

const useNestedGeometry = (inset: RowInset) => {
  const { labelOrigin } = useContext(SidebarContext);
  const margin = ROW_INSET[inset].px;
  // A length past the row margin, or past the panel's edge when the panel sets the origin.
  const at = (px: number) =>
    labelOrigin === undefined ? `calc(${margin} + ${px}px)` : `${labelOrigin + px - TOP_LABEL}px`;
  const labelX = (depth: number) => TOP_LABEL + 16 * (depth - 1);
  return {
    /** Margin (and, for a `<button>`, width) that puts a nested row's pill at its own indent. */
    rowStyle: (depth: number, button: boolean) => {
      const left = at(labelX(depth) - NESTED_PADDING);
      return button
        ? { marginInlineStart: left, width: `calc(100% - ${left} - ${margin})` }
        : { marginInlineStart: left };
    },
    /** The guide line under a row's children: under a top-level icon, or 4 px before the label. */
    guideStart: (depth: number) =>
      depth === 0 ? at(ROW_PADDING + ICON / 2) : at(labelX(depth) - 4),
  };
};

// A row of the collapsed rail: a square the size of the logo's, centred in the rail, so the pill
// of the active row is not a band twice as wide as it is tall. `ctrl-36` follows the density.
const RAIL_ROW = 'mx-auto mb-1 size-ctrl-36 justify-center text-sm';

const ACTIVE_ROW: Record<SidebarActiveStyle, string> = {
  tint: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  solid: 'bg-brand-500 text-white',
};
const HOVER_ROW = 'hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/5';
const IDLE_ROW = clsx('text-[var(--color-text-secondary)]', HOVER_ROW);
// A sub-menu that holds the active row: the accent on the text, without the pill.
const TRAIL_ROW = 'text-brand-600 dark:text-brand-400 hover:bg-black/5 dark:hover:bg-white/5';
// A nested sub-menu without a page of its own only groups rows.
const GROUPING_ROW = clsx('font-normal text-[var(--color-text-muted)]', HOVER_ROW);

// ─── Active trail ─────────────────────────────────────────────────────────────
// Each row tells the sub-menu around it whether it is active, and each sub-menu passes on whether
// it holds an active row, so every sub-menu on the way to the current page knows it.

type ReportActive = (key: string, active: boolean) => void;
const TrailContext = createContext<ReportActive | null>(null);

const useReportActive = (active: boolean) => {
  const report = useContext(TrailContext);
  const key = useId();
  useEffect(() => {
    if (!report) return;
    report(key, active);
    return () => report(key, false);
  }, [report, key, active]);
};

// A row whose label the sidebar's `maxWidth` cuts shows the whole label in a tooltip, on hover and
// on keyboard focus. The others have none: a tooltip repeating a label that shows whole would only
// be noise, and it is read twice by assistive technology.
const LabelTip = ({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactElement;
}) => {
  const { truncated } = useContext(SidebarContext);
  return truncated?.has(id) ? (
    <Tooltip content={label} position="end" block>
      {children}
    </Tooltip>
  ) : (
    children
  );
};

// A 20 px box with a dot: the top-level row's icon when none is given.
const DotIcon = ({ className }: { className?: string }) => (
  <span className={clsx('flex items-center justify-center', className)}>
    <span className="size-1.5 rounded-full bg-current" />
  </span>
);

// The label under an icon of the compact rail: two lines at most, a long word hyphenated where the
// page's language allows it, broken otherwise, rather than cut. `labelRef` gives the element to the
// row, which measures whether the clamp cut the text.
const CompactLabel = ({
  label,
  labelRef,
}: {
  label: string;
  labelRef: (node: HTMLSpanElement | null) => void;
}) => (
  <span
    ref={labelRef}
    className="line-clamp-2 w-full min-w-0 leading-tight break-words hyphens-auto"
  >
    {label}
  </span>
);

// The full name of a compact row whose label the clamp cuts: the others show it whole, and a
// tooltip repeating it would only be read twice.
const CompactTip = ({ label, children }: { label: string; children: ReactElement }) => (
  <Tooltip content={label} position="end" block>
    {children}
  </Tooltip>
);

/** Line drawn above the footer and the collapse row. */
export type SidebarFooterDivider = 'full' | 'inset' | 'none';

const FOOTER_DIVIDER: Record<SidebarFooterDivider, string> = {
  full: 'border-t border-[var(--color-border)]',
  inset:
    'relative before:absolute before:inset-x-[var(--cosmos-sidebar-gutter,20px)] before:top-0 before:h-px before:bg-[var(--color-border)]',
  none: '',
};

// ─── Sidebar root ──────────────────────────────────────────────────────────────

export type SidebarProps = {
  /**
   * `default` (default): expanded, or collapsed to an icon rail. `compact`: a fixed 88 px rail
   * with the label under each icon, on at most two lines (the full name shows in a tooltip when
   * it is cut). A sub-menu opens in a flyout, as in the collapsed rail. It has no collapsed
   * state (`collapsed`, the Shell's toggles, `expandOnHover` and the bottom button do nothing
   * there: with a Shell, set `collapseControl="sidebar"` to keep the Topbar free of a hamburger
   * that would do nothing), and ignores `width`, `maxWidth` and `collapsedWidth`. Below `lg`, in
   * the Shell's drawer, the sidebar is the default one.
   */
  variant?: SidebarVariant;
  /**
   * Whether the sidebar is in collapsed (icons-only) state, when controlled. Not read inside
   * a `Shell`, which owns the state: control it with the Shell's `sidebarCollapsed`.
   */
  collapsed?: boolean;
  /** Initial collapsed state, when uncontrolled. Default `false`. Not read inside a Shell. */
  defaultCollapsed?: boolean;
  /**
   * Width when expanded (px), and the narrowest it gets: the sidebar grows to fit its widest row,
   * up to `maxWidth`. Default: 264
   */
  width?: number;
  /**
   * The widest the expanded sidebar grows to fit its rows (px), deep levels of a tree included.
   * A label that needs more is cut with an ellipsis and shows in full in a tooltip. Set it to the
   * same value as `width` for a fixed width; a smaller value is raised to `width`. Not read
   * collapsed, nor in the Shell's drawer, where the panel sets the width. Default: 320
   */
  maxWidth?: number;
  /** Width when collapsed (px). Default: 72 */
  collapsedWidth?: number;
  /** Sidebar content — typically Sidebar.Brand / .Item / .SubMenu / .Group / .Section. */
  children: ReactNode;
  /**
   * Expands the collapsed sidebar while the pointer rests on it, so the labels are one move away;
   * the collapsed state doesn't change, and the toggles keep theirs.
   *
   * - `false` (default): the rail stays a rail, with a tooltip on each icon.
   * - `'overlay'`: after 150 ms over the rail the sidebar opens at its expanded width above the
   *   page, with a shadow. The page doesn't move: the rail keeps its place in the layout.
   * - `'push'`: the width grows (300 ms) and the page makes room for it. The same 150 ms apply, so
   *   crossing the rail on the way to the page doesn't reflow it.
   *
   * It closes 100 ms after the pointer leaves (a wobble at the edge doesn't flicker it). Focus
   * does the same from the keyboard: it opens as soon as focus enters the sidebar with the
   * keyboard (a click that focuses a row doesn't hold it open) and closes when focus leaves.
   * Escape closes it, after an open popover or tooltip inside it, and it stays closed until focus
   * leaves and comes back or the pointer re-enters. The tooltips stay for the rest.
   *
   * Desktop only: from `lg` up and on a pointer that can hover (`(hover: hover) and
   * (pointer: fine)`). Never on a touch screen, nor in the Shell's drawer, which is already
   * expanded. A `footer` of your own that follows the collapsed state keeps showing its collapsed
   * form: it reads your state, not the hover.
   */
  expandOnHover?: SidebarExpandOnHover;
  /** Footer content (sticks to bottom — e.g. user profile + collapse btn). */
  footer?: ReactNode;
  /**
   * The line above the footer and the collapse button: `full` (default), `inset` (20 px in from
   * each edge) or `none`.
   */
  footerDivider?: SidebarFooterDivider;
  /** How the active row is drawn: `tint` (default) or `solid` (filled with the accent). */
  activeStyle?: SidebarActiveStyle;
  /**
   * How far the rows sit from the sidebar's edges, with the logo, the section titles and the
   * footer following them: `default` (20 px) or `tight` (10 px). It sets
   * `--cosmos-sidebar-gutter` on the sidebar; an app can set that variable itself for another
   * distance. The collapsed rail and the compact one keep their own. Inside a Shell, the Shell's
   * `sidebarGutter` is the default (`tight` in a floating Shell).
   */
  gutter?: SidebarGutter;
  /**
   * A strip along the sidebar's end edge that collapses or expands it on click, and shows a line
   * under the pointer: a large target next to the toggles, for the mouse (the keyboard has the
   * toggles). Default `false`, `true` in a floating Shell. Not on the compact rail nor in the
   * Shell's drawer. Outside a Shell it moves the sidebar's own state and calls
   * `onCollapsedChange`.
   */
  edgeToggle?: boolean;
  /**
   * Renders a collapse button (a `SidebarToggle`, `panel` variant) at the very
   * bottom, under `footer`, and fires with the next state when it is clicked;
   * an uncontrolled sidebar also moves to it. Leave it out when the control
   * lives elsewhere (e.g. the Topbar hamburger). Inside a Shell, the button
   * also shows with `collapseControl="sidebar"`, moves the Shell, and this is
   * called after it.
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Optional className override. */
  className?: string;
};

/**
 * Sidebar — navigation panel at the start of the line.
 *
 * Compound component: brand + items + groups + sub-menus + footer slot.
 * Smooth width transition when `collapsed` toggles. The `collapsed` state
 * is automatically threaded to every subcomponent via React context, so
 * children don't need to receive it as a prop.
 *
 * Expanded, the width follows the rows: from `width` up to `maxWidth`, it grows to fit the widest
 * visible label, in a sub-menu that unfolds or a row that changes, and narrows back when that row
 * goes. Past `maxWidth` a label ends in an ellipsis and its row shows the full label in a tooltip.
 *
 * With `expandOnHover` the collapsed sidebar opens while the pointer rests on it or focus is
 * inside, above the page (`overlay`) or pushing it (`push`), without touching the collapsed state.
 *
 * Inside a `Shell`, the collapsed state is the Shell's: every SidebarToggle
 * in the Shell (the Topbar's, this footer's, a custom header's) moves it. Below `lg` the Shell
 * shows the sidebar as a drawer: it then fills the panel, is always expanded, and `Sidebar.Brand`
 * gets a close button.
 */
const SidebarRoot = ({
  variant = 'default',
  collapsed: collapsedProp,
  defaultCollapsed = false,
  width = 264,
  maxWidth = 320,
  collapsedWidth = 72,
  children,
  expandOnHover = false,
  footer,
  footerDivider = 'full',
  activeStyle = 'tint',
  gutter: gutterProp,
  edgeToggle: edgeToggleProp,
  onCollapsedChange,
  className,
}: SidebarProps) => {
  const [ownCollapsed, setOwnCollapsed] = useControllableState({
    value: collapsedProp,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
    name: 'Sidebar.collapsed',
  });
  // In a Shell, the state is the Shell's, and the nav carries the id its SidebarToggles
  // name in `aria-controls`.
  const shell = useShell();
  // In the Shell's drawer the sidebar is always expanded, whatever the desktop state.
  const inDrawer = shell?.isMobile === true;
  // The compact rail has one width: no collapsed state, no hover expansion, no toggle.
  const compact = variant === 'compact' && !inDrawer;
  const collapsed = inDrawer || compact ? false : shell ? shell.collapsed : ownCollapsed;
  const floating = shell?.variant === 'floating' && !inDrawer;
  const gutter = gutterProp ?? shell?.sidebarGutter ?? 'default';
  const edgeToggle = (edgeToggleProp ?? floating) && !inDrawer && !compact;
  const toggleCollapsed = () =>
    shell ? shell.setCollapsed(!shell.collapsed) : setOwnCollapsed(!ownCollapsed);
  const ownNavId = useId();
  const navId = shell ? shell.navId : ownNavId;
  // The drawer has no bottom toggle: the Topbar hamburger and the close button do the job.
  const showToggle =
    !inDrawer &&
    !compact &&
    (onCollapsedChange !== undefined || shell?.collapseControl === 'sidebar');
  // A collapsed sidebar the pointer rests on, or keyboard focus is in, shows in its expanded form
  // (`expandOnHover`). Only what the rows draw changes: `collapsed` stays the state, and the toggles
  // keep reading it.
  const hover = useExpandOnHover(expandOnHover !== false && collapsed && !inDrawer);
  // Joins the stack of overlays while open, so Escape reaches a popover or tooltip inside it first.
  const layer = useOverlayLayer(hover.expanded, hover.dismiss);
  const rail = collapsed && !hover.expanded;
  // The width follows the rows when expanded: collapsed there are no labels, and in the drawer the
  // panel sets the width.
  const navRef = useRef<HTMLElement>(null);
  const fit = useContentWidth(navRef, {
    min: width,
    max: maxWidth,
    enabled: !rail && !inDrawer && !compact,
  });
  const context: SidebarContextValue = {
    collapsed: rail,
    compact,
    inDrawer,
    inset: rail || compact ? 'tight' : 'wide',
    activeStyle,
    truncated: fit.truncated,
  };
  const overlay = expandOnHover === 'overlay' && !inDrawer && !compact;
  const nav = (
    <nav
      ref={navRef}
      id={navId}
      aria-label="Main navigation"
      style={{
        ...(inDrawer ? {} : { width: compact ? COMPACT_WIDTH : rail ? collapsedWidth : fit.width }),
        ...(gutter === 'tight'
          ? ({ '--cosmos-sidebar-gutter': TIGHT_GUTTER } as CSSProperties)
          : {}),
      }}
      className={clsx(
        'relative flex h-full flex-col overflow-hidden bg-[var(--color-bg-panel)]',
        // The drawer panel draws the edge and the shadow, and sets the width. Floating, the
        // sidebar is a card of its own.
        inDrawer
          ? 'w-full'
          : floating
            ? 'rounded-xl border border-[var(--color-border)] shadow-sm'
            : 'border-e border-[var(--color-border)]',
        // Not before the first frames: the width measured at mount shows at once.
        fit.animated &&
          clsx(
            overlay ? 'transition-[width,box-shadow]' : 'transition-[width]',
            'duration-300 ease-in-out'
          ),
        // Over the page, out of the layout: the wrapper below keeps the rail's place.
        overlay && 'inset-s-0 absolute inset-y-0',
        overlay && hover.expanded && 'shadow-2xl',
        className
      )}
      {...hover.props}
    >
      <div className="flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
      {edgeToggle && (
        // Mouse only: hidden from assistive technology and out of the tab order, since the
        // toggles already do the job by keyboard. The line shows under the pointer.
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          data-sidebar-edge=""
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={clsx(
            'group/edge absolute inset-y-0 end-0 z-10 w-2',
            collapsed
              ? 'cursor-e-resize rtl:cursor-w-resize'
              : 'cursor-w-resize rtl:cursor-e-resize'
          )}
        >
          <span className="group-hover/edge:bg-brand-500 absolute inset-y-3 end-0 w-0.5 rounded-full bg-transparent transition-colors" />
        </button>
      )}
      {footer && (
        <div
          className={clsx(
            'shrink-0 overflow-hidden',
            compact ? 'p-2' : rail ? 'p-3' : 'py-3',
            FOOTER_DIVIDER[footerDivider]
          )}
          // Expanded, the footer's rows (8 px in) line up with the others, at the gutter.
          style={compact || rail ? undefined : { paddingInline: `max(0px, calc(${GUTTER} - 8px))` }}
        >
          <SidebarContext.Provider
            value={{ ...context, inset: rail || compact ? 'none' : 'tight' }}
          >
            {footer}
          </SidebarContext.Provider>
        </div>
      )}
      {showToggle && (
        <div className={clsx('shrink-0 px-2 py-2', FOOTER_DIVIDER[footerDivider])}>
          {shell ? (
            <SidebarToggle variant="panel" onCollapsedChange={onCollapsedChange} />
          ) : (
            <SidebarToggle
              variant="panel"
              collapsed={collapsed}
              onCollapsedChange={setOwnCollapsed}
              controls={navId}
            />
          )}
        </div>
      )}
    </nav>
  );
  return (
    <SidebarContext.Provider value={context}>
      <OverlayLayerProvider value={layer}>
        {overlay ? (
          // What the layout sees: the width of the sidebar as the toggles left it, hover or not.
          // Above the sticky headers of the page (z-10, z-20), under the fixed buttons and banners
          // (z-40) and the modal layer (z-50: Modal, Drawer).
          <div
            className={clsx(
              'relative z-30 h-full shrink-0',
              fit.animated && 'transition-[width] duration-300 ease-in-out'
            )}
            style={{ width: collapsed ? collapsedWidth : fit.width }}
          >
            {nav}
          </div>
        ) : (
          nav
        )}
      </OverlayLayerProvider>
    </SidebarContext.Provider>
  );
};

// ─── Sidebar.Brand ────────────────────────────────────────────────────────────
// Header row at the top of the sidebar — logo + product name + optional subtitle.
// Animates with the collapse state: in collapsed mode only the logo is visible.

export type SidebarBrandProps = {
  /** Logo node — typically a small icon, lucide component, or img. */
  logo?: ReactNode;
  /** Product / app name. */
  title: string;
  /** Optional smaller subtitle below the title. */
  subtitle?: string;
  /** href to navigate when the brand is clicked. */
  href?: string;
  /** click handler (alternative to href). */
  onClick?: () => void;
  /** Override the inherited collapsed state (defaults to `useContext`). */
  collapsed?: boolean;
  /**
   * Draws a line under the brand, at the height of the Topbar's bottom line. Default `false`: the
   * Topbar's line stops at the sidebar's edge.
   */
  divider?: boolean;
  /**
   * The square behind `logo`: `tint` (default, the accent at 10 %), `solid` (filled with the
   * accent, the logo in white) or `none` (no square: the logo as given).
   */
  logoStyle?: SidebarLogoStyle;
  /**
   * Ref to the brand's root: an `<a>` when `href` is set, a `<button>` with
   * `onClick`, otherwise a plain `<div>` (not focusable).
   */
  ref?: Ref<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>;
};

export type SidebarLogoStyle = 'tint' | 'solid' | 'none';

const LOGO_SQUARE: Record<Exclude<SidebarLogoStyle, 'none'>, string> = {
  tint: 'bg-brand-500/10 text-brand-500',
  solid: 'bg-brand-500 text-white',
};

const SidebarBrand = ({
  logo,
  title,
  subtitle,
  href,
  onClick,
  collapsed: collapsedProp,
  divider = false,
  logoStyle = 'tint',
  ref,
}: SidebarBrandProps) => {
  const ctx = useContext(SidebarContext);
  // The compact rail shows the logo alone, like the collapsed one.
  const compact = ctx.compact && collapsedProp === undefined;
  const collapsed = useSidebarCollapsed(collapsedProp) || compact;
  const shell = useShell();
  // In the Shell's drawer the brand row also holds the close button, a sibling of the brand's own
  // link or button (which can't contain one).
  const inDrawer = ctx.inDrawer && shell !== null;
  const inner = (
    <>
      {logo &&
        (logoStyle === 'none' ? (
          <span className="flex shrink-0 items-center">{logo}</span>
        ) : (
          <div
            className={clsx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              LOGO_SQUARE[logoStyle]
            )}
          >
            {logo}
          </div>
        ))}
      <div
        className={clsx(
          'min-w-0 overflow-hidden text-start transition-[max-width,opacity] duration-300',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'
        )}
      >
        <p className="truncate text-base font-bold tracking-tight text-[var(--color-text-primary)]">
          {title}
        </p>
        {subtitle && <p className="truncate text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>
    </>
  );

  const baseClass = clsx(
    'focus-visible:focus-indicator flex h-[72px] items-center focus-visible:ring-inset',
    // The logo alone has the row to itself: centred, with no gap for the hidden title.
    compact ? 'justify-center' : collapsed ? 'gap-3 px-5' : 'gap-3',
    inDrawer
      ? 'min-w-0 flex-1'
      : clsx('shrink-0', divider && 'border-b border-[var(--color-border)]')
  );
  // Expanded, the logo is centred on the column of the row icons, wherever the gutter puts it.
  const brandStyle =
    compact || collapsed ? undefined : { paddingInline: `calc(${GUTTER} + 2px) ${GUTTER}` };
  // The marker sits on the outermost element of the row, and only under a line: a
  // `Sidebar.Section` with its own line right below then leaves it out.
  const marker = inDrawer || !divider ? undefined : '';

  let brand;
  if (href) {
    brand = (
      <AppLink
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={baseClass}
        style={brandStyle}
        data-sidebar-brand={marker}
        data-sidebar-head=""
      >
        {inner}
      </AppLink>
    );
  } else if (onClick) {
    brand = (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={clsx(baseClass, 'w-full text-start')}
        style={brandStyle}
        data-sidebar-brand={marker}
        data-sidebar-head=""
      >
        {inner}
      </button>
    );
  } else {
    brand = (
      <div
        ref={ref as Ref<HTMLDivElement>}
        className={baseClass}
        style={brandStyle}
        data-sidebar-brand={marker}
        data-sidebar-head=""
      >
        {inner}
      </div>
    );
  }
  if (!inDrawer || !shell) return brand;

  return (
    <div
      className={clsx(
        'flex h-[72px] shrink-0 items-center pe-3',
        divider && 'border-b border-[var(--color-border)]'
      )}
      data-sidebar-brand={divider ? '' : undefined}
      data-sidebar-head=""
    >
      {brand}
      <button
        type="button"
        onClick={() => shell.setOpen(false)}
        aria-label="Close navigation"
        className="focus-visible:focus-indicator flex size-10 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/5"
      >
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
};

// ─── Sidebar.Item ─────────────────────────────────────────────────────────────

export type SidebarItemProps = {
  /**
   * Icon component (lucide-react or any React component accepting className). Drawn at the top
   * level only, where it stays as the collapsed rail's mark (a dot without one); nested rows show
   * their label alone.
   */
  icon?: ComponentType<{ className?: string }>;
  /** Item label. */
  label: string;
  /** Whether the item is active (highlighted). */
  active?: boolean;
  /** Link target — renders an `<a>` if set, otherwise a `<button>`. */
  href?: string;
  /**
   * Click handler (if not using href). In the Shell's drawer, below `lg`, a click on any item
   * also closes the drawer, after this runs.
   */
  onClick?: () => void;
  /** Optional badge (count, "new"…) shown after the label. Hidden when collapsed. */
  badge?: ReactNode;
  /** Override the inherited collapsed state. */
  collapsed?: boolean;
  /**
   * Indentation depth. Defaults to the nesting level: 0 at the top, one more
   * inside each Sidebar.SubMenu.
   */
  depth?: number;
  /** Ref to the item's root: an `<a>` when `href` is set, a `<button>` otherwise. */
  ref?: Ref<HTMLAnchorElement | HTMLButtonElement>;
};

const SidebarItem = ({
  icon: Icon = DotIcon,
  label,
  active = false,
  href,
  onClick,
  badge,
  collapsed: collapsedProp,
  depth: depthProp,
  ref,
}: SidebarItemProps) => {
  const collapsed = useSidebarCollapsed(collapsedProp);
  const contextDepth = useContext(SidebarDepthContext);
  const depth = depthProp ?? contextDepth;
  const labelId = useId();
  const [compactLabel, setCompactLabel] = useState<HTMLSpanElement | null>(null);
  const clamped = useClamped(compactLabel);
  useReportActive(active);
  // The row is a new element when the sidebar collapses or expands: focus follows it.
  const keepFocus = useKeepFocus();
  const rowRef = useMemo(() => mergeRefs(ref, keepFocus), [ref, keepFocus]);
  // Picking an item in the Shell's drawer navigates: the drawer closes behind it.
  const shell = useShell();
  const ctx = useContext(SidebarContext);
  const closeDrawer = ctx.inDrawer && shell ? () => shell.setOpen(false) : undefined;
  const inset = useRowInset(collapsed);
  const geometry = useNestedGeometry(inset);
  // The compact rail stacks the icon over the label; only the top level is there, the nested
  // rows live in the flyout of a sub-menu, which is not compact.
  const compact = ctx.compact && !collapsed && depth === 0;
  const nested = !collapsed && depth > 0;
  const baseClass = clsx(
    'group focus-visible:focus-indicator flex items-center rounded-lg font-medium transition-colors',
    compact
      ? clsx('text-2xs relative flex-col gap-1 py-2 text-center', ROW_INSET[inset].margin)
      : collapsed
        ? RAIL_ROW
        : clsx(
            'mb-1 gap-3',
            nested ? 'px-2.5' : 'px-3',
            level(nested ? depth : 0).py,
            level(nested ? depth : 0).text,
            ROW_INSET[inset].margin
          ),
    active ? ACTIVE_ROW[ctx.activeStyle] : IDLE_ROW
  );
  const style = nested ? geometry.rowStyle(depth, !href) : undefined;

  const content = compact ? (
    <>
      <Icon className="size-5 shrink-0" />
      <CompactLabel label={label} labelRef={setCompactLabel} />
      {badge && <span className="inset-e-1 absolute top-1">{badge}</span>}
    </>
  ) : (
    <>
      {!nested && <Icon className="size-4 shrink-0" />}
      {!collapsed && (
        <>
          <span className="flex-1 truncate" {...fitLabel(labelId)}>
            {label}
          </span>
          {badge && <span className="shrink-0">{badge}</span>}
        </>
      )}
    </>
  );

  // Collapsed, the label is the tooltip's: it shows on hover and on keyboard focus (a native
  // `title` showed on hover only) and names the icon-only row for assistive technology.
  const name = collapsed ? label : undefined;
  const row = href ? (
    <AppLink
      ref={rowRef as Ref<HTMLAnchorElement>}
      href={href}
      onClick={closeDrawer}
      aria-label={name}
      className={baseClass}
      style={style}
      aria-current={active ? 'page' : undefined}
      data-sidebar-item=""
    >
      {content}
    </AppLink>
  ) : (
    <button
      ref={rowRef as Ref<HTMLButtonElement>}
      type="button"
      onClick={() => {
        onClick?.();
        closeDrawer?.();
      }}
      aria-label={name}
      className={clsx(baseClass, !collapsed && ROW_INSET[inset].width, !compact && 'text-start')}
      style={style}
      aria-current={active ? 'page' : undefined}
      data-sidebar-item=""
    >
      {content}
    </button>
  );
  if (compact) return clamped ? <CompactTip label={label}>{row}</CompactTip> : row;
  return collapsed ? (
    <Tooltip content={label} position="end" block>
      {row}
    </Tooltip>
  ) : (
    <LabelTip id={labelId} label={label}>
      {row}
    </LabelTip>
  );
};

// ─── Sidebar.SubMenu ──────────────────────────────────────────────────────────
// Expandable menu: its trigger toggles a list of nested rows. Sub-menus nest (three levels read
// best, a fourth works): nested rows show their label alone, smaller at each level, with a guide
// line on their start side. A sub-menu with a page of its own (`href` or `onClick`) splits its row: the
// label opens the page and unfolds the list, a chevron only toggles it. A sub-menu that holds the
// active row turns to the accent; a nested one without a page, which only groups rows, is muted.
// In collapsed mode the trigger is icon-only and opens the whole tree in a panel at its end side.

export type SidebarSubMenuProps = {
  /** Icon component. Drawn at the top level only, like `Sidebar.Item`'s. */
  icon?: ComponentType<{ className?: string }>;
  label: string;
  /**
   * The sub-menu's own page. The label then opens it, and unfolds the list, while a separate
   * chevron only toggles the list. Without `href` or `onClick` the whole row toggles.
   */
  href?: string;
  /** Click handler of the label, instead of `href`. It also unfolds the list. */
  onClick?: () => void;
  /**
   * Open state of the nested list, when controlled. The panel the collapsed
   * sidebar opens beside the icon keeps its own state.
   */
  open?: boolean;
  /** Initial open state, when uncontrolled. Default `false`, or `true` when `active`. */
  defaultOpen?: boolean;
  /** Called with the open state to move to. */
  onOpenChange?: (open: boolean) => void;
  /** Override the inherited collapsed state. */
  collapsed?: boolean;
  /**
   * Highlights the row with the active pill: for a sub-menu whose own page is open. A sub-menu
   * holding an active row shows it without this, with the accent on its text. In the collapsed
   * rail the nested rows aren't mounted: pass `active` there to mark the sub-menu.
   */
  active?: boolean;
  /** Optional badge shown after the label (hidden when collapsed). */
  badge?: ReactNode;
  /** Nested items: Sidebar.Item, or another Sidebar.SubMenu for a deeper level. */
  children: ReactNode;
};

const SidebarSubMenu = ({
  icon: Icon = DotIcon,
  label,
  href,
  onClick,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  collapsed: collapsedProp,
  active = false,
  badge,
  children,
}: SidebarSubMenuProps) => {
  const collapsed = useSidebarCollapsed(collapsedProp);
  const ctx = useContext(SidebarContext);
  const shell = useShell();
  const inset = useRowInset(collapsed);
  const geometry = useNestedGeometry(inset);
  const depth = useContext(SidebarDepthContext);
  const listId = useId();
  const labelId = useId();
  // The trigger is a new element when the sidebar collapses or expands: focus follows it.
  const triggerRef = useKeepFocus();
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen || active,
    onChange: onOpenChange,
    name: 'Sidebar.SubMenu.open',
  });
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [compactLabel, setCompactLabel] = useState<HTMLSpanElement | null>(null);
  const clamped = useClamped(compactLabel);
  // The rows below that say they are active, by key.
  const [activeRows, setActiveRows] = useState<ReadonlySet<string>>(() => new Set());
  const report = useCallback<ReportActive>((key, on) => {
    setActiveRows((rows) => {
      if (rows.has(key) === on) return rows;
      const next = new Set(rows);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);
  const inTrail = activeRows.size > 0;
  useReportActive(active || inTrail);

  // Collapsed mode: an icon-only trigger opening the tree in a panel at its
  // end side, rendered expanded. Picking a row closes it. The compact rail does the same
  // from a trigger that stacks the label under the icon, at the top level.
  const compact = ctx.compact && !collapsed && depth === 0;
  if (collapsed || compact) {
    const trigger = (
      <Popover.Trigger
        ref={triggerRef}
        // Compact: the label is the name, and a tooltip carries it whole only when cut.
        title={compact ? undefined : label}
        aria-label={compact ? undefined : label}
        className={clsx(
          'group focus-visible:focus-indicator flex items-center rounded-lg font-medium transition-colors',
          compact ? 'text-2xs py-row-8 flex-col gap-1 text-center' : RAIL_ROW,
          compact && ROW_INSET[inset].margin,
          compact && ROW_INSET[inset].width,
          active ? ACTIVE_ROW[ctx.activeStyle] : IDLE_ROW
        )}
      >
        <Icon className={clsx('shrink-0', compact ? 'size-5' : 'size-4')} />
        {compact && <CompactLabel label={label} labelRef={setCompactLabel} />}
      </Popover.Trigger>
    );
    return (
      <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
        {compact && clamped ? <CompactTip label={label}>{trigger}</CompactTip> : trigger}
        <Popover.Content position="end" aria-label={label} width="w-64" padding="p-2">
          {/* The panel has no top-level row: its rows are the first nested level, from its edge. */}
          <SidebarContext.Provider
            value={{
              collapsed: false,
              compact: false,
              inDrawer: false,
              inset: 'tight',
              activeStyle: ctx.activeStyle,
              labelOrigin: 8 + NESTED_PADDING,
            }}
          >
            <SidebarDepthContext.Provider value={1}>
              <p className="px-3 pt-1 pb-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                {label}
              </p>
              <div
                className="-mx-2"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('[data-sidebar-item]'))
                    setFlyoutOpen(false);
                }}
              >
                {children}
              </div>
            </SidebarDepthContext.Provider>
          </SidebarContext.Provider>
        </Popover.Content>
      </Popover>
    );
  }

  const nested = depth > 0;
  const ownPage = href !== undefined || onClick !== undefined;
  const { text, py } = level(depth);
  const padding = nested ? 'px-2.5' : 'px-3';
  const tone = active
    ? ACTIVE_ROW[ctx.activeStyle]
    : inTrail
      ? TRAIL_ROW
      : nested && !ownPage
        ? GROUPING_ROW
        : IDLE_ROW;
  const row = clsx(
    'group mb-1 flex items-center rounded-lg font-medium transition-colors',
    text,
    ROW_INSET[inset].margin,
    tone
  );
  const toggle = () => setOpen((v) => !v);
  const content = (
    <>
      {!nested && <Icon className="size-4 shrink-0" />}
      <span className="flex-1 truncate" {...fitLabel(labelId)}>
        {label}
      </span>
      {badge && <span className="shrink-0">{badge}</span>}
    </>
  );
  const chevron = (
    <ChevronRight
      aria-hidden
      className={clsx(
        'h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform',
        // Closed it points to the end of the line (turned around where that is the left); open it
        // points down in both directions.
        open ? 'rotate-90' : 'rtl:rotate-180'
      )}
    />
  );

  let trigger;
  if (ownPage) {
    // The label opens the sub-menu's page and its list; picking it in the drawer closes the drawer.
    const go = () => {
      setOpen(true);
      onClick?.();
      if (ctx.inDrawer && shell) shell.setOpen(false);
    };
    const labelClass = clsx(
      'focus-visible:focus-indicator flex min-w-0 flex-1 items-center gap-3 rounded-lg text-start',
      py,
      padding
    );
    trigger = (
      <div className={row} style={nested ? geometry.rowStyle(depth, false) : undefined}>
        {href ? (
          <AppLink
            ref={triggerRef}
            href={href}
            onClick={go}
            className={labelClass}
            aria-current={active ? 'page' : undefined}
            data-sidebar-item=""
          >
            {content}
          </AppLink>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            onClick={go}
            className={labelClass}
            aria-current={active ? 'page' : undefined}
            data-sidebar-item=""
          >
            {content}
          </button>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`${label} sub-menu`}
          className="focus-visible:focus-indicator me-1 flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5"
        >
          {chevron}
        </button>
      </div>
    );
  } else {
    trigger = (
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={listId}
        className={clsx(
          row,
          'focus-visible:focus-indicator gap-3 text-start',
          py,
          padding,
          !nested && ROW_INSET[inset].width
        )}
        style={nested ? geometry.rowStyle(depth, true) : undefined}
      >
        {content}
        {chevron}
      </button>
    );
  }

  // The list stays mounted while closed, so its active row still marks the trail.
  return (
    <div>
      <LabelTip id={labelId} label={label}>
        {trigger}
      </LabelTip>
      <div id={listId} hidden={!open} className="relative">
        <span
          aria-hidden
          className="absolute top-0 bottom-0 w-px bg-[var(--color-border)]"
          style={{ insetInlineStart: geometry.guideStart(depth) }}
        />
        <SidebarDepthContext.Provider value={depth + 1}>
          <TrailContext.Provider value={report}>{children}</TrailContext.Provider>
        </SidebarDepthContext.Provider>
      </div>
    </div>
  );
};

// ─── Sidebar.Group ────────────────────────────────────────────────────────────
// Collapsible labelled group — header with chevron + items list. In collapsed
// mode, the header is hidden and children render flat.

export type SidebarGroupProps = {
  label: string;
  /** Open state of the group, when controlled. */
  open?: boolean;
  /** Initial open state, when uncontrolled. Default `true`. */
  defaultOpen?: boolean;
  /** Called with the open state to move to. */
  onOpenChange?: (open: boolean) => void;
  collapsed?: boolean;
  children: ReactNode;
};

const SidebarGroup = ({
  label,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  collapsed: collapsedProp,
  children,
}: SidebarGroupProps) => {
  // The compact rail has no room for a header either: the rows run on, as collapsed.
  const compact = useContext(SidebarContext).compact;
  const collapsed = useSidebarCollapsed(collapsedProp) || compact;
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Sidebar.Group.open',
  });

  if (collapsed) {
    return <div className="my-1">{children}</div>;
  }

  // The header reads like a section title, its chevron on the column of the row icons.
  return (
    <div className="pt-[18px] [[data-sidebar-head]+&]:pt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={clsx(
          'focus-visible:focus-indicator py-row-4 flex items-center gap-2 rounded-lg px-3 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
          ROW_INSET.wide.margin,
          ROW_INSET.wide.width
        )}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3 rtl:-scale-x-100" />
        )}
        {label}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// ─── Sidebar.Section ──────────────────────────────────────────────────────────
// A titled block of rows, set apart by space (16 px) rather than a line. The title hides when the
// sidebar is collapsed, where a "···" mark keeps the blocks apart. With `divider`, a line opens the
// section instead and stays alone when collapsed. Right under a Brand that draws its own line, a
// divided section leaves its line out: two lines 8px apart would sit there otherwise.

export type SidebarSectionProps = {
  label?: string;
  /**
   * Opens the section with a line, which stays alone when the sidebar is collapsed. Default
   * `false`: space sets the section apart, and a "···" mark when collapsed.
   */
  divider?: boolean;
  collapsed?: boolean;
  children: ReactNode;
};

// The title of a block: quiet, as the label the reader finds the block by, and on the column of the
// row icons.
const SectionTitle = ({ label, className }: { label: string; className: string }) => (
  <p
    className={clsx('text-xs font-medium text-[var(--color-text-muted)]', className)}
    style={{ paddingInline: `calc(${GUTTER} + ${ROW_PADDING}px) ${GUTTER}` }}
  >
    {label}
  </p>
);

const SidebarSection = ({
  label,
  divider = false,
  collapsed: collapsedProp,
  children,
}: SidebarSectionProps) => {
  // The compact rail has no room for a title: a "···" mark keeps the blocks apart, as collapsed.
  const compact = useContext(SidebarContext).compact;
  const collapsed = useSidebarCollapsed(collapsedProp) || compact;
  if (divider) {
    return (
      <div className="my-2 border-t border-[var(--color-border)] pt-2 [[data-sidebar-brand]+&]:mt-0 [[data-sidebar-brand]+&]:border-t-0">
        {label && !collapsed && <SectionTitle label={label} className="py-1.5" />}
        <div>{children}</div>
      </div>
    );
  }
  // Rows sit close inside a block and blocks stand apart: 22 px above a title (18 px and the 4 px
  // under the row above), 6 px under it. Collapsed, a "···" mark (40 px) takes the place of the
  // title and the space above it (40 px), so rows don't move. The mark stands for a title between
  // two blocks: a section without a title shows none (its 18 px of space stay), and the first
  // section under the brand keeps its place empty, with nothing above it to set apart. Right under
  // the brand, whose own height is the space, the title and the mark both lose 14 px.
  const titled = Boolean(label);
  return (
    <div
      className={
        collapsed && titled
          ? '[[data-sidebar-head]+&]:-mt-3.5'
          : 'pt-[18px] [[data-sidebar-head]+&]:pt-1'
      }
    >
      {collapsed
        ? titled && (
            <div
              data-sidebar-mark=""
              className="flex justify-center py-2 text-[var(--color-text-muted)] [[data-sidebar-head]+div>&]:invisible"
              aria-hidden
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="6" cy="12" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="18" cy="12" r="1.75" />
              </svg>
            </div>
          )
        : label && <SectionTitle label={label} className="mb-1.5" />}
      <div>{children}</div>
    </div>
  );
};

// ─── Compound exports ─────────────────────────────────────────────────────────

type SidebarComponent = typeof SidebarRoot & {
  Brand: typeof SidebarBrand;
  Item: typeof SidebarItem;
  Group: typeof SidebarGroup;
  Section: typeof SidebarSection;
  SubMenu: typeof SidebarSubMenu;
};

export const Sidebar = SidebarRoot as SidebarComponent;
Sidebar.Brand = SidebarBrand;
Sidebar.Item = SidebarItem;
Sidebar.Group = SidebarGroup;
Sidebar.Section = SidebarSection;
Sidebar.SubMenu = SidebarSubMenu;
