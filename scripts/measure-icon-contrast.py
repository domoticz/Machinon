#!/usr/bin/env python3
"""Contrast of the energy/sun identity colours AND the device-status glow
colours, against every scheme's own card.

The energy/sun icons and the status glow ring are both drawn ON the widget
card, so the only meaningful background is that scheme's `colors.item`. WCAG
SC 1.4.11 puts the floor for non-text at 3.0:1.

Identity colours (LIGHT/DARK/PAPER_LIGHT/PAPER_DARK) target 3.2 so a value
never ships sitting on the line. Status glows (STATUS_LIGHT/STATUS_DARK)
check against the literal 3.0 floor: the 2026-08-31 device-status task
solved them to ~3.10 worst case deliberately, a tighter margin than the
identity colours carry, so re-using 3.2 here would reject values that
already clear WCAG with real (if smaller) headroom. That task is also the
reason this script grew this second half at all: it first shipped status
glow values checked against only two generic cards (`#ffffff`/`#182430`),
and gruvbox's own mid-toned cards (`#f2e5bc`/`#3c3836`) turned out to fail
values that passed on both bases. Checking every shipped scheme's own card,
not just the two bases, is what this script already did for the identity
colours and is exactly what would have caught that first miss.

Run with --check in CI-ish fashion: exit 1 lists what fails.
"""
import argparse
import glob
import json
import os
import sys

FLOOR = 3.2
STATUS_FLOOR = 3.0

# The shipped values. Light and dark differ in lightness only; the hue is a
# theme constant, which is why gas reads as gas in both.
LIGHT = {
    "import": "#a37300", "export": "#3e8c42", "gas": "#e83700",
    "water": "#0883bb", "price": "#9d55ff", "sun": "#8c730e", "moon": "#567ac6",
}
DARK = {
    "import": "#ffb300", "export": "#66bb6a", "gas": "#ff7043",
    "water": "#29b6f6", "price": "#c8a0ff", "sun": "#fad232", "moon": "#8ba4d8",
}
# Paper is deliberately monochrome and overrides the family (see the plan's
# Task 3). Same hues at 38% of the base saturation (export ends at 14.5%
# absolute), lightness solved for 3.5:1.
PAPER_LIGHT = {
    "import": "#9e8447", "export": "#6d926f", "gas": "#b97964",
    "water": "#5390ac", "price": "#9879c3", "sun": "#96884f", "moon": "#7a87a4",
}
PAPER_DARK = {
    "import": "#89733e", "export": "#5b7b5d", "gas": "#a9624c",
    "water": "#467991", "price": "#8864b9", "sun": "#80733c", "moon": "#657595",
}

# Device-status glow triplets (dz-tokens.css / dark.css), consumed by
# css/device-status.css and, since the 2026-08-31 notification-system
# branch, css/toasts.css. Unlike the identity colours above, NO scheme
# overrides these: src/js/scheme.js only ever sets --dz-status-disabled from
# a scheme's own JSON (grep confirms no schemes/*.json key for timeout,
# lowbat or protected), so every built-in and custom scheme inherits one of
# these two dicts purely by its `base` - there is no per-family (Paper-style)
# branch to take here, unlike LIGHT/DARK above.
# Re-solved 2026-08-31 (owner decision, supersedes the 3.10-target values this
# script originally pinned) to a 4.0 target, so the toast severity tile
# (css/toasts.css - see there for the mix percentage and what background it
# is measured against, not repeated here) clears its own 3:1 non-text floor
# with margin - see dz-tokens.css / dark.css for the full rationale,
# including the deliberate lowbat hue change to amber.
#
# Pinned on the RGB TRIPLET, not a hex string: the tokens ship as
# "--dz-status-*-values-base: r, g, b;" (dz-tokens.css/dark.css), and the hex
# appears only in a trailing comment. A script that pinned on the hex could
# have the triplet edited to anything - a completely different, un-measured
# colour - while the untouched comment kept check_pinned() green. Proven: set
# --dz-status-lowbat-values-base to 255, 255, 0 and leave the comment alone;
# the old hex-pinned script still reported OK. Pinning on the triplet means an
# edit to the shipped value, with or without touching the comment, is exactly
# what makes the presence check fail.
STATUS_LIGHT = {"timeout": "196, 64, 65", "lowbat": "142, 105, 0", "protected": "0, 0, 139"}
STATUS_DARK = {"timeout": "245, 109, 105", "lowbat": "255, 193, 7", "protected": "101, 149, 255"}

# These constants are a second source of truth for the same shipped values:
# they let contrast be measured without parsing CSS/JSON, but nothing ties
# them back to the files that actually ship the colours, so the two can drift
# silently while this script keeps reporting OK. Pin them: --check also
# confirms every constant's value (hex string for the identity colours,
# RGB triplet for the status glows) still appears in the file that should
# carry it.
PINNED_FILES = {
    "LIGHT": "dz-tokens.css",
    "DARK": "dark.css",
    "PAPER_LIGHT": os.path.join("schemes", "paper-light.json"),
    "PAPER_DARK": os.path.join("schemes", "paper-dark.json"),
    "STATUS_LIGHT": "dz-tokens.css",
    "STATUS_DARK": "dark.css",
}


def check_pinned():
    """Presence check only: does each constant's hex string still occur
    (case-insensitively) in the file that should carry it? Returns a list of
    human-readable descriptions of anything missing."""
    root = os.path.join(os.path.dirname(__file__), "..")
    missing = []
    for var_name, rel_path in PINNED_FILES.items():
        with open(os.path.join(root, rel_path), encoding="utf-8") as handle:
            content = handle.read().lower()
        for role, value in globals()[var_name].items():
            if value.lower() not in content:
                missing.append(f"{var_name}/{role} {value} not found in {rel_path}")
    return missing


def rgb(value):
    """Accepts either a "#rrggbb" hex string, with or without the leading
    "#" (the identity colours), or a "r, g, b" triplet (the status glows,
    matching how they actually ship)."""
    if "," in value:
        return [int(part.strip()) for part in value.split(",")]
    value = value.lstrip("#")
    return [int(value[i:i + 2], 16) for i in (0, 2, 4)]


def luminance(colour):
    def channel(raw):
        srgb = raw / 255
        return srgb / 12.92 if srgb <= 0.03928 else ((srgb + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(c) for c in colour)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(fg, bg):
    a, b = luminance(fg) + 0.05, luminance(bg) + 0.05
    return round(max(a, b) / min(a, b), 2)


def cards():
    """(scheme name, base, card colour) for every palette a user can select."""
    out = [("light (base)", "light", "#ffffff"), ("dark (base)", "dark", "#18202b")]
    for path in sorted(glob.glob(os.path.join(os.path.dirname(__file__), "..", "schemes", "*.json"))):
        if path.endswith("index.json"):
            continue
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        colours = data.get("colors", data)
        out.append((os.path.basename(path)[:-5], data.get("base", "light"), colours["item"]))
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="exit 1 if any value is under the floor")
    args = parser.parse_args()

    failures = []
    for name, base, card in cards():
        if name.startswith("paper"):
            palette = PAPER_LIGHT if base == "light" else PAPER_DARK
        else:
            palette = LIGHT if base == "light" else DARK
        for role, value in palette.items():
            ratio = contrast(rgb(value), rgb(card))
            flag = "" if ratio >= FLOOR else "  UNDER FLOOR"
            if flag:
                failures.append(f"{name}/{role} {value} on {card} = {ratio}:1 (floor {FLOOR}:1)")
            print(f"{name:16} {role:8} {value} on {card} = {ratio}:1{flag}")

    print()
    for name, base, card in cards():
        # No scheme overrides these three: every scheme inherits one of the
        # two dicts purely by its `base` (see the STATUS_LIGHT/STATUS_DARK
        # comment above), so there is no Paper-style branch to take here.
        palette = STATUS_LIGHT if base == "light" else STATUS_DARK
        for role, value in palette.items():
            ratio = contrast(rgb(value), rgb(card))
            flag = "" if ratio >= STATUS_FLOOR else "  UNDER FLOOR"
            if flag:
                failures.append(
                    f"{name}/status-{role} --dz-status-{role}-values {value} on {card} "
                    f"= {ratio}:1 (floor {STATUS_FLOOR}:1)"
                )
            print(f"{name:16} status-{role:9} {value} on {card} = {ratio}:1{flag}")

    pinned_missing = check_pinned() if args.check else []

    if (failures or pinned_missing) and args.check:
        if failures:
            print(f"\n{len(failures)} value(s) under their floor:", file=sys.stderr)
            for line in failures:
                print("  " + line, file=sys.stderr)
        if pinned_missing:
            print(f"\n{len(pinned_missing)} constant(s) missing from their shipped file:", file=sys.stderr)
            for line in pinned_missing:
                print("  " + line, file=sys.stderr)
        return 1
    print(f"\nOK: every identity colour clears {FLOOR}:1 and every status glow clears {STATUS_FLOOR}:1, "
          f"on its own scheme's card")
    if args.check:
        print("OK: every constant is present in its shipped file")
    return 0


if __name__ == "__main__":
    sys.exit(main())
