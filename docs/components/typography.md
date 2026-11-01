# Typography

Storybook group: Typography.

## Highlight

Storybook: [Highlight](https://sckyzo.github.io/cosmos/?path=/docs/typography-highlight--docs).

`Highlight` draws `text` with the words of `query` wrapped in `<mark>`, for a search result or a
filtered list. It renders inline and takes the style of where it sits, so it goes inside a heading,
a snippet or a table cell:

```tsx
<h3>
  <Highlight text={result.title} query={query} />
</h3>
```

- The query is split on spaces and each word is marked wherever it occurs, whatever its case, with
  the case of `text` kept (`alert disk` marks `Disk` and `alert` in "Disk alert"). Where two words
  start at the same place, the longer one wins.
- Every character of the query is plain text: `(a+`, `.*` and `c++` are searched for as typed, and
  none of them throws.
- Nothing is marked for an empty query, or one made of spaces.
- `text` is drawn as text: markup in it shows as written, matched or not. The component builds
  text nodes and `<mark>` elements, never HTML.
- The mark is the accent tint with the primary text colour on top, so it reads in the four themes
  and on every accent, even over muted or coloured text.

Matching is on the letters as written: it does not ignore accents (`cafe` does not mark `café`).
Filter the list yourself: `Highlight` only marks what you decide to show.
