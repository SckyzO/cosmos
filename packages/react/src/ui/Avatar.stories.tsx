import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Avatar } from './Avatar';
import { placeholderAvatar } from '../storybook-avatars';
import { expectGraphicContrast, inEachTheme } from '../storybook-helpers';
import { SectionCard } from '../templates/SectionCard';
import type { Intent } from './intent';

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

const SHAPES = ['circle', 'rounded', 'square'] as const;
const RINGS = ['brand', 'success', 'warning', 'danger'] as const;
const INTENTS = [
  'neutral',
  'brand',
  'info',
  'success',
  'warning',
  'danger',
] as const satisfies readonly Intent[];
const PHOTO = placeholderAvatar('Ana Costa', 96);

const Caption = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs text-gray-500 dark:text-gray-400">{children}</span>
);

export const Shapes: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="circle, rounded and square">
        <div className="flex flex-wrap items-end gap-10">
          {SHAPES.map((shape) => (
            <div key={shape} className="flex flex-col items-center gap-2">
              <div className="flex items-end gap-3">
                <Avatar shape={shape} size="sm" name="Ana Costa" />
                <Avatar shape={shape} size="lg" name="Ana Costa" />
                <Avatar shape={shape} size="lg" name="Ana Costa" src={PHOTO} />
                <Avatar shape={shape} size="3xl" name="Ana Costa" status="online" />
              </div>
              <Caption>{shape}</Caption>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Rings: Story = {
  render: () => (
    <Wrap>
      <div className="flex flex-col gap-4">
        <SectionCard title="Initials">
          <div className="flex flex-wrap items-center gap-8">
            {RINGS.map((ring) => (
              <div key={ring} className="flex flex-col items-center gap-3">
                <Avatar ring={ring} size="lg" name="Ana Costa" />
                <Caption>{ring}</Caption>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Image">
          <div className="flex flex-wrap items-center gap-8">
            {RINGS.map((ring) => (
              <div key={ring} className="flex flex-col items-center gap-3">
                <Avatar ring={ring} size="lg" name="Ana Costa" src={PHOTO} />
                <Caption>{ring}</Caption>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};

export const Intents: Story = {
  render: () => (
    <Wrap>
      <div className="flex flex-col gap-4">
        <SectionCard title="Initials">
          <div className="flex flex-wrap items-center gap-6">
            {INTENTS.map((intent) => (
              <div key={intent} className="flex flex-col items-center gap-2">
                <Avatar intent={intent} size="lg" name="Ana Costa" />
                <Caption>{intent}</Caption>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Over an image, the intent changes nothing">
          <div className="flex flex-wrap items-center gap-6">
            {INTENTS.map((intent) => (
              <div key={intent} className="flex flex-col items-center gap-2">
                <Avatar intent={intent} size="lg" name="Ana Costa" src={PHOTO} />
                <Caption>{intent}</Caption>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};

export const Combination: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="shape, ring, intent and status together">
        <div className="flex flex-wrap items-center gap-8">
          <Avatar
            shape="rounded"
            ring="success"
            intent="success"
            size="xl"
            name="Ana Costa"
            status="online"
          />
          <Avatar
            shape="square"
            ring="danger"
            intent="danger"
            size="xl"
            name="Marcus Bell"
            status="busy"
          />
          <Avatar
            shape="rounded"
            ring="warning"
            intent="warning"
            size="xl"
            name="Priya Singh"
            status="away"
          />
          <Avatar
            shape="square"
            ring="brand"
            size="xl"
            name="Ana Costa"
            src={PHOTO}
            status="online"
          />
        </div>
      </SectionCard>
    </Wrap>
  ),
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

// A color as the browser resolves it, to compare with a ring (a box-shadow) or with text.
const colorOf = (value: string) => {
  const probe = document.createElement('div');
  probe.style.color = value;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

// The surface color, as the ring's gap shows it.
const surfaceColor = () => colorOf('var(--color-bg-panel)');

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

// ── Shape, ring and intent ───────────────────────────────────────────────────

// The avatar's own box inside `[data-case]`: the only element with an explicit `role="img"`.
const boxIn = (root: HTMLElement, selector: string) =>
  root.querySelector<HTMLElement>(`${selector} [role="img"]`)!;

export const NoPropRendersAsToday: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-center gap-4">
      <div data-case="default">
        <Avatar name="Ana Costa" />
      </div>
      <div data-case="explicit">
        <Avatar name="Ana Costa" shape="circle" intent="brand" />
      </div>
      <div data-case="photo">
        <Avatar name="Ana Costa" src={PHOTO} />
      </div>
      {/* The classes the avatar carried before `shape`, `ring` and `intent`. */}
      <span
        data-case="today"
        className="bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
      >
        AC
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const today = getComputedStyle(canvasElement.querySelector('[data-case="today"]')!);
    for (const name of ['default', 'explicit', 'photo']) {
      const style = getComputedStyle(boxIn(canvasElement, `[data-case="${name}"]`));
      for (const property of [
        'color',
        'backgroundColor',
        'borderTopLeftRadius',
        'width',
        'height',
      ] as const) {
        await expect(style[property], `${name} ${property}`).toBe(today[property]);
      }
      // No ring: the box has no shadow of its own.
      await expect(style.boxShadow).toBe('none');
    }
    const image = boxIn(canvasElement, '[data-case="photo"]').querySelector('img')!;
    await expect(getComputedStyle(image).borderTopLeftRadius).toBe(today.borderTopLeftRadius);
  },
};

// The token each ring reads, as the theme names it.
const RING_TOKEN = {
  brand: '--color-brand-500',
  success: '--color-green-600',
  warning: '--color-amber-600',
  danger: '--color-red-500',
} as const;

export const RingShowsOverAnImage: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div
      data-testid="surface"
      className="flex gap-6 bg-[var(--color-bg-panel)] p-6 text-[var(--color-text-base)]"
    >
      {RINGS.map((ring) => (
        <div key={ring} data-case={ring}>
          <Avatar ring={ring} name="Ana Costa" src={PHOTO} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement, canvas }) => {
    for (const ring of RINGS) {
      const box = boxIn(canvasElement, `[data-case="${ring}"]`);
      await expect(box.querySelector('img')).not.toBeNull();
      const shadow = getComputedStyle(box).boxShadow;
      // The gap is 2px of the surface color, and the ring 2px past it.
      await expect(shadow, ring).toContain(`${surfaceColor()} 0px 0px 0px 2px`);
      await expect(shadow, ring).toContain(
        `${colorOf(`var(${RING_TOKEN[ring]})`)} 0px 0px 0px 4px`
      );
      // The ring paints outside the box: the avatar keeps its size.
      await expect(box.getBoundingClientRect().width).toBe(40);
    }
    // WCAG 1.4.11: each ring holds 3:1 against the surface in every theme.
    const surface = canvas.getByTestId('surface');
    inEachTheme(() => {
      for (const ring of RINGS) {
        const probe = document.createElement('span');
        probe.style.color = `var(${RING_TOKEN[ring]})`;
        surface.append(probe);
        try {
          expectGraphicContrast(probe, 'color');
        } catch (error) {
          throw new Error(`${ring} ring: ${(error as Error).message}`, { cause: error });
        } finally {
          probe.remove();
        }
      }
    });
  },
};

export const ShapeSetsTheRadiusOfBoxAndImage: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-col gap-3">
      {SHAPES.map((shape) => (
        <div key={shape} data-case={shape} className="flex gap-3">
          <Avatar shape={shape} name="Ana Costa" />
          <Avatar shape={shape} name="Ana Costa" src={PHOTO} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const RADIUS = { circle: null, rounded: '8px', square: '6px' } as const;
    for (const shape of SHAPES) {
      const [initials, photo] = canvasElement.querySelectorAll<HTMLElement>(
        `[data-case="${shape}"] [role="img"]`
      );
      const radii = [initials!, photo!, photo!.querySelector('img')!].map(
        (el) => getComputedStyle(el).borderTopLeftRadius
      );
      for (const radius of radii) {
        const expected = RADIUS[shape];
        // A circle is rounded past half the 40px box; the others have the radius of their name.
        if (expected === null) await expect(parseFloat(radius), shape).toBeGreaterThanOrEqual(20);
        else await expect(radius, shape).toBe(expected);
      }
    }
  },
};

// The palette each intent reads: brand is the accent, the rest are Tailwind's.
const INTENT_PALETTE = {
  neutral: 'gray',
  brand: 'brand',
  info: 'blue',
  success: 'green',
  warning: 'amber',
  danger: 'red',
} as const satisfies Record<Intent, string>;

export const IntentTintsInitialsOnly: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {INTENTS.map((intent) => (
        <div key={intent} data-case={intent}>
          <Avatar intent={intent} name="Ana Costa" />
        </div>
      ))}
      <div data-case="photo">
        <Avatar name="Ana Costa" src={PHOTO} />
      </div>
      <div data-case="photo-danger">
        <Avatar intent="danger" name="Ana Costa" src={PHOTO} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // -700 in light and sand, -300 in dark and deep-blue; `brand` keeps its -600 in light.
    inEachTheme(() => {
      const dark = document.documentElement.matches('.dark, .deep-blue');
      for (const intent of INTENTS) {
        const shade = dark ? 300 : intent === 'brand' ? 600 : 700;
        const box = boxIn(canvasElement, `[data-case="${intent}"]`);
        expect(getComputedStyle(box).color, intent).toBe(
          colorOf(`var(--color-${INTENT_PALETTE[intent]}-${shade})`)
        );
      }
    });
    // Over an image the intent changes nothing: no initials, the same box.
    const plain = boxIn(canvasElement, '[data-case="photo"]');
    const danger = boxIn(canvasElement, '[data-case="photo-danger"]');
    await expect(danger.querySelector('img')).not.toBeNull();
    await expect(danger.textContent).toBe('');
    await expect(getComputedStyle(danger).backgroundColor).toBe(
      getComputedStyle(plain).backgroundColor
    );
  },
};
