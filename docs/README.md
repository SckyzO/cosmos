# Cosmos documentation

The user documentation of `@sckyzo/cosmos-theme`, `@sckyzo/cosmos-react` and
`@sckyzo/cosmos-charts`. The [Storybook](https://sckyzo.github.io/cosmos/) is the reference for
every component and its props; these pages cover the setup, and what the props alone do not
explain.

## Start here

- [Getting started](getting-started.md): requirements, install, the CSS setup explained, a first
  component, and recipes for Vite and Next.js (App Router).

## Guides

- [Appearance](guides/appearance.md): the themes, accents, fonts, text size, density, corner radius
  and reading direction; `applyAppearance`, `AppearanceSettings`, `AppearanceMenu` and
  `Customizer`; the theme without Tailwind.
- [Tokens and focus](guides/tokens.md): the design tokens, and the focus utilities for your own
  controls.
- [Charts](guides/charts.md): install `@sckyzo/cosmos-charts`, how the colors follow the theme,
  and the charts it ships.
- [Optional entries](guides/optional-entries.md): `@sckyzo/cosmos-react/code`, `/editor`, `/map`
  and `/qr`, with their optional peer dependencies.
- [Right to left](guides/right-to-left.md): what to set, what mirrors, and what stays as it is.
- [Refs and routing](guides/refs-and-routing.md): `ref` as a prop, and sending the links of the
  components through your router.

## Components

Notes on the larger components, one page per Storybook group. Each section links to its
Storybook page.

| Page                                             | Holds                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [Tables](components/tables.md)                   | `DataTable` and the table primitives                                                 |
| [Data](components/data.md)                       | Audit diff, kanban board, dates, clocks and countdowns                               |
| [Feedback](components/feedback.md)               | Progress bars and rings                                                              |
| [Monitoring](components/monitoring.md)           | Health checks, uptime monitoring, log views and job logs                             |
| [Navigation](components/navigation.md)           | The record pager                                                                     |
| [Lists](components/lists.md)                     | Files and uploads, comments                                                          |
| [Chat](components/chat.md)                       | Chat building blocks, the chatbot, rich replies                                      |
| [Forms](components/forms.md)                     | The slider, the color and phone fields                                               |
| [Layout](components/layout.md)                   | The application shell, search in the topbar, layout modes, split panes, auth layouts |
| [Media](components/media.md)                     | `CodeBlock`                                                                          |
| [Variants worth knowing](components/variants.md) | Props that are easy to miss                                                          |

## Specifications

- [Themes and accents](specs/themes-accents.md): how the themes and accents are built.

## Contributing

[CONTRIBUTING.md](../CONTRIBUTING.md) covers setup, tests, the component API rules and releases.
