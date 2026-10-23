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

// The scroll is smooth: wait until the top of the section sits on the bottom
// edge of the nav, then check that its heading is clear of the nav and on screen.
const expectLandedBelow = async (nav: HTMLElement, section: HTMLElement, heading: HTMLElement) => {
  await waitFor(
    () => expect(Math.abs(topOf(section) - nav.getBoundingClientRect().bottom)).toBeLessThan(1),
    { timeout: 3000 }
  );
  const navBottom = nav.getBoundingClientRect().bottom;
  await expect(topOf(heading)).toBeGreaterThanOrEqual(navBottom - 1);
  await expect(heading.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
};

/** A button scrolls its section just below the sticky nav, by click or keyboard, and the nav stays put. */
export const ButtonScrollsToItsSection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LongPage topOffset={16} />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation');
    const metrics = canvas.getByRole('region', { name: 'Metrics' });
    const alerts = canvas.getByRole('region', { name: 'Alerts' });
    await expect(topOf(metrics)).toBeGreaterThan(window.innerHeight);

    await userEvent.click(canvas.getByRole('button', { name: 'Metrics' }));
    await expectLandedBelow(nav, metrics, canvas.getByRole('heading', { name: 'Metrics' }));
    // The nav stays pinned `topOffset` px from the top while the page scrolls.
    await expect(topOf(nav)).toBeCloseTo(16, 0);

    canvas.getByRole('button', { name: 'Alerts' }).focus();
    await userEvent.keyboard('{Enter}');
    await expectLandedBelow(nav, alerts, canvas.getByRole('heading', { name: 'Alerts' }));
    await expect(topOf(nav)).toBeCloseTo(16, 0);
  },
};

/** In a scroll container of its own, the section lands below the nav too. */
export const ButtonScrollsInsideAScrollContainer: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="bg-[var(--color-bg-base)] p-6">
      <div className="h-[420px] overflow-y-auto rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <StickyScrollNav sections={SECTIONS} topOffset={8} />
        {SECTIONS.map(({ id, label }) => (
          <section key={id} id={id} aria-label={label} className="h-[600px] pt-6">
            <h2 className="text-lg font-semibold">{label}</h2>
          </section>
        ))}
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation');
    const alerts = canvas.getByRole('region', { name: 'Alerts' });
    const startTop = topOf(nav);

    await userEvent.click(canvas.getByRole('button', { name: 'Alerts' }));
    await expectLandedBelow(nav, alerts, canvas.getByRole('heading', { name: 'Alerts' }));
    // The nav sticks `topOffset` px below the top of the container, which it did not at the start.
    await expect(topOf(nav)).toBeLessThan(startTop);
    await expect(window.scrollY).toBe(0);
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
