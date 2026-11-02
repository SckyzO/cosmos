import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { placeholderCover } from '../storybook-avatars';
import {
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  inDirection,
  inEachTheme,
  keyToEnd,
  keyToStart,
  mobileViewport,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { Button } from './Button';
import { Carousel } from './Carousel';
import { ImageGrid } from './ImageGrid';
import { Lightbox, type LightboxItem, type LightboxProps } from './Lightbox';
import { Modal } from './Modal';

const meta = {
  title: 'Media/Lightbox',
  component: Lightbox,
  // The viewer is a fixed overlay in a portal: the docs page gives each story a frame of its own.
  parameters: portalDocsParams.full(),
  tags: ['autodocs'],
  args: { items: [] as LightboxItem[], open: false, onOpenChange: fn() },
} satisfies Meta<typeof Lightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Pictures ─────────────────────────────────────────────────────────────────

// Large width × height, and the caption: portraits, landscapes, a square and a panorama. The
// pictures are local gradients (`placeholderCover`): no request leaves Storybook.
const SHAPES = [
  [1600, 1067, 'Linen table lamp, photographed at the end of the afternoon.'],
  [800, 1200, 'Bud vase in rose clay, fired at 1240 degrees.'],
  [1000, 1000, 'Speckled stoneware mug'],
  [1800, 700, ''],
  [1600, 1067, 'Walnut tray with a brass handle'],
  [800, 1200, ''],
  [1600, 1067, 'Indigo-dyed cushion cover'],
  [1000, 1000, 'Cork coaster set'],
  [1600, 1067, ''],
  [800, 1200, 'Hand-woven wool throw'],
  [1600, 1067, 'Oak stool, oiled'],
  [1800, 700, 'The studio shelf, spring collection'],
] as const;

type Photo = LightboxItem & { width: number; height: number };

const THUMB_WIDTH = 400;

const photo = (i: number): Photo => {
  const [width, height, caption] = SHAPES[i % SHAPES.length]!;
  const seed = `Studio ${i + 1}`;
  return {
    src: placeholderCover(seed, width, height),
    thumbSrc: placeholderCover(seed, THUMB_WIDTH, Math.round((THUMB_WIDTH * height) / width)),
    alt: `Studio photo ${i + 1}`,
    caption: caption || undefined,
    width: THUMB_WIDTH,
    height: Math.round((THUMB_WIDTH * height) / width),
  };
};

const PHOTOS = Array.from({ length: 12 }, (_, i) => photo(i));

// A picture that can't be decoded: the browser fires `error` for it at once, offline.
const BROKEN = 'data:image/png;base64,AAAA';

// A picture whose request never ends: the `src` is never handed to the element, so neither `load`
// nor `error` fires. React sets it twice, as an attribute when it creates the `<img>` and as a
// property when it mounts it, so both are held back. Undone when the story ends.
const NEVER_LOADS = 'https://pictures.example/never-loads.jpg';
const picturesThatNeverLoad = () => {
  const setAttribute = Element.prototype.setAttribute;
  const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
  Element.prototype.setAttribute = function (name: string, value: string) {
    if (name === 'src' && String(value) === NEVER_LOADS) return;
    return setAttribute.call(this, name, value);
  };
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    ...src,
    set(value: string) {
      if (String(value) !== NEVER_LOADS) src.set!.call(this, value);
    },
  });
  return () => {
    Element.prototype.setAttribute = setAttribute;
    Object.defineProperty(HTMLImageElement.prototype, 'src', src);
  };
};

// ── Demo pages ───────────────────────────────────────────────────────────────

type DemoProps = Partial<LightboxProps> & {
  startOpen?: boolean;
  startIndex?: number;
  /** The gallery behind the viewer: `PHOTOS` unless the story swaps some. */
  tiles?: Photo[];
};

// A gallery whose tiles open the viewer at their picture: the page owns `open` and `index`, the
// way an app wires `ImageGrid.Item onClick`.
const Gallery = ({
  startOpen = false,
  startIndex = 0,
  items = PHOTOS,
  tiles = PHOTOS,
  onOpenChange,
  onIndexChange,
  ...rest
}: DemoProps) => {
  const [open, setOpen] = useState(startOpen);
  const [index, setIndex] = useState(startIndex);
  return (
    <>
      <ImageGrid layout="masonry" columns={{ sm: 2, md: 3, lg: 4 }}>
        {tiles.map((tile, i) => (
          <ImageGrid.Item
            key={i}
            overlay="View"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
          >
            <img src={tile.thumbSrc} alt={tile.alt} width={tile.width} height={tile.height} />
          </ImageGrid.Item>
        ))}
      </ImageGrid>
      <Lightbox
        {...rest}
        items={items}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        index={index}
        onIndexChange={(next) => {
          setIndex(next);
          onIndexChange?.(next);
        }}
      />
    </>
  );
};

// One button instead of a gallery: for the stories that are about the viewer alone.
const Opener = ({
  startOpen = false,
  startIndex = 0,
  items = PHOTOS,
  onOpenChange,
  onIndexChange,
  ...rest
}: DemoProps) => {
  const [open, setOpen] = useState(startOpen);
  const [index, setIndex] = useState(startIndex);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open viewer</Button>
      <Lightbox
        {...rest}
        items={items}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        index={index}
        onIndexChange={(next) => {
          setIndex(next);
          onIndexChange?.(next);
        }}
      />
    </>
  );
};

// A product page: each slide of the carousel is a button that opens the viewer at its picture.
const ProductPage = ({ startOpen = false, startIndex = 0 }: DemoProps) => {
  const photos = PHOTOS.slice(0, 6);
  const [open, setOpen] = useState(startOpen);
  const [index, setIndex] = useState(startIndex);
  return (
    <div className="mx-auto max-w-md space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text-base)]">
        Speckled stoneware mug
      </h2>
      <Carousel>
        <Carousel.Viewport>
          {photos.map((item, i) => (
            <Carousel.Slide key={i}>
              <button
                type="button"
                aria-label={`View photo ${i + 1} full size`}
                onClick={() => {
                  setIndex(i);
                  setOpen(true);
                }}
                className="focus-visible:focus-indicator block w-full cursor-zoom-in overflow-hidden rounded-xl"
              >
                <img
                  src={item.thumbSrc}
                  alt={item.alt}
                  className="aspect-[5/4] w-full object-cover"
                />
              </button>
            </Carousel.Slide>
          ))}
        </Carousel.Viewport>
        <Carousel.Controls />
        <Carousel.Indicators />
      </Carousel>
      <Lightbox
        items={photos}
        open={open}
        onOpenChange={setOpen}
        index={index}
        onIndexChange={setIndex}
      />
    </div>
  );
};

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * A gallery whose tiles open the viewer: the page keeps `open` and `index`, and sets both from
 * `ImageGrid.Item onClick`. The viewer shows the large `src`; the grid keeps its own small picture.
 */
export const FromAGallery: Story = { render: () => <Gallery /> };

/** The viewer open on picture 3 of 12: counter and close on top, arrows on the sides, the caption below. */
export const Open: Story = {
  tags: ['!autodocs'],
  render: () => <Gallery startOpen startIndex={2} />,
};

/** `thumbnails` adds a strip under the picture: the current one ringed, a click jumps to it. From `sm` up. */
export const WithThumbnails: Story = {
  tags: ['!autodocs'],
  render: () => <Gallery startOpen startIndex={2} thumbnails />,
};

/** One picture: no arrows, no counter, no thumbnails; the close button stays. */
export const SinglePicture: Story = {
  tags: ['!autodocs'],
  render: () => <Gallery startOpen items={PHOTOS.slice(0, 1)} tiles={PHOTOS.slice(0, 1)} />,
};

/** A caption longer than two lines is cut at two (the whole text is still read out). */
export const LongCaption: Story = {
  tags: ['!autodocs'],
  render: () => (
    <Gallery
      startOpen
      items={[
        {
          ...PHOTOS[0]!,
          caption:
            'Linen table lamp, photographed at the end of the afternoon on the studio windowsill, ' +
            'with the shade turned a quarter so the seam faces the wall and the late light comes ' +
            'through the weave, next to a stack of ceramic bowls waiting for their final glaze.',
        },
        ...PHOTOS.slice(1),
      ]}
    />
  ),
};

/** While the picture loads: a skeleton the shape of a photo, and a spinner. */
export const Loading: Story = {
  tags: ['!autodocs', 'no-capture'],
  beforeEach: picturesThatNeverLoad,
  render: () => (
    <Gallery startOpen items={[{ ...PHOTOS[0]!, src: NEVER_LOADS }, ...PHOTOS.slice(1)]} />
  ),
};

/** A picture that can't be loaded: the message and "Try again", which requests it again. */
export const Failed: Story = {
  tags: ['!autodocs'],
  render: () => <Gallery startOpen items={[{ ...PHOTOS[0]!, src: BROKEN }, ...PHOTOS.slice(1)]} />,
};

/** A product page: each slide of the carousel is a button that opens the viewer at its own picture. */
export const FromAProductCarousel: Story = { render: () => <ProductPage /> };

/** Below `sm` the picture takes the width, and the arrows leave the edges for the band under it, 44px each. */
export const OnAPhone: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => <Gallery startOpen startIndex={2} />,
};

export const FromAProductCarouselOnAPhone: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => <ProductPage />,
};

// ── Checks ───────────────────────────────────────────────────────────────────

const body = within(document.body);
const findViewer = () => body.findByRole('dialog', { name: 'Picture viewer' });
// "3 / 12", the figures the viewer shows.
const shown = (viewer: HTMLElement) => within(viewer).getByText(/^\d+ \/ \d+$/).textContent;
const arrows = (viewer: HTMLElement) => ({
  prev: within(viewer).getByRole('button', { name: 'Previous picture' }),
  next: within(viewer).getByRole('button', { name: 'Next picture' }),
});
// The picture the viewer is on: the only one not hidden from assistive technology.
const currentPicture = (viewer: HTMLElement) => within(viewer).getByRole('img');
const loaded = (img: HTMLElement) =>
  waitFor(() => expect((img as HTMLImageElement).naturalWidth).toBeGreaterThan(0));

export const OpenChecks: Story = {
  ...Open,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    await expect(viewer).toHaveAttribute('aria-modal', 'true');
    await expect(shown(viewer)).toBe('3 / 12');
    const picture = currentPicture(viewer);
    await expect(picture).toHaveAttribute('alt', 'Studio photo 3');
    await loaded(picture);
    await expect(within(viewer).getByText('Speckled stoneware mug')).toBeVisible();
    const { prev, next } = arrows(viewer);
    await expect(prev).toBeEnabled();
    await expect(next).toBeEnabled();
    // The picture fits the space between the bars and the arrows, whatever its shape.
    const box = picture.getBoundingClientRect();
    await expect(box.width / box.height).toBeCloseTo(1, 1);
    await expect(box.top).toBeGreaterThanOrEqual(viewer.getBoundingClientRect().top);
    await expect(box.bottom).toBeLessThanOrEqual(viewer.getBoundingClientRect().bottom);
    // No strip unless asked for.
    await expect(within(viewer).queryByRole('group', { name: 'Picture thumbnails' })).toBeNull();
  },
};

/** The current picture and the one on each side are requested; the others are not. */
export const OnlyTheNeighboursAreLoaded: Story = {
  ...Open,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    const sources = () =>
      Array.from(viewer.querySelectorAll('img')).map((img) => img.getAttribute('src'));
    await expect(sources()).toEqual([PHOTOS[1]!.src, PHOTOS[2]!.src, PHOTOS[3]!.src]);
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await waitFor(() => expect(shown(viewer)).toBe('4 / 12'));
    await expect(sources()).toEqual([PHOTOS[2]!.src, PHOTOS[3]!.src, PHOTOS[4]!.src]);
    // The neighbours are there for the swipe: assistive technology only sees the current one.
    await expect(within(viewer).getAllByRole('img')).toHaveLength(1);
  },
};

/** Focus goes in, Tab stays in, and every way of closing puts focus back on the tile that opened it. */
export const FocusIsTrappedAndReturnsToTheTile: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Gallery />,
  play: async ({ canvas }) => {
    const tile = canvas.getByRole('button', { name: /Studio photo 3/ });
    const closers = [
      () => userEvent.keyboard('{Escape}'),
      async (viewer: HTMLElement) =>
        userEvent.click(within(viewer).getByRole('button', { name: 'Close' })),
      // The dark around the picture is the viewer itself.
      async (viewer: HTMLElement) => userEvent.click(viewer),
    ];
    for (const close of closers) {
      tile.focus();
      await userEvent.keyboard('{Enter}');
      const viewer = await findViewer();
      const { prev, next } = arrows(viewer);
      const closeButton = within(viewer).getByRole('button', { name: 'Close' });
      await waitFor(() => expect(closeButton).toHaveFocus());
      // Tab goes round the viewer's three controls and never reaches the page behind it.
      for (const control of [prev, next, closeButton]) {
        await userEvent.tab();
        await expect(control).toHaveFocus();
      }
      await userEvent.tab({ shift: true });
      await expect(next).toHaveFocus();
      await close(viewer);
      await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(tile).toHaveFocus());
    }
  },
};

/** A click on the picture or a control keeps the viewer open; one on the dark around the picture closes it. */
export const ClickOnThePictureKeepsItOpen: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() },
  render: (args) => <Gallery startOpen startIndex={2} onOpenChange={args.onOpenChange} />,
  play: async ({ args }) => {
    const viewer = await findViewer();
    const picture = currentPicture(viewer);
    await loaded(picture);
    await userEvent.click(picture);
    await userEvent.click(within(viewer).getByText('Speckled stoneware mug'));
    await userEvent.click(arrows(viewer).next);
    await waitFor(() => expect(shown(viewer)).toBe('4 / 12'));
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    // The slide is wider than the picture on a tall window: its empty part is the dark around it.
    await userEvent.click(currentPicture(viewer).parentElement!);
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

/**
 * A viewer opened from a modal sits above it: the first Escape closes the viewer only, the second
 * closes the modal, and focus goes back to the button that opened the viewer.
 */
export const EscapeClosesOnlyTheViewer: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() },
  render: function Render(args) {
    const [modal, setModal] = useState(true);
    return (
      <Modal
        open={modal}
        onClose={() => {
          args.onOpenChange(false);
          setModal(false);
        }}
      >
        <Modal.Header title="Photos" />
        <Modal.Body>
          <Opener />
        </Modal.Body>
      </Modal>
    );
  },
  play: async ({ args }) => {
    const modal = within(await body.findByRole('dialog', { name: 'Photos' }));
    const opener = modal.getByRole('button', { name: 'Open viewer' });
    await userEvent.click(opener);
    await findViewer();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Picture viewer' })).toBeNull());
    await expect(body.getByRole('dialog', { name: 'Photos' })).toBeInTheDocument();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
  },
};

/** The previous arrow is off on the first picture, the next one on the last, and the keys stop there too: no loop. */
export const ArrowsStopAtTheEnds: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onIndexChange: fn() },
  render: (args) => <Opener startOpen onIndexChange={args.onIndexChange} />,
  play: async ({ args }) => {
    const viewer = await findViewer();
    const { prev, next } = arrows(viewer);
    await expect(shown(viewer)).toBe('1 / 12');
    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();
    // The key toward the start does nothing on the first picture.
    await userEvent.keyboard(`{${keyToStart()}}`);
    await expect(shown(viewer)).toBe('1 / 12');
    await expect(args.onIndexChange).not.toHaveBeenCalled();

    await userEvent.keyboard(`{${keyToEnd()}}`);
    await waitFor(() => expect(shown(viewer)).toBe('2 / 12'));
    await expect(prev).toBeEnabled();
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(shown(viewer)).toBe('12 / 12'));
    await expect(next).toBeDisabled();
    await expect(prev).toBeEnabled();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(shown(viewer)).toBe('12 / 12');
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(shown(viewer)).toBe('1 / 12'));
    await expect(args.onIndexChange).toHaveBeenNthCalledWith(1, 1);
    await expect(args.onIndexChange).toHaveBeenNthCalledWith(2, 11);
    await expect(args.onIndexChange).toHaveBeenNthCalledWith(3, 0);
    await expect(args.onIndexChange).toHaveBeenCalledTimes(3);
  },
};

/** An arrow that turns off under the keyboard hands focus to the other one: the keys keep working. */
export const FocusStaysInTheViewerAtTheEnd: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Opener startOpen startIndex={10} />,
  play: async () => {
    const viewer = await findViewer();
    const { prev, next } = arrows(viewer);
    await waitFor(() =>
      expect(within(viewer).getByRole('button', { name: 'Close' })).toHaveFocus()
    );
    await userEvent.tab();
    await userEvent.tab();
    await expect(next).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(shown(viewer)).toBe('12 / 12'));
    await expect(next).toBeDisabled();
    await expect(prev).toHaveFocus();
    await expect(viewer.contains(document.activeElement)).toBe(true);
    // And a key still reaches the viewer.
    await userEvent.keyboard(`{${keyToStart()}}`);
    await waitFor(() => expect(shown(viewer)).toBe('11 / 12'));
  },
};

// The picture is centred once the slide has stopped moving.
const settled = (viewer: HTMLElement) =>
  waitFor(() => {
    const frame = viewer.getBoundingClientRect();
    const box = currentPicture(viewer).getBoundingClientRect();
    expect(box.left + box.width / 2).toBeCloseTo(frame.left + frame.width / 2, -1);
  });

// A swipe, as Embla reads it: a mouse down on the picture, moves on the document, a mouse up.
const swipe = async (from: HTMLElement, towardStart: boolean) => {
  const box = from.getBoundingClientRect();
  const y = box.top + box.height / 2;
  const sign = (getComputedStyle(from).direction === 'rtl' ? 1 : -1) * (towardStart ? 1 : -1);
  const width = document.documentElement.clientWidth;
  const distance = width * 0.5;
  const x0 = width / 2 - (sign * distance) / 2;
  const fire = (type: string, target: EventTarget, x: number) =>
    target.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: type === 'mouseup' ? 0 : 1,
      })
    );
  fire('mousedown', from, x0);
  for (let step = 1; step <= 5; step += 1) {
    fire('mousemove', document, x0 + (sign * distance * step) / 5);
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  fire('mouseup', document, x0 + sign * distance);
};

/**
 * The next picture lies toward the end of the line, so a swipe toward the start brings it, in both
 * directions; the arrows' keys and the arrows themselves follow the line: the previous arrow at the
 * start with its chevron turned around in right to left, and the counter's figures keep their order.
 */
export const KeysAndSwipeFollowTheLine: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Opener />,
  play: async ({ canvas }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, async () => {
        await userEvent.click(canvas.getByRole('button', { name: 'Open viewer' }));
        const viewer = await findViewer();
        const { prev, next } = arrows(viewer);
        const at = `${dir}:`;
        expect(startOffset(prev, viewer), `${at} previous at the start`).toBeLessThan(
          startOffset(next, viewer)
        );
        expect(getComputedStyle(prev.querySelector('svg')!).scale, `${at} chevron`).toBe(
          dir === 'rtl' ? '-1 1' : 'none'
        );
        expectReadsLeftToRight(within(viewer).getByText('1 / 12'));
        const counter = within(viewer).getByText('1 / 12');
        const close = within(viewer).getByRole('button', { name: 'Close' });
        expect(startOffset(counter, viewer), `${at} counter at the start`).toBeLessThan(
          startOffset(close, viewer)
        );

        // Keys: toward the end is the next picture, toward the start the previous one.
        await userEvent.keyboard(`{${keyToEnd()}}`);
        await waitFor(() => expect(shown(viewer), `${at} key to the end`).toBe('2 / 12'));
        await userEvent.keyboard(`{${keyToStart()}}`);
        await waitFor(() => expect(shown(viewer), `${at} key to the start`).toBe('1 / 12'));

        // Swipe: toward the start brings the next picture, toward the end goes back.
        const picture = currentPicture(viewer);
        await loaded(picture);
        await swipe(picture, true);
        await waitFor(() => expect(shown(viewer), `${at} swipe to the start`).toBe('2 / 12'));
        await settled(viewer);
        await swipe(currentPicture(viewer), false);
        await waitFor(() => expect(shown(viewer), `${at} swipe to the end`).toBe('1 / 12'));
        await settled(viewer);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
      });
    }
  },
};

/** A page whose direction flips while the viewer is open stays on its picture. */
export const StaysOnThePictureWhenTheDirectionFlips: Story = {
  ...Open,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    const html = document.documentElement;
    const was = html.getAttribute('dir');
    const flipped = html.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
    try {
      await expect(shown(viewer)).toBe('3 / 12');
      html.setAttribute('dir', flipped);
      await waitFor(() =>
        expect(
          startOffset(arrows(viewer).prev, viewer),
          'previous follows the new direction'
        ).toBeLessThan(startOffset(arrows(viewer).next, viewer))
      );
      await expect(shown(viewer)).toBe('3 / 12');
      await settled(viewer);
    } finally {
      if (was === null) html.removeAttribute('dir');
      else html.setAttribute('dir', was);
    }
  },
};

/** The counter is a polite live region that reads "Picture 4 of 12" and the picture's name as it moves. */
export const CounterIsALiveRegion: Story = {
  ...Open,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    const region = viewer.querySelector('[aria-live]') as HTMLElement;
    await expect(region).toHaveAttribute('aria-live', 'polite');
    await expect(region).toHaveAttribute('aria-atomic', 'true');
    await expect(region).toHaveTextContent('Picture 3 of 12. Studio photo 3');
    // The figures are for the eye: the live text is what is read out.
    await expect(within(region).getByText('3 / 12')).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(arrows(viewer).next);
    await waitFor(() => expect(region).toHaveTextContent('Picture 4 of 12. Studio photo 4'));
    await expect(shown(viewer)).toBe('4 / 12');
  },
};

/** Every text is a prop: the viewer, its controls, the counter, the strip and the failure. */
export const TextsAreProps: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Opener
      startOpen
      thumbnails
      items={[{ ...PHOTOS[0]!, src: BROKEN }, ...PHOTOS.slice(1, 4)]}
      ariaLabel="Visionneuse"
      prevLabel="Précédente"
      nextLabel="Suivante"
      closeLabel="Fermer"
      counterLabel={(position, total) => `Photo ${position} sur ${total}`}
      thumbnailsLabel="Miniatures"
      thumbnailLabel={(position) => `Aller à la photo ${position}`}
      errorLabel="Cette photo n’a pas pu être chargée."
      retryLabel="Réessayer"
    />
  ),
  play: async () => {
    const viewer = await body.findByRole('dialog', { name: 'Visionneuse' });
    const scope = within(viewer);
    await scope.findByText('Cette photo n’a pas pu être chargée.');
    await scope.findByRole('button', { name: 'Réessayer' });
    await scope.findByRole('button', { name: 'Précédente' });
    await scope.findByRole('button', { name: 'Suivante' });
    await scope.findByRole('button', { name: 'Fermer' });
    await expect(viewer.querySelector('[aria-live]')).toHaveTextContent('Photo 1 sur 4.');
    const strip = scope.getByRole('group', { name: 'Miniatures' });
    await expect(within(strip).getAllByRole('button')).toHaveLength(4);
    await expect(
      within(strip).getByRole('button', { name: 'Aller à la photo 2' })
    ).toBeInTheDocument();
  },
};

/** The strip: one button per picture, the current one marked, a click jumps, and it follows the arrows. */
export const ThumbnailsMarkTheCurrentPicture: Story = {
  ...WithThumbnails,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    const strip = within(viewer).getByRole('group', { name: 'Picture thumbnails' });
    const thumbs = within(strip).getAllByRole('button');
    await expect(thumbs).toHaveLength(12);
    await expect(thumbs[2]).toHaveAttribute('aria-current', 'true');
    await expect(thumbs[0]).toHaveAttribute('aria-current', 'false');
    await expect(thumbs[2]).toHaveClass('ring-brand-500');
    await expect(thumbs[0]).not.toHaveClass('ring-brand-500');
    // The strip draws the small picture, not the large one.
    await expect(thumbs[2]!.querySelector('img')).toHaveAttribute('src', PHOTOS[2]!.thumbSrc);
    await userEvent.click(thumbs[7]!);
    await waitFor(() => expect(shown(viewer)).toBe('8 / 12'));
    await expect(thumbs[7]).toHaveAttribute('aria-current', 'true');
    await expect(thumbs[2]).toHaveAttribute('aria-current', 'false');
    await userEvent.click(arrows(viewer).next);
    await waitFor(() => expect(thumbs[8]).toHaveAttribute('aria-current', 'true'));
  },
};

/** Without a `thumbSrc` the strip falls back to the large picture. */
export const ThumbnailsFallBackToTheLargePicture: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Opener startOpen thumbnails items={PHOTOS.slice(0, 3).map(({ src, alt }) => ({ src, alt }))} />
  ),
  play: async () => {
    const viewer = await findViewer();
    const strip = within(viewer).getByRole('group', { name: 'Picture thumbnails' });
    const thumbs = within(strip).getAllByRole('button');
    await expect(thumbs[1]!.querySelector('img')).toHaveAttribute('src', PHOTOS[1]!.src);
  },
};

/** A strip longer than the window scrolls: the current thumbnail is in view when the viewer opens. */
export const LongStripShowsTheCurrentThumbnail: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Opener
      startOpen
      startIndex={35}
      thumbnails
      items={Array.from({ length: 40 }, (_, i) => PHOTOS[i % PHOTOS.length]!)}
    />
  ),
  play: async () => {
    const viewer = await findViewer();
    const strip = within(viewer).getByRole('group', { name: 'Picture thumbnails' });
    const scroller = strip.parentElement!;
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    const current = within(strip).getAllByRole('button')[35]!;
    await waitFor(() => {
      const thumb = current.getBoundingClientRect();
      const frame = scroller.getBoundingClientRect();
      expect(thumb.left).toBeGreaterThanOrEqual(frame.left - 1);
      expect(thumb.right).toBeLessThanOrEqual(frame.right + 1);
    });
    await userEvent.keyboard('{Home}');
    const first = within(strip).getAllByRole('button')[0]!;
    await waitFor(() => {
      const thumb = first.getBoundingClientRect();
      const frame = scroller.getBoundingClientRect();
      expect(thumb.left).toBeGreaterThanOrEqual(frame.left - 1);
      expect(thumb.right).toBeLessThanOrEqual(frame.right + 1);
    });
  },
};

/** The page stops scrolling behind the viewer, and gets its own `overflow` back when it closes. */
export const PageScrollIsLockedWhileOpen: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Opener />,
  play: async ({ canvas }) => {
    document.body.style.overflow = 'auto';
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Open viewer' }));
      await findViewer();
      await expect(document.body.style.overflow).toBe('hidden');
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
      await expect(document.body.style.overflow).toBe('auto');
    } finally {
      document.body.style.overflow = '';
    }
  },
};

export const SinglePictureChecks: Story = {
  ...SinglePicture,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    // Only the close button: no arrows, no counter, no strip.
    await expect(within(viewer).getAllByRole('button')).toHaveLength(1);
    await expect(within(viewer).getByRole('button', { name: 'Close' })).toBeVisible();
    await expect(viewer.querySelector('[aria-live]')).toBeNull();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(within(viewer).getByRole('img')).toHaveAttribute('alt', 'Studio photo 1');
    // The close button stays at the end of the line.
    const close = within(viewer).getByRole('button', { name: 'Close' });
    await expect(startOffset(close, viewer)).toBeGreaterThan(viewer.clientWidth / 2);
  },
};

export const LongCaptionIsCutAtTwoLines: Story = {
  ...LongCaption,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    const caption = within(viewer)
      .getByText(/Linen table lamp, photographed/)
      .closest('p')!;
    const lineHeight = parseFloat(getComputedStyle(caption).lineHeight);
    await expect(caption.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight * 2 + 1);
    // Cut, not wrapped further: the rest is clipped, and still in the text.
    await expect(caption.scrollHeight).toBeGreaterThan(caption.clientHeight);
    await expect(caption).toHaveTextContent(/waiting for their final glaze\.$/);
    // The caption never changes the band: its height is the same on a picture without one.
    const band = caption.parentElement!;
    const height = band.getBoundingClientRect().height;
    for (let i = 0; i < 3; i += 1) await userEvent.keyboard(`{${keyToEnd()}}`);
    await waitFor(() => expect(shown(viewer)).toBe('4 / 12'));
    await expect(viewer.querySelector('p')).toBeNull();
    await expect(band.getBoundingClientRect().height).toBe(height);
  },
};

export const LoadingChecks: Story = {
  ...Loading,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    // The request never ends: the picture is never handed its `src`, and after a while it is
    // still loading, not failed.
    await expect(currentPicture(viewer)).not.toHaveAttribute('src');
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(within(viewer).queryByText('This picture could not be loaded.')).toBeNull();
    // A spinner, once, for the picture the viewer is on; the skeleton is photo-shaped.
    const spinner = within(viewer).getByRole('status', { name: 'Loading' });
    await expect(spinner).toBeVisible();
    await expect(within(viewer).getAllByRole('status')).toHaveLength(1);
    const skeleton = spinner.parentElement!;
    const box = skeleton.getBoundingClientRect();
    await expect(box.width / box.height).toBeCloseTo(1.5, 1);
    await expect(getComputedStyle(skeleton).animationName).toBe('pulse');
    // The picture is not painted yet, and the failure is not shown.
    const picture = currentPicture(viewer);
    await expect(getComputedStyle(picture).opacity).toBe('0');
    await expect(within(viewer).queryByRole('button', { name: 'Try again' })).toBeNull();
    // The arrows still work while a picture loads.
    await userEvent.click(arrows(viewer).next);
    await waitFor(() => expect(shown(viewer)).toBe('2 / 12'));
  },
};

export const FailureOffersTryAgain: Story = {
  ...Failed,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    const message = await within(viewer).findByText('This picture could not be loaded.');
    await expect(message).toBeVisible();
    // Only the neighbour's picture is on the page: the failed one is replaced by the message.
    await expect(viewer.querySelectorAll('img')).toHaveLength(1);
    const retry = within(viewer).getByRole('button', { name: 'Try again' });
    // A new `<img>` is created for the new request, which fails again with this picture.
    const requested: HTMLImageElement[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (node instanceof HTMLImageElement && node.getAttribute('src') === BROKEN)
            requested.push(node);
    });
    observer.observe(viewer, { childList: true, subtree: true });
    try {
      await userEvent.click(retry);
      await waitFor(() => expect(requested).toHaveLength(1));
      await within(viewer).findByText('This picture could not be loaded.');
      await expect(within(viewer).getByRole('button', { name: 'Try again' })).toBeVisible();
    } finally {
      observer.disconnect();
    }
    // The arrows work around a failed picture.
    await userEvent.click(arrows(viewer).next);
    await waitFor(() => expect(shown(viewer)).toBe('2 / 12'));
    await expect(currentPicture(viewer)).toHaveAttribute('alt', 'Studio photo 2');
  },
};

export const FailedPictureHasTheMessageInTheViewer: Story = {
  ...Failed,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    const message = await within(viewer).findByRole('status');
    await expect(message).toHaveTextContent('This picture could not be loaded.');
    // Centred in the room the picture would have had.
    const box = message.getBoundingClientRect();
    const frame = viewer.getBoundingClientRect();
    await expect(box.left + box.width / 2).toBeCloseTo(frame.left + frame.width / 2, -1);
  },
};

// The page behind may be white or black: the viewer is `black/90` over it, the controls a white
// `15%` disc with white glyphs on top. Worst case for contrast: a white page.
const toRgba = (color: string) => {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data);
};
const over = (fg: number[], bg: number[]) =>
  [0, 1, 2].map((i) => (fg[i]! * fg[3]! + bg[i]! * (255 - fg[3]!)) / 255).concat(255);
const luminance = ([r, g, b]: number[]) => {
  const [lr, lg, lb] = [r!, g!, b!].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr! + 0.7152 * lg! + 0.0722 * lb!;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

/** The viewer is black and its controls white, in the four themes: it is a photo viewer, not a themed panel. */
export const ControlsStayDarkInEveryTheme: Story = {
  ...Open,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    const { prev, next } = arrows(viewer);
    const close = within(viewer).getByRole('button', { name: 'Close' });
    const counter = within(viewer).getByText('3 / 12');
    const surfaces: string[] = [];
    inEachTheme(() => {
      const surface = toRgba(getComputedStyle(viewer).backgroundColor);
      surfaces.push(surface.join());
      expect(surface.slice(0, 3), 'the surface is black').toEqual([0, 0, 0]);
      expect(surface[3]! / 255, 'the surface is nearly opaque').toBeGreaterThanOrEqual(0.85);
      const page = over(surface, [255, 255, 255, 255]);
      for (const control of [prev, next, close]) {
        const disc = over(toRgba(getComputedStyle(control).backgroundColor), page);
        const glyph = toRgba(getComputedStyle(control).color);
        expect(contrast(glyph, disc), `${control.ariaLabel}: glyph on its disc`).toBeGreaterThan(7);
      }
      expect(
        contrast(over(toRgba(getComputedStyle(counter).color), page), page),
        'counter on the surface'
      ).toBeGreaterThan(7);
    });
    // The same surface in every theme.
    await expect(new Set(surfaces).size).toBe(1);
  },
};

/** A thumb-sized viewer on a phone: the picture takes the width, the arrows are 44px and flank the caption. */
export const OnAPhoneChecks: Story = {
  ...OnAPhone,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    expectNoHorizontalOverflow();
    const { prev, next } = arrows(viewer);
    const picture = currentPicture(viewer);
    await loaded(picture);
    const caption = within(viewer).getByText('Speckled stoneware mug').getBoundingClientRect();
    const box = picture.getBoundingClientRect();
    const sides = [prev, next].map((arrow) => arrow.getBoundingClientRect());
    for (const arrow of sides) {
      await expect(arrow.width).toBeGreaterThanOrEqual(44);
      await expect(arrow.height).toBeGreaterThanOrEqual(44);
      // Below the picture, level with the caption.
      await expect(arrow.top).toBeGreaterThanOrEqual(box.bottom - 1);
      await expect(
        Math.abs(arrow.top + arrow.height / 2 - (caption.top + caption.height / 2))
      ).toBeLessThan(8);
    }
    // The caption sits between them, whichever side each is on.
    const [left, right] = sides.sort((a, b) => a.left - b.left) as [DOMRect, DOMRect];
    await expect(left.right).toBeLessThanOrEqual(caption.left);
    await expect(caption.right).toBeLessThanOrEqual(right.left);
    // The picture takes the width of the phone.
    await expect(box.width).toBeGreaterThan(document.documentElement.clientWidth * 0.95);
    // The controls on top: counter at the start, close at the end, 44px.
    const close = within(viewer).getByRole('button', { name: 'Close' });
    await expect(close.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    await expect(startOffset(within(viewer).getByText('3 / 12'), viewer)).toBeLessThan(
      startOffset(close, viewer)
    );
    // The strip is for wider screens.
    await expect(within(viewer).queryByRole('group', { name: 'Picture thumbnails' })).toBeNull();
  },
};

export const ThumbnailsAreHiddenOnAPhone: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => <Gallery startOpen startIndex={2} thumbnails />,
  play: async () => {
    const viewer = await findViewer();
    await expect(within(viewer).queryByRole('group', { name: 'Picture thumbnails' })).toBeNull();
    await expect(within(viewer).queryByRole('button', { name: 'Go to picture 2' })).toBeNull();
    expectNoHorizontalOverflow();
  },
};

// The white ring of a control on the dark surface: 2px, the theme's white, no halo. Read from
// the box-shadow by hand: `expectFocusRing` only knows the colour syntaxes of the accent.
const expectWhiteRing = async (control: HTMLElement) => {
  await expect(control).toHaveFocus();
  expect(control.matches(':focus-visible'), 'the control did not get :focus-visible').toBe(true);
  await waitFor(() => {
    const shadow = getComputedStyle(control).boxShadow;
    const ring = shadow.match(/((?:rgba?|oklch|oklab|color)\([^)]*\))\s+0px 0px 0px 2px/);
    expect(ring, `the 2px ring is missing from ${shadow}`).not.toBeNull();
    const white = toRgba(
      getComputedStyle(document.documentElement).getPropertyValue('--color-white')
    );
    toRgba(ring![1]!).forEach((channel, i) =>
      expect(Math.abs(channel - white[i]!)).toBeLessThan(4)
    );
    expect(shadow, 'a halo is drawn').not.toMatch(/0px 0px 0px 4px/);
  });
};

/** The controls on the dark surface take the white focus ring, from the keyboard. */
export const ControlsHaveAFocusRing: Story = {
  ...WithThumbnails,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const viewer = await findViewer();
    const { prev, next } = arrows(viewer);
    const thumb = within(viewer).getByRole('button', { name: 'Go to picture 1' });
    const close = within(viewer).getByRole('button', { name: 'Close' });
    await waitFor(() => expect(close).toHaveFocus());
    // Tab, so `:focus-visible` matches: close is the first control, then the arrows and the strip.
    for (const control of [prev, next, thumb]) {
      await userEvent.tab();
      await expectWhiteRing(control);
    }
  },
};

/** A swipe-less touch of the product page: each slide opens the viewer at its own picture, and focus comes back to it. */
export const SlideOpensTheViewerAtItsPicture: Story = {
  ...FromAProductCarousel,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }));
    await waitFor(() =>
      expect(canvas.getAllByRole('button', { name: /Go to slide/ })[2]).toHaveAttribute(
        'aria-current',
        'true'
      )
    );
    const slide = canvas.getByRole('button', { name: 'View photo 3 full size' });
    slide.focus();
    await userEvent.keyboard('{Enter}');
    const viewer = await findViewer();
    await expect(shown(viewer)).toBe('3 / 6');
    await expect(currentPicture(viewer)).toHaveAttribute('alt', 'Studio photo 3');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(slide).toHaveFocus());
  },
};

export const ProductPageOnAPhoneChecks: Story = {
  ...FromAProductCarouselOnAPhone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await userEvent.click(canvas.getByRole('button', { name: 'View photo 1 full size' }));
    const viewer = await findViewer();
    await expect(shown(viewer)).toBe('1 / 6');
    expectNoHorizontalOverflow();
    await userEvent.click(arrows(viewer).next);
    await waitFor(() => expect(shown(viewer)).toBe('2 / 6'));
  },
};
