#!/usr/bin/env bash
# Typography contract checker. Every font-family/size/weight in theme CSS must
# come from --dz-* tokens (dz-tokens.css), and the type-scale tokens themselves
# must be declared in rem. See DESIGN.md Typography.
# Exit 0 clean, 1 violations. Vendor css/ionicons.min.css is excluded.
set -u
cd "$(dirname "$0")/.."
fail=0

files=$(ls custom.css css/*.css | grep -v ionicons.min.css)

# Lines inside @font-face blocks are exempt when annotated with /* dz-face */.
# Emits "lineno:content" pairs with original line numbers preserved (grep -n
# numbers before filtering, so removed lines never shift later numbers), with
# dz-face-annotated lines and comment-only lines removed.
strip() {
  grep -vn "dz-face" "$1" | grep -v "^[0-9]*:[[:space:]]*/\*"
}

# Reports every "$1:" declaration in each theme CSS file whose value does not
# match the allowed pattern $2, tagged with reason $3.
#
# Each check's output is captured into a variable before acting on it. A
# naive "cmd | sed ... && fail=1" is wrong here: a pipeline's exit status is
# its last command's, and sed exits 0 on empty input the same as on real
# input, so "&& fail=1" would fire on every file whether or not grep -vE
# actually found a violation, making a clean tree unreachable.
check_property() {
  local property="$1" allowed="$2" reason="$3" f out
  for f in $files; do
    out=$(strip "$f" | grep -E "${property}:" | grep -vE "${property}:${allowed}")
    if [ -n "$out" ]; then
      fail=1
      echo "$out" | sed -E "s|^([0-9]+):|${f}:\1: ${reason}: |"
    fi
  done
}

# font-family: only var(--dz-font-family|mono|icons)
check_property "font-family" "[[:space:]]*var\(--dz-font-(family|mono|icons)\)" "raw font-family"
# font-size: only var(--dz-text-*|--dz-icon-size-*) or 0
check_property "font-size" "[[:space:]]*(var\(--dz-(text|icon-size)-[a-z-]+\)|0)[[:space:]]*(!important)?[[:space:]]*[;}]" "raw font-size"
# font-weight: only var(--dz-weight-*)
check_property "font-weight" "[[:space:]]*var\(--dz-weight-[a-z-]+\)" "raw font-weight"

# font shorthand: no token-legal form exists, so every hit is a violation.
# The boundary alternation (lineno prefix from strip(), or ; { whitespace)
# plus requiring ":" right after "font" (optional whitespace) keeps longhands
# like font-family:/font-size:/font-weight:/font-style: from matching.
for f in $files; do
  out=$(strip "$f" | grep -E "(^[0-9]+:|[;{[:space:]])font[[:space:]]*:")
  if [ -n "$out" ]; then
    fail=1
    echo "$out" | sed -E "s|^([0-9]+):|${f}:\1: raw font shorthand: |"
  fi
done

# Type-scale token DEFINITIONS must be rem (conversion 2026-08-11), so a later edit
# cannot quietly put px back and re-break the browser's default-font-size preference.
# Note dz-tokens.css is deliberately NOT in $files above (that list is the consuming
# stylesheets), so this is its own pass over the token file.
#
# Allowed values: a rem literal, or a var() reference - the semantic aliases
# (--dz-text-value / -section-title / -nav-touch) forward to --dz-text-lg.
#
# Exempt BY NAME: the standby clock pair. Those are screen-filling display sizing rather
# than reading text, so they must NOT follow a raised font preference (it would overflow
# the standby surface); dz-tokens.css carries the full reasoning. Exempting by name rather
# than by "px is fine anywhere" keeps every other type token honest, and means adding a new
# px type token is a deliberate edit to this list, not an accident.
# --dz-text-widget-value is exempt for a different reason than the clock pair:
# it is not a size but a min() ceiling of core's own 1.9em with a
# container-relative cap, which neither a bare rem nor a var() alias can
# express. Inlining it would fail the font-size check instead, so there would be
# no legal way to write it at all. Exempt by name, like the clock, so adding
# another stays a deliberate edit.
clock_exempt="--dz-text-clock|--dz-text-clock-sub|--dz-text-widget-value|--dz-text-widget-line"
out=$(grep -n -- "--dz-text-[a-z-]*:" dz-tokens.css \
      | grep -vE "^[0-9]+:[[:space:]]*(${clock_exempt}):" \
      | grep -vE ":[[:space:]]*([0-9]*\.?[0-9]+rem|var\(--dz-[a-z-]+\))[[:space:]]*;")
if [ -n "$out" ]; then
  fail=1
  echo "$out" | sed -E "s|^([0-9]+):|dz-tokens.css:\1: type token must be rem (or a var alias): |"
fi

# Retired family names must not appear anywhere in the repo (js/html/json/css).
out=$(grep -rn "main-font" --include="*.css" --include="*.js" --include="*.html" --include="*.json" . | grep -v "^\./docs/")
if [ -n "$out" ]; then
  fail=1
  echo "$out" | sed -E "s|^([^:]+:[0-9]+):|\1: retired family name: |"
fi

if [ "$fail" -eq 0 ]; then echo "typography contract: CLEAN"; else echo "typography contract: VIOLATIONS (see above)"; fi
exit $fail
