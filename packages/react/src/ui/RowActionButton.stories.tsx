import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { RowActionButton } from './RowActionButton';

const meta = {
  title: 'Actions/Row Action Button',
  component: RowActionButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: 'View' },
} satisfies Meta<typeof RowActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HideChevron: Story = { args: { children: 'Open', hideChevron: true } };

export const ClickFiresOnClick: Story = {
  args: { children: 'View', onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /View/ }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
