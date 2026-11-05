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
- `noun` builds the labels ("Previous order"); `labels` (`previous` and `next`, functions of the
  noun, `back`, `count`, `landmark`, `noun`) replaces any of them, for another language. `count` receives the position and the total as nodes,
  already set apart in medium weight as in "12 of 340", so a translation keeps them that way:
  `count: (position, total) => <>{position} sur {total}</>`.
- `variant="compact"` draws icon buttons (still named) and the count, for a `PageHeader`'s `actions`.
- Below `sm`, the default variant shows the icons only too, so a long label never wraps; the label
  stays the button's name.
- Shortcuts are off unless `hotkeys` is given. They listen on the document, do nothing while a
  field is being typed in, and click the control, so a link goes through your router. List them
  yourself in a `HelpOverlay`.

## Stepper

Storybook: [Stepper](https://sckyzo.github.io/cosmos/?path=/docs/navigation-stepper--docs).

In the default `indicators` variant, a connector is a gray line with an accent fill that grows
along it when the step before it completes: from the start of the line in a horizontal stepper (so
from the right in right to left), downward in a vertical one, over `--cosmos-motion-slow` (300ms).
The check then comes in over the number or the icon, in 120ms, once the line has filled. Going back
empties the line the same way and brings the number back at once. Nothing plays on the first
render: a stepper that starts at step 3 is drawn as it is. The number of a completed step is
hidden from assistive technology, as the step never exposed it. `bars` and `panels` have no
connector and change at once. Under the reduced motion setting everything does.

## Sticky scroll nav

Storybook: [Sticky Scroll Nav](https://sckyzo.github.io/cosmos/?path=/docs/navigation-sticky-scroll-nav--docs).

On a long page, `StickyScrollNav` pins a row of buttons at the top, one per section
(`sections={[{ id, label }]}`), as on a settings page. A button scrolls to the element with its `id`
and lands it just under the row, so the heading stays visible. The button of the section being
read carries `aria-current="location"` and the accent tint, and follows the scroll: the tint is one
element that slides from button to button (200ms, easing in and out, as the underline of `Tabs`),
placed with no transition the first time and after a resize. `topOffset`
keeps the row below a fixed header, and `onNavigate` replaces the scroll with your own. Below
`sm` the row becomes a native select named by `labels.jump` that shows the section being read and
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

## Vertical navigation

Storybook: [Vertical Navigation](https://sckyzo.github.io/cosmos/?path=/docs/navigation-vertical-navigation--docs).

In `VerticalNavigation` the background of the active item (`active`, which sets
`aria-current="page"`) is one element that slides to the item you pick in 200ms, easing in and out,
across the items of its sections too. It is placed with no transition the first time and after a
resize, follows the reading direction, and until it is measured (a server render) the item draws
its own background. Under the reduced motion setting it jumps.
