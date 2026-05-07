import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Filter } from 'lucide-react';
import { expect, fn, userEvent } from 'storybook/test';
import { FilterPills } from './FilterPills';

const meta = {
  title: 'Forms/Filter Pills',
  component: FilterPills,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options: [], value: '', onChange: () => {} },
} satisfies Meta<typeof FilterPills>;

export default meta;
type Story = StoryObj<typeof meta>;

const SEVERITY = [
  { value: 'all', label: 'All' },
  { value: 'crit', label: 'CRIT' },
  { value: 'warn', label: 'WARN' },
  { value: 'ok', label: 'OK' },
];

export const Default: Story = {
  args: { options: SEVERITY, value: 'all' },
};

export const WithIconPrefix: Story = {
  args: { options: SEVERITY, value: 'all', icon: Filter },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('all');
    return (
      <div>
        <FilterPills options={SEVERITY} value={v} onChange={setV} icon={Filter} />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{v}</code>
        </p>
      </div>
    );
  },
};

export const ClickPillFiresOnChange: Story = {
  args: { options: SEVERITY, value: 'all', onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'CRIT' }));
    await expect(args.onChange).toHaveBeenCalledWith('crit');
  },
};
