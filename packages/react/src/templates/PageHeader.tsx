import { clsx } from 'clsx';
import { type ElementType, type ReactNode } from 'react';
import { INTENT_STYLE, type Intent } from '../ui/intent';

export type PageHeaderProps = {
  /** Main page title */
  title: string;
  /**
   * Heading element of the title. Default `h2`; a page whose Topbar title is plain text
   * (the default) passes `h1` so it keeps exactly one.
   */
  as?: 'h1' | 'h2';
  /** Optional description shown below title (only when no breadcrumb) */
  description?: string;
  /** Breadcrumb shown below title (replaces description if provided) */
  breadcrumb?: ReactNode;
  /**
   * Optional meta row shown below the title — typically a `flex gap-x-6` of
   * `<PageHeader.MetaItem icon=...>` children, mirroring the TUI "With meta
   * and actions" pattern. Renders alongside (below) `breadcrumb` and
   * `description`.
   */
  meta?: ReactNode;
  /**
   * Icon in a rounded tile left of the title and description: 48px, 40px below `sm`. It is
   * decorative (`aria-hidden`); the title says what the page is.
   */
  icon?: ElementType;
  /** Color of the icon tile, from `INTENT_STYLE`. Default `brand`. Needs `icon`. */
  iconIntent?: Intent;
  /** Right-aligned actions (buttons, icon buttons, etc.) */
  actions?: ReactNode;
  className?: string;
};

/**
 * PageHeader — standard page header with title, breadcrumb or description,
 * optional meta line, and actions.
 *
 * Use at the top of every page. If both `breadcrumb` and `description` are passed,
 * the breadcrumb wins (description is hidden — they're alternatives).
 */
const Root = ({
  title,
  as: Heading = 'h2',
  description,
  breadcrumb,
  meta,
  icon: Icon,
  iconIntent = 'brand',
  actions,
  className,
}: PageHeaderProps) => {
  const text = (
    <>
      <Heading className="text-xl font-bold text-[var(--color-text-primary)]">{title}</Heading>
      {breadcrumb && <div className="mt-1.5">{breadcrumb}</div>}
      {!breadcrumb && description && (
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
      )}
      {meta && (
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[var(--color-text-secondary)]">
          {meta}
        </div>
      )}
    </>
  );
  const intent = INTENT_STYLE[iconIntent];
  return (
    // The title column asks for 16rem: when that and the actions don't both fit
    // (a phone, a narrow pane), the actions wrap under the title instead of
    // squeezing it until its words run under the buttons.
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className ?? ''}`}>
      {Icon ? (
        <div className="flex min-w-0 grow basis-64 items-start gap-3.5">
          <span
            aria-hidden="true"
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12',
              intent.tile
            )}
          >
            <Icon className={clsx('h-5 w-5 sm:h-6 sm:w-6', intent.iconColor)} />
          </span>
          <div className="min-w-0 flex-1">{text}</div>
        </div>
      ) : (
        <div className="min-w-0 grow basis-64">{text}</div>
      )}
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
};

export type PageHeaderMetaItemProps = {
  /** Lucide icon (or any component accepting `className`). */
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  children: ReactNode;
};

/**
 * MetaItem — single icon+text item for the PageHeader `meta` slot.
 * Mirrors TUI: `<div class="flex items-center text-sm"><Icon class="mr-1.5 size-5" />Text</div>`.
 */
const MetaItem = ({ icon: Icon, children }: PageHeaderMetaItemProps) => (
  <div className="flex items-center">
    {Icon && <Icon className="mr-1.5 size-5 shrink-0 text-[var(--color-text-muted)]" aria-hidden />}
    {children}
  </div>
);

export const PageHeader = Object.assign(Root, { MetaItem });
