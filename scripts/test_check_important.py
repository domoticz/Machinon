"""Unit tests for scripts/check-important.py, driven against synthetic trees so
the failing path is exercised, not only today's real count."""
import importlib.util
import pathlib
import sys

SCRIPT = pathlib.Path(__file__).parent / "check-important.py"
_SPEC = importlib.util.spec_from_file_location("check_important", SCRIPT)
assert _SPEC and _SPEC.loader
mod = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(mod)


def tree(root, custom_css="", leaf_css="", vendored_css=""):
    (root / "css").mkdir(parents=True)
    (root / "custom.css").write_text(custom_css)
    (root / "css" / "cards.css").write_text(leaf_css)
    (root / "css" / "ionicons.min.css").write_text(vendored_css)
    return root


def run(root, extra=None):
    old = sys.argv
    sys.argv = ["check-important.py", "--root", str(root)] + (extra or [])
    try:
        return mod.main()
    finally:
        sys.argv = old


def test_counts_declarations(tmp_path):
    root = tree(tmp_path, "a{color:red !important}", "b{x:1!important;y:2 ! important}")
    assert sum(mod.count(root).values()) == 3


def test_a_comment_is_not_a_use(tmp_path):
    root = tree(tmp_path, "/* needs !important because core loads later */ a{color:red}")
    assert sum(mod.count(root).values()) == 0


def test_vendored_css_is_not_counted(tmp_path):
    root = tree(tmp_path, "", "", "a{color:red!important}")
    assert mod.count(root) == {}


def test_above_the_baseline_fails_only_under_check(tmp_path):
    root = tree(tmp_path, "a{color:red!important}\n" * (mod.BASELINE + 1))
    assert run(root) == 0, "a plain run is advisory"
    assert run(root, ["--check"]) == 1


def test_at_or_below_the_baseline_passes(tmp_path):
    root = tree(tmp_path, "a{color:red!important}\n")
    assert run(root, ["--check"]) == 0
