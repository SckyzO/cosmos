# Changelog

All notable changes to `@sckyzo/cosmos-charts` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.5.0...@sckyzo/cosmos-charts@0.6.0) (2026-11-02)


### Features

* **charts:** add a loading state to every series chart ([7466c5a](https://github.com/SckyzO/cosmos/commit/7466c5a3ffc175f29832c0ad494e40c30124fee6))
* **charts:** add loading to SunburstChart ([903dc88](https://github.com/SckyzO/cosmos/commit/903dc887de19fbb4db79c100c85d669ecbccccd7))
* **charts:** add markers and routes to WorldMap ([d822612](https://github.com/SckyzO/cosmos/commit/d82261292a6ab0502395af9aea253b4688c230b7))
* **charts:** add mirrored bars to BarChart ([a2692f0](https://github.com/SckyzO/cosmos/commit/a2692f031aff770d2713077f71fa863c89325d31))
* **charts:** add SunburstChart ([b4d09b5](https://github.com/SckyzO/cosmos/commit/b4d09b53cb3b050c55767f3db2b0684b8d1f4a64))
* **charts:** add zones and a needle to SemiCircleGauge ([b1d81dd](https://github.com/SckyzO/cosmos/commit/b1d81ddac16255cd5ccc394e9f703554387d6b95))
* **charts:** draw the gauge needle as a dial ([43cba91](https://github.com/SckyzO/cosmos/commit/43cba9147f706ee746e6e78fe520fb166b219069))

## [0.5.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.4.1...@sckyzo/cosmos-charts@0.5.0) (2026-11-01)


### Miscellaneous Chores

* **@sckyzo/cosmos-charts:** Synchronize cosmos versions

## [0.4.1](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.4.0...@sckyzo/cosmos-charts@0.4.1) (2026-10-31)


### Bug Fixes

* **charts:** fade a scrolling heat grid and drop values that don't fit ([e8ff4ab](https://github.com/SckyzO/cosmos/commit/e8ff4ab015777ac6e2d6ef015d324e412370f00a))
* **charts:** keep room for the lowest label of a RealtimeChart ([5dac109](https://github.com/SckyzO/cosmos/commit/5dac10929560e8034543c80a78c965285ee53336))
* **charts:** put a reference band's label at the bottom of the band ([13ee80b](https://github.com/SckyzO/cosmos/commit/13ee80b338034903b0f940abfbfb5acbfb641f1c))

## [0.4.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.3.1...@sckyzo/cosmos-charts@0.4.0) (2026-10-30)


### Documentation

* **charts:** add the `@source` line to the install steps ([80f1687](https://github.com/SckyzO/cosmos/commit/80f16872bb9e68ad13924034a15eb6d2a123695b))

## [0.3.1](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.3.0...@sckyzo/cosmos-charts@0.3.1) (2026-10-30)


### Bug Fixes

* **charts:** keep the charts left to right under dir=rtl ([d9c5d80](https://github.com/SckyzO/cosmos/commit/d9c5d806a6f3718b369719ed8198681ea4116c35))

## [0.3.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.2.0...@sckyzo/cosmos-charts@0.3.0) (2026-10-27)


### ⚠ BREAKING CHANGES

* **charts:** removed from @sckyzo/cosmos-charts:
    - the `apexOptions` prop of every wrapper, and the `ChartRawOptions`,
      `ChartBaseProps` and `ChartAccessibility` types. Draw what a wrapper
      has no prop for with Recharts elements passed as `children`.
    - `useChartTheme` and `useDarkMode`. Colours are CSS variables now
      (`var(--color-brand-500)`, `var(--color-status-warn)`...), which
      follow the theme, the accent and the text size with no hook.
    - `escapeHtml`, `tooltipHtml` and the `TooltipContent` and `TooltipRow`
      types. Legends and tooltips are React text, so nothing needs escaping.
    - the `apexcharts` and `react-apexcharts` dependencies.
* **charts:** StrokedGauge no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** SemiCircleGauge no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** GradientRadial no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** RadialBarChart no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** RadarChart no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** DonutChart no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** RealtimeChart no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** BoxPlotChart no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** ScatterChart and BubbleChart no longer take `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** RangeBarChart no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** MixedChart no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** BarChart no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** TreemapChart no longer takes `apexOptions`. Pass Recharts elements as `children` instead.
* **charts:** HeatmapChart no longer takes `apexOptions`. It is not a Recharts chart, so it takes no `children` either.
* **charts:** LineAreaChart and Sparkline no longer take `apexOptions`. Pass Recharts elements as `children` instead (a ReferenceLine, a Brush, an extra axis), and add `recharts` at the version of @sckyzo/cosmos-charts.
* **charts:** SparklineGroup and SparklineGroupItem are removed. Replace `<SparklineGroup items={…} />` with a grid of `<KpiCard chart={<Sparkline … />} />` from @sckyzo/cosmos-react.

### Features

* **charts:** add a bar variant to Sparkline ([3f9ab37](https://github.com/SckyzO/cosmos/commit/3f9ab37a6ba55849f6973725a8eb89794776a805))
* **charts:** add a target mark to SemiCircleGauge ([ac92ab1](https://github.com/SckyzO/cosmos/commit/ac92ab1e94cb1fa4902fc782847ced50d32cbde1))
* **charts:** add area series and stacked columns to MixedChart ([2550350](https://github.com/SckyzO/cosmos/commit/2550350249a1aab45fb1dcb46fb1f18d1f2c1059))
* **charts:** add BumpChart ([ca297f9](https://github.com/SckyzO/cosmos/commit/ca297f904d3da04f1500baa7d95b3cf976d0fb14))
* **charts:** add CalendarChart ([ded7649](https://github.com/SckyzO/cosmos/commit/ded76493111095f6a722b5f4aac823f64d216209))
* **charts:** add FunnelChart ([0468d4b](https://github.com/SckyzO/cosmos/commit/0468d4bc291b5ca16c411fa641ba975fa733b20b))
* **charts:** add line, stacked and marker options to LineAreaChart ([d5fc612](https://github.com/SckyzO/cosmos/commit/d5fc612e374d40afd247a4924917b80f4409c72d))
* **charts:** add per-value bar colors to BarChart ([b802e2a](https://github.com/SckyzO/cosmos/commit/b802e2adefd01f64c5b31dc62079c55338eb06f8))
* **charts:** add pie, center text and legend values to DonutChart ([0c2bef8](https://github.com/SckyzO/cosmos/commit/0c2bef83f5319f97d03f9d9f5fd2d8224104aac9))
* **charts:** add reference lines and bands to BarChart ([c63c73e](https://github.com/SckyzO/cosmos/commit/c63c73e60abd3806659191117da0d28e73dc4732))
* **charts:** add reference lines and bands to BoxPlotChart ([b95e0e4](https://github.com/SckyzO/cosmos/commit/b95e0e45f62034b4c0b4fb9516162e0c15405fb8))
* **charts:** add reference lines and bands to LineAreaChart ([1a32189](https://github.com/SckyzO/cosmos/commit/1a32189bb1ee932c28b6ac1194726ef4f00749b9))
* **charts:** add reference lines and bands to MixedChart ([a09cbfb](https://github.com/SckyzO/cosmos/commit/a09cbfbf9957cf3661667f649fa072e8906cb47c))
* **charts:** add reference lines and bands to RangeBarChart ([f4e1991](https://github.com/SckyzO/cosmos/commit/f4e19919ad234c8a3bd72b0d6e18d9e694592aa4))
* **charts:** add reference lines and bands to the scatter charts ([7fc14b5](https://github.com/SckyzO/cosmos/commit/7fc14b5e5f105821ed5846b842ce89760fc35a79))
* **charts:** add the shared reference lines and bands ([efc7f59](https://github.com/SckyzO/cosmos/commit/efc7f596c7ee3b1dd1dce715f48e846f241dd845))
* **charts:** add WaterfallChart ([d120940](https://github.com/SckyzO/cosmos/commit/d12094002f1d45e2cc78b70a310c11724c7f69f9))
* **charts:** add WorldMap ([513869f](https://github.com/SckyzO/cosmos/commit/513869f4886bb9e93e929618c9918187d1d72dbd))
* **charts:** scale the chart text with the text size setting ([a64e6ee](https://github.com/SckyzO/cosmos/commit/a64e6ee8bb6ffbcfac15232de6d81d4fd6f625b9))
* **charts:** separate the bars of a group with a line in the card color ([06240b5](https://github.com/SckyzO/cosmos/commit/06240b56b88295eddf943e70cc1661427cb45448))
* **charts:** trim long category labels of the BarChart ([ca586d6](https://github.com/SckyzO/cosmos/commit/ca586d64207b5023dde432d7ea46a80c2fe39e22))


### Bug Fixes

* **charts:** draw the dark bubbles more opaque ([545fa8d](https://github.com/SckyzO/cosmos/commit/545fa8dfad944028317c3777f4983a540b107402))
* **charts:** drop the dead space under the cartesian charts ([31b3cae](https://github.com/SckyzO/cosmos/commit/31b3cae0cc1442bc2ae2e8ca21eb67d9c1431e76))
* **charts:** keep the lowest heatmap step off the dark card ([3aec9a8](https://github.com/SckyzO/cosmos/commit/3aec9a8f7bcd7adaae554a4bf81e5518f5377f0f))
* **charts:** measure the axes again once a web font has loaded ([ba48949](https://github.com/SckyzO/cosmos/commit/ba48949c3a493dd32067b19f0ac8c608d9f60739))
* **charts:** size the radar when its series follow an empty start ([b26e5fc](https://github.com/SckyzO/cosmos/commit/b26e5fc163e37b83bf9604d9e6e276dedca536de))
* **charts:** walk horizontal bar charts with the arrow keys ([6855ae0](https://github.com/SckyzO/cosmos/commit/6855ae0f21738a89419fa229a5a57949ce40a4e5))


### Miscellaneous Chores

* **charts:** remove ApexCharts ([c7d871c](https://github.com/SckyzO/cosmos/commit/c7d871ca4794a9e09f8958485121b45bd0fca8da))


### Code Refactoring

* **charts:** move BarChart to Recharts ([b6cb7ad](https://github.com/SckyzO/cosmos/commit/b6cb7ad1ceab1b786f25931937bb1877ae91d40f))
* **charts:** move BoxPlotChart to Recharts ([11ff878](https://github.com/SckyzO/cosmos/commit/11ff8783a8c808c90553613f1a96647207817820))
* **charts:** move DonutChart to Recharts ([00fedf4](https://github.com/SckyzO/cosmos/commit/00fedf436a0c9ed90237c63eedc30fe9fcb9c8da))
* **charts:** move GradientRadial to Recharts ([05d99d0](https://github.com/SckyzO/cosmos/commit/05d99d0c99f7eda6898450ffcd00e4a575bc9683))
* **charts:** move HeatmapChart off ApexCharts ([3c2725e](https://github.com/SckyzO/cosmos/commit/3c2725e540f57bffaecb0889858f9e8eed71a41c))
* **charts:** move LineAreaChart and Sparkline to Recharts ([6ca825d](https://github.com/SckyzO/cosmos/commit/6ca825d2afffb3253d2425aced15ce8e2cfe11e0))
* **charts:** move MixedChart to Recharts ([d4696a9](https://github.com/SckyzO/cosmos/commit/d4696a972c3f81d7778a1993b831f587e6f23f2e))
* **charts:** move RadarChart to Recharts ([0686555](https://github.com/SckyzO/cosmos/commit/0686555634bb3ffb69b49fc2584b9c0debfb36aa))
* **charts:** move RadialBarChart to Recharts ([078abac](https://github.com/SckyzO/cosmos/commit/078abacde860eb7c89fc49442e47374e6569331c))
* **charts:** move RangeBarChart to Recharts ([b36a035](https://github.com/SckyzO/cosmos/commit/b36a03598143f24b0e6ca084030064713ab41ee6))
* **charts:** move RealtimeChart to Recharts ([c474509](https://github.com/SckyzO/cosmos/commit/c474509b2bb1420039a0980572e1d6d38ed12e9e))
* **charts:** move ScatterChart and BubbleChart to Recharts ([03e472f](https://github.com/SckyzO/cosmos/commit/03e472f39c31db2c7582a139e9352a3a7629e947))
* **charts:** move SemiCircleGauge to Recharts ([4962287](https://github.com/SckyzO/cosmos/commit/4962287b2c73a6fab8a1ed6c3194959d4e6de6e1))
* **charts:** move StrokedGauge to Recharts ([58eebd3](https://github.com/SckyzO/cosmos/commit/58eebd3f893655d16f9932f1d37b05824b92809d))
* **charts:** move TreemapChart to Recharts ([a34ac2c](https://github.com/SckyzO/cosmos/commit/a34ac2c43905d10f84b59b71adb66cf21585e912))
* **charts:** remove SparklineGroup ([c045228](https://github.com/SckyzO/cosmos/commit/c045228c4c7187b5061dbca601961fc66a91d253))

## [0.2.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.1.1...@sckyzo/cosmos-charts@0.2.0) (2026-10-21)


### Features

* **charts:** add BoxPlotChart ([83e812e](https://github.com/SckyzO/cosmos/commit/83e812e7f42e5ce0117be5080a06a7a70d3cf76e)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** add HeatmapChart ([eb7f363](https://github.com/SckyzO/cosmos/commit/eb7f363c0c958f6d7ec49ed6eee6a8354fc4b579)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** add MixedChart ([9657c84](https://github.com/SckyzO/cosmos/commit/9657c84d83c9cd8b0f82444b61fe1b499ad241f0)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** add RadarChart ([8f97184](https://github.com/SckyzO/cosmos/commit/8f9718421613d4e448826e3bc627986cfa772bae)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** add RangeBarChart ([a58030a](https://github.com/SckyzO/cosmos/commit/a58030a8e8324c549ac780141931f3405cd22f57)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** add ScatterChart and BubbleChart ([0ce481b](https://github.com/SckyzO/cosmos/commit/0ce481be8e062088f979f076a21eba874ad84be2)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)

## [0.1.1](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.1.0...@sckyzo/cosmos-charts@0.1.1) (2026-10-21)


### Bug Fixes

* **charts:** escape series names, categories and labels in HTML output ([c0b7137](https://github.com/SckyzO/cosmos/commit/c0b71379b1ce6f5b449eb64e8198ad5dd1bde27e))

## [0.1.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.0.2...@sckyzo/cosmos-charts@0.1.0) (2026-10-20)


### Features

* **charts:** follow the deep-blue theme and the accent color ([174f255](https://github.com/SckyzO/cosmos/commit/174f25578e45e78ca5688b7f032b812b74f763e4))


### Bug Fixes

* **charts:** keep LineAreaChart y-axis labels after a theme change ([bf0cc6d](https://github.com/SckyzO/cosmos/commit/bf0cc6d843df2c60386b4ce6321b1a4f7b473c06))

## [0.0.2] - 2026-05-21

Packaging/metadata only — no component or API changes.

### Changed

- Sharper npm package description.
- First release published via npm OIDC trusted publishing (provenance attached).

## [0.0.1] - 2026-05-20

First test release.

### Added

- Opinionated ApexCharts 5 wrappers themed for Cosmos: BarChart,
  LineAreaChart, DonutChart, RadialBarChart, GradientRadial, SemiCircleGauge,
  StrokedGauge, TreemapChart, Sparkline (+ SparklineGroup) and RealtimeChart.
- Tree-shakable: each component registers only the apexcharts chart type it
  needs via the v5 subpath imports (`apexcharts/bar`, `apexcharts/line`, …)
  on top of `react-apexcharts/core`, so consumers don't pay for unused types.
- Ships ESM + CJS + type declarations (`dist/`), built with tsup.
- `apexcharts` 5 and `react-apexcharts` 2 as dependencies; `react` /
  `react-dom` 19 as peer dependencies.
