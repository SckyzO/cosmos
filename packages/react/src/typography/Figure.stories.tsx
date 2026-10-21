import type { Meta, StoryObj } from '@storybook/react-vite';
import { Figure } from './Figure';

// Photo by Benjamin Voros on Unsplash (Unsplash License):
// https://unsplash.com/photos/snow-mountain-under-stars-phIFdC6lA4E
// `new URL(…, import.meta.url)` lets Vite emit it as an asset, base path included.
const PHOTO = new URL('../storybook-assets/snow-mountain-under-stars.jpg', import.meta.url).href;

const meta = {
  title: 'Typography/Figure',
  component: Figure,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    src: PHOTO,
    alt: 'Snow-covered mountains under a starry night sky',
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
    caption: 'Photo by Benjamin Voros on Unsplash.',
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
