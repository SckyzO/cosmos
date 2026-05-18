import { clsx } from 'clsx';
import {
  Children,
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
} from 'react';

// ── Root ─────────────────────────────────────────────────────────────────────
// TUI reference (patterns 3 / 5):
//   <ul role="list" class="divide-y divide-gray-100">

export type ContentStackedListProps = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  children: ReactNode;
};

const ContentStackedListRoot = forwardRef<HTMLUListElement, ContentStackedListProps>(
  function ContentStackedListRoot({ className, children, ...rest }, ref) {
    return (
      <ul
        ref={ref}
        role="list"
        className={clsx('divide-y divide-gray-100 dark:divide-white/5', className)}
        {...rest}
      >
        {children}
      </ul>
    );
  }
);

// ── Dot separator (TUI: <svg viewBox="0 0 2 2"><circle r=1 /></svg>) ─────────

const Dot = () => (
  <svg viewBox="0 0 2 2" className="size-0.5 flex-none fill-current" aria-hidden>
    <circle r="1" cx="1" cy="1" />
  </svg>
);

// ── Item ─────────────────────────────────────────────────────────────────────
// TUI reference (Pattern 5 simplified):
//   <li class="flex items-center justify-between gap-x-6 py-5">
//     <div class="min-w-0">
//       <div class="flex items-start gap-x-3">
//         <p class="text-sm/6 font-semibold text-gray-900">{title}</p>
//         {badge}
//       </div>
//       <div class="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
//         {meta.map(item => <Fragment>{item}{i<n-1 && <Dot />}</Fragment>)}
//       </div>
//     </div>
//     <div class="flex flex-none items-center gap-x-4">
//       {trailing}
//     </div>
//   </li>

export type ContentStackedListItemProps = LiHTMLAttributes<HTMLLIElement> & {
  /** Primary text (heading-like). Becomes a link if `href` is set. */
  title: ReactNode;
  /** Make the title a link. */
  href?: string;
  /** Optional inline badge rendered next to the title (pattern 5). */
  badge?: ReactNode;
  /** Inline meta items separated by a dot. Pass an array of ReactNodes. */
  meta?: ReactNode[];
  /** Right-aligned slot — typically an AvatarGroup (pattern 3) or a button + actions menu (pattern 5). */
  trailing?: ReactNode;
};

const ContentStackedListItem = forwardRef<HTMLLIElement, ContentStackedListItemProps>(
  function ContentStackedListItem({ title, href, badge, meta, trailing, className, ...rest }, ref) {
    const titleEl = href ? (
      <a href={href} className="text-gray-900 hover:underline dark:text-white">
        {title}
      </a>
    ) : (
      title
    );

    const metaItems = meta ?? [];
    const hasMeta = metaItems.length > 0;

    return (
      <li
        ref={ref}
        className={clsx('flex items-center justify-between gap-x-6 py-5', className)}
        {...rest}
      >
        <div className="min-w-0">
          <div className="flex items-start gap-x-3">
            <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">{titleEl}</p>
            {badge}
          </div>
          {hasMeta && (
            <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500 dark:text-gray-400">
              {Children.toArray(metaItems).map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <Dot />}
                  {item}
                </Fragment>
              ))}
            </div>
          )}
        </div>
        {trailing && <div className="flex flex-none items-center gap-x-4">{trailing}</div>}
      </li>
    );
  }
);

// ── Compound export ──────────────────────────────────────────────────────────

export const ContentStackedList = Object.assign(ContentStackedListRoot, {
  Item: ContentStackedListItem,
});
