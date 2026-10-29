import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectMirrored,
  expectReadsLeftToRight,
  startOffset,
} from '../storybook-helpers';
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
      <NotificationCard.Simple intent="info" title="Configuration applied" onDismiss={() => {}} />
    </div>
  ),
};

export const SimpleErrorIntent: Story = {
  render: () => (
    <div className="flex justify-end p-6">
      <NotificationCard.Simple
        intent="danger"
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
  tags: ['!dev'],
  render: () => <NotificationCard.Simple title="Hello" description="World" onDismiss={() => {}} />,
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector('[role="status"]');
    await expect(status).not.toBeNull();
    const dismiss = canvasElement.querySelector('button[aria-label="Dismiss notification"]');
    await expect(dismiss).not.toBeNull();
  },
};

export const SimpleOmitsDismissWhenNoHandler: Story = {
  tags: ['!dev'],
  render: () => <NotificationCard.Simple title="X" />,
  play: async ({ canvasElement }) => {
    const dismiss = canvasElement.querySelector('button[aria-label="Dismiss notification"]');
    await expect(dismiss).toBeNull();
  },
};

export const CondensedRendersActionLink: Story = {
  tags: ['!dev'],
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

/** Each `intent` colors the leading icon; `danger` is the old `error`, `warning` is new, `success` the default. */
export const IntentColorsTheIcon: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-3 p-6">
      <NotificationCard.Simple intent="success" title="success card" />
      <NotificationCard.Simple intent="info" title="info card" />
      <NotificationCard.Simple intent="warning" title="warning card" />
      <NotificationCard.Simple intent="danger" title="danger card" />
      <NotificationCard.Simple title="default card" />
    </div>
  ),
  play: async ({ canvas }) => {
    const icon = (title: string) =>
      canvas.getByText(title).closest('[role="status"]')!.querySelector('svg')!;
    await expect(icon('success card')).toHaveClass('text-green-500');
    await expect(icon('info card')).toHaveClass('text-blue-500');
    await expect(icon('warning card')).toHaveClass('text-amber-500');
    await expect(icon('danger card')).toHaveClass('text-red-500');
    await expect(icon('default card')).toHaveClass('text-green-500');
    // Four intents, four glyphs.
    const glyphs = new Set(
      ['success', 'info', 'warning', 'danger'].map((i) => icon(`${i} card`).innerHTML)
    );
    await expect(glyphs.size).toBe(4);
  },
};

/** The icon starts the card and the dismiss button ends it; the text between keeps its own order. */
export const IconAndDismissFollowTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <NotificationCard.Simple
        title="Backup done (3 of 5)."
        description="Everything was saved."
        onDismiss={() => {}}
      />
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const card = within(directionBox(canvasElement, dir)).getByRole('status');
      const dismiss = within(card).getByRole('button', { name: 'Dismiss notification' });
      const icon = card.querySelector('svg')!;
      expect(endOffset(dismiss, card)).toBeLessThan(startOffset(dismiss, card));
      expect(startOffset(icon, card)).toBeLessThan(endOffset(icon, card));
      // The gap between the icon and the text is on the icon's end side, whichever it is.
      const title = within(card).getByText('Backup done (3 of 5).').closest('p')!;
      expect(startOffset(title, card)).toBeGreaterThan(startOffset(icon, card) + 20);
      expectReadsLeftToRight(title);
    }
    for (const find of [
      (box: HTMLElement) => within(box).getByRole('button', { name: 'Dismiss notification' }),
      (box: HTMLElement) => within(box).getByText('Everything was saved.'),
    ])
      expectMirrored(canvasElement, find);
  },
};

/** The condensed card puts its action and dismiss button after the text, in either direction. */
export const CondensedActionsFollowTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <NotificationCard.Condensed
        title="Discussion archived"
        actionLabel="Undo"
        onAction={() => {}}
        onDismiss={() => {}}
      />
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const card = within(directionBox(canvasElement, dir)).getByRole('status');
      const title = within(card).getByText('Discussion archived');
      const undo = within(card).getByRole('button', { name: 'Undo' });
      const dismiss = within(card).getByRole('button', { name: 'Dismiss notification' });
      expect(startOffset(title, card)).toBeLessThan(startOffset(undo, card));
      expect(startOffset(undo, card)).toBeLessThan(startOffset(dismiss, card));
    }
    expectMirrored(canvasElement, (box) => within(box).getByRole('button', { name: 'Undo' }));
  },
};
