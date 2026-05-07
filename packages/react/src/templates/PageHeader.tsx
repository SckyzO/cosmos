import { type ReactNode } from 'react';

export type PageHeaderProps = {
  /** Main page title (h2) */
  title: string;
  /** Optional description shown below title (only when no breadcrumb) */
  description?: string;
  /** Breadcrumb shown below title (replaces description if provided) */
  breadcrumb?: ReactNode;
  /** Right-aligned actions (buttons, icon buttons, etc.) */
  actions?: ReactNode;
  className?: string;
};

/**
 * PageHeader — standard page header with title, breadcrumb or description, and actions.
 *
 * Use at the top of every page. If both `breadcrumb` and `description` are passed,
 * the breadcrumb wins (description is hidden — they're alternatives).
 */
export const PageHeader = ({
  title,
  description,
  breadcrumb,
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
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);
