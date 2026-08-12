#!/usr/bin/env bash
# Verifies that working-tree changes to shipped source are comment-only.
# For each file (args, or every modified tracked *.css/*.js/*.html vs HEAD),
# strips comments and collapses insignificant whitespace on both the HEAD and
# working-tree versions via scripts/strip_comments.py, then requires the two
# results to be byte-identical.
set -euo pipefail
cd "$(dirname "$0")/.."

lang_of() {
    case "${1##*.}" in
        css) echo css ;;
        js) echo js ;;
        html) echo html ;;
        *) echo "" ;;
    esac
}

files=("$@")
if [ ${#files[@]} -eq 0 ]; then
    mapfile -t files < <(git diff HEAD --name-only --diff-filter=M -- '*.css' '*.js' '*.html')
fi
if [ ${#files[@]} -eq 0 ]; then
    echo "OK: no modified css/js/html files to check"
    exit 0
fi

fail=0
for f in "${files[@]}"; do
    lang=$(lang_of "$f")
    if [ -z "$lang" ]; then
        echo "SKIP (unknown type): $f"
        continue
    fi
    if diff -q \
        <(git show "HEAD:$f" | python3 scripts/strip_comments.py --lang "$lang") \
        <(python3 scripts/strip_comments.py --lang "$lang" < "$f") >/dev/null; then
        echo "ok: $f"
    else
        echo "CODE CHANGED: $f"
        diff \
            <(git show "HEAD:$f" | python3 scripts/strip_comments.py --lang "$lang") \
            <(python3 scripts/strip_comments.py --lang "$lang" < "$f") | head -20
        fail=1
    fi
done
if [ "$fail" -eq 0 ]; then
    echo "OK: all changes are comment-only"
fi
exit "$fail"
