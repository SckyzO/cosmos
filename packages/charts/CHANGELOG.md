# Changelog

All notable changes to `@sckyzo/cosmos-charts` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-charts@0.2.0...@sckyzo/cosmos-charts@0.3.0) (2026-10-24)


### ⚠ BREAKING CHANGES

* **charts:** DonutChart no longer takes rightLegend and DonutRightLegend is removed; pass legendPosition="right" instead.
* **react:** Calendar and DatePicker no longer import react-day-picker's styles. Add @import '@sckyzo/cosmos-react/calendar.css'; to your stylesheet.

### Features

* **charts:** add a legend to LineAreaChart ([f66f236](https://github.com/SckyzO/cosmos/commit/f66f23614dbc94b1ffee9846704a8d6179b0ef31)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** add an apexOptions escape hatch ([40a6a51](https://github.com/SckyzO/cosmos/commit/40a6a51bfc99618f1b1fd18d32e8e938daef9cda)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** add colors and formatValue to DonutChart ([edc445f](https://github.com/SckyzO/cosmos/commit/edc445f3eee9f8c14780c0e17f8f2cd6fb599aa8)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** add colors and formatValue to LineAreaChart ([668171c](https://github.com/SckyzO/cosmos/commit/668171cb683e4bcbfebc52df11e4046932f71628)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** add colors and formatValue to RadialBarChart ([6508165](https://github.com/SckyzO/cosmos/commit/65081657c04e19c49498d346f5ca493dead9b453)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** add colors and formatValue to TreemapChart ([ff4fc9b](https://github.com/SckyzO/cosmos/commit/ff4fc9b7128cb02b6e5c77a86abc3a8abec752b6)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** add formatValue to RealtimeChart ([9307967](https://github.com/SckyzO/cosmos/commit/93079675eeed1ad1a85da461d7fd9b13a2ee80d4)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** add legendPosition ([43f7371](https://github.com/SckyzO/cosmos/commit/43f73710b05d4938ee6b737106c2ab45abe6f8e4)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** add min, max and formatValue to the gauges ([89e26bc](https://github.com/SckyzO/cosmos/commit/89e26bc9da8aff8694c337b1e40bbec21e60ca21)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** draw thresholds in the theme's status colors ([5b98c0e](https://github.com/SckyzO/cosmos/commit/5b98c0e874c49d8e723bb5d8bf96c30861433d57)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** export escapeHtml and tooltipHtml ([480bced](https://github.com/SckyzO/cosmos/commit/480bced16e4e286d696749296d88e22c6729b519)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** name charts for screen readers and reach them by keyboard ([da628c6](https://github.com/SckyzO/cosmos/commit/da628c63f4e63464a5770ae7a1254d4f0a503154)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** show a message when a chart has no data ([6f43c53](https://github.com/SckyzO/cosmos/commit/6f43c53e782ca4183eddd2f3bd7a21b936cf39cb)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** take series and status colors from the theme ([9679e88](https://github.com/SckyzO/cosmos/commit/9679e882c5e08a6af7103c0a7a0876f41f5f09f2)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)


### Bug Fixes

* **charts:** follow the Cosmos theme in chart tooltips ([75b7832](https://github.com/SckyzO/cosmos/commit/75b78321c12ebb9615ac6fd5052867008d989af4)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** give each RealtimeChart its own default generator ([90d4330](https://github.com/SckyzO/cosmos/commit/90d4330f408954e2e7cce625a5121aa00d2d6b03)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** give GradientRadial the shared track color ([9b4c51d](https://github.com/SckyzO/cosmos/commit/9b4c51d96628fdd1ebf4ca2ea7a2a57d4995dd4d)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** make RealtimeChart threshold labels readable ([2f7b3bc](https://github.com/SckyzO/cosmos/commit/2f7b3bc7c8c6f73a18c444d9529d9ad6f2055cf2)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** measure axis labels again once a web font loads ([55b6736](https://github.com/SckyzO/cosmos/commit/55b67361bb7fddb90adec5acdd6d999762af3f65)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** pick a readable label color on each treemap tile ([52dea6b](https://github.com/SckyzO/cosmos/commit/52dea6b230071e44ff8ce24167daa21cf3622ffa)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** resize the RealtimeChart window when windowSize changes ([0b866d6](https://github.com/SckyzO/cosmos/commit/0b866d6fb52c683f20d535a6812c6e2e2ded2e01)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **charts:** show RealtimeChart thresholds after early updates ([08aa49b](https://github.com/SckyzO/cosmos/commit/08aa49b412dc2cefaae2e0d4c9fd961bbade16ac)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** start RealtimeChart samples after 2 s at the latest ([38d0d55](https://github.com/SckyzO/cosmos/commit/38d0d55bdb5caa0964768c83d339442786b3198f)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** use the muted text color for radial name labels ([9838420](https://github.com/SckyzO/cosmos/commit/98384206f7fcc004e216bb51b08f89173d7883bf)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **charts:** use the theme text color in donut and radial labels ([1ef1d9b](https://github.com/SckyzO/cosmos/commit/1ef1d9bda3a667aaae16a9ce6f4a21ab1e1f4411)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react,charts:** give the CommonJS entry its own type declarations ([40dbb78](https://github.com/SckyzO/cosmos/commit/40dbb7865d59b5de1df2d19155d176fb0df8d1e8)), closes [#260](https://github.com/SckyzO/cosmos/issues/260)
* **react,charts:** keep the "use client" directive in dist ([958fd31](https://github.com/SckyzO/cosmos/commit/958fd319a6daca7b3c8aa9b3b4d10bd992eb5f7a)), closes [#259](https://github.com/SckyzO/cosmos/issues/259)
* **react:** ship the Calendar styles as a separate CSS export ([3abd2d1](https://github.com/SckyzO/cosmos/commit/3abd2d1ca1f2c4325e0bb319f7a7f94d90b0eab5)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)


### Performance Improvements

* **charts:** keep chart option functions stable across renders ([594bd45](https://github.com/SckyzO/cosmos/commit/594bd45dac2c9c04297e46d088292e5eb77ef0a5)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)

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
