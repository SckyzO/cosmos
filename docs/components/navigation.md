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

## Sticky scroll nav

Storybook: [Sticky Scroll Nav](https://sckyzo.github.io/cosmos/?path=/docs/navigation-sticky-scroll-nav--docs).

On a long page, `StickyScrollNav` pins a row of buttons at the top, one per section
(`sections={[{ id, label }]}`), as on a settings page. A button scrolls to the element with its `id`
and lands it just under the row, so the heading stays visible. The button of the section being
read carries `aria-current="location"` and the accent tint, and follows the scroll. `topOffset`
keeps the row below a fixed header, and `onNavigate` replaces the scroll with your own. Below
`sm` the row becomes a native select named by `jumpLabel` that shows the section being read and
goes to the one picked.

```tsx
<StickyScrollNav
  topOffset={8}
  sections={[
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
  ]}
/>
<section id="profile">…</section>
<section id="security">…</section>
```

## Tabs

Storybook: [Tabs](https://sckyzo.github.io/cosmos/?path=/docs/navigation-tabs--docs).

In `Tabs` the underline of the `underline` variant, and the fill of `pills` and `raised`, are one
element that slides from the active tab to the next in 200ms, easing in and out, along the line
(from the end in right to left, as the tabs are). It is measured again when a tab changes size, with
the text size or a web font, and it is placed with no transition the first time. Until it is
measured (a server render) the active tab draws its own line or fill. `folder` has no marker: its
active tab is joined to the panel. Under the reduced motion setting the marker jumps.
