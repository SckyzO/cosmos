#!/usr/bin/env bash
# Whether a change is documentation only: file names on stdin, one per line.
#
#   git diff --name-only --no-renames "$base" | tests/e2e/checks/docs-only.sh
#
# Exits 0 when there is at least one name and every one is Markdown, a file under docs/, or a
# picture outside packages/, apps/ and tests/ (a picture there can be a fixture or an asset a
# story renders). Anything else, or no name at all, exits 1: the safe answer is "run everything".
# `make check-changed` and the `changes` job of .github/workflows/ci.yml both ask it, so the
# local check and the CI skip the same changes.
set -euo pipefail

seen=0
while IFS= read -r file || [[ -n $file ]]; do
  [[ -n $file ]] || continue
  seen=1
  case $file in
    *.md | docs/*) ;;
    packages/* | apps/* | tests/*) exit 1 ;;
    *.png | *.jpg | *.jpeg | *.gif | *.webp) ;;
    *) exit 1 ;;
  esac
done
[[ $seen -eq 1 ]]
