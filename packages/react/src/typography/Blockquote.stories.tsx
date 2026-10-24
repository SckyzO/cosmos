import type { Meta, StoryObj } from '@storybook/react-vite';
import { placeholderAvatar } from '../storybook-avatars';
import { Blockquote } from './Blockquote';

const meta = {
  title: 'Typography/Blockquote',
  component: Blockquote,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    children:
      'Cosmos lets us ship a consistent design across rackscope, monitoring-hub, and the docs site without rebuilding the wheel for every surface.',
  },
} satisfies Meta<typeof Blockquote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const Solid: Story = {
  args: { variant: 'solid' },
};

export const WithIcon: Story = {
  args: { variant: 'icon' },
};

export const Testimonial: Story = {
  args: {
    variant: 'testimonial',
    author: 'Jane Doe',
    role: 'Senior SRE · Platform Team',
  },
};

export const TestimonialWithAvatar: Story = {
  args: {
    variant: 'testimonial',
    align: 'center',
    author: 'Jane Doe',
    role: 'Senior SRE · Platform Team',
    // A local image: no network, the same picture on every run.
    authorAvatar: placeholderAvatar('Jane Doe', 64),
  },
};

export const SizeLg: Story = {
  args: { size: 'lg' },
};

export const Centered: Story = {
  args: { variant: 'icon', align: 'center' },
};

export const Right: Story = {
  args: { variant: 'solid', align: 'right' },
};
