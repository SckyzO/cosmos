import { clsx } from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

/** The element a label is drawn as. Pick the one the page's outline or the form's markup needs. */
export type SectionLabelElement = 'p' | 'span' | 'h2' | 'h3' | 'h4' | 'div' | 'legend';

export type SectionLabelSize = 'sm' | 'md' | 'lg';

export type SectionLabelProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  children: ReactNode;
  /**
   * The element. Default `p`. A label that titles a group of controls or a block of the page keeps
   * its meaning: a heading (`h2`, `h3`, `h4`), a `legend` as the first child of a `fieldset`.
   */
  as?: SectionLabelElement;
  /** The text size: `sm` 10px (default), `md` 11px or `lg` 12px. */
  size?: SectionLabelSize;
};

// Tailwind scans for whole class names, so each is written out.
const SIZE_CLASS: Record<SectionLabelSize, string> = {
  sm: 'text-3xs',
  md: 'text-2xs',
  lg: 'text-xs',
};

/**
 * SectionLabel — small upper-cased label used as a quiet section divider
 * inside drawers, settings panels, and form groups.
 */
export const SectionLabel = ({
  as = 'p',
  size = 'sm',
  className,
  children,
  ...rest
}: SectionLabelProps) => {
  const Element: ElementType = as;
  return (
    <Element
      className={clsx(
        SIZE_CLASS[size],
        'font-semibold tracking-wider text-gray-500 uppercase rtl:tracking-normal dark:text-gray-400',
        className
      )}
      {...rest}
    >
      {children}
    </Element>
  );
};
