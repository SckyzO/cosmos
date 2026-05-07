import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pencil, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { expect, fn, userEvent } from 'storybook/test';
import { PageActionButton, PageActionIconButton } from './PageActionButton';

const meta = {
  title: 'Actions/Page Action Button',
  component: PageActionButton,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Action' },
} satisfies Meta<typeof PageActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = { args: { children: 'Configure', icon: SlidersHorizontal } };
export const Primary: Story = { args: { children: 'New', variant: 'primary', icon: Plus } };
export const BrandOutline: Story = {
  args: { children: 'Edit layout', variant: 'brand-outline', icon: Pencil },
};
export const DangerOutline: Story = {
  args: { children: 'Delete', variant: 'danger-outline', icon: Trash2 },
};

export const ClickFiresOnClick: Story = {
  args: { children: 'Save', icon: Plus, onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <PageActionIconButton icon={SlidersHorizontal} title="Configure" />
      <PageActionIconButton icon={Plus} title="Add" variant="primary" />
      <PageActionIconButton icon={Trash2} title="Delete" variant="danger-outline" />
    </div>
  ),
};
