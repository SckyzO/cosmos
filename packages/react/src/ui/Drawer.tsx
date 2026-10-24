import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useId, useLayoutEffect, useState } from 'react';
import type { ElementType, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  DialogTitleProvider,
  OverlayLayerProvider,
  PortalContainerProvider,
  useDialogTitleId,
  useFocusTrap,
  useOverlayLayer,
} from './overlayA11y';
import { useIsClient } from '../hooks/useIsClient';

export type DrawerSide = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<DrawerSize, string> = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[28rem]',
};

// The close-outside button lives inside the panel (so the focus trap covers
// it) and sits just past its inner edge, on the backdrop.
const OUTSIDE_POSITION: Record<DrawerSide, string> = {
  left: 'left-full',
  right: 'right-full',
};

// The portal needs `document`: render nothing on the server and during
// hydration, then portal once on the client (`useIsClient`).

const SIDE_CLASS: Record<DrawerSide, string> = {
  left: 'left-0 border-r',
  right: 'right-0 border-l',
};

const SIDE_TRANSFORM: Record<DrawerSide, { open: string; closed: string }> = {
  left: { open: 'translate-x-0', closed: '-translate-x-full' },
  right: { open: 'translate-x-0', closed: 'translate-x-full' },
};

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  size?: DrawerSize;
  /**
   * Render a translucent overlay behind the panel that closes on click.
   * Default `true`, which makes the drawer a modal dialog (`aria-modal`).
   * Set `false` for the TUI "Empty" slide-over pattern where the page stays
   * interactive behind the panel; the drawer is then a non-modal dialog.
   */
  withBackdrop?: boolean;
  /**
   * Render the close button on the backdrop (outside the panel), opposite
   * the chosen `side`. Mirrors the TUI "With close button on outside"
   * pattern. When `true`, no close button is rendered inside `Drawer.Header`
   * — handle the X via this overlay button instead.
   * Has no effect when `withBackdrop` is `false`.
   */
  closeOutside?: boolean;
  /**
   * Accessible name for the drawer when it has no `Drawer.Header` title to
   * point at. With a `Drawer.Header title=…` present the drawer is labelled by
   * it automatically and this is unnecessary.
   */
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
};

const Root = ({
  open,
  onClose,
  side = 'right',
  size = 'md',
  withBackdrop = true,
  closeOutside = false,
  ariaLabel,
  className,
  children,
}: DrawerProps) => {
  const titleId = useId();
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const isClient = useIsClient();
  // `hidden` turns true once the slide-out ends, false as soon as it reopens.
  const [hidden, setHidden] = useState(!open);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setHidden(false);
  }

  // Escape closes the drawer, unless an overlay opened above it takes it.
  const layer = useOverlayLayer(open, onClose);

  // The floating panels opened in the drawer render into the panel, once mounted:
  // `aria-modal` tells assistive technology to skip everything outside it. Its
  // `translate` makes it the box their fixed position is relative to, which
  // `useAnchorPosition` accounts for; they slide with it.
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setContainer(isClient ? trapRef.current : null);
  }, [isClient, trapRef]);

  if (!isClient) return null;

  // Portal into document.body so the drawer escapes any clipping ancestor
  // (cards, sidebars, overflow:hidden containers). Without this, calling
  // Drawer from inside e.g. a SectionCard or modal renders it in a
  // confined coordinate space and the panel never appears.
  //
  // A closed drawer stays mounted so it can slide out, but it is `inert`
  // at once and turns `invisible` when the slide ends, so its content leaves
  // the tab order and the accessibility tree.
  return createPortal(
    <>
      {withBackdrop && (
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-gray-500/75 transition-opacity duration-300 dark:bg-gray-900/75',
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={onClose}
          aria-hidden
        />
      )}
      {/* A `div`, not an `aside`: the `complementary` role of an `aside` forbids `dialog`. */}
      <div
        ref={trapRef}
        tabIndex={-1}
        inert={!open}
        aria-hidden={open ? undefined : true}
        onTransitionEnd={(e) => {
          // Tailwind 4 slides the panel with the `translate` property, so that
          // is the one that ends, not `transform`.
          if (!open && e.target === e.currentTarget && e.propertyName === 'translate') {
            setHidden(true);
          }
        }}
        className={clsx(
          'fixed top-0 bottom-0 z-50 flex flex-col border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900',
          SIDE_CLASS[side],
          SIZE_CLASS[size],
          open ? SIDE_TRANSFORM[side].open : SIDE_TRANSFORM[side].closed,
          hidden && 'invisible',
          className
        )}
        role="dialog"
        aria-modal={withBackdrop ? true : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : titleId}
      >
        <OverlayLayerProvider value={layer}>
          <PortalContainerProvider value={container}>
            <DialogTitleProvider value={titleId}>{children}</DialogTitleProvider>
          </PortalContainerProvider>
        </OverlayLayerProvider>
        {withBackdrop && closeOutside && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className={clsx(
              'absolute top-4 flex size-10 items-center justify-center rounded-full text-gray-300 transition-opacity duration-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              OUTSIDE_POSITION[side],
              open ? 'opacity-100' : 'opacity-0'
            )}
          >
            <X className="size-6" aria-hidden />
          </button>
        )}
      </div>
    </>,
    document.body
  );
};

export type DrawerHeaderProps = {
  title: ReactNode;
  icon?: ElementType;
  description?: ReactNode;
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
};

const Header = ({
  title,
  icon: Icon,
  description,
  onClose,
  className,
  children,
}: DrawerHeaderProps) => {
  const titleId = useDialogTitleId();
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <div className="min-w-0">
          <h3
            id={titleId}
            className="truncate text-base font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="focus-visible:focus-indicator rounded text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const Body = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('flex-1 overflow-y-auto p-5', className)}>{children}</div>
);

const Footer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/50',
      className
    )}
  >
    {children}
  </div>
);

export const Drawer = Object.assign(Root, { Header, Body, Footer });
