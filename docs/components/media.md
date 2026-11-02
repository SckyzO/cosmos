# Media

Storybook group: Media. The syntax highlighting of `CodeBlock` is an optional entry:
[Optional entries](../guides/optional-entries.md#code). The map and the QR code are too, in
[the same page](../guides/optional-entries.md#map).

## CodeBlock

Storybook: [CodeBlock](https://sckyzo.github.io/cosmos/?path=/docs/media-codeblock--docs).

`CodeBlock` shows a snippet with a copy button. It needs no highlighter, and takes a few variants:
`lineNumbers`, `highlightLines={[3, '5-7']}`, `filename` (a header with the name, the language and
the copy button), `wrap`, `maxHeight` (the block scrolls inside, takes a Tab stop and scrolls with the
arrow keys), `diff` (the first column of each line is its sign, `+`, `-` or a space; changes are
tinted and marked, the sign column is not copied) and `variant="terminal"` (a line starting with
`$` and a space is a command, the others are its output; only the commands are copied). A block that a long line
makes scroll sideways is a Tab stop too. The copy button copies the code, never the line numbers, the
signs or the prompts.

## QrCode

Storybook: [QR Code](https://sckyzo.github.io/cosmos/?path=/docs/media-qr-code--docs).

`QrCode value={text} label="Authenticator setup code"` draws a QR code as one SVG path, from the
optional `qr` package, in the `/qr` entry: [Optional entries](../guides/optional-entries.md#qr-code).
`label` is required and names the picture; `size` is the side of the tile in pixels (default `192`,
quiet zone included, and it shrinks in a narrower parent) and `ecc` the error correction level
(`low`, `medium`, `quartile`, `high`; default `medium`). The tile is white with black modules in
every theme, because a reader scans a light code more reliably than an inverted one; the accent and
the reading direction do not change it. Next to it, show what the code holds as text (a
`SecretValue` for a setup key), for a person who can't scan.

## Lightbox

Storybook: [Lightbox](https://sckyzo.github.io/cosmos/?path=/docs/media-lightbox--docs).

`Lightbox` is a fullscreen picture viewer: a counter and a close button on top, previous and next
arrows on the sides, the caption at the bottom. The page opens it, usually from an
`ImageGrid.Item` (a tile with an `onClick` is already a button), and keeps `open` and the picture
shown. `src` is the large picture; the grid keeps its own small one.

```tsx
const [open, setOpen] = useState(false);
const [index, setIndex] = useState(0);

<ImageGrid layout="masonry" columns={{ sm: 2, md: 3, lg: 4 }}>
  {photos.map((photo, i) => (
    <ImageGrid.Item
      key={photo.src}
      overlay="View"
      onClick={() => {
        setIndex(i);
        setOpen(true);
      }}
    >
      <img src={photo.thumb} alt={photo.alt} width={photo.width} height={photo.height} />
    </ImageGrid.Item>
  ))}
</ImageGrid>

<Lightbox
  items={photos.map(({ src, alt, caption }) => ({ src, alt, caption }))}
  open={open}
  onOpenChange={setOpen}
  index={index}
  onIndexChange={setIndex}
/>;
```

- `items` is a list of `{ src, alt, caption?, thumbSrc? }`. `alt` is required: it names the picture and
  is read out when the viewer reaches it. `caption` is any node, cut at two lines (the whole text is
  still read out).
- `open` and `onOpenChange(open)`: the page owns them. `onOpenChange(false)` comes from the close
  button, Escape and a click on the dark around the picture; a click on the picture itself does
  nothing.
- `index`, `defaultIndex` and `onIndexChange(index)`: the picture shown, controlled or not. Leave
  `index` out and the viewer remembers the picture it was on; a gallery sets it from the tile.
- `thumbnails` draws a strip under the picture, from `sm` up, with the current thumbnail ringed and
  a click to jump. It draws `thumbSrc`, or `src` when there is none: give the small picture, or
  the large one is downloaded twice.
- Every text is a prop with an English default: `ariaLabel` ("Picture viewer"), `prevLabel`,
  `nextLabel`, `closeLabel`, `counterLabel(position, total)` ("Picture 3 of 12", read out by a
  polite live region with the picture's name), `thumbnailsLabel`, `thumbnailLabel(position, total)`,
  `errorLabel` and `retryLabel`.

The viewer is dark in every theme: it is a photo viewer, not a themed panel. It is a modal dialog:
focus moves in and goes back to the tile that opened it when it closes, Tab stays inside, the page
behind stops scrolling, and Escape closes the top overlay only, so a viewer opened from a `Modal`
or a `Drawer` leaves that one open. The arrow keys move between pictures, Home and End go to the
first and last, and a swipe does the same. It never loops: the previous arrow is off on the first
picture and the next one on the last. The picture shown and the one on each side are requested;
the others are not.

A picture that is loading shows a skeleton and a spinner. One that can't be loaded shows "This
picture could not be loaded." with a "Try again" button that requests it again.

Below `sm` the picture takes the width of the screen, the arrows leave the edges for the band under
it (44px each, where a thumb reaches them) and the strip is not drawn. In right to left the previous
arrow moves to the right with its chevron turned around, the arrow keys and the direction of the
swipe flip with it (the next picture is always toward the end of the line), and the counter and the
close button swap sides; the figures of the counter keep their order.

To open it from a product page, make each `Carousel` slide a button that sets `index` to its own
rank and `open` to `true`. There is no zoom and no download button.
