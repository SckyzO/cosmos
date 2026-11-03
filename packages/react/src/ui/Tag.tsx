import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { Children, isValidElement } from 'react';
import type { ElementType, ReactNode, Ref } from 'react';
import { AppLink } from './AppLink';
import { INTENT_STYLE, type Intent } from './intent';

export type TagSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type TagProps = {
  children: ReactNode;
  /** Color of the tag. Default `neutral`. */
  intent?: Intent;
  /** Seven steps, `xs` (18px high) to `3xl` (48px), `md` (26px) by default. */
  size?: TagSize;
  /** Optional leading Lucide icon. */
  icon?: ElementType;
  /**
   * The tag sits in a text field (the values of a `TagInput` or a `MultiSelect`). A neutral tag
   * then takes a surface the field's own background does not match, in any theme: it has the
   * same one as a loose tag otherwise. Default `false`.
   */
  inField?: boolean;
  /** Faded and inert: the tag can't be clicked, followed or removed. */
  disabled?: boolean;
  /** Shows a remove button; it is called when the button is pressed. */
  onRemove?: () => void;
  /**
   * Accessible name of the remove button. Default `Remove {text}`, with the text read from
   * `children`; set it when `children` holds no text or the action has a better name.
   */
  removeLabel?: string;
  /** Makes the tag a link. Wins over `onClick`, which still runs on click. */
  href?: string;
  /** Makes the tag a button. */
  onClick?: () => void;
  /**
   * Points at the element that takes focus: the link or the button when the tag is one, else the
   * remove button, else the root `span` (not focusable).
   */
  ref?: Ref<HTMLElement>;
  className?: string;
};

// 18, 22, 26, 30, 34, 40 and 48px high, with the text at 10, 11, 14, 16, 18, 20 and 24px; a tag
// keeps `rounded-md` so it never reads as a status pill (Badge).
const SIZE = {
  xs: { box: 'h-4.5 text-3xs', gap: 'gap-1', pad: 'ps-1', padEnd: 'pe-1', icon: 'size-2.5' },
  sm: { box: 'h-5.5 text-2xs', gap: 'gap-1', pad: 'ps-1.5', padEnd: 'pe-1.5', icon: 'size-3' },
  md: { box: 'h-6.5 text-sm', gap: 'gap-1.5', pad: 'ps-2', padEnd: 'pe-2', icon: 'size-3.5' },
  lg: { box: 'h-7.5 text-base', gap: 'gap-1.5', pad: 'ps-2.5', padEnd: 'pe-2.5', icon: 'size-4' },
  xl: { box: 'h-8.5 text-lg', gap: 'gap-2', pad: 'ps-3', padEnd: 'pe-3', icon: 'size-4.5' },
  '2xl': { box: 'h-10 text-xl', gap: 'gap-2', pad: 'ps-3.5', padEnd: 'pe-3.5', icon: 'size-5' },
  '3xl': { box: 'h-12 text-2xl', gap: 'gap-2.5', pad: 'ps-4', padEnd: 'pe-4', icon: 'size-6' },
} satisfies Record<TagSize, Record<string, string>>;

// A neutral tag in a field: the loose tag's gray-100 (gray-800 in the dark themes) is the field's
// own background there. gray-300 and gray-700 keep 1.3:1 or more against it in the four themes
// (gray-200 is 1.24:1 on white).
const FIELD_NEUTRAL_TILE = 'bg-gray-300 dark:bg-gray-700';

// The X is drawn small; up to `lg` the pseudo-element stretches its hit area to 24px (WCAG 2.5.8).
// From `xl` up the button is 24px or more already, and the pseudo-element only fills it.
const REMOVE_SIZE = {
  xs: 'size-3 before:-inset-1.5',
  sm: 'size-3.5 before:-inset-[5px]',
  md: 'size-4 before:-inset-1',
  lg: 'size-5 before:-inset-0.5',
  xl: 'size-6 before:inset-0',
  '2xl': 'size-7 before:inset-0',
  '3xl': 'size-8 before:inset-0',
} satisfies Record<TagSize, string>;

const REMOVE_ICON = {
  xs: 'size-2',
  sm: 'size-2.5',
  md: 'size-3',
  lg: 'size-3.5',
  xl: 'size-4',
  '2xl': 'size-4.5',
  '3xl': 'size-5',
} satisfies Record<TagSize, string>;

// The text of a link or button tag is as high as its line, 14px or less on the two smallest sizes:
// the pseudo-element gives it a 24px target the way the remove button has one, without moving
// anything. It runs to the edges of the tag across, and is 24px high, centred on the text.
const MAIN_HIT_AREA: Partial<Record<TagSize, string>> = {
  xs: 'relative before:absolute before:-inset-x-1 before:top-1/2 before:h-6 before:-translate-y-1/2 before:content-[""]',
  sm: 'relative before:absolute before:-inset-x-1.5 before:top-1/2 before:h-6 before:-translate-y-1/2 before:content-[""]',
};

const textOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? textOf(child.props.children)
        : typeof child === 'string' || typeof child === 'number'
          ? String(child)
          : ''
    )
    .join('')
    .trim();

/**
 * Tag — a removable, optionally clickable chip for a value the user picked or a label on a record
 * (a filter, a category, a contact tag). Rounded-rectangle and tinted, where `Badge` is a status
 * pill. A tag with `href` is a link, with `onClick` a button; `onRemove` adds a remove button
 * next to it, so the two actions never nest.
 */
export const Tag = ({
  children,
  intent = 'neutral',
  size = 'md',
  icon: Icon,
  inField = false,
  disabled = false,
  onRemove,
  removeLabel,
  href,
  onClick,
  ref,
  className,
}: TagProps) => {
  const style = INTENT_STYLE[intent];
  const sizing = SIZE[size];
  const interactive = !disabled && (href !== undefined || onClick !== undefined);
  const content = (
    <>
      {Icon && <Icon className={clsx('shrink-0', sizing.icon)} aria-hidden />}
      <bdi className="min-w-0 truncate">{children}</bdi>
    </>
  );
  const mainClass = clsx('flex min-w-0 items-center rounded-sm', sizing.gap);
  const interactiveClass = clsx(
    'focus-visible:focus-indicator cursor-pointer transition-opacity hover:opacity-80',
    MAIN_HIT_AREA[size]
  );
  const name = textOf(children);

  let main: ReactNode;
  if (interactive && href !== undefined) {
    main = (
      <AppLink
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        className={clsx(mainClass, interactiveClass, 'underline underline-offset-2')}
      >
        {content}
      </AppLink>
    );
  } else if (interactive) {
    main = (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={clsx(mainClass, interactiveClass)}
      >
        {content}
      </button>
    );
  } else {
    // A disabled link or button stays in the markup as text, inert.
    main = (
      <span
        className={clsx(
          mainClass,
          disabled && href !== undefined && 'underline underline-offset-2'
        )}
      >
        {content}
      </span>
    );
  }

  return (
    <span
      ref={interactive || onRemove ? undefined : (ref as Ref<HTMLSpanElement>)}
      aria-disabled={disabled ? true : undefined}
      className={clsx(
        'inline-flex max-w-full items-center rounded-md font-medium',
        inField && intent === 'neutral' ? FIELD_NEUTRAL_TILE : style.tile,
        style.text,
        sizing.box,
        sizing.gap,
        sizing.pad,
        onRemove ? 'pe-1' : sizing.padEnd,
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {main}
      {onRemove && (
        <button
          ref={interactive ? undefined : (ref as Ref<HTMLButtonElement>)}
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={removeLabel ?? (name ? `Remove ${name}` : 'Remove')}
          className={clsx(
            'focus-visible:focus-indicator relative inline-flex shrink-0 items-center justify-center rounded-sm before:absolute before:content-[""]',
            'enabled:cursor-pointer enabled:hover:bg-black/10 enabled:dark:hover:bg-white/15',
            REMOVE_SIZE[size]
          )}
        >
          <X className={REMOVE_ICON[size]} aria-hidden />
        </button>
      )}
    </span>
  );
};
