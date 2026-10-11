function dzMiniEl(tag, style, text) {
var node = document.createElement(tag);
if (style) node.setAttribute("style", style);
if (text !== undefined && text !== null) node.textContent = text;
return node;
}
function dzMiniBox(style) {
var box = dzMiniEl("div", style || "");
box.className = "dz-hub-mini";
return box;
}
function dzSvg(tag, attrs) {
var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
return node;
}
var DZ_SKETCH_INK = "#8a9099";
function dzMiniCard(extra) {
return dzMiniEl("div",
"background:var(--dz-widget-bg);border:1px solid var(--dz-input-border);" +
"border-radius:6px;" + (extra || ""));
}
function dzPreviewCardToggle() {
var box = dzMiniBox("display:flex;align-items:center;justify-content:center;padding:6px;");
var card = dzMiniCard("width:100%;padding:6px;display:flex;align-items:center;justify-content:space-between;gap:6px;");
var label = dzMiniEl("span",
"flex:1 1 auto;height:6px;border-radius:3px;" +
"background:color-mix(in srgb, var(--dz-body-text) 30%, transparent);");
var track = dzMiniEl("span",
"position:relative;flex:0 0 auto;width:20px;height:12px;border-radius:6px;" +
"background:var(--dz-accent-color);");
track.setAttribute("data-token-probe", "accent");
var knob = dzMiniEl("span",
"position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;background:#fff;");
track.appendChild(knob);
card.appendChild(label);
card.appendChild(track);
box.appendChild(card);
return box;
}
function dzPreviewCardDim() {
var box = dzMiniBox("display:flex;align-items:center;gap:6px;padding:6px;");
var on = dzMiniCard("flex:1 1 0;height:26px;");
var off = dzMiniCard("flex:1 1 0;height:26px;opacity:0.4;");
box.appendChild(on);
box.appendChild(off);
return box;
}
function dzPreviewCardLastseen() {
var box = dzMiniBox("display:flex;align-items:center;justify-content:center;padding:6px;");
var card = dzMiniCard("width:100%;padding:6px;display:flex;flex-direction:column;gap:5px;");
var value = dzMiniEl("span",
"width:60%;height:7px;border-radius:3px;background:var(--dz-accent-color);");
var seen = dzMiniEl("span",
"width:85%;height:5px;border-radius:2px;" +
"background:color-mix(in srgb, var(--dz-body-text) 35%, transparent);");
card.appendChild(value);
card.appendChild(seen);
box.appendChild(card);
return box;
}
function dzPreviewNavbarStrip() {
var box = dzMiniBox("padding:0;");
var bar = dzMiniEl("div",
"background:var(--dz-nav-bg);border:1px solid var(--dz-input-border);border-radius:6px;" +
"height:100%;display:flex;align-items:center;justify-content:space-around;padding:6px 4px;");
for (var i = 0; i < 3; i++) {
var item = dzMiniEl("div", "display:flex;flex-direction:column;align-items:center;gap:3px;");
var icon = dzMiniEl("span", "width:8px;height:8px;border-radius:2px;background:var(--dz-accent-color);");
var text = dzMiniEl("span",
"width:12px;height:3px;border-radius:2px;" +
"background:color-mix(in srgb, var(--dz-body-text) 45%, transparent);");
item.appendChild(icon);
item.appendChild(text);
bar.appendChild(item);
}
box.appendChild(bar);
return box;
}
function dzPreviewMenuTilegrid() {
var box = dzMiniBox("background:var(--dz-body-bg);padding:6px;" +
"display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;");
for (var i = 0; i < 4; i++) {
box.appendChild(dzMiniCard("border-radius:4px;"));
}
return box;
}
function dzPreviewDashColumns() {
var box = dzMiniBox("background:var(--dz-body-bg);padding:6px;display:flex;gap:5px;");
for (var c = 0; c < 2; c++) {
var col = dzMiniEl("div", "flex:1 1 0;display:flex;flex-direction:column;gap:4px;");
col.appendChild(dzMiniCard("height:12px;border-radius:3px;"));
col.appendChild(dzMiniCard("height:12px;border-radius:3px;"));
box.appendChild(col);
}
return box;
}
function dzPreviewDialogCenter() {
var box = dzMiniBox("background:var(--dz-body-bg);padding:0;position:relative;");
var frame = dzMiniEl("div", "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;");
var dialog = dzMiniEl("div",
"width:52%;height:46%;border-radius:4px;background:var(--dz-modal-bg);" +
"border:1px solid var(--dz-input-border);box-shadow:0 1px 3px rgba(0,0,0,.25);");
frame.appendChild(dialog);
box.appendChild(frame);
return box;
}
function dzSketchRgbwPopup() {
var box = dzMiniBox("background:var(--dz-body-bg);padding:0;position:relative;");
var frame = dzMiniEl("div", "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;");
var dialog = dzMiniEl("div",
"width:46%;height:72%;border-radius:4px;background:var(--dz-modal-bg);" +
"border:1px solid var(--dz-input-border);display:flex;flex-direction:column;" +
"align-items:center;justify-content:center;gap:4px;");
var wheel = dzMiniEl("div",
"width:45%;aspect-ratio:1;border-radius:50%;" +
"background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red);");
var bar = dzMiniEl("div",
"width:70%;height:3px;border-radius:2px;background:rgba(var(--dz-accent-values),0.5);");
dialog.appendChild(wheel); dialog.appendChild(bar);
frame.appendChild(dialog); box.appendChild(frame);
return box;
}
function dzPreviewCardWidth() {
var box = dzMiniBox("padding:6px;display:flex;flex-direction:column;gap:5px;justify-content:center;");
var grid = dzMiniEl("div", "display:flex;gap:4px;");
grid.appendChild(dzMiniCard("flex:0 0 22px;height:18px;"));
grid.appendChild(dzMiniCard("flex:0 0 22px;height:18px;"));
grid.appendChild(dzMiniCard("flex:1 1 auto;height:18px;opacity:0.5;"));
var caliper = dzMiniEl("div",
"height:3px;border-radius:2px;background:var(--dz-accent-color);");
box.appendChild(grid);
box.appendChild(caliper);
return box;
}
function dzPreviewChartBands() {
var box = dzMiniBox("padding:6px;position:relative;background:var(--dz-widget-bg);" +
"border:1px solid var(--dz-input-border);");
var band = dzMiniEl("div",
"position:absolute;left:6px;right:6px;top:38%;height:26%;border-radius:2px;" +
"background:rgba(var(--dz-accent-values), 0.22);");
band.setAttribute("data-token-probe", "band");
var svg = dzSvg("svg", { viewBox: "0 0 88 40", width: "100%", height: "100%",
preserveAspectRatio: "none", style: "position:relative;display:block;" });
var line = dzSvg("polyline", {
points: "2,30 20,20 36,26 54,10 72,16 86,6",
fill: "none", stroke: "var(--dz-accent-color)", "stroke-width": "2",
"stroke-linecap": "round", "stroke-linejoin": "round"
});
svg.appendChild(line);
box.appendChild(band);
box.appendChild(svg);
return box;
}
function dzSketchBox() {
var box = dzMiniBox("display:flex;align-items:center;justify-content:center;padding:4px;");
box.classList.add("dz-hub-sketch");
var svg = dzSvg("svg", { viewBox: "0 0 88 52", width: "100%", height: "100%",
fill: "none", stroke: DZ_SKETCH_INK, "stroke-width": "2",
"stroke-linecap": "round", "stroke-linejoin": "round" });
box.appendChild(svg);
return { box: box, svg: svg };
}
function dzSketchStandby() {
var s = dzSketchBox();
s.svg.appendChild(dzSvg("rect", { x: "16", y: "12", width: "56", height: "34", rx: "3" }));
s.svg.appendChild(dzSvg("line", { x1: "36", y1: "46", x2: "52", y2: "46" }));
s.svg.appendChild(dzSvg("path", { d: "M50 21a9 9 0 1 0 0 16 11 11 0 0 1 0-16z", fill: DZ_SKETCH_INK, stroke: "none" }));
return s.box;
}
function dzSketchUpdate() {
var s = dzSketchBox();
s.svg.appendChild(dzSvg("rect", { x: "12", y: "18", width: "64", height: "16", rx: "3" }));
s.svg.appendChild(dzSvg("line", { x1: "20", y1: "26", x2: "30", y2: "26" }));
s.svg.appendChild(dzSvg("line", { x1: "38", y1: "26", x2: "48", y2: "26" }));
s.svg.appendChild(dzSvg("circle", { cx: "72", cy: "16", r: "6", fill: DZ_SKETCH_INK, stroke: "none" }));
return s.box;
}
function dzSketchNotification() {
var s = dzSketchBox();
s.svg.appendChild(dzSvg("path", { d: "M32 34c0-12 4-18 12-18s12 6 12 18c0 3 3 5 3 5H29s3-2 3-5z" }));
s.svg.appendChild(dzSvg("path", { d: "M40 41a4 4 0 0 0 8 0" }));
s.svg.appendChild(dzSvg("line", { x1: "44", y1: "12", x2: "44", y2: "16" }));
s.svg.appendChild(dzSvg("circle", { cx: "58", cy: "18", r: "6", fill: DZ_SKETCH_INK, stroke: "none" }));
return s.box;
}
function dzSketchFloorplanDetails() {
var box = dzMiniBox("display:flex;align-items:center;justify-content:center;padding:6px;");
var card = dzMiniCard("width:100%;padding:6px;display:flex;flex-direction:column;gap:5px;");
var value = dzMiniEl("span",
"width:55%;height:7px;border-radius:3px;background:var(--dz-accent-color);");
var chevron = dzMiniEl("span",
"align-self:flex-end;width:9px;height:9px;border-right:2px solid var(--dz-accent-color);" +
"border-bottom:2px solid var(--dz-accent-color);transform:rotate(-135deg);");
card.appendChild(value);
card.appendChild(chevron);
box.appendChild(card);
return box;
}
var DZ_HUB_PREVIEWS = {
"card-toggle": dzPreviewCardToggle,
"card-dim": dzPreviewCardDim,
"card-lastseen": dzPreviewCardLastseen,
"navbar-strip": dzPreviewNavbarStrip,
"menu-tilegrid": dzPreviewMenuTilegrid,
"dash-columns": dzPreviewDashColumns,
"dialog-center": dzPreviewDialogCenter,
"sketch-rgbw-popup": dzSketchRgbwPopup,
"card-width": dzPreviewCardWidth,
"chart-bands": dzPreviewChartBands,
"sketch-standby": dzSketchStandby,
"sketch-update": dzSketchUpdate,
"sketch-notification": dzSketchNotification,
"sketch-floorplan-details": dzSketchFloorplanDetails
};
function dzRenderPreview(previewId, entry) {
if (!previewId) return null;
var builder = DZ_HUB_PREVIEWS[previewId];
if (typeof builder !== "function") {
console.warn("machinon_theme_hub", "preview_missing", "no builder for previewId '" + previewId + "'");
return null;
}
return builder(entry);
}
