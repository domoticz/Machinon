function dzChartExportToken(style, name) {
return String(style.getPropertyValue(name) || "").trim();
}
function dzChartExportSet(target, key, value) {
if (value) target[key] = value;
return target;
}
function dzChartExportPlot(chart, text) {
var labels = { style: dzChartExportSet({ textOutline: "none" }, "color", text) };
dzChartExportSet(labels, "color", text);
var plot = { series: { borderWidth: 0, dataLabels: labels } };
var list = (chart && chart.series) || [];
for (var i = 0; i < list.length; i++) {
var type = list[i] && list[i].type;
if (type) plot[type] = { borderWidth: 0, dataLabels: labels };
}
return plot;
}
function dzChartExportOptions(chart) {
var style = getComputedStyle(document.documentElement);
var bg = dzChartExportToken(style, "--dz-widget-bg");
var text = dzChartExportToken(style, "--secondary-text-color");
var grid = dzChartExportToken(style, "--dz-body-bg");
var heading = dzChartExportToken(style, "--dz-body-text");
var titleSize = dzChartExportToken(style, "--dz-text-md");
var font = String(getComputedStyle(document.body).fontFamily || "");
function axis(hideTicks) {
var a = { labels: { style: dzChartExportSet({}, "color", text) }, title: { style: dzChartExportSet({}, "color", text) } };
dzChartExportSet(a, "gridLineColor", grid);
dzChartExportSet(a, "lineColor", grid);
dzChartExportSet(a, "tickColor", grid);
if (hideTicks) a.tickWidth = 0;
return a;
}
function axes(list, hideTicks) {
var out = [];
for (var i = 0; i < (list ? list.length : 0); i++) out.push(axis(hideTicks));
return out;
}
var titleStyle = dzChartExportSet({ fontWeight: "600" }, "color", heading);
dzChartExportSet(titleStyle, "fontSize", titleSize);
var legend = { itemStyle: dzChartExportSet({ fontWeight: "normal" }, "color", text), itemHoverStyle: dzChartExportSet({}, "color", heading) };
dzChartExportSet(legend, "backgroundColor", grid);
return {
chart: dzChartExportSet({ plotBackgroundColor: "transparent", style: dzChartExportSet({}, "fontFamily", font) }, "backgroundColor", bg),
title: { style: titleStyle },
xAxis: axes(chart && chart.xAxis, false),
yAxis: axes(chart && chart.yAxis, true),
legend: legend,
plotOptions: dzChartExportPlot(chart, text),
noData: { style: dzChartExportSet({}, "color", text) },
credits: { style: dzChartExportSet({}, "color", text) }
};
}
function dzChartExportProto(H) {
if (H.Exporting && H.Exporting.prototype && typeof H.Exporting.prototype.getSVGForExport === "function") return H.Exporting.prototype;
if (H.Chart && H.Chart.prototype && typeof H.Chart.prototype.getSVGForExport === "function") return H.Chart.prototype;
return null;
}
function dzChartExportHooked() {
var H = typeof Highcharts !== "undefined" ? Highcharts : null;
var proto = H ? dzChartExportProto(H) : null;
return !!(proto && proto.dzChartExportThemed);
}
(function dzHookChartExport() {
var H = typeof Highcharts !== "undefined" ? Highcharts : null;
if (!H || typeof H.wrap !== "function" || typeof H.merge !== "function") return;
var proto = dzChartExportProto(H);
if (!proto || proto.dzChartExportThemed) return;
H.wrap(proto, "getSVGForExport", function(proceed, options, chartOptions) {
var chart = this.chart || this;
return proceed.call(this, options, H.merge(dzChartExportOptions(chart), chartOptions || {}));
});
proto.dzChartExportThemed = true;
})();
