#!/usr/bin/env python3
"""Advisory: report how much oxipng could still shave off the committed art.

This never fails the build. The icon engine (images-machinon/scripts/png_opt.py)
is what guarantees new art is optimal; this only notices art that arrived some
other way, or a newer oxipng that learned a better trick. A blocking gate here
would turn red on a version bump nobody asked for, which is exactly the drift
trap an advisory check avoids.

The three options below duplicate png_opt.py's policy on purpose: that module
lives in the icon workspace, which is not part of this repo and is not shipped,
so there is no import to share. Keep them in step with it.
"""
import os
import sys

import oxipng

DIRS = ("images", "iconpack", "docs/screenshots", "site/assets")
OPTS = {"level": 6, "strip": oxipng.StripChunks.safe(), "optimize_alpha": True}
TOP = 5


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
    for d in DIRS:
        for dirpath, _dirnames, filenames in os.walk(os.path.join(root, d)):
            for fn in sorted(filenames):
                if not fn.lower().endswith(".png"):
                    continue
                path = os.path.join(dirpath, fn)
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
              "directory?)".format(", ".join(DIRS)))
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
