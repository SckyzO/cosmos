# @sckyzo/cosmos-react

React 19 component library — Cosmos design system.

**Status: Phase 1 (extraction in progress)** — components are being extracted from
[rackscope](https://github.com/SckyzO/rackscope) `EmptyPage.tsx` and
`TemplateDefaultPage.tsx`. See parent repo [`cosmos`](https://github.com/SckyzO/cosmos)
for the roadmap.

## Install

```bash
pnpm add @sckyzo/cosmos-react @sckyzo/cosmos-theme
# Required peers (likely already in your app):
pnpm add react react-dom
```

## Usage

```tsx
// Apps must import the theme CSS once:
import '@sckyzo/cosmos-theme/fonts';
import '@sckyzo/cosmos-theme/tailwind';
import 'tailwindcss';
import '@sckyzo/cosmos-theme/vars';

// Then use components:
import { /* coming in Phase 1 */ } from '@sckyzo/cosmos-react';
```

## License

MIT — see [LICENSE](../../LICENSE).
