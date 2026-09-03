#!/usr/bin/env bash
# Button contract checker, two rules with deliberately different scopes:
#   (a) css/buttons.css may only style border-radius, box-shadow, and padding
#       through --dz-btn-* tokens. That file-scoped rule stays file-scoped:
#       raw padding/radius outside the button family is none of its business.
#   (b) a filled button's :hover fill must stay in the family its rest state
#       declares (DESIGN.md > Buttons > States: color-mix(<bg> 90%, black) off
#       the SAME --dz-btn-*-bg token). Rule (a)'s token-only test cannot see
#       this: var(--dz-btn-primary-bg) on a danger button is a perfectly good
#       token, just the wrong one. Scanned repo-wide, because button rules live
#       outside css/buttons.css too (the Setup "Apply Settings" pill is styled
#       in css/nav.css, which rule (a) never reads).
# See DESIGN.md Buttons and the 2026-07-17 button redesign spec.
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

# --- Rule (b): filled hover stays in its rest state's family -----------------
#
# File set is derived from git the same way check-shadows.sh derives its own
# (tracked + untracked-but-not-ignored *.css, anywhere in the repo, minus the
# token-definition and vendor files), so a new stylesheet cannot silently dodge
# the rule. dz-tokens.css and dark.css only DEFINE tokens; ionicons.min.css is
# vendored.
exclude="dz-tokens.css
dark.css
css/ionicons.min.css"
files=$( { git ls-files -- '*.css'; git ls-files -o --exclude-standard -- '*.css'; } \
         | sort -u | grep -vFxf <(printf '%s\n' "$exclude") )

# The awk below parses rules rather than grepping lines: the rest fill and the
# hover fill live in two different rules, often with different selector LISTS
# (.btn-danger, .btn-modern-warning vs the same two with :hover), so the two
# have to be matched per individual selector, not per rule.
#
# Only a hover that actually declares a background is judged. A filled button
# whose hover rule leaves the fill alone is legal (it inherits the rest fill);
# the rule catches a hover that repaints, and repaints out of family.
#
# A rule carrying dz-btn-exempt on any of its lines is skipped whole, matching
# rule (a)'s line-level annotation as closely as a rule-level check can.
out=$(awk '
  function trim(s) { sub(/^[ \t]+/, "", s); sub(/[ \t]+$/, "", s); return s }
  # Canonical selector form so ".a > b" and ".a>b" are the same key.
  function norm(s) {
    gsub(/[ \t]+/, " ", s)
    gsub(/ *> */, ">", s); gsub(/ *\+ */, "+", s); gsub(/ *~ */, "~", s)
    return trim(s)
  }
  # Last background/background-color declared in the rule body, !important and
  # surrounding space removed; "" when the rule sets no fill.
  function fill(b,   parts, n, i, d, v) {
    v = ""
    n = split(b, parts, ";")
    for (i = 1; i <= n; i++) {
      d = trim(parts[i])
      if (d ~ /^background(-color)?[ \t]*:/) {
        v = trim(substr(d, index(d, ":") + 1))
        sub(/[ \t]*!important$/, "", v)
        gsub(/var\([ \t]+/, "var(", v); gsub(/[ \t]+\)/, ")", v)
        v = trim(v)
      }
    }
    return v
  }
  function emit(sel, body, ln, ex,   parts, n, i, s, key, v) {
    if (ex) return
    v = fill(body)
    if (v == "") return
    n = split(sel, parts, ",")
    for (i = 1; i <= n; i++) {
      s = norm(parts[i])
      if (s == "") continue
      if (s ~ /:hover$/) {
        key = substr(s, 1, length(s) - 6)
        hovbg[key] = v; hovat[key] = FILENAME ":" ln
      } else if (s !~ /:(hover|focus|active|visited|disabled)/) {
        restbg[s] = v
      }
    }
  }
  FNR == 1 { incomment = 0; depth = 0; selbuf = ""; ruledepth = -1; body = ""; exempt = 0 }
  {
    orig = $0
    # Blank /* */ spans, tracking state across lines, so a brace or a fill
    # mentioned in contract prose cannot steer the parser (same technique as
    # strip() above, minus the line numbering).
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
    n = length(out)
    for (j = 1; j <= n; j++) {
      c = substr(out, j, 1)
      if (c == "{") {
        depth++
        cand = trim(selbuf); selbuf = ""
        # An at-rule (@media, @supports, @keyframes) opens a block that WRAPS
        # rules rather than being one; only the innermost non-@ block is a rule.
        # Keyframe selectors (0%, to) reach emit() but never key a :hover, so
        # they cannot produce a pair.
        if (ruledepth < 0 && substr(cand, 1, 1) != "@") {
          ruledepth = depth; sel = cand; ruleline = FNR; body = ""; exempt = 0
        }
      } else if (c == "}") {
        if (ruledepth == depth) { emit(sel, body, ruleline, exempt); ruledepth = -1; body = "" }
        depth--; selbuf = ""
      } else if (ruledepth >= 0) body = body c
      else selbuf = selbuf c
    }
    if (ruledepth >= 0 && orig ~ /dz-btn-exempt/) exempt = 1
    if (ruledepth >= 0) body = body " "; else selbuf = selbuf " "
  }
  END {
    for (k in hovbg) {
      if (!(k in restbg)) continue
      r = restbg[k]
      # Filled families only. --dz-btn-hover-bg and --dz-btn-disabled-bg are
      # deliberately absent: they are not resting fills, and toggle-selected is
      # its own family with no hover rule in the contract.
      if (r !~ /^var\(--dz-btn-(primary|danger|info|warning|success)-bg\)$/) continue
      tok = substr(r, 5, length(r) - 5)
      h = hovbg[k]
      if (h == r) continue
      if (h ~ /color-mix/ && index(h, "var(" tok ")") > 0) continue
      print hovat[k] ": hover leaves the filled family: " k ":hover paints " h \
            ", rest is " r " (DESIGN.md > Buttons > States: color-mix(in srgb, " tok " 90%, black))"
    }
  }
' $files | sort)
if [ -n "$out" ]; then
  fail=1
  echo "$out"
fi

if [ "$fail" -eq 0 ]; then echo "button contract: CLEAN"; else echo "button contract: VIOLATIONS (see above)"; fi
exit $fail
