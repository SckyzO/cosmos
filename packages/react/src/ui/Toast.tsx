import { clsx } from 'clsx';
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';
import { useCosmosTheme } from '../settings/useCosmosTheme';
import { INTENT_ICON_SIZE, INTENT_STYLE, type Intent } from './intent';

type StatusIntent = Extract<Intent, 'success' | 'info' | 'warning' | 'danger'>;

// `INTENT_STYLE.surface` tints the dark themes with `-500/10`, a translucent layer: laid on a toast
// that floats over the page, the page shows through the card. The same tint mixed with the panel
// color is one opaque layer (`srgb`, the space an alpha layer is blended in, so a banner and a
// toast on the panel read alike). Tailwind scans for whole class names, so each is written out.
const DARK_FILL: Record<StatusIntent, string> = {
  success: 'dark:bg-[color-mix(in_srgb,var(--color-green-500)_10%,var(--color-bg-panel))]',
  info: 'dark:bg-[color-mix(in_srgb,var(--color-blue-500)_10%,var(--color-bg-panel))]',
  warning: 'dark:bg-[color-mix(in_srgb,var(--color-amber-500)_10%,var(--color-bg-panel))]',
  danger: 'dark:bg-[color-mix(in_srgb,var(--color-red-500)_10%,var(--color-bg-panel))]',
};

// The border and the light background of the banner surface, without its translucent dark one.
const withoutDarkFill = (surface: string) =>
  surface
    .split(' ')
    .filter((name) => !name.startsWith('dark:bg-'))
    .join(' ');

// A status toast: the banner border and background, the intent color on the title (the
// description stays neutral).
const statusToast = (intent: StatusIntent) =>
  clsx(withoutDarkFill(INTENT_STYLE[intent].surface), DARK_FILL[intent], INTENT_STYLE[intent].text);

// The icon of the intent, in its color: sonner no longer colors it (no `richColors`).
const statusIcon = (intent: StatusIntent) => {
  const { icon: Icon, iconColor } = INTENT_STYLE[intent];
  return <Icon className={clsx(INTENT_ICON_SIZE.inline, iconColor)} />;
};

const NEUTRAL =
  'border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white';

// With `unstyled`, sonner draws nothing: every part is a Cosmos class, as written. The layout
// that sonner keeps for itself (position, size, stacking, transitions) is left alone. The type
// keys are exclusive (a toast gets exactly one: `default` for `toast()`, `loading` for
// `toast.loading()`), so the color classes never compete with the layout ones in `toast`.
//
// Three rules of sonner's dark theme are not scoped to its styled mode and carry more
// specificity than a class, so the parts they reach take `!` in the dark themes: the description
// color and the close button colors (`data-sonner-theme='dark'` sets them to its own grays).
const CLASS_NAMES = {
  // The last class hides the content of the toasts stacked behind the front one, as sonner does
  // for its styled toasts.
  toast:
    'group flex w-(--width) items-center gap-2.5 rounded-xl border p-4 text-sm shadow-lg data-[expanded=false]:data-[front=false]:*:opacity-0',
  default: NEUTRAL,
  loading: NEUTRAL,
  success: statusToast('success'),
  info: statusToast('info'),
  warning: statusToast('warning'),
  error: statusToast('danger'),
  icon: 'relative flex size-4 shrink-0 items-center justify-center',
  content: 'flex min-w-0 flex-1 flex-col gap-0.5',
  title: 'text-sm font-semibold',
  description: 'text-xs text-gray-600 dark:text-gray-400!',
  actionButton:
    'focus-visible:focus-indicator flex shrink-0 cursor-pointer items-center rounded-md bg-brand-500 px-2.5 py-1 text-xs font-medium text-white',
  cancelButton:
    'focus-visible:focus-indicator flex shrink-0 cursor-pointer items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  closeButton:
    'focus-visible:focus-indicator absolute start-0 top-0 z-1 flex size-5 -translate-y-[35%] items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 ltr:-translate-x-[35%] rtl:translate-x-[35%] dark:border-gray-700! dark:bg-gray-900! dark:text-gray-400! dark:hover:bg-gray-800! dark:hover:text-gray-200!',
};

const ICONS = {
  success: statusIcon('success'),
  info: statusIcon('info'),
  warning: statusIcon('warning'),
  error: statusIcon('danger'),
};

/**
 * Cosmos toast — thin wrapper around sonner.
 *
 * Mount the `<Toaster />` once at the app root. Trigger toasts from anywhere
 * with `toast(...)`, `toast.success(...)`, `toast.error(...)`, `toast.promise(...)`.
 *
 * Cosmos defaults: bottom-right, light or dark from the Cosmos theme class on
 * `<html>` (not the OS setting), close button on. The toasts are drawn by Cosmos
 * classes (`toastOptions.unstyled`), not by sonner: `success`, `info`, `warning`
 * and `error` take the `INTENT_STYLE` palette of `AlertBanner` on an opaque
 * surface, every other toast the neutral card. Override per-instance by passing
 * props; a `toastOptions` of your own replaces the one of Cosmos, `unstyled` and
 * the classes with it.
 */

export type CosmosToasterProps = ToasterProps;

export const Toaster = (props: CosmosToasterProps) => (
  <SonnerToaster
    position="bottom-right"
    theme={useCosmosTheme()}
    closeButton
    duration={4000}
    icons={ICONS}
    toastOptions={{ unstyled: true, classNames: CLASS_NAMES }}
    {...props}
  />
);

// Re-export the trigger function as `toast`. Includes `toast.success`,
// `toast.error`, `toast.warning`, `toast.info`, `toast.loading`,
// `toast.promise`, `toast.dismiss`.
//
// Re-exported directly from sonner (rather than aliased through a local
// `const toast = sonnerToast`) because sonner's `.promise(...)` signature
// references an internal `PromiseIExtendedResult` type that isn't part of
// its public exports — re-exporting in place keeps the binding pointing at
// the original symbol and avoids the TS4023 "cannot be named" error during
// `.d.ts` emission.
export { toast } from 'sonner';
