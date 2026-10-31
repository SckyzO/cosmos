import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef } from 'react';
import { CreditCard, Server, ShieldAlert, Users } from 'lucide-react';
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
  mobileViewport,
} from '../storybook-helpers';
import { ProgressBar } from '../ui/ProgressBar';
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

/** With `href` the whole card is one link: the border turns to the accent on hover. */
export const AsLink: Story = {
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
export const Mobile: Story = {
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
  play: ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    for (const card of canvasElement.querySelectorAll<HTMLElement>('div > div, div > a')) {
      expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }
  },
};

/** The exact value behind an abbreviated one: a tooltip on hover and focus, and in the card's name. */
export const ExactValue: Story = {
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
