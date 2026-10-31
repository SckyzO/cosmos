#!/usr/bin/env bash
# Captures, page checks and contact sheets for the visual audit (#494):
# `make audit-captures`.
#
# Builds the working tree's Storybook, then, for every visible story (the
# `!dev` test stories are out), left to right only:
#   - checks the page at 375, 768, 1280 and 1440px in light (sideways scroll,
#     text cut off or overlapping, squeezed icons and columns, touch targets
#     under 24px, console errors): checks.json and checks.md;
#   - captures every story at 1280px in light, the MOBILE_STORIES at 375 and
#     768px, the DESKTOP_STORIES at 1440px, each story the checks flagged at
#     the width it was flagged, and one story per component in each theme at
#     1280px: <width>/<theme>/<story-id>.png;
#   - builds contact sheets of those captures per Storybook group, with
#     ImageMagick: sheets/<set>/<group>-<n>.jpg, listed in sheets/index.md;
# then replaces the `cosmos/` folder of the private cosmos-references checkout
# with all of it, plus a meta.json naming the commit and what was run.
# Nothing here runs in CI, and nothing is written to this repository but
# screenshots/audit/ (gitignored).
#
#   REFERENCES       the cosmos-references checkout (default: ../cosmos-references)
#   STORIES          story id substrings: only those stories, checks and captures
#                    (default: every story)
#   THEMES           themes put side by side (default: every theme)
#   MOBILE_STORIES   story id substrings captured at 375 and 768px
#                    (default: examples-,layout-,navigation-,tables-,monitoring-)
#   DESKTOP_STORIES  story id substrings captured at 1440px
#                    (default: examples-,layout-)
#   CAPTURE_PAGES    pages working side by side (default: 4)
#   SKIP_BUILD       set it to reuse the Storybook build of the last run
#
# The host needs docker, git and bash. Node, pnpm, Chromium and ImageMagick run
# in cosmos-dev.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../../.."
root=$PWD
image=cosmos-dev:latest
work=/workspace/.cache/audit
references=${REFERENCES:-../cosmos-references}
themes=${THEMES:-}
stories=${STORIES:-}
mobile_stories=${MOBILE_STORIES-examples-,layout-,navigation-,tables-,monitoring-}
desktop_stories=${DESKTOP_STORIES-examples-,layout-}

# The captures replace a whole folder: make sure it is the right checkout.
[[ -d "$references/references" && -d "$references/.git" ]] || {
  echo "REFERENCES=$references is not a cosmos-references checkout (no references/ folder)" >&2
  exit 2
}
references=$(cd "$references" && pwd)
docker image inspect "$image" >/dev/null 2>&1 || {
  echo "No $image image: run make build-image" >&2
  exit 1
}
[[ -d node_modules && -d tests/e2e/node_modules ]] || {
  echo "Dependencies are not installed: run make install" >&2
  exit 1
}

# Runs a command in cosmos-dev as the host user, as the Makefile does (.git
# read-only, so nothing in the container can plant a hook).
dev() {
  docker run --rm \
    -v "$root:/workspace" -v "$root/.git:/workspace/.git:ro" \
    -w /workspace -u "$(id -u):$(id -g)" -e HOME=/home/node -e CAPTURE_PAGES \
    "$image" "$@"
}

step() { printf '\n== %s ==\n' "$1"; }

# Shows the end of a command's output, only when it fails.
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

mkdir -p screenshots/audit
find screenshots/audit -mindepth 1 -delete

reused=false
if [[ -n ${SKIP_BUILD:-} && -f .cache/audit/static/index.html ]]; then
  step "Storybook build (reusing .cache/audit/static)"
  reused=true
else
  step "Storybook build"
  quiet dev sh -c "pnpm --filter @cosmos/storybook exec storybook build -o $work/static"
fi

step "Checks and captures"
# shellcheck disable=SC2016 # the $1… are expanded by the container's shell
dev sh -c '
  set -e
  pnpm browsers:install
  STORIES=$2 THEMES=$3 MOBILE_STORIES=$4 DESKTOP_STORIES=$5 AUDIT_OUT=screenshots/audit \
    node tests/e2e/captures/serve.mjs "$1/static" -- \
    pnpm --filter @cosmos/e2e audit:stories --reporter=line' \
  sh "$work" "$stories" "$themes" "$mobile_stories" "$desktop_stories"

sha=$(git rev-parse HEAD)
# Only what Storybook builds from counts: an untracked note at the root does not.
dirty=false
[[ -z $(git status --porcelain -- packages apps) ]] || dirty=true
cat >screenshots/audit/meta.json <<JSON
{
  "cosmosCommit": "$sha",
  "uncommittedChanges": $dirty,
  "reusedBuild": $reused,
  "capturedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "checkWidths": [375, 768, 1280, 1440],
  "storyFilter": "${stories}",
  "themes": "${themes:-every theme}",
  "mobileStories": "${mobile_stories}",
  "desktopStories": "${desktop_stories}"
}
JSON

step "Contact sheets"
dev node tests/e2e/captures/audit-sheets.mjs screenshots/audit

step "Copy to $references/cosmos"
rm -rf "$references/cosmos"
cp -r screenshots/audit "$references/cosmos"

count=$(find "$references/cosmos" -name '*.png' | wc -l)
sheets=$(find "$references/cosmos/sheets" -name '*.jpg' | wc -l)
printf '\nDone in %ss: %s captures and %s sheets of %s in %s\nChecks: %s/checks.md\n' \
  "$SECONDS" "$count" "$sheets" "$(git rev-parse --short HEAD)" "$references/cosmos" "$references/cosmos"
