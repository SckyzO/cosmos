import * as RadixAccordion from '@radix-ui/react-accordion';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';

// ── Root ─────────────────────────────────────────────────────────────────────

export type AccordionProps = ComponentPropsWithRef<typeof RadixAccordion.Root> & {
  /** Visual variant. `bordered` (default) wraps each item in a border; `seamless` strips borders for a tighter look. */
  appearance?: 'bordered' | 'seamless';
};

function AccordionRoot({
  appearance = 'bordered',
  className,
  children,
  ref,
  ...rest
}: AccordionProps) {
  return (
    <RadixAccordion.Root
      ref={ref}
      className={clsx(
        'block',
        appearance === 'bordered' &&
          'overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
        className
      )}
      {...rest}
    >
      {children}
    </RadixAccordion.Root>
  );
}

// ── Item ─────────────────────────────────────────────────────────────────────

export type AccordionItemProps = ComponentPropsWithRef<typeof RadixAccordion.Item>;

function AccordionItem({ className, ref, ...rest }: AccordionItemProps) {
  return (
    <RadixAccordion.Item
      ref={ref}
      className={clsx('border-b border-gray-100 last:border-b-0 dark:border-gray-800', className)}
      {...rest}
    />
  );
}

// ── Trigger (folds Radix Header inside) ──────────────────────────────────────

export type AccordionTriggerProps = ComponentPropsWithRef<typeof RadixAccordion.Trigger> & {
  children: ReactNode;
  /** Hide the chevron indicator. Default `false`. */
  hideChevron?: boolean;
};

function AccordionTrigger({
  className,
  children,
  hideChevron = false,
  ref,
  ...rest
}: AccordionTriggerProps) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        ref={ref}
        className={clsx(
          'group focus-visible:focus-indicator flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus-visible:ring-inset dark:text-white dark:hover:bg-white/5',
          className
        )}
        {...rest}
      >
        <span className="flex-1">{children}</span>
        {!hideChevron && (
          <ChevronDown
            className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        )}
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
}

// ── Content ──────────────────────────────────────────────────────────────────

export type AccordionContentProps = ComponentPropsWithRef<typeof RadixAccordion.Content>;

function AccordionContent({ className, children, ref, ...rest }: AccordionContentProps) {
  return (
    <RadixAccordion.Content
      ref={ref}
      // Animate using Radix's CSS var `--radix-accordion-content-height`.
      // `motion-safe` honours `prefers-reduced-motion`.
      className={clsx(
        'overflow-hidden text-sm text-gray-700 motion-safe:data-[state=closed]:animate-[accordionUp_180ms_ease-out] motion-safe:data-[state=open]:animate-[accordionDown_180ms_ease-out] dark:text-gray-300',
        className
      )}
      {...rest}
    >
      <div className="px-4 pt-0 pb-4">{children}</div>
      <style>{`
        @keyframes accordionDown {
          from { height: 0; }
          to { height: var(--radix-accordion-content-height); }
        }
        @keyframes accordionUp {
          from { height: var(--radix-accordion-content-height); }
          to { height: 0; }
        }
      `}</style>
    </RadixAccordion.Content>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});
