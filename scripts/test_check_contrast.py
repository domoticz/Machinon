#!/usr/bin/env python3
"""Self-tests for check-contrast.py. Run: python3 -m pytest scripts/test_check_contrast.py -q"""
import importlib.util
import pathlib

_SPEC = importlib.util.spec_from_file_location(
    "check_contrast", pathlib.Path(__file__).parent / "check-contrast.py"
)
check = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(check)


def test_hex_to_rgb_six_digit():
    assert check.hex_to_rgb("#f4f8fc") == (244, 248, 252)


def test_hex_to_rgb_three_digit_short_form():
    assert check.hex_to_rgb("#fff") == (255, 255, 255)


def test_triplet_to_rgb():
    assert check.triplet_to_rgb("131,165,152") == (131, 165, 152)


def test_relative_luminance_black_and_white():
    # Textbook WCAG values: pure black is 0, pure white is 1.
    assert check.relative_luminance((0, 0, 0)) == 0.0
    assert abs(check.relative_luminance((255, 255, 255)) - 1.0) < 1e-9


def test_contrast_ratio_black_on_white_is_21_to_1():
    assert abs(check.contrast_ratio((0, 0, 0), (255, 255, 255)) - 21.0) < 0.01


def test_contrast_ratio_is_order_independent():
    a = check.contrast_ratio((0, 0, 0), (255, 255, 255))
    b = check.contrast_ratio((255, 255, 255), (0, 0, 0))
    assert a == b


def test_contrast_ratio_identical_colours_is_1_to_1():
    assert check.contrast_ratio((100, 100, 100), (100, 100, 100)) == 1.0


def test_composite_full_opacity_is_the_foreground():
    assert check.composite((10, 20, 30), 1.0, (200, 200, 200)) == (10, 20, 30)


def test_composite_zero_opacity_is_the_base():
    assert check.composite((10, 20, 30), 0.0, (200, 200, 200)) == (200, 200, 200)


def test_composite_matches_hand_computed_blend():
    # 0.08 accent over a widget background, the exact shape of the two real
    # failures that motivated this whole harness (accent tint over widget-bg).
    fg = (152, 204, 253)
    base = (24, 32, 43)
    got = check.composite(fg, 0.08, base)
    expected = tuple(round(fg[i] * 0.08 + base[i] * 0.92) for i in range(3))
    assert got == expected


def test_resolve_color_token():
    tokens = {"--dz-body-bg": "#f4f8fc"}
    assert check.resolve_color(("token", "--dz-body-bg"), tokens) == (244, 248, 252)


def test_resolve_color_triplet():
    tokens = {"--dz-accent-values": "152,204,253"}
    assert check.resolve_color(("triplet", "--dz-accent-values"), tokens) == (
        152,
        204,
        253,
    )


def test_resolve_color_composite():
    tokens = {"--dz-accent-values": "255,0,0", "--dz-widget-bg": "#000000"}
    spec = (
        "composite",
        0.5,
        ("triplet", "--dz-accent-values"),
        ("token", "--dz-widget-bg"),
    )
    assert check.resolve_color(spec, tokens) == (128, 0, 0)


def test_resolve_color_nested_composite():
    # A tint of a tint, as .install-note's own <code> spans render: the
    # 0.10 code tint sits on top of the note's own 0.07 tint over body-bg.
    tokens = {
        "--dz-accent-values": "255,0,0",
        "--dz-body-bg": "#000000",
    }
    inner = ("composite", 0.07, ("triplet", "--dz-accent-values"), ("token", "--dz-body-bg"))
    outer = ("composite", 0.10, ("triplet", "--dz-accent-values"), inner)
    inner_rgb = check.resolve_color(inner, tokens)
    outer_rgb = check.resolve_color(outer, tokens)
    assert inner_rgb == (18, 0, 0)
    assert outer_rgb == check.composite((255, 0, 0), 0.10, inner_rgb)


def test_required_threshold_normal_and_large():
    assert check.required_threshold("normal") == 4.5
    assert check.required_threshold("large") == 3.0
    assert check.required_threshold("non-text") == 3.0


def test_parse_token_blocks_reads_every_scheme():
    css = (
        ':root,\n[data-scheme="machinon-light"] {\n'
        "    --dz-body-bg: #f4f8fc;\n"
        "    --dz-body-text: #1b2b3a;\n"
        "}\n"
        '[data-scheme="magenta-dark"] {\n'
        "    --dz-body-bg: #171015;\n"
        "}\n"
    )
    blocks = check.parse_token_blocks(css)
    assert blocks["machinon-light"]["--dz-body-bg"] == "#f4f8fc"
    assert blocks["machinon-light"]["--dz-body-text"] == "#1b2b3a"
    assert blocks["magenta-dark"]["--dz-body-bg"] == "#171015"


def test_evaluate_flags_a_failing_pair():
    tokens = {"--dz-body-bg": "#ffffff", "--dz-body-text": "#fefefe"}
    schemes = {"test-scheme": tokens}
    pairs = [("near white on white", ("token", "--dz-body-text"), ("token", "--dz-body-bg"), "normal", "test")]
    rows, failures = check._evaluate_pairs(schemes, pairs)
    assert len(rows) == 1
    assert len(failures) == 1
    assert failures[0][1] == "near white on white"


def test_evaluate_respects_the_allowlist():
    tokens = {"--dz-body-bg": "#ffffff", "--dz-body-text": "#fefefe"}
    schemes = {"test-scheme": tokens}
    pairs = [("near white on white", ("token", "--dz-body-text"), ("token", "--dz-body-bg"), "normal", "test")]
    allowlist = {("test-scheme", "near white on white"): "test allowlist entry"}
    rows, failures = check._evaluate_pairs(schemes, pairs, allowlist)
    assert len(rows) == 1
    assert failures == []
    assert rows[0][5] is True  # allowlisted flag


def test_the_real_site_tokens_pass_with_only_the_known_allowlisted_findings():
    """Integration check: run the real pair list against the real
    site/tokens.css. This is what scripts/check-contrast.py itself asserts;
    repeating it here means a change that breaks the gate breaks a fast
    pytest run too, not just a separate script invocation.

    16 allowlisted rows: the one #bigtext finding, the switch off-track-on-
    card finding in all 8 schemes, and the switch on-knob-on-on-track
    finding in 7 of 8 (paper-light passes that one on its own, 4.98:1, and
    is deliberately not allowlisted)."""
    schemes = check.parse_token_blocks(check.TOKENS.read_text())
    rows, failures = check.evaluate(schemes)
    assert failures == []
    allowlisted = [row for row in rows if row[5]]
    assert len(allowlisted) == 16

    bigtext = [row for row in allowlisted if row[1] == "device value (#bigtext) on device card"]
    assert [row[0] for row in bigtext] == ["gruvbox-dark"]

    track = [row for row in allowlisted if row[1] == "switch off track on card"]
    assert len(track) == 8

    on_knob = [row for row in allowlisted if row[1] == "switch on-state knob on on-track"]
    assert len(on_knob) == 7
    assert "paper-light" not in [row[0] for row in on_knob]

    # The pairs that actually carry the switch's WCAG 1.4.11 perceivability
    # are un-allowlisted and must be genuinely passing, not just excluded.
    carrying_pairs = ("switch off-state knob on card", "switch on-state knob on card")
    for row in rows:
        if row[1] in carrying_pairs:
            assert row[4] is True, "{} must pass on its own merit".format(row)
