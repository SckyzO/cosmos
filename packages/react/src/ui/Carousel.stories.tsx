import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { Carousel } from './Carousel';

const meta = {
  title: 'Overlays/Carousel',
  component: Carousel,
  parameters: portalDocsParams.sm(),
  tags: ['autodocs'],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_COLORS = [
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500',
  'from-amber-500 to-yellow-500',
];

const Slide = ({ index, label }: { index: number; label?: string }) => (
  <div
    className={`bg-gradient-to-br ${SAMPLE_COLORS[index % SAMPLE_COLORS.length]} flex h-48 items-center justify-center rounded-xl text-2xl font-bold text-white`}
  >
    {label ?? `Slide ${index + 1}`}
  </div>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const SlidesOnly: Story = {
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {Array.from({ length: 5 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
    </Carousel>
  ),
};

export const WithControls: Story = {
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {Array.from({ length: 5 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Controls />
    </Carousel>
  ),
};

export const WithIndicators: Story = {
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {Array.from({ length: 5 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Indicators />
    </Carousel>
  ),
};

export const WithBoth: Story = {
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {Array.from({ length: 5 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Controls />
      <Carousel.Indicators />
    </Carousel>
  ),
};

export const Loop: Story = {
  render: () => (
    <Carousel options={{ loop: true }}>
      <Carousel.Viewport>
        {Array.from({ length: 4 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} label={`Loops infinitely · ${i + 1}`} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Controls />
      <Carousel.Indicators />
    </Carousel>
  ),
};

export const Autoplay: Story = {
  render: () => (
    <Carousel options={{ loop: true }} autoplay={2500}>
      <Carousel.Viewport>
        {Array.from({ length: 4 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} label={`Auto · ${i + 1}`} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Indicators />
    </Carousel>
  ),
};

export const ControlsOutside: Story = {
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {Array.from({ length: 4 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Controls position="outside" />
      <Carousel.Indicators />
    </Carousel>
  ),
};

export const MultipleSlidesPerView: Story = {
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {Array.from({ length: 8 }).map((_, i) => (
          <Carousel.Slide key={i} basis="basis-1/3">
            <Slide index={i} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Controls />
    </Carousel>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const NextButtonAdvances: Story = {
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {Array.from({ length: 3 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Controls />
      <Carousel.Indicators />
    </Carousel>
  ),
  play: async ({ canvas }) => {
    const buttons = await canvas.findAllByRole('button', { name: /go to slide/i });
    await expect(buttons[0]).toHaveAttribute('aria-current', 'true');
    await userEvent.click(canvas.getByRole('button', { name: /next slide/i }));
    await waitFor(() => expect(buttons[1]).toHaveAttribute('aria-current', 'true'));
  },
};

export const IndicatorClickJumps: Story = {
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {Array.from({ length: 4 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Indicators />
    </Carousel>
  ),
  play: async ({ canvas }) => {
    const dots = await canvas.findAllByRole('button', { name: /go to slide/i });
    await userEvent.click(dots[2]);
    await waitFor(() => expect(dots[2]).toHaveAttribute('aria-current', 'true'));
  },
};
