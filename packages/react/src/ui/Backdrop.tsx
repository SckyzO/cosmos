import { clsx } from 'clsx';

export type BackdropProps = {
  onClick?: () => void;
  zIndex?: number;
  blur?: boolean;
  className?: string;
};

/**
 * Backdrop — primitive overlay layer (fixed inset-0 with semi-opaque black).
 * Reusable building block for Modal, Drawer, Lightbox, command palette, etc.
 */
export const Backdrop = ({ onClick, zIndex = 30, blur = true, className }: BackdropProps) => (
  <div
    onClick={onClick}
    aria-hidden
    style={{ zIndex }}
    className={clsx('fixed inset-0 bg-black/20', blur && 'backdrop-blur-[1px]', className)}
  />
);
