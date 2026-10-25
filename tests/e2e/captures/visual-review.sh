#!/usr/bin/env bash
# Local visual diff of some stories: `make visual-diff STORIES=<id substrings>`.
#
# Captures the matching stories twice, as they are at BASE (a git ref, default
# main) and as they are in the working tree (uncommitted changes included), in
# each theme, then writes screenshots/diff/index.html: one row per story that
# changed, with the before, after and diff image of each theme. Nothing here
# runs in CI: a person looks at the report and decides whether every change is
# intended.
#
#   STORIES   story id substrings, comma-separated (required)
#   THEMES    themes, comma-separated (default: every theme)
#   BASE      git ref to compare with (default: main)
#
# The host needs docker, git and bash. Node, pnpm and Chromium run in cosmos-dev.
# BASE is checked out in a temporary worktree under .cache/visual-diff, installed
# and built there, and removed afterwards. Both builds are captured by the
# working tree's spec, so a change of the capture code is not a visual change.
set -euo pipefail

usage() {
  cat >&2 <<'MESSAGE'
make visual-diff needs STORIES: a run over every story is what it replaces.
Name the components you touched, by story id substring:

  make visual-diff STORIES=layout-sidebar
  make visual-diff STORIES=forms-select,overlays-modal THEMES=dark BASE=origin/main
MESSAGE
  exit 2
}

stories=${STORIES:-}
themes=${THEMES:-}
base=${BASE:-main}

# An empty part ("a,,b") matches every story: refuse it like an empty list.
[[ -n "${stories//[[:space:],]/}" ]] || usage
IFS=, read -ra parts <<<"$stories"
for part in "${parts[@]}"; do
  [[ -n "${part//[[:space:]]/}" ]] || usage
done

cd "$(dirname "${BASH_SOURCE[0]}")/../../.."
root=$PWD
image=cosmos-dev:latest
# Where the work happens, as the container sees it (the repo is /workspace).
work=/workspace/.cache/visual-diff
worktree=$root/.cache/visual-diff/base

base_sha=$(git rev-parse --verify --quiet "$base^{commit}") || {
  echo "BASE=$base is not a commit of this repository" >&2
  exit 2
}
docker image inspect "$image" >/dev/null 2>&1 || {
  echo "No $image image: run make build-image" >&2
  exit 1
}
[[ -d node_modules && -d tests/e2e/node_modules ]] || {
  echo "Dependencies are not installed: run make install" >&2
  exit 1
}

# Runs a command in cosmos-dev from a folder of the repo, as the host user, as
# the Makefile does (.git read-only, so nothing in the container can plant a hook).
dev() {
  local dir=$1
  shift
  docker run --rm \
    -v "$root:/workspace" -v "$root/.git:/workspace/.git:ro" \
    -w "$dir" -u "$(id -u):$(id -g)" -e HOME=/home/node \
    -e "STORIES=$stories" -e "THEMES=$themes" -e CAPTURE_PAGES -e CAPTURE_VIEWPORT \
    "$image" "$@"
}

step() { printf '\n== %s ==\n' "$1"; }

# Runs a command with its output kept out of the way: only the end of it is
# shown, and only when it fails (a Storybook build prints hundreds of lines).
quiet() {
  local log status=0
  log=$(mktemp)
  "$@" >"$log" 2>&1 || status=$?
  if ((status != 0)); then
    tail -n 60 "$log" >&2
  fi
  rm -f "$log"
  return "$status"
}

dev /workspace sh -c 'command -v compare >/dev/null && command -v identify >/dev/null' || {
  echo "The $image image has no ImageMagick: run make build-image" >&2
  exit 1
}

# What a previous run left: its worktree if it was killed, and its results.
if [[ -e $worktree ]]; then
  git worktree remove --force "$worktree" || {
    echo "$worktree is left over and is not a git worktree: remove it by hand" >&2
    exit 1
  }
fi
git worktree prune
mkdir -p screenshots/base screenshots/head screenshots/diff
find screenshots/base screenshots/head screenshots/diff -mindepth 1 -delete

cleanup() {
  git worktree remove --force "$worktree" >/dev/null 2>&1 || true
  git worktree prune
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

step "BASE: $base ($(git rev-parse --short "$base_sha"))"
git worktree add --detach "$worktree" "$base_sha"
# The store lives in the repo, on the same filesystem as the worktree, so the
# install hard-links from it and the next run finds the packages already there.
echo "Installing dependencies"
quiet dev "$work/base" sh -c "pnpm install --frozen-lockfile --prefer-offline --store-dir /workspace/.cache/pnpm-store"
echo "Building Storybook"
quiet dev "$work/base" sh -c "pnpm --filter @cosmos/storybook exec storybook build -o $work/base-static"

step "Working tree"
echo "Building Storybook"
quiet dev /workspace sh -c "pnpm --filter @cosmos/storybook exec storybook build -o $work/head-static"

step "Captures"
# Both builds are served to the same spec, one after the other: a component may
# exist on one side only, so an empty run is allowed (checked below).
# shellcheck disable=SC2016 # $1 and $side are expanded by the container's shell
dev /workspace sh -c '
  set -e
  pnpm browsers:install
  for side in base head; do
    echo "-- $side --"
    CAPTURE_ALLOW_EMPTY=1 CAPTURE_OUT=screenshots/$side \
      node tests/e2e/captures/serve.mjs "$1/$side-static" -- \
      pnpm --filter @cosmos/e2e screenshots --reporter=line
  done' sh "$work"
if [[ -z $(find screenshots/base screenshots/head -name '*.png' -print -quit) ]]; then
  echo "No story id matches STORIES=$stories (in $base or in the working tree)" >&2
  exit 1
fi

step "Diff"
head_label="working tree on $(git rev-parse --short HEAD)"
if [[ -n $(git status --porcelain) ]]; then
  head_label+=" with uncommitted changes"
fi
# shellcheck disable=SC2016 # "$@" is expanded by the container's shell
dev /workspace sh -c '
  set -e
  tests/e2e/captures/visual-diff.sh screenshots/base screenshots/head screenshots/diff
  node tests/e2e/captures/report.mjs screenshots/diff "$@"' sh \
  --base-label "$base ($(git rev-parse --short "$base_sha"))" \
  --head-label "$head_label" \
  --stories "$stories" \
  --themes "$themes"

printf '\nDone in %ss. Report: %s\n' "$SECONDS" "$root/screenshots/diff/index.html"
