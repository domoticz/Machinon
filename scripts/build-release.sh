#!/usr/bin/env bash
# Release stager for the Machinon theme: builds the runtime-only tree that
# becomes the release zip and the `dist` branch.
#
# What it does, in order:
#   1. design-contract guards must pass (release gate)
#   2. scripts/build-dist.sh flattens custom.css's @import chain to
#      dist/custom.css (one file, no extra round trips for users)
#   3. CSS is comment-stripped and whitespace-collapsed by
#      scripts/strip_comments.py (no minifier dependency needed)
#   4. everything else on the ALLOWLIST is copied verbatim
#   5. prints the staged manifest; any failure exits non-zero
#
# Output: dist/machinon/ (never committed; dist/ is gitignored)
#
# COPY-PASTE NOTES for other theme authors, the only things to change:
#   - STAGE: your theme's folder name (users unzip or clone this name)
#   - guard scripts: keep the ones whose contracts your theme adopts,
#     drop the rest (they are Machinon's design-system checkers)
#   - ALLOWLIST: the files and dirs your theme actually serves at runtime
#   - the dist README heredoc at the bottom
# Requires bash 4+, GNU coreutils, python3 (stock Linux is fine; on macOS:
# brew install bash coreutils).
set -euo pipefail
cd "$(dirname "$0")/.."

STAGE="dist/machinon"

fail() {
  echo "build-release: ERROR: $*" >&2
  exit 1
}

echo "== design-contract guards"
scripts/check-typography.sh
scripts/check-buttons.sh
scripts/check-shadows.sh
scripts/check-menus.sh
scripts/check-tokens.sh

echo "== flatten @import chain"
scripts/build-dist.sh

echo "== stage runtime tree"
rm -rf "$STAGE"
mkdir -p "$STAGE"

# Comment-strips (and whitespace-collapses) one CSS file. Output is a
# single line; that is intended (smallest artifact without a minifier
# dependency; source stays readable on GitHub).
strip_css() {
  local src="$1" dest="$2"
  python3 scripts/strip_comments.py --lang css < "$src" > "$dest"
  [ -s "$dest" ] || fail "empty output stripping $src"
}

strip_css dist/custom.css "$STAGE/custom.css"
strip_css dark.css "$STAGE/dark.css"
strip_css dz-tokens.css "$STAGE/dz-tokens.css"

# ALLOWLIST: runtime files shipped verbatim. Nothing outside this list and
# the three stripped CSS files above ever reaches users.
cp -r --parents \
  custom.js \
  js \
  src/js \
  images \
  fonts \
  lang \
  templates \
  schemes \
  iconpack \
  theme.json \
  iconsettings.html \
  LICENSE.txt \
  NOTICE \
  "$STAGE/"

# Dist README: what installers see when they clone -b dist or unzip.
cat > "$STAGE/README.md" <<'EOF'
# Machinon (built distribution)

This is the BUILT distribution of the Machinon theme for Domoticz:
runtime files only, with the CSS flattened to a single file. Do not edit
these files; changes belong in the source repository and are overwritten
on every release.

Source, documentation, issues and releases:
https://github.com/domoticz/Machinon
EOF

echo "== sanity checks"
head -c 8 "$STAGE/custom.css" | grep -q '@charset' \
  || fail "shipped custom.css does not start with @charset"
if grep -q '@import' "$STAGE/custom.css"; then
  fail "unflattened @import in shipped custom.css"
fi

echo "== manifest ($STAGE)"
find "$STAGE" -type f | LC_ALL=C sort
VERSION=$(python3 -c "import json; print(json.load(open('theme.json'))['version'])")
echo "build-release: staged $(find "$STAGE" -type f | wc -l) files for version $VERSION"
