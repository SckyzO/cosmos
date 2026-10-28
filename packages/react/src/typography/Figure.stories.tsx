import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { bothDirections, directionBox, endOffset, startOffset } from '../storybook-helpers';
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

export const End: Story = {
  args: {
    size: 'sm',
    align: 'end',
    caption: 'Aligned to the end with `ms-auto`.',
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** `start` and `end` name the reading direction: the figure sits on the right in right to left. */
export const AlignFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-4">
        <Figure src={PHOTO} alt="Start" size="xs" align="start" />
        <Figure src={PHOTO} alt="End" size="xs" align="end" />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const start = box.querySelector('img[alt="Start"]')!.closest('figure')!;
      const end = box.querySelector('img[alt="End"]')!.closest('figure')!;
      expect(startOffset(start, box), `${dir}: start`).toBeLessThan(endOffset(start, box));
      expect(endOffset(end, box), `${dir}: end`).toBeLessThan(startOffset(end, box));
    }
  },
};
