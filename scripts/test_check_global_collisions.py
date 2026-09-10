"""Unit tests for scripts/check-global-collisions.py.

A guard that cannot fail is not a guard: these drive it against synthetic theme
and core trees so the collision path is exercised, rather than only observing
that today's real trees happen to be clean.
"""
import importlib.util
import pathlib
import sys

import pytest

SCRIPT = pathlib.Path(__file__).parent / "check-global-collisions.py"
_SPEC = importlib.util.spec_from_file_location("check_global_collisions", SCRIPT)
# spec_from_file_location returns ModuleSpec | None; assert so the loader
# access below is not an Optional-access error (same shape as the sibling
# guard tests).
assert _SPEC and _SPEC.loader
mod = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(mod)


def theme_tree(root, custom_js="", src_js=""):
    (root / "src" / "js").mkdir(parents=True)
    (root / "js").mkdir()
    (root / "custom.js").write_text(custom_js)
    (root / "src" / "js" / "diag.js").write_text(src_js)
    return root


def core_tree(root, js=""):
    (root / "js").mkdir(parents=True)
    (root / "js" / "domoticz.js").write_text(js)
    return root


def run(theme, core, extra=None):
    argv = ["check-global-collisions.py", "--theme", str(theme), "--core", str(core)] + (extra or [])
    old = sys.argv
    sys.argv = argv
    try:
        return mod.main()
    finally:
        sys.argv = old


def test_clean_trees_pass(tmp_path):
    theme = theme_tree(tmp_path / "theme", "function dzWarnPass() {}\n")
    core = core_tree(tmp_path / "core", "window.dzEasterEggs = 1;\n")
    assert run(theme, core) == 0


def test_a_shared_name_fails(tmp_path):
    theme = theme_tree(tmp_path / "theme", "function dzOpenBarPopup() {}\n")
    core = core_tree(tmp_path / "core", "window.dzOpenBarPopup = function () {};\n")
    assert run(theme, core) == 1


def test_the_hand_typed_names_are_covered_too(tmp_path):
    """machinonDiag is the one symbol a user types from the manual."""
    theme = theme_tree(tmp_path / "theme", "", "function machinonDiag() {}\n")
    core = core_tree(tmp_path / "core", "window.machinonDiag = function () {};\n")
    assert run(theme, core) == 1


def test_names_outside_the_shared_prefix_are_not_collisions(tmp_path):
    """`theme` and `themeFolder` are core's contract WITH a theme, not a clash."""
    theme = theme_tree(tmp_path / "theme", "var theme = {};\nvar themeFolder = 'machinon';\n")
    core = core_tree(tmp_path / "core", "var theme = {};\nwindow.dzEasterEggs = 1;\n")
    assert run(theme, core) == 0


def test_an_indented_declaration_in_core_is_not_a_global(tmp_path):
    """Core's dz* names are mostly Angular DI inside IIFEs, which cannot collide
    with a browser global; counting them would make the check permanently red."""
    theme = theme_tree(tmp_path / "theme", "function dzIconPicker() {}\n")
    core = core_tree(tmp_path / "core",
                     "(function () {\n    function dzIconPicker() {}\n})();\nwindow.dzEasterEggs = 1;\n")
    assert run(theme, core) == 0


def test_a_theme_under_core_www_styles_is_not_core(tmp_path):
    """The core clone can also be the install target, holding a copy of this
    very theme; a theme's own names must not be reported as core's."""
    theme = theme_tree(tmp_path / "theme", "function dzWarnPass() {}\n")
    core = core_tree(tmp_path / "core", "window.dzEasterEggs = 1;\n")
    installed = core / "styles" / "machinon"
    installed.mkdir(parents=True)
    (installed / "custom.js").write_text("function dzWarnPass() {}\n")
    assert run(theme, core) == 0


def test_a_core_path_with_no_dz_globals_at_all_fails_rather_than_passing(tmp_path):
    """A wrong --core path would otherwise report a clean run, which is the one
    result that must never be produced by having measured nothing."""
    theme = theme_tree(tmp_path / "theme", "function dzWarnPass() {}\n")
    core = core_tree(tmp_path / "core", "var somethingElse = 1;\n")
    assert run(theme, core) == 1


def test_a_missing_core_checkout_skips_but_can_be_required(tmp_path):
    theme = theme_tree(tmp_path / "theme", "function dzWarnPass() {}\n")
    missing = tmp_path / "nope"
    assert run(theme, missing) == 0
    assert run(theme, missing, ["--require"]) == 1


@pytest.mark.parametrize("decl,expected", [
    ("var dzThing = 1;", {"dzThing"}),
    ("function dzThing() {}", {"dzThing"}),
    ("window.dzThing = 1;", {"dzThing"}),
    ("window.dzThing == 1;", set()),
    ("    var dzThing = 1;", set()),
    ("var notDzThing = 1;", set()),
])
def test_global_extraction(decl, expected):
    assert mod.globals_in(decl) == expected
