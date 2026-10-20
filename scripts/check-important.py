#!/usr/bin/env python3
"""Hold the line on `!important` in the theme's own CSS.

WHY. Much of the theme's CSS has to beat core rules that load after it or carry
inline styles, and `!important` is often the documented, correct tool for that
(DESIGN.md, specificity). But nothing counted it, so it could only grow: every
new override that reached for it raised the floor for the next one. This keeps
the count from rising without a decision. It does not judge any single use.

ADVISORY FIRST. Plain runs report and exit 0. `--check` fails when the count is
ABOVE the baseline; a count below it is never a failure, only a note to lower
BASELINE in the same change, so removing one never turns the check red.

Counted outside comments only (a comment that explains why a rule needs it is
not a use). Vendored CSS (VENDORED) is not the theme's to change.

    python3 scripts/check-important.py
    python3 scripts/check-important.py --check

Exit 0 = at or below baseline (or advisory mode), 1 = above baseline under --check.
"""
import argparse
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent

BASELINE = 509

SOURCES = ["custom.css", "dark.css", "dz-tokens.css"]
DIRS = ["css"]
VENDORED = {"css/ionicons.min.css", "css/animate.css"}

COMMENT = re.compile(r"/\*.*?\*/", re.S)
IMPORTANT = re.compile(r"!\s*important", re.I)


def sources(root):
    files = [root / f for f in SOURCES]
    for d in DIRS:
        files.extend(sorted((root / d).glob("*.css")))
    return [f for f in files if f.exists() and str(f.relative_to(root)) not in VENDORED]


def count(root):
    per_file = {}
    for f in sources(root):
        n = len(IMPORTANT.findall(COMMENT.sub("", f.read_text(encoding="utf-8"))))
        if n:
            per_file[str(f.relative_to(root))] = n
    return per_file


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="fail when the count is above BASELINE")
    ap.add_argument("--root", default=str(REPO), help="theme checkout to count (default: this repo)")
    args = ap.parse_args()
    per_file = count(pathlib.Path(args.root))
    total = sum(per_file.values())
    if total > BASELINE:
        top = sorted(per_file.items(), key=lambda kv: -kv[1])[:5]
        print(f"{'FAIL' if args.check else 'NOTE'}: {total} !important, above the baseline of {BASELINE}. "
              f"Busiest files: {', '.join(f'{k} {v}' for k, v in top)}. Prefer specificity, or record the "
              f"reason in a comment and raise BASELINE with sign-off.", file=sys.stderr)
        return 1 if args.check else 0
    if total < BASELINE:
        print(f"OK: {total} !important, {BASELINE - total} below the baseline of {BASELINE}.")
        print(f"RATCHET: lower BASELINE in check-important.py to {total} in this same change.")
        return 0
    print(f"OK: {total} !important, exactly the baseline.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
