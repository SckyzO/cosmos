import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { KeyRound, Lock, Server, Trash2, User, Users, Zap } from 'lucide-react';
import { SectionCard, type SectionCardIconTone } from './SectionCard';
import { bothDirections, expectMirrored } from '../storybook-helpers';

const meta = {
  title: 'Layout/Section Card',
  component: SectionCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Title', children: null },
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Connection settings',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Servers',
    icon: Server,
    desc: 'Active fleet across 3 sites',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};

export const WithTone: Story = {
  args: {
    title: 'Account',
    icon: User,
    iconTone: 'blue',
    desc: 'Personal info and login details.',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};

const TONE_DEMOS: { tone: SectionCardIconTone; title: string; icon: typeof User }[] = [
  { tone: 'brand', title: 'Brand', icon: Zap },
  { tone: 'blue', title: 'Account', icon: User },
  { tone: 'violet', title: 'Username', icon: Users },
  { tone: 'green', title: 'Password', icon: KeyRound },
  { tone: 'amber', title: 'Storage', icon: Trash2 },
  { tone: 'red', title: 'Danger zone', icon: Lock },
  { tone: 'gray', title: 'Default tone', icon: Server },
];

export const ToneGallery: Story = {
  args: { title: '' },
  render: () => (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
      {TONE_DEMOS.map(({ tone, title, icon }) => (
        <SectionCard
          key={tone}
          title={title}
          icon={icon}
          iconTone={tone}
          desc={`iconTone="${tone}"`}
        >
          <p className="text-xs text-[var(--color-text-secondary)]">
            Section body — same shell, recolored icon affordance.
          </p>
        </SectionCard>
      ))}
    </div>
  ),
};

export const RawClassEscapeHatch: Story = {
  args: {
    title: 'Custom palette',
    icon: Server,
    iconColor: 'text-pink-600 dark:text-pink-400',
    iconBg: 'bg-pink-500/10 dark:bg-pink-500/20',
    desc: 'Pass `iconColor` + `iconBg` directly when `iconTone` presets do not fit.',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};

/** SectionCard is a Card with 24px padding: same radius, same padding as `Card padding="lg"`. */
export const IsACardWithLargePadding: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: 'Panel', children: <p>Body</p> },
  play: async ({ canvas }) => {
    const panel = canvas
      .getByRole('heading', { name: 'Panel' })
      .closest('.rounded-2xl') as HTMLElement;
    const style = getComputedStyle(panel);
    await expect(style.paddingLeft).toBe('24px');
    await expect(style.borderTopLeftRadius).toBe('16px');
    await expect(style.overflow).toBe('hidden');
  },
};

/** `as` picks the heading element of the title, `h3` by default. */
export const TitleHeadingLevel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <h1 className="sr-only">Page</h1>
      <SectionCard as="h2" title="Under the page heading">
        <p>Body</p>
      </SectionCard>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Under the page heading' })
    ).toBeVisible();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The icon tile leads the title, at the start edge of the card, in both directions. */
export const HeaderFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <SectionCard title="Servers" icon={Server} desc="Active fleet across 3 sites">
        <p>Body</p>
      </SectionCard>
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('svg'));
    expectMirrored(canvasElement, (box) => box.querySelector('h3'));
  },
};
