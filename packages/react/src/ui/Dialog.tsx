import { clsx } from 'clsx';
import { useId, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

  // Only point `aria-labelledby` at the title once a `Modal.Header` rendered it.
  // A Header comes and goes with `children`, so re-check when they change.
  useLayoutEffect(() => {
    setHasTitle(!!trapRef.current?.querySelector(`[id="${titleId}"]`));
  }, [open, children, titleId, trapRef]);

  // The floating panels opened in the dialog render into its element, once mounted:
  // `aria-modal` tells assistive technology to skip everything outside it. Not
  // transformed and fixed at `inset-0`, it places them as the viewport would.
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setContainer(open ? trapRef.current : null);
  }, [open, trapRef]);

  if (!open) return null;

  const isFull = size === 'full';

  // Portal into document.body so the dialog escapes any clipping ancestor
  // (cards, sidebars, overflow:hidden containers).
  return createPortal(
    <div
      ref={trapRef}
      tabIndex={-1}
      className={clsx(
        'fixed inset-0 z-50 flex',
        isFull ? 'items-stretch justify-stretch' : 'items-center justify-center p-4'
      )}
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={!ariaLabel && hasTitle ? titleId : undefined}
      aria-describedby={ariaDescribedBy}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={clsx(
          'relative w-full overflow-hidden border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900',
          isFull ? '' : 'rounded-2xl',
          SIZE_CLASS[size],
          className
        )}
      >
        <OverlayLayerProvider value={layer}>
          <PortalContainerProvider value={container}>
            <DialogTitleProvider value={titleId}>{children}</DialogTitleProvider>
          </PortalContainerProvider>
        </OverlayLayerProvider>
      </div>
    </div>,
    document.body
  );
};
