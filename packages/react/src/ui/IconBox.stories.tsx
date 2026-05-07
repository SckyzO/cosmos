import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Bell, Cpu, LayoutDashboard, Server, Trash2 } from 'lucide-react';
import { IconBox } from './IconBox';

const meta = {
  title: 'Atoms/Icon Box',
  component: IconBox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { icon: Server },
} satisfies Meta<typeof IconBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sm: Story = { args: { icon: Server, size: 'sm' } };
export const Md: Story = { args: { icon: Cpu, size: 'md' } };
export const Lg: Story = { args: { icon: Activity, size: 'lg' } };

export const ColorVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconBox icon={Server} />
      <IconBox icon={Bell} bg="bg-brand-50 dark:bg-brand-500/10" color="text-brand-500" />
      <IconBox icon={Trash2} bg="bg-red-50 dark:bg-red-500/10" color="text-red-500" />
      <IconBox
        icon={LayoutDashboard}
        bg="bg-green-50 dark:bg-green-500/10"
        color="text-green-500"
      />
    </div>
  ),
};
