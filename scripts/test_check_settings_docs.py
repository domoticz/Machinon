#!/usr/bin/env python3
"""Self-tests for check-settings-docs.py.
Run: python3 -m pytest scripts/test_check_settings_docs.py -q"""
import importlib.util
import pathlib

_SPEC = importlib.util.spec_from_file_location(
    "check_settings_docs", pathlib.Path(__file__).parent / "check-settings-docs.py"
)
check = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(check)


def test_manifest_keys_reads_entry_keys_only():
    js = """
    /* Schema:
       key:  stable manifest id, described in prose, must not be collected
    */
    var THEME_MANIFEST = [
        {
            id: "general",
            label: "General",
            entries: [
                {
                    key: "standby", storageKey: "standby", control: "toggle",
                    label: "Screen standby"
                },
                {
                    key: "check_update", storageKey: "check_update", control: "toggle",
                    label: "Update notice"
                }
            ]
        }
    ];
    """
    assert check.manifest_keys(js) == ["standby", "check_update"]


def test_documented_keys_reads_first_cell_backticks():
    md = """
# Settings reference

## General

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `standby` | Screen standby | Blanks the screen. | Whole UI |
| `check_update` | Update notice | Shows a notice. | Whole UI |
"""
    assert check.documented_keys(md) == ["standby", "check_update"]


def test_documented_keys_ignores_inline_code_outside_the_first_cell():
    md = "| `standby` | Screen standby | Pairs with `standby_after`. | Whole UI |\n"
    assert check.documented_keys(md) == ["standby"]


def test_documented_keys_ignores_the_header_separator_row():
    md = "| Key | Setting |\n|---|---|\n| `standby` | Screen standby |\n"
    assert check.documented_keys(md) == ["standby"]


def test_compare_reports_both_directions():
    missing, unknown = check.compare(["a", "b"], ["b", "c"])
    assert missing == ["a"]
    assert unknown == ["c"]
