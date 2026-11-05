# Translating

Storybook: [LabelsProvider](https://sckyzo.github.io/cosmos/?path=/docs/foundations-labelsprovider--docs).

The components write some text of their own: the name of a button ("Show 2 more pages"), a default
title ("No data"), the words of a state ("Try again"). It is English by default. Mount
`LabelsProvider` once, at the root of the app, next to `LinkProvider`, with your dictionary for
the language on show:

```tsx
import { LabelsProvider, type LabelsInput } from '@sckyzo/cosmos-react';

const fr: LabelsInput = {
  breadcrumb: {
    landmark: "Fil d'Ariane",
    home: 'Accueil',
    showHidden: (count) => `Afficher ${count} ${count === 1 ? 'autre page' : 'autres pages'}`,
    hiddenMenu: 'Pages masquées',
  },
  emptyState: { title: 'Aucune donnée' },
  errorState: { title: 'Une erreur est survenue.', retry: 'Réessayer' },
  loadingState: { title: 'Chargement…' },
};

<LabelsProvider labels={fr}>{app}</LabelsProvider>;
```

- **One key per component.** `CosmosLabels` lists them, and `englishLabels` holds the English of
  every one of them: copy it to start a translation. Leave out a component or a key and it stays
  English.
- **A text that holds a value is a function.** `showHidden: (count) => …` gets the number, so the
  plural and the word order are yours.
- **Per instance.** Every component that writes text takes a `labels` prop for its own key, which
  wins over the provider: `<ErrorState onRetry={reload} labels={{ retry: 'Reload' }} />`.
- **Nested providers.** A provider inside another replaces the keys it gives and keeps the outer
  one's others.
- **Your own text stays yours.** What you pass in (`title`, `items`, a column's `header`) is shown as
  it is and wins over the label that stands in for it when you pass nothing.
- **Locale.** `locale` is the language's BCP 47 tag, the default of every component that writes a
  date, a time, a number or an amount (`<LabelsProvider labels={fr} locale="fr-FR">`). A
  component's own `locale` wins, and a nested provider that gives none keeps the outer one's. With
  no locale anywhere, the components format as the browser does, and the few that always used
  `en-US` (`BarList`, `PipelineStages`, `TrendDelta`) still do.

The provider holds one language. To switch languages, pass it the dictionary of the language on
show, from your own i18n library or a plain object per locale.

The charts have a provider of their own. `@sckyzo/cosmos-charts` imports neither this package nor
the theme, so it cannot read `LabelsProvider`: mount `ChartLabelsProvider` next to it, with the
charts' dictionary (the empty message, the names screen readers hear, the words of a tooltip). It
works the same way, key by key; see [Charts: Translating](charts.md#translating).
