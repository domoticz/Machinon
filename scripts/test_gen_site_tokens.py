#!/usr/bin/env python3
"""Self-tests for gen-site-tokens.py. Run: python3 -m pytest scripts/test_gen_site_tokens.py -q"""
import importlib.util
import pathlib
import re

_SPEC = importlib.util.spec_from_file_location(
    "gen_site_tokens", pathlib.Path(__file__).parent / "gen-site-tokens.py"
)
gen = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(gen)


def test_extract_block_takes_the_first_root_only():
    css = """
:root {
    --dz-body-bg: #f4f8fc;
    --dz-accent-color: #396d9e;
}
html:root {
    --dz-accent-color: #ffffff;
}
"""
    got = gen.extract_block(css, ":root")
    assert got["--dz-body-bg"] == "#f4f8fc"
    assert got["--dz-accent-color"] == "#396d9e"


def test_extract_block_reads_the_dark_selector():
    css = 'html[data-dz-scheme="dark"] {\n  --dz-body-bg: #0f1620;\n}\n'
    got = gen.extract_block(css, 'html[data-dz-scheme="dark"]')
    assert got["--dz-body-bg"] == "#0f1620"


def test_extract_block_ignores_comments_and_var_references():
    css = """
:root {
    /* --dz-body-bg: #000000; */
    --dz-body-bg: #f4f8fc;
    --dz-accent-red: var(--dz-accent-red-base);
    --dz-accent-red-base: #992f2b;
}
"""
    got = gen.extract_block(css, ":root")
    assert got["--dz-body-bg"] == "#f4f8fc"
    assert got["--dz-accent-red"] == "var(--dz-accent-red-base)"


def test_hex_to_triplet():
    assert gen.hex_to_triplet("#FC72D3") == "252,114,211"
    assert gen.hex_to_triplet("#396d9e") == "57,109,158"
    assert gen.hex_to_triplet("#fff") == "255,255,255"


def test_resolve_scheme_overlays_colors_onto_base():
    base = {
        "--dz-body-bg": "#f4f8fc",
        "--dz-body-text": "#1b2b3a",
        "--dz-accent-color": "#396d9e",
        "--dz-sun-color": "#8c730e",
    }
    colors = {"background": "#171015", "main_color": "#FC72D3"}
    got = gen.resolve_scheme(base, colors)
    assert got["--dz-body-bg"] == "#171015"
    assert got["--dz-accent-color"] == "#FC72D3"
    assert got["--dz-accent-values"] == "252,114,211"
    # untouched keys fall through to the base
    assert got["--dz-body-text"] == "#1b2b3a"
    assert got["--dz-sun-color"] == "#8c730e"


def test_resolve_scheme_sets_both_rgb_triplets():
    got = gen.resolve_scheme({}, {"main_color": "#396d9e", "error": "#992f2b"})
    assert got["--dz-accent-values"] == "57,109,158"
    assert got["--dz-accent-red-values"] == "153,47,43"


def test_main_text_drives_widget_text_too():
    got = gen.resolve_scheme({}, {"main_text": "#EBD3E4"})
    assert got["--dz-body-text"] == "#EBD3E4"
    assert got["--dz-widget-text"] == "#EBD3E4"


def test_scheme_ids_order_starts_with_the_two_base_schemes():
    ids = gen.scheme_ids()
    assert ids[0] == "machinon-light"
    assert ids[1] == "machinon-dark"
    assert len(ids) == 8
    assert "magenta-dark" in ids


def test_elevation_rides_the_base_fallthrough():
    """dark.css deepens every elevation alpha, and the site must inherit that.

    No scheme JSON carries an elevation key, so these three reach a scheme only
    by falling through from its base. If SCHEME_KEY_TO_TOKENS ever grew an
    elevation entry, or the trio dropped out of SITE_TOKENS, the landing page
    would go back to painting light-scheme shadows on a dark underlay, which is
    the bug this guards.
    """
    light, dark = gen._bases()
    assert light["--dz-elev-card"] == "0 1px 4px rgba(0,0,0,0.25)"
    assert dark["--dz-elev-card"] == "0 1px 4px rgba(0,0,0,0.50)"

    for token in ("--dz-elev-card", "--dz-elev-popup", "--dz-elev-overlay"):
        assert token in gen.SITE_TOKENS
        assert token not in [t for ts in gen.SCHEME_KEY_TO_TOKENS.values() for t in ts]
        # A dark-based scheme overlaying its colours must not disturb elevation.
        assert gen.resolve_scheme(dark, {"main_color": "#83a598"})[token] == dark[token]


def test_generated_css_gives_every_dark_scheme_the_deepened_alpha():
    css = gen.build()
    blocks = dict(
        (name, body)
        for name, body in re.findall(
            r'\[data-scheme="([a-z-]+)"\][^{]*\{(.*?)\}', css, re.S
        )
    )
    assert len(blocks) == 8
    for name, body in blocks.items():
        expected = "0.50" if name.endswith("-dark") else "0.25"
        assert "--dz-elev-card: 0 1px 4px rgba(0,0,0,{});".format(expected) in body, name
