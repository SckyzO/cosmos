import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { ActionPanel } from './ActionPanel';
import { Button } from '../ui/Button';
import { Toggle } from './Toggle';

const meta = {
  title: 'Forms/Action Panel',
  component: ActionPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Manage subscription' },
} satisfies Meta<typeof ActionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const COPY =
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Recusandae voluptatibus corrupti atque repudiandae nam.';

// TUI Plus pattern "Simple" — title + description + action button below.
export const Simple: Story = {
  render: () => (
    <div className="bg-gray-100 p-8 dark:bg-gray-950">
      <ActionPanel
        title="Manage subscription"
        description={COPY}
        action={<Button>Change plan</Button>}
      />
    </div>
  ),
};

// TUI Plus pattern "With link" — action is a text link instead of a button.
export const WithLink: Story = {
  render: () => (
    <div className="bg-gray-100 p-8 dark:bg-gray-950">
      <ActionPanel
        title="Plan"
        description="You are currently on the Free plan."
        action={
          <a
            href="#"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Change plan <span aria-hidden>→</span>
          </a>
        }
      />
    </div>
  ),
};

// TUI Plus pattern "With button at top right" — `layout='inline'`.
export const WithButtonAtTopRight: Story = {
  render: () => (
    <div className="bg-gray-100 p-8 dark:bg-gray-950">
      <ActionPanel
        title="Manage subscription"
        description={COPY}
        layout="inline"
        action={<Button>Change plan</Button>}
      />
    </div>
  ),
};

// TUI Plus pattern "With toggle" — action slot hosts a `<Toggle>`.
export const WithToggle: Story = {
  render: () => {
    const [on, setOn] = useState(true);
    return (
      <div className="bg-gray-100 p-8 dark:bg-gray-950">
        <ActionPanel
          title="Email notifications"
          description="Receive a summary every weekday morning."
          layout="inline"
          action={<Toggle checked={on} onChange={setOn} />}
        />
      </div>
    );
  },
};

// TUI Plus pattern "Simple well" — tinted gray surface instead of white card.
export const SimpleWell: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <ActionPanel
        well
        title="Backup status"
        description="Last backup completed 4 hours ago."
        action={<Button variant="secondary">Run backup now</Button>}
      />
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootRendersTitleAsH3: Story = {
  render: () => <ActionPanel title="X" description="y" data-testid="ap" />,
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('[data-testid="ap"]');
    await expect(panel?.querySelector('h3')?.textContent).toBe('X');
  },
};

export const InlineLayoutAddsFlexBetween: Story = {
  render: () => (
    <ActionPanel
      title="X"
      layout="inline"
      action={<button type="button">go</button>}
      data-testid="ap"
    />
  ),
  play: async ({ canvasElement }) => {
    const inner = canvasElement.querySelector('[data-testid="ap"] > div');
    await expect(inner?.className ?? '').toMatch(/sm:justify-between/);
  },
};

export const WellSwitchesSurfaceToGray: Story = {
  render: () => <ActionPanel well title="X" data-testid="ap" />,
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('[data-testid="ap"]');
    await expect(panel?.className ?? '').toMatch(/bg-gray-50/);
  },
};
