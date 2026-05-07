import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type ErrorPageProps = {
  /** Big numeric code displayed prominently — e.g. `404`, `500`, `503`. */
  code: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Optional illustration (image, SVG, or animated component) shown above the code. */
  illustration?: ReactNode;
  /** Action buttons (typically two: primary + secondary). */
  actions?: ReactNode;
  className?: string;
};

/**
 * ErrorPage — generic full-page error layout reusable for 4xx / 5xx /
 * maintenance screens. Provide your own `illustration`, `actions`, and
 * `code`/`title` per scenario.
 *
 * Example (404):
 *   <ErrorPage
 *     code={404}
 *     title="Page not found"
 *     description="Sorry, the page you're looking for doesn't exist."
 *     actions={
 *       <>
 *         <Button as="a" href="/">Go home</Button>
 *         <Button variant="secondary" onClick={() => history.back()}>Back</Button>
 *       </>
 *     }
 *   />
 */
export const ErrorPage = ({
  code,
  title,
  description,
  illustration,
  actions,
  className,
}: ErrorPageProps) => (
  <div
    className={clsx(
      'flex min-h-[500px] flex-col items-center justify-center px-6 text-center',
      className
    )}
  >
    {illustration}
    <p className="text-brand-100 dark:text-brand-500/20 mt-2 text-8xl font-black">{code}</p>
    <h1 className="-mt-4 text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
    {description && (
      <p className="mt-3 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
    )}
    {actions && (
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>
    )}
  </div>
);
