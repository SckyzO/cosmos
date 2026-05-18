import { type ReactNode } from 'react';

export type PageHeaderProps = {
  /** Main page title (h2) */
  title: string;
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
  description,
  breadcrumb,
  meta,
  actions,
  className,
}: PageHeaderProps) => (
  <div className={`flex items-start justify-between gap-4 ${className ?? ''}`}>
    <div className="min-w-0">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{title}</h2>
      {breadcrumb && <div className="mt-1.5">{breadcrumb}</div>}
      {!breadcrumb && description && (
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
      )}
      {meta && (
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[var(--color-text-secondary)]">
          {meta}
        </div>
      )}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

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
    {Icon && <Icon className="mr-1.5 size-5 text-[var(--color-text-muted)]" aria-hidden />}
    {children}
  </div>
);

export const PageHeader = Object.assign(Root, { MetaItem });
