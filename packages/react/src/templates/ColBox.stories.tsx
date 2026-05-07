import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColBox } from './ColBox';

const meta = {
  title: 'Layout/Col Box',
  component: ColBox,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: '50%' },
} satisfies Meta<typeof ColBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: '50%' } };

export const Triple: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <ColBox label="20%" />
      <ColBox label="60%" />
      <ColBox label="20%" />
    </div>
  ),
};
