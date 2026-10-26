import { clsx } from 'clsx';
import { ExternalLink } from 'lucide-react';
import type { ReactNode, ComponentPropsWithRef } from 'react';
import { AppLink } from './AppLink';

export type LinkVariant = 'colored' | 'underline' | 'opacity' | 'opacity-hover' | 'subtle';

export type LinkProps = ComponentPropsWithRef<'a'> & {
  /**
   * Look of the link. Default `colored`: the accent, for a link that stands out of the text.
   * `underline` is dark text with an underline, the one for a link inside a sentence.
   * `opacity` and `opacity-hover` are body text that fades on hover: `opacity` rests at 70% and
   * brightens, `opacity-hover` rests full and dims. `subtle` is muted gray, for a secondary
   * link; at rest it is close to `opacity`, they differ on hover (`subtle` darkens a step,
   * `opacity` goes to full strength).
   */
  variant?: LinkVariant;
  /**
   * When true, opens in a new tab with `rel="noopener noreferrer"` and renders an external
   * icon. A `rel` you pass is added to those tokens, never replaces them.
   */
  external?: boolean;
  /** Hide the auto-added external icon when `external` is true. */
  hideExternalIcon?: boolean;
  children?: ReactNode;
};

const VARIANT_CLASS: Record<LinkVariant, string> = {
  colored: 'text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300',
  underline:
    'text-gray-900 underline underline-offset-2 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-400',
  // gray-900 at 70% keeps 4.5:1 on the light themes' page (gray-700 was 4.2:1).
  opacity: 'text-gray-900 opacity-70 hover:opacity-100 dark:text-gray-200',
  'opacity-hover': 'text-gray-700 transition-opacity hover:opacity-70 dark:text-gray-200',
  subtle: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
};

// A caller's rel adds to the safe tokens, it never replaces them.
const mergeRel = (rel?: string): string =>
  [...new Set(['noopener', 'noreferrer', ...(rel?.split(/\s+/).filter(Boolean) ?? [])])].join(' ');

export function Link({
  variant = 'colored',
  external = false,
  hideExternalIcon = false,
  target,
  rel,
  className,
  children,
  ref,
  ...rest
}: LinkProps) {
  const finalTarget = external ? (target ?? '_blank') : target;
  const finalRel = external ? mergeRel(rel) : rel;
  return (
    <AppLink
      ref={ref}
      target={finalTarget}
      rel={finalRel}
      className={clsx(
        'focus-visible:focus-indicator inline-flex items-center gap-1 text-sm font-medium transition-colors focus-visible:rounded',
        VARIANT_CLASS[variant],
        className
      )}
      {...rest}
    >
      {children}
      {external && !hideExternalIcon && (
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
    </AppLink>
  );
}
