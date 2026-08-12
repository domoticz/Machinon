#!/usr/bin/env bash
# DESIGN.md's frontmatter palette must match the shipped CSS token values.
# Light values live in dz-tokens.css :root (grep -m1 finds that block because it
# precedes the html:root override block); dark values live in dark.css.
set -euo pipefail
cd "$(dirname "$0")/.."
fail=0

doc_color() {
    grep -m1 -E "^  $1: " DESIGN.md | sed -E 's/.*"(#[0-9A-Fa-f]{3,8})".*/\1/'
}
css_color() { # file token
    grep -m1 -E "^\s*$2:" "$1" | grep -oE '#[0-9A-Fa-f]{3,8}' | head -1
}
check() { # doc-key file token
    local doc css
    doc=$(doc_color "$1") || true
    css=$(css_color "$2" "$3") || true
    if [ -z "$doc" ] || [ -z "$css" ]; then
        echo "MISSING: $1 (doc='$doc' css='$css' from $3 in $2)"
        fail=1
    elif [ "${doc,,}" != "${css,,}" ]; then
        echo "DRIFT: $1 doc=$doc css=$css ($3 in $2)"
        fail=1
    fi
}

L=dz-tokens.css
D=dark.css
check light-bg             $L --dz-body-bg
check light-primary        $L --dz-accent-color
check light-navbar         $L --dz-nav-bg
check light-surface        $L --dz-widget-bg
check light-text           $L --dz-body-text
check light-text-secondary $L --secondary-text-color
check light-border         $L --dz-input-border
check light-disabled       $L --dz-status-disabled
check light-error          $L --dz-accent-red-base
check light-success        $L --dz-btn-success-bg
check light-warning        $L --dz-btn-warning-bg
check dark-bg              $D --dz-body-bg
check dark-primary         $D --dz-accent-color
check dark-navbar          $D --dz-nav-bg
check dark-surface         $D --dz-widget-bg
check dark-text            $D --dz-body-text
check dark-text-secondary  $D --secondary-text-color
check dark-border          $D --dz-input-border
check dark-disabled        $D --dz-status-disabled
check dark-error           $D --dz-accent-red
check dark-success         $D --dz-btn-success-bg
check dark-warning         $D --dz-btn-warning-bg
check on-primary           $L --dz-accent-text

# Fixed colors (both themes) that are not CSS custom properties: they live as
# scattered literals, so match on the surrounding declaration instead of a
# token name. The pattern anchors on the property/function, not the color
# itself, so a changed literal is still caught as drift rather than a silent
# pattern miss.
css_color_literal() { # file pattern
    grep -m1 -E "$2" "$1" | grep -oE '#[0-9A-Fa-f]{3,8}' | head -1
}
check_literal() { # doc-key file pattern
    local doc css
    doc=$(doc_color "$1") || true
    css=$(css_color_literal "$2" "$3") || true
    if [ -z "$doc" ] || [ -z "$css" ]; then
        echo "MISSING: $1 (doc='$doc' css='$css' from pattern '$3' in $2)"
        fail=1
    elif [ "${doc,,}" != "${css,,}" ]; then
        echo "DRIFT: $1 doc=$doc css=$css (pattern '$3' in $2)"
        fail=1
    fi
}

check_literal label-important     custom.css          'background-color: #'
check_literal gradient-start      css/login.css       'linear-gradient\(to right, #'
check_literal gradient-dark-start css/dark_theme.css  'background-image: linear-gradient\(275deg, #'

# --- Type scale: frontmatter px vs CSS rem (16px root) ---
doc_px() { # key -> bare number, from "  key:\n    fontSize: 11px"
    awk -v k="  $1:" '$0==k{f=1;next} f&&/fontSize:/{gsub(/[^0-9]/,"");print;exit}' DESIGN.md
}
css_rem_px() { # token -> px number (rem*16), from "--token: 0.6875rem;"
    grep -m1 -E "^\s*$1:" dz-tokens.css | grep -oE '[0-9.]+rem' | tr -d 'rem' \
        | awk '{printf "%g", $1*16}'
}
check_px() { # doc-key token
    local doc css
    doc=$(doc_px "$1")
    css=$(css_rem_px "$2")
    if [ -z "$doc" ] || [ -z "$css" ]; then
        echo "MISSING: type $1 (doc='$doc' css='$css' from $2)"
        fail=1
    elif [ "$doc" != "$css" ]; then
        echo "DRIFT: type $1 doc=${doc}px css=${css}px ($2)"
        fail=1
    fi
}
check_px micro   --dz-text-micro
check_px xs      --dz-text-xs
check_px sm      --dz-text-sm
check_px md      --dz-text-md
check_px lg      --dz-text-lg
check_px display --dz-text-display

# --- Radius: frontmatter px vs CSS token px ---
# Only button and container have an unambiguous single CSS token home. The
# other rounded.* keys (xs, sm, interactive, circle) are doc-only conventions
# with no single matching custom property (interactive in particular is
# split across --dz-card-radius-chrome and --dz-mobile-card-btn-radius,
# neither of which is the nav-link/input-border concept the doc describes),
# so they stay unguarded rather than get a guessed mapping.
doc_radius() { # key -> "10px"
    awk -v k="  $1:" '$0 ~ "^"k{sub(/.*: /,"");print;exit}' DESIGN.md
}
css_px() { # file token -> "10px"
    grep -m1 -E "^\s*$2:" "$1" | grep -oE '[0-9]+px' | head -1
}
check_radius() { # doc-key token
    local doc css
    doc=$(doc_radius "$1")
    css=$(css_px dz-tokens.css "$2")
    if [ -z "$doc" ] || [ -z "$css" ]; then
        echo "MISSING: radius $1 (doc='$doc' css='$css' from $2)"
        fail=1
    elif [ "$doc" != "$css" ]; then
        echo "DRIFT: radius $1 doc=$doc css=$css ($2)"
        fail=1
    fi
}
check_radius button    --dz-btn-radius
check_radius container --dz-card-radius

if [ "$fail" -eq 0 ]; then
    echo "OK: DESIGN.md palette matches the CSS tokens"
fi
exit "$fail"
