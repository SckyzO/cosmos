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
view while the sidebar is off screen. Any `Drawer` can close on a swipe too, with
`swipeToClose`: toward its edge on `side="start"` and `side="end"` (the left and right, swapped
under `dir="rtl"`), downward on `side="bottom"`, the
bottom sheet (full width, as tall as its content up to 85% of the viewport, a grab `handle`
you can turn off with `handle={false}`, and a `Drawer.Body` that scrolls past that height).

The expanded `Sidebar` follows its content: from `width` (264px, its minimum) it grows to
fit its widest visible row, the deep levels of a tree included, up to `maxWidth` (320px). A
label that needs more ends in an ellipsis and its row shows the full label in a tooltip. Set
`maxWidth` to the same value as `width` for a fixed width. The collapsed rail (`collapsedWidth`)
and the drawer keep their own widths.

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
and `lg`.

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

## Split panes

Storybook: [SplitView](https://sckyzo.github.io/cosmos/?path=/docs/layout-splitview--docs).

`SplitView` puts two or three `SplitView.Pane` side by side in one bordered frame (mail,
chat, a file manager). It fills the height of its parent and each pane scrolls on its own;
`width` is a Tailwind class (`w-56`), and a pane without one takes the remaining space. Below
`collapseBelow` (`md`, `lg` by default, `xl`) only the active pane shows. Control it with
`activePane` and `onActivePaneChange`, or start it with `defaultActivePane` and switch from
inside with `useSplitView()`; the pane that appears takes focus. A Back button is yours to
place.

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
`card` (default) is a centred card; `split` puts the form beside a brand panel; `cover`
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
