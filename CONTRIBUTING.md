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
make ci                   # Full CI before pushing
```

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
`apps/storybook/.storybook/a11y-todo.json`, the burn-down list of #265: story id → the axe rules it
still violates. A listed story runs in the addon's `todo` mode, so its violations are warnings in
the Storybook Accessibility panel, but it must violate exactly the rules of its entry:

- a listed rule that stops firing fails the test until it is removed from the entry, and a story
  with no violation left fails until its entry is deleted;
- a rule that is not listed fails the test as well: an entry never grows. Fix the violation.

A new story goes on the list only with rules its component's other entries already carry: a test
story of a component with known debt (say, `label` on every NumberInput story) inherits that debt
instead of forcing its fix into an unrelated change. A rule the component doesn't have yet is a
regression: fix it.

The gate is wired in `apps/storybook/.storybook/a11y-gate.ts`. axe only sees the default `dark`
theme: check contrast in the other themes with the Theme menu and the Accessibility panel.

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

Screenshots are for a person to look at: they assert nothing and never gate a PR. `make screenshots`
captures every story (test-only `!dev` stories excluded) in each theme of the Storybook toolbar,
into `screenshots/<theme>/<story-id>.png`. It needs the `storybook` compose service. Narrow a run
with comma-separated substrings:

```bash
make screenshots                                  # every story, every theme
STORIES=overlays-,forms-select THEMES=dark make screenshots
```

Every capture runs on the same day (15 January 2026, then time flows) with a seeded `Math.random`
and chart animations off, so two runs of an unchanged story give the same image. A story that ends
in the wrong theme is still captured; one that can't be captured is skipped. Both are listed in
`screenshots/problems.txt`.

The `Visual captures` workflow runs the same capture on the first day of each month, or from the
Actions tab with the same two filters, and uploads `screenshots/` as an artifact kept 90 days. A
complete run (no filter) is named `story-captures` and compared with the previous complete run by
`.github/scripts/visual-diff.sh`. The captures that changed, appeared or disappeared are listed in
the run summary and in the issue "Visual review: story changes since the last capture", created or
updated by the run. The `story-changes` artifact holds the before, after and diff images. The same
script compares two local runs:

```bash
.github/scripts/visual-diff.sh <previous-screenshots> screenshots /tmp/visual-diff
```

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
  `Button` takes `brand | danger`). `variant` only describes structure or emphasis (`primary`,
  `ghost`, `outline`, a layout), never a meaning: a destructive button is
  `variant="primary" intent="danger"`, not a `danger` variant. A component that mixes a surface and
  a meaning splits them in two props, as `Tooltip` does with `variant` (`dark | white`) and
  `intent`. Two things stay out of this: the monitoring `status` of the health components (`OK`,
  `WARN`, `CRIT`…), which is data and not a color, and decorative color names such as
  `SectionCard.iconTone`. A color with no meaning of its own (`violet` in `EventCalendar`) is
  documented as a category color next to the `Intent` values.
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
- **A floating panel renders in a portal.** A panel that opens next to its trigger (Popover,
  UserMenu, NotificationsPanel, DatePicker, Dropdown, Combobox, Tooltip, the column filter of
  ColumnHeader, RefreshButton's menu) renders at the end of `<body>`, so no `overflow: hidden`
  ancestor clips it, in fixed position kept next to its trigger by the internal
  `useAnchorPosition` (`packages/react/src/hooks/`): a side, an alignment, an offset, re-measured
  on resize, on any scroll and when the trigger changes size. Build a new one on the internal
  `FloatingPanel` (`ui/FloatingPanel.tsx`), never `absolute` inside the component. There is no
  collision handling yet (#269): a panel opens where its placement says, even when the viewport
  cuts it. Its stories set `parameters: portalDocsParams.lg()` (or another size) when they show it
  open in the docs, and query it from `document.body`, not the canvas.
- **One outside-click mechanism.** A mousedown outside the panel and its trigger closes it:
  `useOutsideClick` (`ui/overlayA11y.tsx`), a document listener that lets the click through to
  what is under the pointer. No full-screen click-catcher, no listener of the component's own.
  Focus leaving the panel closes it too (`usePortalFocus`). Both tell a panel nested in another
  and portaled elsewhere, a menu opened from a popover, from the outside: it is inside the
  React tree, so it stays inside.
- **One z-index scale for floating panels:** the panel at `z-[9999]`, above the page layers and
  the modal layer (`z-50`: Modal, Drawer), so a menu opened in a modal shows over it; a tooltip
  one step higher, at `z-[10000]`, so it shows over the panel it opens from. Both come from
  `FLOATING_PANEL_Z` and `TOOLTIP_Z` in `ui/FloatingPanel.tsx`; don't write another value.

## PR checklist

- [ ] `make ci` passes locally
- [ ] New components have a Storybook story
- [ ] New or changed props follow the [Component API](#component-api) rules
- [ ] New or changed pure logic has a unit test (see [Tests](#tests))
- [ ] `a11y-todo.json` only lost lines: no story or rule added (see [Accessibility](#accessibility))
- [ ] Visual changes : screenshot in PR description, checked in the four themes
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
bumps the minor version (`bump-minor-pre-major`).

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
