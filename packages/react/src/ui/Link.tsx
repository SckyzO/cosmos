import { clsx } from 'clsx';
import { ExternalLink } from 'lucide-react';
import type { ReactNode, ComponentPropsWithRef } from 'react';
import { AppLink } from './AppLink';
import type { Intent } from './intent';

export type LinkVariant = 'colored' | 'underline' | 'opacity' | 'opacity-hover' | 'subtle';
export type LinkIntent = Extract<Intent, 'brand' | 'success' | 'warning' | 'danger'>;

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
   * Color of a `colored` link: `brand` (default, the accent), `success`, `warning` or `danger`,
   * for a link that carries a meaning ("Retry", "Delete account"). The other variants have no
   * color of their own, so they ignore it.
   */
  intent?: LinkIntent;
  /**
   * When true, opens in a new tab with `rel="noopener noreferrer"` and renders an external
   * icon. A `rel` you pass is added to those tokens, never replaces them.
   */
  external?: boolean;
  /** Hide the auto-added external icon when `external` is true. */
  hideExternalIcon?: boolean;
  children?: ReactNode;
};

// Accent text is `-600` in light, the other intents `-700` (a `-600` green or amber drops under
// 4.5:1 on white); all `-400` in dark. Tailwind scans for whole class names, so each is written out.
const COLORED_CLASS: Record<LinkIntent, string> = {
  brand: 'text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300',
  success: 'text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300',
  warning: 'text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300',
  danger: 'text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300',
};

const VARIANT_CLASS: Record<Exclude<LinkVariant, 'colored'>, string> = {
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
  intent = 'brand',
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
        variant === 'colored' ? COLORED_CLASS[intent] : VARIANT_CLASS[variant],
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
