#!/usr/bin/env bash
# Pre-push check of a branch: `make check-changed`.
#
# Runs the steps of `make ci` that the changed files can break, on those files: Prettier and ESLint
# on the changed files, the typecheck and the unit tests, and the story files that use what changed
# (select-stories.mjs) in the default pass and in the contrast pass in light, sand and deep-blue.
# The build, the Storybook build and the e2e specs are left out: what can break them is outside the
# sources. A change outside the react and charts sources that isn't Markdown (theme CSS, Storybook
# or Vitest config, dependencies, workflows, e2e specs, Docker) runs the full `make ci` instead.
# GitHub's CI still runs everything before a merge.
#
#   BASE   ref the branch is compared with (default: origin/main). Uncommitted and untracked
#          files count as changed: the checks run on the working tree.
#
# The host needs docker, git and bash. Git runs here, not in cosmos-dev: in a worktree, .git is a
# file that points outside the container's mount.
set -euo pipefail
cd "$(dirname "$0")/../../.."

base=$(git merge-base HEAD "${BASE:-origin/main}")
mapfile -t changed < <(
  {
    git diff --name-only --diff-filter=d "$base"
    git ls-files --others --exclude-standard
  } | sort -u
)
if [[ ${#changed[@]} -eq 0 ]]; then
  echo "Nothing changed since $(git rev-parse --short "$base")."
  exit 0
fi

code=()
unscoped=()
for f in "${changed[@]}"; do
  if [[ $f =~ ^packages/(react|charts)/src/.*\.tsx?$ ]]; then
    code+=("$f")
  elif [[ $f != *.md ]]; then
    unscoped+=("$f")
  fi
done
if [[ ${#unscoped[@]} -gt 0 ]]; then
  echo "Changed outside the react and charts sources: ${unscoped[*]}"
  echo "Running the full make ci."
  exec make ci
fi

step() {
  echo "── $1 ──"
  shift
  ./devctl run "$@"
}

step "prettier: ${#changed[@]} files" pnpm exec prettier --check --ignore-unknown "${changed[@]}"
if [[ ${#code[@]} -gt 0 ]]; then
  step "eslint: ${#code[@]} files" pnpm exec eslint --max-warnings 0 "${code[@]}"
  step typecheck pnpm typecheck
  step "unit tests" pnpm --filter @cosmos/storybook exec vitest run --project=node
  mapfile -t stories < <(./devctl run node tests/e2e/checks/select-stories.mjs "${code[@]}")
  if [[ ${#stories[@]} -eq 0 ]]; then
    echo "No story file uses what changed."
  else
    echo "Story files: ${stories[*]}"
    step browsers pnpm browsers:install
    step "stories, default pass" pnpm --filter @cosmos/storybook exec vitest run --project=storybook "${stories[@]}"
    for theme in light sand deep-blue; do
      step "stories, contrast in $theme" env A11Y_THEME="$theme" \
        pnpm --filter @cosmos/storybook exec vitest run --project=storybook "${stories[@]}"
    done
  fi
fi
echo "── check-changed passed in ${SECONDS}s ──"
