#!/usr/bin/env bash
# Compares two story captures (screenshots/<theme>/<story-id>.png trees) and
# lists the captures that changed, appeared or disappeared.
#
#   visual-diff.sh <previous-dir> <current-dir> <out-dir>
#
# Writes <out-dir>/report.md, and for each changed capture
# <out-dir>/<theme>/<story-id>.before.png, .after.png and, when both images
# have the same size, .diff.png. Needs ImageMagick's `compare` (6 or 7).
set -euo pipefail

prev=$1
cur=$2
out=$3
# Antialiasing can differ by a shade between two runs of the same browser.
fuzz=${VISUAL_DIFF_FUZZ:-1%}
# Longer lists are cut in the report (the out dir still has every image).
max_listed=${VISUAL_DIFF_MAX_LISTED:-200}

mkdir -p "$out"
list() { (cd "$1" && find . -name '*.png' | sed 's|^\./||' | LC_ALL=C sort); }
LC_ALL=C comm -13 <(list "$prev") <(list "$cur") >"$out/new.txt"
LC_ALL=C comm -23 <(list "$prev") <(list "$cur") >"$out/removed.txt"
LC_ALL=C comm -12 <(list "$prev") <(list "$cur") >"$out/common.txt"

# Prints the capture when it differs: a new size (the story grew or shrank,
# which ImageMagick 7 would only compare over the common area), or pixels that
# differ beyond the fuzz (compare exits 0 when the images match).
compare_one() {
  local f=$1 same_size=false
  if [ "$(identify -format '%wx%h' "$prev/$f")" = "$(identify -format '%wx%h' "$cur/$f")" ]; then
    same_size=true
    if compare -metric AE -fuzz "$fuzz" "$prev/$f" "$cur/$f" null: 2>/dev/null; then
      return 0
    fi
  fi
  local base="$out/${f%.png}"
  mkdir -p "$(dirname "$base")"
  cp "$prev/$f" "$base.before.png"
  cp "$cur/$f" "$base.after.png"
  if $same_size; then
    compare -fuzz "$fuzz" "$prev/$f" "$cur/$f" "$base.diff.png" 2>/dev/null || true
  fi
  echo "$f"
}
export -f compare_one
export prev cur out fuzz

# shellcheck disable=SC2016 # $1 is expanded by the inner bash
xargs -a "$out/common.txt" -r -P "$(nproc)" -I{} bash -c 'compare_one "$1"' _ {} \
  | LC_ALL=C sort >"$out/changed.txt"

# A section of the report: a count, then up to max_listed captures.
section() {
  local title=$1 file=$2 count
  count=$(wc -l <"$file")
  echo "### $title: $count"
  echo
  if [ "$count" -gt 0 ]; then
    # shellcheck disable=SC2016 # literal backticks: Markdown code spans
    head -n "$max_listed" "$file" | sed 's|\.png$||; s|^|- `|; s|$|`|'
    if [ "$count" -gt "$max_listed" ]; then echo "- … and $((count - max_listed)) more"; fi
    echo
  fi
}

{
  echo "Compared $(wc -l <"$out/common.txt") captures present in both runs."
  echo
  section 'Changed' "$out/changed.txt"
  section 'New' "$out/new.txt"
  section 'Removed' "$out/removed.txt"
} >"$out/report.md"
