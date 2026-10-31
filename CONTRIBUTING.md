# Contributing to Cosmos

## Setup

The host needs only `docker`, `git`, `gh`, `make`, `bash`.

```bash
git clone git@github.com:SckyzO/cosmos.git
cd cosmos
make build-image          # Build cosmos-dev (first time, under a minute)
make install              # pnpm install + Playwright browsers, inside the container
```

## Daily workflow

```bash
make storybook            # http://localhost:6006 — component playground
make test                 # Unit tests (Vitest, Node), story tests (Vitest browser mode), e2e and the theme contrast check
make check-changed        # Before pushing: the CI cut down to what you changed
make ci                   # Full CI, one step after the other (check-changed runs its steps when a change needs them)
```

`make check-changed` runs only what your change can break:

- **Documentation only** (Markdown, `docs/`, pictures): Prettier on those files.
- **Component sources and the stories of `apps/storybook/stories`**: Prettier, ESLint, the
  typecheck, the unit tests and the story files that use what you changed, in the default,
  contrast and right-to-left passes.
- **Anything else** (theme CSS, Storybook or Vitest config, dependencies, workflows, e2e specs,
  Docker, MDX): lint, format, typecheck, the builds and the tests, then the three contrast passes
  and the right-to-left pass side by side, one container each. They need 13 GB of available
  memory; below that the check skips them, says so, and passes: push, and the PR's CI runs
  them. `make ci` runs them one after the other.

On GitHub, a pull request that changes only documentation runs none of the heavy jobs; the
required "Lint + typecheck + test + build" check still reports, and passes.

## Tests

- **Unit tests** — `packages/*/src/**/*.test.ts`, next to the module they cover. Vitest in plain
  Node, no browser and no DOM: the `node` project of `apps/storybook/vitest.config.ts`. They are for
  pure logic (helpers, formatting, pagination, filtering, appearance), and take milliseconds.
- **Component tests** — the stories, run by Vitest in a headless Chromium (the `storybook`
  project). They cover what needs a real DOM: rendering, focus, interaction, theming, and
  accessibility (see [Accessibility](#accessibility)).
- **E2E** — Playwright against Storybook, in `tests/e2e`.

`pnpm --filter '@cosmos/storybook' test` runs both Vitest projects, so `make test`, `make ci` and
the CI workflow run the unit tests with the rest. To run only them, or only some of them:

```bash
./devctl run pnpm --filter '@cosmos/storybook' exec vitest run --project=node
./devctl run pnpm --filter '@cosmos/storybook' exec vitest run --project=node pageList
./devctl run pnpm --filter '@cosmos/storybook' exec vitest run --project=node -t 'test name'
./devctl run pnpm --filter '@cosmos/storybook' exec vitest --project=node   # watch mode
```

Test only a function that already is pure. A function that reads `document` or `getComputedStyle`
belongs to a story, unless it can take the element as a parameter (as `applyAppearance` does); a
stand-in object with the few members it touches is enough in Node. Logic buried in a component moves
to a module of its own first, in a separate `refactor` commit that changes nothing else.

`*.test.ts` files stay out of the published packages (tsup bundles from `src/index.ts` only) and
are type-checked by `apps/storybook`, which compiles the packages from source: `vitest` is mapped in
its `tsconfig.json` because the packages do not depend on it.

### Accessibility

Every story test runs axe (addon-a11y) once the story has rendered and its play function has
finished, and any violation fails the test. The exceptions are listed in
`apps/storybook/.storybook/a11y-todo.json`: story id → the axe rules it still violates. #265 burned
it down to `{}`; it stays as the escape hatch for known debt. A listed story runs in the addon's
`todo` mode, so its violations are warnings in the Storybook Accessibility panel, but it must
violate exactly the rules of its entry:

- a listed rule that stops firing fails the test until it is removed from the entry, and a story
  with no violation left fails until its entry is deleted;
- a rule that is not listed fails the test as well: an entry never grows. Fix the violation.

A new story goes on the list only with rules its component's other entries already carry: a test
story of a component with known debt (say, `label` on every NumberInput story) inherits that debt
instead of forcing its fix into an unrelated change. A rule the component doesn't have yet is a
regression: fix it.

The gate is wired in `apps/storybook/.storybook/a11y-gate.ts`.

axe checks contrast in every theme. The story tests run every rule in the default `dark` theme;
the contrast pass renders every story again in `light`, `sand` and `deep-blue` and runs only
`color-contrast`. A story that pins its theme with `globals` keeps it, and play functions run as
in the story tests, so they must hold in every theme. The todo list only covers the default theme:
the contrast pass has none, and any violation fails it. CI runs it in one job per theme, `make ci`
one theme after the other:

```bash
make test-contrast                    # light, sand and deep-blue
A11Y_THEME=sand make test-contrast    # one theme
```

The direction pass renders every story again under `dir="rtl"` on `<html>` (the Direction menu of
the toolbar, `&globals=direction:rtl`), with every axe rule and the play functions, and fails a
story whose page scrolls sideways in right to left and not in left to right. A story that pins
`globals.direction` keeps its own. CI runs it as its own job, "Story tests (right to left)", and
`make ci` as its last step:

```bash
make test-rtl                         # or: STORY_DIR=rtl, in the container, with the a11y:rtl script
```

After fixing a story, edit its entry by hand as the failure message says, in the same commit as the
fix. After a change that fixes many stories at once (a theme token, a shared component), rewrite
the list instead:

```bash
./devctl run pnpm --filter '@cosmos/storybook' a11y:todo
```

It runs every story and writes the stories that violate a rule today, sorted by id and
prettier-formatted. It exits non-zero when the list was out of date, since those stories failed
during the run, and writes nothing after a filtered run (a file or `-t`). Its diff should only
remove lines, apart from new stories carrying their component's known rules.

To see what a story violates, open it in Storybook (`make storybook`), Accessibility panel. Entries
are keyed by story id, so `grep '"forms-number-input--' apps/storybook/.storybook/a11y-todo.json`
lists a component's.

### Visual review

Screenshots are for a person to look at: they assert nothing, and nothing visual runs in CI. Every
story in four themes is 4,680 images, more than anyone reads, so the review is local and per
component. Before you open a PR that changes how a component looks, run the visual diff on the
components you touched, open the report, check that every change is one you meant to make, and say
so in the PR:

```bash
make visual-diff STORIES=layout-sidebar
make visual-diff STORIES=forms-select,overlays-modal THEMES=dark BASE=origin/main
```

- `STORIES` is required: comma-separated substrings of story ids (`layout-sidebar` is every story
  of `Layout/Sidebar`). A run over every story is not offered.
- `THEMES` narrows the themes (`dark`, `light,sand`…); every theme by default.
- `BASE` is the git ref to compare with, `main` by default. It can be a branch, a tag or a SHA.

The run captures the matching stories as they are at `BASE` and as they are in your working tree,
uncommitted changes included, into `screenshots/base/` and `screenshots/head/`. `BASE` is checked
out in a temporary worktree under `.cache/visual-diff`, installed from a pnpm store kept in
`.cache/pnpm-store` (the first run downloads the packages, the next ones find them there) and built
with its own Storybook; the worktree is removed afterwards. Both builds are captured by the spec of
your working tree, so a change of the capture code is not a visual change. The run ends by printing
the path of the report, `screenshots/diff/index.html`: one self-contained page you open in a
browser.

The report starts with how many stories changed, appeared and disappeared. Then comes one row per
changed story, with the before, after and diff images of each theme side by side; click an image
to open it full size, and look for the red pixels in the diff (a story whose size changed has no
diff image, its two sizes are shown instead). Stories that did not change are only counted. The
stories that appeared or disappeared are listed at the end, and so are the captures that had a
problem, which can explain a difference that is not a change (see below). A change you did not make
is a bug to fix, or a theme token that moved: find out before the PR.

`make visual-diff` needs the `cosmos-dev` image to carry ImageMagick (`make build-image`, once, after
pulling this change) and `make install`.

`make screenshots` is the raw tool underneath: it captures every story (test-only `!dev` stories
excluded) in each theme of the Storybook toolbar, into `screenshots/<theme>/<story-id>.png`,
without comparing anything. It needs the `storybook` compose service. Narrow a run with the same
two variables:

```bash
STORIES=overlays-,forms-select THEMES=dark make screenshots
```

`make audit-captures` feeds the maintainer's visual audit, which compares the components with
reference admin templates kept in the private `cosmos-references` repository. It builds the working
tree's Storybook, captures every story at 1280px in `light` and `dark` and the shell-level stories
(`layout-`, `navigation-`, `examples-`, `templates-`) at 375px in `light`, then replaces the `cosmos/`
folder of the `cosmos-references` checkout with them, plus a `meta.json` naming the commit captured.
`REFERENCES` points at the checkout (`../cosmos-references` by default), `THEMES` and `STORIES`
narrow the 1280px pass and `MOBILE_STORIES` the 375px one. `CAPTURE_VIEWPORT=<width>x<height>`
gives any capture another size than 1280x720.

Every capture runs on the same day (15 January 2026, then time flows) with a seeded `Math.random`,
so two runs of an unchanged story give the same image. A capture waits
for a stable frame: the viewport is screenshotted, 100 ms apart, until two consecutive frames are
byte-identical (five at most), then the full page is screenshotted once, because a carousel, a
panel or a chart can still be moving when the story's render ends. Requests to any origin but
Storybook's are cut (a third-party frame gets a plain gray page), so a story never shows what the
network returned that day: use the local placeholders of `storybook-avatars.ts` for images. A story
whose picture depends on how long it has been running (a demo that ticks, or that loads after a
delay) takes the `no-capture` tag and is skipped. A story that ends in the wrong theme, or whose
frame never settles, is still captured; one that can't be captured is skipped. All three are listed
in `problems.txt`, next to the captures it describes.

## Branch model

- `main` — protected: signed commits, changes through a PR with green CI
- Feature branches : `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`
- One PR = one focused change. Squash multiple commits if cleaner.

## Commit messages

Conventional Commits, English, imperative present tense, ≤72 chars:

```text
feat(react): add Drawer component
fix(theme): correct dark mode contrast on muted text
chore(deps): bump storybook to 10.5.2
docs: update install steps for new Playwright browsers
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `style`, `revert`.

## Signed commits

All commits must be signed (SSH signing recommended). See [GitHub docs](https://docs.github.com/en/authentication/managing-commit-signature-verification).

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_signing -C "your commit signing key"
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519_signing.pub
git config --global commit.gpgsign true
gh ssh-key add ~/.ssh/id_ed25519_signing.pub --type signing --title "cosmos signing"
```

## Theming rules

- Components use Tailwind palette classes (`bg-white`, `text-gray-500`, `dark:bg-gray-900`,
  `bg-brand-500`). Themes and accents redefine those variables, so a component never needs
  per-theme classes or hardcoded hex colors.
- Accent-colored text (links, active labels) is `text-brand-600 dark:text-brand-400`.
  `text-brand-500` drops under 4.5:1 on the sand theme.
- The `dark:` variant has zero specificity (`:where()`), so `focus:border-brand-500` and
  `hover:` styles win over a plain `dark:` class in the dark themes. A state that needs its own
  dark color still takes `dark:hover:` or `dark:focus:`.
- **Focus.** Every focusable control shows one indicator: a solid accent one plus the
  `--shadow-focus-ring` halo (12% of the accent, too faint to count on its own: never ship the halo,
  or a `ring-brand-500/40`, as the only cue). The theme ships it as utilities that hold no state, so
  the variant goes in front:
  - a field (text input, textarea, select, number, OTP, search, combobox, a date or time trigger,
    the dropzone): `focus:field-focus`, the accent border plus the halo; `focus-within:field-focus`
    on the wrapper that draws the border; `field-focus-error` in place of it in the error state;
  - everything else (button, link, toggle, checkbox, radio, segment, pill, tab, card, menu item,
    row, sidebar item…): `focus-visible:focus-indicator`, a 2px `brand-500` ring plus the halo, so a
    mouse click shows nothing. A control drawn by a sibling of a hidden input takes
    `peer-focus-visible:focus-indicator`, a card that wraps a control `has-focus-visible:`.

  There is no ring offset. Add `focus-visible:ring-inset` where an ancestor clips with
  `overflow-hidden` or a neighbour covers the outer ring (segments, tabs, rows, menu items). Never
  write `focus:outline-none` without one of these: the utilities already hide the browser outline
  with `outline-hidden`, which keeps it in forced-colors mode. A control filled with `brand-500`
  whose ring sits inside it (the active segment, a selected day) or on a `brand-500` surface (the
  brand `AnnouncementBar`) would lose a brand ring: it takes `focus-visible:focus-indicator-on-accent`,
  a white ring with no halo. Pick between the two classes, never both: their order in the CSS is
  not guaranteed. Test it with `expectFocusBorder` (fields) or `expectFocusRing` (the rest) from
  `storybook-helpers.ts`; both check the halo.

- After a change in `packages/theme/css/`, run `./devctl run pnpm --filter @sckyzo/cosmos-theme test`:
  it fails on the first theme × accent pair under its WCAG threshold.
- Check visual changes in the four themes with the Storybook toolbar (Theme and Accent menus).

## Component API

The same prop means the same thing on every component.

- **`intent` is meaning, `variant` is structure.** `intent` is a color that carries a meaning, from
  one vocabulary: `neutral | brand | info | success | warning | danger`, the shared `Intent` type of
  `packages/react/src/ui/intent.ts`. There are no synonyms: `error` and `crit` are `danger`, `warn`
  is `warning`. A component may accept a documented subset, written as an `Extract<Intent, …>` (a
  `Button` takes `brand | success | warning | danger`). `variant` only describes structure or
  emphasis (`primary`, `ghost`, `outline`, a layout), never a meaning: a destructive button is
  `variant="primary" intent="danger"`, not a `danger` variant. A component that mixes a surface and
  a meaning splits them in two props, as `Tooltip` does with `variant` (`dark | white`) and
  `intent`. Two things stay out of this: the monitoring `status` of the health components (`OK`,
  `WARN`, `CRIT`…), which is data and not a color, and decorative color names such as
  `SectionCard.iconTone`. A color with no meaning of its own (`violet` in `EventCalendar`) is
  documented as a category color next to the `Intent` values.
- **A state never overrides a default through class order.** Two utilities of one family on one
  element (`bg-white` and `bg-brand-500`, `text-gray-700` and `text-white`, `w-full` and `w-40`)
  are settled by their order in the generated CSS, not by their order in `clsx`: the neutral one
  can win, and the state it was meant to show is invisible (the active `Pagination` page was a
  white digit on a white button). Default and state classes are mutually exclusive: write
  `active ? activeClass : idleClass`, never `base`, then `active && override`. A value a caller
  may change is a prop (`Popover.Content`'s `width` and `padding`), not a `className` that wins by
  `!`. There is no `tailwind-merge`: it would hide the conflict at runtime instead of removing it.
- **A prop that names a side of the line takes `start` and `end`, never `left` and `right`.** The
  side follows the reading direction (`dir="rtl"` on `<html>` or any ancestor), so the name says
  so: `iconPosition="start"`, `align="end"`, `position="top-end"`, `endSlot`, `startActions`. A
  default keeps its left-to-right meaning (`'left'` becomes `'start'`), so left to right renders
  as it always did. `top` and `bottom` stay physical, and so do the few names that really are a
  screen edge (`AnchorSide`, `AnchorRect`), and the charts' `legendPosition`: a chart keeps its
  left-to-right axis under `dir="rtl"`, so its legend's `left` and `right` are the screen's.
  `repo-policy.spec.ts` refuses a `'left'` or `'right'` literal in a type of `packages/react/src`;
  a type that must stay physical goes in its `SIDE_ALLOWED` list, with the reason.
- **Logical utilities only, in every source file of `packages/react/src`.** Spacing, positions,
  borders, corners and text alignment name the start and the end of the line (`ms-`, `pe-`,
  `inset-s-`, `border-s`, `rounded-e`, `text-start`), and what has no logical form takes the `rtl:`
  variant (`rtl:-scale-x-100` on an icon that points along the line). A physical one (`ml-`, `left-`,
  `text-left`…) that must stay, because it names a side of the screen, goes in `RTL_ALLOWED` in
  `repo-policy.spec.ts` with the reason; the same spec fails on any other.
- **Change callbacks follow the control.** A wrapper of a native field (Input, PasswordInput,
  Textarea, Select, Checkbox, Radio, TimePicker) passes the native event: `onChange(event)`, and
  `onChange(value, event)` for Checkbox, Radio and TimePicker. A custom widget passes the value:
  `onChange(value)`, `onCollapsedChange(collapsed)`, `onChange(isDark)`. A callback that reports a
  state change carries the state to move to, never a bare `onToggle()` that makes the host work it
  out.
- **State the host may own comes in a controlled/uncontrolled pair.** The value (`value`,
  `checked`, `page`, `collapsed`, `open`…), its default (`defaultValue`, `defaultChecked`,
  `defaultPage`, `defaultCollapsed`, `defaultOpen`…) and its change callback. Only `undefined`
  means uncontrolled: `null`, `false`, `0` and `''` are values the host controls, so an empty
  controlled value is `''` (or `null` where the type allows it), never `undefined`. The callback
  fires in both modes; a controlled component shows the new value once the host passes it back. A
  component stays one or the other for its whole life, and logs a warning if the host switches.
  Build it on the internal `useControllableState` (`packages/react/src/hooks/`), never a
  hand-written `isControlled` branch.
- **Who opens it picks the open-state props.** A dialog the host opens (Modal, Modal.Alert,
  Drawer, ConfirmationModal) takes `open` + `onClose`: the host owns the state, and the component
  calls `onClose` from its close button, the backdrop and Escape. A component that opens or closes
  itself (Popover, Dropdown, Combobox, DatePicker, Tooltip, UserMenu, NotificationsPanel, Chatbot,
  CookieBanner, Sidebar.SubMenu and Sidebar.Group, HelpOverlay and its hotkey) takes `open` /
  `defaultOpen` / `onOpenChange(open)`, the pair above.
- **Refs are props.** React 19 passes `ref` like any other prop, so no component uses `forwardRef`.
  A component whose root is focusable (a button, a link, a field) takes `ref` and attaches it to
  that element.
- **An internal link is an `AppLink`, never a raw `<a>`.** An app mounts `LinkProvider`
  (`ui/LinkProvider.tsx`) once to send the links of the components through its router, and the
  internal `AppLink` (`ui/AppLink.tsx`) is what draws them: the provided component, given every prop
  the `<a>` would have had (`ref`, `className`, `onClick`, the `aria-*` and `data-*` attributes), or a
  plain `<a>` when there is no provider. A component with an `href` renders `<AppLink>` with the
  props it would have given the `<a>`, and follows the router with nothing else to do.
  What it reads back from its own link (`DataTable`'s `[data-row-link]`) goes in a `data-*` attribute,
  which the provided component hands on. External links are the exception. `AppLink` leaves a link with
  `target="_blank"`, no `href` or a bare `#` a plain `<a>` by itself; the links of user content (a chat
  message, `chat/MessageText`) are written as a raw `<a>` with a comment that says why. `AppLink` is
  not exported from the package, which imports no router: the app's adapter is its own. The
  `Navigation/LinkProvider` stories show the behaviour with a fake router.
- **One sidebar toggle: `SidebarToggle`** (`layout/SidebarToggle.tsx`). The Topbar renders it as a
  `hamburger`, the bottom of the Sidebar as a `panel` row, and a custom header, a Topbar's
  `startActions` or the Sidebar's `footer` can place one more. `Shell` owns the collapsed state and
  provides it through a context (`layout/shellContext.ts`): inside it, the toggle takes no props,
  every toggle stays in sync, and the Topbar's `sidebarCollapsed` and the Sidebar's `collapsed`
  are not read. Outside a Shell it takes `collapsed` + `onCollapsedChange`. Don't write another
  collapse button. The Shell owns two sidebar states: collapsed from `lg` up (`sidebarCollapsed`),
  open below `lg` (`sidebarOpen`), where the sidebar is a `Drawer` and the same toggle opens and
  closes it. A component of the sidebar that must differ in the drawer reads `isMobile` from
  `shellContext.ts`.
- **A floating panel renders in a portal.** A panel that opens next to its trigger (Popover,
  UserMenu, NotificationsPanel, DatePicker, Dropdown, Combobox, Tooltip, the column filter of
  ColumnHeader, RefreshButton's menu) renders at the end of `<body>`, so no `overflow: hidden`
  ancestor clips it, or inside the modal dialog it opens from (Modal, ConfirmationModal,
  Drawer: `usePortalContainer` in `ui/overlayA11y.tsx`), so `aria-modal` doesn't hide it from
  assistive technology. It sits in fixed position next to its trigger, kept there by the
  internal `useAnchorPosition` (`packages/react/src/hooks/`): a side, an alignment, an offset,
  re-measured on resize, on any scroll and when the trigger or the panel changes size. A panel
  the viewport would cut on its side flips to the opposite one when that side has more room,
  and one cut on the other axis moves back inside, 16px from the edge; a panel in view stays
  where its placement puts it. A part that points at the trigger (an arrow) follows the side
  the panel opened on (a function child of `FloatingPanel`) and subtracts `--anchor-shift`, how
  far the panel moved. Build a new one on the internal `FloatingPanel` (`ui/FloatingPanel.tsx`),
  never `absolute` inside the component. Its stories set `parameters: portalDocsParams.lg()` (or
  another size) when they show it open in the docs, and query it from `document.body`, not the
  canvas.
- **One outside-click mechanism.** A mousedown outside the panel and its trigger closes it:
  `useOutsideClick` (`ui/overlayA11y.tsx`), a document listener that lets the click through to
  what is under the pointer. No full-screen click-catcher, no listener of the component's own.
  Focus leaving the panel closes it too (`usePortalFocus`). Both tell a panel nested in another
  and portaled elsewhere, a menu opened from a popover, from the outside: it is inside the
  React tree, so it stays inside.
- **One Escape mechanism.** Escape closes the innermost open overlay only: a menu open in a
  modal closes, and the modal stays until the next Escape. Every overlay (Modal,
  ConfirmationModal, Drawer, HelpOverlay, the floating panels, Tooltip, Chatbot) joins the stack
  of `useOverlayLayer` (`ui/overlayA11y.tsx`) while open, and gives its layer to its content
  with `OverlayLayerProvider`, so the overlays opened from it stack above it. No Escape listener
  of the component's own. A control that handles Escape itself prevents its default, and the
  stack leaves that Escape alone, as it does for the Radix dialog under CommandPalette.
- **One z-index scale for floating panels:** the panel at `z-[9999]`, above the page layers and
  the modal layer (`z-50`: Modal, Drawer); a panel opened in a modal renders inside it, above
  its content. A tooltip one step higher, at `z-[10000]`, so it shows over the panel it opens
  from. Both come from `FLOATING_PANEL_Z` and `TOOLTIP_Z` in `ui/FloatingPanel.tsx`; don't
  write another value.

## Narrow screens

A component laid out in a row says what it does when the row no longer fits (below `sm`, 640px),
by kind. None of them may widen the page.

- **Scroll** what is a list of equals the user moves along: `Tabs` (horizontal, hidden scrollbar,
  the active tab scrolled into view, an edge fade only where there is more), `Table` and
  `DataTable` (the table scrolls in its own container).
- **Wrap** what is a set of small items with no order to keep: meta rows, chips, badges, button
  rows (`flex-wrap`, and `break-all` on a path or URL that has no break point).
- **Collapse** what has a primary part and a long tail: `Breadcrumb` (`maxItems` folds the middle
  into a menu, the current crumb stays), `Topbar` (the title goes, `moreActions` becomes a "More"
  menu), `Pagination` (the info on its own row, "Page 2 / 9" in place of the numbers),
  `EventCalendar` (one-letter weekdays, the picked day listed under the grid). A layout with a side
  column stacks it under the main one (`Shell`'s `secondary`, vertical `Tabs`).

Prefer a responsive class (`sm:`, `max-sm:`) to JavaScript, and use `useMediaQuery` only when the
markup itself changes. Every component with such a behavior has a story at the `mobile` viewport
(`globals: mobileViewport` from `storybook-helpers.ts`, which the story tests honor) whose play
function calls `expectNoHorizontalOverflow`.

## Charts

The wrappers of `packages/charts` draw with Recharts and are built on the internal `src/core/`.

- **Colours are CSS variables**, with a hex fallback, from `core/colors.ts`: never a `getComputedStyle`,
  a `MutationObserver` or a colour kept in state. A theme, accent or text size switch repaints the
  chart on its own. A colour a chart needs that the theme does not emit yet is added to the theme
  first.
- **Text** takes the text tokens (`var(--text-xs)`) and inherits the font. A tooltip and a legend are
  React: a series name, a category or a title with markup shows as written, and nothing is escaped by
  hand.
- **Use the frame** (`frameProps`, `ChartEmpty`, `ChartTooltip`, `legendProps`, `useAxis`, `AXIS`,
  `ANIMATION`) instead of writing the same props again. A chart with its categories on the vertical
  axis takes `useCategoryKeys` for the arrow keys.
- **Public props** are `ChartProps` (`height`, `width`, `ariaLabel`, `children`) plus what the chart
  needs. `children` takes Recharts elements drawn inside the chart; `recharts` stays pinned to the
  version in `packages/charts/package.json`, and a consumer who adds it uses the same one.
- **Tests**: one `<Name>.stories.tsx` per wrapper, with the helpers of `src/storybook-recharts.tsx`.
  Each keeps a `HtmlInLabelsRendersAsText` story, one that repaints with the theme and one for the
  empty state. `tests/e2e/specs/charts-dist.spec.ts` guards the build: one file per wrapper, Recharts
  external, `"use client"` on every file.

## PR checklist

- [ ] `make check-changed` passes locally (it runs every step of `make ci` when the change needs it; with less than 13 GB of memory it skips the parallel story passes and the PR's CI runs them)
- [ ] New components have a Storybook story
- [ ] New or changed props follow the [Component API](#component-api) rules
- [ ] New or changed pure logic has a unit test (see [Tests](#tests))
- [ ] `a11y-todo.json` only lost lines: no story or rule added (see [Accessibility](#accessibility))
- [ ] Visual changes : `make visual-diff STORIES=<component>` run on what you touched, every change in the report is intended (see [Visual review](#visual-review)), screenshot in PR description
- [ ] Public API changes : update package README
- [ ] Breaking changes : add `BREAKING CHANGE:` footer to commit

## Dependencies

pnpm only installs versions published at least a day ago (`minimumReleaseAge` in
`pnpm-workspace.yaml`), and Dependabot waits 3 days before it proposes one: most hijacked
releases are found and pulled within hours. For an urgent security fix, lift the delay for that
one command:

```bash
./devctl run pnpm up -r --config.minimum-release-age=0 '<package>@<version>'
```

pnpm also refuses a version published with weaker evidence (provenance, trusted publisher) than
an earlier one (`ERR_PNPM_TRUST_DOWNGRADE`), and dependencies pulled from git or a tarball below
the direct ones.

Dependabot merges minor and patch npm updates on its own once CI passes. Majors, GitHub Actions
and Docker updates, and any update where the package changed maintainers wait for a review.

## Releases

[release-please](https://github.com/googleapis/release-please) keeps a release PR open on
`main` from the Conventional Commits. While the packages are below 1.0, a breaking change
bumps the minor version (`bump-minor-pre-major`). The three packages share one version number
(the `linked-versions` plugin): a release of any of them gives the three the same version, so
`@sckyzo/cosmos-charts` 0.5.0 goes with `@sckyzo/cosmos-react` 0.5.0.

1. The GitHub Actions token opens the release PR, so no CI runs on it. Close and reopen it,
   or push a commit to it, to get the required checks.
2. Merge it. release-please tags each package (`@sckyzo/cosmos-theme@0.1.0`) and creates the
   GitHub releases.
3. Publish to npm from `main`, theme first:
   `gh workflow run publish.yml -f package=cosmos-theme`, then `cosmos-react`, then
   `cosmos-charts`. Each run builds and packs the package in one job, then publishes the
   tarball from a second job that alone holds the npm OIDC token. The `npm-publish`
   environment only accepts `main` and waits for approval.

## Merge strategy

`gh pr merge --merge --body ''` (preserves signatures, creates a merge commit). The repository
deletes the head branch once it is merged.
Do NOT use `--rebase` or `--squash` (GitHub rebuilds commits server-side, losing signatures).

`--body ''` leaves the merge commit body empty. GitHub fills it with the PR title by default, and
release-please splits a commit message at every blank line followed by a conventional header, so
it counted the merge commit as a second copy of the PR's `feat` or `fix` and listed it twice in the
changelog.
