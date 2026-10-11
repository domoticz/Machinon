function dzSrgbToLinear(c) {
c = c / 255;
return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function dzLinearToSrgb(c) {
return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
function dzHexToLinearTriplet(hex) {
hex = String(hex || "").replace("#", "");
if (hex.length === 3) {
hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
}
if (hex.length !== 6) { return [0, 0, 0]; }
return [
dzSrgbToLinear(parseInt(hex.substring(0, 2), 16)),
dzSrgbToLinear(parseInt(hex.substring(2, 4), 16)),
dzSrgbToLinear(parseInt(hex.substring(4, 6), 16))
];
}
function dzHexToOklch(hex) {
var rgb = dzHexToLinearTriplet(hex);
var r = rgb[0], g = rgb[1], b = rgb[2];
var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
var l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
var L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
var A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
var B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
var h = Math.atan2(B, A) * 180 / Math.PI;
return { L: L, C: Math.sqrt(A * A + B * B), h: (h % 360 + 360) % 360 };
}
function dzOklchToSrgbRaw(L, C, h) {
var rad = h * Math.PI / 180;
var A = C * Math.cos(rad), B = C * Math.sin(rad);
var l_ = L + 0.3963377774 * A + 0.2158037573 * B;
var m_ = L - 0.1055613458 * A - 0.0638541728 * B;
var s_ = L - 0.0894841775 * A - 1.2914855480 * B;
var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
return [
dzLinearToSrgb( 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
dzLinearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
dzLinearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
];
}
var DZ_GAMUT_EPS = 0.0005;
function dzInGamut(L, C, h) {
var rgb = dzOklchToSrgbRaw(L, C, h);
for (var i = 0; i < 3; i++) {
if (rgb[i] < -DZ_GAMUT_EPS || rgb[i] > 1 + DZ_GAMUT_EPS) { return false; }
}
return true;
}
function dzOklchToHex(L, C, h) {
var lo = 0, hi = C;
if (dzInGamut(L, C, h)) {
lo = C;
} else {
for (var i = 0; i < 24; i++) {
var mid = (lo + hi) / 2;
if (dzInGamut(L, mid, h)) { lo = mid; } else { hi = mid; }
}
}
var rgb = dzOklchToSrgbRaw(L, lo, h);
var out = "#";
for (var j = 0; j < 3; j++) {
var v = Math.round(Math.max(0, Math.min(1, rgb[j])) * 255);
out += (v < 16 ? "0" : "") + v.toString(16).toUpperCase();
}
return out;
}
function dzRelativeLuminance(hex) {
var rgb = dzHexToLinearTriplet(hex);
return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function dzContrastRatio(hexA, hexB) {
var a = dzRelativeLuminance(hexA), b = dzRelativeLuminance(hexB);
return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function dzSolveLightness(C, h, bgHex, targetRatio, searchUp) {
var lo = searchUp ? 0.30 : 0.0;
var hi = searchUp ? 1.0 : 0.75;
var best = null;
for (var i = 0; i < 40; i++) {
var mid = (lo + hi) / 2;
var candidate = dzOklchToHex(mid, C, h);
var ok = dzContrastRatio(candidate, bgHex) >= targetRatio;
if (ok) { best = candidate; }
if (searchUp) {
if (ok) { hi = mid; } else { lo = mid; }
} else {
if (ok) { lo = mid; } else { hi = mid; }
}
}
return best || dzOklchToHex(searchUp ? 1.0 : 0.0, C, h);
}
