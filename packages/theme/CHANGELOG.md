# Changelog

All notable changes to `@sckyzo/cosmos-theme` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-theme@0.2.0...@sckyzo/cosmos-theme@0.3.0) (2026-10-24)


### ⚠ BREAKING CHANGES

* **react:** Calendar and DatePicker no longer import react-day-picker's styles. Add @import '@sckyzo/cosmos-react/calendar.css'; to your stylesheet.
* **theme:** dark: utilities no longer outweigh state variants. CSS that relied on a dark: class beating hover:, focus: or another state class now needs an explicit dark:<state>: variant.

### Features

* **theme:** add focus-indicator and field-focus utilities ([d0acee5](https://github.com/SckyzO/cosmos/commit/d0acee5181b41bee8155d8995dd0adc74ab4c4d4)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **theme:** add focus-indicator-on-accent for accent-filled controls ([725cab5](https://github.com/SckyzO/cosmos/commit/725cab5b86b420a118fb51ceb9e52a5698577e17)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)


### Bug Fixes

* **react:** ship the Calendar styles as a separate CSS export ([3abd2d1](https://github.com/SckyzO/cosmos/commit/3abd2d1ca1f2c4325e0bb319f7a7f94d90b0eab5)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **theme:** keep the dark variant at zero specificity ([9e0cd86](https://github.com/SckyzO/cosmos/commit/9e0cd86e85682ed6665665adae899182d2b1db5d)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **theme:** lift brand-500 to 3:1 on deep-blue for four accents ([e1ab5fd](https://github.com/SckyzO/cosmos/commit/e1ab5fdd5ca889750071e5fe188ab39d454b732c)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **theme:** raise text-muted to 4.5:1 in light, sand, deep-blue ([d6e064d](https://github.com/SckyzO/cosmos/commit/d6e064d2e7e8ecf79787ed7293b316a392363ba0)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)

## [0.2.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-theme@0.1.0...@sckyzo/cosmos-theme@0.2.0) (2026-10-21)


### Features

* **theme:** add a data-font setting with five more fonts ([6135b66](https://github.com/SckyzO/cosmos/commit/6135b6681f669bdcd178b113fb7b0cbf82aef5d0)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **theme:** add a data-text-size setting ([cd6ed5c](https://github.com/SckyzO/cosmos/commit/cd6ed5c07b15a9df12b56a3638ff0ca477cf1392)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **theme:** add syntax highlighting tokens ([8589ef1](https://github.com/SckyzO/cosmos/commit/8589ef1434fafdd20e7ae042372ff89a534a30f3))
* **theme:** add the text-2xs and text-3xs sizes ([57decb3](https://github.com/SckyzO/cosmos/commit/57decb3bc301ec65ce9966c84b8412cd9791b32a)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)

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
