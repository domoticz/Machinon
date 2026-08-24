#!/usr/bin/env python3
"""Advisory: report how much oxipng could still shave off the committed art.

This never fails the build. The icon engine (images-machinon/scripts/png_opt.py)
is what guarantees new art is optimal; this only notices art that arrived some
other way, or a newer oxipng that learned a better trick. A blocking gate here
would turn red on a version bump nobody asked for, which is exactly the drift
trap an advisory check avoids.

Coverage is every PNG this repo tracks in git (`git ls-files`), not a
hardcoded list of directories. A hardcoded list is exactly what let
docs/assets/favicon.png slip past this check for a whole release: it lived
outside every directory the old list named. Enumerating tracked files instead
means new art is covered the moment it is committed, wherever it lands, with
nothing here to remember to update. When pointed at a directory that is not a
git work tree, such as a throwaway fixture in the test suite, it falls back to
walking that directory for PNGs instead, so it still has something to measure.

OPTS below duplicates png_opt.py's optimisation policy on purpose: that module
lives in the icon workspace, which is not part of this repo and is not
shipped, so there is no import to share. Keep it in step with it.
"""
import os
import subprocess
import sys

import oxipng

OPTS = {"level": 6, "strip": oxipng.StripChunks.safe(), "optimize_alpha": True}
TOP = 5


def tracked_pngs(root):
    """Every PNG under root, git-tracked ones by preference.

    `git ls-files` gives every PNG this repo actually ships or documents,
    by construction, so there is no directory list to keep in step with
    where art happens to live. A pathspec with no slash matches at any
    depth, so a single "*.png" pattern reaches every tracked PNG regardless
    of directory.

    root not being a git work tree (a pytest tmp_path, most likely) falls
    back to a plain walk, so the test suite can still point this at a
    throwaway tree that was never `git init`-ed and get a real answer.
    """
    try:
        out = subprocess.run(
            ["git", "-C", root, "ls-files", "-z", "*.png"],
            capture_output=True, check=True,
        )
        return sorted(
            os.path.join(root, name.decode())
            for name in out.stdout.split(b"\0") if name
        )
    except (subprocess.CalledProcessError, OSError):
        found = []
        for dirpath, _dirnames, filenames in os.walk(root):
            for fn in filenames:
                if fn.lower().endswith(".png"):
                    found.append(os.path.join(dirpath, fn))
        return sorted(found)


def measure(path):
    """(before, after) byte counts for one file. (0, 0) when it is not a PNG."""
    with open(path, "rb") as fh:
        data = fh.read()
    try:
        out = oxipng.optimize_from_memory(data, **OPTS)
    except oxipng.PngError as exc:
        print("check-png-optimized: SKIPPED {}: {}".format(path, exc), file=sys.stderr)
        return 0, 0
    return len(data), min(len(out), len(data))


def main(root="."):
    before = after = files = 0
    worst = []
    for path in tracked_pngs(root):
        b, a = measure(path)
        if not b:
            continue
        files += 1
        before += b
        after += a
        if b - a:
            worst.append((b - a, os.path.relpath(path, root)))
    if not files:
        print("check-png-optimized: no PNGs found under {} (wrong working "
              "directory?)".format(root))
        return 0
    saved = before - after
    print("check-png-optimized: {} PNGs, {:.2f} MB committed, {:.0f} KB ({:.1f}%) "
          "still recoverable".format(files, before / 1e6, saved / 1024,
                                     100 * saved / before))
    for delta, name in sorted(worst, reverse=True)[:TOP]:
        print("  {:7.1f} KB  {}".format(delta / 1024, name))
    if saved:
        print("check-png-optimized: advisory only. Run the icon workspace's "
              "scripts/dz-png-optimize.py over these paths to reclaim it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
