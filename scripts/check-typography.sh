#!/usr/bin/env bash
# Typography contract checker. Every font-family/size/weight in theme CSS must
# come from --dz-* tokens (dz-tokens.css). See DESIGN.md Typography.
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

# Retired family names must not appear anywhere in the repo (js/html/json/css).
out=$(grep -rn "main-font" --include="*.css" --include="*.js" --include="*.html" --include="*.json" . | grep -v "^\./docs/")
if [ -n "$out" ]; then
  fail=1
  echo "$out" | sed -E "s|^([^:]+:[0-9]+):|\1: retired family name: |"
fi

if [ "$fail" -eq 0 ]; then echo "typography contract: CLEAN"; else echo "typography contract: VIOLATIONS (see above)"; fi
exit $fail
