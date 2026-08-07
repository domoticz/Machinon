#!/usr/bin/env bash
# check-shadows.sh - box-shadow contract checker: every box-shadow value in
# theme CSS (outside the token files) must be a --dz-* token consumption, a
# none reset, or carry a dz-shadow-exception marker. See DESIGN.md and the
# 2026-08-07 shadow audit (docs/superpowers/2026-08-07-shadow-audit.md).
# Exit 0 clean, 1 violations.
set -u
cd "$(dirname "$0")/.."
fail=0

files=$(ls custom.css css/*.css | grep -v ionicons.min.css)

# Blanks out CSS /* ... */ spans, tracking comment state across lines so a
# comment that opens on one line and closes several lines later is fully
# removed, and prints "lineno:content" for every line (comment lines emitted
# blank, never dropped, so line numbers never shift). This is what keeps a
# box-shadow value quoted inside review-note prose (12 such lines in the
# current tree, e.g. a worked example in parens, or a snippet reproduced
# while explaining a cascade rule) from being mistaken for a live
# declaration, and what keeps "transition: ... box-shadow ..." lines (2 in
# buttons.css, naming the property, not a value) out of the candidate set:
# neither leaves a "box-shadow<stuff-without-a-colon>:" shape behind for the
# value grep below to latch onto.
strip_comments() {
  awk '
    {
      line = $0; out = ""; i = 1; n = length(line)
      while (i <= n) {
        if (!incomment) {
          idx = index(substr(line, i), "/*")
          if (idx == 0) { out = out substr(line, i); i = n + 1 }
          else { out = out substr(line, i, idx - 1); i += idx + 1; incomment = 1 }
        } else {
          idx = index(substr(line, i), "*/")
          if (idx == 0) { i = n + 1 }
          else { i += idx + 1; incomment = 0 }
        }
      }
      print NR ":" out
    }
  ' "$1"
}

for f in $files; do
  mapfile -t raw < "$f"
  mapfile -t stripped < <(strip_comments "$f" | cut -d: -f2-)

  # True when a dz-shadow-exception marker sits on line $1 (1-based) itself,
  # or anywhere in the unbroken run of comment-only lines directly above it.
  # Walks upward past pure-comment lines (nothing survives stripping), and
  # stops - reporting no marker - at the first blank line or the first line
  # that still carries real code once comments are stripped. This covers
  # both an inline marker and a marker at the top of a multi-line comment
  # block that closes right before the declaration: the shape of both
  # marked exceptions in the current tree (device-status.css's pulse peak,
  # custom.css's badge glow; both markers sit 3-4 lines above the value,
  # inside the same comment block).
  has_marker() {
    local ln=$1
    case "${raw[ln-1]}" in *dz-shadow-exception*) return 0;; esac
    ln=$((ln - 1))
    while [ "$ln" -ge 1 ]; do
      [[ "${raw[ln-1]}" =~ ^[[:space:]]*$ ]] && return 1
      [[ "${stripped[ln-1]}" =~ [^[:space:]] ]] && return 1
      case "${raw[ln-1]}" in *dz-shadow-exception*) return 0;; esac
      ln=$((ln - 1))
    done
    return 1
  }

  for ((i = 0; i < ${#raw[@]}; i++)); do
    text="${stripped[i]}"
    case "$text" in *box-shadow*) : ;; *) continue;; esac
    value=$(printf '%s' "$text" | sed -n 's/.*box-shadow[^:]*:[[:space:]]*//p' | sed 's/!important.*//; s/;.*//')
    case "$value" in
      ""|none*|*"var(--dz-"*) continue;;
    esac
    lineno=$((i + 1))
    has_marker "$lineno" && continue
    echo "FAIL $f:$lineno literal box-shadow: $value"
    fail=1
  done
done

if [ "$fail" -eq 0 ]; then echo "shadow contract: CLEAN"; else echo "shadow contract: VIOLATIONS (see above)"; fi
exit $fail
