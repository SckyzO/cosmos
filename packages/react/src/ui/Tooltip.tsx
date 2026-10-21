import { clsx } from 'clsx';
import { HelpCircle } from 'lucide-react';
import { cloneElement, isValidElement, useEffect, useId, useState, type ReactNode } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipVariant = 'dark' | 'white' | 'brand';

const BOX_POS: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2.5',
};

const ARROW_POS: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
  left: 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2',
  right: 'right-full top-1/2 translate-x-1/2 -translate-y-1/2',
};

const VARIANT_BOX: Record<TooltipVariant, string> = {
  dark: 'bg-gray-900 text-white shadow-[0_0_20px_rgba(0,0,0,0.35)] dark:bg-gray-700',
  white:
    'bg-white text-gray-700 border border-gray-200 shadow-[0_0_20px_rgba(0,0,0,0.15)] dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  brand: 'bg-brand-500 text-white shadow-[0_0_20px_rgba(0,0,0,0.25)]',
};

const VARIANT_ARROW: Record<TooltipVariant, string> = {
  dark: 'bg-gray-900 dark:bg-gray-700',
  white: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
  brand: 'bg-brand-500',
};

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  /** Tailwind max-width class — default `max-w-xs` (320px) */
  maxWidth?: string;
};

/**
 * Tooltip — shows `content` next to its trigger on hover and on keyboard
 * focus; Escape hides it. When the trigger is an element (a button, a link),
 * it gets `aria-describedby` pointing at the tooltip.
 */
export const Tooltip = ({
  content,
  children,
  position = 'top',
  variant = 'dark',
  maxWidth = 'max-w-xs',
}: TooltipProps) => {
  const id = useId();
  const [open, setOpen] = useState(false);

  // Escape closes it wherever focus is, even when it was opened by the pointer
  // (WCAG 1.4.13). Capture phase, so a surrounding modal doesn't also close.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open]);
  const trigger = isValidElement<{ 'aria-describedby'?: string }>(children)
    ? cloneElement(children, {
        'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' '),
      })
    : children;
  return (
    // `inline-block w-fit` keeps the wrapper exactly the size of the children even
    // inside grid/flex parents, so the absolute-positioned tooltip stays anchored
    // on the trigger rather than on the parent cell.
    <span
      className="relative inline-block w-fit align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {trigger}
      <span
        id={id}
        role="tooltip"
        className={clsx(
          'pointer-events-none absolute z-50 block w-max rounded-lg px-3 py-2 text-xs leading-relaxed font-normal whitespace-normal transition-opacity duration-150',
          open ? 'opacity-100' : 'opacity-0',
          maxWidth,
          BOX_POS[position],
          VARIANT_BOX[variant]
        )}
      >
        {content}
        <span
          aria-hidden
          className={clsx(
            'absolute h-2 w-2 rotate-45',
            ARROW_POS[position],
            VARIANT_ARROW[variant]
          )}
        />
      </span>
    </span>
  );
};

export const TooltipHelp = ({
  text,
  position = 'top',
  variant = 'dark',
}: {
  text: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
}) => (
  <Tooltip content={text} position={position} variant={variant} maxWidth="max-w-[260px]">
    {/* A button, so keyboard users can reach it and open the tooltip. */}
    <button
      type="button"
      aria-label="Help"
      className="focus-visible:ring-brand-500 inline-flex cursor-help rounded-full text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:ring-2 dark:text-gray-500 dark:hover:text-gray-300"
    >
      <HelpCircle className="h-3.5 w-3.5" aria-hidden />
    </button>
  </Tooltip>
);
