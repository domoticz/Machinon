/* Feature - Bar Ranges as plot bands on the device Log graphs.
   Core stores per-device ranges (the Bar Ranges dialog; they travel in the
   device JSON "Color" field as [{from,to,color},...]) but renders them only
   on the card strip and Dynamic Dashboard stat widgets; upstream declined to
   draw them in the Log charts (domoticz/domoticz#6899). The theme injects
   them itself through Highcharts' runtime addPlotBand API. */

(function() {
    var BAND_OPACITY = 0.12;
    var cache = { idx: null, ranges: null };
    var applyTimer = null;

    function currentLogDeviceIdx() {
        var m = location.hash.match(/^#\/Devices\/(\d+)\/Log/);
        return m ? m[1] : null;
    }

    /* The device "Color" field carries [{from,to,color},...] for bar-range
       devices, but a colour dict for RGBW devices; accept only the array. */
    function parseRanges(device) {
        if (!device || !device.Color) return null;
        var ranges;
        try { ranges = JSON.parse(device.Color); } catch (e) { return null; }
        return Array.isArray(ranges) && ranges.length ? ranges : null;
    }

    function deviceCharts(idx) {
        return (window.Highcharts && window.Highcharts.charts || [])
            .filter(Boolean)
            .filter(function(chart) {
                return chart.renderTo && chart.renderTo.id.indexOf("chart-" + idx + "-") === 0;
            });
    }

    function setBands(idx, ranges) {
        deviceCharts(idx).forEach(function(chart) {
            var axis = chart.yAxis && chart.yAxis[0];
            if (!axis) return;
            for (var i = 0; i < 16; i++) { axis.removePlotBand("dz-log-band-" + i); }
            if (!ranges) return;
            ranges.forEach(function(band, i) {
                /* Highcharts.color() reduces the stored value to a colour; a
                   garbage value yields an invalid colour, never markup. */
                axis.addPlotBand({
                    from: band.from,
                    to: band.to,
                    id: "dz-log-band-" + i,
                    color: window.Highcharts.color(band.color).setOpacity(BAND_OPACITY).get()
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
            setBands(idx, cache.ranges);
            return;
        }
        fetch("json.htm?type=command&param=getdevices&rid=" + idx, { credentials: "include" })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                cache.idx = idx;
                cache.ranges = parseRanges(data.result && data.result[0]);
                setBands(idx, cache.ranges);
            })
            .catch(function() { /* no bands is a fine fallback */ });
    }

    /* Charts are rebuilt (new Highcharts objects) on route entry, on the
       range-selector buttons (1h/3h/day/1w) and on auto-refresh, so re-apply
       whenever the Log page's DOM settles. The observer is cheap: it bails
       immediately off Log routes, and the ranges are cached per device. */
    new MutationObserver(function() {
        if (currentLogDeviceIdx() === null) return;
        if (applyTimer) clearTimeout(applyTimer);
        applyTimer = setTimeout(applyLogPlotBands, 400);
    }).observe(document.getElementById("holder") || document.body, { childList: true, subtree: true });

    /* Do not assign window.onhashchange: the theme's router owns it. */
    window.addEventListener("hashchange", function() {
        cache.idx = null;
        if (currentLogDeviceIdx() !== null) { applyLogPlotBands(); }
    });

    /* Settings panel hook: immediate feedback when the feature is toggled
       while a Log page is open (same pattern as hide_logo/setLogo). */
    window.dzApplyLogPlotBands = applyLogPlotBands;

    applyLogPlotBands();
})();
