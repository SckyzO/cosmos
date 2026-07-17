# Changelog

All notable changes to `@sckyzo/cosmos-react` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-react@0.0.2...@sckyzo/cosmos-react@0.0.3) (2026-07-17)


### Bug Fixes

* **react:** accessibility of overlay components ([d9ca403](https://github.com/SckyzO/cosmos/commit/d9ca40360bd7e7d7f61a6a23d406018996b6dee5))
* **react:** add menu semantics and keyboard nav to Dropdown ([f60d06f](https://github.com/SckyzO/cosmos/commit/f60d06fe451af570967824d970a359001d9ba0a1))
* **react:** export the 7 unreachable page components ([1b7d60c](https://github.com/SckyzO/cosmos/commit/1b7d60c647d609b02ea704374fca56aa3a7018b5))
* **react:** give ConfirmationModal a unique title id and focus trap ([0a703c4](https://github.com/SckyzO/cosmos/commit/0a703c43e13a514b061d31dc8aeda2cbd9ee5b86))
* **react:** trap focus and name Modal and Drawer dialogs ([53564d1](https://github.com/SckyzO/cosmos/commit/53564d1a65e96c29849e8581b1b22c25d04545bd))

## [0.0.2] - 2026-05-21

Packaging/metadata only — no component or API changes.

### Changed

- Sharper npm package description.
- First release published via npm OIDC trusted publishing (provenance attached).

## [0.0.1] - 2026-05-20

First test release.

### Added

- 135+ React 19 components organised by responsibility across the Storybook
  sidebar groups: Atoms, Forms, Data, Status, Feedback, Overlays, Navigation,
  Actions, Layout, Lists, Tables, Settings, Typography, plus full-page
  templates under Pages and Foundations.
- Ships ESM + CJS + type declarations (`dist/`), built with tsup.
- `@sckyzo/cosmos-theme` as a dependency for the design tokens; `react` and
  `react-dom` 19 as peer dependencies.
- Dark/light theming throughout via the Cosmos CSS variables.
