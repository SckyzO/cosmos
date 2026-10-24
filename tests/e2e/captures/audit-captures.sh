#!/usr/bin/env bash
# Captures for the visual audit: `make audit-captures`.
#
# Builds the working tree's Storybook, captures every story at 1280px in some
# themes and the shell-level stories at 375px, then replaces the `cosmos/`
# folder of the private cosmos-references checkout with them. The audit compares
# those captures with the reference admin templates kept in that repository.
# Nothing here runs in CI, and nothing is written to this repository but
# screenshots/audit/ (gitignored).
#
#   REFERENCES      the cosmos-references checkout (default: ../cosmos-references)
#   THEMES          themes of the 1280px pass, comma-separated (default: light,dark)
#   STORIES         story id substrings of the 1280px pass (default: every story)
#   MOBILE_STORIES  story id substrings of the 375px pass, in light
#                   (default: layout-,navigation-,pages-,templates-)
#
# The host needs docker, git and bash. Node, pnpm and Chromium run in cosmos-dev.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../../.."
root=$PWD
image=cosmos-dev:latest
work=/workspace/.cache/audit
references=${REFERENCES:-../cosmos-references}
themes=${THEMES:-light,dark}
stories=${STORIES:-}
mobile_stories=${MOBILE_STORIES:-layout-,navigation-,pages-,templates-}

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

step "Storybook build"
quiet dev sh -c "pnpm --filter @cosmos/storybook exec storybook build -o $work/static"

step "Captures"
# shellcheck disable=SC2016 # the $1… are expanded by the container's shell
dev sh -c '
  set -e
  pnpm browsers:install
  echo "-- 1280px: ${2:-every story}, $3 --"
  STORIES=$2 THEMES=$3 CAPTURE_OUT=screenshots/audit/1280 \
    node tests/e2e/captures/serve.mjs "$1/static" -- \
    pnpm --filter @cosmos/e2e screenshots --reporter=line
  echo "-- 375px: $4, light --"
  STORIES=$4 THEMES=light CAPTURE_VIEWPORT=375x812 CAPTURE_OUT=screenshots/audit/375 \
    node tests/e2e/captures/serve.mjs "$1/static" -- \
    pnpm --filter @cosmos/e2e screenshots --reporter=line' \
  sh "$work" "$stories" "$themes" "$mobile_stories"

step "Copy to $references/cosmos"
sha=$(git rev-parse HEAD)
# Only what Storybook builds from counts: an untracked note at the root does not.
dirty=false
[[ -z $(git status --porcelain -- packages apps) ]] || dirty=true
rm -rf "$references/cosmos"
cp -r screenshots/audit "$references/cosmos"
cat >"$references/cosmos/meta.json" <<JSON
{
  "cosmosCommit": "$sha",
  "uncommittedChanges": $dirty,
  "capturedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "desktop": { "viewport": "1280", "themes": "$themes", "stories": "$stories" },
  "mobile": { "viewport": "375x812", "themes": "light", "stories": "$mobile_stories" }
}
JSON

count=$(find "$references/cosmos" -name '*.png' | wc -l)
printf '\nDone in %ss: %s captures of %s in %s\n' \
  "$SECONDS" "$count" "$(git rev-parse --short HEAD)" "$references/cosmos"
