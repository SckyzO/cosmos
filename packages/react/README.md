# @sckyzo/cosmos-react

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-react)](https://www.npmjs.com/package/@sckyzo/cosmos-react)

React 19 component library for the Cosmos design system: themeable, accessible components,
built with Tailwind 4 and shipped as ESM, CJS and types.

Browse the full catalog in the [live Storybook](https://sckyzo.github.io/cosmos/).

## Install

```bash
npm install @sckyzo/cosmos-react @sckyzo/cosmos-theme
npm install react react-dom   # peers, react 19+
```

`@sckyzo/cosmos-theme` carries the CSS (tokens, fonts, theme and accent vars). The
components render unstyled without it. The three Cosmos packages share one version number:
install the same version of each.

## Set up the styles

Components are styled with Tailwind 4 utility classes, so your app's Tailwind build has to
generate them. Tailwind does not scan `node_modules`, so you **must** point `@source` at the
installed package: without it no Cosmos class is generated and every component renders unstyled.

In your main CSS file:

```css
@import 'tailwindcss';

/* Required. The path is relative to this CSS file; adjust the depth to your layout. */
@source '../node_modules/@sckyzo/cosmos-react/dist/**/*.{js,cjs}';

@import '@sckyzo/cosmos-theme/tailwind';
@import '@sckyzo/cosmos-theme/vars';

/* Optional: the Outfit + JetBrains Mono webfonts. */
@import '@sckyzo/cosmos-theme/fonts';

/* Only if you use Calendar, DatePicker or a component built on them. */
@import '@sckyzo/cosmos-react/calendar.css';
```

## Use

```tsx
import { useState } from 'react';
import { Button, Modal } from '@sckyzo/cosmos-react';

function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Modal.Header title="Hello from Cosmos" onClose={() => setOpen(false)} />
        <Modal.Body>A themed, focus-trapped dialog.</Modal.Body>
      </Modal>
    </>
  );
}
```

## Documentation

- [Getting started](https://github.com/SckyzO/cosmos/blob/main/docs/getting-started.md): the setup explained, with a Vite and a Next.js recipe.
- [Appearance](https://github.com/SckyzO/cosmos/blob/main/docs/guides/appearance.md): themes, accents, fonts, density, radius, and the pickers.
- [Optional entries](https://github.com/SckyzO/cosmos/blob/main/docs/guides/optional-entries.md): `@sckyzo/cosmos-react/code`, `/editor` and `/map`.
- [Right to left](https://github.com/SckyzO/cosmos/blob/main/docs/guides/right-to-left.md) and [refs and routing](https://github.com/SckyzO/cosmos/blob/main/docs/guides/refs-and-routing.md).
- [Component notes](https://github.com/SckyzO/cosmos/blob/main/docs/README.md#components): tables, monitoring, logs, chat, the application shell and more.
- [Charts](https://github.com/SckyzO/cosmos/blob/main/docs/guides/charts.md) live in `@sckyzo/cosmos-charts`, so apps that don't render charts
  don't ship a chart library.

## License

MIT, see [LICENSE](https://github.com/SckyzO/cosmos/blob/main/LICENSE).
