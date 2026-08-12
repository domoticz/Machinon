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

if [ "$fail" -eq 0 ]; then
    echo "OK: DESIGN.md palette matches the CSS tokens"
fi
exit "$fail"
