#!/usr/bin/env bash
# check-menus.sh - menu-family contract checker: css/nav.css, css/sidemenu.css,
# css/settings.css (dropdown menus, mobile side menu, settings tile grid) must consume
# --dz-* tokens for color/shadow/type, not a hardcoded literal. See DESIGN.md and
# .superpowers/sdd/2026-08-10-menus-family/task-2-report.md (--dz-menu-* token
# derivation + the refine-round candidates this checker's exceptions cite).
#
# Three rule classes:
#   (a) color properties (background/background-color/color/border[-side]-color) carry
#       no raw hex or rgb()/rgba() literal, unless marked dz-menu-exception.
#   (b) every box-shadow layer references var(--dz- (mirrors check-shadows.sh's
#       per-layer comma-aware parser, scoped to these 3 files), unless marked
#       dz-menu-exception.
#   (c) font-size/font-weight only from the --dz-text-*/--dz-icon-size-*/--dz-weight-*
#       scale (mirrors check-typography.sh exactly, including that checker's lack of an
#       exception marker: no current violation needs one, and adding an unused escape
#       hatch here would drift from the sibling it mirrors).
# Exit 0 clean, 1 violations.
#
# Validation note: like the sibling checkers, this one validates that a value
# REFERENCES a token, not that the token EXISTS or resolves to anything at runtime - a
# typoed custom property name still matches and passes, then computes to nothing. Rules
# (a)/(b) accept ANY --dz-* var() reference (matching check-shadows.sh's generic
# var(--dz- acceptance), not just --dz-menu-*, because the menus family deliberately
# composes tokens from other families (--dz-nav-active-bg, --dz-accent-color,
# --dz-status-disabled all already appear in the family's own CSS). Rule (c) is
# family-scoped per property (var(--dz-text-*|icon-size-*) for font-size,
# var(--dz-weight-*) for font-weight), matching check-typography.sh/check-buttons.sh.
set -u
cd "$(dirname "$0")/.."
fail=0

files=$(git ls-files -- css/nav.css css/sidemenu.css css/settings.css)

# Blanks out CSS /* ... */ spans, tracking comment state across lines, and prints
# "lineno:content" for every line (comment lines emitted blank, never dropped, so line
# numbers never shift). Identical technique to check-shadows.sh.
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

# Reads the comment-stripped file and emits one "startline<TAB>value" record per
# box-shadow declaration, value spanning however many physical lines it takes to reach
# the terminating ";" (paren depth tracked so rgb()/rgba()/var() commas never split a
# declaration early). Same technique as check-shadows.sh's assemble_declarations,
# generalised to take the property name as $1 so rule (b) can reuse it.
assemble_declarations() {
  local property="$1"
  local plen=${#property}
  awk -v prop="$property" -v plen="$plen" '
    BEGIN { in_decl = 0 }
    {
      line = $0; n = length(line); i = 1
      while (i <= n) {
        c = substr(line, i, 1)
        if (!in_decl) {
          if (substr(line, i, plen) == prop) {
            boundary_ok = (i == 1) ? 1 : (substr(line, i - 1, 1) !~ /[A-Za-z0-9-]/)
            j = i + plen
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

# True when every top-level, comma-separated layer of $1 contains a var(--dz-
# reference somewhere in it. Identical technique to check-shadows.sh's layers_ok.
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

# Reports every "$2:" declaration in $1 whose value does not match allowed pattern $3,
# tagged with reason $4. Identical technique to check-typography.sh's check_property
# (allowed carries its own leading [[:space:]]*/trailing terminator where needed; no
# extra wrapping here). Each check's output is captured before acting on it, since a
# naive "cmd | sed ... && fail=1" would fire whether or not grep -vE found a violation
# (sed exits 0 on empty input same as real input).
check_property() {
  local f="$1" property="$2" allowed="$3" reason="$4" out
  out=$(strip_comments "$f" | grep -E "${property}:" | grep -vE "${property}:${allowed}")
  if [ -n "$out" ]; then
    fail=1
    echo "$out" | sed -E "s|^([0-9]+):|${f}:\1: ${reason}: |"
  fi
}

for f in $files; do
  mapfile -t raw < "$f"
  mapfile -t stripped < <(strip_comments "$f" | cut -d: -f2-)

  # True when a dz-menu-exception marker sits on line $1 (1-based) itself, or anywhere
  # in the unbroken run of comment-only lines directly above it. Same walk-upward logic
  # as check-shadows.sh's has_marker: stops at the first blank line or first line that
  # still carries real code once comments are stripped.
  has_marker() {
    local ln=$1
    case "${raw[ln-1]}" in *dz-menu-exception*) return 0;; esac
    ln=$((ln - 1))
    while [ "$ln" -ge 1 ]; do
      [[ "${raw[ln-1]}" =~ ^[[:space:]]*$ ]] && return 1
      [[ "${stripped[ln-1]}" =~ [^[:space:]] ]] && return 1
      case "${raw[ln-1]}" in *dz-menu-exception*) return 0;; esac
      ln=$((ln - 1))
    done
    return 1
  }

  # --- Rule (a): color properties, no raw hex/rgb(a) literal -----------------------
  # Scoped to the properties the --dz-menu-* family actually governs (surface bg/text/
  # border), NOT "fill" (SVG, Blockly-only) or "scrollbar-color" (browser chrome, no
  # --dz-menu-* equivalent) - those never trip this rule and carry no marker.
  color_props="background-color|background|color|border-color|border-top-color|border-right-color|border-bottom-color|border-left-color|border"
  decls=$(printf '%s\n' "${stripped[@]}" | grep -niE "(^|[;{[:space:]])($color_props)[[:space:]]*:")
  if [ -n "$decls" ]; then
    while IFS=: read -r idx rest; do
      # grep -n against the array (1-indexed) already gives the array position, which
      # equals the line number since stripped has one entry per source line.
      ln=$idx
      value=$(printf '%s' "$rest" | cut -d: -f2- | sed 's/!important.*//; s/;.*//')
      # Hex literal, or rgb()/rgba() whose first argument is numeric (a var()-composed
      # value like "rgba(var(--dz-accent-values), 0.15)" has "var(" as the first
      # argument, not a digit, and correctly does not match).
      if [[ "$value" =~ \#[0-9a-fA-F]{3,8}([^0-9a-fA-F]|$) ]] || [[ "$value" =~ rgba?\([[:space:]]*[0-9] ]]; then
        has_marker "$ln" && continue
        fail=1
        echo "FAIL $f:$ln raw color literal: $(printf '%s' "$rest" | cut -d: -f2- | sed -E 's/^[[:space:]]+|;[[:space:]]*$//g')"
      fi
    done <<< "$decls"
  fi

  # --- Rule (b): box-shadow layers reference var(--dz- ------------------------------
  decls=$(printf '%s\n' "${stripped[@]}" | assemble_declarations "box-shadow")
  if [ -n "$decls" ]; then
    while IFS=$'\t' read -r startline rawvalue; do
      [ -z "$startline" ] && continue
      case "$rawvalue" in
        __UNTERMINATED__*)
          echo "FAIL $f:$startline cannot parse box-shadow declaration (no terminating ;): use a token or a dz-menu-exception marker"
          fail=1
          continue
          ;;
      esac
      value=$(printf '%s' "$rawvalue" | sed 's/!important.*//')
      trimmed=$(printf '%s' "$value" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//; s/[[:space:]]+/ /g')
      [ -z "$trimmed" ] && continue
      [ "$trimmed" = "none" ] && continue
      layers_ok "$trimmed" && continue
      has_marker "$startline" && continue
      echo "FAIL $f:$startline literal box-shadow: $trimmed"
      fail=1
    done <<< "$decls"
  fi

  # --- Rule (c): font-size/font-weight only from the type scale --------------------
  check_property "$f" "font-size" "[[:space:]]*(var\(--dz-(text|icon-size)-[a-z-]+\)|0)[[:space:]]*(!important)?[[:space:]]*[;}]" "raw font-size"
  check_property "$f" "font-weight" "[[:space:]]*var\(--dz-weight-[a-z-]+\)" "raw font-weight"
done

if [ "$fail" -eq 0 ]; then echo "menu contract: CLEAN"; else echo "menu contract: VIOLATIONS (see above)"; fi
exit $fail
