#!/usr/bin/env python3
"""Hold the line on unconditional console output in the shipped theme JS.

WHY. Every `console.log`/`warn`/`error` in this theme is unconditional: it runs
on every install, forever, whether or not anyone is debugging, and 25 of them
interpolate prose rather than emitting a structured event. `src/js` ships
verbatim and unminified, so nothing removes them at build time. The diagnostics
feature (src/js/diag.js) gives those sites a gated, structured home, and the
migration to it is deliberately incremental: call sites move as their files are
touched for other reasons, never as one sweeping rewrite. That only works if
something holds the line meanwhile, or the count climbs in parallel with the
migration and the work never finishes.

WHAT IT DOES NOT COUNT.
  * `console.debug` is the recorder's own output (diag.js), gated behind the
    Diagnostic logging setting. Counting it would penalise the very migration
    this check exists to protect.
  * `js/moment.js` is vendored and never edited here.

BASELINE. 63 call sites, measured 2026-09-10 across custom.js, js/ and src/js/
(39 warn, 23 log, 1 error). It differs from the 67 the design spec recorded on
2026-09-09 because that figure came from a grep with no `(` in the pattern,
counting `console.log` feature tests as calls, and included vendored moment.js.
Lower BASELINE in the same change whenever the real count drops, so the gain is
locked in rather than left as headroom for the next addition.

ADVISORY FIRST. Plain runs report and exit 0. `--check` fails when the count is
ABOVE the baseline; a count below it is never a failure, only a note to lower
the number, since removing a call must not turn a check red.

    python3 scripts/check-console-calls.py
    python3 scripts/check-console-calls.py --check

Exit 0 = at or below baseline (or advisory mode), 1 = above baseline under --check.
"""
import argparse
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent

BASELINE = 63

SOURCES = ["custom.js"]
DIRS = ["js", "src/js"]
VENDORED = {"js/moment.js"}

# The `(` matters: `typeof console !== "undefined" && console.log` is a feature
# test, not a call, and counting it made the first inventory of this codebase
# report four sites that do not exist.
CALL = re.compile(r"console\.(log|warn|error)\s*\(")


def sources(root):
    files = [root / f for f in SOURCES]
    for d in DIRS:
        files.extend(sorted((root / d).glob("*.js")))
    return [f for f in files if f.exists() and str(f.relative_to(root)) not in VENDORED]


def count(root):
    per_file = {}
    per_level = {"log": 0, "warn": 0, "error": 0}
    for path in sources(root):
        hits = CALL.findall(path.read_text(encoding="utf-8", errors="replace"))
        if hits:
            per_file[str(path.relative_to(root))] = len(hits)
            for level in hits:
                per_level[level] += 1
    return per_file, per_level


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="fail when the count is above the baseline")
    ap.add_argument("--root", default=str(REPO), help="theme checkout to scan (default: this repo)")
    args = ap.parse_args()

    root = pathlib.Path(args.root).expanduser()
    per_file, per_level = count(root)
    total = sum(per_file.values())
    levels = ", ".join(f"{n} {level}" for level, n in per_level.items() if n)

    if total > BASELINE:
        added = total - BASELINE
        print(f"{'FAIL' if args.check else 'ADVISORY'}: {total} unconditional console calls "
              f"({levels}), {added} above the baseline of {BASELINE}.",
              file=sys.stderr if args.check else sys.stdout)
        for name, n in sorted(per_file.items(), key=lambda kv: -kv[1]):
            print(f"  {n:3d}  {name}", file=sys.stderr if args.check else sys.stdout)
        print("\nNew output belongs in dzLog(seam, event, fields) (src/js/diag.js): structured, "
              "and silent unless the reader switched Diagnostic logging on. Keep console.warn for "
              "the fail-closed warnings a user must see without asking.",
              file=sys.stderr if args.check else sys.stdout)
        return 1 if args.check else 0

    if total < BASELINE:
        print(f"OK: {total} unconditional console calls ({levels}), {BASELINE - total} below the "
              f"baseline of {BASELINE}.")
        print(f"RATCHET: lower BASELINE in {pathlib.Path(__file__).name} to {total} in this same "
              "change, so the gain is locked in instead of leaving room for the next addition.")
        return 0

    print(f"OK: {total} unconditional console calls ({levels}), exactly the baseline.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
