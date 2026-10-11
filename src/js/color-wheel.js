(function () {
"use strict";
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
var wheelImageSize = 0, wheelImage = null;
function drawWheelBase(ctx, size) {
var r = size / 2;
if (wheelImageSize !== size || !wheelImage) {
var img = ctx.createImageData(size, size);
var d = img.data;
for (var y = 0; y < size; y++) {
for (var x = 0; x < size; x++) {
var dx = x - r, dy = y - r, dist = Math.sqrt(dx * dx + dy * dy);
var i4 = (y * size + x) * 4;
if (dist > r) { d[i4 + 3] = 0; continue; }
var hue = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1;
var rgb = hsvToRgb(hue, Math.min(dist / r, 1), 1);
d[i4] = rgb.r; d[i4 + 1] = rgb.g; d[i4 + 2] = rgb.b; d[i4 + 3] = 255;
}
}
wheelImage = img;
wheelImageSize = size;
}
ctx.putImageData(wheelImage, 0, 0);
}
function dzDrawColorWheel(canvas, size, hueDegrees, saturation) {
var ctx = canvas.getContext("2d");
drawWheelBase(ctx, size);
if (typeof hueDegrees !== "number" || typeof saturation !== "number") return;
var r = size / 2;
var h = (((hueDegrees % 360) + 360) % 360) / 360;
var s = Math.max(0, Math.min(1, saturation));
var ang = h * 2 * Math.PI, rad = s * (r - 8);
var cx = r + rad * Math.cos(ang), cy = r + rad * Math.sin(ang);
var rgb = hsvToRgb(h, s, 1);
ctx.beginPath();
ctx.arc(cx, cy, 7.5, 0, 2 * Math.PI);
ctx.fillStyle = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
ctx.fill();
ctx.lineWidth = 2;
ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--dz-widget-bg").trim() || "#fff";
ctx.stroke();
}
var activeCanvas = null, activeSize = 0, activeOnPick = null, activeOnCommit = null, dragging = false;
var wired = false;
function pick(e) {
if (!activeCanvas) return;
var rect = activeCanvas.getBoundingClientRect();
var size = activeSize;
var scale = size / (rect.width || size);
var px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
var py = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
var r = size / 2;
var dx = px * scale - r, dy = py * scale - r;
var h = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1;
var s = Math.min(Math.sqrt(dx * dx + dy * dy) / r, 1);
if (activeOnPick) activeOnPick(h * 360, s);
}
function dzWireDocumentListeners() {
if (wired) return;
wired = true;
document.addEventListener("mousemove", function (e) { if (dragging) pick(e); });
document.addEventListener("mouseup", function () {
if (dragging) { dragging = false; if (activeOnCommit) activeOnCommit(); }
});
document.addEventListener("touchmove", function (e) { if (dragging) { pick(e); e.preventDefault(); } }, { passive: false });
document.addEventListener("touchend", function () {
if (dragging) { dragging = false; if (activeOnCommit) activeOnCommit(); }
});
document.addEventListener("touchcancel", function () { dragging = false; });
}
function dzAttachColorWheel(canvas, size, onPick, onCommit) {
dzWireDocumentListeners();
activeCanvas = canvas;
activeSize = size;
activeOnPick = onPick;
activeOnCommit = onCommit || null;
canvas.addEventListener("mousedown", function (e) { dragging = true; pick(e); });
canvas.addEventListener("touchstart", function (e) { dragging = true; pick(e); e.preventDefault(); }, { passive: false });
}
function dzReclaimColorWheel(canvas, size, onPick, onCommit) {
activeCanvas = canvas;
activeSize = size;
activeOnPick = onPick;
activeOnCommit = onCommit || null;
}
window.dzDrawColorWheel = dzDrawColorWheel;
window.dzAttachColorWheel = dzAttachColorWheel;
window.dzReclaimColorWheel = dzReclaimColorWheel;
})();
