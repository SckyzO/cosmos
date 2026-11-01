# Optional entries

Four parts of `@sckyzo/cosmos-react` live in entries of their own, because each needs a library
that most apps never use: syntax highlighting, a rich text editor, a map and QR codes. The library
is an **optional peer dependency**: install it only in the apps that import the entry.

| Entry                         | Holds                                | You install                                                                                                                                                              |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@sckyzo/cosmos-react`        | Every other component                | `react` and `react-dom` `^19.0.0`                                                                                                                                        |
| `@sckyzo/cosmos-react/code`   | `CodeBlock` with syntax highlighting | `shiki` `^4.5.0`                                                                                                                                                         |
| `@sckyzo/cosmos-react/editor` | `RichTextEditor`                     | `@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extensions`, `@tiptap/extension-text-align` and `@tiptap/extension-image`, each `^3.32.0` |
| `@sckyzo/cosmos-react/map`    | `MapView`, `MapMarkerList`           | `maplibre-gl` `^5.24.0 \|\| ^6.4.1`                                                                                                                                      |
| `@sckyzo/cosmos-react/qr`     | `QrCode`                             | `qr` `~0.7.2`                                                                                                                                                            |

The ranges are the `peerDependencies` of the package. The main entry never imports any of these
libraries: an app that does not use an entry ships none of its code. Where an entry uses a
component or a context of the main entry, it imports it from `@sckyzo/cosmos-react`, so the app
keeps one copy of each context and one overlay stack. The entries need nothing more in your CSS
than [Getting started](../getting-started.md) sets up: the `@source` line covers their compiled
files, which sit in the same `dist` folder.

## Code

Storybook: [CodeBlock](https://sckyzo.github.io/cosmos/?path=/docs/media-codeblock--docs), [Code highlighting](https://sckyzo.github.io/cosmos/?path=/docs/media-code-highlighting--docs).

`CodeBlock` itself, in the main entry, needs no highlighter: its variants are in
[Media](../components/media.md#codeblock). To color it, use the `/code` entry. It needs
[Shiki](https://shiki.style), an optional peer dependency that only the apps using this entry
install:

```bash
pnpm add shiki
```

```tsx
import { CodeBlock } from '@sckyzo/cosmos-react/code';

<CodeBlock language="yaml" filename="deployment.yaml" code={manifest} lineNumbers />;
```

The colors are the `--color-code-*` tokens of the theme, so they follow the theme, accent and text
size. The JavaScript regex engine is used (no WebAssembly), and each language is its own chunk,
loaded when a block shows it: until then, and for a language Cosmos has no grammar for, the block
shows plain text. The languages are shell (`bash`, `sh`, `zsh`), `shellsession`, `yaml`, `json`,
`toml`, `ini`, `dockerfile`, `sql`, `typescript`, `javascript`, `tsx`, `jsx`, `python`, `go`, `html`,
`xml`, `css`, `diff`, `nginx`, `hcl`, `terraform`, `rust`, `java`, `php`, `markdown` and `promql`.
A `highlight` prop still replaces the built-in highlighter. The main entry never imports Shiki:
an app that does not use `/code` ships none of it. Without `shiki` installed, Next.js stops the
build on the missing module; Vite builds the app, and a block throws an error that names the
package.

## Editor

Storybook: [Rich Text Editor](https://sckyzo.github.io/cosmos/?path=/docs/forms-rich-text-editor--docs).

`RichTextEditor` is a formatted text field: bold, italic, underline, strike, headings 1 to 3,
bulleted and numbered lists, quotes, inline code, code blocks, alignment, links, images, undo and
redo. It lives in the `/editor` entry and is built on [Tiptap](https://tiptap.dev) (MIT), whose
packages are optional peer dependencies that only the apps using this entry install:

```bash
pnpm add @tiptap/react @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extensions \
  @tiptap/extension-text-align @tiptap/extension-image
```

```tsx
import { RichTextEditor } from '@sckyzo/cosmos-react/editor';

<RichTextEditor
  label="Reply"
  placeholder="Write a reply…"
  value={html}
  onChange={setHtml}
  maxLength={2000}
/>;
```

`value`, `defaultValue` and `onChange` carry HTML by default, or the ProseMirror JSON document with
`format="json"`; an empty HTML document is `''`. `variant` picks the chrome: `toolbar` (default,
buttons on top; `toolbar={['bold', 'italic', 'link']}` picks them), `bubble` (a small toolbar over
the selection; Alt+F10 moves the focus into it, Escape gives it back) or `minimal` (no toolbar, the
shortcuts and Markdown-like input rules only: `##` and a space, `-` and a space, `**bold**`).
`labels` replaces every text the editor draws, tooltips included. `readOnly`, `disabled`, `rows`,
`autoFocus` and `name` (a hidden input, for a native form) work as on a Textarea, and so do `label`,
`description`, `error` and `required`: the label and the error are linked to the editable text.
`maxLength` counts the text characters and stops typing and pasting at the limit.

The toolbar's buttons are `bold`, `italic`, `underline`, `strike`, `heading`, `bulletList`,
`orderedList`, `blockquote`, `code`, `codeBlock`, `align`, `link`, `image`, `undo` and `redo`
(`RICH_TEXT_ACTIONS`, in that order). A toolbar written with `toolbar` keeps the buttons it lists:
add the new ones to it, or leave `toolbar` out for all of them. The `bubble` variant shows the
inline marks and the link by default, underline included.

- **Heading** and **align** open a menu, and show the item that is checked: Paragraph and
  Heading 1 to 3 (Ctrl+Alt+0 to 3 are their shortcuts), Align start, center and end. The `heading`
  button used to toggle a level 2 heading; it opens the menu now. A button is pressed while a
  heading or a centered or end-aligned block is under the caret.
- **Alignment** is `start` (nothing is set), `center` or `end`: the sides of the line, so the
  buttons and the stored text mean the same in right to left. A block's line follows what is typed
  in it, as everywhere in the editor: the end of Latin text is its right, the end of Arabic its
  left. The editor stores it as `style="text-align: center;"` on the paragraph or heading, so the
  sanitizer that reads the HTML back has to let `text-align` through. A pasted `left`, `right` or
  `justify` is dropped. In JSON, the block has `attrs: { textAlign: 'center' }`; with no alignment
  it carries no `textAlign`, as before.
- **Code block** is Ctrl+Alt+C, or three backticks and Enter in any variant. It holds plain text
  (no marks) and reads left to right in any page; a pasted `language-…` class is kept.
- **Image** opens a field for the address and the description. The address must be an `http(s)`
  URL: a relative path, a bare host, `data:` and `blob:` are refused. The description (the image's
  `alt`) is required, or the image is marked decorative, which writes `alt=""`; an image never goes
  in with neither. The image is inserted after the selection, in the line, so the alignment of the
  block moves it. With an image selected (an arrow key from its side, or a click), the button is
  pressed and opens the same fields on it. The button waits in a code block. The editor does not
  upload anything: host the picture, and give its URL.

Links accept `http(s):`, `mailto:` and relative URLs only: a `javascript:` link is refused whether
it is typed in the link field, typed as Markdown, pasted or passed in `value`. An image's source
takes `http(s)` only, wherever it comes from: a pasted `<img>` with another source is dropped, and
one in a JSON document is drawn without a source. The schema holds paragraphs, headings 1 to 3,
lists, quotes, code blocks, hard breaks, images (`src` and `alt` only) and the marks above; tables,
rules, other styles and anything else are dropped on paste. A pasted web page that holds images
with `http(s)` sources now keeps them, and the browser loads them. **The editor only filters what
goes through it: sanitize the stored HTML again on the server before you render it elsewhere.**
The main entry never imports Tiptap: an app that does not use `/editor` ships none of it.

## Map

Storybook: [Map View](https://sckyzo.github.io/cosmos/?path=/docs/media-map-view--docs).

`MapView` draws places on a map: pins in the theme's colors with an icon or a number, a popup per
pin, groups of close pins as a counted circle, zoom buttons and a fit to the markers. It lives in
the `/map` entry and needs [MapLibre GL JS](https://maplibre.org) (BSD-3), an optional peer
dependency that only the apps using this entry install:

```bash
pnpm add maplibre-gl
```

MapLibre draws in a web worker. Since `maplibre-gl` 6, an app built with a bundler tells it where
the worker is, once, before the first map; without that the map stays empty. With Vite:

```ts
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);
```

MapLibre's [installation guide](https://maplibre.org/maplibre-gl-js/docs/#installation) gives the
line for webpack, Rollup, esbuild and Next.js, and the extra setting for server rendering.
`maplibre-gl` 5 needs none of this.

Load MapLibre's stylesheet once in the app, and import the component from `/map`:

```tsx
import { useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapMarkerList, MapView, type MapMarker } from '@sckyzo/cosmos-react/map';

const stores: MapMarker[] = [
  { id: 'harbour', label: 'Harbour', position: [4.81, 45.71], description: '12 quay street' },
  { id: 'station', label: 'Station', position: [4.9, 45.75], intent: 'success', icon: 3 },
];

export const Stores = () => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <MapMarkerList markers={stores} selectedId={selected} onSelect={setSelected} />
      <MapView
        markers={stores}
        style="https://tiles.example.com/styles/light.json"
        darkStyle="https://tiles.example.com/styles/dark.json"
        ariaLabel="Stores"
        selectedId={selected}
        onSelectedIdChange={setSelected}
      />
    </>
  );
};
```

- **The base map is yours.** Cosmos ships no tiles: a tile server has its own terms and sees every
  visitor. `style` is a MapLibre style (a URL or an object) and its attribution stays visible.
  `darkStyle` is optional: under the dark themes (`.dark`, `.deep-blue`) the map switches to it,
  and without it keeps `style`. Pass constants, not a new object on each render. A markers array
  is the same: define it once, or the pins are redrawn each time.
- **Pins, popups and buttons are React and HTML**, colored by `intent` with the theme's classes,
  so a theme, accent or text size switch repaints them with no code. A title or description with
  markup shows as text.
- **`variant="static"`** is a fixed view for a card or a detail page: no gesture, no zoom buttons,
  no focus stop, no popup, and the pins are pictures.
- **Keyboard and screen readers.** The interactive map is one focus stop with the name given by
  `ariaLabel`: the arrow keys pan, `+` and `-` zoom. A map alone cannot be used with a screen
  reader, so show the same `markers` as a `MapMarkerList` next to it: choosing a row opens the
  popup on the map. On a static map, the list is the only way to the places.
- `cluster` (default on) groups close pins; a click on a group zooms in to split it. `fit` frames
  the markers on the first draw and when the set of markers changes; otherwise `initialCenter` and
  `initialZoom` give the view. `onViewChange` reports each pan or zoom.
- A browser without WebGL shows `unavailableMessage` in place of the map. The main entry never
  imports MapLibre: an app that does not use `/map` ships none of it. Without `maplibre-gl`
  installed, Next.js stops the build on the missing module; Vite builds the app, and a map throws
  an error that names the package.

## QR code

Storybook: [QR Code](https://sckyzo.github.io/cosmos/?path=/docs/media-qr-code--docs),
[the authenticator setup](https://sckyzo.github.io/cosmos/?path=/story/examples-auth-two-step-verification-form--authenticator-setup).

`QrCode` draws a QR code from a text: a link to share, a code to pair a phone, the `otpauth://` URI
an authenticator app is enrolled with. It lives in the `/qr` entry and needs
[`qr`](https://github.com/paulmillr/qr) (MIT or Apache-2.0, no dependencies), an optional peer
dependency that only the apps using this entry install:

```bash
pnpm add qr
```

```tsx
import { QrCode } from '@sckyzo/cosmos-react/qr';

<QrCode value={otpauthUri} label="Authenticator setup code" size={192} />;
```

- **`value` and `label`.** `value` is the text, as UTF-8. `label` is required: the code is a
  picture (`role="img"`), so it is named by what it is for, and a screen reader cannot read it.
  Show the same data as text next to it.
- **`size`** is the side of the tile in pixels, quiet zone included (default `192`). The tile
  shrinks, square, in a parent narrower than that.
- **`ecc`** is the error correction level: `low` (7% of the code can be lost and it still scans),
  `medium` (15%, default), `quartile` (25%) and `high` (30%). A higher level draws more modules for
  the same text, so each is smaller at a given `size`. A text that does not fit throws an error
  that names the level: a code holds up to 2953 bytes at `low`, 2331 at `medium`, 1663 at `quartile`
  and 1273 at `high`.
- **Dark on light in every theme.** The code is a white tile with black modules and the four-module
  quiet zone the standard asks for, in light, sand, dark and deep blue alike. Readers handle an
  inverted code unevenly, so a dark theme keeps the light tile rather than flipping the colors.
  The accent does not touch it, and right to left does not mirror it.
- **One `<svg>` with one `<path>`** for the dark modules, with crisp edges. It renders on the
  server too: no effect, no measuring.
- **For people who can't scan**, show the key as text in a `SecretValue` next to the code, as the
  authenticator setup story does.

`qr` is below 1.0, so Cosmos asks for `~0.7.2`: a new minor of `qr` is a deliberate bump of the
peer range, not something your install picks up. The main entry never imports `qr`: an app that does
not use `/qr` ships none of it. Without `qr` installed, the build stops on the missing module.

`qr` ships ES modules only, and the CommonJS build of `/qr` requires it. Node loads an ES module
from `require` from 20.19 and 22.12 on, the versions `qr` itself asks for. A test runner that cannot
do that needs `qr` transformed, or the entry mocked.
