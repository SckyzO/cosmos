import { clsx } from 'clsx';
import { ChevronRight, Ellipsis, Star } from 'lucide-react';
import {
  Children,
  createContext,
  Fragment,
  useContext,
  useId,
  type ComponentPropsWithRef,
  type ComponentType,
  type MouseEventHandler,
  type ReactNode,
} from 'react';
import { Checkbox } from '../forms/Checkbox';
import { useControllableState } from '../hooks/useControllableState';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { AppLink } from '../ui/AppLink';
import { Menu, type MenuItemIntent } from '../ui/Menu';

// The `card` mode of the list reaches its items without a prop on each of them.
const CardContext = createContext(false);

// ── Root ─────────────────────────────────────────────────────────────────────
// TUI reference: <ul role="list" class="divide-y divide-gray-100">
//                light pattern; dark variant uses divide-white/5

export type StackedListProps = Omit<ComponentPropsWithRef<'ul'>, 'children' | 'title'> & {
  children: ReactNode;
  /**
   * Put the list on a card surface (ring, shadow, rounded from `sm` up) and inset its items
   * so their content clears the card edge. `className` then styles the card; `ref` and the
   * other props stay on the `<ul>`.
   */
  card?: boolean;
  /** Card header title, above the rows. Only with `card`. */
  title?: ReactNode;
  /** Card header text under the title. Only with `card`. */
  description?: ReactNode;
  /** Card header action at the end of the title row (a link, a button). Only with `card`. */
  action?: ReactNode;
};

/**
 * Divided list of rows: avatar, title and subtitle at the start; a meta column
 * (hidden on phones), a trailing slot and a chevron at the end. An item with
 * `href` is a link across the whole row.
 *
 * Items also take a `badge` and a line of `details` for content rows (issues,
 * projects), a `timestamp` and a `description` for narrow columns, and a `rank`
 * for "top N" lists. `StackedList.Header` adds group headings between items, or a
 * selection bar. With `card` the list sits on a card surface, with an optional header.
 *
 * A triage list (a mail inbox, notifications) takes `unread`, `selected`, a checkbox
 * (`checked`), a star (`starred`) and `actions` on its items, and a select-all on the
 * header. The host keeps the state.
 */
function StackedListRoot({
  card = false,
  title,
  description,
  action,
  className,
  children,
  ref,
  ...rest
}: StackedListProps) {
  const list = (
    <ul
      ref={ref}
      role="list"
      className={clsx('divide-y divide-gray-100 dark:divide-white/5', !card && className)}
      {...rest}
    >
      {children}
    </ul>
  );
  if (!card) return list;

  const hasHeader = Boolean(title || description || action);
  return (
    <div
      className={clsx(
        'overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-md dark:bg-gray-900 dark:ring-white/10',
        className
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-x-4 border-b border-gray-100 px-4 py-4 sm:px-6 dark:border-white/10">
          <div className="min-w-0">
            {title && (
              <h3 className="text-base/7 font-semibold text-gray-900 dark:text-white">{title}</h3>
            )}
            {description && (
              <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          {action && <div className="flex flex-none items-center">{action}</div>}
        </div>
      )}
      <CardContext value>{list}</CardContext>
    </div>
  );
}

// ── Header (TUI Pattern 11 — sticky group headings) ─────────────────────────

export type StackedListHeaderProps = Omit<ComponentPropsWithRef<'li'>, 'children'> & {
  /** Render with `position: sticky` so the header stays pinned while scrolling. */
  sticky?: boolean;
  /** The heading, or in a selection bar the count ("3 selected"). */
  children: ReactNode;
  /**
   * Adds a select-all checkbox at the start, which makes the header a selection bar. The host
   * owns it: pass `checked` (every row is picked) and `indeterminate` (some are), and answer
   * `onCheckedChange` by picking or clearing them all.
   */
  checked?: boolean;
  /** Shows the checkbox as mixed: some rows are picked, not all. */
  indeterminate?: boolean;
  /** Called with the state the checkbox moves to. */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Controls at the end of the bar, for the actions on the picked rows. Keep them short, and
   * icon-only on a phone: the bar does not wrap.
   */
  actions?: ReactNode;
};

/**
 * Group heading, rendered as an `<li>` among the items of the same list. With
 * `sticky` it stays pinned to the top of the scrolling container. With `checked`
 * or `onCheckedChange` it is a selection bar: a select-all checkbox, the count and
 * the bulk `actions`.
 */
function StackedListHeader({
  sticky,
  checked,
  indeterminate = false,
  onCheckedChange,
  actions,
  className,
  children,
  ref,
  ...rest
}: StackedListHeaderProps) {
  const inCard = useContext(CardContext);
  const selectable = checked !== undefined || onCheckedChange !== undefined;
  const bar = selectable || Boolean(actions);
  return (
    <li
      ref={ref}
      className={clsx(
        'py-row-6 border-t border-b border-t-gray-200 border-b-gray-200 text-sm/6 font-semibold text-gray-900 dark:border-t-white/10 dark:border-b-white/10 dark:bg-gray-800 dark:text-white',
        // A selection bar lines its checkbox up with the rows', which a card insets.
        bar && inCard ? 'px-4 sm:px-6' : 'px-3',
        bar && 'flex items-center gap-x-3',
        // A pinned heading is a band over the rows that scroll under it: a deeper fill and a
        // shadow on its lower edge set it apart from them, where a loose one needs neither.
        sticky ? 'sticky top-0 z-10 bg-gray-100 shadow-xs' : 'bg-gray-50',
        className
      )}
      {...rest}
    >
      {selectable && (
        <Checkbox
          aria-label="Select all"
          checked={checked ?? false}
          indeterminate={indeterminate}
          onChange={(next) => onCheckedChange?.(next)}
          className="-m-1 p-1"
        />
      )}
      {bar ? <span className="min-w-0 flex-1">{children}</span> : children}
      {actions && <div className="-my-0.5 flex flex-none items-center gap-x-1.5">{actions}</div>}
    </li>
  );
}

// ── Dot separator (TUI: <svg viewBox="0 0 2 2"><circle r=1 /></svg>) ─────────

const Dot = () => (
  <svg viewBox="0 0 2 2" className="size-0.5 flex-none fill-current" aria-hidden>
    <circle r="1" cx="1" cy="1" />
  </svg>
);

// ── Item ─────────────────────────────────────────────────────────────────────
// TUI reference (Simple, row markup):
//   <li class="flex justify-between gap-x-6 py-5">
//     <div class="flex min-w-0 gap-x-4">
//       {avatar — size-12 flex-none rounded-full bg-gray-50}
//       <div class="min-w-0 flex-auto">
//         <p class="text-sm/6 font-semibold text-gray-900">{title}</p>
//         <p class="mt-1 truncate text-xs/5 text-gray-500">{subtitle}</p>
//       </div>
//     </div>
//     <div class="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
//       {meta — also two <p> lines, hidden on mobile}
//     </div>
//   </li>

/** One action of a row: an icon button on a wide screen, an item of a menu on a phone. */
export type StackedListAction = {
  /** What the action does ("Archive"). The button's name, with the row's title, and the menu item's text. */
  label: string;
  /** Icon of the button, and of the menu item. */
  icon: ComponentType<{ className?: string }>;
  /** `danger` colors a destructive action (delete). Default `neutral`. */
  intent?: MenuItemIntent;
  disabled?: boolean;
  /** Runs when the action is chosen. */
  onSelect: () => void;
};

export type StackedListItemProps = Omit<ComponentPropsWithRef<'li'>, 'title' | 'onClick'> & {
  /** Leading slot — typically an `<img>` (size-12, rounded-full) or `<Avatar>`. */
  avatar?: ReactNode;
  /** Primary text. */
  title: ReactNode;
  /** Secondary text below the title (truncated by default). */
  subtitle?: ReactNode;
  /** End-aligned meta column, hidden on mobile (mirrors TUI `hidden sm:flex`). */
  meta?: ReactNode;
  /** Trailing slot rendered after `meta` (icon, actions menu, badge…). */
  trailing?: ReactNode;
  /**
   * If set, the entire row becomes a navigable link via a full-row overlay
   * (TUI pattern: `<a><span class="absolute inset-x-0 -top-px bottom-0"></span></a>`).
   * `trailing` is lifted above the overlay so its actions stay clickable; give
   * any other interactive element (in `subtitle`, `details` or `meta`)
   * `position: relative`.
   */
  href?: string;
  /**
   * Makes the title a button, with the same full-row overlay as `href`, or runs on the link when
   * `href` is set too. It is the title's handler, not the `<li>`'s: it no longer fires from a
   * click on a control or on a part of the row that is not the title.
   */
  onClick?: MouseEventHandler<HTMLElement>;
  /** When `href` is set, also append a chevron-right icon to indicate navigation. */
  chevron?: boolean;
  /** Position in a "top N" list, shown before the avatar. */
  rank?: ReactNode;
  /** Inline badge rendered next to the title. */
  badge?: ReactNode;
  /**
   * Inline items under the title (author, date, owner…) separated by a dot. Each item stays
   * on one line; the last one truncates when the row runs out of room. Not the `meta`
   * column.
   */
  details?: ReactNode[];
  /** Timestamp at the end of the title row, for a narrow column. */
  timestamp?: ReactNode;
  /** Body text under the title, clamped to two lines. Replaces `subtitle`. */
  description?: ReactNode;
  /**
   * Whether the row is unread. `true` is a bold title with a dot in the start gutter and
   * "Unread" for a screen reader; `false` the read look, a lighter title. Left out, the row
   * keeps the look it always had. Set it on every row of an inbox, so the titles stay aligned.
   */
  unread?: boolean;
  /**
   * The row open in a master-detail layout: `aria-current` on the title, a tint and a bar at
   * the start edge. Not the checkbox: that is `checked`.
   */
  selected?: boolean;
  /** Controlled state of the row's checkbox. Setting it, `defaultChecked` or `onCheckedChange` adds the checkbox. */
  checked?: boolean;
  defaultChecked?: boolean;
  /** Called with the state the checkbox moves to. */
  onCheckedChange?: (checked: boolean) => void;
  /** Controlled state of the star. Setting it, `defaultStarred` or `onStarredChange` adds the star toggle. */
  starred?: boolean;
  defaultStarred?: boolean;
  /** Called with the state the star moves to. */
  onStarredChange?: (starred: boolean) => void;
  /**
   * Actions on the row. Icon buttons that appear on hover and focus (they are only transparent
   * until then, so a keyboard reaches them); on a phone, and on a screen with no hover, one
   * "More actions" menu. Anything else goes in `trailing`.
   */
  actions?: StackedListAction[];
};

// Below `sm`, and on a screen with no hover to reveal anything, the actions are one menu.
const FOLD_ACTIONS = '(width < 40rem), (hover: none)';

const ICON_BUTTON =
  'focus-visible:focus-indicator flex h-ctrl-28 w-ctrl-28 shrink-0 items-center justify-center rounded-lg transition-colors';
const ICON_BUTTON_NEUTRAL =
  'text-[var(--color-text-muted)] hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/10';
const ICON_BUTTON_DANGER =
  'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10';

// A focus ring on the whole row, from the title only: the checkbox, star and actions draw their own.
const RING_FROM_TITLE =
  'has-[[data-row-main]:focus-visible]:focus-indicator has-[[data-row-main]:focus-visible]:ring-inset';

function StackedListItem({
  avatar,
  title,
  subtitle,
  meta,
  trailing,
  href,
  onClick,
  chevron,
  rank,
  badge,
  details,
  timestamp,
  description,
  unread,
  selected,
  checked: checkedProp,
  defaultChecked,
  onCheckedChange,
  starred: starredProp,
  defaultStarred,
  onStarredChange,
  actions,
  className,
  ref,
  ...rest
}: StackedListItemProps) {
  const id = useId();
  const titleId = `${id}-title`;
  // The full-row overlay needs the <li> to be `relative`.
  const isLinked = Boolean(href);
  const isClickable = isLinked || onClick !== undefined;
  // In a card the rows clear the card edge, which the bare list gets from its container.
  const inCard = useContext(CardContext);
  const detailItems = details ? Children.toArray(details) : [];

  const [checked, setChecked] = useControllableState({
    value: checkedProp,
    defaultValue: defaultChecked ?? false,
    onChange: onCheckedChange,
    name: 'StackedList.Item.checked',
  });
  const [starred, setStarred] = useControllableState({
    value: starredProp,
    defaultValue: defaultStarred ?? false,
    onChange: onStarredChange,
    name: 'StackedList.Item.starred',
  });
  const checkable =
    checkedProp !== undefined || defaultChecked !== undefined || onCheckedChange !== undefined;
  const starrable =
    starredProp !== undefined || defaultStarred !== undefined || onStarredChange !== undefined;
  const rowActions = actions ?? [];
  const hasActions = rowActions.length > 0;
  // Only a row with actions listens to the width; the markup changes, so this is not a class.
  const folded = useMediaQuery(hasActions ? FOLD_ACTIONS : null, false);
  const inlineActions = hasActions && !folded;
  const controls = checkable || starrable || hasActions;
  // A triage row: tighter than a content row, and it answers a hover.
  const triage = controls || unread !== undefined || selected !== undefined;

  const titleTone =
    unread === true
      ? 'font-bold text-gray-900 dark:text-white'
      : unread === false
        ? 'font-medium text-gray-700 dark:text-gray-300'
        : 'font-semibold text-gray-900 dark:text-white';
  const unreadLabel = unread === true && <span className="sr-only">Unread: </span>;
  const titleText = <bdi id={titleId}>{title}</bdi>;
  // The title of a clickable row is its one link or button; the overlay stretches it over the row.
  const overlay = <span className="absolute inset-x-0 -top-px bottom-0" aria-hidden />;
  const current = selected ? ('true' as const) : undefined;

  const titleEl = (
    <p className={clsx('text-sm/6', titleTone)}>
      {isLinked ? (
        <AppLink
          href={href}
          onClick={onClick}
          aria-current={current}
          data-row-main
          className="focus:outline-hidden"
        >
          {/* Full-row click target */}
          {overlay}
          {unreadLabel}
          {titleText}
        </AppLink>
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-current={current}
          data-row-main
          className="text-start focus:outline-hidden"
        >
          {overlay}
          {unreadLabel}
          {titleText}
        </button>
      ) : (
        <>
          {unreadLabel}
          {titleText}
        </>
      )}
    </p>
  );
  // In a narrow row the badge goes under the title rather than wrapping inside itself.
  const titleRow = badge ? (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
      {titleEl}
      <span className="flex-none">{badge}</span>
    </div>
  ) : (
    titleEl
  );

  // The controls name themselves after the row ("Star Ana Ruiz"): a list repeats them.
  const labelled = (label: string) => ({
    'aria-labelledby': `${id}-${label} ${titleId}`,
  });

  const starNode = starrable && (
    <button
      type="button"
      {...labelled('star')}
      aria-pressed={starred}
      onClick={() => setStarred(!starred)}
      className={clsx(
        ICON_BUTTON,
        ICON_BUTTON_NEUTRAL,
        // A set star always shows; an empty one waits for the row to be hovered or focused, and
        // is shown where there is no hover to wait for.
        !starred &&
          'opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 max-sm:opacity-100 [@media(hover:none)]:opacity-100'
      )}
    >
      <span id={`${id}-star`} className="sr-only">
        Star
      </span>
      {/* warning-600, as on `Rating`: it holds 3:1 on a sand page, where amber-600 does not. */}
      <Star
        className={clsx('size-4', starred && 'text-warning-600 fill-current dark:text-amber-400')}
        aria-hidden
      />
    </button>
  );

  const actionButtons = inlineActions && (
    <div className="relative col-start-1 row-start-1 -my-0.5 flex items-center gap-x-0.5 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100">
      {rowActions.map(({ label, icon: Icon, intent, disabled, onSelect }, i) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          aria-labelledby={`${id}-a${i} ${titleId}`}
          onClick={onSelect}
          className={clsx(
            ICON_BUTTON,
            intent === 'danger' ? ICON_BUTTON_DANGER : ICON_BUTTON_NEUTRAL,
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <span id={`${id}-a${i}`} className="sr-only">
            {label}
          </span>
          <Icon className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  );

  const moreActions = hasActions && folded && (
    <Menu align="end">
      <Menu.Trigger
        aria-labelledby={`${id}-more ${titleId}`}
        className={clsx(ICON_BUTTON, ICON_BUTTON_NEUTRAL)}
      >
        <span id={`${id}-more`} className="sr-only">
          More actions
        </span>
        <Ellipsis className="size-4" aria-hidden />
      </Menu.Trigger>
      <Menu.Content width="w-48">
        {rowActions.map(({ label, icon, intent, disabled, onSelect }) => (
          <Menu.Item
            key={label}
            icon={icon}
            intent={intent}
            disabled={disabled}
            onSelect={onSelect}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Content>
    </Menu>
  );

  // The time and the actions share one cell: the actions take the time's place while shown.
  const endOfTitleRow = inlineActions ? (
    <div className="grid min-h-6 flex-none items-center justify-items-end">
      {timestamp && (
        <p className="col-start-1 row-start-1 text-xs/5 text-gray-600 transition-opacity group-focus-within/row:opacity-0 group-hover/row:opacity-0 dark:text-gray-400">
          {timestamp}
        </p>
      )}
      {actionButtons}
    </div>
  ) : (
    timestamp && <p className="flex-none text-xs/5 text-gray-600 dark:text-gray-400">{timestamp}</p>
  );

  const hasEnd = meta || trailing || (isLinked && chevron) || starrable || moreActions;

  return (
    <li
      ref={ref}
      aria-current={isClickable ? undefined : current}
      className={clsx(
        triage ? 'py-row-12' : 'py-row-20',
        'flex justify-between gap-x-6',
        (badge || detailItems.length > 0) && 'items-center',
        (isClickable || unread !== undefined || selected) && 'relative',
        controls && 'group/row',
        // A row that is only a link keeps the ring on any focus inside it; one with controls
        // or a button title rings for its title alone.
        isClickable &&
          (isLinked && !controls
            ? 'has-focus-visible:focus-indicator has-focus-visible:ring-inset'
            : RING_FROM_TITLE),
        // The states are exclusive: an open row wins over a picked one, which wins over a hover.
        selected
          ? 'bg-gray-100 dark:bg-gray-800'
          : checked && checkable
            ? 'bg-brand-50/40 dark:bg-brand-500/5'
            : (triage || onClick !== undefined) && 'hover:bg-gray-50 dark:hover:bg-white/5',
        inCard && 'px-4 sm:px-6',
        className
      )}
      {...rest}
    >
      {selected && (
        <span
          data-row-bar
          aria-hidden
          className="bg-brand-500 inset-s-0 absolute inset-y-0 w-[3px]"
        />
      )}
      {unread === true && (
        <span
          data-row-dot
          aria-hidden
          className={clsx(
            'bg-brand-500 absolute top-[calc(var(--spacing-row-12)+0.5rem)] size-2 rounded-full',
            inCard ? 'inset-s-1 sm:inset-s-2' : 'inset-s-1'
          )}
        />
      )}
      <div className="flex min-w-0 gap-x-4">
        {checkable && (
          // The first control of the row in tab order, so it is raised above the title's overlay
          // by hand. The label is a 26px target around the 18px box; the negative margins keep
          // the box where a 18px one would sit, level with the first line of the title.
          <div className="relative z-[1] -mx-1 -mt-px -mb-1 flex self-start">
            <span id={`${id}-select`} hidden>
              Select
            </span>
            <Checkbox
              {...labelled('select')}
              checked={checked}
              onChange={(next) => setChecked(next)}
              className="p-1"
            />
          </div>
        )}
        {rank != null && (
          <span className="w-5 flex-none self-center text-sm/6 font-semibold text-[var(--color-text-muted)] tabular-nums">
            {rank}
          </span>
        )}
        {avatar}
        <div className="min-w-0 flex-auto">
          {timestamp || inlineActions ? (
            <div
              className={clsx(
                'flex justify-between gap-x-4',
                inlineActions ? 'items-start' : 'items-baseline'
              )}
            >
              {titleRow}
              {endOfTitleRow}
            </div>
          ) : (
            titleRow
          )}
          {description ? (
            <p
              className={clsx(
                'mt-1 line-clamp-2 text-sm/6',
                unread === true
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <bdi>{description}</bdi>
            </p>
          ) : (
            subtitle && (
              <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">
                <bdi>{subtitle}</bdi>
              </p>
            )
          )}
          {detailItems.length > 0 && (
            <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500 dark:text-gray-400">
              {detailItems.map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <Dot />}
                  {/* One line per item; the last one truncates when the row runs out of room. */}
                  <span className={i === detailItems.length - 1 ? 'truncate' : 'whitespace-nowrap'}>
                    <bdi>{item}</bdi>
                  </span>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
      {hasEnd && (
        <div className="flex shrink-0 items-center gap-x-4">
          {meta && <div className="hidden sm:flex sm:flex-col sm:items-end">{meta}</div>}
          {/* Positioned after the overlay in tree order, so it paints above it. */}
          {trailing &&
            (isClickable ? (
              <div className="relative flex items-center gap-x-4">{trailing}</div>
            ) : (
              trailing
            ))}
          {(starNode || moreActions) && (
            <div className="relative flex items-center gap-x-0.5">
              {starNode}
              {moreActions}
            </div>
          )}
          {isLinked && chevron && (
            <ChevronRight
              className="size-5 flex-none text-gray-400 rtl:-scale-x-100 dark:text-gray-500"
              aria-hidden
            />
          )}
        </div>
      )}
    </li>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

export const StackedList = Object.assign(StackedListRoot, {
  Header: StackedListHeader,
  Item: StackedListItem,
});
