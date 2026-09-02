#!/usr/bin/env python3
"""Self-tests for check-settings-docs.py.
Run: python3 -m pytest scripts/test_check_settings_docs.py -q"""
import importlib.util
import pathlib

_SPEC = importlib.util.spec_from_file_location(
    "check_settings_docs", pathlib.Path(__file__).parent / "check-settings-docs.py"
)
# spec_from_file_location returns ModuleSpec | None; assert so the loader
# access below is not an Optional-access error.
assert _SPEC and _SPEC.loader
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


def test_documented_keys_reads_anchor_comments():
    md = "### Screen standby\n<!-- key: standby -->\n\nProse.\n\n### Update notice\n<!-- key: check_update -->\n"
    assert check.documented_keys(md) == ["standby", "check_update"]


def test_table_rows_no_longer_count():
    md = "| `standby` | Screen standby | ... | ... |\n"
    assert check.documented_keys(md) == []


def test_compare_reports_both_directions():
    missing, unknown = check.compare(["a", "b"], ["b", "c"])
    assert missing == ["a"]
    assert unknown == ["c"]
