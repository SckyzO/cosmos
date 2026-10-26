import * as RadixAccordion from '@radix-ui/react-accordion';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { createContext, use, useLayoutEffect, useMemo, useState } from 'react';
import type { ComponentPropsWithRef, ElementType, ReactNode } from 'react';

export type AccordionSize = 'sm' | 'md';

// The root owns the size and the open-item accent; triggers and content read them so one prop
// sets the whole list.
type AccordionListState = { size: AccordionSize; accentOpen: boolean };
const AccordionListContext = createContext<AccordionListState>({ size: 'sm', accentOpen: false });

// An item owns whether its trigger has an icon: the trigger records it, the content, which has no
// access to the trigger, reads it to line its text up under the title.
type AccordionItemState = { hasIcon: boolean; setHasIcon: (hasIcon: boolean) => void };
const AccordionItemContext = createContext<AccordionItemState>({
  hasIcon: false,
  setHasIcon: () => undefined,
});

// ── Root ─────────────────────────────────────────────────────────────────────

export type AccordionProps = ComponentPropsWithRef<typeof RadixAccordion.Root> & {
  /** Visual variant. `bordered` (default) wraps each item in a border; `seamless` strips borders for a tighter look. */
  appearance?: 'bordered' | 'seamless';
  /** Row size. `sm` (default) is the compact list, `md` gives larger text and more padding. */
  size?: AccordionSize;
  /**
   * Accent the open item: its title, icon and chevron take the accent color, so the open row reads
   * at a glance. It sits on the list, not on each item, so a list reads in one style. Default
   * `false`.
   */
  accentOpen?: boolean;
};

function AccordionRoot({
  appearance = 'bordered',
  size = 'sm',
  accentOpen = false,
  className,
  children,
  ref,
  ...rest
}: AccordionProps) {
  const list = useMemo(() => ({ size, accentOpen }), [size, accentOpen]);
  return (
    <AccordionListContext value={list}>
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
    </AccordionListContext>
  );
}

// ── Item ─────────────────────────────────────────────────────────────────────

export type AccordionItemProps = ComponentPropsWithRef<typeof RadixAccordion.Item>;

function AccordionItem({ className, ref, ...rest }: AccordionItemProps) {
  const [hasIcon, setHasIcon] = useState(false);
  const item = useMemo(() => ({ hasIcon, setHasIcon }), [hasIcon]);
  return (
    <AccordionItemContext value={item}>
      <RadixAccordion.Item
        ref={ref}
        className={clsx('border-b border-gray-100 last:border-b-0 dark:border-gray-800', className)}
        {...rest}
      />
    </AccordionItemContext>
  );
}

// ── Trigger (folds Radix Header inside) ──────────────────────────────────────

export type AccordionTriggerProps = ComponentPropsWithRef<typeof RadixAccordion.Trigger> & {
  children: ReactNode;
  /** Hide the chevron indicator. Default `false`. */
  hideChevron?: boolean;
  /**
   * Icon drawn before the title, any component taking `className` (a lucide icon). 16px, in the
   * muted gray. The item's content lines up under the title on its own. Default none.
   */
  icon?: ElementType;
};

// Title, icon and chevron colors. With `accentOpen` the open item takes the accent and the closed
// ones keep the plain colors, each on its own state variant so no two utilities of one family meet
// on an element (the CSS order would pick the winner, not the state).
const TITLE_COLOR = {
  plain: 'text-gray-900 dark:text-white',
  accent:
    'data-[state=closed]:text-gray-900 data-[state=open]:text-brand-600 dark:data-[state=closed]:text-white dark:data-[state=open]:text-brand-400',
};
const ICON_COLOR = {
  plain: 'text-gray-500 dark:text-gray-400',
  accent:
    'group-data-[state=closed]:text-gray-500 group-data-[state=open]:text-brand-600 dark:group-data-[state=closed]:text-gray-400 dark:group-data-[state=open]:text-brand-400',
};
const CHEVRON_COLOR = {
  plain: 'text-gray-400',
  accent:
    'group-data-[state=closed]:text-gray-400 group-data-[state=open]:text-brand-600 dark:group-data-[state=open]:text-brand-400',
};

function AccordionTrigger({
  className,
  children,
  hideChevron = false,
  icon: Icon,
  ref,
  ...rest
}: AccordionTriggerProps) {
  const { size, accentOpen } = use(AccordionListContext);
  const { setHasIcon } = use(AccordionItemContext);
  const hasIcon = Icon !== undefined;
  // A layout effect: the content is aligned before the first paint, not one frame later.
  useLayoutEffect(() => {
    setHasIcon(hasIcon);
    return () => setHasIcon(false);
  }, [hasIcon, setHasIcon]);
  const tone = accentOpen ? 'accent' : 'plain';
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        ref={ref}
        className={clsx(
          'group focus-visible:focus-indicator flex w-full items-center justify-between gap-2 text-left font-medium transition-colors focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50',
          TITLE_COLOR[tone],
          size === 'md' ? 'px-5 py-4 text-base' : 'px-4 py-3 text-sm',
          // Hover only on a live trigger: a disabled one must not invite a click.
          'enabled:hover:bg-gray-50 dark:enabled:hover:bg-white/5',
          className
        )}
        {...rest}
      >
        {Icon && <Icon className={clsx('h-4 w-4 shrink-0', ICON_COLOR[tone])} aria-hidden />}
        <span className="flex-1">{children}</span>
        {!hideChevron && (
          <ChevronDown
            className={clsx(
              'h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180',
              CHEVRON_COLOR[tone]
            )}
            aria-hidden
          />
        )}
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
}

// ── Content ──────────────────────────────────────────────────────────────────

// The trigger's padding, plus the icon (16px) and the gap (8px) when it has one, so the text sits
// under the title. One padding set per case: `px-*` and `ps-*` together would be settled by the
// CSS order.
const contentPadding = (size: AccordionSize, hasIcon: boolean) => {
  if (size === 'md') return hasIcon ? 'ps-11 pe-5 pb-5' : 'px-5 pb-5';
  return hasIcon ? 'ps-10 pe-4 pb-4' : 'px-4 pb-4';
};

export type AccordionContentProps = ComponentPropsWithRef<typeof RadixAccordion.Content>;

function AccordionContent({ className, children, ref, ...rest }: AccordionContentProps) {
  const { size } = use(AccordionListContext);
  const { hasIcon } = use(AccordionItemContext);
  return (
    <RadixAccordion.Content
      ref={ref}
      // Animate using Radix's CSS var `--radix-accordion-content-height`.
      // `motion-safe` honours `prefers-reduced-motion`.
      className={clsx(
        'overflow-hidden text-gray-700 motion-safe:data-[state=closed]:animate-[accordionUp_180ms_ease-out] motion-safe:data-[state=open]:animate-[accordionDown_180ms_ease-out] dark:text-gray-300',
        size === 'md' ? 'text-base' : 'text-sm',
        className
      )}
      {...rest}
    >
      <div className={clsx('pt-0', contentPadding(size, hasIcon))}>{children}</div>
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
