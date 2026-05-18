import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Calendar, FileText, Folder, Home, MessageSquare, Users } from 'lucide-react';
import { VerticalNavigation } from './VerticalNavigation';

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
