import * as RadixAccordion from '@radix-ui/react-accordion';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';

// ── Root ─────────────────────────────────────────────────────────────────────

export type AccordionProps = ComponentPropsWithoutRef<typeof RadixAccordion.Root> & {
  /** Visual variant. `bordered` (default) wraps each item in a border; `seamless` strips borders for a tighter look. */
  appearance?: 'bordered' | 'seamless';
};

const AccordionRoot = forwardRef<
  ElementRef<typeof RadixAccordion.Root>,
  AccordionProps
>(function Accordion({ appearance = 'bordered', className, children, ...rest }, ref) {
  return (
    <RadixAccordion.Root
      ref={ref}
      className={clsx(
        'block',
        appearance === 'bordered' &&
          'overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
        className,
      )}
      {...rest}
    >
      {children}
    </RadixAccordion.Root>
  );
}) as React.ForwardRefExoticComponent<
  AccordionProps & React.RefAttributes<ElementRef<typeof RadixAccordion.Root>>
>;

// ── Item ─────────────────────────────────────────────────────────────────────

export type AccordionItemProps = ComponentPropsWithoutRef<typeof RadixAccordion.Item>;

const AccordionItem = forwardRef<
  ElementRef<typeof RadixAccordion.Item>,
  AccordionItemProps
>(function AccordionItem({ className, ...rest }, ref) {
  return (
    <RadixAccordion.Item
      ref={ref}
      className={clsx(
        'border-b border-gray-100 last:border-b-0 dark:border-gray-800',
        className,
      )}
      {...rest}
    />
  );
});

// ── Trigger (folds Radix Header inside) ──────────────────────────────────────

export type AccordionTriggerProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Trigger
> & {
  children: ReactNode;
  /** Hide the chevron indicator. Default `false`. */
  hideChevron?: boolean;
};

const AccordionTrigger = forwardRef<
  ElementRef<typeof RadixAccordion.Trigger>,
  AccordionTriggerProps
>(function AccordionTrigger({ className, children, hideChevron = false, ...rest }, ref) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        ref={ref}
        className={clsx(
          'group flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:text-white dark:hover:bg-white/5',
          className,
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
});

// ── Content ──────────────────────────────────────────────────────────────────

export type AccordionContentProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Content
>;

const AccordionContent = forwardRef<
  ElementRef<typeof RadixAccordion.Content>,
  AccordionContentProps
>(function AccordionContent({ className, children, ...rest }, ref) {
  return (
    <RadixAccordion.Content
      ref={ref}
      // Animate using Radix's CSS var `--radix-accordion-content-height`.
      // `motion-safe` honours `prefers-reduced-motion`.
      className={clsx(
        'overflow-hidden text-sm text-gray-700 motion-safe:data-[state=closed]:animate-[accordionUp_180ms_ease-out] motion-safe:data-[state=open]:animate-[accordionDown_180ms_ease-out] dark:text-gray-300',
        className,
      )}
      {...rest}
    >
      <div className="px-4 pb-4 pt-0">{children}</div>
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
});

// ── Compound export ──────────────────────────────────────────────────────────

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});
