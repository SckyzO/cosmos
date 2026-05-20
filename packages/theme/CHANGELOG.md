# Changelog

All notable changes to `@sckyzo/cosmos-theme` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-05-20

First test release.

### Added

- Tailwind 4 theme (`css/tailwind-tokens.css`) — design tokens exposed as
  `@theme` so consumer projects inherit the Cosmos scale, palette and radii.
- Universal CSS variables (`css/css-vars.css`) — light/dark mode surfaces
  (`--color-bg-base`, `--color-text-base`, brand ramp, status colors).
- Font face declarations (`css/fonts.css`) — Outfit (display/body) and
  JetBrains Mono (code), distributed via `@fontsource/*`.
