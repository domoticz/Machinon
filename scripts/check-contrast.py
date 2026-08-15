#!/usr/bin/env python3
"""Guard the landing page's WCAG 2.1 contrast, across all eight schemes.

This is a BLOCKING gate, an explicit owner decision. A Task 3 scratch
harness that only compared two raw tokens at a time passed the page's visual
review clean and still missed two real failures, because both were accent
text sitting on rgba(var(--dz-accent-values), 0.08), itself painted over
--dz-widget-bg: a token pair alone cannot see a tint like that, only the
alpha-composited colour actually on screen can. Once the harness could
composite, it caught those two plus a third introduced by the fix for the
first two, all three invisible to eyeballing rendered text at a glance. That
history is why this script computes the real, composited, on-screen colour
for every pair below rather than comparing declared tokens directly, and why
it fails the build instead of only warning.

Pair list: every distinct (text or meaningful icon colour, surface colour)
combination site/style.css actually paints, reconstructed by reading
site/style.css and site/index.html together, not carried over as a guess.
Purely decorative elements are out of scope: hairline borders that convey no
state, the reveal-on-scroll and hover/focus transitions, and the connecting
line between install steps. The favorite/tools icons and the "..." options
glyph ARE in scope, at the WCAG 1.4.11 non-text 3:1 floor, because
dz-tokens.css itself documents that the theme's real card icons are held to
that floor and this page's cards claim to be the theme's real cards.

The .switch toggle IS audited here, as of the site's fix in commit f58e565
that made it a faithful copy of css/switch.css instead of an invented
approximation (it used to have a flat --dz-status-disabled track and a
--dz-widget-bg knob; neither token appears in the real control at all). The
real control deliberately carries its perceivability on the KNOB, a
text-grade colour (--secondary-text-color off, --dz-accent-color on) with an
--dz-elev-card drop shadow, and leaves the TRACK a faint accent tint (0.2
off, 0.5 on) that is not meant to read as a hard edge on its own. Checked
against WCAG 1.4.11 literally, the track-vs-card and on-knob-vs-on-track
pairs both measure under 3:1 in most schemes (the two colours are the same
hue at different alphas, so at low alpha they cannot really separate) - but
these are the theme's OWN values, faithfully reproduced, not a site defect,
so they are named ALLOWLIST entries rather than silently dropped or
gated. What actually carries the component's perceivability, and IS gated
un-allowlisted, is knob-vs-card: the 20x20 knob overhangs a 40x15 track at
both ends, so most of its visible boundary sits against the card, not the
track, and its colour is what identifies open/closed by both hue and
position. That pair clears 3:1 in all eight schemes, worst case 4.31:1.

Thresholds (WCAG 2.1): 4.5:1 for body text, 3.0:1 for large text (>= 24px,
or >= 18.66px i.e. 14pt at bold weight) and for non-text UI boundaries
(1.4.11).

PAIRS below is a HAND-MAINTAINED model of what site/style.css actually
paints: nothing in this script parses site/style.css and checks PAIRS
against it, so the two can drift apart. The failure mode of that drift is
silent staleness, a real color-contrast regression in site/style.css that
this script keeps reporting green because PAIRS still describes the old
rule, not a false red. Re-derive PAIRS by hand whenever site/style.css is
substantially edited, the same way the pair list itself was built: by
reading site/style.css and site/index.html together.

Run: python3 scripts/check-contrast.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOKENS = ROOT / "site" / "tokens.css"

_BLOCK = re.compile(r'\[data-scheme="([^"]+)"\][^{]*\{([^}]*)\}', re.S)
_DECL = re.compile(r"(--[\w-]+)\s*:\s*([^;]+);")

NORMAL_THRESHOLD = 4.5
LARGE_THRESHOLD = 3.0

# One named, commented exception: a real failure the site does not own.
# scripts/check-contrast.py still computes and prints it every run, in every
# scheme, so it stays visible. It is excluded only from the exit code.
ALLOWLIST = {
    (
        "gruvbox-dark",
        "device value (#bigtext) on device card",
    ): (
        "known theme-level finding, not a site defect: the theme's own "
        "#bigtext idiom (accent text on --dz-widget-bg) measures about "
        "4.31:1 in Gruvbox Dark, under the 4.5 floor for body-sized text. "
        "The demo card reproduces the theme faithfully here; fixing it "
        "would mean the demo lies about the theme's real colours. Tracked "
        "as a theme colour issue, not fixed by changing the site."
    ),
}

# The switch track is a faint accent tint at rest (css/switch.css lines
# 30-60, copied faithfully in site/style.css as of commit f58e565), not a
# flat colour, and its two states are the same hue at different alphas: they
# cannot fully separate from their own background at any alpha. Both are the
# theme's real values, not a site invention, and the control's actual
# perceivability rides the un-allowlisted knob-vs-card pairs below (module
# docstring has the full argument). Named per scheme, like the #bigtext
# entry above, rather than generated from one blanket "all schemes" list,
# precisely because it is NOT all schemes for the second pair: paper-light
# clears 3:1 on its own (4.98:1), so it is left off and shows as a plain
# PASS. A scheme that regresses either pair reads as a genuine new failure,
# never masked by a listing wider than what is actually known-and-accepted.
_SWITCH_TRACK_FAILS_IN = (
    # Fails in all eight schemes (worst 1.31:1, machinon-light).
    "machinon-light", "machinon-dark",
    "magenta-light", "magenta-dark",
    "paper-light", "paper-dark",
    "gruvbox-light", "gruvbox-dark",
)
for _scheme_id in _SWITCH_TRACK_FAILS_IN:
    ALLOWLIST[(_scheme_id, "switch off track on card")] = (
        "known theme value, not a site defect: css/switch.css's own "
        "rgba(accent, 0.2) track tint, measured under 3:1 against the card "
        "in every scheme. The control's perceivability rides the knob, "
        "gated separately and un-allowlisted below."
    )
del _scheme_id

_SWITCH_ON_KNOB_FAILS_IN = (
    # Fails in seven of eight (worst 1.99:1, gruvbox-dark); paper-light is
    # NOT here, since it clears 3:1 on its own (4.98:1).
    "machinon-light", "machinon-dark",
    "magenta-light", "magenta-dark",
    "paper-dark",
    "gruvbox-light", "gruvbox-dark",
)
for _scheme_id in _SWITCH_ON_KNOB_FAILS_IN:
    ALLOWLIST[(_scheme_id, "switch on-state knob on on-track")] = (
        "known theme value, not a site defect: the on-state knob "
        "(--dz-accent-color) against its own on-track tint (rgba(accent, "
        "0.5)), the same hue at two alphas, which cannot fully separate. "
        "css/switch.css's own combination. The control's perceivability "
        "rides the knob-vs-card pair, gated separately and un-allowlisted "
        "below."
    )
del _scheme_id


def parse_token_blocks(css_text):
    """Return {scheme_id: {token_name: value}} for every [data-scheme] block."""
    schemes = {}
    for match in _BLOCK.finditer(css_text):
        scheme_id = match.group(1)
        schemes[scheme_id] = {
            decl.group(1): decl.group(2).strip()
            for decl in _DECL.finditer(match.group(2))
        }
    return schemes


def hex_to_rgb(value):
    """'#f4f8fc' -> (244, 248, 252). Also accepts the 3-digit short form."""
    h = value.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def triplet_to_rgb(value):
    """'131,165,152' -> (131, 165, 152), as --dz-*-values tokens store it."""
    return tuple(int(part.strip()) for part in value.split(","))


def composite(fg_rgb, alpha, base_rgb):
    """Alpha-blend fg_rgb over base_rgb, as the browser paints rgba(...) over
    whatever sits behind it. Rounds to the nearest integer channel, matching
    how a browser's own compositor quantises to 8 bits per channel."""
    return tuple(
        round(fg_rgb[i] * alpha + base_rgb[i] * (1 - alpha)) for i in range(3)
    )


def resolve_color(spec, tokens):
    """Resolve a colour spec to an (r, g, b) triplet against one scheme's tokens.

    A spec is one of:
      ('token', name)                       a --dz-* hex colour token
      ('triplet', name)                     a --dz-*-values "r,g,b" token
      ('composite', alpha, fg_spec, base_spec)   fg_spec over base_spec
    """
    kind = spec[0]
    if kind == "token":
        return hex_to_rgb(tokens[spec[1]])
    if kind == "triplet":
        return triplet_to_rgb(tokens[spec[1]])
    if kind == "composite":
        _, alpha, fg_spec, base_spec = spec
        fg = resolve_color(fg_spec, tokens)
        base = resolve_color(base_spec, tokens)
        return composite(fg, alpha, base)
    raise ValueError("unknown colour spec: {}".format(spec))


def relative_luminance(rgb):
    """WCAG 2.1 relative luminance for an sRGB (r, g, b) 0-255 triplet."""
    def channel(value):
        c = value / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = rgb
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def contrast_ratio(rgb_a, rgb_b):
    """WCAG 2.1 contrast ratio between two sRGB colours, always >= 1.0."""
    l_a = relative_luminance(rgb_a)
    l_b = relative_luminance(rgb_b)
    lighter, darker = max(l_a, l_b), min(l_a, l_b)
    return (lighter + 0.05) / (darker + 0.05)


# ---------------------------------------------------------------------------
# Colour specs, shared by every pair below so a tint definition lives once.
# ---------------------------------------------------------------------------
BODY = ("token", "--dz-body-bg")
NAV = ("token", "--dz-nav-bg")
WIDGET = ("token", "--dz-widget-bg")
ACCENT_BG = ("token", "--dz-accent-color")

TINT07_NAV = ("composite", 0.07, ("triplet", "--dz-accent-values"), NAV)
TINT07_BODY = ("composite", 0.07, ("triplet", "--dz-accent-values"), BODY)
TINT08_WIDGET = ("composite", 0.08, ("triplet", "--dz-accent-values"), WIDGET)
TINT08_BODY = ("composite", 0.08, ("triplet", "--dz-accent-values"), BODY)
TINT10_BODY = ("composite", 0.10, ("triplet", "--dz-accent-values"), BODY)
TINT10_WIDGET = ("composite", 0.10, ("triplet", "--dz-accent-values"), WIDGET)
# .install-note's own background is itself the 0.07 tint over BODY; the two
# inline <code> spans inside it (site/index.html:290 and :315) then paint
# their own 0.10 tint on TOP of that, so the real on-screen colour behind
# that code text is a tint of a tint. This is the exact shape of compositing
# bug the harness exists to catch: two raw tokens cannot express it at all.
TINT10_ON_TINT07_BODY = (
    "composite",
    0.10,
    ("triplet", "--dz-accent-values"),
    TINT07_BODY,
)

BODY_TEXT = ("token", "--dz-body-text")
WIDGET_TEXT = ("token", "--dz-widget-text")
SECONDARY_TEXT = ("token", "--secondary-text-color")
ACCENT_TEXT = ("token", "--dz-accent-text")
ACCENT = ("token", "--dz-accent-color")

# .switch (site/style.css, a faithful copy of css/switch.css lines 10-60,
# commit f58e565). The track is a low-alpha accent tint at rest, not a flat
# colour, so it needs the same compositing as the code/note tints above.
SWITCH_TRACK_OFF = ("composite", 0.2, ("triplet", "--dz-accent-values"), WIDGET)
SWITCH_TRACK_ON = ("composite", 0.5, ("triplet", "--dz-accent-values"), WIDGET)
SWITCH_KNOB_OFF = SECONDARY_TEXT
SWITCH_KNOB_ON = ACCENT

# Each pair: (label, foreground spec, background spec, category, source note)
# "normal" -> 4.5:1, "large" -> 3.0:1, "non-text" -> 3.0:1 (WCAG 1.4.11).
PAIRS = [
    ("body text on page", BODY_TEXT, BODY, "normal", "body"),
    ("wordmark on nav", BODY_TEXT, NAV, "large", ".wordmark, 20px/600"),
    ("nav link on nav", SECONDARY_TEXT, NAV, "normal", ".nav-links a"),
    (
        "accent-filled control text (buttons, hover links, step numbers, copy)",
        ACCENT_TEXT,
        ACCENT_BG,
        "normal",
        ".btn-primary / .nav-links a:hover / .btn-outline:hover / "
        ".install-steps > li::before / .copy-btn:hover",
    ),
    ("scheme picker text on picker", BODY_TEXT, WIDGET, "normal", "#scheme-picker"),
    (
        "outline button text on page",
        BODY_TEXT,
        BODY,
        "normal",
        ".btn-outline in .hero-actions",
    ),
    (
        "outline button text on card",
        BODY_TEXT,
        WIDGET,
        "normal",
        ".btn-outline in .install-card",
    ),
    ("hero subhead on page", SECONDARY_TEXT, BODY, "normal", ".hero-sub"),
    ("hero hint on page", SECONDARY_TEXT, BODY, "normal", ".hero-hint"),
    (
        "section label on page",
        ACCENT,
        BODY,
        "normal",
        ".section-label in features/hub/icons/install",
    ),
    (
        "section label on nav surface",
        ACCENT,
        NAV,
        "normal",
        ".section-label in cards-demo/schemes/mobile",
    ),
    (
        "section heading on page",
        BODY_TEXT,
        BODY,
        "large",
        ".section-head h2 in features/hub/icons/install",
    ),
    (
        "section heading on nav surface",
        BODY_TEXT,
        NAV,
        "large",
        ".section-head h2 in cards-demo/schemes/mobile",
    ),
    (
        "section description on page",
        SECONDARY_TEXT,
        BODY,
        "normal",
        ".section-desc in features/hub/icons/install",
    ),
    (
        "section description on nav surface",
        SECONDARY_TEXT,
        NAV,
        "normal",
        ".section-desc in cards-demo/schemes/mobile",
    ),
    (
        "no-JS note on tinted nav surface",
        SECONDARY_TEXT,
        TINT07_NAV,
        "normal",
        ".noscript-note",
    ),
    (
        "no-JS note link on tinted nav surface",
        BODY_TEXT,
        TINT07_NAV,
        "normal",
        ".noscript-note a",
    ),
    ("device name on card", WIDGET_TEXT, WIDGET, "normal", ".dc-name"),
    (
        "device value (#bigtext) on device card",
        ACCENT,
        WIDGET,
        "normal",
        ".dc-bigtext",
    ),
    ("device status text on card", BODY_TEXT, WIDGET, "normal", ".dc-status"),
    ("device timestamp on card", SECONDARY_TEXT, WIDGET, "normal", ".dc-lastupdate"),
    (
        "options glyph on card",
        SECONDARY_TEXT,
        WIDGET,
        "non-text",
        ".dc-options svg (aria-hidden, but reused as the theme's real menu affordance)",
    ),
    (
        "favorite/tools glyphs on card",
        ACCENT,
        WIDGET,
        "non-text",
        ".dc-favorite / .dc-tools",
    ),
    (
        "card heading on card",
        WIDGET_TEXT,
        WIDGET,
        "normal",
        ".feature-card h3 / .install-card h3",
    ),
    (
        "card body text on card",
        SECONDARY_TEXT,
        WIDGET,
        "normal",
        ".feature-card p / .install-card p",
    ),
    ("scheme swatch label on card", BODY_TEXT, WIDGET, "normal", ".scheme-swatch"),
    (
        "phone screenshot caption on nav surface",
        SECONDARY_TEXT,
        NAV,
        "normal",
        ".phone figcaption",
    ),
    ("install step text on page", SECONDARY_TEXT, BODY, "normal", ".install-steps p"),
    (
        "install note on tinted page surface",
        SECONDARY_TEXT,
        TINT07_BODY,
        "normal",
        ".install-note",
    ),
    (
        "install alt heading on page",
        BODY_TEXT,
        BODY,
        "large",
        ".install-alt-head, 20px/600",
    ),
    (
        "code block text on card surface",
        WIDGET_TEXT,
        WIDGET,
        "normal",
        ".code-block pre in .install-steps",
    ),
    (
        "code block text on page surface",
        WIDGET_TEXT,
        BODY,
        "normal",
        '.install-card .code-block pre in "Full source"',
    ),
    (
        "code block header on tinted card surface",
        SECONDARY_TEXT,
        TINT08_WIDGET,
        "normal",
        ".code-head in .install-steps",
    ),
    (
        "code block header on tinted page surface",
        SECONDARY_TEXT,
        TINT08_BODY,
        "normal",
        '.code-head in "Full source"',
    ),
    (
        "copy button on tinted card surface",
        BODY_TEXT,
        TINT08_WIDGET,
        "normal",
        ".copy-btn in .install-steps",
    ),
    (
        "copy button on tinted page surface",
        BODY_TEXT,
        TINT08_BODY,
        "normal",
        '.copy-btn in "Full source"',
    ),
    (
        "inline code on tinted page surface",
        SECONDARY_TEXT,
        TINT10_BODY,
        "normal",
        "<code> inside .install-steps p",
    ),
    (
        "inline code on doubly-tinted page surface",
        SECONDARY_TEXT,
        TINT10_ON_TINT07_BODY,
        "normal",
        "<code> inside .install-note",
    ),
    (
        "inline code on tinted card surface",
        SECONDARY_TEXT,
        TINT10_WIDGET,
        "normal",
        "<code> inside .install-card p",
    ),
    ("footer wordmark on nav surface", BODY_TEXT, NAV, "large", ".footer-logo"),
    ("footer tagline on nav surface", SECONDARY_TEXT, NAV, "normal", ".footer-brand p"),
    ("footer link on nav surface", SECONDARY_TEXT, NAV, "normal", ".footer-links a"),
    (
        "footer link hover on nav surface",
        ACCENT,
        NAV,
        "normal",
        ".footer-links a:hover",
    ),
    ("footer credits on nav surface", SECONDARY_TEXT, NAV, "normal", ".footer-credits"),
    (
        "footer credits link on nav surface",
        BODY_TEXT,
        NAV,
        "normal",
        ".footer-credits a",
    ),
    # .switch, all non-text (WCAG 1.4.11). The two ALLOWLISTED entries below
    # are the theme's own low-alpha track values, not a site defect: see the
    # module docstring. The three un-allowlisted entries are what the switch
    # actually leans on to be perceivable, and are real gates: if any of
    # these drops under 3:1, that IS a build failure.
    (
        "switch off track on card",
        SWITCH_TRACK_OFF,
        WIDGET,
        "non-text",
        ".switch (rest)",
    ),
    (
        "switch on-state knob on on-track",
        SWITCH_KNOB_ON,
        SWITCH_TRACK_ON,
        "non-text",
        ".switch.is-on .switch-knob on .switch.is-on",
    ),
    (
        "switch off-state knob on off-track",
        SWITCH_KNOB_OFF,
        SWITCH_TRACK_OFF,
        "non-text",
        ".switch-knob on .switch (rest)",
    ),
    (
        "switch off-state knob on card",
        SWITCH_KNOB_OFF,
        WIDGET,
        "non-text",
        ".switch-knob overhang on .device-card (rest)",
    ),
    (
        "switch on-state knob on card",
        SWITCH_KNOB_ON,
        WIDGET,
        "non-text",
        ".switch.is-on .switch-knob overhang on .device-card",
    ),
]


def required_threshold(category):
    """4.5:1 for body text; 3.0:1 for large text and non-text UI boundaries."""
    return NORMAL_THRESHOLD if category == "normal" else LARGE_THRESHOLD


def _evaluate_pairs(schemes, pairs, allowlist=None):
    """Return (rows, failures) for `pairs` against every scheme in `schemes`.

    Each row is (scheme_id, label, ratio, threshold, passed, allowlisted).
    failures holds only the rows that fail AND are not in `allowlist`. Takes
    pairs and allowlist as parameters, rather than reading the module-level
    PAIRS and ALLOWLIST directly, so tests can exercise the evaluation logic
    against a couple of hand-built pairs instead of the full real list.
    """
    allowlist = allowlist or {}
    rows = []
    failures = []
    for scheme_id, tokens in schemes.items():
        for label, fg_spec, bg_spec, category, _source in pairs:
            fg = resolve_color(fg_spec, tokens)
            bg = resolve_color(bg_spec, tokens)
            ratio = contrast_ratio(fg, bg)
            threshold = required_threshold(category)
            passed = ratio >= threshold
            allowlisted = (scheme_id, label) in allowlist
            rows.append((scheme_id, label, ratio, threshold, passed, allowlisted))
            if not passed and not allowlisted:
                failures.append((scheme_id, label, ratio, threshold))
    return rows, failures


def evaluate(schemes):
    """Return (rows, failures) for the real PAIRS list, allowlist applied."""
    return _evaluate_pairs(schemes, PAIRS, ALLOWLIST)


def main():
    schemes = parse_token_blocks(TOKENS.read_text())
    rows, failures = evaluate(schemes)

    for scheme_id, label, ratio, threshold, passed, allowlisted in rows:
        if allowlisted:
            status = "ALLOWLISTED"
        elif passed:
            status = "PASS"
        else:
            status = "FAIL"
        print(
            "check-contrast: [{}] {} {}: {:.2f}:1 (need {:.1f}:1) {}".format(
                scheme_id, status, label, ratio, threshold,
                "" if status == "PASS" else "<-- " + status,
            ).rstrip()
        )

    print(
        "check-contrast: {} schemes x {} pairs = {} checks, {} failures "
        "({} allowlisted)".format(
            len(schemes),
            len(PAIRS),
            len(rows),
            len(failures),
            sum(1 for row in rows if row[5]),
        )
    )

    if failures:
        print("", file=sys.stderr)
        for scheme_id, label, ratio, threshold in failures:
            print(
                "check-contrast: FAIL [{}] {}: {:.2f}:1 is below the {:.1f}:1 "
                "floor".format(scheme_id, label, ratio, threshold),
                file=sys.stderr,
            )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
