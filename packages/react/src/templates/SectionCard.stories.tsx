import type { Meta, StoryObj } from '@storybook/react-vite';
import { KeyRound, Lock, Server, Trash2, User, Users, Zap } from 'lucide-react';
import { SectionCard, type SectionCardIconTone } from './SectionCard';

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
