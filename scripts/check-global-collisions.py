#!/usr/bin/env python3
"""Fail when a browser global this theme defines is also defined by Domoticz core.

WHY. The theme and core share the `dz` prefix. Core's growth in that prefix is
almost all in Angular's injector (dzDeviceIcon, dzIconPicker, the widget
directives), where a DI name cannot collide with a browser global, but core does
own real globals in it, and a collision is silent: the last script to load wins,
and the loser's callers get core's function with the theme's arguments. The
theme defines several hundred dz* names; renaming them to avoid a collision that
does not exist would touch far more code than it protects. This check is what
covers them instead, so the day core adds a name we already use, it surfaces as
a red check against an updated core clone rather than as a user's bug report.

The two names printed in the manual and typed by hand (machinonDiag,
machinonDiagNames) are checked the same way, and matter more: a collision there
breaks the one command a user runs manually.

WHERE THE CORE SOURCE COMES FROM. A local clone of domoticz/domoticz, by default
the sibling checkout this theme is developed against. CI has no such clone, so
this check cannot run there and does not pretend to: without one it reports SKIP
and exits 0. Run it after updating the clone, and before a release.

    python3 scripts/check-global-collisions.py
    python3 scripts/check-global-collisions.py --core ../../domoticz/www
    python3 scripts/check-global-collisions.py --require   # SKIP becomes a failure

Exit 0 = no collision (or skipped), 1 = collision, 2 = bad usage.
"""
import argparse
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_CORE = REPO.parent.parent / "domoticz" / "www"

# Only the prefixes both sides actually share. A wider net would report the
# globals every Domoticz theme inherits (theme, themeFolder, isMobile) as
# collisions, which they are not: those are core's own contract for a theme.
PREFIX = re.compile(r"^(dz|machinon)", re.IGNORECASE)

THEME_SOURCES = ["custom.js"]
THEME_DIRS = ["js", "src/js"]
# Vendored, never edited here, and not in the shared prefix anyway.
VENDORED = {"js/moment.js"}

DECL = re.compile(r"^(?:var|function)\s+([A-Za-z_$][\w$]*)", re.MULTILINE)
WINDOW_ASSIGN = re.compile(r"window\.([A-Za-z_$][\w$]*)\s*=(?!=)")


def globals_in(text):
    """Top-level declarations plus explicit window assignments.

    A `var`/`function` at column 0 in a plain browser script IS a global; one
    indented inside an IIFE or a callback is not, which is why the declaration
    pattern is anchored and the indented ones are deliberately missed.
    """
    found = {m.group(1) for m in DECL.finditer(text)}
    found |= {m.group(1) for m in WINDOW_ASSIGN.finditer(text)}
    return {name for name in found if PREFIX.match(name)}


def scan(paths):
    out = {}
    for path in paths:
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for name in globals_in(text):
            out.setdefault(name, set()).add(path)
    return out


def theme_files(theme_root):
    files = [theme_root / f for f in THEME_SOURCES]
    for d in THEME_DIRS:
        files.extend(sorted((theme_root / d).glob("*.js")))
    return [f for f in files if f.exists() and str(f.relative_to(theme_root)) not in VENDORED]


def core_files(core_root):
    # www/styles holds the themes, this one included when the clone is also the
    # install target: a theme's own names are not core's.
    return [p for p in sorted(core_root.rglob("*.js")) if "styles" not in p.relative_to(core_root).parts]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--core", default=str(DEFAULT_CORE), help="path to a domoticz core checkout's www/ folder")
    ap.add_argument("--require", action="store_true", help="treat a missing core checkout as a failure")
    ap.add_argument("--theme", default=str(REPO), help="path to the theme checkout (default: this repo)")
    args = ap.parse_args()

    theme_root = pathlib.Path(args.theme).expanduser()
    core_root = pathlib.Path(args.core).expanduser()
    if not core_root.is_dir():
        msg = f"no core checkout at {core_root}"
        if args.require:
            print(f"FAIL: {msg} (--require)", file=sys.stderr)
            return 1
        print(f"SKIP: {msg}; clone domoticz/domoticz there to run this check")
        return 0

    theme = scan(theme_files(theme_root))
    core = scan(core_files(core_root))
    if not core:
        print(f"FAIL: found no dz*/machinon* globals at all under {core_root}; "
              "the path is probably not a Domoticz www folder, so a green result here would mean nothing",
              file=sys.stderr)
        return 1

    clashes = sorted(set(theme) & set(core))
    if clashes:
        print(f"FAIL: {len(clashes)} global(s) defined by both the theme and Domoticz core:", file=sys.stderr)
        for name in clashes:
            mine = ", ".join(sorted(str(p.relative_to(theme_root)) for p in theme[name]))
            theirs = ", ".join(sorted(str(p.relative_to(core_root)) for p in core[name]))
            print(f"  {name}\n    theme: {mine}\n    core:  {theirs}", file=sys.stderr)
        print("\nRename the theme's one, in the same change: core's copy loads after the theme's "
              "on a real page, so the theme's callers would silently get core's function.", file=sys.stderr)
        return 1

    print(f"OK: {len(theme)} theme global(s) in the dz/machinon prefix, "
          f"{len(core)} core global(s), no collision ({', '.join(sorted(core))})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
