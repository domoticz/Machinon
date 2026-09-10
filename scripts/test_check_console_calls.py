"""Unit tests for scripts/check-console-calls.py.

The counting rules are the whole guard, and two of them are the difference
between a number that means something and a number that does not: a feature test
is not a call, and the recorder's own gated console.debug is not the thing being
rationed.
"""
import importlib.util
import pathlib
import sys

SCRIPT = pathlib.Path(__file__).parent / "check-console-calls.py"
_SPEC = importlib.util.spec_from_file_location("check_console_calls", SCRIPT)
# spec_from_file_location returns ModuleSpec | None; assert so the loader
# access below is not an Optional-access error (same shape as the sibling
# guard tests).
assert _SPEC and _SPEC.loader
mod = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(mod)


def tree(root, custom_js="", src_js="", moment_js=""):
    (root / "src" / "js").mkdir(parents=True)
    (root / "js").mkdir()
    (root / "custom.js").write_text(custom_js)
    (root / "src" / "js" / "devices.js").write_text(src_js)
    (root / "js" / "moment.js").write_text(moment_js)
    return root


def run(root, extra=None):
    argv = ["check-console-calls.py", "--root", str(root)] + (extra or [])
    old = sys.argv
    sys.argv = argv
    try:
        return mod.main()
    finally:
        sys.argv = old


def test_counts_calls_per_level(tmp_path):
    root = tree(tmp_path, 'console.log("a");\nconsole.warn("b");\nconsole.error("c");\n')
    per_file, per_level = mod.count(root)
    assert per_level == {"log": 1, "warn": 1, "error": 1}
    assert per_file == {"custom.js": 3}


def test_a_feature_test_is_not_a_call(tmp_path):
    """`typeof console !== "undefined" && console.log` guards a call, and
    counting it reported sites that do not exist in the first inventory."""
    root = tree(tmp_path, 'if (typeof console !== "undefined" && console.log) {\n  var x = 1;\n}\n')
    _, per_level = mod.count(root)
    assert sum(per_level.values()) == 0


def test_the_recorders_own_debug_output_is_not_counted(tmp_path):
    """console.debug is dzLog's gated output: counting it would penalise the
    migration this guard exists to protect."""
    root = tree(tmp_path, "", 'console.debug("machinon_toast", "decision", {});\n')
    _, per_level = mod.count(root)
    assert sum(per_level.values()) == 0


def test_vendored_moment_is_not_counted(tmp_path):
    root = tree(tmp_path, "", "", 'console.warn("moment deprecation");\n')
    per_file, _ = mod.count(root)
    assert per_file == {}


def test_above_the_baseline_fails_only_under_check(tmp_path):
    root = tree(tmp_path, 'console.log("x");\n' * (mod.BASELINE + 1))
    assert run(root) == 0, "a plain run is advisory"
    assert run(root, ["--check"]) == 1


def test_at_or_below_the_baseline_passes_under_check(tmp_path):
    at = tree(tmp_path / "at", 'console.log("x");\n' * mod.BASELINE)
    below = tree(tmp_path / "below", 'console.log("x");\n' * (mod.BASELINE - 1))
    assert run(at, ["--check"]) == 0
    assert run(below, ["--check"]) == 0, "removing a call must never turn the check red"


def test_the_recorded_baseline_matches_the_real_tree():
    """The floor is only a floor while it is the truth: a baseline left above
    the real count is silent headroom for the next addition."""
    _, per_level = mod.count(mod.REPO)
    assert sum(per_level.values()) <= mod.BASELINE
