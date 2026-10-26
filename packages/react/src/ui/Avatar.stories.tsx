import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Avatar } from './Avatar';
import { placeholderAvatar } from '../storybook-avatars';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { name: 'John Doe' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const InitialsAndImage: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Sizes">
        <div className="flex flex-wrap items-center gap-4">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <Avatar size={size} name="John Doe" />
              <span className="text-[10px] text-gray-500 uppercase dark:text-gray-400">{size}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <div className="mt-4">
        <SectionCard title="Image fallback">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar size="lg" name="Jane Doe" />
            <Avatar size="lg" name="John Doe" />
            <Avatar size="lg" name="Sckyzo" />
            <Avatar size="lg" name="A B C D" />
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};

export const Statuses: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Status at every size">
        <div className="flex flex-col gap-4">
          {(['online', 'away', 'busy', 'offline'] as const).map((status) => (
            <div key={status} className="flex flex-wrap items-center gap-4">
              <span className="w-16 text-xs text-gray-500 dark:text-gray-400">{status}</span>
              {(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).map((size) => (
                <Avatar key={size} size={size} name="Ana Costa" status={status} />
              ))}
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const StatusWithImage: Story = {
  args: {
    name: 'Ana Costa',
    src: placeholderAvatar('Ana Costa', 96),
    size: 'xl',
    status: 'online',
  },
};

export const StatusJoinsTheName: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-4">
      <Avatar name="Ana Costa" status="online" />
      <Avatar name="Ana Costa" status="busy" statusLabel="occupée" />
      <Avatar status="away" />
      <Avatar name="Ana Costa" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Ana Costa, online' })).toBeInTheDocument();
    await expect(canvas.getByRole('img', { name: 'Ana Costa, occupée' })).toBeInTheDocument();
    await expect(canvas.getByRole('img', { name: 'away' })).toBeInTheDocument();
    // No status, no suffix.
    await expect(canvas.getByRole('img', { name: 'Ana Costa' })).toBeInTheDocument();
  },
};

// The surface color as the browser resolves it, to compare with a ring (a box-shadow).
const surfaceColor = () => {
  const probe = document.createElement('div');
  probe.style.backgroundColor = 'var(--color-bg-panel)';
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return color;
};

export const StatusDotIsRingedAndSized: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="xs" name="Ana Costa" status="online" />
      <Avatar size="3xl" name="Ana Costa" status="busy" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const dots = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-status]'));
    const [small, large] = dots.map((d) => d.getBoundingClientRect());
    // 10px at the least, and about 30% of the avatar otherwise.
    await expect(small?.width).toBeGreaterThanOrEqual(10);
    await expect(large?.width).toBeGreaterThan(24);
    for (const dot of dots) {
      const style = getComputedStyle(dot);
      // The ring is the surface color (a box-shadow).
      await expect(style.boxShadow).toContain(surfaceColor());
    }
  },
};

const BROKEN = 'data:image/png;base64,broken';
// 1x1 transparent GIF.
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const NamedAvatarIsAnImage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { name: 'Jane Doe' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
  },
};

export const RetriesWhenSrcChanges: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [src, setSrc] = useState(BROKEN);
    return (
      <div>
        <Avatar src={src} name="Jane Doe" />
        <button type="button" onClick={() => setSrc(PIXEL)}>
          Fix
        </button>
      </div>
    );
  },
  play: async ({ canvasElement, canvas }) => {
    // The broken source fails, so the initials stand in.
    await waitFor(() => expect(canvas.getByText('JD')).toBeInTheDocument());
    await userEvent.click(canvas.getByRole('button', { name: 'Fix' }));
    await waitFor(() => expect(canvasElement.querySelector('img')).not.toBeNull());
  },
};
