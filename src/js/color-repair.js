var DZ_REPAIR_TARGET_STATUS = 4.0;
var DZ_REPAIR_TARGET_IDENTITY = 3.2;
var DZ_REPAIR_TARGET_TILE = 3.0;
var DZ_REPAIR_TILE_MIX = 0.15;
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
if (!cands.length) { return startHex; }
cands.sort(function (a, b) { return dzHexToOklch(b).C - dzHexToOklch(a).C; });
return cands[0];
}
function dzRepairAgainstSurface(startHex, surfaceHex, target) {
if (!startHex || !surfaceHex) { return startHex; }
return dzRepairSolve(startHex, function () { return surfaceHex; }, target);
}
function dzRepairAgainstTile(startHex, menuHex, target) {
if (!startHex || !menuHex) { return startHex; }
return dzRepairSolve(startHex, function (c) {
return dzRepairMix(c, menuHex, DZ_REPAIR_TILE_MIX);
}, target);
}
