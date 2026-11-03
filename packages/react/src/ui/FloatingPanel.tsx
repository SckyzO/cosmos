import { clsx } from 'clsx';
import {
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  useAnchorPosition,
  type AnchorPlacement,
  type AnchorSide,
} from '../hooks/useAnchorPosition';
import type { Direction } from '../hooks/direction';
import { useExitTransition } from '../hooks/useExitTransition';
import { HoldWhileClosed } from './HoldWhileClosed';
import { mergeRefs } from './mergeRefs';
import {
  OverlayLayerProvider,
  useOutsideClick,
  useOverlayLayer,
  usePortalContainer,
  usePortalFocus,
  type PortalFocusOptions,
} from './overlayA11y';
import { panelOrigin } from './panelOrigin';

// Internal to the package: the floating panel of Popover, UserMenu,
// NotificationsPanel, DatePicker, Dropdown, Combobox, the table column filter
// and RefreshButton. Not exported from the barrel.

/**
 * The z-index scale of floating panels. A panel sits above every page layer and above the
 * modal layer (`z-50`: Modal, Drawer); one opened in a modal renders inside it, above its
 * content. A tooltip sits one step higher, so it shows over the panel it was opened from.
 * Panels that open from one another stack in the order they open, at the same level.
 */
export const FLOATING_PANEL_Z = 'z-[9999]';
export const TOOLTIP_Z = 'z-[10000]';

export type FloatingPanelProps = Omit<ComponentPropsWithoutRef<'div'>, 'style' | 'children'> & {
  /**
   * The content, or a function of the side the panel opened on (as the screen sees it) and the
   * anchor's direction, for a part that points at the anchor (an arrow): the panel flips to the
   * other side when the viewport cuts it.
   */
  children?: ReactNode | ((side: AnchorSide, direction: Direction) => ReactNode);
  /**
   * Shown while true. Keep the component mounted while closed: the focus handling tells a
   * panel open on mount (which doesn't take focus) from one opened later.
   */
  open: boolean;
  /**
   * Closes the panel: Escape while it is the top overlay (`useOverlayLayer`), a mousedown
   * outside it, and unless `moveFocus` is off, focus leaving it.
   */
  onClose: () => void;
  /**
   * The control that opens the panel. Focus goes back to it on close, a mousedown on it is
   * not outside, and the panel is placed against it unless `anchorRef` says otherwise.
   */
  triggerRef: RefObject<HTMLElement | null>;
  /** What the panel is placed against, when it isn't the trigger itself. Not outside either. */
  anchorRef?: RefObject<HTMLElement | null>;
  placement: AnchorPlacement;
  /**
   * Focus moves into the panel on open and back to the trigger on close (`usePortalFocus`).
   * Default true; false for a panel whose trigger keeps focus, a combobox's listbox, which then
   * handles Tab itself.
   */
  moveFocus?: boolean;
  /** Element to focus on open. Default: the first focusable element, else the panel. */
  initialFocus?: PortalFocusOptions['initialFocus'];
  /** Merged over the anchoring style. */
  style?: CSSProperties;
};

/**
 * A non-modal panel portaled to the end of `<body>`, so no `overflow: hidden` ancestor clips
 * it, or into the modal dialog it was opened in (`usePortalContainer`), where `aria-modal`
 * keeps it reachable. Kept next to its anchor in fixed position (`useAnchorPosition`), with
 * the focus handling of `usePortalFocus`, the outside click of `useOutsideClick` and a place
 * in the overlay stack (`useOverlayLayer`). Renders nothing while closed, once its exit has
 * played, or before the anchor is measured. It opens where `placement` says, flipped to the other
 * side or moved along the anchor when the viewport would cut it there.
 *
 * It fades in and scales up from 95% out of the corner of the panel nearest the trigger (the
 * side it opened on and its alignment, mirrored in right to left), in 120 ms easing out, and
 * back into it in 80 ms easing in. Once closed it is out of the overlay stack, focus is back on
 * the trigger, and the panel is `inert` and takes no pointer events while it fades out; it is
 * removed at once when nothing animates (durations at 0).
 */
export function FloatingPanel({
  open,
  onClose,
  triggerRef,
  anchorRef = triggerRef,
  placement,
  moveFocus = true,
  initialFocus,
  style,
  className,
  children,
  ...rest
}: FloatingPanelProps) {
  const container = usePortalContainer();
  const {
    style: anchored,
    side,
    direction,
    panelRef,
  } = useAnchorPosition(anchorRef, open, placement, container);
  const { ref: focusRef, onFocusCapture } = usePortalFocus<HTMLDivElement>({
    open: open && moveFocus,
    onClose,
    triggerRef,
    initialFocus,
  });
  // The element the exit waits on, kept next to the two setters: all three are stable, so the
  // merged ref is too.
  const exitRef = useRef<HTMLDivElement | null>(null);
  const ref = useMemo(() => mergeRefs(focusRef, panelRef, exitRef), [focusRef, panelRef]);
  const outsideProps = useOutsideClick<HTMLDivElement>({
    open,
    onOutsideClick: onClose,
    insideRefs: [triggerRef, anchorRef],
  });
  const layer = useOverlayLayer(open, onClose);
  // Stays mounted while it fades out, once `open` is false.
  const present = useExitTransition(open, exitRef);
  if (!present || !anchored || container === null) return null;
  return createPortal(
    <OverlayLayerProvider value={layer}>
      <div
        // The portal takes the panel out of the anchor's subtree, and its `dir` with it.
        dir={direction}
        {...rest}
        ref={ref}
        inert={!open}
        onFocusCapture={onFocusCapture}
        {...outsideProps}
        style={{
          ...anchored,
          transformOrigin: panelOrigin(side, placement.align, direction),
          ...style,
        }}
        className={clsx(
          'fixed transition-[opacity,scale]',
          FLOATING_PANEL_Z,
          // In: from 95% and transparent on the first frame (`starting:`), 120 ms easing out.
          // Out: 80 ms easing in, and out of the pointer's reach for those 80 ms.
          open
            ? 'scale-none opacity-100 duration-(--cosmos-motion-fast) ease-(--cosmos-ease-out) starting:scale-95 starting:opacity-0'
            : 'pointer-events-none scale-95 opacity-0 duration-(--cosmos-motion-exit) ease-(--cosmos-ease-in)',
          className
        )}
      >
        <HoldWhileClosed open={open}>
          {typeof children === 'function' ? children(side, direction) : children}
        </HoldWhileClosed>
      </div>
    </OverlayLayerProvider>,
    container ?? document.body
  );
}
