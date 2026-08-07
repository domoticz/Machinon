#!/usr/bin/env bash
# check-shadows.sh - box-shadow contract checker: every box-shadow value in
# theme CSS (outside the token files) must be a --dz-* token consumption, a
# none reset, or carry a dz-shadow-exception marker. See DESIGN.md and the
# 2026-08-07 shadow audit (docs/superpowers/2026-08-07-shadow-audit.md).
# Exit 0 clean, 1 violations.
#
# Scope note: this gate only ever looks at *.css files (see the `files=`
# glob below); it does not, and cannot, see the one inline shadow in
# src/js/theme-hub-previews.js. That JS declaration carries its own
# dz-shadow-exception marker for documentation, but the marker is not what
# exempts it, the checker never reads the file at all. If more JS-side
# shadows show up, add a narrow grep over src/js here rather than assuming
# this script already covers them.
#
# Validation note: like the sibling checkers (check-typography.sh,
# check-buttons.sh), this one validates that a value REFERENCES a --dz-*
# token, not that the token EXISTS. A typoed custom property name
# (`var(--dz-elv-card)`) still matches the `var(--dz-` pattern and passes,
# then computes to `none` at runtime because the browser can't resolve it.
# This script cannot catch that class of bug.
set -u
cd "$(dirname "$0")/.."
fail=0

# Files carrying only token *definitions* (dz-tokens.css, dark.css) or vendor
# code (ionicons.min.css) are exempt; everything else tracked, plus anything
# new and not yet committed but not gitignored either, is in scope. Deriving
# the set from git rather than a glob means a new css file - anywhere in the
# repo, not just css/ or the root - can't silently dodge the gate.
exclude="dz-tokens.css
dark.css
css/ionicons.min.css"
files=$( { git ls-files -- '*.css'; git ls-files -o --exclude-standard -- '*.css'; } \
         | sort -u | grep -vFxf <(printf '%s\n' "$exclude") )

# Blanks out CSS /* ... */ spans, tracking comment state across lines so a
# comment that opens on one line and closes several lines later is fully
# removed, and prints "lineno:content" for every line (comment lines emitted
# blank, never dropped, so line numbers never shift). This is what keeps a
# box-shadow value quoted inside review-note prose (12 such lines in the
# current tree, e.g. a worked example in parens, or a snippet reproduced
# while explaining a cascade rule) from being mistaken for a live
# declaration.
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

# Reads the comment-stripped file (one input line per original source line,
# so awk's NR is the real line number) and emits one "startline<TAB>value"
# record per box-shadow declaration, value spanning however many physical
# lines it takes to reach the terminating ";" (device-status.css's timeout
# and lowbat rings both split their value across two lines this way). Paren
# depth is tracked so a semicolon can never be mistaken while still inside
# rgb()/rgba()/var(); a "box-shadow" match also requires an immediate (only
# whitespace between) colon and a non-word-char before it, so "transition:
# ..., box-shadow .12s ease" (2 lines in buttons.css, naming the property,
# not a value) is never mistaken for a declaration start: there is no colon
# directly after "box-shadow" on those lines. Fail-closed: if EOF arrives
# still inside a declaration (no top-level ";" ever found), the record's
# value is prefixed __UNTERMINATED__ so the caller rejects it instead of
# silently dropping it.
assemble_declarations() {
  awk '
    BEGIN { in_decl = 0 }
    {
      line = $0; n = length(line); i = 1
      while (i <= n) {
        c = substr(line, i, 1)
        if (!in_decl) {
          if (substr(line, i, 10) == "box-shadow") {
            boundary_ok = (i == 1) ? 1 : (substr(line, i - 1, 1) !~ /[A-Za-z0-9]/)
            j = i + 10
            while (j <= n) {
              cj = substr(line, j, 1)
              if (cj == " " || cj == "\t") { j++ } else { break }
            }
            if (boundary_ok && j <= n && substr(line, j, 1) == ":") {
              in_decl = 1; startline = NR; depth = 0; buf = ""
              i = j + 1
              continue
            }
          }
          i++
        } else {
          if (c == "(") { depth++; buf = buf c; i++; continue }
          if (c == ")") { if (depth > 0) depth--; buf = buf c; i++; continue }
          if (c == ";" && depth == 0) {
            print startline "\t" buf
            in_decl = 0; i++; continue
          }
          buf = buf c; i++
        }
      }
      if (in_decl) buf = buf " "
    }
    END { if (in_decl) print startline "\t__UNTERMINATED__" buf }
  '
}

# True when every top-level, comma-separated layer of $1 (multiple shadows
# stack the same way multiple backgrounds do) contains a var(--dz- reference
# somewhere in it. Commas inside rgb()/rgba()/var() do not split (paren
# depth tracked), so a layer that pairs literal geometry with a token-driven
# color - "0px 0px 0px 2px rgb(var(--dz-status-timeout-values))", the live
# shape of device-status.css's timeout/lowbat rings - correctly passes,
# while a layer that is pure literal, alone or stacked next to a real token
# ("0 0 3px red" or "0 0 3px red, var(--dz-elev-card)"), correctly fails.
layers_ok() {
  awk -v val="$1" '
    BEGIN {
      n = length(val); depth = 0; layer = ""; ok = 1
      for (i = 1; i <= n; i++) {
        c = substr(val, i, 1)
        if (c == "(") { depth++; layer = layer c; continue }
        if (c == ")") { if (depth > 0) depth--; layer = layer c; continue }
        if (c == "," && depth == 0) {
          gsub(/^[ \t]+|[ \t]+$/, "", layer)
          if (layer !~ /var\(--dz-/) ok = 0
          layer = ""; continue
        }
        layer = layer c
      }
      gsub(/^[ \t]+|[ \t]+$/, "", layer)
      if (layer != "" && layer !~ /var\(--dz-/) ok = 0
      exit (ok ? 0 : 1)
    }
  '
}

for f in $files; do
  mapfile -t raw < "$f"
  mapfile -t stripped < <(strip_comments "$f" | cut -d: -f2-)
  decls=$(printf '%s\n' "${stripped[@]}" | assemble_declarations)
  [ -z "$decls" ] && continue

  # True when a dz-shadow-exception marker sits on line $1 (1-based) itself,
  # or anywhere in the unbroken run of comment-only lines directly above it.
  # Walks upward past pure-comment lines (nothing survives stripping), and
  # stops - reporting no marker - at the first blank line or the first line
  # that still carries real code once comments are stripped. This covers
  # both an inline marker and a marker at the top of a multi-line comment
  # block that closes right before the declaration: the shape of both
  # marked exceptions in the current tree (device-status.css's pulse peak,
  # custom.css's badge glow; both markers sit 3-4 lines above the value,
  # inside the same comment block). Known limitation, safe direction only:
  # a blank line used as a spacer inside the marker's own comment block
  # would break the walk and read as no-marker (false FAIL, never
  # false-PASS) - not a shape that occurs in the current tree.
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

  while IFS=$'\t' read -r startline rawvalue; do
    [ -z "$startline" ] && continue
    case "$rawvalue" in
      __UNTERMINATED__*)
        echo "FAIL $f:$startline cannot parse box-shadow declaration (no terminating ;): use a token or a dz-shadow-exception marker"
        fail=1
        continue
        ;;
    esac
    value=$(printf '%s' "$rawvalue" | sed 's/!important.*//')
    trimmed=$(printf '%s' "$value" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//; s/[[:space:]]+/ /g')
    if [ -z "$trimmed" ]; then
      echo "FAIL $f:$startline cannot parse box-shadow declaration (empty value): use a token or a dz-shadow-exception marker"
      fail=1
      continue
    fi
    [ "$trimmed" = "none" ] && continue
    layers_ok "$trimmed" && continue
    has_marker "$startline" && continue
    echo "FAIL $f:$startline literal box-shadow: $trimmed"
    fail=1
  done <<< "$decls"
done

if [ "$fail" -eq 0 ]; then echo "shadow contract: CLEAN"; else echo "shadow contract: VIOLATIONS (see above)"; fi
exit $fail
