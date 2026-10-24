import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Avatar } from './Avatar';
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
