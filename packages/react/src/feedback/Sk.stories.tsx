import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Server } from 'lucide-react';
import { BarList } from '../data/BarList';
import { KpiCard } from '../data/KpiCard';
import { LoadToggle } from '../storybook-arrival';
import { loopStops } from '../storybook-motion';
import { SectionCard } from '../templates/SectionCard';
import { Sk, SkeletonAvatarText, SkeletonList, SkeletonTable, SkeletonText } from './Skeleton';

const meta = {
  title: 'Feedback/Skeleton',
  component: Sk,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Sk>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primitive: Story = {
  render: () => (
    <div className="space-y-2">
      <Sk h="h-5" w="w-3/4" />
      <Sk h="h-4" />
      <Sk h="h-4" w="w-5/6" />
    </div>
  ),
};

export const TextParagraph: Story = {
  name: 'SkeletonText',
  render: () => <SkeletonText lines={4} />,
};

export const Table: Story = {
  name: 'SkeletonTable',
  render: () => <SkeletonTable rows={3} cols={4} />,
};

export const List: Story = {
  name: 'SkeletonList',
  render: () => (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <SkeletonList rows={3} />
    </div>
  ),
};

export const AvatarText: Story = {
  name: 'SkeletonAvatarText',
  render: () => (
    <div className="max-w-sm space-y-4">
      <SkeletonAvatarText />
      <SkeletonAvatarText lines={3} />
    </div>
  ),
};

/** The loading region carries `aria-busy`; the skeleton itself is silent. */
export const BusyRegion: Story = {
  tags: ['!dev'],
  render: () => (
    <section aria-label="Comments" aria-busy="true" className="max-w-sm space-y-4">
      <p role="status" className="sr-only">
        Loading comments…
      </p>
      <SkeletonAvatarText />
      <SkeletonAvatarText />
    </section>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'Comments' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading comments…');
  },
};

/** The pulse is a decorative loop: it runs, and stops under reduced motion. */
export const PulseStopsUnderReducedMotion: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <Sk />
      <SkeletonList rows={1} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const pulses = canvasElement.querySelectorAll('.animate-pulse');
    // The primitive, and the list's own wrapper.
    await expect(pulses.length).toBeGreaterThanOrEqual(2);
    for (const pulse of pulses) {
      await expect(loopStops(pulse)).toMatchObject({ running: 'pulse', reduced: 'none' });
    }
  },
};

const PAGES = [
  { id: 'home', label: 'Home', value: 12480 },
  { id: 'pricing', label: 'Pricing', value: 8230 },
  { id: 'docs', label: 'Documentation', value: 6410 },
];

/**
 * The content fades in when the data arrives, over `--cosmos-motion-base`, instead of replacing the
 * skeleton at once: `KpiCard`, `BarList`, `SectionCard` and `KanbanBoard` do it on their `loading`
 * prop. Content that is there from the first render does not fade. Press the button to load and
 * reload.
 */
export const ContentFadesIn: Story = {
  tags: ['!autodocs'],
  parameters: { settleMotion: false },
  render: () => (
    <LoadToggle>
      {(loading) => (
        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <KpiCard label="Sessions" value="84 210" icon={Server} loading={loading} />
          <SectionCard title="Top pages" loading={loading} minBodyHeight="min-h-32">
            <BarList items={PAGES} aria-label="Top pages" />
          </SectionCard>
        </div>
      )}
    </LoadToggle>
  ),
};
