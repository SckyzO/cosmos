import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check } from 'lucide-react';
import { expect } from 'storybook/test';
import { KpiCard } from '../data/KpiCard';
import { COSMOS_ACCENTS } from '../settings/appearance';
import {
  expectNoHorizontalOverflow,
  expectStrokeContrast,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import type { ProgressBarIntent } from './ProgressBar';
import { ProgressRing, type ProgressRingSize } from './ProgressRing';
import { SectionLabel } from './SectionLabel';

const meta = {
  title: 'Feedback/Progress Ring',
  component: ProgressRing,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 64, 'aria-label': 'Goal progress', children: '64%' },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

const INTENTS: ProgressBarIntent[] = ['neutral', 'brand', 'success', 'warning', 'danger'];

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      {(['sm', 'md', 'lg'] as ProgressRingSize[]).map((s) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <ProgressRing size={s} value={64} aria-label={`Size ${s}`}>
            {s === 'sm' ? null : '64%'}
          </ProgressRing>
          <SectionLabel>{s}</SectionLabel>
        </div>
      ))}
    </div>
  ),
};

export const Intents: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      {INTENTS.map((i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <ProgressRing intent={i} value={72} aria-label={`${i} progress`}>
            72%
          </ProgressRing>
          <SectionLabel>{i}</SectionLabel>
        </div>
      ))}
    </div>
  ),
};

export const CentreContent: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <ProgressRing size="lg" value={64} aria-label="Goal" intent="brand">
        64%
      </ProgressRing>
      <ProgressRing value={100} intent="success" aria-label="Done">
        <Check aria-hidden="true" className="size-5 text-green-600 dark:text-green-400" />
      </ProgressRing>
      <ProgressRing value={45} size={72} thickness={8} aria-label="Lessons">
        <span className="text-center text-xs leading-tight">
          9<span className="text-2xs block font-medium text-[var(--color-text-muted)]">of 20</span>
        </span>
      </ProgressRing>
      <ProgressRing size="sm" value={45} aria-label="No centre" />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: { indeterminate: true, children: null, 'aria-label': 'Loading' },
  play: async ({ canvas }) => {
    const ring = canvas.getByRole('progressbar');
    await expect(ring).toHaveAttribute('aria-busy', 'true');
    await expect(ring).not.toHaveAttribute('aria-valuenow');
  },
};

export const InKpiCard: Story = {
  render: () => (
    <div className="max-w-xs">
      <KpiCard
        label="Course progress"
        value="17 of 25 lessons"
        chart={
          <ProgressRing size={64} value={68} aria-label="Course progress" thickness={6}>
            68%
          </ProgressRing>
        }
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Course progress' })).toHaveAttribute(
      'aria-valuenow',
      '68'
    );
  },
};

export const OnNarrowScreen: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {INTENTS.map((i) => (
        <ProgressRing key={i} intent={i} value={72} aria-label={`${i} progress`}>
          72%
        </ProgressRing>
      ))}
    </div>
  ),
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RoleProgressbar: Story = {
  tags: ['!dev'],
  args: { value: 1.2, max: 5, children: '24%' },
  play: async ({ canvas }) => {
    const ring = canvas.getByRole('progressbar');
    await expect(ring).toHaveAttribute('aria-valuenow', '24');
    await expect(ring).toHaveAttribute('aria-valuemin', '0');
    await expect(ring).toHaveAttribute('aria-valuemax', '100');
    await expect(ring).toHaveAccessibleName('Goal progress');
  },
};

export const ClampsOutOfRange: Story = {
  tags: ['!dev'],
  render: () => (
    <div className="flex gap-4">
      <ProgressRing value={250} aria-label="Over" />
      <ProgressRing value={-10} aria-label="Under" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Over' })).toHaveAttribute(
      'aria-valuenow',
      '100'
    );
    const under = canvas.getByRole('progressbar', { name: 'Under' });
    await expect(under).toHaveAttribute('aria-valuenow', '0');
    // Nothing to draw at 0: a round cap would leave a dot.
    await expect(under.querySelector('[data-ring="arc"]')).toBeNull();
  },
};

export const DrawsTheShareOfTheCircle: Story = {
  tags: ['!dev'],
  args: { value: 25, size: 'md', children: null },
  play: async ({ canvas }) => {
    const ring = canvas.getByRole('progressbar');
    const arc = ring.querySelector<SVGCircleElement>('[data-ring="arc"]')!;
    const circumference = 2 * Math.PI * Number(arc.getAttribute('r'));
    await expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(
      circumference * 0.75,
      3
    );
    await expect(ring.getBoundingClientRect().width).toBe(56);
  },
};

export const CentreIsNotReadTwice: Story = {
  tags: ['!dev'],
  play: async ({ canvas }) => {
    // The percentage in the centre is inside the progressbar: its name and value
    // are the ring's, and the SVG is hidden.
    const ring = canvas.getByRole('progressbar');
    await expect(ring.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(ring).toHaveAccessibleName('Goal progress');
    await expect(canvas.getAllByRole('progressbar')).toHaveLength(1);
  },
};

/** The arc against its track, in the four themes and every accent. */
export const ContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-4">
      {INTENTS.map((i) => (
        <ProgressRing key={i} intent={i} value={60} aria-label={`${i} progress`} />
      ))}
      <ProgressRing indeterminate aria-label="Loading" />
    </div>
  ),
  play: async ({ canvas }) => {
    const root = document.documentElement;
    const saved = root.getAttribute('data-accent');
    try {
      for (const { id } of COSMOS_ACCENTS) {
        root.setAttribute('data-accent', id);
        inEachTheme(() => {
          for (const ring of canvas.getAllByRole('progressbar')) {
            const arc = ring.querySelector('[data-ring="arc"]')!;
            const track = ring.querySelector('[data-ring="track"]')!;
            try {
              expectStrokeContrast(arc, track);
            } catch (error) {
              throw new Error(
                `[${id}] ${ring.getAttribute('aria-label')}: ${(error as Error).message}`,
                {
                  cause: error,
                }
              );
            }
          }
        });
      }
    } finally {
      if (saved === null) root.removeAttribute('data-accent');
      else root.setAttribute('data-accent', saved);
    }
  },
};
