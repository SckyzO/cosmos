# Layout

Storybook groups: Layout, Navigation and Examples (the auth pages).

## Application shell

Storybook: [Shell](https://sckyzo.github.io/cosmos/?path=/docs/layout-shell--docs), [Sidebar](https://sckyzo.github.io/cosmos/?path=/docs/layout-sidebar--docs), [Topbar](https://sckyzo.github.io/cosmos/?path=/docs/layout-topbar--docs), [Navbar](https://sckyzo.github.io/cosmos/?path=/docs/navigation-navbar--docs), [Command Palette Trigger](https://sckyzo.github.io/cosmos/?path=/docs/overlays-command-palette-trigger--docs), [Command Palette](https://sckyzo.github.io/cosmos/?path=/docs/overlays-command-palette--docs).

`Shell` lays out a `Topbar`, a `Sidebar` and the page, and owns the sidebar's
collapsed state: `defaultSidebarCollapsed`, or `sidebarCollapsed` and
`onCollapsedChange` to control it. The Topbar shows the toggle, or the bottom of
the Sidebar does with `collapseControl="sidebar"`.

Below `lg` the sidebar leaves the layout and the Topbar's hamburger opens it as a 288px
drawer over a scrim (`defaultSidebarOpen`, or `sidebarOpen` and `onSidebarOpenChange`
to control it). It is always expanded there, with a close button in `Sidebar.Brand`, and it
closes on the scrim, Escape, a swipe toward its edge, a click on a `Sidebar.Item` and when the
viewport grows past `lg`. Pass the product logo as the Topbar's `brand` to keep it in
view while the sidebar is off screen. `drawerBackdrop` picks the drawer's scrim (`dim` by default,
`blur` or `blur-dark`, see [Scrims](../guides/tokens.md#scrims)). Any `Drawer` can close on a swipe too, with
`swipeToClose`: toward its edge on `side="start"` and `side="end"` (the left and right, swapped
under `dir="rtl"`), downward on `side="bottom"`, the
bottom sheet (full width, as tall as its content up to 85% of the viewport, a grab `handle`
you can turn off with `handle={false}`, and a `Drawer.Body` that scrolls past that height).

The expanded `Sidebar` follows its content: from `width` (264px, its minimum) it grows to
fit its widest visible row, the deep levels of a tree included, up to `maxWidth` (320px). A
label that needs more ends in an ellipsis and its row shows the full label in a tooltip. Set
`maxWidth` to the same value as `width` for a fixed width. The collapsed rail (`collapsedWidth`)
and the drawer keep their own widths.

Rows are 32px tall and 4px apart, with 16px icons; the `data-density` setting moves their height.
A `Sidebar.Section` or `Sidebar.Group` sets its block apart with 22px above its title, which is
written as given (not upper-cased) and starts on the column of the row icons, as the logo of
`Sidebar.Brand` is centred on it. The rows stand 20px from the sidebar's edges; `gutter="tight"`
brings them to 10px, the logo, the titles and the footer following. Both go through
`--cosmos-sidebar-gutter`, which an app can set for another distance. An open `Sidebar.SubMenu`
draws a thin line along its rows, under the parent's icon or just before its label;
`subMenuGuides={false}` leaves the lines out, in the collapsed rail's panel and the compact rail's
flyout too, and the indent alone shows the depth.

A `Sidebar.SubMenu` or a `Sidebar.Group` unfolds and folds back in 200 ms: its height runs from 0
to its natural size while its rows fade in and slide 4px, and the chevron turns with it. A closed
list stays mounted, `inert` and hidden from assistive technology from the moment it starts to
close, so a `Sidebar.Group` no longer unmounts its rows. The width that follows the labels is the
one of the end state: it counts the rows of a list as it opens and leaves them out as it closes,
whatever the height is doing. Collapsing the sidebar to its rail keeps the 300 ms of the width; the
labels, badges, section titles and the name next to the logo fade out in 120 ms as it narrows, and
come back once it has widened by a third. The rows draw the rail when the fade has played, and the
labels are out of the tab order and of the accessibility tree there, as they were. All of it
follows the motion setting: `prefers-reduced-motion`, or `data-motion="reduced"` on `<html>`, takes
the durations to 0 and everything happens at once.

`<Shell variant="floating">` sets the sidebar and the page apart as two cards on the base
background, 10px from the window and from each other: the sidebar with a border all round,
rounded corners and a light shadow, the topbar, the page and `secondary` together in the second
card. The sidebar takes the tight gutter (`sidebarGutter` on the Shell, or `gutter` on the
Sidebar, override it) and an edge toggle: a strip along its end edge that collapses or expands it
on click and shows a line under the pointer. The strip is for the mouse; it stays out of the tab
order, since the toggles do the same by keyboard. `edgeToggle` turns it on in an attached Shell or
outside one. Below `lg` the page fills the window as in the attached Shell.

A collapsed `Sidebar` can open while the pointer rests on it, with `expandOnHover`:
`"overlay"` opens it above the page after 150 ms, with a shadow, and the page does not move;
`"push"` widens it and the page makes room. Keyboard focus entering the sidebar does the same,
and Escape closes it. It only applies from `lg` up, on a pointer that can hover, never in the
drawer, and it does not touch the collapsed state: `onCollapsedChange` is not called and the
toggles keep their state.

`SidebarToggle` is that toggle, to place anywhere else in the Shell (a header of
your own, the Topbar's `startActions`, the Sidebar's `footer`) with no props: it
reads the Shell's state, and every toggle stays in sync. Outside a Shell, pass it
`collapsed` and `onCollapsedChange`.

```tsx
<Shell
  topbar={<Topbar pageTitle="Servers" />}
  sidebar={<Sidebar footer={<SidebarToggle variant="panel" />}>{/* items */}</Sidebar>}
>
  {/* page */}
</Shell>
```

### Search in the Topbar

`CommandPaletteTrigger` is a button drawn like a search field (a magnifier, a placeholder and the
hotkey as a key hint, `⌘K` on Apple platforms and `Ctrl K` elsewhere) that opens a
`CommandPalette`. It is not an input: the palette holds the field, so a screen reader announces a
button that opens a dialog. Put it in the Topbar's `center` slot. Below `sm` it is a square icon
button, and the placeholder stays as its accessible name. `size` takes the form fields' `sm`, `md`
and `lg`. From `sm` up the `center` slot asks for 12rem: a long `pageTitle` is cut before the
search is squeezed.

The palette owns the hotkey (`hotkey`, `mod+k` by default) and the open state; the button
registers no listener of its own. Open the palette from its `onClick`, and pass the same hotkey
as `shortcut` so the hint is the right one (`shortcut={null}` for a palette without a hotkey).

```tsx
const [open, setOpen] = useState(false);

<Topbar
  pageTitle="Projects"
  center={<CommandPaletteTrigger placeholder="Search projects" onClick={() => setOpen(true)} />}
/>
<CommandPalette open={open} onOpenChange={setOpen}>
  <CommandPalette.Input placeholder="Search…" />
  <CommandPalette.List>{/* items */}</CommandPalette.List>
</CommandPalette>
```

### Layout modes

`Sidebar variant="compact"` is a fixed 88px rail with the label under each icon, on two lines
at most (a tooltip carries the full name of a label that is cut). A `Sidebar.SubMenu` opens in a
flyout, as in the collapsed rail. It has no collapsed state, so `collapsed`, `expandOnHover` and
the bottom button do nothing: inside a Shell, set `collapseControl="sidebar"` so the Topbar shows
no hamburger that would do nothing. Below `lg` the drawer shows the default sidebar.

`Shell container="boxed"` centres the topbar, the sidebar and the page in a column of at most
1440px, with the page background on both sides. `fluid`, the default, spans the window.

A top navigation is a composition: a `Shell` with no `sidebar` and a `Navbar` in `topbar`. Its
`Navbar.Items` take `Navbar.Item` and `Navbar.Menu`, a dropdown group of links (`Menu.Item` with
an `href`, a `Menu.Group`, a `Menu.Separator`) that follows the menu button pattern: Enter, Space
and the arrows open it, the arrows move between the links, Escape closes it and gives the focus
back to the trigger, Tab leaves it. Mark the group `active` while one of its links is the current
page, and that link with `aria-current="page"`. Items that do not fit move, from the last, into a
"More" menu (`moreLabel` renames it) and come back when there is room. Only `Navbar.Item` and
`Navbar.Menu` placed directly in `Navbar.Items` move; `Navbar.Items` inside a `Navbar.Brand` takes
the room the bar leaves, and anywhere else it needs a bounded width (`min-w-0 flex-1`) to measure
against. Below `md` the items leave the bar and `Navbar.MobileMenuButton` opens your own menu.

```tsx
<Shell
  container="boxed"
  topbar={
    <Navbar>
      <Navbar.Brand>
        <Navbar.MobileMenuButton />
        <Navbar.Items>
          <Navbar.Item href="/" active>
            Dashboard
          </Navbar.Item>
          <Navbar.Menu label="Settings">
            <Menu.Item href="/profile">Profile</Menu.Item>
            <Menu.Item href="/team">Team</Menu.Item>
          </Navbar.Menu>
        </Navbar.Items>
      </Navbar.Brand>
    </Navbar>
  }
>
  {/* page */}
</Shell>
```

## Section cards

Storybook: [Section Card](https://sckyzo.github.io/cosmos/?path=/docs/layout-section-card--docs).

`SectionCard` is the card of a page: a title with an optional icon and description, then a body.
Its root is a `<section>` named by the title, so a screen reader lists the cards of a page as
regions. Give each card of a page its own title: two regions with one name fail axe's
`landmark-unique`, and so does a table whose caption repeats the title of its card. `as` picks the
heading (`h3` by default, `h2` under a page whose `PageHeader` is the `h1`). `titleRef` is a ref to
that heading, for a page that moves the focus to the card (a link or a filter that leads to it):
with it the heading takes `tabIndex={-1}`, so `focus()` reaches it and Tab never stops on it.
`className` goes on the root, for a grid span (`lg:col-span-2`) or a margin.

`action` puts a button, a menu or a link at the end of the header. Below `sm` it goes under the
title, in every card, so the cards of a grid stay aligned.

A card can load, come back empty or fail on its own: `loading`, `empty` and `error` replace the
body, and the header, action included, stays, so the reader knows which card it is and the rest of
the page is untouched. When several are set, `loading` wins over `error`, which wins over `empty`:
"Try again" sets `loading` while `error` is still true, and the skeleton comes back in front of the
error.

```tsx
<SectionCard
  title="Revenue over time"
  desc="Weekly, last 30 days"
  action={<RangeMenu />}
  loading={query.isPending}
  error={query.isError}
  errorMessage="Couldn't load revenue"
  errorDescription="The request timed out."
  onRetry={() => query.refetch()}
  empty={query.data?.length === 0}
  emptyMessage="No revenue yet"
  emptyAction={<Button size="sm">Connect your store</Button>}
>
  <LineAreaChart ... />
</SectionCard>
```

- `loading` draws a skeleton, sets `aria-busy` on the card and adds a status line for screen
  readers ("Loading Revenue over time…"). When it ends, the body fades in over 200ms; a card that
  never loaded does not fade.
- `error` shows an `ErrorState` (announced as an alert); `onRetry` adds the "Try again" button.
  `errorMessage` defaults to "Something went wrong.", and `errorDescription` adds a line under it.
- `empty` shows an `EmptyState` titled `emptyMessage` (default "No data"), with `emptyAction`
  under it. For a richer one (an icon, a description), leave `empty` off and pass your own
  `EmptyState` as `children`.
- The action stays visible in every state. A "View all" link that means nothing on an empty card
  is yours to remove: `action={empty ? undefined : <ViewAll />}`.
- The body takes the height the row of a grid gives the card, and the state is centred in it.
  `minBodyHeight` (a Tailwind class, `min-h-72`) is for a card alone in its row, or whose chart
  has a fixed height: the body keeps that height in every state, so the card does not jump when
  the data arrives.

The title is 16px and the description 14px (they were 14px and 12px up to 0.5.0), with 16px
between the header and the body.

### Surface, header and behavior

All of these are options and none changes a card that does not use them. A `SectionCard` without
them is the card it was.

```tsx
<SectionCard
  title="Critical alerts"
  desc="+1 in the last hour"
  icon={Bell}
  intent="danger"
  halo
  flush
  size="md"
  badge={<StatusBadge status="CRIT" label="4" />}
  footer={
    <>
      <span>4 critical, 6 warning</span>
      <Button variant="link" size="sm">
        Show all 15 alerts
      </Button>
    </>
  }
>
  <Table aria-label="Critical alerts firing now">…</Table>
</SectionCard>
```

- `intent` is what the card means, `neutral` (default), `brand`, `info`, `success`, `warning` or
  `danger`, and `variant` is its surface. `outline` (default) is the plain card with the intent
  coloring its border. `tinted` gives the card a tint of the intent as its background, in a
  colored border. `solid` fills it with the intent and writes in white (in dark ink on the
  warning orange, the theme's `--color-warning-500`); a neutral solid card is dark in the light
  themes and light, with dark ink, in the dark ones. Solid is for simple
  content, a figure and a sentence: a `Table`, a chart or a form keeps its own colors and does
  not read on a fill. The icon tile follows the intent unless `iconTone`, `iconColor` or
  `iconBg` say otherwise; on a solid card it is drawn in the card's ink and ignores them.
- `halo` draws the card's edge in a gradient of two hues of its intent (brand to violet, info to
  brand, success to cyan, warning to yellow, danger to pink, two grays for neutral) and a blurred
  copy of the gradient behind it. It works on any variant, is static, takes no room and does not
  move the card. It is drawn outside the card, so leave `haloSize` of space around it: an
  ancestor with `overflow-hidden` cuts it. `haloSize` is `sm`, `md` (default) or `lg`: how far
  the glow reaches and how much it is blurred (2px and 8px, 4px and 16px, 8px and 24px).
- `accent` puts a band of 4px on one side of the card and `accentSide` picks it: `top`
  (default), `bottom`, `start` or `end`, the last two following the reading direction. The rest
  of the card keeps its colors, and `accent` takes any intent, whatever the card's own.
- `iconPosition` places the icon tile before the title (`start`, default), at the end of the
  title block, before the `action` (`end`), or above the title (`top`). `iconShape` is a rounded
  `square` (default) or a `round`.
- `badge` stands next to the title: a `StatusBadge`, a count. It wraps under the title when the
  row is too narrow.
- `footer` goes under the body, full width, set off by a line. Its children share one row, the
  first at the start and the last at the end. It stays at the bottom of the card in a grid, and
  in every state, like `action`.
- `flush` runs the body edge to edge under the header, with a line above it and no padding, down
  to the bottom edge of the card or to its footer: for a `Table` or a list. A `Table` or
  `DataTable` put directly in it gives up its own border and corners, the card draws them, and its
  first and last columns line up with the card's padding; so do a `DataTable`'s tabs, toolbar and
  pager. In `loading`, `error` and `empty` the state is padded as usual.
- `size` is the padding of the card: `sm` (16px), `md` (20px) or `lg` (24px, default). The gap
  between the header and the body goes from 16px to 12px with `sm` and `md`.
- `collapsible` adds a toggle at the end of the header that folds the body, and the footer with
  it; the header, its badge and its action stay. The toggle is a button named "Toggle" and the
  title, with `aria-expanded` and `aria-controls`, and the folded body is out of the tab order.
  `defaultOpen` (default `true`) starts it folded when `false`; `open` and `onOpenChange(open)`
  are the usual controlled pair, and only read with `collapsible`. Below `sm` the toggle stays
  on the title's row and the action goes under it.
- `stale` dims the body to 65% and shows `staleLabel` ("Stale" by default; say how old:
  `staleLabel="Stale · 4 min ago"`) by the title. That is all it does. What to show of the last
  data under a failure is yours: the cause in `desc` and a "Retry" in `action` keep the header
  telling what happened, and neither is dimmed. Inside the dimmed body the secondary and muted
  text colors read as the primary one, because their own would drop under 4.5:1; a color you set
  with your own class is only dimmed. A `solid` card is not dimmed (white ink over its fill
  cannot be), and neither is a `loading`, `error` or `empty` state: the label says it.

## Site footer

Storybook: [Site Footer](https://sckyzo.github.io/cosmos/?path=/docs/layout-site-footer--docs).

`SiteFooter` is the footer of a public page, the counterpart of `Navbar`. It is a `footer`
landmark, which the browser exposes as the page's `contentinfo` when it comes after `main`
instead of sitting inside it, built from parts:

- `SiteFooter.Brand`: the logo and name (any node), a link when it has an `href`, and a line
  under it with `description`.
- `SiteFooter.Column`: a list of `SiteFooter.Link`s under its `title`. Each column is a `nav`
  named by its heading, so a screen reader lists "Shop", "Help" and "Studio" as three landmarks,
  and the names have to differ.
- `SiteFooter.Aside`: a free slot for what has no part of its own, a newsletter form or the
  social links. Compose the form from `Input` and `Button`. To name the slot, give it
  `role="group"` and an `aria-labelledby` pointing at a `SiteFooter.Title`, the heading of a
  column, which also follows `theme`.
- `SiteFooter.Banner`: a full-width band above the columns for one call to action, usually the
  newsletter. It goes first and the bottom row goes last, wherever they come among the parts.
- `SiteFooter.Bottom`: the copyright as children and the legal links as `links`
  (`{ label, href }`, plus any anchor prop such as `aria-current`) in a `nav` named `Legal`
  (`linksLabel` renames it).

```tsx
<SiteFooter>
  <SiteFooter.Brand href="/" description="Slow-made ceramics and lighting.">
    <Logo /> Harbor &amp; Pine
  </SiteFooter.Brand>
  <SiteFooter.Column title="Shop">
    <SiteFooter.Link href="/shop">All products</SiteFooter.Link>
    <SiteFooter.Link href="/shop/lighting">Lighting</SiteFooter.Link>
  </SiteFooter.Column>
  <SiteFooter.Column title="Help">
    <SiteFooter.Link href="/help/shipping">Shipping</SiteFooter.Link>
    <SiteFooter.Link href="/help/returns">Returns</SiteFooter.Link>
  </SiteFooter.Column>
  <SiteFooter.Aside role="group" aria-labelledby="letter">
    <SiteFooter.Title id="letter">The studio letter</SiteFooter.Title>
    <NewsletterForm />
  </SiteFooter.Aside>
  <SiteFooter.Bottom
    links={[
      { label: 'Terms of sale', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ]}
  >
    &copy; 2026 Harbor &amp; Pine Studio
  </SiteFooter.Bottom>
</SiteFooter>
```

The links go through `LinkProvider` like those of the other components, and `aria-current="page"`
marks the current page in bolder text. The parts are direct pieces of one wrapping row, so any
number of columns works and a part can sit inside a component of your own; the order you write
them in is the reading and tab order.

`variant="compact"` puts the same parts on one line at `lg` and up, for the pages where the big
footer would push the main action away, the cart and the checkout: the brand name (its
description is dropped), the links of the column with its title kept for screen readers only, the
copyright and legal links, and the `Aside` at the end of the line. Below `lg` the parts stack and
wrap. `SiteFooter.Banner` is for the `full` variant.

For a simple footer, give `compact` a `SiteFooter.Bottom` and nothing else. Alone, it spreads over
the line by itself: the copyright at the start, the legal links at the end, and the two stack on a
phone.

`theme` is `light` (default, follows the page theme like the light `Navbar`) or `dark`, which
stays dark in every theme, the usual footer of a storefront with a light page. Keep the same
`theme` on the `Navbar` and the footer to have the two match. `maxWidth` is `7xl` (default, the
width of `Navbar`'s content) or `none`.

On a wide screen the brand, the columns and the `Aside` share one row (in the proportion 3, 2
each, 4); from `sm` the columns take a third of the row each, with the brand above and the
`Aside` below; under `sm` they go two by two, and the brand and the `Aside` take the full row.
Everything is laid out with logical properties: in right to left the brand moves to the right
and the order of the columns, the legal links and the icons reverses.

## Split panes

Storybook: [SplitView](https://sckyzo.github.io/cosmos/?path=/docs/layout-splitview--docs).

`SplitView` puts two or three `SplitView.Pane` side by side in one bordered frame (mail,
chat, a file manager). It fills the height of its parent and each pane scrolls on its own;
`width` is a Tailwind class (`w-56`), and a pane without one takes the remaining space. Below
`collapseBelow` (`md`, `lg` by default, `xl`) only the active pane shows. Control it with
`activePane` and `onActivePaneChange`, or start it with `defaultActivePane` and switch from
inside with `useSplitView()`; the pane that appears takes focus. A Back button is yours to
place. Below `collapseBelow` a change of pane moves the later of the two panes over the other: it
slides in from the end of the line in 300ms (from the left in right to left), and slides out the
same way when the view goes back to an earlier pane. The pane that stays is under it, out of reach
and of the accessibility tree, until the slide has played. Side by side nothing moves, and under
the reduced motion setting the panes change at once.

```tsx
<SplitView activePane={pane} onActivePaneChange={setPane}>
  <SplitView.Pane id="list" label="Messages" width="w-80">
    {/* list */}
  </SplitView.Pane>
  <SplitView.Pane id="detail" label="Message">
    {/* detail */}
  </SplitView.Pane>
</SplitView>
```

## Auth layouts

Storybook: [Auth Layout](https://sckyzo.github.io/cosmos/?path=/docs/examples-auth-auth-layout--docs).

`AuthLayout` wraps the sign-in, sign-up, reset and two-step forms. `variant` picks the page:
`card` (default) is a centered card; `split` puts the form beside a brand panel; `cover`
centres the card over a full-bleed image.

```tsx
<AuthLayout variant="split" logo={Activity} title="Cosmos Cloud" subtitle="Monitor every rack.">
  <SignInForm />
</AuthLayout>
<AuthLayout variant="cover" cover={{ src: '/login.jpg' }} logo={Activity} title="Cosmos Cloud">
  <SignInForm />
</AuthLayout>
```

In `split`, `aside` replaces the default panel (an accent surface with the `logo`, `title` and
`subtitle`; `null` for none), `asidePosition` (`start` | `end`, default `end`) picks its side. The
panel shows from `lg` up; below, the brand block sits above the form. In `cover`, `cover.src` is
drawn under a dark scrim (`cover.alt` is empty unless set), and without it the card sits on a
gradient of the accent. In every variant the built-in title is a paragraph: the forms carry the
page's `h1`.

`size` is the width of the card (of the form column in `split`): `md` (448px, the default), `lg`
(512px) or `xl` (672px), the widths of `Modal`'s sizes. It suits a step of an onboarding wizard
that needs more room than a sign-in form. `md` pads the card by 32px; `lg` and `xl` pad it by 24px
below `sm` and 32px from there, so a phone keeps room for the form.

```tsx
<AuthLayout size="xl" logo={Activity} title="Cosmos">
  <PlanStep />
</AuthLayout>
```

## Auth forms

Storybook: [New Password Form](https://sckyzo.github.io/cosmos/?path=/docs/examples-auth-new-password-form--docs), [Two Step Verification Form](https://sckyzo.github.io/cosmos/?path=/docs/examples-auth-two-step-verification-form--docs), [Sign Up Form](https://sckyzo.github.io/cosmos/?path=/docs/examples-auth-sign-up-form--docs).

Reset a password in two routes, each with its own form. `ResetPasswordForm` takes the e-mail
address on the first one and shows its `sent` view. `NewPasswordForm` is the page the e-mail link
opens: a new password and its confirmation, with `view` choosing the screen.

```tsx
// /forgot-password
<ResetPasswordForm onSubmit={sendLink} sent={sent} sentEmail={email} signInHref="/sign-in" />

// /reset-password?token=…
<NewPasswordForm
  view={view} // 'form' (default) | 'expired' | 'done'
  onSubmit={(password) => updatePassword(token, password)}
  requestHref="/forgot-password"
  signInHref="/sign-in"
/>
```

On `form` the submit button stays disabled until the password follows every rule and the
confirmation matches. The mismatch shows when the confirmation field is left (its show/hide button
is part of it), not on every key, and a screen reader announces it as it appears; a match is
confirmed in words. `expired` is the link that no longer works: it offers `requestHref` to ask for
another and `signInHref` to go back. `done` thanks the person and links to `signInHref`. Each view
has one `h1`; `loading` and `error` follow the request, as on the other auth forms.

When you switch `view` (or `sent`, on `ResetPasswordForm`), the button that was pressed leaves with
its screen and the focus would fall to the page. The form moves it to the heading of the new
screen instead, so a keyboard or screen reader user starts reading from the top of it. It does so
only when the focus was lost with the old screen: if the person had moved it elsewhere on the page,
it stays there, and the first screen never takes the focus when it mounts (it would scroll the page).

The password policy is `rules`, a function of the password that returns the rules to list (the
`PasswordRule`s of `PasswordPolicyChecker`). It defaults to `defaultPasswordRules`; an empty list
shows none and asks only for a non-empty password. `strength` takes a function that scores the
password from 0 to 4 and shows a `PasswordStrengthMeter` under the field once something is typed;
without it nothing is drawn, and Cosmos bundles no estimator (see
[Password strength](forms.md#password-strength)). `SignUpForm` takes the same two props, so one
policy and one meter can serve both pages:

```tsx
const policy = (password: string) => [
  { label: 'At least 14 characters', ok: password.length >= 14 },
  { label: 'One number', ok: /\d/.test(password) },
];

<NewPasswordForm rules={policy} strength={estimate} onSubmit={…} />
<SignUpForm rules={policy} strength={estimate} onSubmit={…} />
```

### Waiting between two resends

`ResetPasswordForm` takes `resendCooldown` for its `sent` view: the seconds the "Resend" button waits
before it can be pressed again. It counts from the moment the view shows, since the e-mail was just
sent, and restarts on each press. While it waits, the button is `aria-disabled`, not `disabled`: it
stays in the tab order and keeps the focus a keyboard user gave it, a press does nothing, and a
screen reader reads the countdown ("available in 0:30") as its description. The countdown changes
every second and is not a live region. One polite status says when a new link went out and when the
button works again, and nothing else. `loading` still disables the button for real, and without
`resendCooldown` the button is as it was. The server stays the authority: show a refusal (a 429)
through `error`. The form's `labels` take the words to translate: `resent`, `ready` and
`availableIn(seconds)`.

```tsx
<ResetPasswordForm
  sent
  sentEmail={email}
  onResend={resend}
  resendCooldown={30}
  onSubmit={sendLink}
/>
```

### Two-step verification

`TwoStepVerificationForm` takes the six-digit code. Two opt-in props add to it, and a page that sets
neither renders as before.

`backupCode` offers a link to a backup-code entry in the same card: a text field with no length or
format check, no automatic submit, and a link back to the code. `method` (`'code'` | `'backup'`),
with `defaultMethod` and `onMethodChange(method)`, says which one shows; set `method` to own it.
`onSubmit(code, method)` gets the method the code was typed for, and the backup code trimmed. Each
entry starts empty when the other is picked, and focus moves to the new field. On the backup entry
`error` shows under the field and does not say whether the code was already used; on the code it is
the banner above the cells.

`resendCooldown` makes the "Resend code" button wait as described in [Waiting between two
resends](#waiting-between-two-resends), from the moment the form shows (a code was just sent). It is
hidden on the backup entry, which has nothing to resend.

```tsx
<TwoStepVerificationForm
  backupCode
  sentTo="ada@example.com"
  onSubmit={(code, method) => (method === 'backup' ? useBackupCode(code) : verify(code))}
  onResend={resend}
  resendCooldown={30}
/>
```

`labels` takes the words to translate: the title, description and field of the backup entry
(`backupTitle`, `backupDescription`, `backupField`), the two links (`useBackupCode`,
`useVerificationCode`) and the three words of the wait (`resent`, `ready`, `availableIn`).

### Translating the forms

The words of `SignInForm`, `SignUpForm`, `ResetPasswordForm`, `NewPasswordForm`,
`TwoStepVerificationForm` and `SocialAuthButtons` are their `labels`: translate them once with
`LabelsProvider` ([Translating](../guides/translating.md)), under the keys `signInForm`,
`signUpForm`, `resetPasswordForm`, `newPasswordForm`, `twoStepVerificationForm` and
`socialAuthButtons`, or for one form with its own `labels` prop, which wins. They cover the field
labels, the buttons, the lines of the `sent`, `expired` and `done` views, the sample placeholders
(`john@example.com`, `John`, `Doe`) and the words of the resend wait. A sentence that holds a link or
a value is a function of it: `signUpForm.agree: (terms, privacy) => …` gets the two links, drawn, and
`resetPasswordForm.sentDescription: (email) => …` the address, isolated for right to left.
`SocialAuthButtons` takes `continueWith: (name) => …` for its buttons and `divider` for the line
between them. `title` and `description` stay props, the text a page writes for itself, and win over
the labels. The default password rules (`defaultPasswordRules`) are worded by the `minLength`,
`uppercase`, `lowercase`, `number` and `symbol` keys of `passwordPolicyChecker`, and the strength
meter by `passwordStrengthMeter` (`name` and `levels`); a form given its own `rules` writes its own.
