import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
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

// ── Interaction tests ────────────────────────────────────────────────────────

/** Each `intent` keeps its colors, `danger` being the red the old `error` was; `info` is the default. */
export const IntentColorsTheBanner: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-2">
      <AlertBanner intent="success">success</AlertBanner>
      <AlertBanner intent="danger">danger</AlertBanner>
      <AlertBanner intent="warning">warning</AlertBanner>
      <AlertBanner intent="info">info</AlertBanner>
      <AlertBanner>default</AlertBanner>
    </div>
  ),
  play: async ({ canvas }) => {
    const banner = (label: string) => canvas.getByText(label).closest('[role="alert"]')!;
    await expect(banner('success')).toHaveClass('border-green-200', 'bg-green-50');
    await expect(banner('danger')).toHaveClass('border-red-200', 'bg-red-50');
    await expect(banner('warning')).toHaveClass('border-amber-200', 'bg-amber-50');
    await expect(banner('info')).toHaveClass('border-blue-200', 'bg-blue-50');
    await expect(banner('default').className).toBe(banner('info').className);
    await expect(canvas.getByText('danger')).toHaveClass('text-red-700');
    await expect(banner('danger').querySelector('svg')).toHaveClass('text-red-500');
  },
};
