import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectBelow, expectOutsideClip, scrollAnchor } from '../storybook-helpers';
import { RefreshButton, useAutoRefresh } from './RefreshButton';

const meta = {
  title: 'Actions/Refresh Button',
  component: RefreshButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { autoRefreshMs: 0, onRefresh: () => {}, onIntervalChange: () => {} },
} satisfies Meta<typeof RefreshButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { autoRefreshMs: 0, onRefresh: () => {}, onIntervalChange: () => {} },
};

export const AutoRefreshing: Story = {
  args: { autoRefreshMs: 30_000, onRefresh: () => {}, onIntervalChange: () => {} },
};

export const Refreshing: Story = {
  args: { refreshing: true, autoRefreshMs: 0, onRefresh: () => {}, onIntervalChange: () => {} },
};

export const WithUseAutoRefresh: Story = {
  render: () => {
    const [refreshing, setRefreshing] = useState(false);
    const { autoRefreshMs, onIntervalChange } = useAutoRefresh('storybook-demo', () => {});
    const onRefresh = async () => {
      setRefreshing(true);
      await new Promise((r) => setTimeout(r, 600));
      setRefreshing(false);
    };
    return (
      <RefreshButton
        refreshing={refreshing}
        autoRefreshMs={autoRefreshMs}
        onRefresh={onRefresh}
        onIntervalChange={onIntervalChange}
      />
    );
  },
};

export const ClickRefreshFiresHandler: Story = {
  tags: ['!dev'],
  args: { autoRefreshMs: 0, onRefresh: fn(), onIntervalChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Refresh/ }));
    await expect(args.onRefresh).toHaveBeenCalled();
  },
};

// ── Floating interval menu (#151) ────────────────────────────────────────────
// The menu renders in a portal: no `overflow: hidden` ancestor clips it, and it
// follows the button while the page scrolls.

const page = within(document.body);
const intervalMenu = () => page.queryByRole('button', { name: '15s' })?.parentElement ?? null;

/** A toolbar that clips its content no longer cuts the menu off. */
export const IntervalMenuEscapesOverflowHidden: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
  render: (args) => (
    <div data-testid="clip" className="w-fit overflow-hidden rounded-lg border p-2">
      <RefreshButton {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose refresh interval' }));
    await waitFor(() => expect(intervalMenu()).not.toBeNull());
    expectOutsideClip(intervalMenu()!, canvas.getByTestId('clip'));
  },
};

/**
 * The menu stays under the button on scroll, focus on its first interval; Escape, an
 * outside click and a pick close it, Escape and a pick returning focus to the button.
 */
export const IntervalMenuFollowsAndCloses: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onIntervalChange: fn() },
  render: (args) => (
    <div data-testid="scroller" className="h-96 overflow-y-auto">
      <div className="flex flex-col items-end gap-4 p-6 pb-[600px]">
        <RefreshButton {...args} />
        <button type="button">Outside</button>
      </div>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose refresh interval' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(page.getByRole('button', { name: 'Off' })).toHaveFocus());
    const menu = intervalMenu()!;
    await scrollAnchor(canvas.getByTestId('scroller'), trigger);
    await waitFor(() => expectBelow(menu, trigger, { offset: 4, align: 'end' }));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(intervalMenu()).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    await waitFor(() => expect(intervalMenu()).not.toBeNull());
    await userEvent.click(canvas.getByRole('button', { name: 'Outside' }));
    await waitFor(() => expect(intervalMenu()).toBeNull());

    await userEvent.click(trigger);
    await userEvent.click(await page.findByRole('button', { name: '1m' }));
    await expect(args.onIntervalChange).toHaveBeenCalledWith(60_000);
    await waitFor(() => expect(intervalMenu()).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};
