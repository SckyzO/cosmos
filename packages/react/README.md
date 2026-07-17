# @sckyzo/cosmos-react

React 19 component library for the Cosmos design system. 135+ themeable,
accessible components, built with Tailwind 4 and shipped as ESM + CJS + types.

Browse the full catalog in the [live Storybook](https://sckyzo.github.io/cosmos/).

## Install

```bash
pnpm add @sckyzo/cosmos-react @sckyzo/cosmos-theme
pnpm add react react-dom   # peers, react 19+
```

`@sckyzo/cosmos-theme` carries the CSS (tokens, fonts, light/dark vars). The
components render unstyled without it.

## Set up the styles

Components are styled with Tailwind 4 utility classes, so your app's Tailwind
build has to generate those classes. Tailwind only scans your own source by
default, so you **must** point `@source` at the installed package. Without it no
Cosmos utility classes are generated and every component renders unstyled.

In your main CSS file:

```css
@import 'tailwindcss';

/* Required: let Tailwind scan the compiled components for class names.
   The path is relative to this CSS file; adjust the depth to your layout. */
@source '../node_modules/@sckyzo/cosmos-react/dist/**/*.{js,cjs}';

/* Cosmos tokens (the @theme block) then the light/dark CSS vars. */
@import '@sckyzo/cosmos-theme/tailwind';
@import '@sckyzo/cosmos-theme/vars';

/* Optional: the Outfit + JetBrains Mono webfonts. */
@import '@sckyzo/cosmos-theme/fonts';
```

If you also use `@sckyzo/cosmos-charts`, add a second `@source` line for its
`dist` the same way.

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

Charts live in a separate package, [`@sckyzo/cosmos-charts`](../charts), so apps
that don't render charts don't ship the ApexCharts bundle.

## License

MIT — see [LICENSE](../../LICENSE).
