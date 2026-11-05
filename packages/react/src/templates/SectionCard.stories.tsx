import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState, type ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  Activity,
  Bell,
  ChevronDown,
  Cpu,
  Database,
  KeyRound,
  Lock,
  RotateCw,
  Server,
  ShieldCheck,
  Thermometer,
  Trash2,
  User,
  Users,
  Zap,
} from 'lucide-react';
import {
  expectFadesInAfterSkeleton,
  expectNoFadeFromFirstRender,
  LoadToggle,
} from '../storybook-arrival';
import { StatusBadge } from '../status/StatusBadge';
import { DataTable } from '../table/DataTable';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../table/Table';
import type { ColumnDef } from '../table/types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { Intent } from '../ui/intent';
import { ProgressRing } from '../ui/ProgressRing';
import { SectionCard, type SectionCardIconTone, type SectionCardProps } from './SectionCard';
import {
  endEdge,
  endOffset,
  expectMirrored,
  expectNoHorizontalOverflow,
  mobileViewport,
  startEdge,
  startOffset,
} from '../storybook-helpers';

const meta = {
  title: 'Layout/Section Card',
  component: SectionCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Title', children: null },
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// A card is a region named by its title, and two regions with one name fail axe's
// `landmark-unique`: the card of each direction gets its own title.
const inBothDirections = (card: (title: string) => ReactNode) =>
  (['ltr', 'rtl'] as const).map((dir) => (
    <div key={dir} dir={dir} data-direction={dir} className="mb-4">
      {card(`Servers, ${dir}`)}
    </div>
  ));

export const Default: Story = {
  args: {
    title: 'Connection settings',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Servers',
    icon: Server,
    desc: 'Active fleet across 3 sites',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};

export const WithTone: Story = {
  args: {
    title: 'Account',
    icon: User,
    iconTone: 'blue',
    desc: 'Personal info and login details.',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};

const TONE_DEMOS: { tone: SectionCardIconTone; title: string; icon: typeof User }[] = [
  { tone: 'brand', title: 'Brand', icon: Zap },
  { tone: 'blue', title: 'Account', icon: User },
  { tone: 'violet', title: 'Username', icon: Users },
  { tone: 'green', title: 'Password', icon: KeyRound },
  { tone: 'amber', title: 'Storage', icon: Trash2 },
  { tone: 'red', title: 'Danger zone', icon: Lock },
  { tone: 'gray', title: 'Default tone', icon: Server },
];

export const ToneGallery: Story = {
  args: { title: '' },
  render: () => (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
      {TONE_DEMOS.map(({ tone, title, icon }) => (
        <SectionCard
          key={tone}
          title={title}
          icon={icon}
          iconTone={tone}
          desc={`iconTone="${tone}"`}
        >
          <p className="text-xs text-[var(--color-text-secondary)]">
            Section body — same shell, recolored icon affordance.
          </p>
        </SectionCard>
      ))}
    </div>
  ),
};

export const RawClassEscapeHatch: Story = {
  args: {
    title: 'Custom palette',
    icon: Server,
    iconColor: 'text-pink-600 dark:text-pink-400',
    iconBg: 'bg-pink-500/10 dark:bg-pink-500/20',
    desc: 'Pass `iconColor` + `iconBg` directly when `iconTone` presets do not fit.',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};

/** SectionCard is a Card with 24px padding: same radius, same padding as `Card padding="lg"`. */
export const IsACardWithLargePadding: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: 'Panel', children: <p>Body</p> },
  play: async ({ canvas }) => {
    const panel = canvas
      .getByRole('heading', { name: 'Panel' })
      .closest('.rounded-2xl') as HTMLElement;
    const style = getComputedStyle(panel);
    await expect(style.paddingLeft).toBe('24px');
    await expect(style.borderTopLeftRadius).toBe('16px');
    await expect(style.overflow).toBe('hidden');
  },
};

/** `as` picks the heading element of the title, `h3` by default. */
export const TitleHeadingLevel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <h1 className="sr-only">Page</h1>
      <SectionCard as="h2" title="Under the page heading">
        <p>Body</p>
      </SectionCard>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Under the page heading' })
    ).toBeVisible();
  },
};

// ── Action and states ───────────────────────────────────────────────────────

const laptop = { viewport: { value: 'laptop', isRotated: false } } as const;

const RangeMenu = () => (
  <Button variant="secondary" size="sm" icon={ChevronDown} iconPosition="end">
    Last 30 days
  </Button>
);

const Figures = () => (
  <p className="text-sm text-[var(--color-text-secondary)]">
    Weekly revenue closed at €31.5k, up 4% on the week before.
  </p>
);

const REVENUE = {
  title: 'Revenue over time',
  desc: 'Weekly, last 30 days',
  action: <RangeMenu />,
  children: <Figures />,
};

/**
 * `action` sits at the end of the header: a range menu, a "View all" link. Below `sm` it goes
 * under the title.
 */
export const WithAction: Story = { args: REVENUE };

/** `loading`: a skeleton in place of the body. The header, action included, stays. */
export const Loading: Story = { args: { ...REVENUE, loading: true, minBodyHeight: 'min-h-44' } };

/** `empty`: a compact `EmptyState` with `emptyMessage` and, optionally, an `emptyAction`. */
export const Empty: Story = {
  args: {
    ...REVENUE,
    empty: true,
    emptyMessage: 'No revenue yet',
    emptyAction: (
      <Button variant="secondary" size="sm">
        Connect your store
      </Button>
    ),
    minBodyHeight: 'min-h-44',
  },
};

/** `error`: a compact `ErrorState`; `onRetry` adds "Try again". Only this card fails. */
export const LoadError: Story = {
  name: 'Error',
  args: {
    ...REVENUE,
    error: true,
    errorMessage: "Couldn't load revenue",
    errorDescription: 'The request timed out. Your other widgets are up to date.',
    onRetry: fn(),
    minBodyHeight: 'min-h-44',
  },
};

/** At 375px the action moves under the title, in every state. */
const phone: Story = {
  globals: mobileViewport,
  args: REVENUE,
};

const SIDE_BY_SIDE = [
  { title: 'Revenue', state: {} },
  { title: 'Orders', state: { loading: true } },
  { title: 'Subscribers', state: { empty: true, emptyMessage: 'No subscribers yet' } },
  { title: 'Refunds', state: { error: true, errorMessage: "Couldn't load refunds" } },
] as const;

const SideBySide = () => (
  <div className="grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {SIDE_BY_SIDE.map(({ title, state }) => (
      <SectionCard key={title} title={title} action={<RangeMenu />} {...state}>
        <div className="h-56 text-sm text-[var(--color-text-secondary)]">Tall content.</div>
      </SectionCard>
    ))}
  </div>
);

/**
 * Four cards of a grid, one per state. The body takes the height the grid gives the card and
 * centres the state in it, so the cards stay level.
 */
export const StatesInAGrid: Story = {
  globals: laptop,
  args: { title: '' },
  render: () => <SideBySide />,
};

// ── Action and states: checks ────────────────────────────────────────────────

type Canvas = Parameters<NonNullable<Story['play']>>[0]['canvas'];

const region = (canvas: Canvas, name: string) => canvas.getByRole('region', { name });

/** The header of a card in any state: the title, the description and the action. */
const expectHeaderKept = async (card: HTMLElement) => {
  const scope = within(card);
  await expect(scope.getByRole('heading', { name: 'Revenue over time' })).toBeVisible();
  await expect(scope.getByText('Weekly, last 30 days')).toBeVisible();
  await expect(scope.getByRole('button', { name: 'Last 30 days' })).toBeVisible();
};

export const ActionChecks: Story = {
  ...WithAction,
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  play: async ({ canvas }) => {
    const card = region(canvas, 'Revenue over time');
    const title = within(card).getByRole('heading').getBoundingClientRect();
    const button = within(card).getByRole('button', { name: 'Last 30 days' });
    const action = button.getBoundingClientRect();
    // Same row, after the title, flush with the card's padding (24px) and border (1px).
    await expect(startEdge(action, card)).toBeGreaterThan(endEdge(title, card));
    await expect(action.top).toBeLessThan(title.bottom);
    await expect(endOffset(button, card)).toBeCloseTo(25, 0);
  },
};

/** The action ends the header at the end edge, which is the left one in right to left. */
export const ActionFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => (
    <>
      {inBothDirections((title) => (
        <SectionCard {...REVENUE} title={title} />
      ))}
    </>
  ),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('button'));
  },
};

export const PhoneChecks: Story = {
  ...phone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const card = region(canvas, 'Revenue over time');
    const description = within(card).getByText('Weekly, last 30 days').getBoundingClientRect();
    const title = within(card).getByRole('heading');
    const button = within(card).getByRole('button', { name: 'Last 30 days' });
    // Under the title block, on the line's start edge.
    await expect(button.getBoundingClientRect().top).toBeGreaterThanOrEqual(description.bottom);
    await expect(startOffset(button, card)).toBeCloseTo(startOffset(title, card), 0);
  },
};

/** The title is 16px, the size of a card heading in the recipes. */
export const TitleIsSixteenPixels: Story = {
  ...WithAction,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const title = canvas.getByRole('heading', { name: 'Revenue over time' });
    await expect(getComputedStyle(title).fontSize).toBe('16px');
    await expect(getComputedStyle(title).fontWeight).toBe('600');
  },
};

/** The description is 14px under the title, and the body starts 16px under the header. */
export const DescriptionIsFourteenPixels: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <SectionCard title="Revenue over time" desc="Weekly, last 30 days">
      <Figures />
    </SectionCard>
  ),
  play: async ({ canvas }) => {
    const desc = canvas.getByText('Weekly, last 30 days');
    await expect(getComputedStyle(desc).fontSize).toBe('14px');
    const body = canvas.getByText(/Weekly revenue closed/);
    await expect(
      body.getBoundingClientRect().top - desc.getBoundingClientRect().bottom
    ).toBeCloseTo(16, 0);
  },
};

/** The card is a region named by its title: a screen reader lists the cards of a page. */
export const RootIsARegionNamedByItsTitle: Story = {
  ...WithAction,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const card = region(canvas, 'Revenue over time');
    await expect(card.tagName).toBe('SECTION');
    const title = within(card).getByRole('heading', { name: 'Revenue over time' });
    await expect(card).toHaveAttribute('aria-labelledby', title.id);
    await expect(title.id).not.toBe('');
  },
};

export const LoadingChecks: Story = {
  ...Loading,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const card = region(canvas, 'Revenue over time');
    await expect(card).toHaveAttribute('aria-busy', 'true');
    await expect(within(card).getByRole('status')).toHaveTextContent('Loading Revenue over time');
    await expect(card.querySelector('.animate-pulse')).not.toBeNull();
    await expect(within(card).queryByText(/Weekly revenue closed/)).toBeNull();
    await expectHeaderKept(card);
  },
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const card = region(canvas, 'Revenue over time');
    await expect(card).not.toHaveAttribute('aria-busy');
    await expect(within(card).getByText('No revenue yet')).toBeVisible();
    await expect(within(card).getByRole('button', { name: 'Connect your store' })).toBeVisible();
    await expect(within(card).queryByText(/Weekly revenue closed/)).toBeNull();
    // Nothing changed under the reader: no announcement.
    await expect(within(card).queryByRole('alert')).toBeNull();
    await expect(within(card).queryByRole('status')).toBeNull();
    await expectHeaderKept(card);
  },
};

export const ErrorChecks: Story = {
  ...LoadError,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    const card = region(canvas, 'Revenue over time');
    const alert = within(card).getByRole('alert');
    await expect(alert).toHaveTextContent("Couldn't load revenue");
    // The description sits under the message, inside the alert.
    const description = within(alert).getByText(
      'The request timed out. Your other widgets are up to date.'
    );
    await expect(description.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      within(alert).getByText("Couldn't load revenue").getBoundingClientRect().bottom
    );
    await expect(within(card).queryByText(/Weekly revenue closed/)).toBeNull();
    await expectHeaderKept(card);
    await userEvent.click(within(card).getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    // The prop is `() => void`: the click event stays with the button.
    await expect(args.onRetry).toHaveBeenCalledWith();
  },
};

/** Without `onRetry` there is nothing to retry; without messages the states use their own. */
export const StatesHaveDefaultMessages: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div>
      <SectionCard title="Failing" error>
        <Figures />
      </SectionCard>
      <SectionCard title="Nothing" empty>
        <Figures />
      </SectionCard>
    </div>
  ),
  play: async ({ canvas }) => {
    const failing = region(canvas, 'Failing');
    // No `errorDescription`: the alert holds the message and nothing else.
    await expect(within(failing).getByRole('alert').textContent).toBe('Something went wrong.');
    await expect(within(failing).queryByRole('button')).toBeNull();
    await expect(within(region(canvas, 'Nothing')).getByText('No data')).toBeVisible();
  },
};

/** The action stays in every state: the host removes it where it makes no sense. */
export const ActionStaysInEveryState: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div>
      {SIDE_BY_SIDE.map(({ title, state }) => (
        <SectionCard key={title} title={title} action={<RangeMenu />} {...state}>
          <Figures />
        </SectionCard>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const { title } of SIDE_BY_SIDE) {
      await expect(
        within(region(canvas, title)).getByRole('button', { name: 'Last 30 days' })
      ).toBeVisible();
    }
  },
};

/** `loading` beats `error`, which beats `empty`, which beats the children. */
export const LoadingBeatsErrorBeatsEmpty: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div>
      <SectionCard title="All three" loading error empty>
        <Figures />
      </SectionCard>
      <SectionCard title="Error and empty" error empty>
        <Figures />
      </SectionCard>
      <SectionCard title="Empty" empty>
        <Figures />
      </SectionCard>
      <SectionCard title="None">
        <Figures />
      </SectionCard>
    </div>
  ),
  play: async ({ canvas }) => {
    const all = within(region(canvas, 'All three'));
    await expect(all.getByRole('status')).toHaveTextContent('Loading All three');
    await expect(all.queryByRole('alert')).toBeNull();
    await expect(all.queryByText('No data')).toBeNull();
    const both = within(region(canvas, 'Error and empty'));
    await expect(both.getByRole('alert')).toBeVisible();
    await expect(both.queryByText('No data')).toBeNull();
    await expect(within(region(canvas, 'Empty')).getByText('No data')).toBeVisible();
    for (const name of ['All three', 'Error and empty', 'Empty']) {
      await expect(within(region(canvas, name)).queryByText(/Weekly revenue closed/)).toBeNull();
    }
    await expect(within(region(canvas, 'None')).getByText(/Weekly revenue closed/)).toBeVisible();
  },
};

export const StatesInAGridChecks: Story = {
  ...StatesInAGrid,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const cards = SIDE_BY_SIDE.map(({ title }) => region(canvas, title));
    const height = cards[0]!.getBoundingClientRect().height;
    // The tall card sets the row: the three others stretch to it.
    for (const card of cards)
      await expect(card.getBoundingClientRect().height).toBeCloseTo(height, 0);
    const innerBottom = (card: HTMLElement) => card.getBoundingClientRect().bottom - 25;
    // The skeleton and the two state layouts fill the body down to the card's padding.
    const skeleton = cards[1]!.querySelector('.animate-pulse')!;
    await expect(skeleton.getBoundingClientRect().bottom).toBeCloseTo(innerBottom(cards[1]!), 0);
    const empty = within(cards[2]!).getByText('No subscribers yet').closest('div')!.parentElement!;
    await expect(empty.getBoundingClientRect().bottom).toBeCloseTo(innerBottom(cards[2]!), 0);
    const error = within(cards[3]!).getByRole('alert');
    await expect(error.getBoundingClientRect().bottom).toBeCloseTo(innerBottom(cards[3]!), 0);
  },
};

/** `minBodyHeight` keeps the body at least that tall in every state, so a card does not jump. */
export const MinBodyHeightHoldsEveryState: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div className="space-y-4">
      {SIDE_BY_SIDE.map(({ title, state }) => (
        <SectionCard key={title} title={title} minBodyHeight="min-h-56" {...state}>
          <Figures />
        </SectionCard>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const heights = SIDE_BY_SIDE.map(
      ({ title }) => region(canvas, title).getBoundingClientRect().height
    );
    // 224px of body, 24px of padding on each side, and the header above.
    await expect(heights[0]!).toBeGreaterThan(224 + 48);
    for (const height of heights) await expect(height).toBeCloseTo(heights[0]!, 0);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The icon tile leads the title, at the start edge of the card, in both directions. */
export const HeaderFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      {inBothDirections((title) => (
        <SectionCard title={title} icon={Server} desc="Active fleet across 3 sites">
          <p>Body</p>
        </SectionCard>
      ))}
    </>
  ),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('svg'));
    expectMirrored(canvasElement, (box) => box.querySelector('h3'));
  },
};

// ── Skeleton to content ──────────────────────────────────────────────────────

const ArrivingSection = ({ startLoading }: { startLoading: boolean }) => (
  <LoadToggle startLoading={startLoading}>
    {(loading) => (
      <SectionCard {...REVENUE} loading={loading} minBodyHeight="min-h-44" className="w-96" />
    )}
  </LoadToggle>
);

/** The body fades in when the data arrives, then stands as it is; a reload plays it again. */
export const BodyFadesInAfterLoading: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <ArrivingSection startLoading />,
  play: async ({ canvas }) => {
    await expectFadesInAfterSkeleton(canvas, () =>
      canvas.getByRole('region', { name: 'Revenue over time' })
    );
  },
};

/** A card that has its body from the first render does not fade it in. */
export const BodyFromTheFirstRenderDoesNotFade: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <ArrivingSection startLoading={false} />,
  play: async ({ canvas }) => {
    await expectNoFadeFromFirstRender(canvas, () =>
      canvas.getByRole('region', { name: 'Revenue over time' })
    );
  },
};

// ═══ Intent, variant, halo, accent, icon, header, footer, size, fold and stale ═══
// One visible story per feature (a demo that asserts nothing), and a hidden twin that checks it.

const INTENTS = [
  'neutral',
  'brand',
  'info',
  'success',
  'warning',
  'danger',
] as const satisfies readonly Intent[];
const VARIANTS = ['outline', 'tinted', 'solid'] as const;
type Variant = (typeof VARIANTS)[number];

const label = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

// The body text of a card: a solid one writes in its own ink, the others in the secondary color.
const Words = ({ solid = false, children }: { solid?: boolean; children: ReactNode }) => (
  <p className={solid ? 'text-sm' : 'text-sm text-[var(--color-text-secondary)]'}>{children}</p>
);

// ── Helpers of the checks ────────────────────────────────────────────────────

type Rgba = [number, number, number, number];

/** Any CSS color (`color-mix`, `oklab`…) as sRGB bytes: a canvas reads what the browser computes. */
const rgba = (css: string): Rgba => {
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  context.fillStyle = css;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!, a!];
};

const luminance = ([r, g, b]: Rgba) => {
  const linear = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

const contrast = (a: Rgba, b: Rgba) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
};

/** `top` laid over `under` at `alpha`, as the browser paints a translucent color or a dimmed box. */
const over = (top: Rgba, under: Rgba, alpha: number): Rgba => [
  top[0] * alpha + under[0] * (1 - alpha),
  top[1] * alpha + under[1] * (1 - alpha),
  top[2] * alpha + under[2] * (1 - alpha),
  255,
];

/** The card's own box: the first `div` of the `section`, after the halo layers. */
const surfaceOf = (card: HTMLElement) => card.querySelector<HTMLElement>(':scope > div')!;

const isDarkTheme = () => document.documentElement.matches('.dark, .deep-blue');

const effectiveOpacity = (element: Element) => {
  let opacity = 1;
  for (let node: Element | null = element; node; node = node.parentElement) {
    opacity *= parseFloat(getComputedStyle(node).opacity);
  }
  return opacity;
};

// The cards of each direction of a story that checks the mirror, each with its own names: two
// regions with one name fail `landmark-unique`.
const inEachDirection = (cards: (suffix: string) => ReactNode) =>
  (['ltr', 'rtl'] as const).map((dir) => (
    <div key={dir} dir={dir} data-direction={dir} className="mb-4">
      {cards(`, ${dir}`)}
    </div>
  ));

// ── Surface: intent and variant ─────────────────────────────────────────────

const SurfaceGrid = () => (
  <div className="grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {VARIANTS.flatMap((variant) =>
      INTENTS.map((intent) => (
        <SectionCard
          key={`${variant}-${intent}`}
          title={`${label(intent)}, ${variant}`}
          desc={`intent="${intent}" variant="${variant}"`}
          icon={Zap}
          intent={intent}
          variant={variant}
          size="md"
        >
          <Words solid={variant === 'solid'}>452 kW over the last hour.</Words>
        </SectionCard>
      ))
    )}
  </div>
);

/**
 * `variant` is the surface, `intent` its meaning. `outline` (default) is the plain card, with the
 * intent coloring its border; `tinted` takes a tint of it as its background; `solid` fills the card
 * with it and writes in white. A neutral solid card is dark in a light theme and light, with dark
 * ink, in a dark one. Solid is for simple content, a figure and a sentence.
 */
export const SurfaceByIntent: Story = { args: { title: '' }, render: () => <SurfaceGrid /> };

export const SurfaceChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <>
      <SurfaceGrid />
      <Card padding="lg" className="mt-4">
        Reference card
      </Card>
    </>
  ),
  play: async ({ canvas }) => {
    const reference = getComputedStyle(canvas.getByText('Reference card'));
    const surface = (variant: Variant, intent: Intent) =>
      surfaceOf(region(canvas, `${label(intent)}, ${variant}`));
    const neutral = getComputedStyle(surface('outline', 'neutral'));
    // The plain card is the surface of a `Card`.
    await expect(neutral.backgroundColor).toBe(reference.backgroundColor);
    await expect(neutral.borderTopColor).toBe(reference.borderTopColor);
    await expect(neutral.borderTopLeftRadius).toBe(reference.borderTopLeftRadius);
    await expect(neutral.overflow).toBe('hidden');

    const borders = new Set([neutral.borderTopColor]);
    for (const intent of INTENTS.filter((i) => i !== 'neutral')) {
      // Outline: the border takes the intent's color, the card keeps its own background.
      const outline = getComputedStyle(surface('outline', intent));
      await expect(outline.backgroundColor, `outline ${intent}`).toBe(neutral.backgroundColor);
      await expect(outline.borderTopColor, `outline ${intent}`).not.toBe(neutral.borderTopColor);
      borders.add(outline.borderTopColor);
      // Tinted: a tint of the intent, opaque, in the border of the intent.
      const tinted = getComputedStyle(surface('tinted', intent));
      await expect(tinted.backgroundColor, `tinted ${intent}`).not.toBe(neutral.backgroundColor);
      await expect(rgba(tinted.backgroundColor)[3]).toBe(255);
      await expect(tinted.borderTopColor, `tinted ${intent}`).toBe(outline.borderTopColor);
    }
    await expect(borders.size, 'one border color per intent').toBe(INTENTS.length);
    const tintedNeutral = getComputedStyle(surface('tinted', 'neutral'));
    await expect(tintedNeutral.backgroundColor).not.toBe(neutral.backgroundColor);
    await expect(tintedNeutral.borderTopColor).toBe(neutral.borderTopColor);
  },
};

export const SolidIsReadable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => <SurfaceGrid />,
  play: async ({ canvas }) => {
    let neutralFill: Rgba | undefined;
    for (const intent of INTENTS) {
      const card = region(canvas, `${label(intent)}, solid`);
      const fill = rgba(getComputedStyle(surfaceOf(card)).backgroundColor);
      await expect(fill[3]).toBe(255);
      if (intent === 'neutral') neutralFill = fill;
      const texts = [
        within(card).getByRole('heading'),
        within(card).getByText(`intent="${intent}" variant="solid"`),
        within(card).getByText('452 kW over the last hour.'),
      ];
      for (const text of texts) {
        await expect(
          contrast(rgba(getComputedStyle(text).color), fill),
          `${intent}: ${text.textContent}`
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    // Dark ink on a light theme's page, light on a dark one: the neutral card turns with the theme.
    await expect(luminance(neutralFill!) > 0.5).toBe(isDarkTheme());
  },
};

/** The footer, the stale label and the fold toggle write in the card's ink on a solid fill. */
export const SolidInkChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div className="grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {INTENTS.map((intent) => (
        <SectionCard
          key={intent}
          title={`${label(intent)} ink`}
          desc="Every part, in the card's ink"
          icon={Zap}
          intent={intent}
          variant="solid"
          size="md"
          stale
          staleLabel="Stale · 4 min ago"
          collapsible
          footer={
            <>
              <span>Updated 12 s ago</span>
              <span>Open the logs</span>
            </>
          }
        >
          <Words solid>452 kW over the last hour.</Words>
        </SectionCard>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const intent of INTENTS) {
      const card = region(canvas, `${label(intent)} ink`);
      const fill = rgba(getComputedStyle(surfaceOf(card)).backgroundColor);
      for (const text of ['Updated 12 s ago', 'Open the logs']) {
        await expect(
          contrast(rgba(getComputedStyle(within(card).getByText(text)).color), fill),
          `${intent}: ${text}`
        ).toBeGreaterThanOrEqual(4.5);
      }
      const stale = within(card).getByText('Stale · 4 min ago');
      const style = getComputedStyle(stale);
      const pill = over(rgba(style.backgroundColor), fill, rgba(style.backgroundColor)[3] / 255);
      await expect(
        contrast(rgba(style.color), pill),
        `${intent}: stale label`
      ).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/** The icon tile follows the intent; `iconTone` and the raw classes still win over it. */
export const IconTileFollowsTheIntent: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div>
      <SectionCard title="Neutral" icon={Server} />
      <SectionCard title="Danger" icon={Server} intent="danger" />
      <SectionCard title="Neutral, red tone" icon={Server} iconTone="red" />
      <SectionCard title="Danger, green tone" icon={Server} intent="danger" iconTone="green" />
      <SectionCard title="Neutral, green tone" icon={Server} iconTone="green" />
      <SectionCard
        title="Danger, raw classes"
        icon={Server}
        intent="danger"
        iconColor="text-pink-600"
        iconBg="bg-pink-500/10"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const tile = (name: string) => region(canvas, name).querySelector('svg')!.parentElement!;
    const tint = (name: string) => getComputedStyle(tile(name)).backgroundColor;
    const ink = (name: string) =>
      getComputedStyle(region(canvas, name).querySelector('svg')!).color;
    // No meaning, no change: the gray tile every card had.
    await expect(tint('Neutral')).not.toBe(tint('Danger'));
    // The intent colors the tile like the `red` tone does.
    await expect(tint('Danger')).toBe(tint('Neutral, red tone'));
    await expect(ink('Danger')).toBe(ink('Neutral, red tone'));
    // `iconTone` wins over the intent, and so do the raw classes.
    await expect(tint('Danger, green tone')).toBe(tint('Neutral, green tone'));
    await expect(ink('Danger, green tone')).toBe(ink('Neutral, green tone'));
    await expect(tint('Danger, raw classes')).not.toBe(tint('Danger'));
    await expect(ink('Danger, raw classes')).not.toBe(ink('Danger'));
  },
};

// ── Halo ────────────────────────────────────────────────────────────────────

const HALO_CARDS = (
  <div className="grid max-w-4xl gap-10 p-6 sm:grid-cols-2">
    <SectionCard
      title="Brand, outline"
      icon={Activity}
      intent="brand"
      halo
      desc="The card the page is about"
    >
      <Words>The brand to violet gradient.</Words>
    </SectionCard>
    <SectionCard title="Danger, outline" icon={Bell} intent="danger" halo desc="Danger to pink">
      <Words>4 critical alerts are firing.</Words>
    </SectionCard>
    <SectionCard
      title="Warning, tinted"
      icon={Thermometer}
      intent="warning"
      variant="tinted"
      halo
      desc="Warning to yellow"
    >
      <Words>Rack C01 is above 27 °C.</Words>
    </SectionCard>
    <SectionCard
      title="Success, solid"
      icon={ShieldCheck}
      intent="success"
      variant="solid"
      halo
      desc="Success to cyan"
    >
      <Words solid>All backups passed.</Words>
    </SectionCard>
  </div>
);

/**
 * `halo` draws the card's edge in a gradient of two hues of its `intent`, and a blurred copy of
 * the gradient behind it. It sits on any variant, does not move and takes no room. Leave space
 * around the card: an ancestor that clips cuts it.
 */
export const Halo: Story = { args: { title: '' }, render: () => HALO_CARDS };

const HALO_SIZES = ['sm', 'md', 'lg'] as const;

const HaloSizesDemo = () => (
  <div className="grid max-w-5xl gap-14 p-10 sm:grid-cols-2 lg:grid-cols-4">
    <SectionCard title="No halo" intent="brand" desc="The same card">
      <Words>For the box to compare.</Words>
    </SectionCard>
    {HALO_SIZES.map((haloSize) => (
      <SectionCard
        key={haloSize}
        title={`Halo ${haloSize}`}
        intent="brand"
        halo
        haloSize={haloSize}
        desc={`haloSize="${haloSize}"`}
      >
        <Words>For the box to compare.</Words>
      </SectionCard>
    ))}
  </div>
);

/** `haloSize` sets how far the glow reaches: `sm`, `md` (default) or `lg`, its spread and its blur. */
export const HaloSizes: Story = { args: { title: '' }, render: () => <HaloSizesDemo /> };

// The glow's box goes this far past the card, and its blur is this wide.
const HALO_SPREAD = { sm: 2, md: 4, lg: 8 } as const;
const HALO_BLUR = { sm: 8, md: 16, lg: 24 } as const;

export const HaloChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => HALO_CARDS,
  play: async ({ canvas }) => {
    const hues = new Set<string>();
    for (const name of ['Brand, outline', 'Danger, outline', 'Warning, tinted', 'Success, solid']) {
      const card = region(canvas, name);
      const surface = surfaceOf(card);
      const glow = card.querySelector<HTMLElement>('[data-halo="glow"]')!;
      const edge = card.querySelector<HTMLElement>('[data-halo="edge"]')!;
      // Two layers behind the card, in the section: the card's `overflow` does not clip them.
      await expect(surface.contains(glow) || surface.contains(edge)).toBe(false);
      await expect(getComputedStyle(card).isolation).toBe('isolate');
      await expect(getComputedStyle(card).overflow).toBe('visible');
      await expect(getComputedStyle(surface).overflow).toBe('hidden');
      // The edge is the card's box, the glow reaches past it on every side.
      const box = surface.getBoundingClientRect();
      const edgeBox = edge.getBoundingClientRect();
      for (const side of ['top', 'left', 'right', 'bottom'] as const) {
        await expect(edgeBox[side]).toBeCloseTo(box[side], 0);
      }
      const glowBox = glow.getBoundingClientRect();
      await expect(glowBox.top).toBeCloseTo(box.top - HALO_SPREAD.md, 0);
      await expect(glowBox.bottom).toBeCloseTo(box.bottom + HALO_SPREAD.md, 0);
      await expect(glowBox.left).toBeCloseTo(box.left - HALO_SPREAD.md, 0);
      await expect(glowBox.right).toBeCloseTo(box.right + HALO_SPREAD.md, 0);
      await expect(getComputedStyle(glow).filter).toBe(`blur(${HALO_BLUR.md}px)`);
      // The card's own border is clear: the gradient edge behind it is the border.
      const style = getComputedStyle(surface);
      await expect(style.borderTopWidth).toBe('1px');
      await expect(rgba(style.borderTopColor)[3]).toBe(0);
      await expect(style.backgroundClip).toBe('padding-box');
      await expect(getComputedStyle(edge).backgroundImage).toContain('linear-gradient');
      await expect(getComputedStyle(glow).backgroundImage).toContain('linear-gradient');
      // Static: nothing runs.
      for (const layer of [glow, edge]) {
        await expect(getComputedStyle(layer).animationName).toBe('none');
        await expect(layer).toHaveAttribute('aria-hidden', 'true');
      }
      // Two hues, the first of the intent.
      const from = getComputedStyle(card).getPropertyValue('--halo-from').trim();
      const to = getComputedStyle(card).getPropertyValue('--halo-to').trim();
      await expect(from).not.toBe('');
      await expect(to).not.toBe('');
      await expect(from).not.toBe(to);
      hues.add(`${from}>${to}`);
    }
    await expect(hues.size, 'one gradient per intent').toBe(4);
    const root = getComputedStyle(document.documentElement);
    const hue = (name: string) =>
      getComputedStyle(region(canvas, name)).getPropertyValue('--halo-from').trim();
    await expect(hue('Brand, outline')).toBe(root.getPropertyValue('--color-brand-500').trim());
    await expect(hue('Danger, outline')).toBe(root.getPropertyValue('--color-error-500').trim());
    await expect(hue('Warning, tinted')).toBe(root.getPropertyValue('--color-warning-500').trim());
    await expect(hue('Success, solid')).toBe(root.getPropertyValue('--color-success-500').trim());
  },
};

export const HaloSizeChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => <HaloSizesDemo />,
  play: async ({ canvas }) => {
    const plain = surfaceOf(region(canvas, 'No halo')).getBoundingClientRect();
    await expect(
      region(canvas, 'No halo').querySelector('[data-halo]'),
      'no halo, no layers'
    ).toBeNull();
    for (const haloSize of HALO_SIZES) {
      const card = region(canvas, `Halo ${haloSize}`);
      const surface = surfaceOf(card);
      const box = surface.getBoundingClientRect();
      // The halo takes no room: the card is the box it is without it.
      await expect(box.width).toBeCloseTo(plain.width, 0);
      await expect(box.height).toBeCloseTo(plain.height, 0);
      await expect(getComputedStyle(surface).paddingTop).toBe('24px');
      const glow = card.querySelector<HTMLElement>('[data-halo="glow"]')!;
      const glowBox = glow.getBoundingClientRect();
      await expect(glowBox.top, haloSize).toBeCloseTo(box.top - HALO_SPREAD[haloSize], 0);
      await expect(glowBox.right, haloSize).toBeCloseTo(box.right + HALO_SPREAD[haloSize], 0);
      await expect(getComputedStyle(glow).filter, haloSize).toBe(`blur(${HALO_BLUR[haloSize]}px)`);
      // The radius grows with the spread, so the glow stays concentric with the card.
      await expect(parseFloat(getComputedStyle(glow).borderTopLeftRadius)).toBeCloseTo(
        parseFloat(getComputedStyle(surface).borderTopLeftRadius) + HALO_SPREAD[haloSize],
        0
      );
    }
  },
};

// ── Accent band ─────────────────────────────────────────────────────────────

const ACCENT_SIDES = ['top', 'end', 'bottom', 'start'] as const;
const ACCENT_BODIES = {
  top: 'Memory 86 %.',
  end: 'Lustre /scratch 93 %.',
  bottom: 'CPU load 72 %.',
  start: 'Scheduler healthy.',
} as const;
const ACCENT_COLORS = { top: 'warning', end: 'danger', bottom: 'success', start: 'brand' } as const;

const AccentCards = ({ suffix = '' }: { suffix?: string }) => (
  <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
    {ACCENT_SIDES.map((side) => (
      <SectionCard
        key={side}
        title={`accentSide="${side}"${suffix}`}
        desc={`accent="${ACCENT_COLORS[side]}"`}
        icon={Database}
        accent={ACCENT_COLORS[side]}
        accentSide={side}
      >
        <Words>{ACCENT_BODIES[side]}</Words>
      </SectionCard>
    ))}
  </div>
);

/**
 * `accent` is a band of 4px on one side of the card, `accentSide` says which. The rest of the card
 * keeps its neutral colors, and `intent` is independent of it. `start` and `end` follow the
 * reading direction.
 */
export const AccentBand: Story = { args: { title: '' }, render: () => <AccentCards /> };

export const AccentBandChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <>
      {inEachDirection((suffix) => (
        <AccentCards suffix={suffix} />
      ))}
      <SectionCard title="Plain" icon={Database}>
        <Words>No band.</Words>
      </SectionCard>
    </>
  ),
  play: async ({ canvas }) => {
    const plain = getComputedStyle(surfaceOf(region(canvas, 'Plain')));
    for (const dir of ['ltr', 'rtl'] as const) {
      for (const side of ACCENT_SIDES) {
        const card = region(canvas, `accentSide="${side}", ${dir}`);
        const surface = surfaceOf(card);
        const band = card.querySelector<HTMLElement>('[data-accent-band]')!;
        const box = surface.getBoundingClientRect();
        const bandBox = band.getBoundingClientRect();
        const inner = { width: box.width - 2, height: box.height - 2 };
        // One band of 4px, against the border, along the whole side.
        if (side === 'top' || side === 'bottom') {
          await expect(bandBox.height).toBeCloseTo(4, 0);
          await expect(bandBox.width).toBeCloseTo(inner.width, 0);
          if (side === 'top') await expect(bandBox.top - box.top).toBeCloseTo(1, 0);
          else await expect(box.bottom - bandBox.bottom).toBeCloseTo(1, 0);
        } else {
          await expect(bandBox.width).toBeCloseTo(4, 0);
          await expect(bandBox.height).toBeCloseTo(inner.height, 0);
          // `start` is the edge the line starts at: the left one in ltr, the right one in rtl.
          if (side === 'start') await expect(startOffset(band, surface)).toBeCloseTo(1, 0);
          else await expect(endOffset(band, surface)).toBeCloseTo(1, 0);
        }
        // The rest of the card keeps its neutral colors.
        const style = getComputedStyle(surface);
        await expect(style.borderTopColor).toBe(plain.borderTopColor);
        await expect(style.backgroundColor).toBe(plain.backgroundColor);
        await expect(card.querySelectorAll('[data-accent-band]')).toHaveLength(1);
        await expect(getComputedStyle(band).backgroundColor).not.toBe(plain.borderTopColor);
      }
    }
    // The band is the accent's color, `danger` is red.
    const [r, g, b] = rgba(
      getComputedStyle(region(canvas, 'accentSide="end", ltr').querySelector('[data-accent-band]')!)
        .backgroundColor
    );
    await expect(r > g && r > b).toBe(true);
  },
};

/** The accent and the intent are two props: a neutral card can carry a band, a colored one none. */
export const AccentIsIndependentOfIntent: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div>
      <SectionCard title="Success card, danger band" intent="success" accent="danger" />
      <SectionCard title="Success card" intent="success" />
    </div>
  ),
  play: async ({ canvas }) => {
    const banded = surfaceOf(region(canvas, 'Success card, danger band'));
    const plain = surfaceOf(region(canvas, 'Success card'));
    await expect(getComputedStyle(banded).borderTopColor).toBe(
      getComputedStyle(plain).borderTopColor
    );
    const [r, g] = rgba(
      getComputedStyle(banded.querySelector('[data-accent-band]')!).backgroundColor
    );
    await expect(r).toBeGreaterThan(g);
  },
};

// ── Icon ────────────────────────────────────────────────────────────────────

const ICON_POSITIONS = ['start', 'end', 'top'] as const;
const ICON_SHAPES = ['square', 'round'] as const;

const IconCards = ({ suffix = '', action }: { suffix?: string; action?: ReactNode }) => (
  <div className="grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {ICON_SHAPES.flatMap((iconShape) =>
      ICON_POSITIONS.map((iconPosition) => (
        <SectionCard
          key={`${iconPosition}-${iconShape}`}
          title={`${iconPosition} · ${iconShape}${suffix}`}
          desc="Active fleet"
          icon={Server}
          iconPosition={iconPosition}
          iconShape={iconShape}
          action={action}
        >
          <Words>96 nodes in 8 racks.</Words>
        </SectionCard>
      ))
    )}
  </div>
);

/**
 * `iconPosition` puts the icon tile before the title (`start`, default), at the end of the title
 * block, before the `action` (`end`), or above it (`top`); `iconShape` makes it a rounded `square`
 * (default) or a `round`.
 */
export const IconPositionAndShape: Story = {
  args: { title: '' },
  globals: laptop,
  render: () => <IconCards />,
};

const tileOf = (card: HTMLElement) => card.querySelector('svg')!.parentElement!;

export const IconPositionChecks: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => <IconCards />,
  play: async ({ canvas }) => {
    for (const iconShape of ICON_SHAPES) {
      for (const iconPosition of ICON_POSITIONS) {
        const card = region(canvas, `${iconPosition} · ${iconShape}`);
        const surface = surfaceOf(card);
        const tile = tileOf(card);
        const heading = within(card).getByRole('heading').getBoundingClientRect();
        const box = tile.getBoundingClientRect();
        if (iconPosition === 'start') {
          await expect(endEdge(box, card)).toBeLessThanOrEqual(startEdge(heading, card));
          await expect(startOffset(tile, surface)).toBeCloseTo(25, 0);
        } else if (iconPosition === 'end') {
          await expect(startEdge(box, card)).toBeGreaterThanOrEqual(endEdge(heading, card));
          // Against the end padding, with the room an action would have left it.
          await expect(endOffset(tile, surface)).toBeCloseTo(25, 0);
        } else {
          // Above the title, on the start edge.
          await expect(box.bottom).toBeLessThanOrEqual(heading.top);
          await expect(startOffset(tile, surface)).toBeCloseTo(25, 0);
        }
        const radius = parseFloat(getComputedStyle(tile).borderTopLeftRadius);
        if (iconShape === 'round') await expect(radius).toBeGreaterThanOrEqual(box.width / 2);
        else await expect(radius).toBeLessThan(box.width / 2);
      }
    }
  },
};

/** At the end, the tile sits between the title and the action. */
export const IconEndSitsBeforeTheAction: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => (
    <SectionCard
      title="Icon at the end"
      desc="Active fleet"
      icon={Server}
      iconPosition="end"
      action={<RangeMenu />}
    >
      <Words>96 nodes in 8 racks.</Words>
    </SectionCard>
  ),
  play: async ({ canvas }) => {
    const card = region(canvas, 'Icon at the end');
    const heading = within(card).getByRole('heading').getBoundingClientRect();
    const tile = tileOf(card).getBoundingClientRect();
    const action = within(card)
      .getByRole('button', { name: 'Last 30 days' })
      .getBoundingClientRect();
    await expect(startEdge(tile, card)).toBeGreaterThanOrEqual(endEdge(heading, card));
    await expect(startEdge(action, card)).toBeGreaterThanOrEqual(endEdge(tile, card));
  },
};

export const IconFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => (
    <>
      {inEachDirection((suffix) => (
        <div className="grid gap-4 sm:grid-cols-3">
          {ICON_POSITIONS.map((iconPosition) => (
            <SectionCard
              key={iconPosition}
              title={`${iconPosition}${suffix}`}
              icon={Server}
              iconPosition={iconPosition}
            />
          ))}
        </div>
      ))}
    </>
  ),
  play: ({ canvasElement }) => {
    ICON_POSITIONS.forEach((_, index) => {
      expectMirrored(canvasElement, (box) => tileOf(box.querySelectorAll('section')[index]!));
    });
  },
};

// ── Header and footer: badge, footer, flush ─────────────────────────────────

const SERVICES = [
  { name: 'slurmctld', uptime: '99.99 %', response: '4 ms' },
  { name: 'Parallel filesystem', uptime: '99.41 %', response: '212 ms' },
  { name: 'Scheduler API', uptime: '99.97 %', response: '38 ms' },
  { name: 'Prometheus', uptime: '100 %', response: '12 ms' },
];

// The content a flush card is made for: a table, with its own head row and lines.
const ServicesTable = ({ rows = SERVICES }: { rows?: typeof SERVICES }) => (
  <Table aria-label="Service status">
    <TableHead>
      <TableRow>
        <TableHeaderCell>Service</TableHeaderCell>
        <TableHeaderCell numeric>Uptime</TableHeaderCell>
        <TableHeaderCell numeric>Response</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.name}>
          <TableCell>{row.name}</TableCell>
          <TableCell numeric>{row.uptime}</TableCell>
          <TableCell numeric>{row.response}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const ViewAll = () => (
  <Button variant="secondary" size="sm">
    View all
  </Button>
);

const BadgeCards = () => (
  <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
    <SectionCard title="CPU load" desc="96 nodes" icon={Cpu} badge={<StatusBadge status="OK" />}>
      <Words>A status badge next to the title.</Words>
    </SectionCard>
    <SectionCard
      title="Alerts"
      desc="Firing now"
      icon={Bell}
      badge={<StatusBadge status="INFO" label="15" />}
      action={<ViewAll />}
    >
      <Words>A count, and an action at the end.</Words>
    </SectionCard>
  </div>
);

/** `badge` stands next to the title: a `StatusBadge`, a count. `action` still ends the header. */
export const BadgeAndAction: Story = { args: { title: '' }, render: () => <BadgeCards /> };

export const BadgeChecks: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => <BadgeCards />,
  play: async ({ canvas }) => {
    const card = region(canvas, 'Alerts');
    const heading = within(card).getByRole('heading').getBoundingClientRect();
    const badge = within(card).getByText('15').getBoundingClientRect();
    const action = within(card).getByRole('button', { name: 'View all' }).getBoundingClientRect();
    // On the title's line, after it, and before the action.
    await expect(badge.top).toBeLessThan(heading.bottom);
    await expect(badge.bottom).toBeGreaterThan(heading.top);
    await expect(startEdge(badge, card)).toBeGreaterThanOrEqual(endEdge(heading, card));
    await expect(startEdge(action, card)).toBeGreaterThanOrEqual(endEdge(badge, card));
  },
};

const FlushServices = () => (
  <SectionCard title="Services" desc="3 of 4 healthy" icon={Activity} flush size="md">
    <ServicesTable />
  </SectionCard>
);

/**
 * `flush` runs the body edge to edge under the header, with a line above it and no padding, down to
 * the card's bottom edge (or its footer): for a `Table`, whose head row and lines run the whole
 * width. The table loses its own border and corners, the card draws them.
 */
export const FlushTable: Story = {
  args: { title: '' },
  render: () => (
    <div className="max-w-xl">
      <FlushServices />
    </div>
  ),
};

const tableBoxOf = (card: HTMLElement) => within(card).getByRole('table').parentElement!;

export const FlushChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div className="max-w-xl space-y-4">
      <FlushServices />
      <SectionCard
        title="Services with a footer"
        icon={Activity}
        flush
        size="md"
        footer={<span>Updated 12 s ago</span>}
      >
        <ServicesTable />
      </SectionCard>
      <SectionCard title="Services loading" icon={Activity} flush size="md" loading>
        <ServicesTable />
      </SectionCard>
      <SectionCard title="Services, large" icon={Activity} flush>
        <ServicesTable />
      </SectionCard>
      <SectionCard title="Services, small" icon={Activity} flush size="sm">
        <ServicesTable />
      </SectionCard>
    </div>
  ),
  play: async ({ canvas }) => {
    const card = region(canvas, 'Services');
    const surface = surfaceOf(card);
    const box = tableBoxOf(card);
    const body = box.parentElement!;
    const outer = surface.getBoundingClientRect();
    // Edge to edge: from the card's border to its border, a line above, no padding.
    await expect(startOffset(body, surface)).toBeCloseTo(1, 0);
    await expect(endOffset(body, surface)).toBeCloseTo(1, 0);
    await expect(getComputedStyle(body).borderTopWidth).toBe('1px');
    await expect(getComputedStyle(body).paddingLeft).toBe('0px');
    // The table gives up its own border and corners to the card's.
    const wrapper = getComputedStyle(box);
    await expect(wrapper.borderTopWidth).toBe('0px');
    await expect(wrapper.borderTopLeftRadius).toBe('0px');
    // Ends on the card's bottom edge: no padding under the last row.
    const rows = within(card).getAllByRole('row');
    await expect(rows[rows.length - 1]!.getBoundingClientRect().bottom).toBeCloseTo(
      outer.bottom - 1,
      0
    );
    // The first and last cells line up with the card's padding, as the title and the footer do:
    // the cell's edge on the card's border, its own padding the rest of the way.
    const textStart = (cell: HTMLElement, box: HTMLElement) =>
      startOffset(cell, box) + parseFloat(getComputedStyle(cell).paddingInlineStart);
    const textEnd = (cell: HTMLElement, box: HTMLElement) =>
      endOffset(cell, box) + parseFloat(getComputedStyle(cell).paddingInlineEnd);
    for (const [name, inset] of [
      ['Services', 21],
      ['Services, large', 25],
      ['Services, small', 17],
    ] as const) {
      const sized = region(canvas, name);
      const box = surfaceOf(sized);
      await expect(textStart(within(sized).getByText('slurmctld'), box), name).toBeCloseTo(
        inset,
        0
      );
      await expect(textStart(within(sized).getByText('Service'), box), name).toBeCloseTo(inset, 0);
      await expect(textEnd(within(sized).getAllByText('4 ms')[0]!, box), name).toBeCloseTo(
        inset,
        0
      );
      await expect(textEnd(within(sized).getByText('Response'), box), name).toBeCloseTo(inset, 0);
    }
    // And the head row sits right under the line.
    await expect(rows[0]!.getBoundingClientRect().top).toBeCloseTo(
      body.getBoundingClientRect().top + 1,
      0
    );
    await expect(getComputedStyle(surface).paddingBottom).toBe('0px');

    // With a footer, the table ends on the footer's line.
    const withFooter = region(canvas, 'Services with a footer');
    const footer = within(withFooter).getByText('Updated 12 s ago').parentElement!;
    await expect(footer.getBoundingClientRect().top).toBeCloseTo(
      tableBoxOf(withFooter).parentElement!.getBoundingClientRect().bottom,
      0
    );

    // A state is padded as any body is: `flush` is for the content it replaces.
    const loading = region(canvas, 'Services loading');
    await expect(
      startOffset(loading.querySelector('.animate-pulse')!, surfaceOf(loading))
    ).toBeCloseTo(21, 0);
    await expect(getComputedStyle(surfaceOf(loading)).paddingBottom).toBe('20px');
  },
};

type TableAlert = { id: string; severity: 'Critical' | 'Warning'; name: string; target: string };

const TABLE_ALERTS: TableAlert[] = [
  { id: 'a1', severity: 'Critical', name: 'LustreOSTOffline', target: 'oss-c01-03' },
  { id: 'a2', severity: 'Critical', name: 'NodeDown', target: 'cn-a03-12' },
  { id: 'a3', severity: 'Warning', name: 'ClusterMemoryHigh', target: 'atlas' },
  { id: 'a4', severity: 'Warning', name: 'MemoryECCErrors', target: 'cn-a03-05' },
  { id: 'a5', severity: 'Warning', name: 'InletTemperatureHigh', target: 'rack C01' },
];

const TABLE_ALERT_COLUMNS: ColumnDef<TableAlert>[] = [
  {
    key: 'severity',
    label: 'Severity',
    filterValue: (alert) => alert.severity,
    render: (alert) => alert.severity,
  },
  { key: 'name', label: 'Alert', render: (alert) => alert.name },
  { key: 'target', label: 'Target', render: (alert) => alert.target },
];

const AlertsCard = ({ size }: { size?: SectionCardProps['size'] }) => (
  <SectionCard
    as="h2"
    title={size ? `Alerts, ${size}` : 'Alerts'}
    desc="5 firing"
    icon={Bell}
    intent="danger"
    halo
    flush
    size={size ?? 'md'}
  >
    <DataTable
      rows={TABLE_ALERTS}
      columns={TABLE_ALERT_COLUMNS}
      rowKey={(alert) => alert.id}
      pageSize={3}
      aria-label={size ? `Alerts, ${size}` : 'Alerts'}
      filterTabs={{
        columnKey: 'severity',
        allCount: TABLE_ALERTS.length,
        options: [
          { value: 'Critical', label: 'Critical', count: 2 },
          { value: 'Warning', label: 'Warning', count: 3 },
        ],
      }}
    />
  </SectionCard>
);

/**
 * A `DataTable` with its tabs and its pager in a `flush` card: the tabs, the toolbar and the pager
 * take the card's padding too, so everything lines up with the title.
 */
export const FlushDataTable: Story = {
  args: { title: '' },
  render: () => (
    <div className="max-w-2xl p-4">
      <AlertsCard />
    </div>
  ),
};

export const FlushDataTableChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div className="max-w-2xl space-y-6 p-4">
      <AlertsCard />
      <AlertsCard size="lg" />
      <AlertsCard size="sm" />
    </div>
  ),
  play: async ({ canvas }) => {
    for (const [name, inset] of [
      ['Alerts', 21],
      ['Alerts, lg', 25],
      ['Alerts, sm', 17],
    ] as const) {
      const card = region(canvas, name);
      const box = surfaceOf(card);
      // The first tab, the first header cell and the pager start at the card's padding, as the
      // header's icon does.
      const textStart = (element: HTMLElement) =>
        startOffset(element, box) + parseFloat(getComputedStyle(element).paddingInlineStart);
      const tabs = within(card).getByRole('tablist');
      await expect(textStart(tabs), name).toBeCloseTo(inset, 0);
      await expect(
        textStart(within(card).getByRole('columnheader', { name: /Severity/ })),
        name
      ).toBeCloseTo(inset, 0);
      const pager = within(card).getByRole('navigation');
      await expect(
        startOffset(pager, box) + parseFloat(getComputedStyle(pager).paddingInlineStart),
        name
      ).toBeCloseTo(inset, 0);
    }
  },
};

/** Outside a card, a `DataTable` keeps its 16px. */
export const DataTableInsetDefaultsTo16px: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div className="max-w-2xl p-4">
      <DataTable
        rows={TABLE_ALERTS}
        columns={TABLE_ALERT_COLUMNS}
        rowKey={(alert) => alert.id}
        pageSize={3}
        aria-label="Alerts"
        filterTabs={{ columnKey: 'severity', allCount: TABLE_ALERTS.length, options: [] }}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByRole('tablist')).paddingInlineStart).toBe('16px');
    await expect(getComputedStyle(canvas.getByRole('navigation')).paddingInlineStart).toBe('16px');
  },
};

const FocusTheAlerts = () => {
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <div className="max-w-xl space-y-4">
      <Button onClick={() => heading.current?.focus()}>Show the alerts</Button>
      <SectionCard as="h2" title="Alerts" titleRef={heading}>
        <Words>4 critical alerts are firing.</Words>
      </SectionCard>
      <SectionCard as="h2" title="Services">
        <Words>3 of 4 healthy.</Words>
      </SectionCard>
    </div>
  );
};

/** `titleRef` reaches the heading, which can then take the focus, out of the tab order. */
export const TitleRefTakesTheFocus: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => <FocusTheAlerts />,
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { level: 2, name: 'Alerts' });
    await expect(heading).toHaveAttribute('tabindex', '-1');
    // Without the ref, a heading stays a heading only.
    await expect(canvas.getByRole('heading', { name: 'Services' })).not.toHaveAttribute('tabindex');
    await userEvent.click(canvas.getByRole('button', { name: 'Show the alerts' }));
    await expect(heading).toHaveFocus();
    // Tab leaves it for what follows, never back to it.
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole('button', { name: 'Show the alerts' })).toHaveFocus();
  },
};

const FooterCard = ({
  title = 'Scheduler',
  body,
  ...rest
}: { title?: string; body?: ReactNode } & Omit<SectionCardProps, 'title' | 'children'>) => (
  <SectionCard
    title={title}
    desc="slurmctld"
    icon={Activity}
    footer={
      <>
        <span>Updated 12 s ago</span>
        <Button variant="link" size="sm">
          Open the logs
        </Button>
      </>
    }
    {...rest}
  >
    {body ?? <Words>The 30-day uptime of the scheduler.</Words>}
  </SectionCard>
);

/**
 * `footer` sits under the body, full width and set off by a line. Its children share the row, one
 * at each end. In a grid it stays at the bottom of the card.
 */
export const WithFooter: Story = {
  args: { title: '' },
  render: () => (
    <div className="max-w-md">
      <FooterCard />
    </div>
  ),
};

export const FooterChecks: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => (
    <div className="grid max-w-3xl items-stretch gap-4 sm:grid-cols-2">
      <FooterCard title="Short" />
      <FooterCard title="Tall" body={<div className="h-48 text-sm">Tall content.</div>} />
      <FooterCard title="Failing" error errorMessage="Couldn't load the logs" />
    </div>
  ),
  play: async ({ canvas }) => {
    const card = region(canvas, 'Short');
    const surface = surfaceOf(card);
    const footer = within(card).getByText('Updated 12 s ago').parentElement!;
    // Full width, set off by a line, on the card's bottom edge.
    await expect(startOffset(footer, surface)).toBeCloseTo(1, 0);
    await expect(endOffset(footer, surface)).toBeCloseTo(1, 0);
    await expect(getComputedStyle(footer).borderTopWidth).toBe('1px');
    await expect(
      surface.getBoundingClientRect().bottom - footer.getBoundingClientRect().bottom
    ).toBeCloseTo(1, 0);
    // The two ends of the row.
    const text = within(card).getByText('Updated 12 s ago');
    const link = within(card).getByRole('button', { name: 'Open the logs' });
    await expect(startOffset(text, footer)).toBeCloseTo(24, 0);
    await expect(endOffset(link, footer)).toBeCloseTo(24, 0);
    // The card of the short body stretches to the tall one and its footer goes down with it.
    const tall = within(region(canvas, 'Tall')).getByText('Updated 12 s ago').parentElement!;
    await expect(footer.getBoundingClientRect().bottom).toBeCloseTo(
      tall.getBoundingClientRect().bottom,
      0
    );
    // The footer stays in every state, as the action does.
    const failing = region(canvas, 'Failing');
    await expect(within(failing).getByRole('alert')).toBeVisible();
    await expect(within(failing).getByText('Updated 12 s ago')).toBeVisible();
  },
};

// ── Size ────────────────────────────────────────────────────────────────────

const SIZES = [
  { size: 'sm', padding: 16, gap: 12, hint: 'For dense dashboards.' },
  { size: 'md', padding: 20, gap: 12, hint: 'The Monitoring panels.' },
  { size: 'lg', padding: 24, gap: 16, hint: 'The default.' },
] as const;

const SizeCards = () => (
  <div className="grid max-w-4xl gap-4 sm:grid-cols-3">
    {SIZES.map(({ size, padding, hint }) => (
      <SectionCard
        key={size}
        title={`size="${size}"`}
        desc={`${padding} px`}
        icon={Server}
        size={size}
      >
        <Words>{hint}</Words>
      </SectionCard>
    ))}
  </div>
);

/** `size` sets the padding of the card, `sm` 16px, `md` 20px, `lg` 24px (default), and the gap under the header with it. */
export const Sizes: Story = { args: { title: '' }, render: () => <SizeCards /> };

export const SizeChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => <SizeCards />,
  play: async ({ canvas }) => {
    for (const { size, padding, gap, hint } of SIZES) {
      const card = region(canvas, `size="${size}"`);
      const style = getComputedStyle(surfaceOf(card));
      await expect(style.paddingTop, size).toBe(`${padding}px`);
      await expect(style.paddingLeft, size).toBe(`${padding}px`);
      await expect(style.paddingBottom, size).toBe(`${padding}px`);
      const desc = within(card).getByText(`${padding} px`);
      const body = within(card).getByText(hint);
      await expect(
        body.getBoundingClientRect().top - desc.getBoundingClientRect().bottom,
        size
      ).toBeCloseTo(gap, 0);
    }
  },
};

// ── Collapsible ─────────────────────────────────────────────────────────────

const FoldCards = ({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) => (
  <div className="grid max-w-3xl items-start gap-4 sm:grid-cols-2">
    <SectionCard
      title="Inlet temperature"
      desc="Open"
      icon={Thermometer}
      collapsible
      onOpenChange={onOpenChange}
      action={<ViewAll />}
      badge={<StatusBadge status="WARN" />}
    >
      <Words>Rack C01 is at 29 °C, over the 27 °C warning.</Words>
      <Button size="sm" className="mt-3">
        Acknowledge
      </Button>
    </SectionCard>
    <SectionCard
      title="Fan speed"
      desc="Closed"
      icon={Activity}
      collapsible
      defaultOpen={false}
      onOpenChange={onOpenChange}
    >
      <Words>Rack C01 fans run at 62 %.</Words>
    </SectionCard>
    <SectionCard
      title="Scheduler"
      desc="Open, with a footer"
      icon={Activity}
      collapsible
      footer={<span>Updated 12 s ago</span>}
    >
      <Words>The 30-day uptime of the scheduler.</Words>
    </SectionCard>
  </div>
);

/**
 * `collapsible` adds a toggle at the end of the header that folds the body (and the footer) away;
 * the header, its `badge` and its `action` stay. `defaultOpen={false}` starts it folded; `open`
 * and `onOpenChange` hand the state to the host.
 */
export const Collapsible: Story = {
  args: { title: '' },
  globals: laptop,
  render: () => <FoldCards />,
};

export const CollapsibleChecks: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => <FoldCards onOpenChange={fn()} />,
  play: async ({ canvas }) => {
    const card = region(canvas, 'Inlet temperature');
    const toggle = within(card).getByRole('button', { name: 'Toggle Inlet temperature' });
    const acknowledge = within(card).getByRole('button', { name: 'Acknowledge' });
    const body = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    // Named by the title, controlling the folding box that holds the body.
    await expect(body).toContainElement(acknowledge);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(body.inert).toBe(false);
    const open = card.getBoundingClientRect().height;

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // Out of the tab order and the reader's: inert and hidden at once.
    await expect(body.inert).toBe(true);
    await expect(body).toHaveAttribute('aria-hidden', 'true');
    acknowledge.focus();
    await expect(acknowledge).not.toHaveFocus();
    await expect(within(card).queryByRole('button', { name: 'Acknowledge' })).toBeNull();
    // The toggle keeps the focus, and the header, with its badge and action, stays.
    await expect(toggle).toHaveFocus();
    await expect(within(card).getByRole('heading', { name: 'Inlet temperature' })).toBeVisible();
    await expect(within(card).getByRole('button', { name: 'View all' })).toBeVisible();
    await expect(within(card).getByText('WARN')).toBeVisible();
    await expect(card.getBoundingClientRect().height).toBeLessThan(open);

    await userEvent.keyboard('{Enter}');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(body.inert).toBe(false);
    await expect(card.getBoundingClientRect().height).toBeCloseTo(open, 0);
    await expect(within(card).getByRole('button', { name: 'Acknowledge' })).toBeVisible();
  },
};

export const CollapsibleStartsFolded: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => <FoldCards onOpenChange={fn()} />,
  play: async ({ canvas }) => {
    const card = region(canvas, 'Fan speed');
    const toggle = within(card).getByRole('button', { name: 'Toggle Fan speed' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const body = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    await expect(body.inert).toBe(true);
    await expect(within(card).getByText('Rack C01 fans run at 62 %.')).not.toBeVisible();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(within(card).getByText('Rack C01 fans run at 62 %.')).toBeVisible();
  },
};

/** The footer folds with the body, and the card's padding comes back under the header. */
export const CollapsibleFoldsTheFooter: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => <FoldCards />,
  play: async ({ canvas }) => {
    const card = region(canvas, 'Scheduler');
    const surface = surfaceOf(card);
    const toggle = within(card).getByRole('button', { name: 'Toggle Scheduler' });
    // Open, the footer ends on the card's edge; the body keeps the card's padding on its sides.
    await expect(getComputedStyle(surface).paddingBottom).toBe('0px');
    const footer = within(card).getByText('Updated 12 s ago').parentElement!;
    await expect(footer.getBoundingClientRect().bottom).toBeCloseTo(
      surface.getBoundingClientRect().bottom - 1,
      0
    );
    await expect(startOffset(footer, surface)).toBeCloseTo(1, 0);
    await expect(
      startOffset(within(card).getByText('The 30-day uptime of the scheduler.'), surface)
    ).toBeCloseTo(25, 0);

    await userEvent.click(toggle);
    await expect(footer).not.toBeVisible();
    await expect(getComputedStyle(surface).paddingBottom).toBe('24px');
    // The header alone: the padding above and below it is the card's.
    const heading = within(card).getByRole('heading').getBoundingClientRect();
    await expect(surface.getBoundingClientRect().bottom - heading.bottom).toBeGreaterThan(24);
    await expect(surface.getBoundingClientRect().height).toBeLessThan(120);
  },
};

const ControlledFold = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-md space-y-3">
      <SectionCard
        title="Host-owned"
        icon={Activity}
        collapsible
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          setOpen(next);
        }}
      >
        <Words>Opened by the host.</Words>
      </SectionCard>
      <SectionCard title="Stuck open" icon={Activity} collapsible open onOpenChange={onOpenChange}>
        <Words>The host never updates open.</Words>
      </SectionCard>
    </div>
  );
};

export const CollapsibleControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => <ControlledFold onOpenChange={fn()} />,
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: 'Toggle Host-owned' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // The callback gets the state to move to, and nothing else.
    const stuck = canvas.getByRole('button', { name: 'Toggle Stuck open' });
    await userEvent.click(stuck);
    // Controlled: the card shows what the host passes back, which has not changed.
    await expect(stuck).toHaveAttribute('aria-expanded', 'true');
  },
};

export const CollapsibleCallbackGetsTheNextState: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: 'Callback card', collapsible: true, onOpenChange: fn(), children: <p>Body</p> },
  play: async ({ args, canvas }) => {
    const toggle = canvas.getByRole('button', { name: 'Toggle Callback card' });
    await userEvent.click(toggle);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await userEvent.click(toggle);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
  },
};

/** Without `collapsible` the open props are not read and there is no toggle. */
export const OpenIsOnlyReadWithCollapsible: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: 'Not collapsible', open: false, children: <p>Still here</p> },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).toBeNull();
    await expect(canvas.getByText('Still here')).toBeVisible();
  },
};

// ── Narrow screens ──────────────────────────────────────────────────────────

const PhoneParts = () => (
  <SectionCard
    title="Inlet temperature in rack C01"
    desc="Collapsible, with a badge and an action"
    icon={Thermometer}
    badge={<StatusBadge status="WARN" />}
    action={<ViewAll />}
    collapsible
    footer={<span>Updated 12 s ago</span>}
  >
    <Words>Rack C01 is at 29 °C, over the 27 °C warning.</Words>
  </SectionCard>
);

/** At 375px the toggle stays on the title's row and the action wraps under it. */
const partsOnAPhone: Story = {
  globals: mobileViewport,
  args: { title: '' },
  render: () => <PhoneParts />,
};

export const PartsOnAPhoneChecks: Story = {
  ...partsOnAPhone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const card = region(canvas, 'Inlet temperature in rack C01');
    const toggle = within(card).getByRole('button', {
      name: 'Toggle Inlet temperature in rack C01',
    });
    const action = within(card).getByRole('button', { name: 'View all' });
    const description = within(card)
      .getByText('Collapsible, with a badge and an action')
      .getBoundingClientRect();
    // The toggle ends the title's row, above the description; the action wraps under the block.
    await expect(toggle.getBoundingClientRect().top).toBeLessThan(description.top);
    await expect(action.getBoundingClientRect().top).toBeGreaterThanOrEqual(description.bottom);
    await expect(startOffset(action, surfaceOf(card))).toBeCloseTo(25, 0);
  },
};

/** A badge that does not fit next to the title wraps under it. */
export const BadgeWrapsUnderTheTitle: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div className="w-60">
      <SectionCard
        title="Parallel filesystem health"
        icon={Database}
        badge={<StatusBadge status="CRIT" label="Critical" />}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const card = region(canvas, 'Parallel filesystem health');
    const badge = within(card).getByText('Critical').getBoundingClientRect();
    await expect(badge.top).toBeGreaterThanOrEqual(
      within(card).getByRole('heading').getBoundingClientRect().bottom - 1
    );
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The footer, the toggle, the badge and the band follow the reading direction. */
export const NewPartsFollowTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <>
      {inEachDirection((suffix) => (
        <SectionCard
          title={`Parts${suffix}`}
          icon={Server}
          badge={<StatusBadge status="OK" />}
          collapsible
          accent="brand"
          accentSide="start"
          footer={<span>Updated 12 s ago</span>}
        >
          <Words>Body</Words>
        </SectionCard>
      ))}
    </>
  ),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('button'));
    expectMirrored(canvasElement, (box) => box.querySelector('[data-accent-band]'));
    expectMirrored(canvasElement, (box) => box.querySelector('span.rounded-full'));
    expectMirrored(canvasElement, (box) => within(box).getByText('Updated 12 s ago'));
  },
};

// ── Stale ───────────────────────────────────────────────────────────────────

const StaleCards = () => (
  <div className="grid max-w-4xl items-start gap-4 sm:grid-cols-2">
    <SectionCard
      title="Services, stale"
      desc="Prometheus does not answer"
      icon={Activity}
      stale
      staleLabel="Stale · 4 min ago"
      flush
      size="md"
      action={
        <Button variant="secondary" size="sm" icon={RotateCw}>
          Retry
        </Button>
      }
    >
      <ServicesTable rows={SERVICES.slice(0, 3)} />
    </SectionCard>
    <SectionCard title="Temperature, stale" desc="Default label" icon={Thermometer} stale>
      <Words>Rack C01 was at 29 °C.</Words>
    </SectionCard>
    <SectionCard title="Temperature, fresh" desc="For comparison" icon={Thermometer}>
      <Words>Rack C01 is at 29 °C.</Words>
    </SectionCard>
  </div>
);

/**
 * `stale` dims the body and shows `staleLabel` by the title ("Stale" by default; say how old). It
 * only does that: the header, `action` included, stays as it is, and what to show of the last
 * data under a failure is the host's to put together: the cause in `desc`, a Retry in `action`.
 */
export const Stale: Story = { args: { title: '' }, globals: laptop, render: () => <StaleCards /> };

export const StaleChecks: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => <StaleCards />,
  play: async ({ canvas }) => {
    const card = region(canvas, 'Services, stale');
    const heading = within(card).getByRole('heading');
    const label = within(card).getByText('Stale · 4 min ago');
    // By the title, on its line.
    await expect(label.getBoundingClientRect().top).toBeLessThan(
      heading.getBoundingClientRect().bottom
    );
    await expect(startEdge(label.getBoundingClientRect(), card)).toBeGreaterThanOrEqual(
      endEdge(heading.getBoundingClientRect(), card)
    );
    // The body is dimmed, the header, its action and its label are not.
    await expect(effectiveOpacity(within(card).getByRole('table'))).toBeCloseTo(0.65, 2);
    await expect(effectiveOpacity(heading)).toBe(1);
    await expect(effectiveOpacity(label)).toBe(1);
    await expect(effectiveOpacity(within(card).getByRole('button', { name: 'Retry' }))).toBe(1);

    // The default label, and a fresh card with no label and no dimming.
    await expect(within(region(canvas, 'Temperature, stale')).getByText('Stale')).toBeVisible();
    const fresh = region(canvas, 'Temperature, fresh');
    await expect(within(fresh).queryByText('Stale')).toBeNull();
    await expect(effectiveOpacity(within(fresh).getByText('Rack C01 is at 29 °C.'))).toBe(1);
  },
};

/** Dimmed text keeps 4.5:1: the library's secondary and muted colors read as the primary one. */
export const StaleTextStaysReadable: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => <StaleCards />,
  play: async ({ canvas }) => {
    const card = region(canvas, 'Services, stale');
    const panel = rgba(getComputedStyle(surfaceOf(card)).backgroundColor);
    const alpha = effectiveOpacity(within(card).getByRole('table'));
    const readable = async (element: Element, name: string) => {
      const style = getComputedStyle(element);
      const own = rgba(style.backgroundColor);
      // The cell's own background, if it has one, over the card; the text and what is behind it
      // are dimmed together.
      const behind = own[3] === 0 ? panel : over(own, panel, own[3] / 255);
      await expect(
        contrast(over(rgba(style.color), panel, alpha), over(behind, panel, alpha)),
        name
      ).toBeGreaterThanOrEqual(4.5);
    };
    for (const header of within(card).getAllByRole('columnheader')) {
      await readable(header, `header ${header.textContent}`);
    }
    for (const cell of within(card).getAllByRole('cell')) {
      await readable(cell, `cell ${cell.textContent}`);
    }
    await readable(
      within(region(canvas, 'Temperature, stale')).getByText('Rack C01 was at 29 °C.'),
      'text'
    );
  },
};

/**
 * `stale` and `error` together: the error is a message and not data, so it is not dimmed; the
 * label by the title still says the data behind it is old, and "Try again" still works.
 */
export const StaleWithError: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    title: 'Services failing',
    icon: Activity,
    stale: true,
    staleLabel: 'Stale · 4 min ago',
    error: true,
    errorMessage: 'Prometheus does not answer',
    onRetry: fn(),
  },
  play: async ({ args, canvas }) => {
    const card = region(canvas, 'Services failing');
    const alert = within(card).getByRole('alert');
    await expect(alert).toHaveTextContent('Prometheus does not answer');
    await expect(effectiveOpacity(alert)).toBe(1);
    await expect(within(card).getByText('Stale · 4 min ago')).toBeVisible();
    await userEvent.click(within(card).getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledWith();
  },
};

// ── Defaults ────────────────────────────────────────────────────────────────

// A card with none of the new props is the card it was: the same markup and the same surface as an
// explicit spelling of every default, and as a `Card` of 24px padding.
const sameMarkup = (element: Element) =>
  element.outerHTML
    .replace(/ id="[^"]*"/g, '')
    .replace(/ aria-labelledby="[^"]*"/g, '')
    .replaceAll('Explicit', 'Bare');

export const DefaultsAreUnchanged: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: '' },
  render: () => (
    <div className="space-y-4">
      <SectionCard
        title="Bare"
        desc="Active fleet"
        icon={Server}
        iconTone="blue"
        action={<ViewAll />}
      >
        <Words>Body</Words>
      </SectionCard>
      <SectionCard
        title="Explicit"
        desc="Active fleet"
        icon={Server}
        iconTone="blue"
        action={<ViewAll />}
        intent="neutral"
        variant="outline"
        halo={false}
        haloSize="md"
        accentSide="top"
        iconPosition="start"
        iconShape="square"
        size="lg"
        flush={false}
        collapsible={false}
        stale={false}
        staleLabel="Stale"
        defaultOpen
      >
        <Words>Body</Words>
      </SectionCard>
      <Card padding="lg">Reference card</Card>
    </div>
  ),
  play: async ({ canvas }) => {
    const bare = region(canvas, 'Bare');
    const explicit = region(canvas, 'Explicit');
    await expect(sameMarkup(explicit)).toBe(sameMarkup(bare));
    // Nothing of the new features is drawn.
    for (const card of [bare, explicit]) {
      await expect(card.querySelector('[data-halo], [data-accent-band]')).toBeNull();
      await expect(card.querySelector('[aria-expanded]')).toBeNull();
      await expect(card.querySelector('[inert]')).toBeNull();
      await expect(getComputedStyle(card).isolation).toBe('auto');
    }
    // The surface is a Card's, down to the padding.
    const surface = getComputedStyle(surfaceOf(bare));
    const reference = getComputedStyle(canvas.getByText('Reference card'));
    for (const property of [
      'backgroundColor',
      'borderTopColor',
      'borderTopWidth',
      'borderTopLeftRadius',
      'paddingTop',
      'paddingLeft',
      'paddingBottom',
      'overflow',
    ] as const) {
      await expect(surface[property], property).toBe(reference[property]);
    }
  },
};

// ── Monitoring ──────────────────────────────────────────────────────────────

const ALERTS = [
  { name: 'LustreOSTOffline', target: 'oss-c01-03', since: '4 h 51 min' },
  { name: 'LustreSpaceCritical', target: '/scratch', since: '3 h 27 min' },
  { name: 'NodeDown', target: 'cn-a03-12', since: '1 h 14 min' },
  { name: 'GPUXidError', target: 'gpu-b01-04', since: '27 min' },
];

const GAUGES = [
  { title: 'CPU load', desc: '96 nodes', icon: Cpu, value: 72, status: 'OK', intent: 'success' },
  {
    title: 'Memory',
    desc: '33.0 of 38.4 TB',
    icon: Database,
    value: 86,
    status: 'WARN',
    intent: 'warning',
  },
  {
    title: 'Lustre /scratch',
    desc: '1.86 of 2.0 PB',
    icon: Database,
    value: 93,
    status: 'CRIT',
    intent: 'danger',
  },
] as const;

const STATUS_NAME = { OK: 'OK', WARN: 'Warning', CRIT: 'Critical' } as const;

const MonitoringCards = () => (
  <div className="grid max-w-6xl items-start gap-6 p-2 sm:grid-cols-2 lg:grid-cols-3">
    {GAUGES.map(({ title, desc, icon, value, status, intent }) => (
      <SectionCard
        key={title}
        title={title}
        desc={desc}
        icon={icon}
        intent={intent}
        size="md"
        badge={<StatusBadge status={status} label={STATUS_NAME[status]} />}
      >
        <div className="flex justify-center">
          <ProgressRing
            value={value}
            size="lg"
            intent={intent}
            aria-label={`${title}, ${value} %, ${STATUS_NAME[status]}`}
          >
            {`${value} %`}
          </ProgressRing>
        </div>
      </SectionCard>
    ))}
    <SectionCard
      title="Critical alerts"
      desc="+1 in the last hour"
      icon={Bell}
      intent="danger"
      halo
      size="md"
      flush
      badge={<StatusBadge status="CRIT" label="4" />}
      footer={
        <>
          <span>4 critical, 6 warning</span>
          <Button variant="link" size="sm">
            Show all 15 alerts
          </Button>
        </>
      }
      className="lg:col-span-2"
    >
      <Table aria-label="Critical alerts firing now">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Alert</TableHeaderCell>
            <TableHeaderCell>Target</TableHeaderCell>
            <TableHeaderCell numeric>For</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ALERTS.map((alert) => (
            <TableRow key={alert.name}>
              <TableCell>{alert.name}</TableCell>
              <TableCell>{alert.target}</TableCell>
              <TableCell numeric>{alert.since}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
    <SectionCard
      title="Services"
      desc="Prometheus does not answer"
      icon={Activity}
      size="md"
      flush
      stale
      staleLabel="Stale · 4 min ago"
      action={
        <Button variant="secondary" size="sm" icon={RotateCw}>
          Retry
        </Button>
      }
    >
      <ServicesTable rows={SERVICES.slice(0, 2)} />
    </SectionCard>
  </div>
);

/**
 * The cards of a monitoring page. The gauges take the color of their status on the border, with
 * its badge; the critical alerts are `danger` with a `halo`, a flush table and a footer; the
 * services are `stale`, with a Retry in the `action`.
 */
export const Monitoring: Story = {
  args: { title: '' },
  globals: laptop,
  render: () => <MonitoringCards />,
};

export const MonitoringChecks: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { title: '' },
  render: () => <MonitoringCards />,
  play: async ({ canvas }) => {
    // The gauges: the status colors the border, and a badge says it in words.
    const borders = new Set<string>();
    for (const { title, status } of GAUGES) {
      const card = region(canvas, title);
      borders.add(getComputedStyle(surfaceOf(card)).borderTopColor);
      await expect(within(card).getByText(STATUS_NAME[status])).toBeVisible();
      await expect(within(card).getByRole('progressbar')).toBeVisible();
    }
    await expect(borders.size).toBe(GAUGES.length);
    // The critical alerts: a halo, a table edge to edge, and a footer.
    const alerts = region(canvas, 'Critical alerts');
    await expect(alerts.querySelector('[data-halo="glow"]')).not.toBeNull();
    await expect(within(alerts).getAllByRole('row')).toHaveLength(ALERTS.length + 1);
    await expect(within(alerts).getByText('4 critical, 6 warning')).toBeVisible();
    // The services: dimmed, labelled, with its Retry.
    const services = region(canvas, 'Services');
    await expect(within(services).getByText('Stale · 4 min ago')).toBeVisible();
    await expect(effectiveOpacity(within(services).getByRole('table'))).toBeCloseTo(0.65, 2);
    await expect(within(services).getByRole('button', { name: 'Retry' })).toBeVisible();
  },
};
