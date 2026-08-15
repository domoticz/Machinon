#!/usr/bin/env python3
"""Generate site/tokens.css: every shipped scheme as a [data-scheme] block.

The landing page under site/ advertises the theme, so its colours must BE the
theme's colours rather than a hand-copied approximation that rots silently.
This reads the same three sources the theme itself reads at runtime:

    dz-tokens.css  :root                        -> Machinon Light (base)
    dark.css       html[data-dz-scheme="dark"]  -> Machinon Dark (base)
    schemes/*.json colors{}                     -> the six JSON schemes

and resolves each JSON scheme the way src/js/scheme.js does: start from the
base named by the scheme's "base" key, then overlay the colors mapping in
SCHEME_KEY_TO_TOKENS (kept identical to applyCustomColorScheme).

Only the tokens the landing page consumes are emitted: colour, plus the three
elevation levels the page uses. Radius and typography carry no per-scheme
value at all, so they stay as --site-* declarations in site/style.css.

Run:
    python3 scripts/gen-site-tokens.py           # write site/tokens.css
    python3 scripts/gen-site-tokens.py --check   # exit 1 if the file is stale
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "tokens.css"

# Mirrors applyCustomColorScheme() in src/js/scheme.js. Keep in step with it.
SCHEME_KEY_TO_TOKENS = {
    "background": ["--dz-body-bg"],
    "main_text": ["--dz-body-text", "--dz-widget-text"],
    "navbar": ["--dz-nav-bg"],
    "item": ["--dz-widget-bg"],
    "main_color": ["--dz-accent-color"],
    "border": ["--dz-input-border"],
    "disabled": ["--dz-status-disabled"],
    "error": ["--dz-accent-red"],
    "success": ["--dz-btn-success-bg"],
    "warning": ["--dz-btn-warning-bg"],
    "alt_text": ["--secondary-text-color"],
    "accent_text": ["--dz-accent-text"],
    "sun": ["--dz-sun-color"],
}

# Emitted in this order, so the generated file diffs cleanly.
#
# Colour first, then the three elevation levels the landing page consumes.
# Elevation is not in SCHEME_KEY_TO_TOKENS and never will be: no scheme JSON
# has a key for it, because a shadow is scheme-INDEPENDENT within a base. What
# it is not is base-independent. dark.css deepens every level's alpha (card
# 0.25 -> 0.50, popup 0.28 -> 0.56, overlay 0.30 -> 0.60) so shadows still read
# against a dark underlay. So these three ride the plain base fallthrough in
# resolve_scheme(): every light-based scheme inherits the light alphas and
# every dark-based one the deepened alphas, with no mapping entry needed.
#
# Emitting them here is what stops site/style.css from hand-copying the light
# values, which would silently paint all four dark schemes too weakly and would
# breach DESIGN.md's derive-never-copy rule for token definitions.
SITE_TOKENS = [
    "--dz-body-bg",
    "--dz-body-text",
    "--dz-nav-bg",
    "--dz-widget-bg",
    "--dz-widget-text",
    "--dz-accent-color",
    "--dz-accent-text",
    "--dz-accent-values",
    "--dz-input-border",
    "--dz-status-disabled",
    "--dz-accent-red",
    "--dz-accent-red-values",
    "--dz-btn-success-bg",
    "--dz-btn-warning-bg",
    "--secondary-text-color",
    "--dz-sun-color",
    "--dz-elev-card",
    "--dz-elev-popup",
    "--dz-elev-overlay",
]

_DECL = re.compile(r"(--[\w-]+)\s*:\s*([^;]+);")


def extract_block(css_text, selector):
    """Return the custom properties declared in the FIRST block for `selector`.

    dz-tokens.css declares :root more than once (a later html:root block
    re-declares a few tokens at higher specificity, and a media query holds a
    third). The first block is the real palette, which is also what
    scripts/check-tokens.sh assumes.
    """
    start = css_text.index(selector + " {") + len(selector) + 2
    depth = 1
    i = start
    while depth:
        if css_text[i] == "{":
            depth += 1
        elif css_text[i] == "}":
            depth -= 1
        i += 1
    body = re.sub(r"/\*.*?\*/", "", css_text[start : i - 1], flags=re.S)
    return {m.group(1): m.group(2).strip() for m in _DECL.finditer(body)}


def hex_to_triplet(hex_str):
    """'#FC72D3' -> '252,114,211'. Mirrors hexToRGB(v, true) in scheme.js."""
    h = hex_str.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return "{},{},{}".format(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def resolve_scheme(base_tokens, colors):
    """Overlay a scheme's colors{} onto a base token set, as scheme.js does."""
    out = dict(base_tokens)
    for key, tokens in SCHEME_KEY_TO_TOKENS.items():
        value = colors.get(key)
        if not value:
            continue
        for token in tokens:
            out[token] = value
    if colors.get("main_color"):
        out["--dz-accent-values"] = hex_to_triplet(colors["main_color"])
    if colors.get("error"):
        out["--dz-accent-red-values"] = hex_to_triplet(colors["error"])
    return out


def scheme_ids():
    """Picker order: the two token-default schemes, then schemes/index.json."""
    index = json.loads((ROOT / "schemes" / "index.json").read_text())
    return ["machinon-light", "machinon-dark"] + index


def _bases():
    light = extract_block((ROOT / "dz-tokens.css").read_text(), ":root")
    dark = dict(light)
    dark.update(
        extract_block((ROOT / "dark.css").read_text(), 'html[data-dz-scheme="dark"]')
    )
    # --dz-accent-red is declared as var(--dz-accent-red-base) in the light
    # block; the site has no cascade to resolve that through, so flatten it.
    for tokens in (light, dark):
        red = tokens.get("--dz-accent-red", "")
        if red.startswith("var("):
            tokens["--dz-accent-red"] = tokens["--dz-accent-red-base"]
    return light, dark


def _scheme_label(scheme_id, data):
    if scheme_id == "machinon-light":
        return "Machinon Light"
    if scheme_id == "machinon-dark":
        return "Machinon Dark"
    return data["name"]


def build():
    light, dark = _bases()
    lines = [
        "/*",
        "  tokens.css - GENERATED, do not edit by hand.",
        "",
        "  Written by scripts/gen-site-tokens.py from dz-tokens.css, dark.css and",
        "  schemes/*.json, so the landing page's colours and shadows are the",
        "  theme's real ones. The elevation trio is per-BASE, not per-scheme:",
        "  dark.css deepens each alpha so shadows read against a dark underlay.",
        "  scripts/gen-site-tokens.py --check runs in CI and fails on drift.",
        "*/",
    ]
    for scheme_id in scheme_ids():
        if scheme_id == "machinon-light":
            tokens, label = light, "Machinon Light"
            selector = ':root,\n[data-scheme="machinon-light"]'
        elif scheme_id == "machinon-dark":
            tokens, label = dark, "Machinon Dark"
            selector = '[data-scheme="machinon-dark"]'
        else:
            data = json.loads((ROOT / "schemes" / (scheme_id + ".json")).read_text())
            base = dark if data.get("base") == "dark" else light
            tokens = resolve_scheme(base, data["colors"])
            label = _scheme_label(scheme_id, data)
            selector = '[data-scheme="{}"]'.format(scheme_id)
        lines.append("")
        lines.append("/* {} */".format(label))
        lines.append(selector + " {")
        for token in SITE_TOKENS:
            value = tokens.get(token)
            if value is None:
                raise SystemExit(
                    "gen-site-tokens: {} has no value for {}".format(scheme_id, token)
                )
            lines.append("    {}: {};".format(token, value))
        lines.append("}")
    return "\n".join(lines) + "\n"


def main():
    generated = build()
    if "--check" in sys.argv:
        current = OUT.read_text() if OUT.exists() else ""
        if current != generated:
            print(
                "gen-site-tokens: site/tokens.css is stale. "
                "Run: python3 scripts/gen-site-tokens.py",
                file=sys.stderr,
            )
            return 1
        print("gen-site-tokens: site/tokens.css is up to date")
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(generated)
    print("gen-site-tokens: wrote {}".format(OUT.relative_to(ROOT)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
