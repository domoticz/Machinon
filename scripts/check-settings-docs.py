#!/usr/bin/env python3
"""Keep docs/settings-reference.md in step with the settings manifest.

src/js/theme-manifest.js is the declarative source of truth for every row the
Theme Hub renders. A setting added there and not documented here leaves a gap
a user hits and we never see; a row documented here that no longer exists in
the manifest sends a user looking for a control that is gone. Both directions
are checked.

The docs format this depends on: every setting is one table row whose FIRST
cell is the storage key in backticks. That keeps the key greppable and gives
a reader something to match against an exported configuration.

Run: python3 scripts/check-settings-docs.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "src" / "js" / "theme-manifest.js"
DOCS = ROOT / "docs" / "settings-reference.md"

# Entry keys are indented object properties. The schema docblock at the top of
# the manifest also contains the word "key:", which is why this anchors on the
# quoted form that only real entries use.
_MANIFEST_KEY = re.compile(r'^\s+key: "([^"]+)"', re.M)

# First cell of a table row, backticked. The separator row (|---|---|) has no
# backticks and is skipped naturally.
_DOC_KEY = re.compile(r"^\|\s*`([^`]+)`\s*\|", re.M)


def manifest_keys(js_text):
    """Return every entry key in the manifest, in declaration order."""
    return _MANIFEST_KEY.findall(js_text)


def documented_keys(md_text):
    """Return every key documented as a table row's first cell, in order."""
    return _DOC_KEY.findall(md_text)


def compare(manifest, documented):
    """Return (undocumented, unknown) as sorted lists."""
    missing = sorted(set(manifest) - set(documented))
    unknown = sorted(set(documented) - set(manifest))
    return missing, unknown


def main():
    manifest = manifest_keys(MANIFEST.read_text())
    documented = documented_keys(DOCS.read_text())
    missing, unknown = compare(manifest, documented)

    if missing:
        print(
            "check-settings-docs: in the manifest but not documented in "
            "docs/settings-reference.md:\n  " + "\n  ".join(missing),
            file=sys.stderr,
        )
    if unknown:
        print(
            "check-settings-docs: documented but not in the manifest "
            "(renamed or removed?):\n  " + "\n  ".join(unknown),
            file=sys.stderr,
        )
    if missing or unknown:
        return 1

    print(
        "check-settings-docs: OK ({} settings documented)".format(len(manifest))
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
