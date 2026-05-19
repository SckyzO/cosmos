import type { Meta, StoryObj } from '@storybook/react-vite';
import { Figure } from './Figure';

const meta = {
  title: 'Typography/Figure',
  component: Figure,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    src: 'https://api.dicebear.com/9.x/glass/svg?seed=cosmos&backgroundColor=6366f1,a855f7',
    alt: 'Cosmos abstract pattern',
  },
} satisfies Meta<typeof Figure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { size: 'md' },
};

export const WithCaption: Story = {
  args: {
    size: 'md',
    caption: 'Cosmos design system — abstract pattern generated procedurally.',
  },
};

export const Rounded: Story = {
  args: { size: 'sm', radius: 'xl', caption: 'Soft rounded corners (radius xl).' },
};

export const Circular: Story = {
  args: {
    size: 'xs',
    radius: 'full',
    caption: 'Circular crop for avatars and logos.',
  },
};

export const WithShadow: Story = {
  args: {
    size: 'md',
    shadow: true,
    caption: 'A soft drop-shadow gives the figure a lifted feel.',
  },
};

export const Centered: Story = {
  args: {
    size: 'md',
    align: 'center',
    caption: 'Centered with `mx-auto`.',
  },
};

export const Right: Story = {
  args: {
    size: 'sm',
    align: 'right',
    caption: 'Right-aligned with `ms-auto`.',
  },
};
