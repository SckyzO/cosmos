#!/usr/bin/env bash
# Pre-push check of a branch: `make check-changed`.
#
# Runs the steps of `make ci` that the changed files can break, on those files:
#
# - Documentation only (docs-only.sh: Markdown, docs/, pictures): Prettier on the changed files,
#   nothing else.
# - Sources of react and charts, and the stories of the Storybook app (apps/storybook/stories):
#   Prettier and ESLint on the changed files, the typecheck and the unit tests, and the story
#   files that use what changed (select-stories.mjs) in the default pass, in the contrast pass in
#   light, sand and deep-blue and in the direction pass (right to left). The build, the Storybook
#   build and the e2e specs are left out: what can break them is outside the sources.
# - Anything else (theme CSS, Storybook or Vitest config, dependencies, workflows, e2e specs,
#   Docker, MDX): the whole pipeline. Lint, format, typecheck, the builds and the default story
#   pass with the e2e specs run one after the other, as `make ci` does. Then the three contrast
#   passes and the direction pass run side by side, each in a container and a cache folder of its
#   own, when the machine has CHECK_MIN_MEM_GB of memory available. Below that they are skipped
#   and the check says so: the PR's CI runs them, and it is the merge gate either way.
#
# `make ci` stays the sequential, authoritative pipeline.
#
#   BASE              ref the branch is compared with (default: origin/main). Uncommitted and
#                     untracked files count as changed: the checks run on the working tree.
#   CHECK_MIN_MEM_GB  available memory, in GB, the parallel passes need (default: 13). Lower it
#                     to try them on a smaller machine, raise it past the machine's memory to
#                     test the skip.
#
# The host needs docker, git and bash. Git runs here, not in cosmos-dev: in a worktree, .git is a
# file that points outside the container's mount.
set -euo pipefail
cd "$(dirname "$0")/../../.."

base=$(git merge-base HEAD "${BASE:-origin/main}")
mapfile -t changed < <(
  {
    git diff --name-only --no-renames --diff-filter=d "$base"
    git ls-files --others --exclude-standard
  } | sort -u
)
if [[ ${#changed[@]} -eq 0 ]]; then
  echo "Nothing changed since $(git rev-parse --short "$base")."
  exit 0
fi

step() {
  echo "── $1 ──"
  shift
  ./devctl run "$@"
}

if printf '%s\n' "${changed[@]}" | tests/e2e/checks/docs-only.sh; then
  echo "Documentation only: ${changed[*]}"
  step "prettier: ${#changed[@]} files" pnpm exec prettier --check --ignore-unknown "${changed[@]}"
  echo "── check-changed passed in ${SECONDS}s ──"
  exit 0
fi

code=()
unscoped=()
for f in "${changed[@]}"; do
  if [[ $f =~ ^(packages/(react|charts)/src|apps/storybook/stories)/.*\.tsx?$ ]]; then
    code+=("$f")
  elif ! echo "$f" | tests/e2e/checks/docs-only.sh; then
    unscoped+=("$f")
  fi
done

# The passes that take the machine's memory, side by side. Each gets its own container, and its
# own Vite and Storybook caches through VITEST_CACHE_DIR (apps/storybook/vitest.config.ts): two
# runs re-optimising one dependency cache is the "optimized dependencies changed. reloading"
# failure.
parallel_passes() {
  local min_gb=${CHECK_MIN_MEM_GB:-13} available_kb available_gb
  available_kb=$(awk '/^MemAvailable:/ { print $2 }' /proc/meminfo)
  available_gb=$((available_kb / 1024 / 1024))
  if [[ $available_kb -lt $((min_gb * 1024 * 1024)) ]]; then
    echo "── skipped: story contrast in light, sand and deep-blue, and right to left ──"
    echo "${available_gb} GB of memory available, ${min_gb} GB needed to run the four passes side by side."
    echo "Push: the PR's CI runs them (jobs 'Story contrast' and 'Story tests (right to left)')."
    return 0
  fi

  local logs=.cache/check-changed passes=(contrast-light contrast-sand contrast-deep-blue direction)
  local pass status seconds failed=0 workers
  # A Vitest run opens one browser page per core by default: four of them on the cores of one
  # machine starve each other and the stories time out (15 s) or hang. Share the cores.
  workers=$(($(nproc) / ${#passes[@]}))
  [[ $workers -ge 1 ]] || workers=1
  rm -rf "$logs"
  mkdir -p "$logs"
  echo "── ${#passes[@]} story passes side by side (${available_gb} GB available, $workers workers each), logs in $logs ──"
  for pass in "${passes[@]}"; do
    (
      # devctl forwards no environment: `env` sets the variables inside the container.
      args=(env CI=true "VITEST_CACHE_DIR=/workspace/.cache/vitest/$pass" "VITEST_MAX_WORKERS=$workers")
      case $pass in
        contrast-*) args+=("A11Y_THEME=${pass#contrast-}" pnpm --filter @cosmos/storybook a11y:contrast) ;;
        direction) args+=(pnpm --filter @cosmos/storybook a11y:rtl) ;;
      esac
      start=$SECONDS
      status=0
      ./devctl run "${args[@]}" >"$logs/$pass.log" 2>&1 || status=$?
      echo "$status $((SECONDS - start))" >"$logs/$pass.status"
    ) &
  done
  wait
  for pass in "${passes[@]}"; do
    read -r status seconds <"$logs/$pass.status" || { status=1; seconds=0; }
    if [[ $status -eq 0 ]]; then
      echo "passed  $pass (${seconds}s)"
    else
      failed=1
      echo "FAILED  $pass (${seconds}s, exit $status): $logs/$pass.log"
      tail -n 25 "$logs/$pass.log" | sed 's/^/    /'
    fi
  done
  if [[ $failed -ne 0 ]]; then
    echo "── check-changed failed ──"
    exit 1
  fi
}

if [[ ${#unscoped[@]} -gt 0 ]]; then
  echo "Changed outside the react and charts sources and the Storybook stories: ${unscoped[*]}"
  echo "Running every step of make ci; the story passes side by side when the memory allows."
  step "lint, format, typecheck, builds, unit + e2e tests" sh -c "set -e; \
    pnpm lint && pnpm format:check && pnpm typecheck && pnpm build && pnpm storybook:build && \
    pnpm browsers:install && CI=true pnpm test"
  parallel_passes
  echo "── check-changed passed in ${SECONDS}s ──"
  exit 0
fi

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
    # Vitest filters match the path relative to apps/storybook, where it runs.
    filters=("${stories[@]#apps/storybook/}")
    step browsers pnpm browsers:install
    step "stories, default pass" pnpm --filter @cosmos/storybook exec vitest run --project=storybook "${filters[@]}"
    for theme in light sand deep-blue; do
      step "stories, contrast in $theme" env A11Y_THEME="$theme" \
        pnpm --filter @cosmos/storybook exec vitest run --project=storybook "${filters[@]}"
    done
    step "stories, right to left" env STORY_DIR=rtl \
      pnpm --filter @cosmos/storybook exec vitest run --project=storybook "${filters[@]}"
  fi
fi
echo "── check-changed passed in ${SECONDS}s ──"
