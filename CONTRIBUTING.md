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
make test                 # Story tests (Vitest browser mode), e2e and the theme contrast check
make ci                   # Full CI before pushing
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
- In dark themes `dark:border-gray-700` wins over `focus:border-brand-500`; add an explicit
  `dark:focus:` variant when a component shows focus with its border.
- After a change in `packages/theme/css/`, run `./devctl run pnpm --filter @sckyzo/cosmos-theme test`:
  it fails on the first theme × accent pair under its WCAG threshold.
- Check visual changes in the four themes with the Storybook toolbar (Theme and Accent menus).

## PR checklist

- [ ] `make ci` passes locally
- [ ] New components have a Storybook story
- [ ] Visual changes : screenshot in PR description, checked in the four themes
- [ ] Public API changes : update package README
- [ ] Breaking changes : add `BREAKING CHANGE:` footer to commit

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
   `cosmos-charts`. Each run waits for approval in the `npm-publish` environment. Don't
   run it on a tag: both publish steps would run and the second one fails.

## Merge strategy

`gh pr merge --merge --delete-branch --body ''` (preserves signatures, creates a merge commit).
Do NOT use `--rebase` or `--squash` (GitHub rebuilds commits server-side, losing signatures).

`--body ''` leaves the merge commit body empty. GitHub fills it with the PR title by default, and
release-please splits a commit message at every blank line followed by a conventional header, so
it counted the merge commit as a second copy of the PR's `feat` or `fix` and listed it twice in the
changelog.
