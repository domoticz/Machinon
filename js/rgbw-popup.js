(function () {
"use strict";
if (typeof window.ShowRGBWPopup !== "function" ||
window.ShowRGBWPopup.length !== 8 ||
typeof window.HandleProtection !== "function" ||
typeof window.getLEDType !== "function" ||
typeof window.SwitchLightPopup !== "function") {
return;
}
if (window.ShowRGBWPopup._mkHooked) return;
var orig = window.ShowRGBWPopup;
window.ShowRGBWPopup = function (event, idx, Protected, MaxDimLevel, LevelInt, color, SubType, DimmerType) {
var led = window.getLEDType(SubType || "");
if (DimmerType && DimmerType === "rel") {
return orig.apply(this, arguments);
}
var card = event && event.target && event.target.closest ? event.target.closest(".item") : null;
var nameEl = card ? card.querySelector(".item-name, #name") : null;
window.HandleProtection(Protected, function () {
openPopup({ idx: idx, led: led, maxDim: MaxDimLevel, levelInt: LevelInt, colorJSON: color, protected: Protected, event: event, name: nameEl ? nameEl.textContent.trim() : "" });
});
};
window.ShowRGBWPopup._mkHooked = true;
var state = { idx: null, led: null, mode: "color", h: 0, s: 1, warmth: 0.5, brightNative: 0, brightApplyNative: 1, maxDim: 100, protected: null, mix: 0 };
var openerEl = null;
var docListenerTimer = null;
var brightTouched = false;
function el(tag, cls, parent) {
var n = document.createElement(tag);
if (cls) n.className = cls;
if (parent) parent.appendChild(n);
return n;
}
function ensureDom() {
if (document.getElementById("mk-rgbw-popup")) return;
var scrim = document.getElementById("mk-rgbw-scrim");
if (!scrim) {
scrim = el("div", null, document.body);
scrim.id = "mk-rgbw-scrim";
}
scrim.addEventListener("click", closePopup);
var pop = el("div", null, document.body);
pop.id = "mk-rgbw-popup";
pop.setAttribute("role", "dialog");
pop.setAttribute("aria-modal", "true");
pop.setAttribute("aria-labelledby", "mk-rgbw-title");
var head = el("div", "mk-rgbw-head", pop);
var title = el("span", null, head);
title.id = "mk-rgbw-title";
var close = el("button", "mk-rgbw-close", head);
close.type = "button";
close.setAttribute("aria-label", $.t("Close"));
var closeIcon = el("i", "icon ion-md-close", close);
closeIcon.setAttribute("aria-hidden", "true");
close.addEventListener("click", closePopup);
el("div", "mk-rgbw-body", pop);
}
function onKeydown(e) {
if (e.key === "Escape") { closePopup(); }
}
function resolvePlacement() {
if (window.matchMedia && window.matchMedia("(max-width: 979px)").matches) return "centered";
return document.querySelector('link[href*="center_popups.css"]') ? "centered" : "anchored";
}
function onDocMousedown(e) {
var pop = document.getElementById("mk-rgbw-popup");
if (pop && !pop.contains(e.target)) closePopup();
}
function openPopup(args) {
ensureDom();
clearTimeout($.setColValue);
state.idx = String(args.idx);
state.led = args.led;
state.maxDim = parseInt(args.maxDim, 10) || 100;
state.protected = args.protected;
state.brightNative = Math.max(0, Math.min(state.maxDim, parseInt(args.levelInt, 10) || 0));
state.brightApplyNative = Math.max(1, state.brightNative);
brightTouched = false;
seedFromColor(args.colorJSON);
document.getElementById("mk-rgbw-title").textContent = args.name || (state.led.bHasRGB ? $.t("Color") : $.t("White"));
buildBody(state.led);
openerEl = document.activeElement;
var pop = document.getElementById("mk-rgbw-popup");
var scrim = document.getElementById("mk-rgbw-scrim");
var placement = resolvePlacement();
pop.classList.toggle("mk-rgbw-anchored", placement === "anchored");
if (placement === "anchored") {
scrim.style.display = "none";
pop.style.display = "block";
var ev = args.event || {};
var vw = document.documentElement.clientWidth;
var vh = document.documentElement.clientHeight;
var x = (typeof ev.clientX === "number" ? ev.clientX : vw / 2) + 12;
var y = (typeof ev.clientY === "number" ? ev.clientY : vh / 2) + 12;
var w = pop.offsetWidth, h = pop.offsetHeight;
var clampedX = Math.max(10, Math.min(x, vw - 10 - w));
var clampedY = Math.max(10, Math.min(y, vh - 10 - h));
pop.style.left = (clampedX + window.scrollX) + "px";
pop.style.top = (clampedY + window.scrollY) + "px";
docListenerTimer = setTimeout(function () { docListenerTimer = null; document.addEventListener("mousedown", onDocMousedown); }, 0);
} else {
pop.style.left = "";
pop.style.top = "";
scrim.style.display = "block";
pop.style.display = "block";
}
document.addEventListener("keydown", onKeydown);
var c = document.querySelector("#mk-rgbw-popup .mk-rgbw-close");
if (c) c.focus();
checkOffState(state.idx);
}
function checkOffState(idx) {
$.ajax({
url: "json.htm?type=command&param=getdevices&rid=" + idx,
type: "GET",
dataType: "json",
success: function (data) {
if (brightTouched || state.idx !== idx) return;
var pop = document.getElementById("mk-rgbw-popup");
if (!pop || pop.style.display === "none") return;
var dev = data && data.result && data.result[0];
if (!dev || dev.Status !== "Off") return;
state.brightNative = 0;
var slider = document.getElementById("mk-rgbw-bright");
if (slider) { slider.value = 0; paintRangeFill(slider); }
var brVal = document.getElementById("mk-rgbw-bright-value");
if (brVal) brVal.textContent = "0%";
}
});
}
function closePopup() {
var pop = document.getElementById("mk-rgbw-popup");
if (!pop) return;
flushSend();
pop.style.display = "none";
document.getElementById("mk-rgbw-scrim").style.display = "none";
document.removeEventListener("keydown", onKeydown);
if (docListenerTimer) { clearTimeout(docListenerTimer); docListenerTimer = null; }
document.removeEventListener("mousedown", onDocMousedown);
if (openerEl && typeof openerEl.focus === "function") openerEl.focus();
openerEl = null;
}
function seedFromColor(colorJSON) {
var col = {};
try { col = typeof colorJSON === "string" ? JSON.parse(colorJSON) : (colorJSON || {}); } catch (e) {}
var isWhiteOnlyCustom = col.m === 4 &&
(col.r || 0) === 0 && (col.g || 0) === 0 && (col.b || 0) === 0 &&
((col.cw || 0) > 0 || (col.ww || 0) > 0);
state.mode = (col.m === 1 || col.m === 2 || isWhiteOnlyCustom) ? "white" : "color";
if (col.r !== undefined || col.g !== undefined || col.b !== undefined) {
var hsv = rgbToHsv(col.r || 0, col.g || 0, col.b || 0);
state.h = hsv.h; state.s = hsv.s;
}
state.warmth = col.t !== undefined ? col.t / 255 : 0.5;
var chan = state.led && state.led.bHasTemperature
? (col.cw || 0) + (col.ww || 0)
: Math.max(col.cw || 0, col.ww || 0);
state.mix = col.m === 4 ? Math.max(0, Math.min(1, chan / 255)) : 0;
}
function buildBody(led) {
var body = document.querySelector("#mk-rgbw-popup .mk-rgbw-body");
body.innerHTML = "";
var hasWhiteSide = led.bHasWhite || led.bHasTemperature;
if (led.bHasRGB && hasWhiteSide) {
var tabs = el("div", "mk-rgbw-tabs", body);
tabs.setAttribute("role", "tablist");
[["color", $.t("Color")], ["white", $.t("White")]].forEach(function (t) {
var b = el("button", state.mode === t[0] ? "active" : null, tabs);
b.type = "button";
b.setAttribute("role", "tab");
b.dataset.mode = t[0];
b.textContent = t[1];
b.addEventListener("click", function () { setMode(t[0]); });
});
} else {
state.mode = led.bHasRGB ? "color" : "white";
}
if (led.bHasRGB) {
var pane = el("div", "mk-rgbw-pane-color", body);
if (state.mode !== "color") pane.style.display = "none";
var canvas = el("canvas", null, pane);
canvas.id = "mk-rgbw-wheel";
canvas.width = WHEEL; canvas.height = WHEEL;
drawWheel(canvas);
attachWheel(canvas);
if (led.bHasCustom) {
var mixGroup = el("div", "mk-rgbw-slider-group", pane);
var mixLabel = el("span", "mk-rgbw-slider-label", mixGroup);
mixLabel.textContent = $.t("White mix");
var mixWrap = el("div", "mk-rgbw-mix-wrap", mixGroup);
el("span", "mk-rgbw-mix-chip", mixWrap).id = "mk-rgbw-mix-chip-left";
var mixInput = el("input", null, mixWrap);
mixInput.id = "mk-rgbw-mix";
mixInput.type = "range"; mixInput.min = 0; mixInput.max = 100;
mixInput.value = Math.round(state.mix * 100);
mixInput.setAttribute("aria-label", $.t("White mix"));
el("span", "mk-rgbw-mix-chip", mixWrap);
paintMixTrack();
mixInput.addEventListener("input", function () {
state.mix = (parseInt(this.value, 10) || 0) / 100;
scheduleSend("color");
});
mixInput.addEventListener("change", flushSend);
}
}
if (led.bHasTemperature) {
var wp = el("div", "mk-rgbw-pane-white", body);
if (state.mode !== "white") wp.style.display = "none";
var warmLabel = el("span", "mk-rgbw-slider-label", wp);
warmLabel.textContent = $.t("Warmth");
var warmRow = el("div", "mk-rgbw-warmth-row", wp);
var warm = el("input", null, warmRow);
warm.id = "mk-rgbw-warmth";
warm.type = "range"; warm.min = 0; warm.max = 255;
warm.value = Math.round(state.warmth * 255);
warm.setAttribute("aria-label", $.t("White"));
warm.addEventListener("input", function () {
state.warmth = (parseInt(this.value, 10) || 0) / 255;
updateReadout();
scheduleSend("color");
});
warm.addEventListener("change", flushSend);
}
var readout = el("div", "mk-rgbw-readout", body);
el("span", "mk-rgbw-swatch", readout);
var hx = el("input", null, readout);
hx.id = "mk-rgbw-hex";
hx.type = "text"; hx.maxLength = 7; hx.autocomplete = "off";
hx.setAttribute("aria-label", $.t("Color"));
hx.addEventListener("change", function () {
var m = /^#?([0-9a-f]{6})$/i.exec(this.value.trim());
if (!m) { updateReadout(); return; }
var v = parseInt(m[1], 16);
var hsv = rgbToHsv((v >> 16) & 255, (v >> 8) & 255, v & 255);
state.h = hsv.h; state.s = hsv.s; state.mode = "color";
var c = document.getElementById("mk-rgbw-wheel");
if (c) drawWheel(c);
paintMixTrack();
updateReadout();
onPick(); flushSend();
});
var brGroup = el("div", "mk-rgbw-slider-group", body);
var brLabel = el("span", "mk-rgbw-slider-label", brGroup);
brLabel.textContent = $.t("Brightness");
var br = el("div", "mk-rgbw-bright", brGroup);
var slider = el("input", null, br);
slider.id = "mk-rgbw-bright";
slider.type = "range"; slider.min = 0; slider.max = state.maxDim; slider.value = state.brightNative;
slider.setAttribute("aria-label", $.t("Brightness"));
var brVal = el("span", null, br);
brVal.id = "mk-rgbw-bright-value";
brVal.textContent = displayPct(state.brightNative) + "%";
paintRangeFill(slider);
slider.addEventListener("input", function () {
var v = parseInt(this.value, 10) || 0;
brightTouched = true;
paintRangeFill(this);
if (v >= 1) {
state.brightNative = v;
state.brightApplyNative = v;
brVal.textContent = displayPct(v) + "%";
scheduleSend("level");
} else {
state.brightNative = 0;
brVal.textContent = "0%";
cancelPendingSend();
}
});
slider.addEventListener("change", function () {
var v = parseInt(this.value, 10) || 0;
if (v === 0) {
state.brightNative = 0;
scheduleSend("level");
}
flushSend();
});
var presets = el("div", "mk-rgbw-presets", body);
[["On", "On"], ["Off", "Off"]].forEach(function (p) {
var b = el("button", "mk-rgbw-preset", presets);
b.type = "button";
b.textContent = $.t(p[1]);
b.addEventListener("click", function () {
window.SwitchLightPopup(state.idx, p[0], state.protected);
if (p[0] === "Off") closePopup();
});
});
updateReadout();
}
function setMode(mode) {
state.mode = mode;
var pop = document.getElementById("mk-rgbw-popup");
pop.querySelectorAll(".mk-rgbw-tabs button").forEach(function (b) {
b.classList.toggle("active", b.dataset.mode === mode);
});
var cp = pop.querySelector(".mk-rgbw-pane-color");
var wp = pop.querySelector(".mk-rgbw-pane-white");
if (cp) cp.style.display = mode === "color" ? "" : "none";
if (wp) wp.style.display = mode === "white" ? "" : "none";
updateReadout();
scheduleSend("color"); flushSend();
}
function hsvToRgb(h, s, v) {
var i = Math.floor(h * 6), f = h * 6 - i;
var p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
var r, g, b;
switch (i % 6) {
case 0: r = v; g = t; b = p; break;
case 1: r = q; g = v; b = p; break;
case 2: r = p; g = v; b = t; break;
case 3: r = p; g = q; b = v; break;
case 4: r = t; g = p; b = v; break;
default: r = v; g = p; b = q;
}
return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
function rgbToHsv(r, g, b) {
r /= 255; g /= 255; b /= 255;
var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
var h = 0, s = max === 0 ? 0 : d / max;
if (d !== 0) {
if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
else if (max === g) h = ((b - r) / d + 2) / 6;
else h = ((r - g) / d + 4) / 6;
}
return { h: h, s: s, v: max };
}
function toHex(n) { return ("0" + n.toString(16)).slice(-2); }
function displayPct(v) { return Math.floor((100 / state.maxDim) * v); }
var WHEEL = 210;
function drawWheel(canvas) {
if (typeof window.dzDrawColorWheel === "function") {
window.dzDrawColorWheel(canvas, WHEEL, state.h * 360, state.s);
}
}
function updateReadout() {
var readout = document.querySelector(".mk-rgbw-readout");
var sw = document.querySelector(".mk-rgbw-swatch");
var hx = document.getElementById("mk-rgbw-hex");
if (!sw || !hx) return;
var hideRow = state.mode === "white" && !(state.led && state.led.bHasTemperature);
if (readout) readout.style.display = hideRow ? "none" : "";
if (hideRow) return;
if (state.mode === "color") {
var rgb = hsvToRgb(state.h, state.s, 1);
sw.style.background = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
hx.value = "#" + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
hx.disabled = false;
} else {
var w = warmthRgb(state.warmth);
sw.style.background = "rgb(" + w.r + "," + w.g + "," + w.b + ")";
hx.value = state.led && state.led.bHasTemperature
? (state.warmth < 0.3 ? $.t("Cool") : state.warmth > 0.7 ? $.t("Warm") : $.t("White"))
: $.t("White");
hx.disabled = true;
}
}
function warmthRgb(w) {
return {
r: Math.round(219 + (255 - 219) * w),
g: Math.round(233 + (180 - 233) * w),
b: Math.round(255 + (94 - 255) * w)
};
}
function paintRangeFill(inp) {
if (inp.id === "mk-rgbw-warmth") return;
if (inp.id === "mk-rgbw-mix") return;
var p = ((inp.value - inp.min) / (inp.max - inp.min)) * 100;
inp.style.background =
"linear-gradient(to right, rgba(var(--dz-accent-values),0.5) 0 " + p + "%, " +
"var(--dz-card-slider-track-bg) " + p + "% 100%)";
}
function paintMixTrack() {
var mixInput = document.getElementById("mk-rgbw-mix");
if (!mixInput) return;
var rgb = hsvToRgb(state.h, state.s, 1);
var rgbCss = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
mixInput.style.background = "linear-gradient(to right, " + rgbCss + ", #ffffff)";
var chipLeft = document.getElementById("mk-rgbw-mix-chip-left");
if (chipLeft) chipLeft.style.background = rgbCss;
}
function buildColorJSON() {
var c;
if (state.mode === "color") {
var rgb = hsvToRgb(state.h, state.s, 1);
if (state.led && state.led.bHasCustom && state.mix > 0) {
if (state.led.bHasTemperature) {
var wt = Math.round(state.warmth * 255);
c = { m: 4, t: wt, r: rgb.r, g: rgb.g, b: rgb.b,
cw: Math.round(state.mix * (1 - state.warmth) * 255),
ww: Math.round(state.mix * state.warmth * 255) };
} else {
c = { m: 4, t: 0, r: rgb.r, g: rgb.g, b: rgb.b,
cw: Math.round(state.mix * 255), ww: Math.round(state.mix * 255) };
}
} else {
c = { m: 3, t: 0, r: rgb.r, g: rgb.g, b: rgb.b, cw: 0, ww: 0 };
}
} else if (state.led && state.led.bHasTemperature) {
var t = Math.round(state.warmth * 255);
c = { m: 2, t: t, r: 0, g: 0, b: 0, cw: Math.round((1 - state.warmth) * 255), ww: Math.round(state.warmth * 255) };
} else {
c = { m: 1, t: 0, r: 0, g: 0, b: 0, cw: 255, ww: 255 };
}
return JSON.stringify(c);
}
function syncBrightnessUI() {
var slider = document.getElementById("mk-rgbw-bright");
if (!slider || (parseInt(slider.value, 10) || 0) !== 0) return;
state.brightNative = state.brightApplyNative;
slider.value = state.brightNative;
paintRangeFill(slider);
var brVal = document.getElementById("mk-rgbw-bright-value");
if (brVal) brVal.textContent = displayPct(state.brightNative) + "%";
}
function sendColor() {
if (!state.idx) return;
syncBrightnessUI();
var colorJSON = buildColorJSON();
var applyNative = state.brightNative > 0 ? state.brightNative : state.brightApplyNative;
var pct = Math.max(1, Math.min(100, Math.ceil(applyNative * 100 / state.maxDim)));
if (typeof window.SetColValue === "function") {
window.SetColValue(state.idx, colorJSON, pct);
} else {
$.ajax({ url: "json.htm?type=command&param=setcolbrightnessvalue&idx=" + state.idx +
"&color=" + encodeURIComponent(colorJSON) + "&brightness=" + pct,
dataType: "json" });
}
}
function sendLevel() {
if (!state.idx) return;
$.ajax({ url: "json.htm?type=command&param=switchlight&idx=" + state.idx +
"&switchcmd=" + encodeURIComponent("Set Level") + "&level=" + state.brightNative,
dataType: "json" });
}
var sendTimer = null, sendDirty = false, pendingKind = null;
function scheduleSend(kind) {
sendDirty = true;
pendingKind = kind;
if (sendTimer) return;
sendTimer = setTimeout(function () {
sendTimer = null;
if (sendDirty) { sendDirty = false; sendPending(); }
}, 400);
}
function flushSend() {
if (sendTimer) { clearTimeout(sendTimer); sendTimer = null; }
if (sendDirty) { sendDirty = false; sendPending(); }
}
function cancelPendingSend() {
if (sendTimer) { clearTimeout(sendTimer); sendTimer = null; }
sendDirty = false;
pendingKind = null;
}
function sendPending() {
var kind = pendingKind;
pendingKind = null;
if (kind === "level") sendLevel(); else sendColor();
}
function onPick() { scheduleSend("color"); }
function attachWheel(canvas) {
function handlePick(hueDegrees, saturation) {
state.h = (((hueDegrees % 360) + 360) % 360) / 360;
state.s = saturation;
drawWheel(canvas);
paintMixTrack();
updateReadout();
onPick();
}
if (typeof window.dzAttachColorWheel === "function") {
window.dzAttachColorWheel(canvas, WHEEL, handlePick, flushSend);
}
}
})();
