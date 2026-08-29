#!/usr/bin/env python3
"""Self-tests for measure-icon-contrast.py. Run: python3 -m pytest scripts/test_measure_icon_contrast.py -q"""
import importlib.util
import json
import pathlib

_SPEC = importlib.util.spec_from_file_location(
    "measure_icon_contrast", pathlib.Path(__file__).parent / "measure-icon-contrast.py"
)
measure = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(measure)

REPO = pathlib.Path(__file__).parent.parent


def test_rgb_parses_a_six_digit_hex():
    assert measure.rgb("#a37300") == [163, 115, 0]


def test_rgb_tolerates_a_missing_hash():
    assert measure.rgb("a37300") == [163, 115, 0]


def test_luminance_of_the_extremes():
    assert measure.luminance([0, 0, 0]) == 0
    assert measure.luminance([255, 255, 255]) == 1


def test_contrast_black_on_white_is_the_wcag_maximum():
    assert measure.contrast([0, 0, 0], [255, 255, 255]) == 21


def test_contrast_is_symmetric():
    """WCAG's ratio does not care which colour is foreground."""
    fg, bg = [163, 115, 0], [255, 255, 255]
    assert measure.contrast(fg, bg) == measure.contrast(bg, fg)


def test_contrast_of_a_colour_with_itself_is_one():
    assert measure.contrast([18, 32, 43], [18, 32, 43]) == 1


def test_the_floor_is_above_the_wcag_minimum():
    """3.0 is the WCAG SC 1.4.11 non-text floor; the script uses 3.2 so a
    shipped value never sits exactly on the line."""
    assert measure.FLOOR > 3.0


# ---- the palettes -------------------------------------------------------

def test_every_palette_covers_the_same_roles():
    roles = set(measure.LIGHT)
    for palette in (measure.DARK, measure.PAPER_LIGHT, measure.PAPER_DARK):
        assert set(palette) == roles


def test_dark_values_are_cores_own_for_the_five_energy_roles():
    """The dark column is deliberately unchanged from Domoticz core, which is
    what guarantees this change is invisible to anyone already on a dark
    scheme. If someone 'improves' one of these, this test is the tripwire."""
    assert measure.DARK["import"] == "#ffb300"
    assert measure.DARK["export"] == "#66bb6a"
    assert measure.DARK["gas"] == "#ff7043"
    assert measure.DARK["water"] == "#29b6f6"
    assert measure.DARK["price"] == "#c8a0ff"


def test_every_shipped_value_clears_the_floor_on_every_card():
    """The script's own reason for existing, asserted rather than eyeballed."""
    for name, base, card in measure.cards():
        if name.startswith("paper"):
            palette = measure.PAPER_LIGHT if base == "light" else measure.PAPER_DARK
        else:
            palette = measure.LIGHT if base == "light" else measure.DARK
        for role, value in palette.items():
            ratio = measure.contrast(measure.rgb(value), measure.rgb(card))
            assert ratio >= measure.FLOOR, f"{name}/{role} {value} on {card} = {ratio}:1"


# ---- scheme discovery ---------------------------------------------------

def test_cards_includes_both_bases_and_every_built_in_scheme():
    names = [name for name, _, _ in measure.cards()]
    assert "light (base)" in names
    assert "dark (base)" in names
    for slug in json.loads((REPO / "schemes" / "index.json").read_text()):
        assert slug in names


def test_cards_skips_the_index_which_is_not_a_scheme():
    """schemes/index.json is a plain array of slugs. Reading it as a scheme
    would raise, so this also guards the exclusion staying in place."""
    assert "index" not in [name for name, _, _ in measure.cards()]


def test_every_card_colour_is_a_hex_the_parser_accepts():
    for name, _, card in measure.cards():
        assert measure.rgb(card), name


# ---- the pin against the shipped files ----------------------------------

def test_pinned_files_cover_every_palette_constant():
    assert set(measure.PINNED_FILES) == {"LIGHT", "DARK", "PAPER_LIGHT", "PAPER_DARK"}


def test_pinned_files_all_exist():
    for rel_path in measure.PINNED_FILES.values():
        assert (REPO / rel_path).is_file(), rel_path


def test_the_pin_passes_against_the_repo_as_shipped():
    assert measure.check_pinned() == []


def test_the_pin_actually_catches_drift(monkeypatch):
    """A check that cannot fail is worthless. Point one constant at a colour
    that is not in the shipped file and confirm it is reported."""
    drifted = dict(measure.LIGHT)
    drifted["import"] = "#a37301"          # one digit off the shipped #a37300
    monkeypatch.setattr(measure, "LIGHT", drifted)
    missing = measure.check_pinned()
    assert len(missing) == 1
    assert "LIGHT/import" in missing[0]
    assert "#a37301" in missing[0]
    assert "dz-tokens.css" in missing[0]
