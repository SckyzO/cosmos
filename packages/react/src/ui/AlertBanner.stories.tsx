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
  args: { variant: 'success', children: 'Settings saved successfully.' },
};
export const Error: Story = {
  args: { variant: 'error', children: 'Failed to connect to Prometheus.' },
};
export const Warning: Story = {
  args: { variant: 'warning', children: 'Simulator is running with overrides active.' },
};
export const Info: Story = {
  args: { variant: 'info', children: 'Changes will take effect on next scrape cycle.' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-2">
      <AlertBanner variant="success">Settings saved successfully.</AlertBanner>
      <AlertBanner variant="error">Failed to connect to Prometheus.</AlertBanner>
      <AlertBanner variant="warning">Simulator is running with overrides active.</AlertBanner>
      <AlertBanner variant="info">Changes will take effect on next scrape cycle.</AlertBanner>
    </div>
  ),
};
