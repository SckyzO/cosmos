import { clsx } from 'clsx';
import { useId, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useExitTransition } from '../hooks/useExitTransition';
import { Backdrop } from './Backdrop';
import { HoldWhileClosed } from './HoldWhileClosed';
import type { ModalProps, ModalSize } from './Modal';
import {
  DialogTitleProvider,
  OverlayLayerProvider,
  PortalContainerProvider,
  useFocusTrap,
  useOverlayLayer,
} from './overlayA11y';

// Internal to the package: the modal surface shared by Modal, Modal.Alert and
// ConfirmationModal. Not exported from the barrel.

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'h-full w-full max-w-none rounded-none',
};

export type DialogRole = 'dialog' | 'alertdialog';

export type DialogProps = ModalProps & {
  role?: DialogRole;
  /** Id of the element holding the message, for `aria-describedby`. */
  ariaDescribedBy?: string;
};

export const Dialog = ({
  open,
  onClose,
  size = 'md',
  backdrop = 'dim',
  className,
  ariaLabel,
  role = 'dialog',
  ariaDescribedBy,
  children,
}: DialogProps) => {
  const titleId = useId();
  const [hasTitle, setHasTitle] = useState(false);
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  // Escape closes the dialog, unless an overlay opened above it takes it.
  const layer = useOverlayLayer(open, onClose);
  // Once closed, the dialog stays on screen until its exit has played (at once when nothing
  // animates). Focus is already back on what opened it, Escape already goes to the overlay under
  // it, and the page under the fading scrim takes clicks: the leaving dialog is `inert`.
  const mounted = useExitTransition(open, trapRef);

  // Only point `aria-labelledby` at the title once a `Modal.Header` rendered it.
  // A Header comes and goes with `children`, so re-check when they change.
  useLayoutEffect(() => {
    setHasTitle(!!trapRef.current?.querySelector(`[id="${titleId}"]`));
  }, [open, children, titleId, trapRef]);

  // The floating panels opened in the dialog render into its element, once mounted:
  // `aria-modal` tells assistive technology to skip everything outside it. Not
  // transformed and fixed at `inset-0`, it places them as the viewport would. A panel open in
  // the dialog as it closes leaves with it.
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setContainer(mounted ? trapRef.current : null);
  }, [mounted, trapRef]);

  if (!mounted) return null;

  const isFull = size === 'full';

  // Portal into document.body so the dialog escapes any clipping ancestor
  // (cards, sidebars, overflow:hidden containers).
  return createPortal(
    <div
      ref={trapRef}
      tabIndex={-1}
      inert={!open}
      className={clsx(
        'fixed inset-0 z-50 flex',
        !open && 'pointer-events-none',
        isFull ? 'items-stretch justify-stretch' : 'items-center justify-center p-4'
      )}
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={!ariaLabel && hasTitle ? titleId : undefined}
      aria-describedby={ariaDescribedBy}
    >
      <Backdrop variant={backdrop} zIndex={0} open={open} onClick={onClose} />
      <div
        className={clsx(
          'relative w-full overflow-hidden border border-gray-200 bg-white shadow-2xl transition-[opacity,scale] dark:border-gray-800 dark:bg-gray-900',
          // Fades in and scales up from 95%, over the base duration easing out (from the first
          // frame, `starting:`); fades out and shrinks back over the shorter exit, easing in.
          open
            ? 'scale-none opacity-100 duration-(--cosmos-motion-base) ease-(--cosmos-ease-out) starting:scale-95 starting:opacity-0'
            : 'scale-95 opacity-0 duration-(--cosmos-motion-exit-lg) ease-(--cosmos-ease-in)',
          isFull ? '' : 'rounded-2xl',
          SIZE_CLASS[size],
          className
        )}
      >
        <OverlayLayerProvider value={layer}>
          <PortalContainerProvider value={container}>
            <DialogTitleProvider value={titleId}>
              <HoldWhileClosed open={open}>{children}</HoldWhileClosed>
            </DialogTitleProvider>
          </PortalContainerProvider>
        </OverlayLayerProvider>
      </div>
    </div>,
    document.body
  );
};
