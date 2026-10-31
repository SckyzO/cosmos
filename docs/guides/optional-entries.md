# Optional entries

Three parts of `@sckyzo/cosmos-react` live in entries of their own, because each needs a library
that most apps never use: syntax highlighting, a rich text editor and a map. The library is an
**optional peer dependency**: install it only in the apps that import the entry.

| Entry                         | Holds                                | You install                                                                                                   |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `@sckyzo/cosmos-react`        | Every other component                | `react` and `react-dom` `^19.0.0`                                                                             |
| `@sckyzo/cosmos-react/code`   | `CodeBlock` with syntax highlighting | `shiki` `^4.5.0`                                                                                              |
| `@sckyzo/cosmos-react/editor` | `RichTextEditor`                     | `@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit` and `@tiptap/extensions`, each `^3.32.0` |
| `@sckyzo/cosmos-react/map`    | `MapView`, `MapMarkerList`           | `maplibre-gl` `^5.24.0 \|\| ^6.4.1`                                                                           |

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

`RichTextEditor` is a formatted text field: bold, italic, strike, headings, bulleted and numbered
lists, quotes, code, links, undo and redo. It lives in the `/editor` entry and is built on
[Tiptap](https://tiptap.dev) (MIT), whose packages are optional peer dependencies that only the apps
using this entry install:

```bash
pnpm add @tiptap/react @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extensions
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

Links accept `http(s):`, `mailto:` and relative URLs only: a
`javascript:` link is refused whether it is typed in the link field, typed as Markdown, pasted or
passed in `value`. The schema holds paragraphs, headings 2 and 3, lists, quotes, hard breaks and the
marks above; images, tables and anything else are dropped on paste. **The editor only filters
what goes through it: sanitize the stored HTML again on the server before you render it
elsewhere.**
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
