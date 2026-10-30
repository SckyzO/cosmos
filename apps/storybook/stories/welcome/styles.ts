// The apps/storybook workspace has no `clsx`: a class list is joined here.
export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

// Classes shared by the sections of the Welcome page. Everything inside them is a Cosmos component.

/** The width of the page's content. */
export const PAGE = 'mx-auto w-full max-w-[1180px] px-5';

/** A surface: a card the page draws around its own content. */
export const CARD =
  'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] text-[var(--color-text-base)]';

// Links styled as buttons: a <Button> inside an <a> nests two interactive elements (invalid HTML,
// two tab stops per call to action).
const CTA =
  'focus-visible:focus-indicator h-ctrl-36 inline-flex items-center gap-2 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors hover:no-underline';
export const CTA_VARIANT = {
  primary: cx(CTA, 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm'),
  secondary: cx(
    CTA,
    'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
  ),
  ghost: cx(CTA, 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'),
};

/** Accent-coloured text link. */
export const TEXT_LINK =
  'focus-visible:focus-indicator text-brand-600 dark:text-brand-400 rounded-sm underline-offset-2 hover:underline';

export const MONO = 'font-mono text-2xs tracking-wide';
