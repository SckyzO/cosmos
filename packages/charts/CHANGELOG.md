# Changelog

All notable changes to `@sckyzo/cosmos-charts` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
