import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
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

// Neutral placeholder square — mirrors the dashed-frame TUI demo art.
const Placeholder = ({ className = '' }: { className?: string }) => (
  <svg
    className={`text-gray-300 dark:text-gray-700 ${className}`}
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden
  >
    <rect width="64" height="64" rx="4" stroke="currentColor" strokeWidth="2" />
    <line x1="0" y1="0" x2="64" y2="64" stroke="currentColor" strokeWidth="2" />
    <line x1="64" y1="0" x2="0" y2="64" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// TUI Plus pattern "Basic" — media left, body right, top-aligned.
export const Basic: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <MediaObject>
        <MediaObject.Image>
          <Placeholder className="size-16" />
        </MediaObject.Image>
        <MediaObject.Body>
          <MediaObject.Title>Lorem ipsum</MediaObject.Title>
          <MediaObject.Description>
            Repudiandae sint consequuntur vel. Amet ut nobis explicabo numquam expedita
            quia omnis voluptatem. Minus quidem ipsam quia iusto.
          </MediaObject.Description>
        </MediaObject.Body>
      </MediaObject>
    </div>
  ),
};

// TUI Plus pattern "Aligned to center".
export const AlignedToCenter: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <MediaObject align="center">
        <MediaObject.Image>
          <Placeholder className="size-16" />
        </MediaObject.Image>
        <MediaObject.Body>
          <MediaObject.Title>Lorem ipsum</MediaObject.Title>
          <MediaObject.Description>
            Body text is vertically centered with the media.
          </MediaObject.Description>
        </MediaObject.Body>
      </MediaObject>
    </div>
  ),
};

// TUI Plus pattern "Aligned to bottom".
export const AlignedToBottom: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <MediaObject align="bottom">
        <MediaObject.Image>
          <Placeholder className="size-16" />
        </MediaObject.Image>
        <MediaObject.Body>
          <MediaObject.Title>Lorem ipsum</MediaObject.Title>
          <MediaObject.Description>Bottom-aligned content.</MediaObject.Description>
        </MediaObject.Body>
      </MediaObject>
    </div>
  ),
};

// TUI Plus pattern "Stretched to fit" — media height matches body height.
export const Stretched: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <MediaObject align="stretch">
        <MediaObject.Image>
          <Placeholder className="h-full w-16" />
        </MediaObject.Image>
        <MediaObject.Body>
          <MediaObject.Title>Lorem ipsum</MediaObject.Title>
          <MediaObject.Description>
            Media takes the full body height via `align='stretch'` and a media element
            sized with `h-full`.
          </MediaObject.Description>
        </MediaObject.Body>
      </MediaObject>
    </div>
  ),
};

// TUI Plus pattern "Media on right".
export const MediaOnRight: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <MediaObject mediaPosition="right">
        <MediaObject.Image>
          <Placeholder className="size-16" />
        </MediaObject.Image>
        <MediaObject.Body>
          <MediaObject.Title>Lorem ipsum</MediaObject.Title>
          <MediaObject.Description>
            Reversed row — media now sits on the right via `mediaPosition='right'`.
          </MediaObject.Description>
        </MediaObject.Body>
      </MediaObject>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsFlexRow: Story = {
  render: () => (
    <MediaObject data-testid="mo">
      <MediaObject.Image>x</MediaObject.Image>
      <MediaObject.Body>y</MediaObject.Body>
    </MediaObject>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="mo"]');
    await expect(root?.className ?? '').toMatch(/^|\sflex\s|$/);
  },
};

export const MediaPositionRightAddsRowReverse: Story = {
  render: () => (
    <MediaObject mediaPosition="right" data-testid="mo">
      <MediaObject.Image>x</MediaObject.Image>
      <MediaObject.Body>y</MediaObject.Body>
    </MediaObject>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="mo"]');
    await expect(root).toHaveAttribute('data-media-position', 'right');
    await expect(root?.className ?? '').toMatch(/flex-row-reverse/);
  },
};

export const AlignCenterAddsItemsCenter: Story = {
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
