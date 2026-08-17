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


def test_resolve_asset_maps_the_repo_root_trees():
    """docs/, iconpack/ and images/ are copied into the built tree from the
    repo root, so a reference to one must not be resolved under site/."""
    assert check.resolve_asset("docs/screenshots/a.png") == check.ROOT / "docs/screenshots/a.png"
    assert check.resolve_asset("iconpack/machinon_Bed48_On.png") == check.ROOT / "iconpack/machinon_Bed48_On.png"
    assert check.resolve_asset("images/Light48_On.png") == check.ROOT / "images/Light48_On.png"
    assert check.resolve_asset("assets/favicon.png") == check.SITE / "assets/favicon.png"


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


def test_external_refs_reads_iconpack_and_images_paths():
    html = (
        '<img src="iconpack/machinon_Bed48_On.png">'
        '<img src="images/Light48_On.png">'
        '<img src="assets/icons/temp48.png">'
        '<a href="docs/">not an external ref</a>'
    )
    assert check.external_refs(html) == [
        "iconpack/machinon_Bed48_On.png",
        "images/Light48_On.png",
    ]


def test_external_refs_deduplicates_repeated_references():
    html = '<img src="images/Light48_On.png"><img src="images/Light48_On.png">'
    assert check.external_refs(html) == ["images/Light48_On.png"]


def test_external_refs_returns_empty_without_iconpack_or_images_refs():
    html = '<img src="assets/icons/temp48.png"><a href="docs/">d</a>'
    assert check.external_refs(html) == []


def test_asset_files_lists_nested_files_as_assets_relative_paths(tmp_path):
    assets = tmp_path / "assets"
    (assets / "icons").mkdir(parents=True)
    (assets / "favicon.png").write_bytes(b"x")
    (assets / "icons" / "temp48.png").write_bytes(b"x")
    assert check.asset_files(assets) == ["assets/favicon.png", "assets/icons/temp48.png"]


_TOUR_JS = """
    var SLIDES = [
        { name: 'Dashboard', caption: 'Dashboard, your devices as cards', perScheme: true },
        { name: 'Floorplan', caption: 'Floorplan',
          light: 'docs/screenshots/floorplan.png', dark: 'docs/screenshots/floorplan-dark.png' },
        { name: 'Switches', caption: 'Switches',
          light: 'docs/screenshots/switches.png', dark: 'docs/screenshots/switches-dark.png' }
    ];

    var DASHBOARD_SHOTS = {
        'machinon-light': 'docs/screenshots/dashboard-light.png',
        'machinon-dark': 'docs/screenshots/dashboard-dark.png'
    };
"""


def test_tour_dashboard_shots_reads_the_map():
    assert check.tour_dashboard_shots(_TOUR_JS) == {
        "machinon-light": "docs/screenshots/dashboard-light.png",
        "machinon-dark": "docs/screenshots/dashboard-dark.png",
    }


def test_tour_slide_paths_skips_the_per_scheme_slide():
    """The Dashboard slide carries no light/dark pair: its sources live in
    DASHBOARD_SHOTS, one per scheme, so it must not be reported as a slide
    missing its twins."""
    assert check.tour_slide_paths(_TOUR_JS) == [
        ("Floorplan", "docs/screenshots/floorplan.png", "docs/screenshots/floorplan-dark.png"),
        ("Switches", "docs/screenshots/switches.png", "docs/screenshots/switches-dark.png"),
    ]


def test_tour_slide_paths_reports_a_missing_dark_twin():
    js = """
    var SLIDES = [
        { name: 'Dashboard', perScheme: true },
        { name: 'Weather', light: 'docs/screenshots/weather.png' }
    ];
    var DASHBOARD_SHOTS = { 'machinon-light': 'docs/screenshots/dashboard-light.png' };
    """
    assert check.tour_slide_paths(js) == [("Weather", "docs/screenshots/weather.png", "")]


def test_tour_dashboard_shots_returns_empty_without_the_map():
    assert check.tour_dashboard_shots("var SLIDES = [];") == {}


def test_duplicate_tour_paths_finds_two_slides_sharing_a_path():
    """Two slides resolving to the same file is a broken tour even though
    every path exists: the visitor sees the same screenshot twice under two
    different captions, and check 6's existence loop would call it healthy.
    Task 2's capture harness hit exactly this once, when a navigation
    silently did not take and two captures came out identical."""
    dashboard_shots = {"machinon-light": "docs/screenshots/dashboard-light.png"}
    slides = [
        ("Floorplan", "docs/screenshots/floorplan.png", "docs/screenshots/floorplan-dark.png"),
        ("Switches", "docs/screenshots/floorplan.png", "docs/screenshots/switches-dark.png"),
    ]
    assert check.duplicate_tour_paths(dashboard_shots, slides) == [
        ("Floorplan (light)", "Switches (light)", "docs/screenshots/floorplan.png"),
    ]


def test_duplicate_tour_paths_returns_empty_when_all_distinct():
    dashboard_shots = {
        "machinon-light": "docs/screenshots/dashboard-light.png",
        "machinon-dark": "docs/screenshots/dashboard-dark.png",
    }
    slides = [
        ("Floorplan", "docs/screenshots/floorplan.png", "docs/screenshots/floorplan-dark.png"),
    ]
    assert check.duplicate_tour_paths(dashboard_shots, slides) == []


def test_duplicate_tour_paths_ignores_missing_paths():
    """A slide missing its dark twin (reported by "" from tour_slide_paths)
    must not be treated as a duplicate of another missing twin: that is
    check 6's separate missing-capture failure, not a shared-path failure."""
    dashboard_shots = {}
    slides = [
        ("Floorplan", "docs/screenshots/floorplan.png", ""),
        ("Switches", "docs/screenshots/switches.png", ""),
    ]
    assert check.duplicate_tour_paths(dashboard_shots, slides) == []


def test_duplicate_tour_paths_finds_two_dashboard_schemes_sharing_a_path():
    """duplicate_tour_paths() claims to compare DASHBOARD_SHOTS entries
    against each other too, not only slide-versus-slide: two schemes wired
    to the same dashboard capture is exactly as broken, since a visitor
    switching schemes on the Dashboard slide would see no change at all."""
    dashboard_shots = {
        "machinon-light": "docs/screenshots/dashboard-light.png",
        "magenta-light": "docs/screenshots/dashboard-light.png",
    }
    assert check.duplicate_tour_paths(dashboard_shots, []) == [
        ("Dashboard (machinon-light)", "Dashboard (magenta-light)",
         "docs/screenshots/dashboard-light.png"),
    ]


def test_duplicate_tour_paths_finds_a_dashboard_and_a_slide_sharing_a_path():
    """The same check spans DASHBOARD_SHOTS and SLIDES together: a scheme's
    dashboard capture reused as a different named slide's capture is still
    one screenshot doing two jobs in the rotation."""
    dashboard_shots = {"machinon-light": "docs/screenshots/dashboard-light.png"}
    slides = [
        ("Floorplan", "docs/screenshots/dashboard-light.png", "docs/screenshots/floorplan-dark.png"),
    ]
    assert check.duplicate_tour_paths(dashboard_shots, slides) == [
        ("Dashboard (machinon-light)", "Floorplan (light)",
         "docs/screenshots/dashboard-light.png"),
    ]


def test_tour_slide_problems_returns_empty_on_the_valid_fixture():
    assert check.tour_slide_problems(_TOUR_JS) == []


def test_tour_slide_problems_reports_a_missing_slides_array():
    problems = check.tour_slide_problems("var DASHBOARD_SHOTS = {};")
    assert len(problems) == 1
    assert "no `var SLIDES" in problems[0]


def test_tour_slide_problems_reports_a_double_quoted_entry():
    """The concrete regression: reformatting SLIDES from single to double
    quotes makes _FIELD match nothing, so every entry's field dict comes
    back empty and tour_slide_paths() silently reports zero slides. This
    must surface as a problem instead of a quiet gap."""
    js = """
    var SLIDES = [
        { name: "Dashboard", perScheme: true },
        { name: "Floorplan", light: "docs/screenshots/floorplan.png",
          dark: "docs/screenshots/floorplan-dark.png" }
    ];
    var DASHBOARD_SHOTS = { 'machinon-light': 'docs/screenshots/dashboard-light.png' };
    """
    problems = check.tour_slide_problems(js)
    assert len(problems) == 1
    assert "no readable `name` field" in problems[0]


def test_tour_phone_shot_reads_the_path():
    js = "var PHONE_SHOT = 'docs/screenshots/mobile-dashboard.png';"
    assert check.tour_phone_shot(js) == "docs/screenshots/mobile-dashboard.png"


def test_tour_phone_shot_returns_empty_when_absent():
    assert check.tour_phone_shot("var SLIDES = [];") == ""
