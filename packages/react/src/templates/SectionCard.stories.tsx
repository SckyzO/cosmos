import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ChevronDown, KeyRound, Lock, Server, Trash2, User, Users, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { SectionCard, type SectionCardIconTone } from './SectionCard';
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
export const Phone: Story = {
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
  ...Phone,
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
