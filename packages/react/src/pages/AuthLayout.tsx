import { clsx } from 'clsx';
import type { ComponentType, ReactNode } from 'react';

export type AuthLayoutVariant = 'card' | 'split' | 'cover';

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
  /**
   * Page structure: `card` (default) is a centered card, `split` puts the form beside a brand
   * panel (`aside`), `cover` centers the card over a full-bleed image or gradient (`cover`).
   * In every variant the built-in title is a paragraph, not a heading: the form brings its own
   * `h1`. A `brand` node of your own is rendered as written.
   */
  variant?: AuthLayoutVariant;
  /**
   * `split` only: the panel beside the form, from `lg` up (hidden below, where the brand block
   * shows above the form instead). Without it, a panel on the brand accent with the `logo`,
   * `title` and `subtitle`. Pass `null` for no panel. Rendered in an `<aside>`.
   */
  aside?: ReactNode;
  /** `split` only: which side the panel takes. Default `end`. */
  asidePosition?: 'start' | 'end';
  /**
   * `cover` only: the image behind the card, drawn under a dark scrim (`alt` is empty unless
   * given). Without it, a gradient of the accent's own shades.
   */
  cover?: { src: string; alt?: string };
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
 *
 * `variant="split"` and `variant="cover"` keep the same brand block and children; see the props.
 */
export const AuthLayout = ({
  logo: Logo,
  title,
  subtitle,
  brand,
  variant = 'card',
  aside,
  asidePosition = 'end',
  cover,
  children,
  className,
}: AuthLayoutProps) => {
  const showBuiltInBrand = brand === undefined && (Logo || title || subtitle);
  const renderBrand =
    brand !== undefined ? (
      brand // includes `null` → renders nothing
    ) : showBuiltInBrand ? (
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        {Logo && (
          <div className="bg-brand-500 flex h-12 w-12 items-center justify-center rounded-xl text-white">
            <Logo className="h-6 w-6" />
          </div>
        )}
        {title && <p className="text-xl font-bold text-gray-900 dark:text-white">{title}</p>}
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
    ) : null;

  const cardBox = (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {renderBrand}
      {children}
    </div>
  );

  if (variant === 'split') {
    // The built-in panel repeats the brand block, so it only exists when there is something to show.
    const panel =
      aside !== undefined ? (
        aside
      ) : Logo || title || subtitle ? (
        <div className="flex max-w-sm flex-col items-center gap-3.5 text-center text-white">
          {Logo && (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14">
              <Logo className="h-7 w-7" />
            </div>
          )}
          {title && <p className="text-3xl font-bold">{title}</p>}
          {subtitle && <p className="text-base leading-normal">{subtitle}</p>}
        </div>
      ) : null;
    const hasAside = panel !== null && panel !== false;
    return (
      <div
        className={clsx(
          'flex min-h-screen bg-[var(--color-bg-panel)] text-[var(--color-text-primary)]',
          className
        )}
      >
        <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className={clsx(hasAside && 'lg:hidden')}>{renderBrand}</div>
            {children}
          </div>
        </div>
        {hasAside && (
          <aside
            className={clsx(
              'bg-brand-600 hidden w-1/2 flex-none items-center justify-center p-12 lg:flex',
              asidePosition === 'start' && 'order-first'
            )}
          >
            {panel}
          </aside>
        )}
      </div>
    );
  }

  if (variant === 'cover') {
    return (
      <div
        className={clsx(
          'relative flex min-h-screen items-center justify-center overflow-hidden p-4',
          className
        )}
      >
        {cover ? (
          <>
            <img
              src={cover.src}
              alt={cover.alt ?? ''}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gray-950/60" aria-hidden />
          </>
        ) : (
          <div
            className="from-brand-700 via-brand-500 to-brand-300 absolute inset-0 bg-gradient-to-br"
            aria-hidden
          />
        )}
        <div className="relative w-full max-w-md">{cardBox}</div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950',
        className
      )}
    >
      <div className="w-full max-w-md">{cardBox}</div>
    </div>
  );
};
