# Changelog

All notable changes to `@sckyzo/cosmos-react` are documented in this file.

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

- 135+ React 19 components organised by responsibility across the Storybook
  sidebar groups: Atoms, Forms, Data, Status, Feedback, Overlays, Navigation,
  Actions, Layout, Lists, Tables, Settings, Typography, plus full-page
  templates under Pages and Foundations.
- Ships ESM + CJS + type declarations (`dist/`), built with tsup.
- `@sckyzo/cosmos-theme` as a dependency for the design tokens; `react` and
  `react-dom` 19 as peer dependencies.
- Dark/light theming throughout via the Cosmos CSS variables.
