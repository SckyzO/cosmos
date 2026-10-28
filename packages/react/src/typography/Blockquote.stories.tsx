import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { placeholderAvatar } from '../storybook-avatars';
import { bothDirections, directionBox, endOffset, startOffset } from '../storybook-helpers';
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

export const End: Story = {
  args: { variant: 'solid', align: 'end' },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** `start` and `end` name the reading direction: the text sits on the right in right to left. */
export const AlignFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-4">
        <Blockquote variant="testimonial" align="start">
          <span>Aligned to the start</span>
        </Blockquote>
        <Blockquote variant="testimonial" align="end">
          <span>Aligned to the end</span>
        </Blockquote>
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const start = within(box).getByText('Aligned to the start');
      const end = within(box).getByText('Aligned to the end');
      expect(startOffset(start, box), `${dir}: start`).toBeLessThan(endOffset(start, box));
      expect(endOffset(end, box), `${dir}: end`).toBeLessThan(startOffset(end, box));
    }
  },
};
