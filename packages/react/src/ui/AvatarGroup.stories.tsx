import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { placeholderAvatar } from '../storybook-avatars';
import { SectionCard } from '../templates/SectionCard';
import { Avatar } from './Avatar';
import { AvatarGroup } from './AvatarGroup';

const meta = {
  title: 'Atoms/AvatarGroup',
  component: AvatarGroup,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { 'aria-label': 'Assignees' },
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const NAMES = [
  'Ana Costa',
  'Mei Tanaka',
  'Aiden Park',
  'Priya Singh',
  'Olivier Dubois',
  'Marcus Bell',
  'Lena Fischer',
];
const PEOPLE = NAMES.map((name) => ({ name, src: placeholderAvatar(name, 96) }));
// Initials only, so each avatar is one `img` for the tests to count.
const INITIALS = NAMES.map((name) => ({ name }));

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Overflow: Story = {
  args: { avatars: PEOPLE },
};

export const Sizes: Story = {
  render: (args) => (
    <Wrap>
      <SectionCard title="Sizes">
        <div className="flex flex-col gap-4">
          {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
            <AvatarGroup key={size} {...args} size={size} avatars={PEOPLE} max={3} />
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Spacing: Story = {
  render: (args) => (
    <Wrap>
      <SectionCard title="normal and tight">
        <div className="flex flex-col gap-4">
          <AvatarGroup {...args} avatars={PEOPLE} spacing="normal" />
          <AvatarGroup {...args} avatars={PEOPLE} spacing="tight" />
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const WithChildrenAndStatus: Story = {
  render: (args) => (
    <AvatarGroup {...args} size="lg">
      <Avatar name="Ana Costa" status="online" />
      <Avatar name="Mei Tanaka" status="away" />
      <Avatar name="Aiden Park" status="busy" />
      <Avatar name="Priya Singh" status="offline" />
      <Avatar name="Marcus Bell" />
    </AvatarGroup>
  ),
};

export const OverflowIsAButton: Story = {
  args: { avatars: PEOPLE, max: 3, onOverflowClick: fn() },
};

export const CustomOverflow: Story = {
  args: {
    avatars: PEOPLE,
    max: 2,
    renderOverflow: (hidden) => (
      <button
        type="button"
        className="focus-visible:focus-indicator bg-brand-500 inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
      >
        +{hidden}
        <span className="sr-only"> teammates</span>
      </button>
    ),
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

export const OverflowCountIsNamed: Story = {
  tags: ['!dev', '!autodocs'],
  args: { avatars: INITIALS, max: 4 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Assignees' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('img')).toHaveLength(5);
    const more = canvas.getByRole('img', { name: '3 more people' });
    await expect(more).toHaveTextContent('+3');
  },
};

export const SingleHiddenIsSingular: Story = {
  tags: ['!dev', '!autodocs'],
  args: { avatars: INITIALS.slice(0, 3), max: 2 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: '1 more person' })).toHaveTextContent('+1');
  },
};

export const MaxAboveCountShowsAll: Story = {
  tags: ['!dev', '!autodocs'],
  args: { avatars: INITIALS.slice(0, 3), max: 10 },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('img')).toHaveLength(3);
    await expect(canvas.queryByText(/^\+\d/)).toBeNull();
  },
};

export const MaxEqualToCountShowsAll: Story = {
  tags: ['!dev', '!autodocs'],
  args: { avatars: INITIALS.slice(0, 4) },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('img')).toHaveLength(4);
    await expect(canvas.queryByText(/^\+\d/)).toBeNull();
  },
};

export const ChildrenCollapseToo: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <AvatarGroup {...args} max={2} size="sm">
      <Avatar name="Ana Costa" status="online" />
      <Avatar name="Mei Tanaka" />
      <Avatar name="Aiden Park" />
    </AvatarGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Ana Costa, online' })).toBeInTheDocument();
    await expect(canvas.queryByRole('img', { name: 'Aiden Park' })).toBeNull();
    await expect(canvas.getByRole('img', { name: '1 more person' })).toBeInTheDocument();
  },
};

export const SizeAppliesToEveryAvatar: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <AvatarGroup {...args} size="lg" max={9}>
      <Avatar name="Ana Costa" size="xs" />
      <Avatar name="Mei Tanaka" />
    </AvatarGroup>
  ),
  play: async ({ canvas }) => {
    for (const img of canvas.getAllByRole('img')) {
      await expect(img.getBoundingClientRect().width).toBe(48);
    }
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

export const OverlapAndSurfaceRing: Story = {
  tags: ['!dev', '!autodocs'],
  args: { avatars: INITIALS, max: 2, size: 'lg' },
  play: async ({ canvas }) => {
    const [first, second, more] = canvas.getAllByRole('img');
    const gap = second!.getBoundingClientRect().left - first!.getBoundingClientRect().right;
    // About a quarter of 48px.
    await expect(gap).toBeCloseTo(-12, 0);
    const ring = getComputedStyle(more!.parentElement!).boxShadow;
    await expect(ring).toContain(surfaceColor());
  },
};

export const OverflowIsNeutral: Story = {
  tags: ['!dev', '!autodocs'],
  args: { avatars: INITIALS, max: 2 },
  play: async ({ canvas }) => {
    const [person, , more] = canvas.getAllByRole('img');
    // Not the accent tint of the people.
    await expect(getComputedStyle(more!).backgroundColor).not.toBe(
      getComputedStyle(person!).backgroundColor
    );
  },
};

export const OverflowClickReportsHidden: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => {
    const [hidden, setHidden] = useState(0);
    const ref = useRef<HTMLButtonElement>(null);
    return (
      <div>
        <AvatarGroup {...args} avatars={INITIALS} max={3} ref={ref} onOverflowClick={setHidden} />
        <output data-testid="hidden">{hidden}</output>
        <button type="button" onClick={() => ref.current?.focus()}>
          Focus overflow
        </button>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Focus overflow' }));
    // The ref reaches the "+N" button.
    const more = canvas.getByRole('button', { name: '4 more people' });
    await expect(more).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByTestId('hidden')).toHaveTextContent('4');
    await expect(canvas.queryByRole('img', { name: '4 more people' })).toBeNull();
  },
};

export const CustomOverflowReplacesTheCount: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    avatars: INITIALS,
    max: 5,
    renderOverflow: (hidden) => <button type="button">All {hidden}</button>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'All 2' })).toBeInTheDocument();
    await expect(canvas.queryByRole('img', { name: '2 more people' })).toBeNull();
  },
};
