import { clsx } from 'clsx';
import {
  Children,
  createContext,
  useContext,
  useId,
  useMemo,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { AppLink } from '../ui/AppLink';

export type SiteFooterVariant = 'full' | 'compact';
export type SiteFooterTheme = 'light' | 'dark';

// The light footer follows the page theme, like the light `Navbar`. The dark one stays dark on
// a light page: it sets its own text colour, and its parts take the dark column of each map.
const ROOT: Record<SiteFooterTheme, string> = {
  light:
    'border-t border-gray-200 bg-white text-gray-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-400',
  dark: 'bg-gray-800 text-gray-400',
};

const TITLE: Record<SiteFooterTheme, string> = {
  light: 'text-gray-900 dark:text-white',
  dark: 'text-white',
};

const RULE: Record<SiteFooterTheme, string> = {
  light: 'border-gray-200 dark:border-white/10',
  dark: 'border-white/10',
};

const BANNER: Record<SiteFooterTheme, string> = {
  light: 'bg-brand-50 text-gray-700 dark:bg-brand-500/10 dark:text-gray-300',
  dark: 'bg-white/5 text-gray-300',
};

// Idle and current are exclusive: a current link's hover colour would otherwise repaint it.
const LINK_IDLE: Record<SiteFooterTheme, string> = {
  light:
    'font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
  dark: 'font-medium text-gray-300 hover:text-white',
};

const LINK_CURRENT: Record<SiteFooterTheme, string> = {
  light: 'font-semibold text-gray-900 dark:text-white',
  dark: 'font-semibold text-white',
};

// What the parts read from their `<SiteFooter>`: parts rendered outside one take the defaults.
type SiteFooterContextValue = { variant: SiteFooterVariant; theme: SiteFooterTheme };
const SiteFooterContext = createContext<SiteFooterContextValue>({
  variant: 'full',
  theme: 'light',
});

// ── Root ─────────────────────────────────────────────────────────────────────

export type SiteFooterProps = ComponentPropsWithRef<'footer'> & {
  /**
   * `full` is the footer of a page: the brand, link columns, an end column and a bottom row.
   * `compact` puts the same parts on one line, for the pages where the big footer would push
   * the main action away (the cart, the checkout). Default `full`.
   */
  variant?: SiteFooterVariant;
  /**
   * `light` follows the page theme (white, gray-800 in the dark themes); `dark` stays dark in
   * every theme. The parts take it from here. Default `light`.
   */
  theme?: SiteFooterTheme;
  /** Constrain the content to a max-width column, as `Navbar` does. Default `7xl`. */
  maxWidth?: 'none' | '7xl';
  /**
   * The parts, in the order they are read: `SiteFooter.Banner`, `Brand`, `Column`, `Aside` and
   * `Bottom`. The banner goes above and the bottom row below whatever the order.
   */
  children: ReactNode;
};

function SiteFooterRoot({
  variant = 'full',
  theme = 'light',
  maxWidth = '7xl',
  className,
  children,
  ref,
  ...rest
}: SiteFooterProps) {
  const context = useMemo(() => ({ variant, theme }), [variant, theme]);
  return (
    <footer
      ref={ref}
      className={clsx(ROOT[theme], className)}
      data-theme={theme}
      data-variant={variant}
      {...rest}
    >
      <div className={clsx('px-4 sm:px-6 lg:px-8', maxWidth === '7xl' && 'mx-auto max-w-7xl')}>
        {/* One wrapping row: each part says how much of it it takes, so the parts stay free to
            come in any number and order, and to sit inside a component of the page. */}
        <div
          className={clsx(
            'flex flex-wrap gap-x-6',
            variant === 'full' ? 'items-start gap-y-8 pt-10 pb-5' : 'items-center gap-y-3 py-5'
          )}
        >
          <SiteFooterContext.Provider value={context}>{children}</SiteFooterContext.Provider>
        </div>
      </div>
    </footer>
  );
}

// ── Link ─────────────────────────────────────────────────────────────────────

export type SiteFooterLinkProps = ComponentPropsWithRef<'a'>;

/**
 * A link of the footer, drawn through `LinkProvider` like the links of the other components.
 * `aria-current="page"` marks the current page, in bolder, stronger text.
 */
function SiteFooterLink({ className, ref, ...rest }: SiteFooterLinkProps) {
  const { theme } = useContext(SiteFooterContext);
  const ariaCurrent = rest['aria-current'];
  const current = !!ariaCurrent && ariaCurrent !== 'false';
  return (
    <AppLink
      ref={ref}
      className={clsx(
        'focus-visible:focus-indicator rounded-sm text-sm transition-colors',
        current ? LINK_CURRENT[theme] : LINK_IDLE[theme],
        className
      )}
      {...rest}
    />
  );
}

// ── Title ────────────────────────────────────────────────────────────────────

export type SiteFooterTitleProps = ComponentPropsWithRef<'h2'>;

/**
 * The heading of a column. Also for a group of your own in `Aside` or `Banner`, so it looks like
 * the others and follows `theme`; name the group with `aria-labelledby`.
 */
function SiteFooterTitle({ className, ref, ...rest }: SiteFooterTitleProps) {
  const { theme } = useContext(SiteFooterContext);
  return (
    <h2 ref={ref} className={clsx('text-sm font-semibold', TITLE[theme], className)} {...rest} />
  );
}

// ── Brand ────────────────────────────────────────────────────────────────────

export type SiteFooterBrandProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** Makes the logo and name a link, usually to the home page. */
  href?: string;
  /** A line under the name. Only the `full` variant shows it. */
  description?: ReactNode;
  /** The logo and the name: any node, as in `Navbar.Brand`. */
  children: ReactNode;
};

function SiteFooterBrand({
  href,
  description,
  className,
  children,
  ref,
  ...rest
}: SiteFooterBrandProps) {
  const { variant, theme } = useContext(SiteFooterContext);
  const name = clsx(
    'inline-flex items-center gap-2 font-semibold',
    variant === 'full' ? 'text-lg' : 'text-base',
    TITLE[theme]
  );
  return (
    <div
      ref={ref}
      className={clsx(
        'min-w-0',
        variant === 'full'
          ? 'basis-full lg:grow-3 lg:basis-0'
          : 'basis-full lg:shrink-0 lg:basis-auto',
        className
      )}
      {...rest}
    >
      {href ? (
        <AppLink href={href} className={clsx(name, 'focus-visible:focus-indicator rounded-sm')}>
          {children}
        </AppLink>
      ) : (
        <span className={name}>{children}</span>
      )}
      {variant === 'full' && description && (
        <p className="mt-3 max-w-[30ch] text-sm leading-relaxed">{description}</p>
      )}
    </div>
  );
}

// ── Column ───────────────────────────────────────────────────────────────────

export type SiteFooterColumnProps = Omit<ComponentPropsWithRef<'nav'>, 'title'> & {
  /** The heading of the column, and the name of its `nav`. The compact variant hides it. */
  title: ReactNode;
  /** `SiteFooter.Link`s: each one goes in a list item. */
  children: ReactNode;
};

function SiteFooterColumn({ title, className, children, ref, ...rest }: SiteFooterColumnProps) {
  const { variant } = useContext(SiteFooterContext);
  const titleId = useId();
  const full = variant === 'full';
  return (
    <nav
      ref={ref}
      aria-labelledby={titleId}
      className={clsx(
        'min-w-0',
        full
          ? 'basis-[calc((100%_-_1.5rem)/2)] sm:basis-[calc((100%_-_3rem)/3)] lg:grow-2 lg:basis-0'
          : 'basis-full lg:basis-auto',
        className
      )}
      {...rest}
    >
      {/* In the compact variant the heading stays: it is what names the nav. */}
      <SiteFooterTitle id={titleId} className={full ? 'mb-3' : 'sr-only'}>
        {title}
      </SiteFooterTitle>
      <ul className={full ? 'grid gap-2.5' : 'flex flex-wrap gap-x-4 gap-y-1'}>
        {Children.map(children, (child) => (
          <li>{child}</li>
        ))}
      </ul>
    </nav>
  );
}

// ── Aside ────────────────────────────────────────────────────────────────────

export type SiteFooterAsideProps = ComponentPropsWithRef<'div'>;

/**
 * A free slot at the end: a newsletter form, social links, anything. In the compact variant it
 * ends the line. To name it, give it `role="group"` and `aria-labelledby` the id of a
 * `SiteFooter.Title`.
 */
function SiteFooterAside({ className, ref, ...rest }: SiteFooterAsideProps) {
  const { variant } = useContext(SiteFooterContext);
  return (
    <div
      ref={ref}
      className={clsx(
        'min-w-0',
        variant === 'full'
          ? 'basis-full lg:grow-4 lg:basis-0'
          : 'basis-full lg:ms-auto lg:basis-auto',
        className
      )}
      {...rest}
    />
  );
}

// ── Banner ───────────────────────────────────────────────────────────────────

export type SiteFooterBannerProps = ComponentPropsWithRef<'div'>;

/**
 * A full-width band above the columns, for a call to action such as the newsletter. It takes
 * any content and goes first, wherever it is among the parts.
 */
function SiteFooterBanner({ className, ref, ...rest }: SiteFooterBannerProps) {
  const { theme } = useContext(SiteFooterContext);
  return (
    <div
      ref={ref}
      className={clsx(
        'order-first mb-2 flex basis-full flex-wrap items-center justify-between gap-x-8 gap-y-5 rounded-2xl p-6',
        BANNER[theme],
        className
      )}
      {...rest}
    />
  );
}

// ── Bottom ───────────────────────────────────────────────────────────────────

export type SiteFooterBottomLink = Omit<ComponentPropsWithRef<'a'>, 'children' | 'href'> & {
  label: ReactNode;
  href: string;
};

export type SiteFooterBottomProps = ComponentPropsWithRef<'div'> & {
  /** Legal links (terms, privacy, cookie settings), in a `nav` after the text. */
  links?: SiteFooterBottomLink[];
  /** Name of the legal links' `nav`. Default `Legal`. */
  linksLabel?: string;
};

/**
 * The last row: the copyright as children, the legal links as `links`. In the `full` variant it
 * goes under everything, with a rule above it, whatever its place among the parts.
 */
function SiteFooterBottom({
  links,
  linksLabel = 'Legal',
  className,
  children,
  ref,
  ...rest
}: SiteFooterBottomProps) {
  const { variant, theme } = useContext(SiteFooterContext);
  const full = variant === 'full';
  return (
    <div
      ref={ref}
      className={clsx(
        'flex flex-wrap items-center text-sm',
        full
          ? clsx(
              'order-last mt-2 basis-full justify-between gap-x-6 gap-y-2 border-t pt-5',
              RULE[theme]
            )
          : 'basis-full gap-x-4 gap-y-1 lg:basis-auto',
        className
      )}
      {...rest}
    >
      {children}
      {links && links.length > 0 && (
        <nav aria-label={linksLabel}>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
            {links.map(({ label, ...link }, index) => (
              <li key={`${index}-${link.href}`}>
                <SiteFooterLink {...link}>{label}</SiteFooterLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

/**
 * The footer of a public page, the counterpart of `Navbar`: a `footer` landmark (`contentinfo`
 * when it follows `main` rather than sits inside it), built from `Brand`, link `Column`s with
 * their heading, a free `Aside`, an optional `Banner` and a `Bottom` row. `variant="compact"`
 * puts them on one line.
 */
export const SiteFooter = Object.assign(SiteFooterRoot, {
  Brand: SiteFooterBrand,
  Column: SiteFooterColumn,
  Link: SiteFooterLink,
  Title: SiteFooterTitle,
  Aside: SiteFooterAside,
  Banner: SiteFooterBanner,
  Bottom: SiteFooterBottom,
});
