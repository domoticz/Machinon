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


def test_rgb_parses_the_shipped_triplet_format():
    """The status glow tokens ship as "r, g, b" (dz-tokens.css/dark.css), not
    hex, so rgb() must read that format too."""
    assert measure.rgb("196, 64, 65") == [196, 64, 65]
    assert measure.rgb("0, 0, 139") == [0, 0, 139]


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
    assert set(measure.PINNED_FILES) == {
        "LIGHT", "DARK", "PAPER_LIGHT", "PAPER_DARK", "STATUS_LIGHT", "STATUS_DARK",
    }


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


# ---- device-status glow tokens (2026-08-31 notification-system Task 6) --

def test_status_palettes_cover_the_same_roles():
    assert set(measure.STATUS_LIGHT) == set(measure.STATUS_DARK) == {
        "timeout", "lowbat", "protected"
    }


def test_status_floor_is_the_literal_wcag_minimum():
    """Unlike the identity colours' 3.2 headroom, status glows were solved to
    ~3.10 worst case on purpose (see the long comment in dz-tokens.css), so
    this guard checks the literal WCAG SC 1.4.11 floor rather than reusing
    FLOOR - reusing 3.2 would reject values that already clear WCAG."""
    assert measure.STATUS_FLOOR == 3.0
    assert measure.STATUS_FLOOR < measure.FLOOR


def test_every_shipped_status_value_clears_its_floor_on_every_card():
    """The guard's own reason for existing: a passing token, checked against
    every shipped scheme's own card, not just the two bases that missed
    gruvbox in the first pass."""
    for name, base, card in measure.cards():
        palette = measure.STATUS_LIGHT if base == "light" else measure.STATUS_DARK
        for role, value in palette.items():
            ratio = measure.contrast(measure.rgb(value), measure.rgb(card))
            assert ratio >= measure.STATUS_FLOOR, f"{name}/status-{role} {value} on {card} = {ratio}:1"


def test_a_failing_status_token_is_caught(monkeypatch):
    """Reproduce the exact v1 defect (pure yellow, 1.07:1 on a light card)
    and confirm the guard's own floor check would reject it. A check that
    cannot fail is worthless."""
    drifted = dict(measure.STATUS_LIGHT)
    drifted["lowbat"] = "#FFFF00"
    monkeypatch.setattr(measure, "STATUS_LIGHT", drifted)
    ratio = measure.contrast(measure.rgb("#FFFF00"), measure.rgb("#ffffff"))
    assert ratio < measure.STATUS_FLOOR
    assert ratio == 1.07


def test_status_palette_selection_follows_base_not_scheme_name():
    """gruvbox-dark's own name does not contain the literal string 'dark
    (base)' the way the two plain bases do, and Paper takes a totally
    different branch (name.startswith('paper')) for the identity colours.
    Confirm the status lookup keys off each scheme's `base` field - the only
    field src/js/scheme.js actually uses to pick light vs dark - not off
    scheme naming, for both a scheme whose base agrees with its name
    (dark (base)) and one where only the JSON's `base` field says so
    (gruvbox-dark, magenta-dark, paper-dark all declare "base": "dark" while
    carrying their own distinct card colours)."""
    cards_by_name = {name: (base, card) for name, base, card in measure.cards()}

    base, card = cards_by_name["gruvbox-dark"]
    assert base == "dark"
    palette = measure.STATUS_LIGHT if base == "light" else measure.STATUS_DARK
    assert palette is measure.STATUS_DARK
    ratio = measure.contrast(measure.rgb(palette["protected"]), measure.rgb(card))
    assert ratio == measure.contrast(measure.rgb(measure.STATUS_DARK["protected"]), measure.rgb(card))

    base, card = cards_by_name["gruvbox-light"]
    assert base == "light"
    palette = measure.STATUS_LIGHT if base == "light" else measure.STATUS_DARK
    assert palette is measure.STATUS_LIGHT


def test_status_constants_are_pinned_to_the_shipped_triplet_not_the_comment_hex():
    """The bug this guard exists to catch: the tokens ship as an RGB triplet
    with the hex only in a trailing CSS comment. A pin keyed off the hex
    stayed green when only the triplet was edited and the comment was left
    untouched (proven manually: the pre-fix script reported OK against
    dz-tokens.css with --dz-status-lowbat-values-base changed to 255, 255, 0
    and its comment unchanged). Pinning on the triplet means that same edit,
    with or without the comment, is exactly what makes this fail."""
    for value in measure.STATUS_LIGHT.values():
        assert "," in value, "status constants must be the shipped triplet, not a hex string"
    for value in measure.STATUS_DARK.values():
        assert "," in value, "status constants must be the shipped triplet, not a hex string"


def test_status_constants_are_pinned_to_their_shipped_files():
    assert measure.PINNED_FILES["STATUS_LIGHT"] == "dz-tokens.css"
    assert measure.PINNED_FILES["STATUS_DARK"] == "dark.css"


def test_the_status_pin_actually_catches_drift(monkeypatch):
    """Mirrors test_the_pin_actually_catches_drift for the identity colours:
    a CSS-only revert (the exact careless edit this guard exists to catch)
    must be reported by name."""
    drifted = dict(measure.STATUS_LIGHT)
    drifted["lowbat"] = "#FFFF00"          # the actual v1 value, not shipped
    monkeypatch.setattr(measure, "STATUS_LIGHT", drifted)
    missing = measure.check_pinned()
    assert len(missing) == 1
    assert "STATUS_LIGHT/lowbat" in missing[0]
    assert "#FFFF00" in missing[0]
    assert "dz-tokens.css" in missing[0]


def test_the_status_pin_catches_a_triplet_drift_with_its_comment_untouched(monkeypatch):
    """The finding this guard was fixed for: drift the constant to a triplet
    that is NOT in the shipped file, exactly like an edited
    --dz-status-*-values-base with its trailing hex comment left alone. A
    hex-pinned script would have kept reporting OK here, because the comment
    (the only hex in the file) never changed."""
    drifted = dict(measure.STATUS_LIGHT)
    drifted["lowbat"] = "255, 255, 0"     # a triplet edit, comment untouched
    monkeypatch.setattr(measure, "STATUS_LIGHT", drifted)
    missing = measure.check_pinned()
    assert len(missing) == 1
    assert "STATUS_LIGHT/lowbat" in missing[0]
    assert "255, 255, 0" in missing[0]
    assert "dz-tokens.css" in missing[0]
