var DZ_SEMANTIC_HUES = { error: 27.0, success: 145.0, warning: 75.0 };
var DZ_LOOKS = {
crisp: {
anchor: 0.24, danchor: 0.90, nC: 0.002,
light: [0.930, 0.945, 1.000], dark: [0.130, 0.200, 0.280],
body: 8.0, alt: 5.0, acc: 4.5, semC: [0.08, 0.16],
hardBorder: true, borderRatio: 2.4
},
soft: {
anchor: 0.32, danchor: 0.84, nC: 0.022,
light: [0.960, 0.985, 0.998], dark: [0.205, 0.240, 0.270],
body: 7.0, alt: 4.6, acc: 4.5, semC: [0.08, 0.16],
borderOffset: 0.055
},
deep: {
anchor: 0.34, danchor: 0.82, nC: 0.055,
light: [0.855, 0.900, 0.965], dark: [0.020, 0.070, 0.180],
body: 7.0, alt: 4.6, acc: 5.5, semC: [0.10, 0.20],
borderOffset: 0.13
}
};
var DZ_LOOK_ORDER = ["crisp", "soft", "deep"];
function dzClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dzGenerateScheme(seed, variant) {
var P = DZ_LOOKS[seed && seed.look] || DZ_LOOKS.soft;
var dark = variant === "dark";
var acc = dzHexToOklch(seed.accent);
var ha = acc.h, Ca = acc.C;
var hs = seed.surface ? dzHexToOklch(seed.surface).h : ha;
var Ls = P[dark ? "dark" : "light"];
var navbar = dzOklchToHex(Ls[0], P.nC, hs);
var background = dzOklchToHex(Ls[1], P.nC, hs);
var item = dzOklchToHex(Ls[2], P.nC, hs);
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
var alt_text = floored(anchor + sgn * 0.13, P.alt);
var disabled = dzSolveLightness(tC, hs, background, P.disabledRatio || 3.2, dark);
var main_color = dzSolveLightness(Ca, ha, background, P.acc, dark);
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
