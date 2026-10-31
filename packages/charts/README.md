# @sckyzo/cosmos-charts

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-charts)](https://www.npmjs.com/package/@sckyzo/cosmos-charts)

Cosmos charts: opinionated chart wrappers themed for the Cosmos design system, drawn with
[Recharts](https://recharts.github.io/). Kept in a dedicated package so that `@sckyzo/cosmos-react`
consumers who don't render charts don't ship a chart library.

Each chart is a module of its own and the package declares no side effects, so a bundler ships
the charts you import and leaves the others out.

## Install

```bash
npm install @sckyzo/cosmos-charts
npm install react react-dom   # peers, react 19+
```

The three Cosmos packages share one version number: install the same version of each. The charts
read their colors from the CSS variables of `@sckyzo/cosmos-theme`, so they follow its themes and
accents; without the theme CSS they fall back to a built-in palette. To set the theme up, see
[Getting started](https://github.com/SckyzO/cosmos/blob/main/docs/getting-started.md). A few
charts carry Tailwind 4 classes, so point Tailwind at this package too, in the CSS file that
imports it, next to the `@source` line for `@sckyzo/cosmos-react`:

```css
@source '../node_modules/@sckyzo/cosmos-charts/dist/**/*.{js,cjs}';
```

## Use

```tsx
import { LineAreaChart } from '@sckyzo/cosmos-charts';

<LineAreaChart
  series={[{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25] }]}
  categories={['00h', '04h', '08h', '12h', '16h', '20h', '24h']}
/>;
```

## Documentation

- [Charts guide](https://github.com/SckyzO/cosmos/blob/main/docs/guides/charts.md): how the colors follow the theme, the props every chart
  shares, and each chart type.
- [Storybook](https://sckyzo.github.io/cosmos/?path=/docs/charts-line-area--docs): every chart with
  its stories.

## License

MIT, see [LICENSE](https://github.com/SckyzO/cosmos/blob/main/LICENSE).

The charts are drawn with [Recharts](https://github.com/recharts/recharts) (MIT), which pulls in modules of [d3](https://d3js.org/) (ISC, and BSD-3-Clause for `d3-ease`). `WorldMap` also uses [d3-geo](https://github.com/d3/d3-geo) (ISC) and [topojson-client](https://github.com/topojson/topojson-client) (ISC). Their licenses apply to the code they ship. `d3-geo` ships ES modules only, so the CommonJS build carries it inside `WorldMap.cjs`, with the `d3-array` and `internmap` it pulls; `THIRD_PARTY_NOTICES.md` holds their licenses.
