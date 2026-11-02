import { clsx } from 'clsx';
import { Check, Minus } from 'lucide-react';
import { useId, type ComponentPropsWithRef, type ElementType, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Ribbon } from '../ui/Ribbon';
import { Amount } from './Amount';

export type PlanFeature = {
  /** What the plan gives, or does not give. */
  label: ReactNode;
  /** `false` for a feature the plan lacks: a muted dash and muted text. Default `true`. */
  included?: boolean;
};

/** The level of the plan's name: the page decides where the cards sit in its outline. */
export type PlanCardHeadingLevel = 2 | 3 | 4 | 5 | 6;

export type PlanCardProps = Omit<ComponentPropsWithRef<'article'>, 'children'> & {
  /** The plan's name: "Starter", "Pro". It is the heading of the card. */
  name: string;
  /**
   * One or two lines under the name. The card keeps room for two, so the actions of cards side by
   * side line up; a third line pushes this card's action down.
   */
  description?: ReactNode;
  /**
   * A number is written as money by `formatMoney` (`24` gives `$24`, `24.5` gives `$24.50`), in
   * units and in tabular digits. Anything else is shown as it is, for a price that is not a figure
   * ("Free", "Custom").
   */
  price: ReactNode;
  /** ISO 4217 code (`'USD'`) of a numeric `price`. Without it, a plain number. */
  currency?: string;
  /** BCP 47 locale of a numeric `price`. Default: the user's. Pass it when the page is in one. */
  locale?: string;
  /** What the price covers, after it: "/ month", "per seat per year". */
  period?: ReactNode;
  /**
   * A line of small text under the price: "Billed $228 yearly", "Save 20%". The card keeps room
   * for one line, so cards with and without a note keep their actions level.
   */
  priceNote?: ReactNode;
  /**
   * The plan to look at first: an accent outline and a shadow. Pair it with `highlightLabel`
   * ("Most popular").
   */
  highlighted?: boolean;
  /**
   * The text of the label set in the corner of a `highlighted` card, a `Ribbon` pill. Keep it
   * short: the name wraps under it, but a long label runs over the name.
   */
  highlightLabel?: ReactNode;
  /**
   * The plan the customer is on. The card draws its own disabled button, a `secondary` one, in
   * place of `action`.
   */
  current?: boolean;
  /** Text of that button, for translations. Default `Current plan`. */
  currentLabel?: string;
  /**
   * The action: a `Button` of `size="lg"`, set right under the price and as wide as the card. The
   * page decides what it does (a link to the sign-up, a button that opens a confirmation).
   */
  action?: ReactNode;
  /** The list under the action, in order: each is a mark and a label. */
  features?: PlanFeature[];
  /** Under the feature list, or in its place when there is none: a link, a note. */
  children?: ReactNode;
  /** Level of the name's heading. Default `3`. */
  headingLevel?: PlanCardHeadingLevel;
  /** Read before an included feature by a screen reader, for translations. Default `Included:`. */
  includedLabel?: string;
  /** Read before a missing feature by a screen reader. Default `Not included:`. */
  notIncludedLabel?: string;
};

// A slot with something to draw: `undefined`, `null`, `false` and `''` draw nothing.
const has = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== '';

// A text is an island of its own direction; a node is left as it is.
const isolate = (content: ReactNode) =>
  typeof content === 'string' ? <bdi>{content}</bdi> : content;

/**
 * PlanCard — one plan of a pricing page or a billing page: its name, a short description, the
 * price and what it covers, the action under it and the list of what it includes. Cards in a row
 * keep their actions level (the description and the price note keep their room) and stack in a
 * column on a narrow screen: put them in a grid, `grid gap-6 md:grid-cols-3`, and place the
 * monthly and yearly switch above it, a `SegmentedControl` of your own. The card computes
 * nothing: a yearly price, "Save 20%" and the billed total are yours to pass.
 *
 * `highlighted` draws the plan to look at first, with a label from `highlightLabel`, and
 * `current` the plan in use, whose button reads "Current plan" and is disabled. A feature the plan
 * lacks is a muted dash with muted text, never struck through; a screen reader hears "Included:"
 * or "Not included:" before each.
 */
export const PlanCard = ({
  name,
  description,
  price,
  currency,
  locale,
  period,
  priceNote,
  highlighted = false,
  highlightLabel,
  current = false,
  currentLabel = 'Current plan',
  action,
  features = [],
  children,
  headingLevel = 3,
  includedLabel = 'Included:',
  notIncludedLabel = 'Not included:',
  className,
  ref,
  ...rest
}: PlanCardProps) => {
  const headingId = useId();
  const Heading: ElementType = `h${headingLevel}`;
  const labelled = highlighted && has(highlightLabel);
  const hasFeatures = features.length > 0;
  return (
    <article
      ref={ref}
      aria-labelledby={headingId}
      className={clsx('flex flex-col', className)}
      {...rest}
    >
      <Card
        padding="lg"
        className={clsx(
          'relative flex flex-1 flex-col',
          highlighted && 'ring-brand-500 shadow-lg ring-2'
        )}
      >
        {labelled && <Ribbon shape="pill">{highlightLabel}</Ribbon>}
        <Heading
          id={headingId}
          className={clsx(
            'text-lg font-semibold text-[var(--color-text-primary)]',
            // Room for the label in the corner, so a long name wraps before it.
            labelled && 'pe-32'
          )}
        >
          <bdi>{name}</bdi>
        </Heading>
        {/* Two lines, whatever the description: the actions of the cards in a row line up. */}
        <div className="mt-2 min-h-[2lh] text-sm text-[var(--color-text-secondary)]">
          {description}
        </div>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5 text-[var(--color-text-primary)]">
          <span className="text-4xl font-bold tracking-tight">
            {typeof price === 'number' ? (
              <Amount
                value={price}
                currency={currency}
                locale={locale}
                trailingZeroDisplay="stripIfInteger"
              />
            ) : (
              isolate(price)
            )}
          </span>
          {has(period) && (
            <span className="text-sm text-[var(--color-text-muted)]">{isolate(period)}</span>
          )}
        </div>
        {/* One line, with a note or without: the same reason. */}
        <div className="mt-1 min-h-lh text-xs text-[var(--color-text-muted)]">{priceNote}</div>
        {(current || has(action)) && (
          <div className="min-h-ctrl-44 mt-4 flex flex-col">
            {current ? (
              <Button variant="secondary" size="lg" disabled>
                {currentLabel}
              </Button>
            ) : (
              action
            )}
          </div>
        )}
        {(hasFeatures || has(children)) && (
          <div className="mt-6 border-t border-[var(--color-border)] pt-6">
            {hasFeatures && (
              <ul role="list" className="space-y-3 text-sm">
                {features.map(({ label, included = true }, index) => (
                  <li
                    key={index}
                    className={clsx(
                      'flex items-start gap-x-3',
                      included
                        ? 'text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-muted)]'
                    )}
                  >
                    {included ? (
                      <Check
                        aria-hidden
                        className="text-brand-600 dark:text-brand-400 mt-0.5 h-4 w-4 shrink-0"
                      />
                    ) : (
                      <Minus
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]"
                      />
                    )}
                    <span className="min-w-0 break-words">
                      <span className="sr-only">
                        {included ? includedLabel : notIncludedLabel}{' '}
                      </span>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {has(children) && (
              <div
                className={clsx(
                  'text-sm text-[var(--color-text-secondary)]',
                  hasFeatures && 'mt-4'
                )}
              >
                {children}
              </div>
            )}
          </div>
        )}
      </Card>
    </article>
  );
};
