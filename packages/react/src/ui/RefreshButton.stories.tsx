import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
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
  args: { autoRefreshMs: 0, onRefresh: fn(), onIntervalChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Refresh/ }));
    await expect(args.onRefresh).toHaveBeenCalled();
  },
};
