import { clsx } from 'clsx';
import type { ComponentType, ReactNode } from 'react';

export type AuthLayoutProps = {
  /** Brand icon component (lucide). Renders inside a brand-colored square above the title. */
  logo?: ComponentType<{ className?: string }>;
  /** Brand name shown below the logo. */
  title?: string;
  /** Tagline shown below the title. */
  subtitle?: string;
  /**
   * Override the entire brand block (logo + title + subtitle).
   * Pass `null` to render no brand block.
   */
  brand?: ReactNode;
  /** Form content rendered inside the card, below the brand block. */
  children: ReactNode;
  className?: string;
};

/**
 * AuthLayout — single-card centered layout for authentication pages.
 *
 * The card sits on a muted page background (gray-50 light / gray-950 dark)
 * with a small shadow and a soft border. The brand block (logo + title +
 * subtitle) is rendered *inside* the card, above the form children.
 *
 *   - No props or only `children`        → form-only card.
 *   - `logo` / `title` / `subtitle`      → built-in centered brand block.
 *   - `brand={...}`                      → fully custom brand block.
 *   - `brand={null}`                     → no brand block (form only).
 */
export const AuthLayout = ({
  logo: Logo,
  title,
  subtitle,
  brand,
  children,
  className,
}: AuthLayoutProps) => {
  const showBuiltInBrand = brand === undefined && (Logo || title || subtitle);
  const renderBrand =
    brand !== undefined
      ? brand // includes `null` → renders nothing
      : showBuiltInBrand
        ? (
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              {Logo && (
                <div className="bg-brand-500 flex h-12 w-12 items-center justify-center rounded-xl text-white">
                  <Logo className="h-6 w-6" />
                </div>
              )}
              {title && (
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          )
        : null;

  return (
    <div
      className={clsx(
        'flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950',
        className,
      )}
    >
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {renderBrand}
          {children}
        </div>
      </div>
    </div>
  );
};
