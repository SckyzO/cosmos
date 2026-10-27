import { clsx } from 'clsx';
import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { isTypingTarget, matchesHotkey } from '../ui/hotkey';

export type RecordPagerVariant = 'default' | 'compact';

export type RecordPagerLabels = {
  /** Previous button. Default `Previous {noun}`. */
  previous?: string;
  /** Next button. Default `Next {noun}`. */
  next?: string;
  /** The "Back to list" link. Default `Back to list`. */
  back?: string;
  /** The position, "12 of 340" by default. Receives the 1-indexed position and the total. */
  count?: (position: number, total: number) => ReactNode;
};

export type RecordPagerHotkeys = {
  /** A hotkey in the syntax of `HelpOverlay`'s: `'['`, `'k'`, `'mod+arrowleft'`. */
  previous?: string;
  next?: string;
};

export type RecordPagerProps = {
  /** 1-indexed position of the record on show in the list. */
  position: number;
  /** How many records the list holds. */
  total: number;
  /** Destination of Previous. A link, through the app's router (`LinkProvider`). */
  previousHref?: string;
  /** Destination of Next. A link, through the app's router (`LinkProvider`). */
  nextHref?: string;
  /**
   * Called when Previous is used. Alone it makes Previous a button; with `previousHref` it runs on
   * the click of the link too.
   */
  onPrevious?: () => void;
  /** Same as `onPrevious`, for Next. */
  onNext?: () => void;
  /** Adds a "Back to list" link to this destination, before the pager. */
  backHref?: string;
  /**
   * `default` is the count between two labelled buttons; `compact` shrinks the buttons to icons
   * (still named), for the actions of a `PageHeader`.
   */
  variant?: RecordPagerVariant;
  /**
   * What the list holds, in the singular and lower case: "order" gives "Previous order" and
   * "Next order". Default `record`.
   */
  noun?: string;
  /** Replaces a text outright, for another language or a wording `noun` can't build. */
  labels?: RecordPagerLabels;
  /**
   * Keyboard shortcuts, off unless given: a default key would be taken from apps that never asked
   * for one. They listen on the document and do nothing while a field is being typed in. List
   * them for the user in a `HelpOverlay`; the pager doesn't register itself there.
   */
  hotkeys?: RecordPagerHotkeys;
  /** Names the landmark. Default `{Noun} navigation`; two pagers on one page need distinct names. */
  'aria-label'?: string;
  className?: string;
};

// The secondary look of `Button` and `Pagination`'s steps. Colors live in this one set: nothing
// overrides it, so no class order decides anything.
const STEP_CLASS =
  'inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white font-medium text-gray-700 transition-colors not-disabled:hover:bg-gray-50 focus-visible:focus-indicator disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:not-disabled:hover:bg-gray-700';

const STEP_SIZE: Record<RecordPagerVariant, string> = {
  default: 'h-9 gap-1.5 px-3 text-sm',
  compact: 'size-8',
};

export const RecordPager = ({
  position,
  total,
  previousHref,
  nextHref,
  onPrevious,
  onNext,
  backHref,
  variant = 'default',
  noun = 'record',
  labels,
  hotkeys,
  'aria-label': ariaLabel,
  className,
}: RecordPagerProps) => {
  const previousLabel = labels?.previous ?? `Previous ${noun}`;
  const nextLabel = labels?.next ?? `Next ${noun}`;
  const backLabel = labels?.back ?? 'Back to list';
  const name = ariaLabel ?? `${noun.charAt(0).toUpperCase()}${noun.slice(1)} navigation`;

  // A side with nowhere to go is a disabled button even in link mode: a disabled `<a>` would still
  // be a link to reach and follow.
  const canPrevious = position > 1 && (previousHref !== undefined || onPrevious !== undefined);
  const canNext = position < total && (nextHref !== undefined || onNext !== undefined);

  const previousRef = useRef<HTMLElement | null>(null);
  const nextRef = useRef<HTMLElement | null>(null);

  const previousKey = hotkeys?.previous;
  const nextKey = hotkeys?.next;
  useEffect(() => {
    if (!previousKey && !nextKey) return;
    const handler = (e: KeyboardEvent) => {
      // A key typed in a field is text, and a handled one belongs to whoever handled it.
      if (e.defaultPrevented || isTypingTarget(e.target)) return;
      const side =
        previousKey && matchesHotkey(e, previousKey)
          ? previousRef
          : nextKey && matchesHotkey(e, nextKey)
            ? nextRef
            : null;
      // The shortcut uses the control, so a link goes through the router and a button runs its
      // callback; a disabled button ignores the click, which keeps the key free at the ends.
      if (!side?.current || (side.current as HTMLButtonElement).disabled) return;
      e.preventDefault();
      side.current.click();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [previousKey, nextKey]);

  const compact = variant === 'compact';
  const step = (
    direction: 'previous' | 'next',
    enabled: boolean,
    label: string,
    href: string | undefined,
    onClick: (() => void) | undefined,
    ref: { current: HTMLElement | null }
  ) => {
    const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
    const icon = <Icon aria-hidden className="size-4" />;
    // Below `sm` the default variant shows only the icons too: a label such as "Previous purchase
    // order" would wrap inside the button. The text stays as the accessible name.
    const content = (
      <>
        {direction === 'previous' && icon}
        {!compact && <span className="whitespace-nowrap max-sm:sr-only">{label}</span>}
        {direction === 'next' && icon}
      </>
    );
    const cls = clsx(STEP_CLASS, STEP_SIZE[variant]);
    const setRef = (el: HTMLElement | null) => {
      ref.current = el;
    };
    if (enabled && href !== undefined) {
      return (
        <AppLink
          ref={setRef}
          href={href}
          onClick={onClick}
          aria-label={compact ? label : undefined}
          className={cls}
        >
          {content}
        </AppLink>
      );
    }
    return (
      <button
        ref={setRef}
        type="button"
        disabled={!enabled}
        onClick={onClick}
        aria-label={compact ? label : undefined}
        className={cls}
      >
        {content}
      </button>
    );
  };

  const strong = 'font-medium text-[var(--color-text-primary)]';
  return (
    <nav
      aria-label={name}
      className={clsx('flex flex-wrap items-center gap-x-4 gap-y-2', className)}
    >
      {backHref !== undefined && (
        <AppLink
          href={backHref}
          className="focus-visible:focus-indicator text-brand-600 dark:text-brand-400 inline-flex items-center gap-1.5 rounded text-sm font-medium hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {backLabel}
        </AppLink>
      )}
      <div className="flex items-center gap-2">
        {step('previous', canPrevious, previousLabel, previousHref, onPrevious, previousRef)}
        <span
          className={clsx(
            'px-1 text-center whitespace-nowrap text-[var(--color-text-secondary)]',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {labels?.count ? (
            labels.count(position, total)
          ) : (
            <>
              <span className={strong}>{position}</span> of <span className={strong}>{total}</span>
            </>
          )}
        </span>
        {step('next', canNext, nextLabel, nextHref, onNext, nextRef)}
      </div>
    </nav>
  );
};
