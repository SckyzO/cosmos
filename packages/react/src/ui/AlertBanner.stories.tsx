import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertBanner } from './AlertBanner';

const meta = {
  title: 'Atoms/Alert Banner',
  component: AlertBanner,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Alert message' },
} satisfies Meta<typeof AlertBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { intent: 'success', children: 'Settings saved successfully.' },
};
export const Error: Story = {
  args: { intent: 'danger', children: 'Failed to connect to Prometheus.' },
};
export const Warning: Story = {
  args: { intent: 'warning', children: 'Simulator is running with overrides active.' },
};
export const Info: Story = {
  args: { intent: 'info', children: 'Changes will take effect on next scrape cycle.' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-2">
      <AlertBanner intent="success">Settings saved successfully.</AlertBanner>
      <AlertBanner intent="danger">Failed to connect to Prometheus.</AlertBanner>
      <AlertBanner intent="warning">Simulator is running with overrides active.</AlertBanner>
      <AlertBanner intent="info">Changes will take effect on next scrape cycle.</AlertBanner>
    </div>
  ),
};
