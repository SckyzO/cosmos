import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { placeholderCover } from '../storybook-avatars';
import {
  expectFocusRing,
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { Carousel } from './Carousel';

const meta = {
  title: 'Media/Carousel',
  component: Carousel,
  parameters: portalDocsParams.sm(),
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
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

const PHOTOS = Array.from({ length: 8 }, (_, i) => placeholderCover(`Photo ${i + 1}`, 320, 224));

const Gallery = ({ count = PHOTOS.length }: { count?: number }) => (
  <Carousel>
    <Carousel.Viewport>
      {PHOTOS.slice(0, count).map((src, i) => (
        <Carousel.Slide key={i}>
          <img src={src} alt={`Product photo ${i + 1}`} className="h-48 w-full rounded-xl" />
        </Carousel.Slide>
      ))}
    </Carousel.Viewport>
    <Carousel.Controls />
    <Carousel.Thumbnails>
      {PHOTOS.slice(0, count).map((src, i) => (
        <img key={i} src={src} alt="" />
      ))}
    </Carousel.Thumbnails>
  </Carousel>
);

/** A gallery: the strip under the slides jumps to a slide and follows the current one. */
export const WithThumbnails: Story = { render: () => <Gallery count={5} /> };

/** More thumbnails than fit: the strip scrolls sideways and keeps the current one in view. */
export const ThumbnailsOverflowing: Story = {
  globals: mobileViewport,
  render: () => <Gallery />,
  play: async ({ canvas }) => {
    const strip = await canvas.findByRole('group', { name: 'Slide thumbnails' });
    await expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);
    expectNoHorizontalOverflow();
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const NextButtonAdvances: Story = {
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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

const arrowsStory = (theme: string): Story => ({
  tags: ['!dev', '!autodocs'],
  globals: { theme },
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
    </Carousel>
  ),
  play: async ({ canvas }) => {
    const next = canvas.getByRole('button', { name: /next slide/i });
    const style = getComputedStyle(next);
    // A scrim and white glyphs (the theme's white), the same in every theme.
    await expect(next).toHaveClass('bg-black/40', 'text-white');
    await expect(style.backgroundColor).toMatch(/0\.4\)$/);
    // Inset from the slide edge.
    const root = next.parentElement!.getBoundingClientRect();
    await expect(root.right - next.getBoundingClientRect().right).toBeGreaterThanOrEqual(12);
  },
});

/** The arrows over a slide are a dark scrim with white glyphs and sit off the edge, in any theme. */
export const OverlayArrowsInLight: Story = arrowsStory('light');
export const OverlayArrowsInDark: Story = arrowsStory('dark');
export const OverlayArrowsInSand: Story = arrowsStory('sand');

export const DotsHaveA24pxTarget: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {Array.from({ length: 3 }).map((_, i) => (
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
    for (const dot of dots) {
      const box = dot.getBoundingClientRect();
      await expect(box.height).toBeGreaterThanOrEqual(24);
      await expect(box.width).toBeGreaterThanOrEqual(24);
      // The visible dot stays small.
      await expect(dot.firstElementChild!.getBoundingClientRect().height).toBeLessThanOrEqual(8);
    }
  },
};

export const ThumbnailClickJumps: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Gallery count={5} />,
  play: async ({ canvas }) => {
    const strip = await canvas.findByRole('group', { name: 'Slide thumbnails' });
    const thumbs = within(strip).getAllByRole('button', { name: /go to slide/i });
    await expect(thumbs).toHaveLength(5);
    await expect(thumbs[0]).toHaveAttribute('aria-current', 'true');
    await expect(thumbs[3]).toHaveAttribute('aria-current', 'false');
    await userEvent.click(thumbs[3]!);
    await waitFor(() => expect(thumbs[3]).toHaveAttribute('aria-current', 'true'));
    await expect(thumbs[0]).toHaveAttribute('aria-current', 'false');
    // The thumbnail is dimmed until current: the current one carries the accent ring.
    await expect(thumbs[3]).toHaveClass('ring-brand-500');
    await expect(thumbs[0]).not.toHaveClass('ring-brand-500');
    // The arrows move the thumbnails' selection too.
    await userEvent.click(canvas.getByRole('button', { name: /next slide/i }));
    await waitFor(() => expect(thumbs[4]).toHaveAttribute('aria-current', 'true'));
  },
};

export const ThumbnailsFollowTheCurrentSlide: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => <Gallery />,
  play: async ({ canvas }) => {
    const strip = await canvas.findByRole('group', { name: 'Slide thumbnails' });
    const thumbs = within(strip).getAllByRole('button', { name: /go to slide/i });
    await expect(strip.scrollLeft).toBe(0);
    await userEvent.click(thumbs[1]!);
    for (let i = 2; i < thumbs.length; i += 1)
      await userEvent.click(canvas.getByRole('button', { name: /next slide/i }));
    await waitFor(() => expect(thumbs[7]).toHaveAttribute('aria-current', 'true'));
    // The last thumbnail was off the right edge: the strip scrolled to bring it into view.
    await waitFor(() => {
      const strip_ = strip.getBoundingClientRect();
      const last = thumbs[7]!.getBoundingClientRect();
      expect(last.right).toBeLessThanOrEqual(strip_.right + 1);
    });
    await expect(strip.scrollLeft).toBeGreaterThan(0);
  },
};

export const ThumbnailFocusRing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Gallery count={4} />,
  play: async ({ canvas }) => {
    const strip = await canvas.findByRole('group', { name: 'Slide thumbnails' });
    await expectFocusRing(within(strip).getAllByRole('button')[1]!);
  },
};
