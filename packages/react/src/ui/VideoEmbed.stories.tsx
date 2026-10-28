import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { bothDirections, directionBox } from '../storybook-helpers';
import { VideoEmbed } from './VideoEmbed';

// Real YouTube embed for the showcase stories. The interaction tests
// (RendersIframeByDefault / NativeRendersVideo) target the structural
// behaviour and don't actually load network video, so this is safe in CI.
const SAMPLE_SRC = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';

const meta = {
  title: 'Media/Video Embed',
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

const POSTER =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%20fill%3D%22%231f2937%22%2F%3E%3C%2Fsvg%3E';

/**
 * `facade` puts the poster and a play button in place of the player: the iframe, and what the
 * provider's page loads or stores, only come once the visitor presses play. Opt-in.
 */
export const Facade: Story = {
  args: { src: SAMPLE_SRC, title: 'Sample video', facade: true, poster: POSTER },
};

export const Ratio16x9: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-gray-500 uppercase dark:text-gray-400">
        16:9 (default)
      </p>
      <VideoEmbed src={SAMPLE_SRC} title="16:9 demo" aspectRatio="16:9" />
    </div>
  ),
};

export const Ratio4x3: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-gray-500 uppercase dark:text-gray-400">4:3</p>
      <VideoEmbed src={SAMPLE_SRC} title="4:3 demo" aspectRatio="4:3" />
    </div>
  ),
};

export const RatioSquare: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-gray-500 uppercase dark:text-gray-400">1:1</p>
      <div className="max-w-sm">
        <VideoEmbed src={SAMPLE_SRC} title="Square demo" aspectRatio="1:1" />
      </div>
    </div>
  ),
};

export const Ultrawide: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-gray-500 uppercase dark:text-gray-400">21:9</p>
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
          <p className="font-mono text-[10px] text-gray-500 uppercase dark:text-gray-400">{r}</p>
          <VideoEmbed src={SAMPLE_SRC} title={`${r} demo`} aspectRatio={r} />
        </div>
      ))}
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RendersIframeByDefault: Story = {
  tags: ['!dev'],
  args: { src: SAMPLE_SRC, title: 'Iframe sample' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('iframe')).not.toBeNull();
    await expect(canvasElement.querySelector('video')).toBeNull();
  },
};

export const NativeRendersVideo: Story = {
  tags: ['!dev'],
  args: { src: '', title: 'Video sample', type: 'video' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('video')).not.toBeNull();
    await expect(canvasElement.querySelector('iframe')).toBeNull();
  },
};

export const IframeIsSandboxedByDefault: Story = {
  tags: ['!dev'],
  args: { src: 'about:blank', title: 'Sandbox sample' },
  play: async ({ canvasElement }) => {
    const iframe = canvasElement.querySelector('iframe');
    const tokens = iframe?.getAttribute('sandbox')?.split(' ') ?? [];
    await expect(tokens).toContain('allow-scripts');
    // The embed can't navigate the page, submit forms or download.
    await expect(tokens).not.toContain('allow-top-navigation');
    await expect(tokens).not.toContain('allow-forms');
    await expect(tokens).not.toContain('allow-downloads');
    await expect(iframe).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  },
};

export const IframeSandboxAndReferrerPolicyOverride: Story = {
  tags: ['!dev'],
  args: { src: 'about:blank', title: 'Strict sample', sandbox: '', referrerPolicy: 'no-referrer' },
  play: async ({ canvasElement }) => {
    const iframe = canvasElement.querySelector('iframe');
    await expect(iframe).toHaveAttribute('sandbox', '');
    await expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer');
  },
};

export const FacadeLoadsNoIframeUntilPlay: Story = {
  tags: ['!dev', '!autodocs'],
  args: { src: 'about:blank', title: 'Facade sample', facade: true, poster: POSTER },
  play: async ({ canvasElement, canvas }) => {
    await expect(canvasElement.querySelector('iframe')).toBeNull();
    const play = canvas.getByRole('button', { name: 'Play Facade sample' });
    await userEvent.click(play);
    await waitFor(() => expect(canvasElement.querySelector('iframe')).not.toBeNull());
    await expect(canvas.queryByRole('button', { name: 'Play Facade sample' })).toBeNull();
    // The player takes over the focus the button held.
    await expect(canvasElement.querySelector('iframe')).toHaveFocus();
  },
};

export const FacadeRequestsAutoplay: Story = {
  tags: ['!dev', '!autodocs'],
  args: { src: 'https://example.test/embed/abc?rel=0', title: 'Autoplay sample', facade: true },
  play: async ({ canvasElement, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Play Autoplay sample' }));
    const src = canvasElement.querySelector('iframe')?.getAttribute('src') ?? '';
    await expect(new URL(src).searchParams.get('autoplay')).toBe('1');
    await expect(new URL(src).searchParams.get('rel')).toBe('0');
  },
};

/** The facade is opt-in: without it the iframe is there from the start, as before. */
export const WithoutFacadeIframeIsImmediate: Story = {
  tags: ['!dev', '!autodocs'],
  args: { src: 'about:blank', title: 'Plain sample', poster: POSTER },
  play: async ({ canvasElement, canvas }) => {
    await expect(canvasElement.querySelector('iframe')).not.toBeNull();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The play triangle points right in both directions, as the time of a video runs from the left,
 * so it is not turned around and its optical offset stays on the same side.
 */
export const PlayTriangleDoesNotTurnAround: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <VideoEmbed src="about:blank" title="Facade sample" facade poster={POSTER} />
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const play = within(directionBox(canvasElement, dir)).getByRole('button', {
        name: 'Play Facade sample',
      });
      const triangle = play.querySelector('svg')!;
      expect(getComputedStyle(triangle).scale, `${dir}: not mirrored`).toBe('none');
      expect(getComputedStyle(triangle).marginLeft, `${dir}: offset`).toBe('2px');
    }
  },
};
