import { clsx } from 'clsx';
import { ExternalLink } from 'lucide-react';
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';

export type LinkVariant = 'colored' | 'underline' | 'opacity' | 'opacity-hover' | 'subtle';

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: LinkVariant;
  /** When true, opens in a new tab with safe rel attrs and renders an external icon. */
  external?: boolean;
  /** Hide the auto-added external icon when `external` is true. */
  hideExternalIcon?: boolean;
  children?: ReactNode;
};

const VARIANT_CLASS: Record<LinkVariant, string> = {
  colored: 'text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300',
  underline:
    'text-gray-900 underline underline-offset-2 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-400',
  opacity: 'text-gray-700 opacity-70 hover:opacity-100 dark:text-gray-200',
  'opacity-hover': 'text-gray-700 transition-opacity hover:opacity-70 dark:text-gray-200',
  subtle: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    variant = 'colored',
    external = false,
    hideExternalIcon = false,
    target,
    rel,
    className,
    children,
    ...rest
  },
  ref
) {
  const finalTarget = external ? (target ?? '_blank') : target;
  const finalRel = external ? (rel ?? 'noopener noreferrer') : rel;
  return (
    <a
      ref={ref}
      target={finalTarget}
      rel={finalRel}
      className={clsx(
        'focus-visible:ring-brand-500/40 inline-flex items-center gap-1 text-sm font-medium transition-colors focus:outline-none focus-visible:rounded focus-visible:ring-2',
        VARIANT_CLASS[variant],
        className
      )}
      {...rest}
    >
      {children}
      {external && !hideExternalIcon && (
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
    </a>
  );
});
