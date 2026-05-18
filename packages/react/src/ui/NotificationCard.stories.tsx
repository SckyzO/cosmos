import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { NotificationCard } from './NotificationCard';

const meta = {
  title: 'Feedback/Notification Card',
  component: NotificationCard,
  subcomponents: {
    'NotificationCard.Simple': NotificationCard.Simple,
    'NotificationCard.Condensed': NotificationCard.Condensed,
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Notification' },
} satisfies Meta<typeof NotificationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// TUI Plus pattern "Simple" — white card with leading icon, title, description,
// and trailing close button. Positioned top-right via a fixed parent in real use.
export const Simple: Story = {
  render: () => (
    <div className="flex justify-end p-6">
      <NotificationCard.Simple
        title="Successfully saved!"
        description="Anyone with a link can now view this file."
        onDismiss={() => {}}
      />
    </div>
  ),
};

export const SimpleNoDescription: Story = {
  render: () => (
    <div className="flex justify-end p-6">
      <NotificationCard.Simple
        intent="info"
        title="Configuration applied"
        onDismiss={() => {}}
      />
    </div>
  ),
};

export const SimpleErrorIntent: Story = {
  render: () => (
    <div className="flex justify-end p-6">
      <NotificationCard.Simple
        intent="error"
        title="Failed to save"
        description="The remote endpoint returned a 503. We will retry in 30 seconds."
        onDismiss={() => {}}
      />
    </div>
  ),
};

// TUI Plus pattern "Condensed" — single-line dark card with action link and X.
export const Condensed: Story = {
  render: () => (
    <div className="flex justify-end bg-gray-100 p-6 dark:bg-gray-950">
      <NotificationCard.Condensed
        title="Discussion archived"
        actionLabel="Undo"
        onAction={() => {}}
        onDismiss={() => {}}
      />
    </div>
  ),
};

export const CondensedWithoutAction: Story = {
  render: () => (
    <div className="flex justify-end bg-gray-100 p-6 dark:bg-gray-950">
      <NotificationCard.Condensed title="Saved" onDismiss={() => {}} />
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const SimpleRendersTitleAndDismiss: Story = {
  render: () => (
    <NotificationCard.Simple title="Hello" description="World" onDismiss={() => {}} />
  ),
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector('[role="status"]');
    await expect(status).not.toBeNull();
    const dismiss = canvasElement.querySelector('button[aria-label="Dismiss notification"]');
    await expect(dismiss).not.toBeNull();
  },
};

export const SimpleOmitsDismissWhenNoHandler: Story = {
  render: () => <NotificationCard.Simple title="X" />,
  play: async ({ canvasElement }) => {
    const dismiss = canvasElement.querySelector('button[aria-label="Dismiss notification"]');
    await expect(dismiss).toBeNull();
  },
};

export const CondensedRendersActionLink: Story = {
  render: () => (
    <NotificationCard.Condensed
      title="Removed"
      actionLabel="Undo"
      onAction={() => {}}
      onDismiss={() => {}}
    />
  ),
  play: async ({ canvasElement, step }) => {
    await step('action button present', async () => {
      const buttons = canvasElement.querySelectorAll('button');
      // 2 buttons: action + dismiss
      await expect(buttons.length).toBe(2);
    });
    await step('dark background', async () => {
      const root = canvasElement.querySelector('[role="status"]');
      await expect(root?.className ?? '').toMatch(/bg-gray-900/);
    });
  },
};
