#!/usr/bin/env python3
"""Self-tests for check-site.py. Run: python3 -m pytest scripts/test_check_site.py -q"""
import importlib.util
import pathlib
import struct

_SPEC = importlib.util.spec_from_file_location(
    "check_site", pathlib.Path(__file__).parent / "check-site.py"
)
check = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(check)


def _png_bytes(width, height):
    """Build the minimal bytes check.png_size actually reads: the signature
    plus an IHDR chunk header carrying width and height. No later chunks are
    needed since png_size only ever looks at the first 24 bytes."""
    return (
        b"\x89PNG\r\n\x1a\n"
        + struct.pack(">I", 13)
        + b"IHDR"
        + struct.pack(">II", width, height)
    )


def test_absolute_refs_flags_root_relative_paths():
    html = '<img src="/assets/x.png"><a href="/docs/">d</a>'
    assert sorted(check.absolute_refs(html)) == ["/assets/x.png", "/docs/"]


def test_absolute_refs_allows_relative_and_external():
    html = (
        '<img src="docs/screenshots/a.png">'
        '<a href="https://github.com/domoticz/Machinon">gh</a>'
        '<a href="#features">f</a>'
        '<a href="./">home</a>'
        '<link href="tokens.css">'
    )
    assert check.absolute_refs(html) == []


def test_absolute_refs_ignores_protocol_relative_and_mailto():
    html = '<a href="mailto:x@example.com">m</a><a href="//example.com/x">p</a>'
    assert check.absolute_refs(html) == []


def test_picker_options_reads_the_select():
    html = (
        '<select id="scheme-picker">'
        '<option value="machinon-light">Machinon Light</option>'
        '<option value="magenta-dark">Magenta Dark</option>'
        '</select>'
    )
    assert check.picker_options(html) == ["machinon-light", "magenta-dark"]


def test_token_schemes_reads_data_scheme_blocks():
    css = (
        ':root,\n[data-scheme="machinon-light"] {\n  --dz-body-bg: #fff;\n}\n'
        '[data-scheme="magenta-dark"] {\n  --dz-body-bg: #171015;\n}\n'
    )
    assert check.token_schemes(css) == ["machinon-light", "magenta-dark"]


def test_runtime_scheme_keys_reads_the_applier():
    js = """
    function applyCustomColorScheme(cs) {
        var s = document.documentElement.style;
        var set = function (token, val) { if (val) { s.setProperty(token, hexToRGB(val)); } };
        set('--dz-body-bg', cs.background);
        set('--dz-body-text', cs.main_text);
        set('--dz-widget-text', cs.main_text);
        set('--dz-accent-color', cs.main_color);
        if (cs.main_color) { s.setProperty('--dz-accent-values', hexToRGB(cs.main_color, true)); }
    }
    """
    assert check.runtime_scheme_keys(js) == {
        "background": ["--dz-body-bg"],
        "main_text": ["--dz-body-text", "--dz-widget-text"],
        "main_color": ["--dz-accent-color"],
    }


def test_runtime_scheme_keys_ignores_calls_outside_the_applier():
    js = """
    function somethingElse(cs) {
        set('--dz-not-a-scheme-token', cs.bogus);
    }
    function applyCustomColorScheme(cs) {
        set('--dz-body-bg', cs.background);
    }
    """
    assert check.runtime_scheme_keys(js) == {"background": ["--dz-body-bg"]}


def test_prepaint_ids_reads_the_inline_head_script():
    html = (
        "<script>(function () {\n"
        "    var IDS = ['machinon-light', 'machinon-dark', 'magenta-light'];\n"
        "}());</script>"
    )
    assert check.prepaint_ids(html) == ["machinon-light", "machinon-dark", "magenta-light"]


def test_prepaint_ids_returns_empty_when_absent():
    assert check.prepaint_ids("<script>var x = 1;</script>") == []


def test_app_scheme_ids_reads_the_schemes_array():
    js = """
    var SCHEMES = [
        { id: 'machinon-light', label: 'Machinon Light', base: 'light' },
        { id: 'machinon-dark', label: 'Machinon Dark', base: 'dark' }
    ];
    var OTHER = ['id: not-a-scheme'];
    """
    assert check.app_scheme_ids(js) == ["machinon-light", "machinon-dark"]


def test_declared_dimensions_reads_src_width_height():
    html = (
        '<img src="assets/icons/temp48.png" alt="x" width="40" height="40" loading="lazy">'
        '<img src="assets/icons/no-dims.png" alt="y">'
        '<img alt="no src" width="10" height="10">'
    )
    assert check.declared_dimensions(html) == [("assets/icons/temp48.png", 40, 40)]


def test_declared_dimensions_ignores_non_integer_attributes():
    html = '<img src="a.png" width="auto" height="40">'
    assert check.declared_dimensions(html) == []


def test_png_size_reads_ihdr_width_and_height(tmp_path):
    path = tmp_path / "sample.png"
    path.write_bytes(_png_bytes(1440, 900))
    assert check.png_size(path) == (1440, 900)


def test_png_size_rejects_non_png_files(tmp_path):
    path = tmp_path / "sample.png"
    path.write_bytes(b"not a png file at all, just filler bytes here")
    try:
        check.png_size(path)
        assert False, "expected ValueError"
    except ValueError:
        pass


def test_resolve_asset_maps_docs_refs_to_the_repo_root():
    assert check.resolve_asset("docs/screenshots/a.png") == check.ROOT / "docs/screenshots/a.png"


def test_resolve_asset_maps_other_refs_under_site():
    assert check.resolve_asset("assets/icons/temp48.png") == check.SITE / "assets/icons/temp48.png"


def test_asset_refs_reads_href_src_and_content():
    html = (
        '<link href="assets/favicon.png">'
        '<meta property="og:image" content="assets/social-preview.png">'
        '<img src="assets/icons/temp48.png">'
        '<a href="docs/">not an asset</a>'
    )
    assert check.asset_refs(html) == [
        "assets/favicon.png",
        "assets/icons/temp48.png",
        "assets/social-preview.png",
    ]


def test_asset_refs_normalizes_absolute_site_url_references():
    html = (
        '<meta property="og:image" content="{}assets/social-preview.png">'
        '<link rel="canonical" href="{}">'
        '<img src="assets/icons/temp48.png">'
    ).format(check.SITE_URL, check.SITE_URL)
    assert check.asset_refs(html) == [
        "assets/icons/temp48.png",
        "assets/social-preview.png",
    ]


def test_asset_files_lists_nested_files_as_assets_relative_paths(tmp_path):
    assets = tmp_path / "assets"
    (assets / "icons").mkdir(parents=True)
    (assets / "favicon.png").write_bytes(b"x")
    (assets / "icons" / "temp48.png").write_bytes(b"x")
    assert check.asset_files(assets) == ["assets/favicon.png", "assets/icons/temp48.png"]
