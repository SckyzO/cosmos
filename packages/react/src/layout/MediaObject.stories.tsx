import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { bothDirections, directionBox, endOffset, startOffset } from '../storybook-helpers';
import { Card } from '../ui/Card';
import { MediaObject } from './MediaObject';

const meta = {
  title: 'Layout/Media Object',
  component: MediaObject,
  subcomponents: {
    'MediaObject.Image': MediaObject.Image,
    'MediaObject.Body': MediaObject.Body,
    'MediaObject.Title': MediaObject.Title,
    'MediaObject.Description': MediaObject.Description,
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof MediaObject>;

export default meta;
type Story = StoryObj<typeof meta>;

// Neutral placeholder — mirrors the dashed-frame TUI demo art. It fills the
// box it is given instead of keeping its square ratio (strokes stay 2px), so
// in the Stretched story it grows with the body like a cover image would.
const Placeholder = ({ className = '' }: { className?: string }) => (
  <svg
    className={`text-gray-300 dark:text-gray-700 ${className}`}
    viewBox="0 0 64 64"
    preserveAspectRatio="none"
    fill="none"
    aria-hidden
  >
    <rect
      width="64"
      height="64"
      rx="4"
      stroke="currentColor"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
    <line
      x1="0"
      y1="0"
      x2="64"
      y2="64"
      stroke="currentColor"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
    <line
      x1="64"
      y1="0"
      x2="0"
      y2="64"
      stroke="currentColor"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

// The layout stories share one body, long enough to wrap over four lines in a
// `max-w-xs` row: taller than the 64px media, so each `align` value puts the
// media somewhere visibly different.

// TUI Plus pattern "Basic" — media left, body right, top-aligned. Shown in a Card, where a media
// object usually sits (a comment, a notification, a list entry).
export const Basic: Story = {
  render: () => (
    <div className="bg-[var(--color-bg-base)] p-8">
      <Card className="max-w-sm">
        <MediaObject>
          <MediaObject.Image>
            <Placeholder className="size-16" />
          </MediaObject.Image>
          <MediaObject.Body>
            <MediaObject.Title>Lorem ipsum</MediaObject.Title>
            <MediaObject.Description>
              Repudiandae sint consequuntur vel. Amet ut nobis explicabo numquam expedita quia omnis
              voluptatem. Minus quidem ipsam quia iusto.
            </MediaObject.Description>
          </MediaObject.Body>
        </MediaObject>
      </Card>
    </div>
  ),
};

// TUI Plus pattern "Aligned to center" — the media sits halfway down the body.
export const AlignedToCenter: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <MediaObject align="center" className="max-w-xs">
        <MediaObject.Image>
          <Placeholder className="size-16" />
        </MediaObject.Image>
        <MediaObject.Body>
          <MediaObject.Title>Lorem ipsum</MediaObject.Title>
          <MediaObject.Description>
            Repudiandae sint consequuntur vel. Amet ut nobis explicabo numquam expedita quia omnis
            voluptatem. Minus quidem ipsam quia iusto.
          </MediaObject.Description>
        </MediaObject.Body>
      </MediaObject>
    </div>
  ),
};

// TUI Plus pattern "Aligned to bottom" — the media lines up with the last line.
export const AlignedToBottom: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <MediaObject align="bottom" className="max-w-xs">
        <MediaObject.Image>
          <Placeholder className="size-16" />
        </MediaObject.Image>
        <MediaObject.Body>
          <MediaObject.Title>Lorem ipsum</MediaObject.Title>
          <MediaObject.Description>
            Repudiandae sint consequuntur vel. Amet ut nobis explicabo numquam expedita quia omnis
            voluptatem. Minus quidem ipsam quia iusto.
          </MediaObject.Description>
        </MediaObject.Body>
      </MediaObject>
    </div>
  ),
};

// TUI Plus pattern "Stretched to fit" — media height matches body height.
export const Stretched: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <MediaObject align="stretch" className="max-w-xs">
        <MediaObject.Image>
          <Placeholder className="h-full w-16" />
        </MediaObject.Image>
        <MediaObject.Body>
          <MediaObject.Title>Lorem ipsum</MediaObject.Title>
          <MediaObject.Description>
            Repudiandae sint consequuntur vel. Amet ut nobis explicabo numquam expedita quia omnis
            voluptatem. Minus quidem ipsam quia iusto.
          </MediaObject.Description>
        </MediaObject.Body>
      </MediaObject>
    </div>
  ),
};

// TUI Plus pattern "Media on right": `end` is the right in left to right.
export const MediaAtTheEnd: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <MediaObject mediaPosition="end" className="max-w-xs">
        <MediaObject.Image>
          <Placeholder className="size-16" />
        </MediaObject.Image>
        <MediaObject.Body>
          <MediaObject.Title>Lorem ipsum</MediaObject.Title>
          <MediaObject.Description>
            Repudiandae sint consequuntur vel. Amet ut nobis explicabo numquam expedita quia omnis
            voluptatem. Minus quidem ipsam quia iusto.
          </MediaObject.Description>
        </MediaObject.Body>
      </MediaObject>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsFlexRow: Story = {
  tags: ['!dev'],
  render: () => (
    <MediaObject data-testid="mo">
      <MediaObject.Image>x</MediaObject.Image>
      <MediaObject.Body>y</MediaObject.Body>
    </MediaObject>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId('mo');
    await expect(root).toHaveStyle({ display: 'flex', flexDirection: 'row' });
  },
};

export const MediaPositionEndAddsRowReverse: Story = {
  tags: ['!dev'],
  render: () => (
    <MediaObject mediaPosition="end" data-testid="mo">
      <MediaObject.Image>x</MediaObject.Image>
      <MediaObject.Body>y</MediaObject.Body>
    </MediaObject>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="mo"]');
    await expect(root).toHaveAttribute('data-media-position', 'end');
    await expect(root?.className ?? '').toMatch(/flex-row-reverse/);
  },
};

export const AlignCenterAddsItemsCenter: Story = {
  tags: ['!dev'],
  render: () => (
    <MediaObject align="center" data-testid="mo">
      <MediaObject.Image>x</MediaObject.Image>
      <MediaObject.Body>y</MediaObject.Body>
    </MediaObject>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="mo"]');
    await expect(root?.className ?? '').toMatch(/items-center/);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** `start` puts the media before the body, `end` after it: both mirror in right to left. */
export const MediaPositionFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-4">
        <MediaObject mediaPosition="start">
          <MediaObject.Image>
            <span data-testid="start-media">A</span>
          </MediaObject.Image>
          <MediaObject.Body>Start body</MediaObject.Body>
        </MediaObject>
        <MediaObject mediaPosition="end">
          <MediaObject.Image>
            <span data-testid="end-media">B</span>
          </MediaObject.Image>
          <MediaObject.Body>End body</MediaObject.Body>
        </MediaObject>
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const startMedia = within(box).getByTestId('start-media');
      const endMedia = within(box).getByTestId('end-media');
      expect(startOffset(startMedia, box), `${dir}: start media`).toBeLessThan(
        startOffset(within(box).getByText('Start body'), box)
      );
      expect(endOffset(endMedia, box), `${dir}: end media`).toBeLessThan(
        endOffset(within(box).getByText('End body'), box)
      );
    }
  },
};
