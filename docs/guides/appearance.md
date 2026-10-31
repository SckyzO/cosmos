# Appearance

Seven settings restyle every component at once. Each one is a class or an attribute on the
`<html>` element, so a component never carries a per-theme class. Storybook has a toolbar menu for
each; the
[Foundations/Appearance](https://sckyzo.github.io/cosmos/?path=/docs/foundations-appearance--docs)
page shows them side by side.

| Setting           | On `<html>`      | Values                                                                                              | None means    |
| ----------------- | ---------------- | --------------------------------------------------------------------------------------------------- | ------------- |
| Theme             | one class        | `sand`, `dark`, `deep-blue`                                                                         | `light`       |
| Accent            | `data-accent`    | `indigo`, `violet`, `purple`, `rose`, `teal`, `cyan`, `graphite`, `red`, `orange`, `amber`, `green` | `blue`        |
| Font              | `data-font`      | `inter`, `plex`, `montserrat`, `open-sans`, `system`                                                | Outfit        |
| Text size         | `data-text-size` | `sm`, `lg`, `xl`                                                                                    | the default   |
| Density           | `data-density`   | `compact`, `comfortable`                                                                            | the default   |
| Corner radius     | `data-radius`    | `none`, `sm`, `lg`                                                                                  | the default   |
| Reading direction | `dir`            | `rtl`                                                                                               | left to right |

```html
<html
  class="sand"
  data-accent="teal"
  data-font="inter"
  data-text-size="lg"
  data-density="compact"
  data-radius="lg"
  dir="rtl"
></html>
```

The font, text size, density and radius attributes also work on an element below `<html>`, for
one part of a page.

## Themes

A theme is one class, and only one at a time.

| Theme       | Class        | Look                                         |
| ----------- | ------------ | -------------------------------------------- |
| `light`     | _(none)_     | Cool gray, the default                       |
| `sand`      | `.sand`      | Warm beige light theme                       |
| `dark`      | `.dark`      | Neutral black/gray, softened (no pure black) |
| `deep-blue` | `.deep-blue` | Navy dark theme                              |

`.dark` and `.deep-blue` both enable Tailwind's `dark:` variant.

## Accents

`data-accent` swaps the whole `--color-brand-*` scale, and with it `--color-accent` and the focus
ring. Leave it off for `blue`. The others are `indigo`, `violet`, `purple`, `rose`, `teal`,
`cyan`, `graphite`, `red`, `orange`, `amber` and `green`.

`red`, `orange`, `amber` and `green` look like the status colors (error, warning, success): a red
primary button reads as a destructive action. Offer them last in any picker, after the others.

Every theme and accent pair meets WCAG AA for body text, accent-colored links and white text on
the accent (4.5:1), and 3:1 for the focus ring. In the repository,
`pnpm --filter @sckyzo/cosmos-theme test` checks those pairs in the CSS files
(`scripts/check-contrast.mjs`), and the CI runs axe on every story, with its color contrast rule in
light, sand and deep blue.

## Fonts

`data-font` swaps `--font-sans`. Leave it off for Outfit. The others are `inter`, `plex` (IBM Plex
Sans), `montserrat`, `open-sans`, and `system`, the platform's UI font. Each one loads from its
own subpath, so import only the fonts you offer; `system` loads nothing. The mono font stays
JetBrains Mono.

```css
@import '@sckyzo/cosmos-theme/fonts'; /* Outfit + JetBrains Mono */
@import '@sckyzo/cosmos-theme/fonts/inter';
```

## Text size

`data-text-size` scales every `text-*` size to 93.75% (`sm`), 112.5% (`lg`) or 125% (`xl`). Leave
it off for 100%. Only the text grows: spacing keeps its `rem` values, so layouts keep their
density. Sizes written in pixels, such as `text-[13px]`, don't scale; use `text-2xs` (11px) and
`text-3xs` (10px) for small labels.

## Density

`data-density` tightens or loosens the vertical rhythm of every control and row at once:
`compact`, none for the default, or `comfortable`. Only the heights and the vertical padding of
rows move; panel padding, gaps and horizontal padding stay. It applies on touch screens too: the
user's choice wins.

| Token                          | Default    | `compact` | `comfortable` | Used by                     |
| ------------------------------ | ---------- | --------- | ------------- | --------------------------- |
| `h-ctrl-28` … `h-ctrl-48`      | 28–48px    | 4px less  | 4px more      | buttons, fields, segments   |
| `py-row-4` … `py-row-24`       | 4–24px     | 2px less  | 2px more      | list rows, menu items, tabs |
| `py-cell-head`, `py-cell-body` | 12px, 14px | 8px, 10px | 16px, 20px    | table cells                 |

The token is named by its default size: `h-ctrl-36` is `h-9` at the default density. The smallest control, 28px,
stays at 24px in `compact`, the WCAG 2.5.8 floor, and `py-row-5` stops at 4px for the same
reason. They are `--spacing-ctrl-*`, `--spacing-row-*` and `--spacing-cell-*` theme variables, so
any utility of the spacing scale takes them (`h-ctrl-36`, `min-h-ctrl-36`, `size-ctrl-32`,
`py-row-8`). Use them for a control or a row of your own and it follows the page.

`data-density="default"` on an element opts a part of a compact or comfortable page out (a
`DataTable` with its own `density` does this).

## Radius

`data-radius` rescales every corner at once: `none`, `sm`, none for the default, or `lg`. It
rebuilds Tailwind's own `--radius-*` variables, the ones `rounded-sm` to `rounded-4xl` read, so a
component needs nothing more than those utilities.

| Step      | `--radius-*`                    | `rounded-lg` (8px by default) |
| --------- | ------------------------------- | ----------------------------- |
| `none`    | 2px, every one                  | 2px                           |
| `sm`      | half of Tailwind's              | 4px                           |
| (default) | Tailwind's, nothing moves       | 8px                           |
| `lg`      | one and a half times Tailwind's | 12px                          |

`rounded-full` and `rounded-none` are literals and never change: avatars, status dots, switches,
badges and pill buttons stay round at every step. A corner that must follow the page goes through
the scale. A bare `rounded` is a fixed `0.25rem` in Tailwind 4, so write `rounded-sm` (the same
value, through the variable); an arbitrary `rounded-[10px]` is fixed too, and
`rounded-[calc(var(--radius-lg)*1.25)]` is not. `data-radius="default"` on an element opts a part
of the page out of its parent's radius.

## Reading direction

Set the native `dir` attribute on `<html>` or on any ancestor. Tailwind's `rtl:` variant is redefined to
follow the nearest `dir` attribute, so a `dir="ltr"` island inside a right-to-left page is not
flipped. It does not follow `dir="auto"`, nor a `dir="rtl"` nested inside such an island.
[Right to left](right-to-left.md) lists what mirrors and what does not.

## Setting them from your app

`@sckyzo/cosmos-react` exports `applyAppearance`, which sets the class and the attributes on
`<html>` (or on the element you pass as its second argument), and removes each one for its default
value. A `font`, `textSize`, `density`, `radius` or `direction` you leave out keeps its attribute
as it is. It does nothing during server rendering.

```tsx
import { applyAppearance } from '@sckyzo/cosmos-react';

applyAppearance({ theme: 'sand', accent: 'teal', density: 'compact', direction: 'rtl' });
```

For `direction`, `'rtl'` sets `dir="rtl"` and `'ltr'` removes `dir`, like the other defaults.
Saving the choice (local storage, a user profile) is up to your app. A server-rendered app writes
the attributes in its root layout instead, as the
[Next.js recipe](../getting-started.md#recipe-nextjs-app-router) does.

### Pickers

- **`AppearanceSettings`** renders the theme and accent pickers, plus the font, text size and
  density ones when their `on…Change` handlers are set. It holds nothing: you keep the state and
  apply it. It has no radius or direction picker; `Customizer` has both.
- **`AppearanceMenu`** takes the same props and puts the pickers in a panel behind an icon button,
  for example in `Topbar`'s `endActions`. Set `onReset` to add a Reset button under the groups.
- **`Customizer`** is a panel on the end side (a `Drawer`) with every choice above, plus the
  shell's layout, sidebar mode and container ([below](#customizer)).

```tsx
import { useEffect, useState } from 'react';
import { AppearanceSettings, applyAppearance, type CosmosAppearance } from '@sckyzo/cosmos-react';

function Appearance() {
  const [appearance, setAppearance] = useState<CosmosAppearance>({
    theme: 'light',
    accent: 'blue',
    font: 'outfit',
    textSize: 'md',
    density: 'default',
  });
  useEffect(() => applyAppearance(appearance), [appearance]);
  const update = (patch: Partial<CosmosAppearance>) => setAppearance((a) => ({ ...a, ...patch }));
  return (
    <AppearanceSettings
      {...appearance}
      onThemeChange={(theme) => update({ theme })}
      onAccentChange={(accent) => update({ accent })}
      onFontChange={(font) => update({ font })}
      onTextSizeChange={(textSize) => update({ textSize })}
      onDensityChange={(density) => update({ density })}
    />
  );
}
```

Pass `fonts` to offer only the fonts whose CSS the app imports
(`@sckyzo/cosmos-theme/fonts/<name>`). `themes`, `accents`, `textSizes` and `densities` narrow the
other groups the same way.

### A System theme

To offer a **System** choice that follows the device's `prefers-color-scheme`, add
`COSMOS_SYSTEM_THEME` to the themes and apply again when the device switches (it resolves to
`light` or `dark`; set `systemThemes` for another pair). Nothing changes for an app that doesn't
opt in (`ThemeToggleTri` takes a `system` prop for the same choice at the end of its cycle):

```tsx
const [appearance, setAppearance] = useState<CosmosAppearance>({ theme: 'system', accent: 'blue' });
useEffect(() => {
  applyAppearance(appearance);
  return appearance.theme === 'system'
    ? watchSystemTheme(() => applyAppearance(appearance))
    : undefined;
}, [appearance]);
// …
<AppearanceSettings {...appearance} themes={[COSMOS_SYSTEM_THEME, ...COSMOS_THEMES]} … />
```

### Customizer

`Customizer` is a panel on the end side (a `Drawer`) that puts the choices above in one place,
plus the shell's layout, sidebar mode and container, with optional presets, a Reset and a
"Copy config" that copies the value as JSON. It is controlled (`value`, and `onChange` with the
whole new value on each click) and applies nothing itself: the host applies the value on every
change:

```tsx
const [value, setValue] = useState<CustomizerValue>(CUSTOMIZER_DEFAULT_VALUE);
const [open, setOpen] = useState(false);
useEffect(() => applyAppearance(value), [value]);
const { layout, sidebar, container } = { ...CUSTOMIZER_DEFAULT_VALUE, ...value };

<Shell
  container={container}
  sidebarCollapsed={sidebar === 'collapsed' || sidebar === 'hover'}
  topbar={layout === 'horizontal' ? <Navbar>…</Navbar> : <Topbar />}
  sidebar={
    layout === 'horizontal' ? undefined : (
      <Sidebar
        variant={sidebar === 'compact' ? 'compact' : 'default'}
        expandOnHover={sidebar === 'hover' ? 'overlay' : false}
      >
        …
      </Sidebar>
    )
  }
>
  …
</Shell>
<Customizer open={open} onClose={() => setOpen(false)} value={value} onChange={setValue} />
```

| Value                                                                   | What the host does                                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `theme`, `accent`, `font`, `textSize`, `density`, `radius`, `direction` | `applyAppearance(value)`                                                         |
| `container`                                                             | `Shell`'s `container`                                                            |
| `sidebar: 'collapsed'`                                                  | `Shell`'s `sidebarCollapsed`                                                     |
| `sidebar: 'hover'`                                                      | collapsed, plus `Sidebar`'s `expandOnHover="overlay"`                            |
| `sidebar: 'compact'`                                                    | `Sidebar`'s `variant="compact"` (and `collapseControl="sidebar"` on the `Shell`) |
| `layout: 'horizontal'`                                                  | a `Navbar` in `Shell`'s `topbar` in place of the `Sidebar`                       |

Keep the `Customizer` outside what `layout` swaps, so the panel keeps its focus as the shell
re-renders. Cosmos ships no presets: pass `presets` (`{ id, label, value }`, the value being
a part of the whole) to show the section. `sections` lists the sections to show (a host with a
fixed layout leaves out `layout`, `sidebar` and `container`), `defaultValue` is what Reset
restores, and `themes`, `accents`, `fonts`, `textSizes`, `densities` and `radii` narrow the choices as
they do on `AppearanceSettings`. The
[Settings/Customizer](https://sckyzo.github.io/cosmos/?path=/docs/settings-customizer--docs)
stories wire all of it, with local storage.

## Using the theme without Tailwind

The CSS variables work in any stack, for a site that does not use Tailwind (a Docusaurus site, for
instance). Import the fonts and the variables, and read the variables yourself:

```css
@import '@sckyzo/cosmos-theme/fonts';
@import '@sckyzo/cosmos-theme/vars';
/* Then reference vars: var(--color-brand-500), var(--color-bg-base), etc. */
```

The themes, accents, fonts, text sizes, densities and radii are all in `/vars`, so the attributes
above work the same way. What only Tailwind can read is in `/tailwind`: the `@theme` block, the
`dark:` and `rtl:` variants and the focus utilities of [Tokens and focus](tokens.md).
