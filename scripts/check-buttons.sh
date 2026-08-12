#!/usr/bin/env bash
# Button contract checker: css/buttons.css may only style border-radius,
# box-shadow, and padding through --dz-btn-* tokens. See DESIGN.md Buttons
# and the 2026-07-17 button redesign spec.
# Exit 0 clean, 1 violations.
set -u
cd "$(dirname "$0")/.."
fail=0
f=css/buttons.css

# Lines annotated with "dz-btn-exempt" are skipped (the annotation is
# expected to carry its own justification comment alongside it, e.g.
# "/* dz-btn-exempt: caret notch, not a boxed button */"). Comment TEXT is
# blanked so contract prose mentioning these properties isn't flagged.
# Emits "lineno:content" pairs with original line numbers preserved (NR
# counts every line, so blanking never shifts later numbers).
#
# The blanking tracks /* */ state ACROSS lines. The previous version dropped
# only lines whose first non-space characters were "/*", which caught the
# opening line of a block comment but not its continuation lines: prose in
# the middle of a block reading "box-shadow: none explicitly rather than
# left unset" was reported as a raw box-shadow violation (css/buttons.css
# 621 and 623, red since that comment was written).
#
# The exempt annotation is read from the ORIGINAL line, before blanking,
# because it lives inside a comment: blanking first would erase the
# annotation and re-flag the very declaration it exempts.
strip() {
  awk '
    {
      orig = $0
      out = ""; i = 1; len = length(orig)
      while (i <= len) {
        if (!incomment) {
          q = index(substr(orig, i), "/*")
          if (q == 0) { out = out substr(orig, i); break }
          out = out substr(orig, i, q - 1)
          i = i + q + 1
          incomment = 1
        } else {
          q = index(substr(orig, i), "*/")
          if (q == 0) { break }
          i = i + q + 1
          incomment = 0
        }
      }
      if (orig ~ /dz-btn-exempt/) next
      print NR ":" out
    }
  ' "$1"
}

# Reports every "$1:" declaration in $f whose value does not match the
# allowed pattern $2, tagged with reason $3.
#
# Each check's output is captured into a variable before acting on it. A
# naive "cmd | sed ... && fail=1" is wrong here: a pipeline's exit status is
# its last command's, and sed exits 0 on empty input the same as on real
# input, so "&& fail=1" would fire whether or not grep -vE actually found a
# violation, making a clean tree unreachable.
check_property() {
  local property="$1" allowed="$2" reason="$3" out
  out=$(strip "$f" | grep -E "${property}:" \
        | grep -vE "${property}:[[:space:]]*(${allowed})[[:space:]]*(!important)?[[:space:]]*[;}]")
  if [ -n "$out" ]; then
    fail=1
    echo "$out" | sed -E "s|^([0-9]+):|${f}:\1: ${reason}: |"
  fi
}

# border-radius: only var(--dz-btn-*) or 0
check_property "border-radius" "var\(--dz-btn-[a-z-]+\)|0" "raw border-radius"
# box-shadow: only var(--dz-btn-*), or comma-joined var() pairs (the focus
# ring stacks on top of the resting/pressed shadow), or none
check_property "box-shadow" "var\(--dz-btn-[a-z-]+\)(,[[:space:]]*var\(--dz-btn-[a-z-]+\))*|none" "raw box-shadow"
# padding shorthand: only var(--dz-btn-pad-*) or 0. Longhand padding-top/
# -right/-bottom/-left is out of contract scope for now.
check_property "padding" "var\(--dz-btn-pad-[a-z]+\)|0" "raw padding"

if [ "$fail" -eq 0 ]; then echo "button contract: CLEAN"; else echo "button contract: VIOLATIONS (see above)"; fi
exit $fail
