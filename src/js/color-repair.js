/* Contrast repair for the theme's FIXED colours.

   Ten colours in the theme are not derived from the active scheme: the three
   device-status colours (timeout, low battery, protected) and the seven
   identity colours (energy import/export/gas/water/price, sun, moon). Each has
   one light value and one dark value, chosen by MEASURING them against the
   eight schemes that ship (scripts/measure-icon-contrast.py holds that gate).

   Nobody measures a theme a user builds. A hand-built dark palette gets the
   LIGHT set, because src/js/scheme.js sets data-dz-scheme to "custom" rather
   than "dark" when scheme_base is undefined, so nothing in dark.css applies:
   measured 2026-09-01, protected navy on a dark custom card is 1.07:1. A
   mid-toned palette is worse - all seven identity colours land at 1.01-1.14:1.
   The wizard's generator deliberately does not emit these ("a user does not
   choose what colour water is", src/js/scheme-generator.js), so a generated
   scheme is exposed the same way on a mid-toned card. gruvbox is the proof
   that mid-toned is not hypothetical: it is what forced the 4.0 retune.

   REPAIR, NOT REPLACE. A colour that already clears its floor on the real card
   is returned untouched. Only a failing one moves, and only in lightness, hue
   held. That is what keeps every shipped scheme byte-identical: measured, 0 of
   24 shipped status values change. Solving all of them from scratch would land
   each on exactly the target, which is a DIFFERENT theme - protected on a white
   card would drop from navy #00008B at 15.30:1 to a mid blue at 4.03:1.

   Pure: no DOM, no theme globals, so scripts/test-color-repair.mjs can run this
   file in a node vm exactly as scripts/test-color-oklch.mjs does. The caller
   (src/js/scheme.js) owns reading the resolved tokens and writing the results.

   Depends on src/js/color-oklch.js, which must load first (custom.js
   THEME_MODULES order). */

/* WCAG SC 1.4.11 puts non-text at 3:1. The theme solved its shipped status and
   identity values to 4.0 and 3.2 respectively, so a repaired value aims at the
   same number the designed one did rather than at the bare floor. */
var DZ_REPAIR_TARGET_STATUS = 4.0;
var DZ_REPAIR_TARGET_IDENTITY = 3.2;

/* The toast tile aims at the bare 3:1 non-text floor, NOT at the card's 4.0.
   Measured: at 4.0 a mid-toned navbar has no solution in the hue at all, so the
   solve gives up and returns the unrepaired value - i.e. asking for more than
   is reachable produces LESS. At 3.0 every one of 1032 card/navbar combinations
   solves. The tile is also a smaller ask than the card: the glyph sits on a
   surface that is 85% navbar, so it is a tinted panel rather than an arbitrary
   scheme colour. */
var DZ_REPAIR_TARGET_TILE = 3.0;

/* The toast severity tile is the severity mixed 15% into --dz-menu-bg
   (css/toasts.css). Kept here, not in the caller, because dzRepairAgainstTile
   is only correct for this exact mix. */
var DZ_REPAIR_TILE_MIX = 0.15;

/* Blend two #rrggbb in gamma space, which is what color-mix(in srgb, ...)
   does - verified against Chromium's computed value, not assumed. */
function dzRepairMix(fgHex, bgHex, ratio) {
    var out = "#";
    for (var i = 1; i < 7; i += 2) {
        var f = parseInt(fgHex.substr(i, 2), 16);
        var b = parseInt(bgHex.substr(i, 2), 16);
        var v = Math.round(f * ratio + b * (1 - ratio));
        v = Math.max(0, Math.min(255, v));
        out += (v < 16 ? "0" : "") + v.toString(16);
    }
    return out;
}

/* Solve `startHex` against a background, holding hue.

   bgOf(candidate) returns the background to measure against. For a card it
   ignores its argument and returns the card; for the toast tile the background
   CONTAINS 15% of the candidate, so it is a function of it and the solve has to
   iterate. It settles in one or two passes in practice; the loop is capped.

   Both directions are tried and the more chromatic survivor wins. Solving only
   one way runs into the gamut corner on a mid-toned background and the hue
   washes out to near-white (measured: #FFFEFE, #FFFEFC, #FEFEFF for the three
   status colours on a #7a7f86 card). Trying both gives #4A0007, #2C1E00,
   #00116D - still red, olive and navy.

   Chroma needs no handling here: dzOklchToHex already gamut-maps by holding L
   and h and reducing C, and dzSolveLightness goes through it. An earlier
   version added its own gamut pass and a fixed-point loop; it cost 4x as much,
   oscillated instead of converging, and produced identical output. Do not
   re-add it. */
function dzRepairSolve(startHex, bgOf, target) {
    if (dzContrastRatio(startHex, bgOf(startHex)) >= target) { return startHex; }
    var o = dzHexToOklch(startHex);
    var cands = [];
    var dirs = [true, false];
    for (var d = 0; d < dirs.length; d++) {
        var c = startHex;
        for (var i = 0; i < 4; i++) {
            var next = dzSolveLightness(o.C, o.h, bgOf(c), target, dirs[d]);
            if (!next || next === c) { c = next || c; break; }
            c = next;
        }
        if (c && dzContrastRatio(c, bgOf(c)) >= target - 0.02) { cands.push(c); }
    }
    if (!cands.length) { return startHex; }   /* nothing in this hue works: keep the design value */
    cands.sort(function (a, b) { return dzHexToOklch(b).C - dzHexToOklch(a).C; });
    return cands[0];
}

/* Repair a colour painted directly on a surface (card glow, ring, glyph, or a
   Dash2 identity icon). */
function dzRepairAgainstSurface(startHex, surfaceHex, target) {
    if (!startHex || !surfaceHex) { return startHex; }
    return dzRepairSolve(startHex, function () { return surfaceHex; }, target);
}

/* Repair a colour painted on the toast severity tile, whose background is the
   colour itself mixed into the navbar.

   This needs its OWN value: one colour cannot serve both the card and the tile.
   Measured over 1032 card x navbar combinations, requiring a single value to
   clear both is IMPOSSIBLE in 473 of them. The reason is structural - the tile
   background contains 15% of the colour, so contrast against your own mix is
   bounded by your distance from the NAVBAR, and when the navbar and the card
   sit on opposite sides no lightness in that hue satisfies both. With one value
   per surface, zero failures across the same 1032. */
function dzRepairAgainstTile(startHex, menuHex, target) {
    if (!startHex || !menuHex) { return startHex; }
    return dzRepairSolve(startHex, function (c) {
        return dzRepairMix(c, menuHex, DZ_REPAIR_TILE_MIX);
    }, target);
}
