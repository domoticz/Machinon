(function() {
var BAND_OPACITY = 0.12;
var cache = { idx: null, spec: null };
var applyTimer = null;
function currentLogDeviceIdx() {
var m = location.hash.match(/^#\/Devices\/(\d+)\/Log/);
return m ? m[1] : null;
}
var SENSOR_KEYS = ["temp", "hum", "speed", "rain", "baro", "uvi"];
function axisIndex(key, device) {
return (key === "hum" && device.Temp !== undefined) ? 1 : 0;
}
function parseRanges(device) {
if (!device || !device.Color) return null;
var parsed;
try { parsed = JSON.parse(device.Color); } catch (e) { return null; }
if (Array.isArray(parsed)) {
return parsed.length ? [{ ranges: parsed, axis: 0 }] : null;
}
if (!parsed || typeof parsed !== "object") return null;
var m = location.hash.match(/[?&]sensor=([a-z]+)/i);
var wanted = m ? [m[1].toLowerCase()] : SENSOR_KEYS;
var specs = [];
wanted.forEach(function(key) {
var ranges = parsed[key];
if (Array.isArray(ranges) && ranges.length) {
specs.push({ ranges: ranges, axis: axisIndex(key, device) });
}
});
return specs.length ? specs : null;
}
function deviceCharts(idx) {
return (window.Highcharts && window.Highcharts.charts || [])
.filter(Boolean)
.filter(function(chart) {
return chart.renderTo && chart.renderTo.id.indexOf("chart-" + idx + "-") === 0;
});
}
function setBands(idx, specs) {
deviceCharts(idx).forEach(function(chart) {
var axes = (chart.yAxis || []);
axes.forEach(function(a) {
for (var i = 0; i < 16; i++) { a.removePlotBand("dz-log-band-" + i); }
});
if (!specs) return;
specs.forEach(function(spec) {
var axis = axes[spec.axis];
if (!axis) return;
spec.ranges.forEach(function(band, i) {
axis.addPlotBand({
from: band.from,
to: band.to,
id: "dz-log-band-" + i,
color: window.Highcharts.color(band.color).setOpacity(BAND_OPACITY).get()
});
});
});
});
}
function applyLogPlotBands() {
var idx = currentLogDeviceIdx();
if (idx === null) return;
if (theme.features.log_plot_bands && theme.features.log_plot_bands.enabled !== true) {
setBands(idx, null);
return;
}
if (cache.idx === idx) {
setBands(idx, cache.spec);
return;
}
fetch("json.htm?type=command&param=getdevices&rid=" + idx, { credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(data) {
cache.idx = idx;
cache.spec = parseRanges(data.result && data.result[0]);
setBands(idx, cache.spec);
})
.catch(function() { });
}
new MutationObserver(function() {
if (currentLogDeviceIdx() === null) return;
if (applyTimer) clearTimeout(applyTimer);
applyTimer = setTimeout(applyLogPlotBands, 400);
}).observe(document.getElementById("holder") || document.body, { childList: true, subtree: true });
window.addEventListener("hashchange", function() {
cache.idx = null;
if (currentLogDeviceIdx() !== null) { applyLogPlotBands(); }
});
window.dzApplyLogPlotBands = applyLogPlotBands;
applyLogPlotBands();
})();
