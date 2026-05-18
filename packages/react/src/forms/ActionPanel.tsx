import { clsx } from 'clsx';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

// TUI Plus reference (Pattern 1 — "Simple"):
//   <div class="bg-white shadow-sm sm:rounded-lg">
//     <div class="px-4 py-5 sm:p-6">
//       <h3 class="text-base font-semibold text-gray-900">Manage subscription</h3>
//       <div class="mt-2 max-w-xl text-sm text-gray-500">
//         <p>Lorem ipsum dolor…</p>
//       </div>
//       <div class="mt-5">
//         <button class="…">Change plan</button>
//       </div>
//     </div>
//   </div>
//
// Pattern 4 — "With button at top right": switches to `sm:flex sm:items-start
// sm:justify-between`, action floats top-right next to title block.
// Pattern 7 — "Simple well": uses tinted gray bg instead of white card.

export type ActionPanelLayout = 'stacked' | 'inline';

export type ActionPanelProps = HTMLAttributes<HTMLDivElement> & {
  /** Section title (rendered as `<h3>`). */
  title: ReactNode;
  /** Body text shown under the title. */
  description?: ReactNode;
  /** Trailing action — button, link, toggle, etc. */
  action?: ReactNode;
  /**
   * Layout. `stacked` (default): action sits below the description.
   * `inline`: action floats top-right (TUI "With button at top right").
   */
  layout?: ActionPanelLayout;
  /**
   * Use a tinted gray surface instead of a white card (TUI "Simple well").
   */
  well?: boolean;
};

export const ActionPanel = forwardRef<HTMLDivElement, ActionPanelProps>(function ActionPanel(
  { title, description, action, layout = 'stacked', well = false, className, children, ...rest },
  ref
) {
  const surface = well
    ? 'rounded-lg bg-gray-50 dark:bg-gray-800/60'
    : 'bg-white shadow-sm sm:rounded-lg dark:bg-gray-900 dark:ring-1 dark:ring-white/10';

  const body = (
    <>
      <div className={layout === 'inline' ? 'sm:flex-1' : undefined}>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            {typeof description === 'string' ? <p>{description}</p> : description}
          </div>
        )}
        {layout === 'stacked' && children && <div className="mt-3">{children}</div>}
      </div>
      {action && (
        <div
          className={clsx(
            layout === 'inline'
              ? 'mt-3 sm:mt-0 sm:ml-6 sm:flex sm:shrink-0 sm:items-center'
              : 'mt-5'
          )}
        >
          {action}
        </div>
      )}
      {layout === 'inline' && children && <div className="mt-3 sm:w-full">{children}</div>}
    </>
  );

  return (
    <div ref={ref} className={clsx(surface, className)} {...rest}>
      <div
        className={clsx(
          'px-4 py-5 sm:p-6',
          layout === 'inline' && 'sm:flex sm:items-start sm:justify-between'
        )}
      >
        {body}
      </div>
    </div>
  );
});
