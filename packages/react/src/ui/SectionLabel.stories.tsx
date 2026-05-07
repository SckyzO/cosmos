import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionLabel } from './SectionLabel';

const meta = {
  title: 'Atoms/Section Label',
  component: SectionLabel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Section title example' },
} satisfies Meta<typeof SectionLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Multiple: Story = {
  render: () => (
    <div className="space-y-3">
      <SectionLabel>General</SectionLabel>
      <SectionLabel>Notifications</SectionLabel>
      <SectionLabel>Account</SectionLabel>
    </div>
  ),
};
