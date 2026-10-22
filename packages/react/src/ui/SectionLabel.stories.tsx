import type { Meta, StoryObj } from '@storybook/react-vite';
import { expectTextContrast } from '../storybook-helpers';
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

// 10px gray-400 text sat at 2.6:1 on light and 2.35:1 on deep-blue (#151).
const contrastIn = (theme: string): Story => ({
  tags: ['!dev', '!autodocs'],
  globals: { theme },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Section title example'));
  },
});

export const ContrastInLight = contrastIn('light');
export const ContrastInSand = contrastIn('sand');
export const ContrastInDark = contrastIn('dark');
export const ContrastInDeepBlue = contrastIn('deep-blue');
