# Changelog

All notable changes to `@sckyzo/cosmos-theme` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-theme@0.0.2...@sckyzo/cosmos-theme@0.1.0) (2026-10-20)


### ⚠ BREAKING CHANGES

* **theme:** .dark is now the neutral black/gray theme. Use .deep-blue for the previous navy dark theme.

### Features

* **theme:** add sand, neutral dark, deep-blue themes and 12 accents ([2ab8ebb](https://github.com/SckyzO/cosmos/commit/2ab8ebb61ee2ca3eeaafb588eb93ab481b156cab))

## [0.0.2] - 2026-05-21

Packaging/metadata only — no token, no CSS changes.

### Changed

- Sharper npm package description.
- First release published via npm OIDC trusted publishing (provenance attached).

## [0.0.1] - 2026-05-20

First test release.

### Added

- Tailwind 4 theme (`css/tailwind-tokens.css`) — design tokens exposed as
  `@theme` so consumer projects inherit the Cosmos scale, palette and radii.
- Universal CSS variables (`css/css-vars.css`) — light/dark mode surfaces
  (`--color-bg-base`, `--color-text-base`, brand ramp, status colors).
- Font face declarations (`css/fonts.css`) — Outfit (display/body) and
  JetBrains Mono (code), distributed via `@fontsource/*`.
