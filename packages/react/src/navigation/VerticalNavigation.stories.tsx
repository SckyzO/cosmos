import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type MouseEvent } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Calendar, FileText, Folder, Home, MessageSquare, Users } from 'lucide-react';
import { VerticalNavigation } from './VerticalNavigation';
import { bothDirections, directionBox, expectMirrored } from '../storybook-helpers';
import { indicatorGap, indicatorOf, isSliding, tokenMs, transitionMs } from '../storybook-motion';

const meta = {
  title: 'Navigation/Vertical Navigation',
  component: VerticalNavigation,
  subcomponents: {
    'VerticalNavigation.Item': VerticalNavigation.Item,
    'VerticalNavigation.Section': VerticalNavigation.Section,
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof VerticalNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

// TUI Plus pattern "Simple" — vertical list of links, current item highlighted
// via `bg-gray-50` + `text-indigo-600`.
export const Simple: Story = {
  render: () => (
    <div className="max-w-xs bg-white p-4 dark:bg-gray-900">
      <VerticalNavigation>
        <VerticalNavigation.Item active href="#">
          Dashboard
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#">Team</VerticalNavigation.Item>
        <VerticalNavigation.Item href="#">Projects</VerticalNavigation.Item>
        <VerticalNavigation.Item href="#">Calendar</VerticalNavigation.Item>
        <VerticalNavigation.Item href="#">Documents</VerticalNavigation.Item>
        <VerticalNavigation.Item href="#">Reports</VerticalNavigation.Item>
      </VerticalNavigation>
    </div>
  ),
};

// TUI Plus pattern "With badges" — trailing pill counters.
export const WithBadges: Story = {
  render: () => (
    <div className="max-w-xs bg-white p-4 dark:bg-gray-900">
      <VerticalNavigation>
        <VerticalNavigation.Item active href="#" badge={5}>
          Dashboard
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#" badge={12}>
          Team
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#">Projects</VerticalNavigation.Item>
        <VerticalNavigation.Item href="#" badge="New">
          Calendar
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#">Documents</VerticalNavigation.Item>
      </VerticalNavigation>
    </div>
  ),
};

// TUI Plus pattern "With icons" — leading icons that recolor on hover/active.
export const WithIcons: Story = {
  render: () => (
    <div className="max-w-xs bg-white p-4 dark:bg-gray-900">
      <VerticalNavigation>
        <VerticalNavigation.Item active href="#" icon={Home}>
          Dashboard
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#" icon={Users}>
          Team
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#" icon={Folder}>
          Projects
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#" icon={Calendar}>
          Calendar
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#" icon={FileText}>
          Documents
        </VerticalNavigation.Item>
      </VerticalNavigation>
    </div>
  ),
};

// TUI Plus pattern "With icons and badges" combined.
export const WithIconsAndBadges: Story = {
  render: () => (
    <div className="max-w-xs bg-white p-4 dark:bg-gray-900">
      <VerticalNavigation>
        <VerticalNavigation.Item active href="#" icon={Home} badge={3}>
          Dashboard
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#" icon={MessageSquare} badge={42}>
          Inbox
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#" icon={Users}>
          Team
        </VerticalNavigation.Item>
      </VerticalNavigation>
    </div>
  ),
};

// TUI Plus pattern "On gray" — same nav inside a tinted card surface.
export const OnGray: Story = {
  render: () => (
    <div className="bg-gray-100 p-8 dark:bg-gray-950">
      <div className="max-w-xs">
        <VerticalNavigation variant="on-gray">
          <VerticalNavigation.Item active href="#" icon={Home}>
            Dashboard
          </VerticalNavigation.Item>
          <VerticalNavigation.Item href="#" icon={Users}>
            Team
          </VerticalNavigation.Item>
          <VerticalNavigation.Item href="#" icon={Folder}>
            Projects
          </VerticalNavigation.Item>
        </VerticalNavigation>
      </div>
    </div>
  ),
};

// TUI Plus pattern "With secondary navigation" — section labels between groups.
export const WithSecondarySection: Story = {
  render: () => (
    <div className="max-w-xs bg-white p-4 dark:bg-gray-900">
      <VerticalNavigation>
        <VerticalNavigation.Item active href="#" icon={Home}>
          Dashboard
        </VerticalNavigation.Item>
        <VerticalNavigation.Item href="#" icon={Users}>
          Team
        </VerticalNavigation.Item>
        <VerticalNavigation.Section label="Your teams">
          <VerticalNavigation.Item href="#">Heroicons</VerticalNavigation.Item>
          <VerticalNavigation.Item href="#">Tailwind Labs</VerticalNavigation.Item>
          <VerticalNavigation.Item href="#">Workcation</VerticalNavigation.Item>
        </VerticalNavigation.Section>
      </VerticalNavigation>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsNavWithAriaLabel: Story = {
  tags: ['!dev'],
  render: () => (
    <VerticalNavigation data-testid="vn">
      <VerticalNavigation.Item href="#">A</VerticalNavigation.Item>
    </VerticalNavigation>
  ),
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('nav[data-testid="vn"]');
    await expect(nav).not.toBeNull();
    await expect(nav).toHaveAttribute('aria-label', 'Sidebar');
  },
};

export const ActiveItemSetsAriaCurrent: Story = {
  tags: ['!dev'],
  render: () => (
    <VerticalNavigation>
      <VerticalNavigation.Item active href="#" data-testid="active">
        Active
      </VerticalNavigation.Item>
      <VerticalNavigation.Item href="#" data-testid="other">
        Other
      </VerticalNavigation.Item>
    </VerticalNavigation>
  ),
  play: async ({ canvasElement }) => {
    const a = canvasElement.querySelector('[data-testid="active"]');
    const b = canvasElement.querySelector('[data-testid="other"]');
    await expect(a).toHaveAttribute('aria-current', 'page');
    await expect(b).not.toHaveAttribute('aria-current');
  },
};

export const BadgeRendersWhenProvided: Story = {
  tags: ['!dev'],
  render: () => (
    <VerticalNavigation>
      <VerticalNavigation.Item href="#" badge={7} data-testid="i">
        With badge
      </VerticalNavigation.Item>
    </VerticalNavigation>
  ),
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector('[data-testid="i"]');
    await expect(link?.textContent).toMatch(/7/);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The badge sits at the end of the row, and an item's label is an island. */
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    // Both copies are on the page: each landmark needs a name of its own.
    let count = 0;
    return bothDirections(() => (
      <div className="max-w-xs">
        <VerticalNavigation aria-label={`Sidebar ${++count}`}>
          <VerticalNavigation.Item active href="#" icon={Home} badge={5}>
            Dashboard
          </VerticalNavigation.Item>
          <VerticalNavigation.Item href="#" icon={Users}>
            Team
          </VerticalNavigation.Item>
        </VerticalNavigation>
      </div>
    ));
  },
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('a svg'));
    expectMirrored(canvasElement, (box) => within(box).getByText('5'));
    // The label and the badge are islands: their own direction, whatever the row's.
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = canvasElement.querySelector<HTMLElement>(`[data-direction="${dir}"]`)!;
      for (const text of ['Dashboard', '5']) {
        const island = within(box).getByText(text);
        expect(island.tagName, `${dir}: ${text}`).toBe('BDI');
        expect(getComputedStyle(island).unicodeBidi, `${dir}: ${text}`).toBe('isolate');
      }
    }
  },
};

// ── Motion ───────────────────────────────────────────────────────────────────

// A navigation that follows its clicks, the way an app's router does: the item picked is the
// active one. Its `aria-label` is a prop, since two copies share a page in the direction story.
const PAGES = ['Dashboard', 'Team', 'Projects', 'Heroicons', 'Workcation'] as const;

const FollowedNavigation = ({ label = 'Sidebar' }: { label?: string }) => {
  const [active, setActive] = useState<string>('Dashboard');
  const item = (name: string, props: { icon?: typeof Home; badge?: number } = {}) => (
    <VerticalNavigation.Item
      key={name}
      href="#"
      active={active === name}
      onClick={(event: MouseEvent) => {
        event.preventDefault();
        setActive(name);
      }}
      {...props}
    >
      {name}
    </VerticalNavigation.Item>
  );
  return (
    <div className="max-w-xs bg-white p-4 dark:bg-gray-900">
      <VerticalNavigation aria-label={label}>
        {item('Dashboard', { icon: Home })}
        {item('Team', { icon: Users, badge: 12 })}
        {item('Projects', { icon: Folder })}
        <VerticalNavigation.Section label="Your teams">
          {item('Heroicons')}
          {item('Workcation')}
        </VerticalNavigation.Section>
      </VerticalNavigation>
    </div>
  );
};

/**
 * The background of the active item is one marker that slides to the item picked, in 200 ms
 * easing in and out; with the reduced setting it moves at once. Click an item, in the section
 * too.
 */
export const MarkerSlidesToThePickedItem: Story = {
  parameters: { settleMotion: false },
  render: () => <FollowedNavigation />,
};

// An item by its name, which a badge adds to ("Team 12").
const linkIn = (nav: HTMLElement) => (name: string) =>
  within(nav).getByRole('link', { name: new RegExp(`^${name}\\b`) });

// Whether the marker sits on the item, along the line and across it.
const sitsOn = (marker: HTMLElement, item: HTMLElement) => {
  const gap = indicatorGap(marker, item);
  expect(gap.start, 'start along the line').toBeLessThan(0.6);
  expect(gap.inline, 'size along the line').toBeLessThan(0.6);
  expect(gap.blockStart, 'start across the line').toBeLessThan(0.6);
  expect(gap.block, 'size across the line').toBeLessThan(0.6);
};

/**
 * At rest the marker has the box of the active item, whichever way the pick goes, on the
 * navigation's own level and in its section. The item leaves its background to the marker.
 */
export const MarkerSitsOnTheActiveItem: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <FollowedNavigation />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation');
    const link = linkIn(nav);
    const marker = indicatorOf(nav);
    await waitFor(() => sitsOn(marker, link('Dashboard')));
    // The fill is the marker's: the item has none of its own, and the marker has one.
    await expect(getComputedStyle(link('Dashboard')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await expect(getComputedStyle(marker).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    // Down the list, into the section, then back up: both ways.
    for (const name of ['Projects', 'Workcation', 'Team', 'Heroicons', 'Dashboard']) {
      await userEvent.click(link(name));
      await waitFor(() => sitsOn(marker, link(name)));
      await expect(link(name)).toHaveAttribute('aria-current', 'page');
      await expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    }
  },
};

/**
 * No transition on the first paint: the marker is where the active item is when the navigation
 * appears. A pick then starts the slide, over the base duration of the theme, and it ends on
 * the item.
 */
export const MarkerDoesNotSlideInOnFirstPaint: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <FollowedNavigation />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation');
    const marker = indicatorOf(nav);
    const link = linkIn(nav);
    await expect(isSliding(nav)).toBe(false);
    sitsOn(marker, link('Dashboard'));
    await expect(transitionMs(marker)).toBe(0);

    await userEvent.click(link('Workcation'));
    await expect(isSliding(nav)).toBe(true);
    await expect(transitionMs(marker)).toBe(tokenMs('--cosmos-motion-base'));
    await waitFor(() => expect(isSliding(nav)).toBe(false), { timeout: 2000 });
    sitsOn(marker, link('Workcation'));
  },
};

/** A narrower column makes every item narrower: the marker keeps the active one, with no slide. */
export const MarkerFollowsAResize: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <FollowedNavigation />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation');
    const link = linkIn(nav);
    await userEvent.click(link('Projects'));
    await waitFor(() => expect(isSliding(nav)).toBe(false), { timeout: 2000 });
    const marker = indicatorOf(nav);
    const before = marker.getBoundingClientRect().width;
    // The column the story puts the navigation in.
    nav.parentElement!.style.maxWidth = '200px';
    await waitFor(() => expect(marker.getBoundingClientRect().width).toBeLessThan(before));
    await waitFor(() => sitsOn(marker, link('Projects')));
    // A re-measure is not a slide: nothing moves over 200 ms.
    await expect(isSliding(nav)).toBe(false);
  },
};

/** With the reduced setting the marker jumps: no transition runs, and it is already there. */
export const MarkerJumpsUnderReducedMotion: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { motion: 'reduced' },
  parameters: { settleMotion: false },
  render: () => <FollowedNavigation />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation');
    const marker = indicatorOf(nav);
    await userEvent.click(linkIn(nav)('Heroicons'));
    await expect(isSliding(nav)).toBe(false);
    await expect(transitionMs(marker)).toBe(0);
    sitsOn(marker, linkIn(nav)('Heroicons'));
  },
};

/** The marker is measured from the start of the line: in right to left it sits on the right. */
export const MarkerFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    let count = 0;
    return bothDirections(() => <FollowedNavigation label={`Sidebar ${++count}`} />);
  },
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const nav = within(directionBox(canvasElement, dir)).getByRole('navigation');
      const marker = indicatorOf(nav);
      for (const name of ['Team', 'Workcation', 'Dashboard']) {
        await userEvent.click(linkIn(nav)(name));
        await waitFor(() => sitsOn(marker, linkIn(nav)(name)));
      }
    }
  },
};

/** The marker is decoration: assistive technology reads the links as before, and it takes no clicks. */
export const MarkerIsDecoration: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <FollowedNavigation />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation');
    const marker = indicatorOf(nav);
    await expect(marker).toHaveAttribute('aria-hidden', 'true');
    await expect(getComputedStyle(marker).pointerEvents).toBe('none');
    await expect(within(nav).getAllByRole('link')).toHaveLength(PAGES.length);
    // The list holds its items only: a marker among them would break the list for a screen reader.
    await expect(nav.querySelector('ul > [data-slot="indicator"]')).toBeNull();
  },
};
