import { clsx } from 'clsx';
import { HelpCircle } from 'lucide-react';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Kbd } from '../typography/Kbd';
import type { Intent } from './intent';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
/** Surface of the tooltip. */
export type TooltipVariant = 'dark' | 'white';
/** Meaning of the tooltip: colors it over its surface. */
export type TooltipIntent = Extract<Intent, 'brand' | 'success' | 'warning' | 'danger'>;

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
};

const INTENT_BOX: Record<TooltipIntent, string> = {
  brand: 'bg-brand-500 text-white shadow-[0_0_20px_rgba(0,0,0,0.25)]',
  // Shades picked for 4.5:1 text contrast; amber is too light for white text.
  success: 'bg-green-700 text-white shadow-[0_0_20px_rgba(0,0,0,0.25)]',
  warning: 'bg-amber-400 text-gray-900 shadow-[0_0_20px_rgba(0,0,0,0.25)]',
  danger: 'bg-red-600 text-white shadow-[0_0_20px_rgba(0,0,0,0.25)]',
};

const VARIANT_ARROW: Record<TooltipVariant, string> = {
  dark: 'bg-gray-900 dark:bg-gray-700',
  white: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
};

const INTENT_ARROW: Record<TooltipIntent, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-700',
  warning: 'bg-amber-400',
  danger: 'bg-red-600',
};

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  /** Surface: `dark` (default) or `white`. Ignored while `intent` is set. */
  variant?: TooltipVariant;
  /** Colors the tooltip by meaning, over `variant`. Unset (default) keeps the plain surface. */
  intent?: TooltipIntent;
  /** Tailwind max-width class — default `max-w-xs` (320px) */
  maxWidth?: string;
  /** Keys shown after the content, e.g. `['⌘', 'S']`. */
  shortcut?: string[];
  /** Bold first line; `content` then reads as its explanation. */
  title?: ReactNode;
  /** Draw the small arrow pointing at the trigger. Default `true`. */
  arrow?: boolean;
  /** Milliseconds to wait before showing on hover or focus. Default `0`. */
  delay?: number;
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
  intent,
  maxWidth = 'max-w-xs',
  shortcut,
  title,
  arrow = true,
  delay = 0,
}: TooltipProps) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  // Pointer over or focus inside, shown or still waiting for `delay`.
  const [engaged, setEngaged] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const show = () => {
    setEngaged(true);
    clearTimeout(timer.current);
    if (delay > 0) timer.current = setTimeout(() => setOpen(true), delay);
    else setOpen(true);
  };
  const hide = () => {
    setEngaged(false);
    clearTimeout(timer.current);
    setOpen(false);
  };

  // Escape closes it wherever focus is, even when it was opened by the pointer
  // (WCAG 1.4.13), and cancels a pending show. Capture phase, so a surrounding
  // modal doesn't also close.
  useEffect(() => {
    if (!engaged) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (open) e.stopPropagation();
      clearTimeout(timer.current);
      setEngaged(false);
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [engaged, open]);
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
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
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
          intent ? INTENT_BOX[intent] : VARIANT_BOX[variant]
        )}
      >
        {title && <span className="block font-semibold">{title}</span>}
        {title ? <span className="mt-0.5 block opacity-80">{content}</span> : content}
        {shortcut && (
          <span className="ml-2 inline-flex gap-0.5 align-middle">
            {/* Index keys: a shortcut can repeat a key, e.g. G G. */}
            {shortcut.map((key, i) => (
              <Kbd key={i} size="sm">
                {key}
              </Kbd>
            ))}
          </span>
        )}
        {arrow && (
          <span
            aria-hidden
            className={clsx(
              'absolute h-2 w-2 rotate-45',
              ARROW_POS[position],
              intent ? INTENT_ARROW[intent] : VARIANT_ARROW[variant]
            )}
          />
        )}
      </span>
    </span>
  );
};

export const TooltipHelp = ({
  text,
  position = 'top',
  variant = 'dark',
  intent,
}: {
  text: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  intent?: TooltipIntent;
}) => (
  <Tooltip
    content={text}
    position={position}
    variant={variant}
    intent={intent}
    maxWidth="max-w-[260px]"
  >
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
