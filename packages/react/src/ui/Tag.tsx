import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { Children, isValidElement } from 'react';
import type { ElementType, ReactNode, Ref } from 'react';
import { INTENT_STYLE, type Intent } from './intent';

export type TagSize = 'sm' | 'md';

export type TagProps = {
  children: ReactNode;
  /** Color of the tag. Default `neutral`. */
  intent?: Intent;
  size?: TagSize;
  /** Optional leading Lucide icon. */
  icon?: ElementType;
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

// 26px and 22px high; a tag keeps `rounded-md` so it never reads as a status pill (Badge).
const SIZE = {
  sm: { box: 'h-5.5 text-2xs', gap: 'gap-1', pad: 'ps-1.5', padEnd: 'pe-1.5', icon: 'size-3' },
  md: { box: 'h-6.5 text-sm', gap: 'gap-1.5', pad: 'ps-2', padEnd: 'pe-2', icon: 'size-3.5' },
} satisfies Record<TagSize, Record<string, string>>;

// The X is drawn small; the pseudo-element stretches its hit area to 24px (WCAG 2.5.8).
const REMOVE_SIZE = {
  sm: 'size-3.5 before:-inset-[5px]',
  md: 'size-4 before:-inset-1',
} satisfies Record<TagSize, string>;

const REMOVE_ICON = { sm: 'size-2.5', md: 'size-3' } satisfies Record<TagSize, string>;

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
      <span className="min-w-0 truncate">{children}</span>
    </>
  );
  const mainClass = clsx('flex min-w-0 items-center rounded-sm', sizing.gap);
  const interactiveClass =
    'focus-visible:focus-indicator cursor-pointer transition-opacity hover:opacity-80';
  const name = textOf(children);

  let main: ReactNode;
  if (interactive && href !== undefined) {
    main = (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        className={clsx(mainClass, interactiveClass, 'underline underline-offset-2')}
      >
        {content}
      </a>
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
        style.tile,
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
