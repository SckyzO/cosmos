import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

/**
 * Cosmos toast — thin wrapper around sonner.
 *
 * Mount the `<Toaster />` once at the app root. Trigger toasts from anywhere
 * with `toast(...)`, `toast.success(...)`, `toast.error(...)`, `toast.promise(...)`.
 *
 * Cosmos defaults: bottom-right, system theme, rich-colors on, close button on.
 * Override per-instance by passing props.
 */

export type CosmosToasterProps = ToasterProps;

export const Toaster = (props: CosmosToasterProps) => (
  <SonnerToaster
    position="bottom-right"
    theme="system"
    richColors
    closeButton
    duration={4000}
    toastOptions={{
      classNames: {
        toast:
          'group rounded-xl border border-gray-200 bg-white text-sm text-gray-900 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white',
        title: 'text-sm font-semibold',
        description: 'text-xs text-gray-600 dark:text-gray-400',
        actionButton: 'rounded-md bg-brand-500 px-2.5 py-1 text-xs font-medium text-white',
        cancelButton:
          'rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200',
        closeButton:
          'rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200',
      },
    }}
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
