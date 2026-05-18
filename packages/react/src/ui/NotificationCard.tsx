import { clsx } from 'clsx';
import { CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// TUI Plus reference (Pattern 1 — "Simple"):
//   <div class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5">
//     <div class="p-4">
//       <div class="flex items-start">
//         <div class="shrink-0"><CheckCircle … /></div>
//         <div class="ml-3 w-0 flex-1 pt-0.5">
//           <p class="text-sm font-medium text-gray-900">Successfully saved!</p>
//           <p class="mt-1 text-sm text-gray-500">Anyone with a link can now view this file.</p>
//         </div>
//         <div class="ml-4 flex shrink-0"><button>close</button></div>
//       </div>
//     </div>
//   </div>
//
// Pattern 2 — "Condensed" (dark theme by default):
//   <div class="pointer-events-auto flex w-full max-w-md divide-x divide-white/10 rounded-lg bg-gray-900 shadow-lg ring-1 ring-black/5">
//     <div class="flex w-0 flex-1 items-center p-4">
//       <p class="text-sm font-medium text-white">Discussion archived</p>
//     </div>
//     <div class="flex"><div class="flex flex-col divide-y divide-white/10">
//       <button class="text-indigo-400">Undo</button>
//       <button class="text-gray-300">Dismiss</button>
//     </div></div>
//   </div>

export type NotificationIntent = 'success' | 'info' | 'error';

const INTENT_ICON: Record<NotificationIntent, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  error: XCircle,
};

const INTENT_COLOR: Record<NotificationIntent, string> = {
  success: 'text-green-400',
  info: 'text-blue-400',
  error: 'text-red-400',
};

// ── Simple variant ───────────────────────────────────────────────────────────

export type NotificationCardSimpleProps = {
  /** Primary text (TUI: text-sm font-medium text-gray-900). */
  title: ReactNode;
  /** Secondary text under the title. */
  description?: ReactNode;
  /** Visual intent for the leading icon. Default `success`. */
  intent?: NotificationIntent;
  /** Override the icon entirely (replaces the intent-derived one). */
  icon?: LucideIcon;
  /** When provided, renders an X button that calls this on click. */
  onDismiss?: () => void;
  className?: string;
};

const SimpleVariant = ({
  title,
  description,
  intent = 'success',
  icon,
  onDismiss,
  className,
}: NotificationCardSimpleProps) => {
  const Icon = icon ?? INTENT_ICON[intent];
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10',
        className,
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="shrink-0">
            <Icon className={clsx('size-6', INTENT_COLOR[intent])} aria-hidden />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          {onDismiss && (
            <div className="ml-4 flex shrink-0">
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss notification"
                className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:hover:text-gray-300"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Condensed variant ────────────────────────────────────────────────────────

export type NotificationCardCondensedProps = {
  /** Primary text shown on the left. */
  title: ReactNode;
  /** Inline action label (e.g., "Undo") — rendered as a link-styled button. */
  actionLabel?: ReactNode;
  /** Called when the action is clicked. Required when `actionLabel` is set. */
  onAction?: () => void;
  /** When provided, renders a trailing X button. */
  onDismiss?: () => void;
  className?: string;
};

const CondensedVariant = ({
  title,
  actionLabel,
  onAction,
  onDismiss,
  className,
}: NotificationCardCondensedProps) => (
  <div
    role="status"
    aria-live="polite"
    className={clsx(
      'pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10',
      className,
    )}
  >
    <p className="flex-1 text-sm font-medium text-white">{title}</p>
    {actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="text-sm font-medium text-indigo-400 hover:text-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        {actionLabel}
      </button>
    )}
    {onDismiss && (
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="inline-flex rounded-md text-gray-400 hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        <X className="size-5" aria-hidden />
      </button>
    )}
  </div>
);

// ── Compound export ──────────────────────────────────────────────────────────

const Root = SimpleVariant;
export const NotificationCard = Object.assign(Root, {
  Simple: SimpleVariant,
  Condensed: CondensedVariant,
});
