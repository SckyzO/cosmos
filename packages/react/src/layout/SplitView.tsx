import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { clsx } from 'clsx';
import { exitAnimations } from '../hooks/exitAnimations';
import { useControllableState } from '../hooks/useControllableState';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { mergeRefs } from '../ui/mergeRefs';

export type SplitViewBreakpoint = 'md' | 'lg' | 'xl';

export type SplitViewProps = {
  /** The panes: `SplitView.Pane`, in the order they sit along the line, the first at the start. */
  children: ReactNode;
  /**
   * Below this breakpoint the panes no longer sit side by side: only the active one shows, and
   * the host moves between them with `onActivePaneChange`. `md` (768px), `lg` (1024px) or `xl`
   * (1280px). Default: `lg`.
   */
  collapseBelow?: SplitViewBreakpoint;
  /**
   * Id of the pane shown below the breakpoint, when you control it. The pane that appears takes
   * focus. Unset, SplitView manages it (see `defaultActivePane`).
   */
  activePane?: string;
  /** Pane shown below the breakpoint at first, when uncontrolled. Default: the first pane. */
  defaultActivePane?: string;
  /**
   * Fired when a descendant moves to another pane with `useSplitView().setActivePane`, in both
   * modes, with the id of the pane to show.
   */
  onActivePaneChange?: (id: string) => void;
  className?: string;
};

export type SplitViewPaneProps = {
  /** Pane id, the value of `activePane`. Unique in the view. */
  id: string;
  /** Accessible name of the pane (the `aria-label` of its `<section>`). */
  label: string;
  /**
   * A Tailwind width class (`w-56`, `w-80`, `w-1/3`). Without it the pane takes the remaining
   * space. Below the breakpoint the active pane is full width whatever this says.
   */
  width?: string;
  children?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
};

/**
 * A change of pane below the breakpoint, while it plays. The pane that sits later along the line
 * is the one that moves, over the other: `in` when the view goes to it (it comes in from the end of
 * the line), `out` when the view goes back to an earlier pane (it leaves toward the end). The other
 * stays where it is, under it, until the move is over.
 */
type PaneMove = { from: string; to: string; direction: 'in' | 'out' };

type SplitViewContextValue = {
  activePane: string | undefined;
  setActivePane: (id: string) => void;
  collapseBelow: SplitViewBreakpoint;
  /** Whether the panes are collapsed to one: below the breakpoint. */
  collapsed: boolean;
  move: PaneMove | null;
};

const SplitViewContext = createContext<SplitViewContextValue | null>(null);

// Tailwind reads whole class names, so each breakpoint spells its own.
const BREAKPOINT_REM: Record<SplitViewBreakpoint, number> = { md: 48, lg: 64, xl: 80 };

const ROW_CLASS: Record<SplitViewBreakpoint, string> = {
  md: 'md:divide-x',
  lg: 'lg:divide-x',
  xl: 'xl:divide-x',
};

// Without an `activePane` the first pane is the one shown.
const HIDDEN_CLASS: Record<
  SplitViewBreakpoint,
  { active: string; inactive: string; first: string }
> = {
  md: { active: 'max-md:w-full', inactive: 'max-md:hidden', first: 'max-md:not-first:hidden' },
  lg: { active: 'max-lg:w-full', inactive: 'max-lg:hidden', first: 'max-lg:not-first:hidden' },
  xl: { active: 'max-xl:w-full', inactive: 'max-xl:hidden', first: 'max-xl:not-first:hidden' },
};

// What the pane that moves is dressed with while it does, per breakpoint (Tailwind reads whole
// class names). It stays in the flow, as wide as the view, and takes the place of the pane before
// it with a margin of minus its own width: no positioned ancestor, so the view's own classes are
// left alone. It is opaque, with a soft edge, over `--cosmos-motion-slow`.
const MOVING_CLASS: Record<SplitViewBreakpoint, { over: string; enter: string; leave: string }> = {
  md: {
    over: 'max-md:-ms-[100%] max-md:w-full max-md:bg-[var(--color-bg-panel)] max-md:shadow-lg max-md:transition-[translate] max-md:duration-(--cosmos-motion-slow) max-md:ease-(--cosmos-ease-in-out)',
    // It comes in from the end of the line: the right in left to right, the left in right to left.
    enter:
      'max-md:translate-none max-md:starting:translate-x-full max-md:rtl:starting:-translate-x-full',
    leave: 'max-md:translate-x-full max-md:rtl:-translate-x-full',
  },
  lg: {
    over: 'max-lg:-ms-[100%] max-lg:w-full max-lg:bg-[var(--color-bg-panel)] max-lg:shadow-lg max-lg:transition-[translate] max-lg:duration-(--cosmos-motion-slow) max-lg:ease-(--cosmos-ease-in-out)',
    enter:
      'max-lg:translate-none max-lg:starting:translate-x-full max-lg:rtl:starting:-translate-x-full',
    leave: 'max-lg:translate-x-full max-lg:rtl:-translate-x-full',
  },
  xl: {
    over: 'max-xl:-ms-[100%] max-xl:w-full max-xl:bg-[var(--color-bg-panel)] max-xl:shadow-lg max-xl:transition-[translate] max-xl:duration-(--cosmos-motion-slow) max-xl:ease-(--cosmos-ease-in-out)',
    enter:
      'max-xl:translate-none max-xl:starting:translate-x-full max-xl:rtl:starting:-translate-x-full',
    leave: 'max-xl:translate-x-full max-xl:rtl:-translate-x-full',
  },
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

/**
 * Whether the pane scrolls and holds nothing a keyboard can reach: it then takes the tab stop
 * itself, or its content could not be scrolled without a mouse.
 */
const needsTabStop = (pane: HTMLElement) =>
  pane.scrollHeight > pane.clientHeight && !pane.querySelector(FOCUSABLE);

const Root = ({
  children,
  collapseBelow = 'lg',
  activePane: controlledPane,
  defaultActivePane,
  onActivePaneChange,
  className,
}: SplitViewProps) => {
  const [activePane, setActivePane] = useControllableState<string, [], string | undefined>({
    value: controlledPane,
    defaultValue: defaultActivePane,
    onChange: onActivePaneChange,
    name: 'SplitView.activePane',
  });
  const rootRef = useRef<HTMLDivElement>(null);
  // The desktop layout is the server's, as in Shell.
  const collapsed = !useMediaQuery(`(min-width: ${BREAKPOINT_REM[collapseBelow]}rem)`, true);

  // A change of pane below the breakpoint moves the later of the two over the other. Without an
  // active pane the first one shows. A pane the view cannot place (an id it does not know, a pane
  // wrapped in another element) changes with no movement.
  const order = Children.toArray(children).flatMap((child) =>
    isValidElement<SplitViewPaneProps>(child) && child.type === Pane ? [child.props.id] : []
  );
  const shownPane = activePane ?? order[0];
  const [settled, setSettled] = useState(shownPane);
  const [move, setMove] = useState<PaneMove | null>(null);
  if (shownPane !== settled) {
    setSettled(shownPane);
    const from = order.indexOf(settled ?? '');
    const to = order.indexOf(shownPane ?? '');
    setMove(
      collapsed && from >= 0 && to >= 0
        ? { from: settled!, to: shownPane!, direction: to > from ? 'in' : 'out' }
        : null
    );
  }
  // The move is over when the transition of the pane has played, or at once when none runs (the
  // durations are 0, or the view is wide): the pane that left is then out of the layout. A
  // transition that is cancelled (the view widened, another pane picked) ends the wait too.
  useLayoutEffect(() => {
    if (!move) return;
    const running = exitAnimations(rootRef.current?.getAnimations?.({ subtree: true }) ?? []);
    if (running.length === 0) {
      // Reading the browser's animations is the whole point of the effect: the state follows what
      // is running in the document, once the classes of the move are committed.
      setMove(null);
      return;
    }
    let cancelled = false;
    void Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
      if (!cancelled) setMove(null);
    });
    return () => {
      cancelled = true;
    };
  }, [move]);

  // A pane that appears takes focus, so a keyboard or screen-reader user lands in it. Side by side
  // every pane is already there, and the first render has nothing to announce.
  const shown = useRef(activePane);
  useEffect(() => {
    if (shown.current === activePane) return;
    shown.current = activePane;
    if (!collapsed || activePane === undefined || !rootRef.current) return;
    const pane = Array.from(rootRef.current.children).find(
      (el): el is HTMLElement => el instanceof HTMLElement && el.dataset.splitPane === activePane
    );
    // Without scrolling: the pane comes in from outside the view, which would scroll to it.
    pane?.focus({ preventScroll: true });
  }, [activePane, collapsed]);

  const context = useMemo(
    () => ({ activePane, setActivePane, collapseBelow, collapsed, move }),
    [activePane, setActivePane, collapseBelow, collapsed, move]
  );

  return (
    <SplitViewContext.Provider value={context}>
      <div
        ref={rootRef}
        className={clsx(
          // The frame clips the panes to its corners; each pane scrolls inside it.
          'flex h-full min-h-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]',
          'divide-[var(--color-border)]',
          ROW_CLASS[collapseBelow],
          className
        )}
      >
        {children}
      </div>
    </SplitViewContext.Provider>
  );
};

const Pane = ({ id, label, width, children, className, ref }: SplitViewPaneProps) => {
  const context = useContext(SplitViewContext);
  if (!context) throw new Error('SplitView.Pane must be rendered inside a SplitView');
  const { activePane, collapseBelow, move } = context;
  const hidden = HIDDEN_CLASS[collapseBelow];
  const moving = MOVING_CLASS[collapseBelow];
  // While the view changes pane, the two panes involved are both there: the one that moves lies
  // over the other, which has no use any more (out of reach and of the accessibility tree).
  const role =
    move?.to === id
      ? move.direction === 'in'
        ? 'comes-in'
        : 'revealed'
      : move?.from === id
        ? move.direction === 'in'
          ? 'beneath'
          : 'leaves'
        : undefined;
  const leaving = role === 'beneath' || role === 'leaves';

  const element = useRef<HTMLElement | null>(null);
  const [tabStop, setTabStop] = useState(false);
  useEffect(() => {
    const pane = element.current;
    if (!pane) return;
    const update = () => setTabStop(needsTabStop(pane));
    update();
    // The pane resizes with the window, its content grows and gains or loses buttons.
    const resize = new ResizeObserver(update);
    resize.observe(pane);
    const mutation = new MutationObserver(update);
    mutation.observe(pane, { childList: true, subtree: true, attributes: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  return (
    <section
      ref={mergeRefs(element, ref)}
      aria-label={label}
      data-split-pane={id}
      inert={leaving || undefined}
      aria-hidden={leaving || undefined}
      tabIndex={tabStop ? 0 : -1}
      className={clsx(
        'focus-visible:focus-indicator min-h-0 min-w-0 overflow-y-auto outline-hidden focus-visible:ring-inset',
        width ? ['shrink-0', width] : 'flex-1',
        // Below the breakpoint the shown pane is the whole view: `max-lg:w-full` sorts after the
        // plain width class, and the others leave the layout and the accessibility tree.
        role === 'comes-in'
          ? [moving.over, moving.enter]
          : role === 'leaves'
            ? [moving.over, moving.leave]
            : role === 'revealed' || role === 'beneath'
              ? hidden.active
              : activePane === undefined
                ? [hidden.active, hidden.first]
                : activePane === id
                  ? hidden.active
                  : hidden.inactive,
        className
      )}
    >
      {children}
    </section>
  );
};

/**
 * The active pane and the way to change it, for a component inside a `SplitView` (a list item
 * that opens the detail, a Back button). `setActivePane` fires `onActivePaneChange` and, while
 * uncontrolled, moves the view. `activePane` is `undefined` until a pane is picked when there
 * is no `defaultActivePane`: the first pane shows. Throws outside a SplitView.
 */
export const useSplitView = () => {
  const context = useContext(SplitViewContext);
  if (!context) throw new Error('useSplitView must be used inside a SplitView');
  return { activePane: context.activePane, setActivePane: context.setActivePane };
};

/**
 * SplitView — two or three panes side by side, each scrolling on its own (mail: folders, list,
 * message; chat: conversations, thread; files: tree, list, preview).
 *
 * The view fills the height of its parent (`h-full`): give it a parent with a height, or inside
 * `Shell` the panes scroll and the page does not. Below `collapseBelow` only the active pane
 * shows. The host switches (a list item selects `detail`, a Back button in the detail selects
 * `list`) through `activePane` / `onActivePaneChange`, or from inside with `useSplitView()`
 * while uncontrolled; the pane that appears takes focus.
 *
 *     <SplitView defaultActivePane="list">
 *       <SplitView.Pane id="list" label="Messages" width="w-80">…</SplitView.Pane>
 *       <SplitView.Pane id="detail" label="Message">…</SplitView.Pane>
 *     </SplitView>
 */
export const SplitView = Object.assign(Root, { Pane });
