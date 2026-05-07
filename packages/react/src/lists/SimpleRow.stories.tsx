import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimpleRow } from './SimpleRow';

const meta = {
  title: 'Lists/Simple Row',
  component: SimpleRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Label', value: 'Value' },
} satisfies Meta<typeof SimpleRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Height', value: '42U' } };
export const MonoValue: Story = { args: { label: 'ID', value: 'rack-01-a', mono: true } };

export const Stacked: Story = {
  render: () => (
    <div className="max-w-md divide-y divide-[var(--color-border)]">
      <SimpleRow label="ID" value="rack-01-a" mono />
      <SimpleRow label="Height" value="42U" />
      <SimpleRow label="Template" value="Standard Air Cooled" />
      <SimpleRow label="Devices" value={14} />
      <SimpleRow label="Last seen" value="2 minutes ago" />
    </div>
  ),
};
