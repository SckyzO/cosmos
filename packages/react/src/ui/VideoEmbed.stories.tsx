import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { VideoEmbed } from './VideoEmbed';

// Use about:blank instead of YouTube so stories render reliably in CI / vitest browser
// without depending on third-party domains.
const SAMPLE_SRC = 'about:blank';

const meta = {
  title: 'Data/Video Embed',
  component: VideoEmbed,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { src: SAMPLE_SRC, title: 'Sample video' },
} satisfies Meta<typeof VideoEmbed>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { src: SAMPLE_SRC, title: 'Sample video' },
};

export const Ratio16x9: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-gray-400 uppercase">16:9 (default)</p>
      <VideoEmbed src={SAMPLE_SRC} title="16:9 demo" aspectRatio="16:9" />
    </div>
  ),
};

export const Ratio4x3: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-gray-400 uppercase">4:3</p>
      <VideoEmbed src={SAMPLE_SRC} title="4:3 demo" aspectRatio="4:3" />
    </div>
  ),
};

export const RatioSquare: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-gray-400 uppercase">1:1</p>
      <div className="max-w-sm">
        <VideoEmbed src={SAMPLE_SRC} title="Square demo" aspectRatio="1:1" />
      </div>
    </div>
  ),
};

export const Ultrawide: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-gray-400 uppercase">21:9</p>
      <VideoEmbed src={SAMPLE_SRC} title="Ultrawide demo" aspectRatio="21:9" />
    </div>
  ),
};

export const Sharp: Story = {
  args: { src: SAMPLE_SRC, title: 'Without rounded corners', rounded: false },
};

export const NativeVideo: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-text-muted)]">
        Native HTML5 video element with controls — useful for self-hosted MP4s.
      </p>
      <VideoEmbed
        src=""
        title="Native sample"
        type="video"
        controls
        poster="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%20fill%3D%22%23111827%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2228%22%20fill%3D%22%236b7280%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EPoster%20preview%3C%2Ftext%3E%3C%2Fsvg%3E"
      />
    </div>
  ),
};

export const Ratios: Story = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-2">
      {(['16:9', '4:3', '1:1', '21:9'] as const).map((r) => (
        <div key={r} className="space-y-2">
          <p className="font-mono text-[10px] text-gray-400 uppercase">{r}</p>
          <VideoEmbed src={SAMPLE_SRC} title={`${r} demo`} aspectRatio={r} />
        </div>
      ))}
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RendersIframeByDefault: Story = {
  args: { src: SAMPLE_SRC, title: 'Iframe sample' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('iframe')).not.toBeNull();
    await expect(canvasElement.querySelector('video')).toBeNull();
  },
};

export const NativeRendersVideo: Story = {
  args: { src: '', title: 'Video sample', type: 'video' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('video')).not.toBeNull();
    await expect(canvasElement.querySelector('iframe')).toBeNull();
  },
};
