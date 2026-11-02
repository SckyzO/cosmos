import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { SegmentedControl } from '../forms/SegmentedControl';
import {
  bothDirections,
  directionBox,
  endEdge,
  endOffset,
  expectGraphicContrast,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
  portalDocsParams,
  startEdge,
  startOffset,
  textLines,
} from '../storybook-helpers';
import { Button } from '../ui/Button';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { formatMoney } from './money';
import { PlanCard, type PlanCardProps, type PlanFeature } from './PlanCard';

const meta = {
  title: 'Data/Plan Card',
  component: PlanCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { name: 'Plan', price: 0 },
} satisfies Meta<typeof PlanCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// A pricing page is read on a wide screen: the toolbar's 1920px preset, with the page in a column
// of at most 1152px, which is what a 1440px window shows.
const desktopViewport = { viewport: { value: 'desktop', isRotated: false } } as const;

const USD = { currency: 'USD', locale: 'en-US' } as const;
const money = (value: number) =>
  formatMoney(value, { ...USD, trailingZeroDisplay: 'stripIfInteger' });

// ── The plans of the pricing and billing pages ───────────────────────────────

type Cycle = 'monthly' | 'yearly';

type Plan = {
  id: string;
  name: string;
  description: string;
  /** Per month, billed monthly. No number: a price on request. */
  monthly?: number;
  features: PlanFeature[];
};

const STARTER: Plan = {
  id: 'starter',
  name: 'Starter',
  description: 'For a side project or a first launch.',
  monthly: 10,
  features: [
    { label: '3 projects' },
    { label: 'Community support' },
    { label: 'Custom domains', included: false },
    { label: 'Single sign-on', included: false },
  ],
};

const PRO: Plan = {
  id: 'pro',
  name: 'Pro',
  description: 'For a team that ships every week.',
  monthly: 25,
  features: [
    { label: 'Unlimited projects' },
    { label: 'Email support within a day' },
    { label: 'Custom domains' },
    { label: 'Single sign-on', included: false },
  ],
};

const BUSINESS: Plan = {
  id: 'business',
  name: 'Business',
  description: 'For several teams on one account.',
  monthly: 60,
  features: [
    { label: 'Unlimited projects' },
    { label: 'Priority support within an hour' },
    { label: 'Custom domains' },
    { label: 'Single sign-on' },
  ],
};

const ENTERPRISE: Plan = {
  id: 'enterprise',
  name: 'Enterprise',
  description: 'For a company with its own security review.',
  features: [
    { label: 'Unlimited projects' },
    { label: 'A named support engineer' },
    { label: 'Custom domains' },
    { label: 'Single sign-on and SCIM' },
  ],
};

// Yearly billing takes 20% off every month: the page works the price out, the card only shows it.
const YEARLY_DISCOUNT = 0.2;

// What a card shows for `plan` in `cycle`: the page's arithmetic, kept in one place.
const pricing = (
  plan: Plan,
  cycle: Cycle
): Pick<PlanCardProps, 'price' | 'period' | 'priceNote'> => {
  if (plan.monthly === undefined) return { price: 'Custom' };
  if (cycle === 'monthly') return { price: plan.monthly, period: '/ month' };
  const perMonth = plan.monthly * (1 - YEARLY_DISCOUNT);
  return {
    price: perMonth,
    period: '/ month',
    priceNote: `Billed ${money(perMonth * 12)} yearly`,
  };
};

const CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly', badge: 'Save 20%' },
] as const;

// ── Single cards ─────────────────────────────────────────────────────────────

/** One plan: the name, a description, the price and what it covers, the action, then the features. */
export const Default: Story = {
  args: {
    name: 'Pro',
    description: 'For a team that ships every week.',
    price: 25,
    ...USD,
    period: '/ month',
    action: <Button size="lg">Start free trial</Button>,
    features: PRO.features,
  },
  render: (args) => (
    <div className="max-w-sm">
      <PlanCard {...args} />
    </div>
  ),
};

export const DefaultChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article', { name: 'Pro' });
    // The name is the heading of the card, an h3 by default, and the card is named by it.
    await expect(within(card).getByRole('heading', { level: 3, name: 'Pro' })).toBeVisible();
    // A whole price has no decimals and the period follows it.
    await expect(within(card).getByText('$25')).toBeVisible();
    await expect(within(card).getByText('/ month')).toBeVisible();
    // The action sits right under the price (and its note line), above the features.
    const price = within(card).getByText('$25');
    const action = within(card).getByRole('button', { name: 'Start free trial' });
    const features = within(card).getByRole('list');
    const [priceBox, actionBox, featuresBox] = [price, action, features].map((el) =>
      el.getBoundingClientRect()
    );
    await expect(actionBox.top).toBeGreaterThan(priceBox.bottom);
    await expect(featuresBox.top).toBeGreaterThan(actionBox.bottom);
    // The action is as wide as the card's content and 44px tall (`size="lg"`).
    const cardBox = card.getBoundingClientRect();
    await expect(actionBox.width).toBeGreaterThan(cardBox.width - 60);
    await expect(actionBox.height).toBeGreaterThanOrEqual(44);
    // Only a figure is written by `formatMoney`: the digits are tabular.
    await expect(getComputedStyle(price).fontVariantNumeric).toContain('tabular-nums');
  },
};

/** The plan to look at first: an accent outline, a shadow and a label in the corner. */
export const Highlighted: Story = {
  args: {
    ...Default.args,
    highlighted: true,
    highlightLabel: 'Most popular',
  },
  render: Default.render,
};

export const HighlightedChecks: Story = {
  ...Highlighted,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article', { name: 'Pro' });
    const label = within(card).getByText('Most popular');
    const name = within(card).getByRole('heading', { name: 'Pro' });
    // The label sits in the top corner at the end of the line, the name at the start, apart.
    const cardBox = card.getBoundingClientRect();
    const labelBox = label.getBoundingClientRect();
    await expect(labelBox.top - cardBox.top).toBeLessThan(24);
    await expect(endOffset(label, card)).toBeLessThan(24);
    await expect(startOffset(name, card)).toBeLessThan(30);
    // Apart along the line: the text of the name ends before the label begins.
    const nameText = document.createRange();
    nameText.selectNodeContents(name);
    await expect(endEdge(nameText.getBoundingClientRect(), card)).toBeLessThan(
      startEdge(labelBox, card)
    );
    // The outline is the accent's, 2px, drawn outside the card's own border.
    const ring = getComputedStyle(card.firstElementChild!).boxShadow;
    await expect(ring).toContain('0px 0px 0px 2px');
    // Every text of the card, in the four themes.
    inEachTheme(() => {
      for (const el of [
        within(card).getByText('Most popular'),
        within(card).getByRole('heading', { name: 'Pro' }),
        within(card).getByText(PRO.description),
        within(card).getByText('$25'),
        within(card).getByText('/ month'),
        within(card).getByText('Unlimited projects'),
        within(card).getByText('Single sign-on'),
        within(card).getByRole('button', { name: 'Start free trial' }),
      ]) {
        expectTextContrast(el);
      }
      for (const icon of card.querySelectorAll('svg')) expectGraphicContrast(icon, 'color');
    });
  },
};

/** The plan the customer is on: the card draws its own disabled button, in place of `action`. */
export const Current: Story = {
  args: { ...Default.args, current: true },
  render: Default.render,
};

export const CurrentChecks: Story = {
  ...Current,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article', { name: 'Pro' });
    // Its button reads "Current plan" and is disabled; the page's own action is not drawn.
    const button = within(card).getByRole('button');
    await expect(button).toHaveAccessibleName('Current plan');
    await expect(button).toBeDisabled();
    await expect(within(card).queryByRole('button', { name: 'Start free trial' })).toBeNull();
    // A secondary button, 44px tall, as wide as the card's content.
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await expect(getComputedStyle(button).borderTopWidth).toBe('1px');
    await expect(getComputedStyle(button).cursor).toBe('not-allowed');
  },
};

// ── States ───────────────────────────────────────────────────────────────────

const STATES: { id: string; props: PlanCardProps }[] = [
  {
    id: 'default',
    props: {
      name: 'Starter',
      description: STARTER.description,
      price: 9.5,
      ...USD,
      period: '/ month',
      action: (
        <Button size="lg" variant="secondary">
          Get started
        </Button>
      ),
      features: STARTER.features,
    },
  },
  {
    id: 'highlighted',
    props: {
      name: 'Pro',
      description: PRO.description,
      price: 25,
      ...USD,
      period: '/ month',
      highlighted: true,
      highlightLabel: 'Most popular',
      action: <Button size="lg">Start free trial</Button>,
      features: PRO.features,
    },
  },
  {
    id: 'current',
    props: {
      name: 'Business',
      description: BUSINESS.description,
      price: 60,
      ...USD,
      period: '/ month',
      current: true,
      features: BUSINESS.features,
    },
  },
  {
    id: 'highlighted and current',
    props: {
      name: 'Pro Plus',
      description: PRO.description,
      price: 29,
      ...USD,
      period: '/ month',
      highlighted: true,
      highlightLabel: 'Your plan',
      current: true,
      features: PRO.features,
    },
  },
  {
    id: 'yearly with a note',
    props: {
      name: 'Pro Yearly',
      description: PRO.description,
      price: 20,
      ...USD,
      period: '/ month',
      priceNote: 'Billed $240 yearly',
      action: (
        <Button size="lg" variant="secondary">
          Switch to yearly
        </Button>
      ),
      features: PRO.features,
    },
  },
  {
    id: 'custom price',
    props: {
      name: 'Enterprise',
      description: ENTERPRISE.description,
      price: 'Custom',
      action: (
        <Button size="lg" variant="secondary">
          Contact sales
        </Button>
      ),
      features: ENTERPRISE.features,
    },
  },
];

/**
 * The states a card draws: default, highlighted, current, highlighted and current, a yearly price
 * with its note, and a price that is a word. A card with or without a note keeps its action level.
 */
export const States: Story = {
  render: () => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {STATES.map(({ id, props }) => (
        <PlanCard key={id} {...props} />
      ))}
    </div>
  ),
};

export const StatesChecks: Story = {
  ...States,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('article');
    await expect(cards).toHaveLength(6);
    const card = (name: string) => within(canvas.getByRole('article', { name }));
    // A whole price has no decimals, a price with cents keeps them, a word stays a word.
    await expect(card('Starter').getByText('$9.50')).toBeVisible();
    await expect(card('Pro').getByText('$25')).toBeVisible();
    await expect(card('Enterprise').getByText('Custom')).toBeVisible();
    await expect(card('Pro Yearly').getByText('Billed $240 yearly')).toBeVisible();
    // The label of a highlighted card shows on that card only.
    await expect(canvas.getAllByText('Most popular')).toHaveLength(1);
    await expect(canvas.getByText('Your plan')).toBeVisible();
    // A current card has its own disabled button, and the others keep their action.
    for (const name of ['Business', 'Pro Plus']) {
      const button = card(name).getByRole('button');
      await expect(button).toHaveAccessibleName('Current plan');
      await expect(button).toBeDisabled();
    }
    await expect(card('Starter').getByRole('button', { name: 'Get started' })).toBeEnabled();
    await expect(card('Enterprise').getByRole('button', { name: 'Contact sales' })).toBeEnabled();
  },
};

// ── Features ─────────────────────────────────────────────────────────────────

/** A feature the plan lacks is a muted dash with muted text, not struck through. */
export const Features: Story = {
  args: {
    ...Default.args,
    features: [
      { label: 'Unlimited projects' },
      { label: 'Custom domains', included: true },
      { label: 'Single sign-on', included: false },
      { label: 'Audit log export', included: false },
    ],
  },
  render: Default.render,
};

export const FeaturesChecks: Story = {
  ...Features,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const rows = within(canvas.getByRole('list')).getAllByRole('listitem');
    await expect(rows).toHaveLength(4);
    // A screen reader hears whether each feature is part of the plan, before its name.
    await expect(rows.map((row) => row.textContent)).toEqual([
      'Included: Unlimited projects',
      'Included: Custom domains',
      'Not included: Single sign-on',
      'Not included: Audit log export',
    ]);
    // The prefix is read, not seen: visually hidden, in 1 pixel.
    for (const row of rows) {
      const hidden = row.querySelector('.sr-only') as HTMLElement;
      await expect(getComputedStyle(hidden).position).toBe('absolute');
      await expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    }
    // The mark is decoration: hidden from assistive technology.
    for (const icon of canvas.getByRole('list').querySelectorAll('svg')) {
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
    // A missing feature has a muted text and a muted dash, never a line through the text; an
    // included one takes the text colour and the accent's check.
    const text = (row: HTMLElement) => row.querySelector('.sr-only')!.parentElement!;
    const included = text(rows[0]);
    const excluded = text(rows[2]);
    await expect(getComputedStyle(excluded).textDecorationLine).toBe('none');
    await expect(getComputedStyle(included).textDecorationLine).toBe('none');
    await expect(getComputedStyle(excluded.parentElement!).color).not.toBe(
      getComputedStyle(included.parentElement!).color
    );
    await expect(getComputedStyle(rows[2].querySelector('svg')!).color).toBe(
      getComputedStyle(rows[2]).color
    );
    await expect(getComputedStyle(rows[0].querySelector('svg')!).color).not.toBe(
      getComputedStyle(rows[2].querySelector('svg')!).color
    );
    // The two marks are different shapes: a check and a dash.
    await expect(rows[0].querySelector('svg')!.getAttribute('class')).toContain('lucide-check');
    await expect(rows[2].querySelector('svg')!.getAttribute('class')).toContain('lucide-minus');
    // Included and not included, in the four themes.
    inEachTheme(() => {
      for (const row of rows) expectTextContrast(text(row));
      for (const row of rows) expectGraphicContrast(row.querySelector('svg')!, 'color');
    });
  },
};

/** The sr-only texts and the heading level are props, for another language and another outline. */
export const HeadingLevelAndLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
      <PlanCard name="Pro" price={25} {...USD} features={[{ label: 'Support' }]} />
      <PlanCard
        name="Pro Plus"
        price={29}
        {...USD}
        headingLevel={2}
        includedLabel="Inclus :"
        notIncludedLabel="Non inclus :"
        current
        currentLabel="Offre actuelle"
        features={[{ label: 'Support' }, { label: 'SSO', included: false }]}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 3, name: 'Pro' })).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 2, name: 'Pro Plus' })).toBeVisible();
    await expect(canvas.queryByRole('heading', { level: 3, name: 'Pro Plus' })).toBeNull();
    const second = within(canvas.getByRole('article', { name: 'Pro Plus' }));
    await expect(second.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
      'Inclus : Support',
      'Non inclus : SSO',
    ]);
    await expect(second.getByRole('button')).toHaveAccessibleName('Offre actuelle');
  },
};

// ── Pricing page ─────────────────────────────────────────────────────────────

const PricingPageDemo = ({ plans = [STARTER, PRO, ENTERPRISE] }: { plans?: Plan[] }) => {
  const [cycle, setCycle] = useState<Cycle>('monthly');
  return (
    <div className="mx-auto max-w-6xl">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Simple pricing for every stage
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Change or cancel your plan at any time.
        </p>
        <div className="mt-6 flex justify-center">
          <SegmentedControl
            aria-label="Billing period"
            options={[...CYCLES]}
            value={cycle}
            onChange={setCycle}
          />
        </div>
      </div>
      <div
        className={
          plans.length > 3
            ? 'mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4'
            : 'mt-10 grid gap-6 md:grid-cols-3'
        }
      >
        {plans.map((plan) => {
          const highlighted = plan.id === PRO.id;
          return (
            <PlanCard
              key={plan.id}
              name={plan.name}
              description={plan.description}
              {...pricing(plan, cycle)}
              {...USD}
              highlighted={highlighted}
              highlightLabel={highlighted ? 'Most popular' : undefined}
              features={plan.features}
              action={
                <Button size="lg" variant={highlighted ? 'primary' : 'secondary'}>
                  {plan.monthly === undefined
                    ? 'Contact sales'
                    : plan.id === STARTER.id
                      ? 'Get started'
                      : 'Start free trial'}
                </Button>
              }
            />
          );
        })}
      </div>
    </div>
  );
};

const spread = (values: number[]) => Math.max(...values) - Math.min(...values);

// The buttons, the first features and the cards themselves start and end level.
const expectLevel = (cards: HTMLElement[]) => {
  const top = (el: HTMLElement) => el.getBoundingClientRect().top;
  const buttons = cards.map((card) => within(card).getByRole('button'));
  expect(spread(buttons.map(top)), 'the buttons sit at different heights').toBeLessThan(1.5);
  expect(
    spread(buttons.map((el) => el.getBoundingClientRect().height)),
    'the buttons are not of one height'
  ).toBeLessThan(1.5);
  const firsts = cards.map((card) => within(card).getAllByRole('listitem')[0]);
  expect(spread(firsts.map(top)), 'the lists start at different heights').toBeLessThan(1.5);
  expect(spread(cards.map(top)), 'the cards start at different heights').toBeLessThan(1.5);
  expect(
    spread(cards.map((el) => el.getBoundingClientRect().height)),
    'the cards are not of one height'
  ).toBeLessThan(1.5);
};

/**
 * A pricing page: three plans in a grid, one highlighted, one with a price that is a word, and a
 * `SegmentedControl` above them that swaps the prices. The page works the yearly price out.
 */
export const PricingPage: Story = {
  globals: desktopViewport,
  render: () => <PricingPageDemo />,
};

export const PricingPageChecks: Story = {
  ...PricingPage,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('article');
    await expect(cards).toHaveLength(3);
    const [starter, pro, enterprise] = cards;
    // Three cards side by side, in the order they were given, and the buttons level.
    // Along the line, so the order holds mirrored in right to left.
    const edges = cards.map((card) => card.getBoundingClientRect());
    await expect(endEdge(edges[0], pro)).toBeLessThanOrEqual(startEdge(edges[1], pro));
    await expect(endEdge(edges[1], pro)).toBeLessThanOrEqual(startEdge(edges[2], pro));
    expectLevel(cards);
    // The names are h3, under the page's h2.
    for (const name of ['Starter', 'Pro', 'Enterprise']) {
      await expect(canvas.getByRole('heading', { level: 3, name })).toBeVisible();
    }
    // One plan is highlighted, the others are not.
    await expect(canvas.getAllByText('Most popular')).toHaveLength(1);
    await expect(within(pro).getByText('Most popular')).toBeVisible();
    // The custom price is a word, with the action of a sale.
    await expect(within(enterprise).getByText('Custom')).toBeVisible();
    await expect(within(enterprise).getByRole('button', { name: 'Contact sales' })).toBeVisible();

    // Monthly: whole prices, no note.
    await expect(within(starter).getByText('$10')).toBeVisible();
    await expect(within(pro).getByText('$25')).toBeVisible();
    await expect(canvas.queryByText(/^Billed \$/)).toBeNull();

    // Yearly: 20% off every month, and a note with the year's invoice on the cards that have one.
    await userEvent.click(canvas.getByRole('radio', { name: /Yearly/ }));
    await expect(within(starter).getByText('$8')).toBeVisible();
    await expect(within(starter).getByText('Billed $96 yearly')).toBeVisible();
    await expect(within(pro).getByText('$20')).toBeVisible();
    await expect(within(pro).getByText('Billed $240 yearly')).toBeVisible();
    // The card with a note and the one without keep their buttons level.
    expectLevel(cards);

    await userEvent.click(canvas.getByRole('radio', { name: /Monthly/ }));
    await expect(within(pro).getByText('$25')).toBeVisible();
    expectLevel(cards);
  },
};

/** The same page at 393px: the cards stack, one under the other, each as wide as the page. */
export const PricingPageMobile: Story = {
  globals: mobileViewport,
  render: () => <PricingPageDemo />,
};

export const PricingPageMobileChecks: Story = {
  ...PricingPageMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const cards = canvas.getAllByRole('article');
    await expect(cards).toHaveLength(3);
    const boxes = cards.map((card) => card.getBoundingClientRect());
    // Stacked: one start edge and one width, each below the one before.
    await expect(spread(boxes.map((box) => box.left))).toBeLessThan(1.5);
    await expect(spread(boxes.map((box) => box.width))).toBeLessThan(1.5);
    for (let i = 1; i < boxes.length; i += 1) {
      await expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
    }
    // Inside the viewport, with the page's gutter on both sides.
    await expect(boxes[0].left).toBeGreaterThan(0);
    await expect(boxes[0].right).toBeLessThan(window.innerWidth);
    for (const card of cards) {
      const button = within(card).getByRole('button');
      // The action is as wide as the card's content, and on one line.
      await expect(button.getBoundingClientRect().width).toBeGreaterThan(
        card.getBoundingClientRect().width - 60
      );
      await expect(textLines(button)).toBe(1);
      // The price keeps one line, and so does the name.
      await expect(textLines(card.querySelector('h3')!)).toBe(1);
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }
    await userEvent.click(canvas.getByRole('radio', { name: /Yearly/ }));
    expectNoHorizontalOverflow();
  },
};

/** Four plans across at 1440px: the buttons and the lists stay level. */
export const FourAcross: Story = {
  globals: desktopViewport,
  render: () => <PricingPageDemo plans={[STARTER, PRO, BUSINESS, ENTERPRISE]} />,
};

export const FourAcrossChecks: Story = {
  ...FourAcross,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('article');
    await expect(cards).toHaveLength(4);
    // Four across at this width (`xl`), none wider than the page.
    await expect(spread(cards.map((card) => card.getBoundingClientRect().top))).toBeLessThan(1.5);
    expectLevel(cards);
    await userEvent.click(canvas.getByRole('radio', { name: /Yearly/ }));
    expectLevel(cards);
    expectNoHorizontalOverflow();
  },
};

// ── Billing page ─────────────────────────────────────────────────────────────

const BILLING_PLANS = [STARTER, PRO, BUSINESS];

const BillingPageDemo = ({ pendingId }: { pendingId?: string }) => {
  const [currentId, setCurrentId] = useState(PRO.id);
  // The plan the dialog is about stays when it closes, so its text does not change as it leaves.
  const [targetId, setTargetId] = useState(pendingId);
  const [open, setOpen] = useState(pendingId !== undefined);
  const current = BILLING_PLANS.find((plan) => plan.id === currentId)!;
  const target = BILLING_PLANS.find((plan) => plan.id === targetId);
  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">Plan and billing</h2>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        You are on the <strong>{current.name}</strong> plan, billed yearly. It renews on 15 January
        2027.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {BILLING_PLANS.map((plan) => {
          const upgrade = (plan.monthly ?? 0) > (current.monthly ?? 0);
          return (
            <PlanCard
              key={plan.id}
              name={plan.name}
              description={plan.description}
              {...pricing(plan, 'yearly')}
              {...USD}
              current={plan.id === currentId}
              features={plan.features}
              action={
                <Button
                  size="lg"
                  variant={upgrade ? 'primary' : 'secondary'}
                  onClick={() => {
                    setTargetId(plan.id);
                    setOpen(true);
                  }}
                >
                  {upgrade ? 'Upgrade' : 'Downgrade'} to {plan.name}
                </Button>
              }
            />
          );
        })}
      </div>
      {target && (
        <ConfirmationModal
          open={open}
          title={`Switch to ${target.name}?`}
          message={`Your plan changes today. From your next renewal on 15 January 2027 you pay ${money(
            (target.monthly ?? 0) * (1 - YEARLY_DISCOUNT) * 12
          )} a year.`}
          stayLabel={`Keep ${current.name}`}
          saveLabel={`Switch to ${target.name}`}
          onClose={() => setOpen(false)}
          onSave={() => {
            setCurrentId(target.id);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};

/**
 * The plan picker of a billing page: the current plan has its disabled button and each other card
 * one button. The button opens a `ConfirmationModal`; the plan changes when the customer confirms.
 * There is no radio group and no `selected` prop.
 */
export const BillingPage: Story = {
  globals: desktopViewport,
  parameters: portalDocsParams.lg(),
  render: () => <BillingPageDemo />,
};

export const BillingPageChecks: Story = {
  ...BillingPage,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const body = within(document.body);
    const cards = canvas.getAllByRole('article');
    await expect(cards).toHaveLength(3);
    expectLevel(cards);
    const card = (name: string) => within(canvas.getByRole('article', { name }));
    // Pro is the current plan: a disabled button, and nothing else to press on that card.
    await expect(card('Pro').getByRole('button')).toHaveAccessibleName('Current plan');
    await expect(card('Pro').getByRole('button')).toBeDisabled();
    // Each other card has one button, for its direction.
    await expect(
      card('Starter').getByRole('button', { name: 'Downgrade to Starter' })
    ).toBeEnabled();
    await expect(
      card('Business').getByRole('button', { name: 'Upgrade to Business' })
    ).toBeEnabled();
    await expect(canvas.queryByRole('radio')).toBeNull();
    await expect(canvas.queryByRole('alertdialog')).toBeNull();

    // The button asks first: the plan does not change, and Keep closes the dialog.
    await userEvent.click(card('Business').getByRole('button'));
    let dialog = within(await body.findByRole('alertdialog', { name: 'Switch to Business?' }));
    await expect(dialog.getByText(/you pay \$576 a year/)).toBeVisible();
    await expect(card('Pro').getByRole('button')).toBeDisabled();
    await userEvent.click(dialog.getByRole('button', { name: 'Keep Pro' }));
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull());
    await expect(card('Pro').getByRole('button')).toHaveAccessibleName('Current plan');
    await expect(card('Business').getByRole('button')).toBeEnabled();

    // Confirm: the current plan moves to Business, and Pro gets its button back.
    await userEvent.click(card('Business').getByRole('button'));
    dialog = within(await body.findByRole('alertdialog', { name: 'Switch to Business?' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Switch to Business' }));
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull());
    await expect(card('Business').getByRole('button')).toHaveAccessibleName('Current plan');
    await expect(card('Business').getByRole('button')).toBeDisabled();
    await expect(card('Pro').getByRole('button', { name: 'Downgrade to Pro' })).toBeEnabled();
    await expect(canvas.getByText('Business', { selector: 'strong' })).toBeVisible();
    expectLevel(cards);
  },
};

/** The billing page at 393px: the cards stack, and the confirmation is a dialog over the page. */
export const BillingPageMobile: Story = {
  globals: mobileViewport,
  parameters: portalDocsParams.lg(),
  render: () => <BillingPageDemo />,
};

export const BillingPageMobileChecks: Story = {
  ...BillingPageMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const cards = canvas.getAllByRole('article');
    const boxes = cards.map((card) => card.getBoundingClientRect());
    await expect(spread(boxes.map((box) => box.left))).toBeLessThan(1.5);
    for (let i = 1; i < boxes.length; i += 1) {
      await expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
    }
    await userEvent.click(within(cards[2]).getByRole('button'));
    const dialog = await within(document.body).findByRole('alertdialog');
    const box = dialog.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(0);
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
    expectNoHorizontalOverflow();
  },
};

/** The confirmation of a plan change, open: it says what the customer will pay and from when. */
export const ConfirmingAPlanChange: Story = {
  globals: desktopViewport,
  parameters: portalDocsParams.lg(),
  render: () => <BillingPageDemo pendingId={BUSINESS.id} />,
};

export const ConfirmingAPlanChangeChecks: Story = {
  ...ConfirmingAPlanChange,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const dialog = within(
      await within(document.body).findByRole('alertdialog', { name: 'Switch to Business?' })
    );
    await expect(dialog.getByRole('button', { name: 'Keep Pro' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Switch to Business' })).toBeVisible();
    await expect(dialog.getByText(/15 January 2027/)).toBeVisible();
  },
};

// ── Right to left ────────────────────────────────────────────────────────────

/** The label of a highlighted card sits at the end of the line and the name at the start, in both. */
export const HighlightMirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="max-w-sm">
        <PlanCard
          name="Pro"
          price={25}
          {...USD}
          period="/ month"
          highlighted
          highlightLabel="Most popular"
          features={[{ label: 'Support' }, { label: 'SSO', included: false }]}
        />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const card = within(box).getByRole('article');
      const label = within(card).getByText('Most popular');
      const name = within(card).getByRole('heading');
      expect(endOffset(label, card), `${dir}: label at the end`).toBeLessThan(24);
      expect(startOffset(name, card), `${dir}: name at the start`).toBeLessThan(30);
      // Apart: the text of the name ends before the label begins, along the line.
      const text = document.createRange();
      text.selectNodeContents(name);
      expect(
        endEdge(text.getBoundingClientRect(), card),
        `${dir}: the name runs over the label`
      ).toBeLessThanOrEqual(startEdge(label.getBoundingClientRect(), card));
      // The marks lead the features at the start, in both directions.
      const row = within(card).getAllByRole('listitem')[0];
      expect(
        startOffset(row.querySelector('svg')!, card),
        `${dir}: mark at the start`
      ).toBeLessThan(30);
    }
  },
};
