import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef, CSSProperties, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useAnchorPosition, type AnchorPlacement } from '../hooks/useAnchorPosition';
import { usePortalFocus, type PortalFocusOptions } from './overlayA11y';

// Internal to the package: the floating panel shared by Popover, UserMenu,
// NotificationsPanel and DatePicker. Not exported from the barrel.

export type FloatingPanelProps = Omit<ComponentPropsWithoutRef<'div'>, 'style'> & {
  /**
   * Shown while true. Keep the component mounted while closed: the focus handling tells a
   * panel open on mount (which doesn't take focus) from one opened later.
   */
  open: boolean;
  /** Closes the panel: a click outside it, Escape, focus leaving it. */
  onClose: () => void;
  /**
   * The control that opens the panel. Focus goes back to it on close, and the panel is placed
   * against it unless `anchorRef` says otherwise.
   */
  triggerRef: RefObject<HTMLElement | null>;
  /** What the panel is placed against, when it isn't the trigger itself. */
  anchorRef?: RefObject<HTMLElement | null>;
  placement: AnchorPlacement;
  /** Element to focus on open. Default: the first focusable element, else the panel. */
  initialFocus?: PortalFocusOptions['initialFocus'];
  /** Merged over the anchoring style. */
  style?: CSSProperties;
};

/**
 * A non-modal panel portaled to the end of `<body>`, so no `overflow: hidden` ancestor clips
 * it, kept next to its anchor in fixed position (`useAnchorPosition`), with the focus handling
 * of `usePortalFocus`. Renders nothing while closed or before the anchor is measured.
 */
export function FloatingPanel({
  open,
  onClose,
  triggerRef,
  anchorRef = triggerRef,
  placement,
  initialFocus,
  style,
  className,
  ...rest
}: FloatingPanelProps) {
  const anchored = useAnchorPosition(anchorRef, open, placement);
  const panelRef = usePortalFocus<HTMLDivElement>({ open, onClose, triggerRef, initialFocus });
  if (!open || !anchored) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        {...rest}
        ref={panelRef}
        style={{ ...anchored, ...style }}
        className={clsx('fixed z-[9999]', className)}
      />
    </>,
    document.body
  );
}
