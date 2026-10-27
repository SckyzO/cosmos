import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
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

const SHAPES = ['circle', 'rounded', 'square'] as const;
const RINGS = ['brand', 'success', 'warning', 'danger'] as const;

export const Shapes: Story = {
  render: (args) => (
    <Wrap>
      <SectionCard title="circle, rounded and square">
        <div className="flex flex-col gap-4">
          {SHAPES.map((shape) => (
            <AvatarGroup
              key={shape}
              {...args}
              avatars={PEOPLE.map((person) => ({ ...person, shape }))}
              max={4}
            />
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Rings: Story = {
  render: (args) => (
    <Wrap>
      <SectionCard title="A ring on each avatar, over the surface ring">
        <div className="flex flex-col gap-6">
          {SHAPES.map((shape) => (
            <AvatarGroup key={shape} {...args} size="lg" max={4}>
              {RINGS.map((ring, i) => (
                <Avatar key={ring} shape={shape} ring={ring} name={NAMES[i]} />
              ))}
              <Avatar shape={shape} name={NAMES[4]} />
            </AvatarGroup>
          ))}
        </div>
      </SectionCard>
    </Wrap>
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

const radiusOf = (el: Element) => getComputedStyle(el).borderTopLeftRadius;

export const SlotsAndOverflowFollowTheShape: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="flex flex-col gap-4">
      {/* No `shape`: the group looks as it always did. */}
      <div data-case="default">
        <AvatarGroup {...args} avatars={INITIALS} max={3} />
      </div>
      {SHAPES.map((shape) => (
        <div key={shape} data-case={shape}>
          <AvatarGroup
            {...args}
            avatars={INITIALS.map((person) => ({ ...person, shape }))}
            max={3}
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const RADIUS = { default: null, circle: null, rounded: '8px', square: '6px' } as const;
    for (const name of ['default', ...SHAPES] as const) {
      // Three avatars and the "+4": each has the radius of its shape, and so has the slot that
      // carries the surface ring around it.
      const items = canvasElement.querySelectorAll(`[data-case="${name}"] [role="img"]`);
      await expect(items).toHaveLength(4);
      for (const item of items) {
        for (const el of [item, item.parentElement!]) {
          const expected = RADIUS[name];
          if (expected === null) await expect(parseFloat(radiusOf(el)), name).toBeGreaterThan(20);
          else await expect(radiusOf(el), name).toBe(expected);
        }
      }
    }
  },
};

export const RingedAvatarsKeepTheSurfaceRing: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div data-testid="group">
      <AvatarGroup {...args} size="lg" max={9}>
        <Avatar name="Ana Costa" ring="success" shape="rounded" />
        <Avatar name="Mei Tanaka" ring="warning" shape="rounded" />
        <Avatar name="Aiden Park" ring="danger" shape="rounded" />
      </AvatarGroup>
    </div>
  ),
  play: async ({ canvas }) => {
    const surface = surfaceColor();
    for (const avatar of within(canvas.getByTestId('group')).getAllByRole('img')) {
      const slot = avatar.parentElement!;
      // The slot keeps its ring of the surface color, and the avatar adds its own over it.
      await expect(getComputedStyle(slot).boxShadow).toContain(`${surface} 0px 0px 0px 2px`);
      await expect(getComputedStyle(avatar).boxShadow).toContain(`${surface} 0px 0px 0px 2px`);
      await expect(getComputedStyle(avatar).boxShadow).toContain('0px 0px 0px 4px');
      // Neither ring changes the slot's size: the overlap stays what the spacing says.
      await expect(slot.getBoundingClientRect().width).toBe(avatar.getBoundingClientRect().width);
    }
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

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
// Two initials of the usual widths. The "MI" is the one Kanban's xs cards cut ("MI(").
const PAIRS = [
  { name: 'Mei Ito' },
  { name: 'Ana Costa' },
  { name: 'Olivier Dubois' },
  { name: 'Marcus Bell' },
];

/** Two initials stay whole: the next avatar and its ring stop short of them, at every size. */
export const InitialsClearTheNextAvatar: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-col gap-4">
      {SIZES.flatMap((size) =>
        (['normal', 'tight'] as const).map((spacing) => (
          <AvatarGroup
            key={`${size} ${spacing}`}
            aria-label={`${size} ${spacing}`}
            avatars={PAIRS}
            size={size}
            spacing={spacing}
          />
        ))
      )}
    </div>
  ),
  play: async ({ canvas }) => {
    await document.fonts.ready;
    const covered: string[] = [];
    for (const group of canvas.getAllByRole('group')) {
      const avatars = within(group).getAllByRole('img');
      avatars.slice(0, -1).forEach((avatar, i) => {
        const initials = avatar.querySelector('span') as HTMLElement;
        // The ring is 2px of surface colour around the next avatar, over this one.
        const free = avatars[i + 1]!.getBoundingClientRect().left - 2;
        const right = initials.getBoundingClientRect().right;
        // Half a pixel is antialiasing, not a cut letter.
        if (right - free > 0.5) {
          covered.push(`${group.getAttribute('aria-label')}: ${(right - free).toFixed(1)}px`);
        }
      });
    }
    await expect(covered).toEqual([]);
  },
};
