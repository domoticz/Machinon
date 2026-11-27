import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* src/js/chart-export.js styles Highcharts' downloads (PNG/JPEG/PDF/SVG)
   from the theme's chart tokens. A plain browser script, so the SHIPPING
   file runs in a vm context against a fake Highcharts and its globals are
   read back. */

const TOKENS = {
    "--dz-widget-bg": "#ffffff",
    "--secondary-text-color": "#3d5a73",
    "--dz-body-bg": "#f4f8fc",
    "--dz-body-text": "#1b2b3a",
    "--dz-text-md": "1rem"
};
const FONT = "Inter, system-ui, sans-serif";

/* Deep merge with Highcharts' semantics for what the module relies on:
   later arguments win, plain objects merge, arrays replace. */
function merge(...objs) {
    const out = {};
    for (const o of objs) {
        if (!o) continue;
        for (const k of Object.keys(o)) {
            const v = o[k];
            out[k] = v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k])
                ? merge(out[k], v) : v;
        }
    }
    return out;
}

function wrap(obj, name, fn) {
    const proceed = obj[name];
    obj[name] = function (...args) { return fn.call(this, proceed, ...args); };
}

/* modern: Highcharts 12.3+ (Exporting class, `this` is chart.exporting);
   legacy: 12.1.2 as shipped by Domoticz 2026.1 (method on Chart.prototype). */
function fakeHighcharts(shape) {
    const calls = [];
    function Chart(axes) { this.xAxis = new Array(axes.x).fill({}); this.yAxis = new Array(axes.y).fill({}); }
    const H = { merge, wrap, Chart, calls };
    const record = function (options, chartOptions) { calls.push({ self: this, options, chartOptions }); return "<svg/>"; };
    if (shape === "modern") {
        function Exporting(chart) { this.chart = chart; }
        Exporting.prototype.getSVGForExport = record;
        H.Exporting = Exporting;
    } else {
        Chart.prototype.getSVGForExport = record;
    }
    return H;
}

function load(H, tokens) {
    const t = Object.assign({}, TOKENS, tokens || {});
    const style = { getPropertyValue: (n) => (n in t ? "  " + t[n] + " " : "") };
    const ctx = vm.createContext({
        Highcharts: H,
        document: { documentElement: {}, body: {} },
        getComputedStyle: (el) => (el === ctx.document.body ? { fontFamily: FONT } : style)
    });
    vm.runInContext(readFileSync("src/js/chart-export.js", "utf8"), ctx, { filename: "src/js/chart-export.js" });
    return ctx;
}

test("the export options mirror the on-screen chart tokens", () => {
    const H = fakeHighcharts("modern");
    const dz = load(H);
    const o = dz.dzChartExportOptions({ xAxis: [{}], yAxis: [{}, {}] });
    assert.equal(o.chart.backgroundColor, "#ffffff");
    assert.equal(o.chart.style.fontFamily, FONT);
    assert.equal(o.title.style.color, "#1b2b3a");
    assert.equal(o.title.style.fontSize, "1rem");
    assert.equal(o.legend.backgroundColor, "#f4f8fc");
    assert.equal(o.legend.itemStyle.color, "#3d5a73");
    assert.equal(o.noData.style.color, "#3d5a73");
    assert.equal(o.xAxis.length, 1);
    assert.equal(o.yAxis.length, 2, "every y axis is styled, not only the first");
    for (const a of o.yAxis) {
        assert.equal(a.labels.style.color, "#3d5a73");
        assert.equal(a.title.style.color, "#3d5a73");
        assert.equal(a.gridLineColor, "#f4f8fc");
        assert.equal(a.tickWidth, 0);
    }
    assert.equal(o.xAxis[0].tickColor, "#f4f8fc");
    assert.equal(o.plotOptions.series.dataLabels.style.textOutline, "none");
    assert.equal(o.plotOptions.series.dataLabels.style.color, "#3d5a73");
});

test("data labels are recoloured per series type, which outranks plotOptions.series", () => {
    const H = fakeHighcharts("modern");
    const dz = load(H);
    const o = dz.dzChartExportOptions({ xAxis: [{}], yAxis: [{}], series: [{ type: "column" }, { type: "spline" }, {}] });
    for (const t of ["series", "column", "spline"]) {
        assert.equal(o.plotOptions[t].borderWidth, 0, t);
        assert.equal(o.plotOptions[t].dataLabels.color, "#3d5a73", t);
        assert.equal(o.plotOptions[t].dataLabels.style.textOutline, "none", t);
    }
    assert.equal(Object.keys(o.plotOptions).sort().join(","), "column,series,spline");
    assert.equal("text" in o.title, false, "the title TEXT stays core's");
});

test("a missing token leaves that option to Highcharts instead of writing an empty colour", () => {
    const H = fakeHighcharts("modern");
    const dz = load(H, { "--dz-widget-bg": "" });
    const o = dz.dzChartExportOptions({ xAxis: [{}], yAxis: [{}] });
    assert.equal("backgroundColor" in o.chart, false);
});

for (const shape of ["modern", "legacy"]) {
    test(`the hook themes every download (${shape} Highcharts)`, () => {
        const H = fakeHighcharts(shape);
        const dz = load(H);
        const chart = new H.Chart({ x: 1, y: 2 });
        const target = shape === "modern" ? new H.Exporting(chart) : chart;
        target.getSVGForExport({ type: "image/png" }, { title: { text: "Temperature Last 24 Hours" } });
        assert.equal(H.calls.length, 1);
        const call = H.calls[0];
        assert.equal(call.self, target, "the original runs on its own receiver");
        assert.deepEqual(call.options, { type: "image/png" });
        assert.equal(call.chartOptions.title.text, "Temperature Last 24 Hours", "the caller's options win");
        assert.equal(call.chartOptions.chart.backgroundColor, "#ffffff");
        assert.equal(call.chartOptions.yAxis.length, 2);
        assert.equal(dz.dzChartExportHooked(), true);
    });
}

test("tokens are read at download time, so a scheme switch reaches the next download", () => {
    const H = fakeHighcharts("modern");
    const t = Object.assign({}, TOKENS);
    const style = { getPropertyValue: (n) => t[n] || "" };
    const ctx = vm.createContext({
        Highcharts: H,
        document: { documentElement: {}, body: {} },
        getComputedStyle: (el) => (el === ctx.document.body ? { fontFamily: FONT } : style)
    });
    vm.runInContext(readFileSync("src/js/chart-export.js", "utf8"), ctx);
    const exp = new H.Exporting(new H.Chart({ x: 1, y: 1 }));
    exp.getSVGForExport({}, undefined);
    t["--dz-widget-bg"] = "#18202b";
    exp.getSVGForExport({}, undefined);
    assert.equal(H.calls[0].chartOptions.chart.backgroundColor, "#ffffff");
    assert.equal(H.calls[1].chartOptions.chart.backgroundColor, "#18202b");
});

test("loading twice does not stack the hook", () => {
    const H = fakeHighcharts("modern");
    load(H);
    const src = readFileSync("src/js/chart-export.js", "utf8");
    const ctx2 = vm.createContext({ Highcharts: H, document: { documentElement: {}, body: {} }, getComputedStyle: () => ({ getPropertyValue: () => "", fontFamily: "" }) });
    vm.runInContext(src, ctx2);
    new H.Exporting(new H.Chart({ x: 1, y: 1 })).getSVGForExport({}, {});
    assert.equal(H.calls.length, 1);
});

test("no Highcharts, or one without an exporter, is a no-op", () => {
    const none = vm.createContext({ document: {}, getComputedStyle: () => ({}) });
    vm.runInContext(readFileSync("src/js/chart-export.js", "utf8"), none);
    assert.equal(none.dzChartExportHooked(), false);
    const bare = { merge, wrap, Chart: function () {} };
    const ctx = vm.createContext({ Highcharts: bare, document: {}, getComputedStyle: () => ({}) });
    vm.runInContext(readFileSync("src/js/chart-export.js", "utf8"), ctx);
    assert.equal(ctx.dzChartExportHooked(), false);
});
