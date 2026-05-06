# Contributing to Cosmos

## Setup

The host needs only `docker`, `git`, `gh`, `make`, `bash`.

```bash
git clone git@github.com:SckyzO/cosmos.git
cd cosmos
make build-image          # Build cosmos-dev (first time, ~5 min)
make install              # pnpm install inside container
```

## Daily workflow

```bash
make storybook            # http://localhost:6006 — component playground
make test                 # Unit tests (Vitest)
make ci                   # Full CI before pushing
```

## Branch model

- `main` — protected, signed commits required, PR + review needed
- Feature branches : `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`
- One PR = one focused change. Squash multiple commits if cleaner.

## Commit messages

Conventional Commits, English, imperative present tense, ≤72 chars:

```
feat(react): add Drawer component
fix(theme): correct dark mode contrast on muted text
chore(deps): bump storybook to 9.0.5
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

## PR checklist

- [ ] `make ci` passes locally
- [ ] New components have a Storybook story
- [ ] Visual changes : screenshot in PR description
- [ ] Public API changes : update package README
- [ ] Breaking changes : add `BREAKING CHANGE:` footer to commit

## Merge strategy

`gh pr merge --merge --delete-branch` (preserves signatures, creates a merge commit).
Do NOT use `--rebase` or `--squash` (GitHub rebuilds commits server-side, losing signatures).
