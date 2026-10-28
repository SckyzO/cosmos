import { clsx } from 'clsx';
import { Star } from 'lucide-react';
import { useState, type ReactNode, type Ref } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { AppLink } from '../ui/AppLink';
import { Badge } from '../ui/Badge';
import { INTENT_STYLE } from '../ui/intent';
import { FILE_KIND_VISUAL, type FileKind } from './fileKind';

export type { FileKind } from './fileKind';

export type FileTileLayout = 'tile' | 'row';

export type FileTileProps = {
  /** File or folder name: the single link or button of the tile. Truncated on one line, in full in its `title`. */
  name: string;
  /** Picks the icon and its tint. Default `other`. */
  kind?: FileKind;
  /** Image URL shown in place of the icon. It falls back to the icon when it fails to load. */
  thumbnail?: string;
  /** Small text under the name ("2.4 MB · Edited yesterday"). */
  meta?: ReactNode;
  /** `tile` (default) is a card with a preview area, for a grid; `row` is one line, for a list. */
  layout?: FileTileLayout;
  /** Controlled starred state. Setting it, `defaultStarred` or `onStarredChange` adds the star button. */
  starred?: boolean;
  defaultStarred?: boolean;
  /** Called with the state the star moves to. */
  onStarredChange?: (starred: boolean) => void;
  /** Adds a "Shared" badge: over the preview in `tile`, in the meta line in `row`. */
  shared?: boolean;
  /** Draws the tile as picked: an accent border and fill. Also sets `aria-current` on the name. */
  selected?: boolean;
  /** Makes the name a button. */
  onOpen?: () => void;
  /** Makes the name a link (through the app's `LinkProvider`). Wins over `onOpen`. */
  href?: string;
  /**
   * Trailing control, typically a `Menu` whose trigger is named "More actions for {name}". It is a
   * sibling of the name, never nested in it.
   */
  actions?: ReactNode;
  className?: string;
  /** Ref to the `<li>`. */
  ref?: Ref<HTMLLIElement>;
};

const ICON_BUTTON =
  'focus-visible:focus-indicator flex shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/10';

const NAME_CLASS =
  'focus-visible:focus-indicator block max-w-full truncate rounded text-start text-sm font-semibold text-[var(--color-text-primary)] hover:underline';

/**
 * One file or folder, as a `<li>` for a `GridList`, a `StackedList` or any `<ul>`. `layout="tile"`
 * is the card of a grid, `layout="row"` the line of a list. The app owns what the tile does:
 * `onOpen` or `href` on the name, `onStarredChange` on the star, a `Menu` in `actions`.
 */
export const FileTile = ({
  name,
  kind = 'other',
  thumbnail,
  meta,
  layout = 'tile',
  starred: starredProp,
  defaultStarred,
  onStarredChange,
  shared = false,
  selected = false,
  onOpen,
  href,
  actions,
  className,
  ref,
}: FileTileProps) => {
  const [starred, setStarred] = useControllableState({
    value: starredProp,
    defaultValue: defaultStarred ?? false,
    onChange: onStarredChange,
    name: 'FileTile.starred',
  });
  // Remember which `thumbnail` failed, so a new one gets a fresh attempt (as `Avatar` does).
  const [failedSrc, setFailedSrc] = useState<string>();
  const showImage = thumbnail !== undefined && thumbnail !== failedSrc;
  const showStar =
    starredProp !== undefined || defaultStarred !== undefined || onStarredChange !== undefined;
  const isTile = layout === 'tile';

  const { icon: Icon, intent } = FILE_KIND_VISUAL[kind];
  const tint = INTENT_STYLE[intent];

  const nameNode = href ? (
    <AppLink
      href={href}
      title={name}
      aria-current={selected || undefined}
      className={clsx(NAME_CLASS, 'break-all')}
    >
      <bdi>{name}</bdi>
    </AppLink>
  ) : onOpen ? (
    <button
      type="button"
      title={name}
      aria-current={selected || undefined}
      onClick={onOpen}
      className={NAME_CLASS}
    >
      <bdi>{name}</bdi>
    </button>
  ) : (
    <span
      title={name}
      className="block max-w-full truncate text-sm font-semibold text-[var(--color-text-primary)]"
    >
      <bdi>{name}</bdi>
    </span>
  );

  const metaNode = (meta !== undefined || (shared && !isTile)) && (
    <div className="text-2xs flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[var(--color-text-muted)]">
      {meta !== undefined && <bdi>{meta}</bdi>}
      {shared && !isTile && (
        <Badge size="sm" intent="neutral">
          Shared
        </Badge>
      )}
    </div>
  );

  const starNode = showStar && (
    <button
      type="button"
      aria-label={`Star ${name}`}
      aria-pressed={starred}
      onClick={() => setStarred(!starred)}
      className={clsx(
        ICON_BUTTON,
        // Over the preview the star sits on a panel-coloured square, so it reads over a photo.
        isTile ? 'inset-e-2 absolute top-2 size-8 bg-[var(--color-bg-panel)]/85' : 'size-8'
      )}
    >
      {/* warning-600, as on `Rating`: it holds 3:1 on a sand page, where amber-600 does not. */}
      <Star
        className={clsx('size-4', starred && 'text-warning-600 fill-current dark:text-amber-400')}
        aria-hidden
      />
    </button>
  );

  const actionsNode = actions && <div className="shrink-0">{actions}</div>;

  if (!isTile) {
    return (
      <li
        ref={ref}
        data-layout="row"
        data-selected={selected || undefined}
        className={clsx(
          'py-row-10 flex items-center gap-3 ps-4 pe-3',
          selected &&
            'bg-brand-50/50 dark:bg-brand-500/10 shadow-[inset_0_0_0_2px_var(--color-brand-500)]',
          className
        )}
      >
        <span
          className={clsx(
            'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px]',
            tint.tile
          )}
        >
          {showImage ? (
            <img
              src={thumbnail}
              alt=""
              onError={() => setFailedSrc(thumbnail)}
              className="size-full object-cover"
            />
          ) : (
            <Icon className={clsx('size-[18px]', tint.iconColor)} aria-hidden />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {nameNode}
          {metaNode}
        </div>
        {starNode}
        {actionsNode}
      </li>
    );
  }

  return (
    <li
      ref={ref}
      data-layout="tile"
      data-selected={selected || undefined}
      className={clsx(
        // The outline is one step stronger in dark, as `Card`'s is.
        'relative flex flex-col overflow-hidden rounded-2xl border bg-[var(--color-bg-panel)] [--card-border:var(--color-border)] dark:[--card-border:var(--color-gray-600)]',
        selected
          ? 'border-brand-500 shadow-[0_0_0_1px_var(--color-brand-500)]'
          : 'border-[var(--card-border)]',
        className
      )}
    >
      <div className={clsx('flex h-32 items-center justify-center', tint.tile)}>
        {showImage ? (
          <img
            src={thumbnail}
            alt=""
            onError={() => setFailedSrc(thumbnail)}
            className="size-full object-cover"
          />
        ) : (
          <Icon className={clsx('size-11', tint.iconColor)} strokeWidth={1.5} aria-hidden />
        )}
      </div>
      {shared && (
        <span className="inset-s-2 absolute top-2 rounded-full bg-[var(--color-bg-panel)]">
          <Badge size="sm" intent="neutral">
            Shared
          </Badge>
        </span>
      )}
      <div
        className={clsx(
          'flex items-start gap-2 py-3 ps-3.5 pe-3',
          selected && 'bg-brand-50/50 dark:bg-brand-500/10'
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {nameNode}
          {metaNode}
        </div>
        {starNode}
        {actionsNode}
      </div>
    </li>
  );
};
