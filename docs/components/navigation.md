# Navigation

Storybook group: Navigation. For the links of the components and your router, see [Links and your router](../guides/refs-and-routing.md#links-and-your-router).

## Record pager

Storybook: [Record Pager](https://sckyzo.github.io/cosmos/?path=/docs/navigation-record-pager--docs).

`RecordPager` moves through the records of a list from a detail page: "12 of 340", Previous, Next
and an optional "Back to list". `Pagination` stays for pages of a list; the order and filters of the
list are the host's to keep (URL or state).

```tsx
<RecordPager
  position={12}
  total={340}
  noun="order"
  previousHref="/orders/20430"
  nextHref="/orders/20432"
  backHref="/orders"
  hotkeys={{ previous: '[', next: ']' }}
/>
```

- Links when `previousHref` / `nextHref` are given (through `LinkProvider`), buttons with
  `onPrevious` / `onNext` otherwise. A side with nowhere to go, or at the first or last record, is a
  disabled button, never a link.
- `noun` builds the labels ("Previous order"); `labels` (`previous`, `next`, `back`, `count`)
  replaces any of them, for another language.
- `variant="compact"` draws icon buttons (still named) and the count, for a `PageHeader`'s `actions`.
- Below `sm`, the default variant shows the icons only too, so a long label never wraps; the label
  stays the button's name.
- Shortcuts are off unless `hotkeys` is given. They listen on the document, do nothing while a
  field is being typed in, and click the control, so a link goes through your router. List them
  yourself in a `HelpOverlay`.
