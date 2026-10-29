import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { placeholderCover } from '../storybook-avatars';
import {
  bothDirections,
  directionBox,
  expectFocusRing,
  endOffset,
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
  startOffset,
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

export const IndicatorsInside: Story = {
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
      <Carousel.Indicators position="inside" />
    </Carousel>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`position="inside"` sets the dots at the bottom center of the slide, 12px from the edge, on a dark pill that keeps them readable over any image. Keep the default `outside` when `Carousel.Controls` is `outside` too: its row sits under the slide.',
      },
    },
  },
};

/** The worst background for white dots, a light picture: the pill is what they read against. */
export const IndicatorsInsideOnLightSlides: Story = {
  render: () => (
    <Carousel>
      <Carousel.Viewport>
        {['bg-white', 'bg-gray-100', 'bg-amber-100'].map((bg, i) => (
          <Carousel.Slide key={bg}>
            <div
              className={`${bg} flex h-48 items-center justify-center rounded-xl border border-gray-200 text-2xl font-bold text-gray-900`}
            >
              {`Light slide ${i + 1}`}
            </div>
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Indicators position="inside" />
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

const insideStory = (): Story => ({
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
      <Carousel.Controls />
      <Carousel.Indicators position="inside" />
      {/* What the pill and the dots are meant to be, drawn by plain elements with the palette classes. */}
      <span data-probe="pill" className="sr-only bg-black/50" />
      <span data-probe="active" className="sr-only bg-white" />
      <span data-probe="idle" className="sr-only bg-white/60" />
    </Carousel>
  ),
});

/** Inside, the dots sit on a dark pill at the bottom center of the slide and still jump to a slide. */
export const InsideIndicatorsKeepTheirBehaviour: Story = {
  ...insideStory(),
  play: async ({ canvas }) => {
    const dots = await canvas.findAllByRole('button', { name: /go to slide/i });
    await expect(dots).toHaveLength(4);
    await expect(dots[0]).toHaveAttribute('aria-current', 'true');
    for (const dot of dots) {
      const box = dot.getBoundingClientRect();
      await expect(box.height).toBeGreaterThanOrEqual(24);
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(dot.firstElementChild!.getBoundingClientRect().height).toBeLessThanOrEqual(8);
    }
    // On the slide: 12px from its bottom edge, centered.
    const pill = dots[0].parentElement!;
    const root = pill.parentElement!.getBoundingClientRect();
    const box = pill.getBoundingClientRect();
    await expect(root.bottom - box.bottom).toBeCloseTo(12, 0);
    await expect(box.left + box.width / 2).toBeCloseTo(root.left + root.width / 2, 0);
    await expect(box.top).toBeGreaterThan(root.top);
    // Clicking a dot goes to its slide, and the state moves with it.
    await userEvent.click(dots[2]);
    await waitFor(() => expect(dots[2]).toHaveAttribute('aria-current', 'true'));
    await expect(dots[0]).toHaveAttribute('aria-current', 'false');
  },
};

/** The pill is 50% black and the dots white: the active one solid, the others at 60%. */
export const InsideIndicatorsReadOnAPill: Story = {
  ...insideStory(),
  play: async ({ canvas }) => {
    const dots = await canvas.findAllByRole('button', { name: /go to slide/i });
    const color = (el: Element) => getComputedStyle(el).backgroundColor;
    const probe = (name: string) => color(document.querySelector(`[data-probe="${name}"]`)!);
    await expect(color(dots[0].parentElement!)).toBe(probe('pill'));
    await expect(color(dots[0].firstElementChild!)).toBe(probe('active'));
    await expect(color(dots[1].firstElementChild!)).toBe(probe('idle'));
    await expect(probe('idle')).not.toBe(probe('active'));
    // The active dot is the wide one.
    const width = (el: Element) => el.firstElementChild!.getBoundingClientRect().width;
    await expect(width(dots[0])).toBeGreaterThan(width(dots[1]));
  },
};

/** Without `position`, the dots stay under the slide, as before. */
export const IndicatorsStayOutsideByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Carousel>
      <Carousel.Viewport className="viewport">
        {Array.from({ length: 3 }).map((_, i) => (
          <Carousel.Slide key={i}>
            <Slide index={i} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Indicators />
    </Carousel>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dots = await canvas.findAllByRole('button', { name: /go to slide/i });
    const viewport = canvasElement.querySelector('.viewport')!.getBoundingClientRect();
    const box = dots[0].parentElement!.getBoundingClientRect();
    await expect(box.top - viewport.bottom).toBeCloseTo(12, 0);
    await expect(getComputedStyle(dots[0].parentElement!).position).toBe('static');
    await expect(getComputedStyle(dots[0].parentElement!).backgroundColor).toBe('rgba(0, 0, 0, 0)');
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
    // The last thumbnail was off the end edge: the strip scrolled to bring it into view (toward
    // the left in right to left, where `scrollLeft` counts down from 0).
    await waitFor(() => expect(endOffset(thumbs[7]!, strip)).toBeGreaterThanOrEqual(-1));
    await expect(Math.abs(strip.scrollLeft)).toBeGreaterThan(0);
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

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The slides run from the start of the line: the first slide is at the start, the next one comes
 * in from the end, the arrows are on their sides with their chevrons turned around, and the dots
 * stay centred.
 */
export const SlidesRunFromTheStartOfTheLine: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <Carousel>
        <Carousel.Viewport>
          {Array.from({ length: 3 }).map((_, i) => (
            <Carousel.Slide key={i}>
              <Slide index={i} />
            </Carousel.Slide>
          ))}
        </Carousel.Viewport>
        <Carousel.Controls />
        <Carousel.Indicators position="inside" />
      </Carousel>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const canvas = within(box);
      const previous = await canvas.findByRole('button', { name: /previous slide/i });
      const next = canvas.getByRole('button', { name: /next slide/i });
      expect(startOffset(previous, box), `${dir}: previous at the start`).toBeLessThan(
        startOffset(next, box)
      );
      expect(getComputedStyle(previous.querySelector('svg')!).scale, `${dir}: chevron`).toBe(
        dir === 'rtl' ? '-1 1' : 'none'
      );
      const first = canvas.getByText('Slide 1');
      const second = canvas.getByText('Slide 2');
      expect(startOffset(first, box), `${dir}: first slide at the start`).toBeLessThan(
        startOffset(second, box)
      );
      const dots = canvas.getAllByRole('button', { name: /go to slide/i });
      const pill = dots[0]!.parentElement!.getBoundingClientRect();
      const middle = box.getBoundingClientRect();
      expect(pill.left + pill.width / 2, `${dir}: dots centred`).toBeCloseTo(
        middle.left + middle.width / 2,
        0
      );
      await userEvent.click(next);
      await waitFor(() => expect(dots[1]).toHaveAttribute('aria-current', 'true'));
      // The second slide has slid to the start, the first one off toward it.
      await waitFor(() => expect(startOffset(second, box)).toBeLessThan(24));
      expect(startOffset(first, box), `${dir}: first slide left toward the start`).toBeLessThan(0);
    }
  },
};
