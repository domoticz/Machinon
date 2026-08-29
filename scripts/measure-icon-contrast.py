#!/usr/bin/env python3
"""Contrast of the energy/sun identity colours against every scheme's own card.

The energy and sun icons are drawn ON the widget card, so the only meaningful
background is that scheme's `colors.item`. WCAG SC 1.4.11 puts the floor for
non-text at 3.0:1; this script uses 3.2 so a value never ships sitting on the
line. Run with --check in CI-ish fashion: exit 1 lists what fails.
"""
import argparse
import glob
import json
import os
import sys

FLOOR = 3.2

# The shipped values. Light and dark differ in lightness only; the hue is a
# theme constant, which is why gas reads as gas in both.
LIGHT = {
    "import": "#a37300", "export": "#3e8c42", "gas": "#e83700",
    "water": "#0883bb", "price": "#9d55ff", "sun": "#8c730e",
}
DARK = {
    "import": "#ffb300", "export": "#66bb6a", "gas": "#ff7043",
    "water": "#29b6f6", "price": "#c8a0ff", "sun": "#fad232",
}
# Paper is deliberately monochrome and overrides the family (see the plan's
# Task 3). Same hues at 38% saturation, lightness solved for 3.5:1.
PAPER_LIGHT = {
    "import": "#9e8447", "export": "#6d926f", "gas": "#b97964",
    "water": "#5390ac", "price": "#9879c3", "sun": "#96884f",
}
PAPER_DARK = {
    "import": "#89733e", "export": "#5b7b5d", "gas": "#a9624c",
    "water": "#467991", "price": "#8864b9", "sun": "#80733c",
}


def rgb(value):
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
                failures.append(f"{name}/{role} {value} on {card} = {ratio}:1")
            print(f"{name:16} {role:8} {value} on {card} = {ratio}:1{flag}")

    if failures and args.check:
        print(f"\n{len(failures)} value(s) under the {FLOOR}:1 floor:", file=sys.stderr)
        for line in failures:
            print("  " + line, file=sys.stderr)
        return 1
    print(f"\nOK: every value clears {FLOOR}:1 on its own scheme's card")
    return 0


if __name__ == "__main__":
    sys.exit(main())
