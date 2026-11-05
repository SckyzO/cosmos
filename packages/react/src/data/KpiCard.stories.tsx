import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef } from 'react';
import {
  CircleAlert,
  CircleQuestionMark,
  CreditCard,
  Info,
  Server,
  ShieldAlert,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  expectRefFocuses,
  inEachTheme,
  expectTextContrast,
  expectTextContrastOnTint,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { LabelsProvider } from '../labels/LabelsProvider';
import { COSMOS_ACCENTS } from '../settings/appearance';
import {
  expectFadesInAfterSkeleton,
  expectNoFadeFromFirstRender,
  fadeIns,
  LoadToggle,
} from '../storybook-arrival';
import {
  expectKeepsItsPlace,
  expectLiftsOnHover,
  expectStaysUnderHover,
  LIFTED,
  tokenMs,
  transitionMs,
  transitions,
} from '../storybook-motion';
import { ProgressBar } from '../ui/ProgressBar';
import { ProgressRing } from '../ui/ProgressRing';
import { KpiCard } from './KpiCard';
import { TrendDelta } from './TrendDelta';

const meta = {
  title: 'Data/Kpi Card',
  component: KpiCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Total', value: '0' },
} satisfies Meta<typeof KpiCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// A chart slot is yours to size. react stays chart-free, so the stories draw a plain SVG: with
// charts, pass `<Sparkline data={…} />` from @sckyzo/cosmos-charts (see Charts/Sparkline in Kpi Cards).
const MiniLine = ({ points = [4, 7, 5, 9, 8, 12, 10, 14, 13, 17] }: { points?: number[] }) => {
  const max = Math.max(...points);
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${36 - (p / max) * 32}`)
    .join(' ');
  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      role="img"
      aria-label="Last 10 days"
      className="text-brand-600 dark:text-brand-400 block h-14 w-full"
    >
      <polyline
        points={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export const Default: Story = {
  args: { label: 'Total Racks', value: '48', sub: 'across 3 sites' },
};

export const NoSub: Story = { args: { label: 'Health Score', value: '94%' } };

/** The icon sits in a tinted chip at the end of the label, in the accent by default. */
export const WithIcon: Story = {
  args: { label: 'Active users', value: '12 480', icon: Users },
};

// In a card as narrow as half a phone, a figure with no break in it and a one-word label longer
// than its room stay inside the card: the figure wraps, the label breaks.
export const LongValueAndLabelStayInANarrowCard: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Subscribers', value: '€12,418,906.40', icon: Users },
  render: (args) => (
    <div data-testid="box" style={{ width: 150 }}>
      <KpiCard {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const box = canvas.getByTestId('box').getBoundingClientRect();
    const figure = canvas.getByText('€12,418,906.40').getBoundingClientRect();
    await expect(figure.left).toBeGreaterThanOrEqual(box.left);
    await expect(figure.right).toBeLessThanOrEqual(box.right);
    // Beside the icon, on whichever side the reading direction puts it, never under it.
    const icon = canvasElement.querySelector('svg')!.getBoundingClientRect();
    const label = canvas.getByText('Subscribers').getBoundingClientRect();
    await expect(label.right <= icon.left || label.left >= icon.right).toBe(true);
  },
};

/** `iconIntent` colors the chip on its own. */
export const IconIntent: Story = {
  args: { label: 'Revenue', value: '$48 920', icon: CreditCard, iconIntent: 'success' },
};

/** The `delta` slot takes a `TrendDelta`: the comparison text wraps under the value when it runs out of room. */
export const DeltaUp: Story = {
  args: {
    label: 'Revenue',
    value: '$48 920',
    icon: CreditCard,
    delta: <TrendDelta value={12.4} label="vs last month" />,
  },
};

export const DeltaDown: Story = {
  args: {
    label: 'Active users',
    value: '12 480',
    icon: Users,
    delta: <TrendDelta value={-3.1} label="vs last month" />,
  },
};

/** For a metric that should shrink, a drop is good news: a green pill with a downward arrow. */
export const GoodDirectionDown: Story = {
  args: {
    label: 'Churn rate',
    value: '2.4%',
    icon: Users,
    delta: <TrendDelta value={-0.6} goodDirection="down" label="vs last month" />,
  },
};

/** The `chart` slot takes the full width of the card, under the delta. */
export const ChartSlot: Story = {
  args: {
    label: 'Sessions',
    value: '84 210',
    icon: Server,
    delta: <TrendDelta value={8.2} label="vs last week" />,
    chart: <MiniLine />,
  },
};

/**
 * A goal with a bar: the `chart` slot takes a `ProgressBar`, full width under the delta. `neutral`
 * is for a gauge that means nothing, like space used; the accent for a goal being reached.
 */
export const WithProgress: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div data-testid="goal">
        <KpiCard
          label="Monthly goal"
          value="$38 400"
          sub="of $50 000"
          icon={CreditCard}
          delta={<TrendDelta value={9.6} label="vs last month" />}
          chart={<ProgressBar value={77} size="sm" label="outside" aria-label="Monthly goal" />}
        />
      </div>
      <div data-testid="storage">
        <KpiCard
          label="Storage"
          value="640 GB"
          sub="of 1 TB"
          icon={Server}
          chart={
            <ProgressBar
              value={64}
              size="sm"
              intent="neutral"
              label="outside"
              aria-label="Storage"
            />
          }
        />
      </div>
    </div>
  ),
};

export const WithProgressChecks: Story = {
  ...WithProgress,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    for (const [testId, name, now] of [
      ['goal', 'Monthly goal', '77'],
      ['storage', 'Storage', '64'],
    ] as const) {
      const card = canvas.getByTestId(testId).firstElementChild as HTMLElement;
      const bar = canvas.getByRole('progressbar', { name });
      await expect(bar).toHaveAttribute('aria-valuenow', now);
      // The bar's row takes the card's whole content width, under the value and the sub line.
      const style = getComputedStyle(card);
      const box = card.getBoundingClientRect();
      const row = bar.parentElement!.getBoundingClientRect();
      const left = box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
      const right = box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
      await expect(row.left).toBeCloseTo(left, 0);
      await expect(row.right).toBeCloseTo(right, 0);
      await expect(row.top).toBeGreaterThanOrEqual(
        within(card).getByText(/^of /).getBoundingClientRect().bottom
      );
    }
  },
};

/** `warning` takes the border, the icon chip and the value to the intent color; the background stays. */
export const IntentWarning: Story = {
  args: {
    label: 'Disk usage',
    value: '82%',
    sub: 'of 4 TB',
    icon: Server,
    intent: 'warning',
    delta: <TrendDelta value={5.1} goodDirection="down" label="vs last week" />,
  },
};

export const IntentDanger: Story = {
  args: {
    label: 'CRIT Alerts',
    value: '3',
    sub: '2 escalated',
    icon: ShieldAlert,
    intent: 'danger',
  },
};

/** The value, the delta and the chart become skeletons; the label and the icon stay. */
export const Loading: Story = {
  args: {
    label: 'Sessions',
    value: '84 210',
    icon: Server,
    delta: <TrendDelta value={8.2} label="vs last week" />,
    chart: <MiniLine />,
    loading: true,
  },
};

/** With `href` the whole card is one link: the border turns to the accent on hover, and it rises. */
export const AsLink: Story = {
  parameters: { settleMotion: false },
  args: {
    label: 'Open tickets',
    value: '128',
    icon: Users,
    delta: <TrendDelta value={-4.2} goodDirection="down" label="vs last week" />,
    href: '#tickets',
  },
};

/** With `onClick` and no `href` the whole card is one button. */
export const AsButton: Story = {
  parameters: { settleMotion: false },
  args: {
    label: 'Open tickets',
    value: '128',
    icon: Users,
    delta: <TrendDelta value={-4.2} goodDirection="down" label="vs last week" />,
    onClick: fn(),
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total Racks"
        value="48"
        sub="across 3 sites"
        icon={Server}
        delta={<TrendDelta value={4.3} label="vs last month" />}
      />
      <KpiCard
        label="CRIT Alerts"
        value="3"
        sub="2 escalated"
        icon={ShieldAlert}
        intent="danger"
        delta={<TrendDelta value={50} goodDirection="down" label="vs last week" />}
      />
      <KpiCard label="Health Score" value="94%" />
      <KpiCard label="Nodes Online" value="1 204" sub="of 1 248 total" />
    </div>
  ),
};

/** One card per row at 375px; the delta wraps under the value, nothing widens the page. */
const mobile: Story = {
  globals: mobileViewport,
  render: () => (
    <div className="grid gap-4">
      <KpiCard
        label="Monthly recurring revenue"
        value="$1 284 930"
        icon={CreditCard}
        delta={<TrendDelta value={12.4} label="vs the same month last year" />}
        chart={<MiniLine />}
      />
      <KpiCard
        label="CRIT Alerts"
        value="3"
        icon={ShieldAlert}
        intent="danger"
        href="#alerts"
        delta={<TrendDelta value={50} goodDirection="down" label="vs last week" />}
      />
    </div>
  ),
};

export const MobileChecks: Story = {
  ...mobile,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    for (const card of canvasElement.querySelectorAll<HTMLElement>('div > div, div > a')) {
      expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }
  },
};

/** The exact value behind an abbreviated one: a tooltip on hover and focus, and in the card's name. */
export const ExactValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Revenue',
    value: '€12.4M',
    exactValue: '€12,418,906.40',
    icon: CreditCard,
    delta: <TrendDelta value={8.1} label="vs prev. 90 days" />,
  },
  play: async ({ canvasElement }) => {
    // The value is the one stop of a plain card; its exact figure is in its text.
    await expect(canvasElement.querySelector('.sr-only')).toHaveTextContent(
      'exact value €12,418,906.40'
    );
  },
};

export const ExactValueOnALinkCard: Story = {
  args: { ...ExactValue.args, href: '#revenue' },
};

/** At phone width the card shows the short value; the exact one stays reachable. */
export const MobileExactValue: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <div className="grid gap-4">
      <KpiCard
        label="Revenue"
        value="€12.4M"
        exactValue="€12,418,906.40"
        icon={CreditCard}
        delta={<TrendDelta value={8.1} label="vs prev. 90 days" />}
      />
      <KpiCard label="Open tickets" value="1.2k" exactValue="1,184" icon={Users} href="#tickets" />
    </div>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('link', { name: /1\.2k.*1,184/ })).toBeInTheDocument();
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

/** The warning and danger look: border, value and chip change, the background does not. */
export const IntentChangesBorderAndValueOnly: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <div data-testid="neutral">
        <KpiCard label="Neutral" value="1" icon={Server} />
      </div>
      <div data-testid="warning">
        <KpiCard label="Warning" value="2" icon={Server} intent="warning" />
      </div>
      <div data-testid="danger">
        <KpiCard label="Danger" value="3" icon={Server} intent="danger" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const parts = (id: string) => {
      const card = canvas.getByTestId(id).firstElementChild as HTMLElement;
      const value = within(card).getByText(/^\d$/);
      const chip = card.querySelector('svg')!.parentElement as HTMLElement;
      return { card, value, chip };
    };
    const [neutral, warning, danger] = ['neutral', 'warning', 'danger'].map(parts);
    for (const tinted of [warning, danger]) {
      expect(getComputedStyle(tinted.card).backgroundColor).toBe(
        getComputedStyle(neutral.card).backgroundColor
      );
      expect(getComputedStyle(tinted.card).borderColor).not.toBe(
        getComputedStyle(neutral.card).borderColor
      );
      expect(getComputedStyle(tinted.value).color).not.toBe(getComputedStyle(neutral.value).color);
      expect(getComputedStyle(tinted.chip).backgroundColor).not.toBe(
        getComputedStyle(neutral.chip).backgroundColor
      );
    }
    expect(getComputedStyle(warning.value).color).not.toBe(getComputedStyle(danger.value).color);
    // The intent color is text on the card: readable in every theme.
    inEachTheme(() => {
      expectTextContrast(warning.value);
      expectTextContrast(danger.value);
    });
  },
};

/** While loading the card keeps its height, so a grid of cards does not jump when data arrives. */
export const LoadingKeepsHeight: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const slots = {
      icon: Server,
      delta: <TrendDelta value={8.2} label="vs last week" />,
      chart: <MiniLine />,
    };
    return (
      <div className="grid w-[640px] grid-cols-2 items-start gap-4">
        <div data-testid="loaded">
          <KpiCard label="Sessions" value="84 210" sub="today" {...slots} />
        </div>
        <div data-testid="loading">
          <KpiCard label="Sessions" value="84 210" sub="today" {...slots} loading />
        </div>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const card = (id: string) => canvas.getByTestId(id).firstElementChild as HTMLElement;
    expect(card('loading').getAttribute('aria-busy')).toBe('true');
    expect(card('loaded').hasAttribute('aria-busy')).toBe(false);
    expect(card('loading').getBoundingClientRect().height).toBe(
      card('loaded').getBoundingClientRect().height
    );
    // The label and the icon stay; the loaded content is hidden, not announced.
    expect(within(card('loading')).getByText('Sessions')).toBeVisible();
    expect(card('loading').querySelector('svg')).toBeVisible();
    expect(within(card('loading')).getByText('84 210')).not.toBeVisible();
    expect(within(card('loading')).queryByText(/increase/)).not.toBeVisible();
  },
};

/** The link card is one tab stop named by its content, with the package's focus ring. */
export const LinkIsOneFocusable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...AsLink.args },
  play: async ({ canvas, canvasElement }) => {
    const link = canvas.getByRole('link', { name: /Open tickets/ });
    expect(link).toHaveAttribute('href', '#tickets');
    expect(canvasElement.querySelectorAll('a, button')).toHaveLength(1);
    expect(link.querySelectorAll('a, button, [tabindex]')).toHaveLength(0);
    await expectFocusRing(link);
    await userEvent.tab();
    expect(link).not.toHaveFocus();
  },
};

export const ButtonIsOneFocusable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...AsButton.args, onClick: fn() },
  play: async ({ canvas, canvasElement, args }) => {
    const button = canvas.getByRole('button', { name: /Open tickets/ });
    expect(button).toHaveAttribute('type', 'button');
    expect(canvasElement.querySelectorAll('a, button')).toHaveLength(1);
    await expectFocusRing(button);
    await userEvent.keyboard('{Enter}');
    await userEvent.click(button);
    expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

/** A card that is neither link nor button stays a plain block, out of the tab order. */
export const PlainCardIsNotFocusable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Default.args },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelectorAll('a, button, [tabindex]')).toHaveLength(0);
  },
};

const linkRef = createRef<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>();
const buttonRef = createRef<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>();

/** The ref gets the card's root, an `<a>` with `href` and a `<button>` with `onClick`. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <KpiCard ref={linkRef} label="Linked" value="1" href="#linked" />
      <KpiCard ref={buttonRef} label="Pressed" value="2" onClick={() => {}} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(linkRef, canvas.getByRole('link', { name: /Linked/ }));
    await expectRefFocuses(buttonRef, canvas.getByRole('button', { name: /Pressed/ }));
  },
};

/** A loading button card holds phrasing content only: its skeletons are spans, not divs. */
export const LoadingButtonHoldsNoBlockElement: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Loading.args, onClick: fn() },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /Sessions/ });
    expect(button.querySelectorAll('.animate-pulse')).toHaveLength(3);
    expect(button.querySelectorAll('div, p')).toHaveLength(0);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The label and the value start at the start edge, the icon chip sits at the end one. */
export const LabelAndIconMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <KpiCard
        label="Total Racks"
        value="48"
        sub="across 3 sites"
        icon={Server}
        delta={<TrendDelta value={12.4} size="sm" />}
      />
    )),
  play: ({ canvasElement }) => {
    for (const text of ['Total Racks', '48', 'across 3 sites'])
      expectMirrored(canvasElement, (box) => within(box).getByText(text));
    expectMirrored(canvasElement, (box) => box.querySelector('svg.lucide-server')!.parentElement);
    const ltr = directionBox(canvasElement, 'ltr');
    const rtl = directionBox(canvasElement, 'rtl');
    const chip = (box: HTMLElement) => box.querySelector('svg.lucide-server')!.parentElement!;
    expect(endOffset(chip(rtl), rtl)).toBeCloseTo(endOffset(chip(ltr), ltr), 0);
    // The trend arrow points up or down, not along the line.
    const arrow = (box: HTMLElement) => box.querySelector('svg.lucide-trending-up')!;
    expect(getComputedStyle(arrow(rtl)).scale).toBe('none');
    expect(getComputedStyle(arrow(ltr)).scale).toBe('none');
  },
};

/** A `sub` that starts with a number keeps its order in a right-to-left card. */
export const SubReadsLeftToRightInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <KpiCard label="Crit alerts" value="3" sub="2 escalated" icon={ShieldAlert} />
    )),
  play: ({ canvasElement }) => {
    for (const box of canvasElement.querySelectorAll<HTMLElement>('[data-direction]'))
      expectReadsLeftToRight(within(box).getByText('2 escalated'));
  },
};

const tooltipOpacity = () =>
  Number(getComputedStyle(within(document.body).getByRole('tooltip')).opacity);

/** On a plain card the value takes focus; the tooltip shows on focus and on hover, Escape hides it. */
export const ExactValueShowsOnFocusAndHover: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ExactValue.args },
  play: async ({ canvas }) => {
    const tooltip = within(document.body).getByRole('tooltip');
    await expect(tooltip).toHaveTextContent('€12,418,906.40');
    await expect(tooltipOpacity()).toBe(0);

    await userEvent.tab();
    const value = canvas.getByText('€12.4M').closest('[tabindex]') as HTMLElement;
    await expect(value).toHaveFocus();
    await waitFor(() => expect(tooltipOpacity()).toBe(1));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tooltipOpacity()).toBe(0));

    value.blur();
    await userEvent.hover(canvas.getByText('€12.4M'));
    await waitFor(() => expect(tooltipOpacity()).toBe(1));
    await userEvent.unhover(canvas.getByText('€12.4M'));
    await waitFor(() => expect(tooltipOpacity()).toBe(0));
  },
};

/** A link card keeps its one tab stop; the tooltip shows when the card takes keyboard focus. */
export const ExactValueShowsWhenTheCardIsFocused: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ExactValue.args, href: '#revenue' },
  play: async ({ canvas, canvasElement }) => {
    const link = canvas.getByRole('link', { name: /€12\.4M.*€12,418,906\.40/ });
    await expect(canvasElement.querySelectorAll('a, button, [tabindex]')).toHaveLength(1);
    await expect(tooltipOpacity()).toBe(0);
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await waitFor(() => expect(tooltipOpacity()).toBe(1));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tooltipOpacity()).toBe(0));
  },
};

/** The exact figure is in the name of a button card; the tooltip describes the value inside it, not the button. */
export const ExactValueIsInTheAccessibleName: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ExactValue.args, onClick: fn() },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /Revenue.*€12\.4M.*€12,418,906\.40/ });
    await expect(button).toHaveAccessibleDescription('');
  },
};

/** The tooltip's trigger does not change the card's size. */
export const ExactValueKeepsTheCardHeight: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-start gap-4">
      <div className="w-64" data-case="plain">
        <KpiCard label="Revenue" value="€12.4M" />
      </div>
      <div className="w-64" data-case="exact">
        <KpiCard label="Revenue" value="€12.4M" exactValue="€12,418,906.40" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const height = (name: string) =>
      canvasElement.querySelector(`[data-case="${name}"] > div`)!.getBoundingClientRect().height;
    await expect(height('exact')).toBe(height('plain'));
  },
};

// ── Chart beside the value, tinted card ─────────────────────────────────────

const GoalRing = () => <ProgressRing aria-label="Monthly goal reached" value={77} size="lg" />;

const goalCard = (props: Partial<React.ComponentProps<typeof KpiCard>> = {}) => (
  <KpiCard
    label="Monthly goal"
    value="77%"
    sub="of $50 000"
    icon={CreditCard}
    delta={<TrendDelta value={9.6} label="vs last month" />}
    chart={<GoalRing />}
    chartPosition="end"
    {...props}
  />
);

/** `chartPosition="end"`: the ring sits beside the value, delta and sub line, centered on them. */
export const ChartBesideTheValue: Story = {
  globals: { viewport: { value: 'laptop', isRotated: false } },
  render: () => <div className="max-w-sm">{goalCard()}</div>,
};

/** On a phone the card takes the width of the screen: the ring stays beside the figure. */
const chartBesideTheValueOnMobile: Story = {
  globals: mobileViewport,
  render: () => (
    <div className="grid gap-4">
      {goalCard()}
      {goalCard({ label: 'Uptime', value: '99.98%', icon: Server })}
    </div>
  ),
};

export const ChartBesideTheValueOnMobileChecks: Story = {
  ...chartBesideTheValueOnMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    for (const ring of within(canvasElement).getAllByRole('progressbar')) {
      const card = ring.closest('div[aria-busy], div.rounded-2xl') as HTMLElement;
      const value = within(card).getByText(/^\d+(\.\d+)?%$/);
      // Beside the value, not under it: on its row, and after it along the line.
      await expect(ring.getBoundingClientRect().top).toBeLessThan(
        value.getBoundingClientRect().bottom
      );
      await expect(startOffset(ring, card)).toBeGreaterThanOrEqual(
        startOffset(value, card) + value.getBoundingClientRect().width
      );
    }
  },
};

// The card's value, its delta and the ring, by the part of the card they belong to.
const placed = (card: HTMLElement) => ({
  value: within(card).getByText('77%').getBoundingClientRect(),
  delta: within(card).getByText('vs last month').getBoundingClientRect(),
  ring: within(card).getByRole('progressbar').getBoundingClientRect(),
  box: card.getBoundingClientRect(),
});

export const ChartPositionEndSitsBesideTheValue: Story = {
  ...ChartBesideTheValue,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const card = canvas.getByText('Monthly goal').closest('div.rounded-2xl') as HTMLElement;
    const { value, ring } = placed(card);
    const valueEl = within(card).getByText('77%');
    const ringEl = within(card).getByRole('progressbar');
    await expect(startOffset(ringEl, card)).toBeGreaterThanOrEqual(
      startOffset(valueEl, card) + value.width
    );
    // At the end of the line, inside the card's border and padding (1px and 20px).
    await expect(endOffset(ringEl, card)).toBeCloseTo(21, 0);
    // Centered on the figure: value, delta and sub line.
    const figure = within(card).getByText('of $50 000').getBoundingClientRect();
    const middle = (value.top + figure.bottom) / 2;
    await expect(Math.abs(ring.top + ring.height / 2 - middle)).toBeLessThan(8);
  },
};

/** The default stays what it was: the chart under the delta, the full width of the card. */
export const ChartPositionBottomIsTheDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <div className="max-w-sm">{goalCard({ chartPosition: undefined })}</div>,
  play: async ({ canvas }) => {
    const card = canvas.getByText('Monthly goal').closest('div.rounded-2xl') as HTMLElement;
    const { delta, ring } = placed(card);
    await expect(ring.top).toBeGreaterThanOrEqual(delta.bottom);
  },
};

/** Too narrow for both, the ring drops under the figure, at the start of the line. */
export const ChartPositionEndDropsUnderInANarrowCard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <div style={{ width: 220 }}>{goalCard()}</div>,
  play: async ({ canvas }) => {
    const card = canvas.getByText('Monthly goal').closest('div.rounded-2xl') as HTMLElement;
    const { value, ring } = placed(card);
    const ringEl = within(card).getByRole('progressbar');
    await expect(ring.top).toBeGreaterThanOrEqual(value.bottom);
    await expect(startOffset(ringEl, card)).toBeCloseTo(
      startOffset(within(card).getByText('77%'), card),
      0
    );
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    await expect(endOffset(ringEl, card)).toBeGreaterThanOrEqual(0);
  },
};

/** While loading, the ring's place and the card's height are kept. */
export const ChartPositionEndKeepsItsLayoutWhileLoading: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid max-w-3xl grid-cols-2 gap-4">
      <div data-testid="loaded">{goalCard()}</div>
      <div data-testid="loading">{goalCard({ loading: true })}</div>
    </div>
  ),
  play: async ({ canvas }) => {
    const loaded = canvas.getByTestId('loaded').firstElementChild as HTMLElement;
    const loading = canvas.getByTestId('loading').firstElementChild as HTMLElement;
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.getBoundingClientRect().height).toBeCloseTo(
      loaded.getBoundingClientRect().height,
      0
    );
  },
};

/** `variant="tinted"`: the tinted surface of the card's meaning, for the one figure a dashboard leads with. */
export const Tinted: Story = {
  args: {
    label: 'Monthly recurring revenue',
    value: '$128 490',
    sub: 'of $150 000 planned',
    icon: CreditCard,
    variant: 'tinted',
    delta: <TrendDelta value={12.4} label="vs last month" />,
  },
};

export const TintedWithRing: Story = {
  render: () => <div className="max-w-sm">{goalCard({ variant: 'tinted' })}</div>,
};

/** One tinted card leading a row of plain ones. */
export const TintedLeadsTheGrid: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        variant="tinted"
        className="lg:col-span-2"
        label="Monthly recurring revenue"
        value="$128 490"
        sub="of $150 000 planned"
        icon={CreditCard}
        delta={<TrendDelta value={12.4} label="vs last month" />}
      />
      <KpiCard label="Active users" value="12 480" icon={Users} />
      <KpiCard label="Open tickets" value="128" sub="across 3 queues" />
    </div>
  ),
};

/** A tinted card takes the tint of its intent. */
export const TintedIntents: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard
        variant="tinted"
        label="Revenue"
        value="$48 920"
        sub="this month"
        icon={CreditCard}
        delta={<TrendDelta value={12.4} label="vs last month" />}
      />
      <KpiCard
        variant="tinted"
        intent="warning"
        label="Disk usage"
        value="82%"
        sub="of 4 TB"
        icon={Server}
        delta={<TrendDelta value={5.1} goodDirection="down" label="vs last week" />}
      />
      <KpiCard
        variant="tinted"
        intent="danger"
        label="CRIT alerts"
        value="3"
        sub="2 escalated"
        icon={ShieldAlert}
        delta={<TrendDelta value={50} goodDirection="down" label="vs last week" />}
      />
    </div>
  ),
};

const tintedOnMobile: Story = {
  ...TintedIntents,
  globals: mobileViewport,
};

export const TintedOnMobileChecks: Story = {
  ...tintedOnMobile,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

export const VariantsChangeTheSurface: Story = {
  ...TintedIntents,
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 sm:grid-cols-4">
      <KpiCard label="Plain" value="1" />
      <KpiCard variant="tinted" label="Tinted" value="2" />
      <KpiCard variant="tinted" intent="warning" label="Warning" value="3" />
      <KpiCard variant="tinted" intent="danger" label="Danger" value="4" />
      <KpiCard variant="solid" intent="danger" label="Solid" value="5" />
    </div>
  ),
  play: async ({ canvas }) => {
    const card = (label: string) =>
      canvas.getByText(label).closest('div.rounded-2xl') as HTMLElement;
    const surface = (label: string) => {
      const style = getComputedStyle(card(label));
      return [style.backgroundColor, style.borderTopColor].join(' ');
    };
    const surfaces = ['Plain', 'Tinted', 'Warning', 'Danger', 'Solid'].map(surface);
    await expect(new Set(surfaces).size).toBe(5);
  },
};

/** The label, value and sub line of a tinted card keep 4.5:1 on its tint, in every theme and accent (the chip's icon is decorative). */
export const TintedStaysReadableInEveryThemeAndAccent: Story = {
  ...TintedIntents,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const saved = root.getAttribute('data-accent');
    try {
      for (const { id } of COSMOS_ACCENTS) {
        root.setAttribute('data-accent', id);
        inEachTheme(() => {
          try {
            for (const card of canvasElement.querySelectorAll<HTMLElement>('div.rounded-2xl')) {
              const spans = [
                ...card.querySelectorAll<HTMLElement>(
                  'span.uppercase, span.text-3xl, span.text-xs, span.text-gray-500'
                ),
              ];
              expect(spans.length).toBeGreaterThanOrEqual(3);
              for (const text of spans) expectTextContrastOnTint(text);
            }
          } catch (error) {
            throw new Error(`[${id}] ${(error as Error).message}`, { cause: error });
          }
        });
      }
    } finally {
      if (saved === null) root.removeAttribute('data-accent');
      else root.setAttribute('data-accent', saved);
    }
  },
};

// ── Solid ──────────────────────────────────────────────────────────────────

const SolidSeverities = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <KpiCard
      variant="solid"
      intent="danger"
      label="Critical"
      value="4"
      sub="+1 in the last hour"
      icon={TriangleAlert}
      href="#alerts"
    />
    <KpiCard
      variant="solid"
      intent="warning"
      label="Warning"
      value="6"
      sub="2 acknowledged"
      icon={CircleAlert}
      href="#alerts"
    />
    <KpiCard
      variant="solid"
      intent="info"
      label="Info"
      value="4"
      sub="Maintenance tomorrow 06:00"
      icon={Info}
    />
    <KpiCard
      variant="solid"
      label="Unknown"
      value="1"
      sub="An exporter stopped answering"
      icon={CircleQuestionMark}
    />
  </div>
);

/**
 * `variant="solid"`: the card filled with its intent and written in white, for a status that has to
 * stand out from across the room, as the alert counts of a monitoring screen. A neutral card is the
 * dark ink of the theme, light in a dark one.
 */
export const Solid: Story = { render: () => <SolidSeverities /> };

/** The label, value and sub line of a solid card keep 4.5:1 on its fill, in every theme and accent. */
export const SolidStaysReadableInEveryThemeAndAccent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <SolidSeverities />,
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const saved = root.getAttribute('data-accent');
    try {
      for (const { id } of COSMOS_ACCENTS) {
        root.setAttribute('data-accent', id);
        inEachTheme(() => {
          try {
            const cards = canvasElement.querySelectorAll<HTMLElement>('.rounded-2xl');
            expect(cards).toHaveLength(4);
            for (const card of cards) {
              const spans = [
                ...card.querySelectorAll<HTMLElement>(
                  'span.uppercase, span.text-3xl, span.text-xs'
                ),
              ];
              expect(spans.length).toBeGreaterThanOrEqual(3);
              for (const text of spans) expectTextContrastOnTint(text);
            }
          } catch (error) {
            throw new Error(`[${id}] ${(error as Error).message}`, { cause: error });
          }
        });
      }
    } finally {
      if (saved === null) root.removeAttribute('data-accent');
      else root.setAttribute('data-accent', saved);
    }
  },
};

/** A solid link card keeps the edge of its fill under the pointer: only the lift moves. */
export const SolidKeepsItsEdgeUnderThePointer: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <SolidSeverities />,
  play: async ({ canvas }) => {
    const card = canvas.getByRole('link', { name: /Critical/ });
    const edge = getComputedStyle(card).borderTopColor;
    await expect(edge).toBe(getComputedStyle(card).backgroundColor);
    await userEvent.hover(card);
    await expect(getComputedStyle(card).borderTopColor).toBe(edge);
  },
};

// ── Motion ───────────────────────────────────────────────────────────────────

const LiftingCards = () => (
  <div className="grid gap-6 p-4 sm:grid-cols-3">
    <KpiCard label="Link card" value="1" href="#tickets" />
    <KpiCard label="Button card" value="2" onClick={fn()} />
    <KpiCard label="Plain card" value="3" />
  </div>
);

/** A card that is a link or a button rises 2px with a soft shadow; a plain one never does. */
export const ClickableCardsLift: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LiftingCards />,
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /Link card/ });
    const button = canvas.getByRole('button', { name: /Button card/ });
    const plain = canvas.getByText('Plain card').closest('div.rounded-2xl') as HTMLElement;
    expectLiftsOnHover(link);
    expectLiftsOnHover(button);
    expectStaysUnderHover(plain);

    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(getComputedStyle(link).translate).toBe(LIFTED);
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(getComputedStyle(button).translate).toBe(LIFTED);
    await expect(getComputedStyle(link).translate).toBe('none');
    await expect(getComputedStyle(plain).translate).toBe('none');
  },
};

/** The raised card keeps the place it had under the pointer, so a pointer on its lower edge holds. */
export const LiftedCardKeepsItsPlace: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LiftingCards />,
  play: async ({ canvas }) => {
    expectKeepsItsPlace(canvas.getByRole('link', { name: /Link card/ }));
    expectKeepsItsPlace(canvas.getByRole('button', { name: /Button card/ }));
  },
};

/** At its real speed the card moves over the base duration, 200 ms, with its shadow and border. */
export const LiftMovesOnTheBaseToken: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <LiftingCards />,
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /Link card/ });
    await expect(transitionMs(link)).toBe(tokenMs('--cosmos-motion-base'));
    await expect(transitions(link, 'translate', 'box-shadow', 'border-color')).toBe(true);
  },
};

/** With the reduced setting the card is lifted at once, with no length to move over. */
export const LiftSkipsMotionWhenReduced: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { motion: 'reduced' },
  parameters: { settleMotion: false },
  render: () => <LiftingCards />,
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /Link card/ });
    await expect(transitionMs(link)).toBe(0);
    await userEvent.tab();
    await expect(getComputedStyle(link).translate).toBe(LIFTED);
  },
};

// ── Skeleton to content ──────────────────────────────────────────────────────

const ArrivingCard = ({ startLoading }: { startLoading: boolean }) => (
  <LoadToggle startLoading={startLoading}>
    {(loading) => (
      <KpiCard
        label="Sessions"
        value="84 210"
        icon={Server}
        delta={<TrendDelta value={8.2} label="vs last week" />}
        chart={<MiniLine />}
        loading={loading}
        className="w-72"
      />
    )}
  </LoadToggle>
);

const sessionsCard = (canvas: ReturnType<typeof within>) => () =>
  canvas.getByText('Sessions').closest('div.rounded-2xl')!;

/** The figures fade in when the data arrives, then stand as they are; a reload plays it again. */
export const FiguresFadeInAfterLoading: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <ArrivingCard startLoading />,
  play: async ({ canvas }) => {
    await expectFadesInAfterSkeleton(canvas, sessionsCard(canvas));
  },
};

/** A card that has its figures from the first render does not fade them in. */
export const FiguresFromTheFirstRenderDoNotFade: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <ArrivingCard startLoading={false} />,
  play: async ({ canvas }) => {
    await expectNoFadeFromFirstRender(canvas, sessionsCard(canvas));
  },
};

/** With the reduced setting the figures take the skeleton's place at once. */
export const FiguresSkipTheFadeWhenReduced: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { motion: 'reduced' },
  parameters: { settleMotion: false },
  render: () => <ArrivingCard startLoading />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Load' }));
    await waitFor(() => expect(fadeIns(sessionsCard(canvas)())).toHaveLength(0));
    await expect(canvas.getByText('84 210')).toBeVisible();
  },
};

/** The exact value's caption and its screen reader text, from the provider; the card's own win. */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider
      labels={{ kpiCard: { exactValue: 'Valeur exacte', exactValueHint: ', valeur exacte' } }}
    >
      <KpiCard label="Revenu" value="12,4 M€" exactValue="12 418 906,40 €" />
      <KpiCard
        label="Tickets"
        value="1,2k"
        exactValue="1 184"
        labels={{ exactValueHint: ', soit exactement' }}
      />
    </LabelsProvider>
  ),
  play: async ({ canvas, canvasElement }) => {
    const hints = canvasElement.querySelectorAll('.sr-only');
    await expect(hints[0]).toHaveTextContent(', valeur exacte 12 418 906,40 €');
    await expect(hints[1]).toHaveTextContent(', soit exactement 1 184');
    await userEvent.hover(canvas.getByText('12,4 M€'));
    await expect(await within(document.body).findAllByText('Valeur exacte')).not.toHaveLength(0);
  },
};
