import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Avatar } from '../ui/Avatar';

export type ProfileHeaderStat = {
  label: string;
  value: ReactNode;
};

export type ProfileHeaderProps = {
  /** URL of the cover image. `null` (default) draws a soft gradient of the accent's tints. */
  cover?: string | null;
  /** Describes the cover. Empty by default: the cover is decorative. */
  coverAlt?: string;
  /**
   * The person or organization. `src` falls back to the initials of `name` when missing or when it
   * fails to load. Drawn at the `3xl` size of `Avatar` (`2xl` below `sm`), over the cover's bottom
   * edge.
   */
  avatar: { src?: string; name: string };
  /** The name, as the heading of the block. */
  name: string;
  /**
   * Heading element of the name. Default `h2`; a page whose Topbar title is plain text passes `h1`
   * so it keeps exactly one (same meaning as on `PageHeader`).
   */
  as?: 'h1' | 'h2';
  /** A role or a one-line bio, under the name. */
  headline?: string;
  /** `Badge` elements, on the name's line. */
  badges?: ReactNode;
  /** `PageHeader.MetaItem` children (place, date, e-mail), wrapped in a row. */
  meta?: ReactNode;
  /** Right-aligned actions (follow, message, edit). Below `sm` they share the row's width. */
  actions?: ReactNode;
  /** Counters, read as pairs of terms and values ("Followers 1,204"). */
  stats?: ProfileHeaderStat[];
  /**
   * The `Tabs.List` of a `Tabs` that routes the page, placed under the block behind a border. The
   * header lays it out; the content is the page's.
   */
  tabs?: ReactNode;
  className?: string;
};

/**
 * ProfileHeader — the block every profile page starts with: a cover, an avatar overlapping its
 * bottom edge, a name with badges and meta, actions, counters and a tab strip.
 *
 * It composes `Avatar`, `Badge`, `PageHeader.MetaItem` and `Tabs.List`; it adds no colour logic of
 * its own. The page content goes below it.
 */
export const ProfileHeader = ({
  cover = null,
  coverAlt = '',
  avatar,
  name,
  as: Heading = 'h2',
  headline,
  badges,
  meta,
  actions,
  stats,
  tabs,
  className,
}: ProfileHeaderProps) => (
  <div
    className={clsx(
      'overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]',
      !tabs && 'pb-5',
      className
    )}
  >
    {cover ? (
      <img
        src={cover}
        alt={coverAlt}
        aria-hidden={coverAlt ? undefined : true}
        className="block h-24 w-full object-cover sm:h-36"
      />
    ) : (
      <div
        aria-hidden="true"
        className="from-brand-500/20 via-brand-500/5 to-brand-500/15 h-24 bg-gradient-to-br sm:h-36 rtl:bg-gradient-to-bl"
      />
    )}
    <div className="flex flex-col gap-x-5 gap-y-3 px-4 sm:flex-row sm:flex-wrap sm:items-start sm:px-6">
      {/* Only the avatar overlaps the cover; the text starts under it, on the panel colour. The ring is the panel colour too, so the avatar reads over any cover. */}
      <span className="-mt-10 inline-flex w-fit shrink-0 rounded-full ring-4 ring-[var(--color-bg-panel)] sm:-mt-12">
        <Avatar
          src={avatar.src}
          name={avatar.name}
          size="2xl"
          className="sm:h-24 sm:w-24 sm:text-2xl"
        />
      </span>
      <div className="min-w-0 flex-1 basis-60 sm:pt-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* `min-w-0`: a flex item is as wide as its longest word otherwise, which never breaks. */}
          <Heading className="min-w-0 text-xl font-bold break-words text-[var(--color-text-primary)]">
            <bdi>{name}</bdi>
          </Heading>
          {badges}
        </div>
        {headline && (
          <p className="mt-1 text-sm break-words text-[var(--color-text-secondary)]">
            <bdi>{headline}</bdi>
          </p>
        )}
        {meta && (
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[var(--color-text-muted)]">
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2 max-sm:*:flex-1 sm:pt-3">{actions}</div>
      )}
    </div>
    {stats && stats.length > 0 && (
      <dl className="mx-4 mt-4 grid grid-cols-3 gap-2 sm:mx-6 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
        {stats.map((stat) => (
          // The value reads first, the term under it; the term comes first in the markup so that a
          // screen reader announces the pair as "Followers, 1,204".
          <div key={stat.label} className="flex min-w-0 flex-col-reverse gap-0.5">
            <dt className="text-xs text-[var(--color-text-muted)] sm:text-sm">{stat.label}</dt>
            <dd className="m-0 text-lg font-bold text-[var(--color-text-primary)]">{stat.value}</dd>
          </div>
        ))}
      </dl>
    )}
    {tabs && <div className="mt-4 border-t border-[var(--color-border)] px-4 sm:px-6">{tabs}</div>}
  </div>
);
