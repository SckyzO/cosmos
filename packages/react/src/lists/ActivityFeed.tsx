import { clsx } from 'clsx';
import {
  Children,
  forwardRef,
  isValidElement,
  type ComponentType,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
} from 'react';

// TUI Plus reference (Pattern 1 — "Simple with icons"):
//   <ul role="list" class="-mb-8">
//     {items.map((item, i) => (
//       <li>
//         <div class="relative pb-8">
//           {!isLast && (
//             <span class="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" />
//           )}
//           <div class="relative flex space-x-3">
//             <div>
//               <span class="flex size-10 items-center justify-center rounded-full bg-{intent}-500 ring-8 ring-white">
//                 <Icon class="size-5 text-white" />
//               </span>
//             </div>
//             <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
//               <div><p class="text-sm text-gray-500">{content}</p></div>
//               <div class="text-right text-sm whitespace-nowrap text-gray-500">{time}</div>
//             </div>
//           </div>
//         </div>
//       </li>
//     ))}
//   </ul>
//
// Connector style: dashed in TUI Plus 5 — we use a solid 2px line to match
// the canonical headless-ui-pro demo (the docs page itself shows solid
// `bg-gray-200`).

export type ActivityFeedIntent = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const INTENT_BG: Record<ActivityFeedIntent, string> = {
  neutral: 'bg-gray-400 dark:bg-gray-600',
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

// ── Item ─────────────────────────────────────────────────────────────────────

export type ActivityFeedItemProps = LiHTMLAttributes<HTMLLIElement> & {
  /** Lucide icon rendered inside the circle indicator. */
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  /** Color of the circle indicator. Default `neutral`. */
  intent?: ActivityFeedIntent;
  /** Right-aligned timestamp (text or `<time>`). */
  timestamp?: ReactNode;
  /** Main content (paragraph). */
  children: ReactNode;
  /** Internal — set by parent via cloneElement. */
  /** @internal */ __isLast?: boolean;
};

const Item = forwardRef<HTMLLIElement, ActivityFeedItemProps>(function ActivityFeedItem(
  { icon: Icon, intent = 'neutral', timestamp, children, className, __isLast = false, ...rest },
  ref
) {
  return (
    <li ref={ref} className={className} {...rest}>
      <div className="relative pb-8">
        {!__isLast && (
          <span
            aria-hidden
            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-white/10"
          />
        )}
        <div className="relative flex space-x-3">
          <div>
            <span
              className={clsx(
                'flex size-10 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900',
                INTENT_BG[intent]
              )}
            >
              <Icon className="size-5 text-white" aria-hidden />
            </span>
          </div>
          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{children}</div>
            </div>
            {timestamp && (
              <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                {timestamp}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
});

// ── Root ─────────────────────────────────────────────────────────────────────

export type ActivityFeedProps = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  children: ReactNode;
};

const Root = forwardRef<HTMLUListElement, ActivityFeedProps>(function ActivityFeedRoot(
  { className, children, ...rest },
  ref
) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <ul ref={ref} role="list" className={clsx('-mb-8', className)} {...rest}>
      {items.map((child, i) => {
        if (!isValidElement(child)) return child;
        const isLast = i === items.length - 1;
        // Inject __isLast without leaking TS error.
        const props = { __isLast: isLast };
        return (
          <child.type
            key={(child as { key?: string }).key ?? i}
            {...(child.props as object)}
            {...props}
          />
        );
      })}
    </ul>
  );
});

// ── Compound export ──────────────────────────────────────────────────────────

export const ActivityFeed = Object.assign(Root, { Item });
