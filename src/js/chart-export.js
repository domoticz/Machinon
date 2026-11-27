/* Chart downloads (PNG, JPEG, PDF, SVG) in the theme's colours.

   css/charts.css styles the chart on screen, but a download is a fresh
   Highcharts render from the chart's OPTIONS, which never sees page CSS. Left
   alone it falls back to core's global brand-dark Highcharts theme, the same
   dark gradient on every scheme. So the export gets the same tokens
   css/charts.css paints with, passed as export chartOptions: card background,
   chart text, page-background grid and legend box, body-text title.

   Every format goes through getSVGForExport, so that is the one hook. Where it
   lives depends on the Highcharts core ships: 12.3+ has an Exporting class
   (`this` is chart.exporting), 12.1.2 in Domoticz 2026.1 puts it on
   Chart.prototype (`this` is the chart). Print is not routed through it and
   needs nothing: it prints the on-screen chart, page CSS included.

   Tokens are read on every download, not once: a scheme switch with the page
   open must reach the next download. The caller's chartOptions are merged
   last, so core's per-chart export title text wins; this file only sets
   styles, never text. */

function dzChartExportToken(style, name) {
    return String(style.getPropertyValue(name) || "").trim();
}

/* Assign only a non-empty value: an empty colour would override Highcharts'
   own default with nothing, which is worse than no theming. */
function dzChartExportSet(target, key, value) {
    if (value) target[key] = value;
    return target;
}

/* Point and data-label styling as css/charts.css forces it on screen with
   !important: labels in the chart text colour without Highcharts' text
   outline, and no point border (`.highcharts-point { stroke-width: 0 }`;
   brand-dark draws a white one around every bar). Core colours the Report
   bars' labels white under the TYPE's plotOptions (column), which outranks
   plotOptions.series, so the override is written for every type the chart
   draws as well as for series. */
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
        /* css/charts.css hides the y-axis ticks on screen. */
        if (hideTicks) a.tickWidth = 0;
        return a;
    }
    /* One entry per axis: an object instead of an array reaches only the
       first axis, and a second y axis (Humidity % next to Degrees) keeps
       core's white labels, invisible on a light card. */
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
    /* The flag sits on the shared prototype, so a second load of this file
       (a theme reload without a page reload) does not wrap twice. */
    if (!proto || proto.dzChartExportThemed) return;
    H.wrap(proto, "getSVGForExport", function(proceed, options, chartOptions) {
        var chart = this.chart || this;
        return proceed.call(this, options, H.merge(dzChartExportOptions(chart), chartOptions || {}));
    });
    proto.dzChartExportThemed = true;
})();
