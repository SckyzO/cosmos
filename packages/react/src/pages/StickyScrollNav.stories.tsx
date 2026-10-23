import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, spyOn, userEvent, waitFor } from 'storybook/test';
import { StickyScrollNav, type StickyScrollNavProps } from './StickyScrollNav';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Navigation/Sticky Scroll Nav',
  component: StickyScrollNav,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { sections: [] },
} satisfies Meta<typeof StickyScrollNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-6">
      <StickyScrollNav
        sections={[
          { id: 's1', label: 'Realtime' },
          { id: 's2', label: 'Line / Area' },
          { id: 's3', label: 'Donut' },
          { id: 's4', label: 'Treemap' },
        ]}
      />
      <div className="space-y-6 pt-6">
        {['s1', 's2', 's3', 's4'].map((id) => (
          <div key={id} id={id}>
            <SectionCard title={id.toUpperCase()}>
              <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800/50" />
            </SectionCard>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// Sections taller than the viewport, so each one has room to reach its top.
const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'alerts', label: 'Alerts' },
];

const LongPage = ({
  onNavigate,
  topOffset,
}: Pick<StickyScrollNavProps, 'onNavigate' | 'topOffset'>) => (
  <div className="bg-[var(--color-bg-base)] p-6">
    <StickyScrollNav sections={SECTIONS} onNavigate={onNavigate} topOffset={topOffset} />
    {SECTIONS.map(({ id, label }) => (
      <section key={id} id={id} aria-label={label} className="h-[120vh] pt-6">
        <h2 className="text-lg font-semibold">{label}</h2>
      </section>
    ))}
  </div>
);

const topOf = (el: HTMLElement) => el.getBoundingClientRect().top;

/** A button scrolls its section to the top of the page, by click or keyboard, and the nav stays put. */
export const ButtonScrollsToItsSection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LongPage topOffset={16} />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation');
    const metrics = canvas.getByRole('region', { name: 'Metrics' });
    const alerts = canvas.getByRole('region', { name: 'Alerts' });
    await expect(topOf(metrics)).toBeGreaterThan(window.innerHeight);

    // The scroll is smooth: wait for it to land.
    await userEvent.click(canvas.getByRole('button', { name: 'Metrics' }));
    await waitFor(() => expect(Math.abs(topOf(metrics))).toBeLessThan(1), { timeout: 3000 });
    // The nav stays pinned `topOffset` px from the top while the page scrolls.
    await expect(topOf(nav)).toBeCloseTo(16, 0);

    canvas.getByRole('button', { name: 'Alerts' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(Math.abs(topOf(alerts))).toBeLessThan(1), { timeout: 3000 });
    await expect(topOf(nav)).toBeCloseTo(16, 0);
  },
};

/** With `onNavigate`, the button hands over the section id and the page is not scrolled. */
export const OnNavigateReplacesTheScroll: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onNavigate: fn() },
  render: (args) => <LongPage onNavigate={args.onNavigate} />,
  play: async ({ args, canvas }) => {
    const scrollIntoView = spyOn(Element.prototype, 'scrollIntoView');
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Alerts' }));
      await expect(args.onNavigate).toHaveBeenCalledTimes(1);
      await expect(args.onNavigate).toHaveBeenCalledWith('alerts');
      await expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      scrollIntoView.mockRestore();
    }
  },
};
