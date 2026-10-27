import { clsx } from 'clsx';
import { createContext, useContext, type ReactNode, type ComponentPropsWithRef } from 'react';

// TUI Plus reference (Pattern 1 — "Left-aligned"):
//   <div>
//     <div class="px-4 sm:px-0">
//       <h3 class="text-base/7 font-semibold text-gray-900">Applicant Information</h3>
//       <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">Personal details and application.</p>
//     </div>
//     <div class="mt-6 border-t border-gray-100">
//       <dl class="divide-y divide-gray-100">
//         <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
//           <dt class="text-sm/6 font-medium text-gray-900">Full name</dt>
//           <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">Margot Foster</dd>
//         </div>
//         …
//       </dl>
//     </div>
//   </div>
//
// Pattern 2 — "Left-aligned in card": wraps the <dl> in a card surface with
// border + rounded + shadow.

// The list's `compact` mode reaches its items without a prop on each of them.
const CompactContext = createContext(false);

// ── Item ─────────────────────────────────────────────────────────────────────

export type DescriptionListItemProps = ComponentPropsWithRef<'div'> & {
  /** Label (`<dt>`). */
  label: ReactNode;
  /** Render the value in a monospace font (IDs, hashes, paths…). */
  mono?: boolean;
  /** Value (`<dd>`). */
  children: ReactNode;
};

function Item({
  label,
  mono = false,
  children,
  className,
  ref,
  ...rest
}: DescriptionListItemProps) {
  const compact = useContext(CompactContext);
  if (compact) {
    return (
      <div
        ref={ref}
        className={clsx('py-row-10 flex items-center justify-between gap-x-4', className)}
        {...rest}
      >
        <dt className="text-sm text-[var(--color-text-secondary)]">{label}</dt>
        <dd
          className={clsx(
            'text-sm font-medium text-[var(--color-text-primary)]',
            mono && 'font-mono text-xs'
          )}
        >
          {children}
        </dd>
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className={clsx('py-row-24 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0', className)}
      {...rest}
    >
      <dt className="text-sm/6 font-medium text-gray-900 dark:text-white">{label}</dt>
      <dd
        className={clsx(
          'mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300',
          mono && 'font-mono'
        )}
      >
        {children}
      </dd>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export type DescriptionListProps = ComponentPropsWithRef<'dl'> & {
  /** Optional header title (rendered above the list). */
  title?: ReactNode;
  /** Optional header description (rendered below the title). */
  description?: ReactNode;
  /**
   * When `true`, wraps the list in a card surface with border + rounded +
   * shadow (TUI "Left-aligned in card" pattern).
   */
  inCard?: boolean;
  /**
   * When `true`, items get an alternating gray background (TUI "Left-aligned
   * striped" pattern). Implementation uses `even:bg-gray-50`.
   */
  striped?: boolean;
  /**
   * When `true`, items are flat label/value rows, the label on the left and the value on the
   * right, for the metadata of a card (ID, template, last seen…). The default items are
   * wide, with the label above the value on a phone.
   */
  compact?: boolean;
  children: ReactNode;
};

function DescriptionListRoot({
  title,
  description,
  inCard = false,
  striped = false,
  compact = false,
  className,
  children,
  ref,
  ...rest
}: DescriptionListProps) {
  const dl = (
    <CompactContext value={compact}>
      <dl
        ref={ref}
        className={clsx(
          'divide-y divide-gray-100 dark:divide-white/5',
          striped &&
            '[&>div:nth-child(even)]:bg-gray-50 dark:[&>div:nth-child(even)]:bg-white/[0.03]',
          inCard && 'px-4 sm:px-6',
          className
        )}
        {...rest}
      >
        {children}
      </dl>
    </CompactContext>
  );

  const header =
    title || description ? (
      <div className={clsx(inCard ? 'px-4 pt-6 pb-4 sm:px-6' : 'px-4 sm:px-0')}>
        {title && (
          <h3 className="text-base/7 font-semibold text-gray-900 dark:text-white">{title}</h3>
        )}
        {description && (
          <p className="mt-1 max-w-2xl text-sm/6 text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    ) : null;

  if (inCard) {
    return (
      <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-xl dark:bg-gray-900 dark:ring-white/10">
        {header}
        {!header && null}
        <div className="border-t border-gray-100 dark:border-white/10">{dl}</div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className={clsx(header && 'mt-6 border-t border-gray-100 dark:border-white/10')}>
        {dl}
      </div>
    </div>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

export const DescriptionList = Object.assign(DescriptionListRoot, { Item });
