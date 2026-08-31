/* Generates a complete light + dark scheme pair from one or two seed colours
   and a "look". Pure: no DOM, no theme globals, no persistence. The dialog
   (src/js/theme-wizard.js) owns all of that; this file only computes.

   Output is exactly the 12 keys applyCustomColorScheme() (src/js/scheme.js)
   consumes. sun/moon and the five energy identities are deliberately NOT
   generated: they are device semantics, defined once per base in
   dz-tokens.css / dark.css, and a generated scheme inherits them through its
   scheme_base underlay. A user does not choose what colour water is.

   Every ratio below is met BY CONSTRUCTION, not warned about afterwards, so
   schemeContrastFailures() (src/js/schemes.js) is a backstop here rather than
   the gate it is for hand-picked colours. */

/* Semantic hues in OKLCH degrees. These stay fixed whatever the accent is:
   a purple accent must not make "error" purple. Only their CHROMA follows the
   accent, so they read as siblings of it rather than as pasted-in defaults. */
var DZ_SEMANTIC_HUES = { error: 27.0, success: 145.0, warning: 75.0 };

/* Tuple order for `light` and `dark` is [navbar, background, item]: navbar
   darkest, then background, then item, matching every shipping scheme.

   anchor / danchor are the LIGHTNESS TEXT ANCHORS for the light and dark
   variants. Text is placed at the anchor and its contrast ratio is treated as
   a FLOOR, not a target: solving text down to exactly its ratio produced
   washed-out mid-greys (#585352 on near-white) where the shipping schemes sit
   at 10.7-13.6:1.

   The looks differ STRUCTURALLY, on five axes, not just in how much hue is in
   the greys. That single axis was measured and is nearly invisible in light
   mode: with it alone, `item` was byte-identical across every look (all of
   them used pure white cards) and `background` differed by dE 0.009-0.024. So
   each look also sets its own page-to-card lightness gap, its own border
   treatment (a solved edge for crisp, a whisper offset for the others), its
   own body-text and accent floors, and its own dark-page depth.

   A fourth "High Contrast" look was specified first and cut: at stricter
   ratios only, it measured as a near-duplicate of crisp (every surface within
   dE 0.031). Text anchors near the extremes, so raising a floor from 7 to 10
   binds on nothing. Three looks that genuinely differ beat four with a
   passenger. Users needing AAA use the manual seven-swatch editor.

   main_color and disabled are deliberately NOT spread across looks: the accent
   is the user's own colour and should look like itself whichever look they
   pick, and disabled is a de-emphasis colour with one right answer. */
var DZ_LOOKS = {
    crisp: {
        label: "Crisp", description: "White cards on a grey page, with edges you can see",
        anchor: 0.24, danchor: 0.90, nC: 0.002,
        light: [0.930, 0.945, 1.000], dark: [0.130, 0.200, 0.280],
        body: 8.0, alt: 5.0, acc: 4.5, semC: [0.08, 0.16],
        hardBorder: true, borderRatio: 2.4
    },
    soft: {
        label: "Soft", description: "Tinted greys, cards barely off the page, whisper borders",
        anchor: 0.32, danchor: 0.84, nC: 0.022,
        light: [0.960, 0.985, 0.998], dark: [0.205, 0.240, 0.270],
        body: 7.0, alt: 4.6, acc: 4.5, semC: [0.08, 0.16],
        borderOffset: 0.055
    },
    deep: {
        label: "Deep", description: "A rich tinted page with cards floating above it",
        anchor: 0.34, danchor: 0.82, nC: 0.055,
        light: [0.855, 0.900, 0.965], dark: [0.020, 0.070, 0.180],
        body: 7.0, alt: 4.6, acc: 5.5, semC: [0.10, 0.20],
        borderOffset: 0.13
    }
};

var DZ_LOOK_ORDER = ["crisp", "soft", "deep"];

function dzClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* One variant. seed = { accent, surface, look }; variant = "light" | "dark". */
function dzGenerateScheme(seed, variant) {
    var P = DZ_LOOKS[seed && seed.look] || DZ_LOOKS.soft;
    var dark = variant === "dark";
    var acc = dzHexToOklch(seed.accent);
    var ha = acc.h, Ca = acc.C;
    /* Only the HUE of the second pick is used: it seeds the neutrals, it is
       not a literal surface colour. Omitted, the accent's own hue tints them. */
    var hs = seed.surface ? dzHexToOklch(seed.surface).h : ha;

    var Ls = P[dark ? "dark" : "light"];
    var navbar     = dzOklchToHex(Ls[0], P.nC, hs);
    var background = dzOklchToHex(Ls[1], P.nC, hs);
    var item       = dzOklchToHex(Ls[2], P.nC, hs);

    /* Border treatment is part of a look's identity, not a detail. A
       borderOffset look places a whisper a fixed perceptual distance from the
       background; a hardBorder look solves a real edge against it. Crisp is
       the only hardBorder look, and that edge is most of what makes it read
       as its own thing rather than as a slightly greyer Soft. */
    var border = P.hardBorder
        ? dzSolveLightness(P.nC, hs, background, P.borderRatio, dark)
        : dzOklchToHex(Ls[1] + (dark ? P.borderOffset : -P.borderOffset), P.nC * 1.5, hs);

    var tC = P.nC * 1.5;
    var anchor = dark ? P.danchor : P.anchor;
    var sgn = dark ? -1 : 1;
    var floored = function (L, floor) {
        var c = dzOklchToHex(L, tC, hs);
        return dzContrastRatio(c, background) >= floor
            ? c
            : dzSolveLightness(tC, hs, background, floor, dark);
    };
    var main_text = floored(anchor, P.body);
    var alt_text  = floored(anchor + sgn * 0.13, P.alt);
    var disabled  = dzSolveLightness(tC, hs, background, P.disabledRatio || 3.2, dark);

    /* The accent keeps the user's hue exactly, and its chroma except where the
       sRGB gamut forces a clamp. Only L is deliberately moved, and only as far
       as the ratio demands. */
    var main_color = dzSolveLightness(Ca, ha, background, P.acc, dark);

    /* accent_text is an EXTREME (white on light, near-black on dark), like
       every shipping scheme, not a solved mid-tone. Where it cannot clear 4.5
       the ACCENT moves instead, in the direction that also raises
       accent-vs-background, so the two constraints agree rather than fight.
       Picking whichever of the two candidates scores higher, and then pushing
       the accent toward it, breaks accent-vs-background on dark near-black
       backgrounds. */
    var near_black = dzOklchToHex(0.18, P.nC, hs);
    var accent_text = dark ? near_black : "#FFFFFF";
    for (var i = 0; i < 40; i++) {
        if (dzContrastRatio(accent_text, main_color) >= 4.5) { break; }
        var cur = dzHexToOklch(main_color);
        var L = dark ? Math.min(1.0, cur.L + 0.015) : Math.max(0.0, cur.L - 0.015);
        main_color = dzOklchToHex(L, cur.C, cur.h);
    }

    var out = {
        background: background, item: item, navbar: navbar,
        main_color: main_color, main_text: main_text, alt_text: alt_text,
        border: border, disabled: disabled, accent_text: accent_text
    };
    var semC = dzClamp(Ca, P.semC[0], P.semC[1]);
    for (var key in DZ_SEMANTIC_HUES) {
        if (Object.prototype.hasOwnProperty.call(DZ_SEMANTIC_HUES, key)) {
            out[key] = dzSolveLightness(semC, DZ_SEMANTIC_HUES[key], background, P.acc, dark);
        }
    }
    return out;
}

function dzGenerateSchemePair(seed) {
    return { light: dzGenerateScheme(seed, "light"), dark: dzGenerateScheme(seed, "dark") };
}
