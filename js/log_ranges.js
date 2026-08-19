/* Feature - Bar Ranges as plot bands on the device Log graphs.
   Core stores per-device ranges (the Bar Ranges dialog) in the device JSON
   "Color" field but renders them only on the card strip and Dynamic Dashboard
   stat widgets; upstream declined to draw them in the Log charts
   (domoticz/domoticz#6899). The theme injects them itself through Highcharts'
   runtime addPlotBand API.

   Color carries TWO shapes, which is what decides both the ranges and the axis:
     - utility devices: a flat array, [{from,to,color},...]
     - temp / humidity / weather devices: a dict keyed by sensor,
       {"temp":[...]}, {"hum":[...]}, {"speed":[...]}, {"baro":[...]},
       {"rain":[...]}, {"uvi":[...]}
   Accepting only the array is what left every Temp and Weather device without
   bands. RGBW devices also use the Color field, for a colour dict, so a dict is
   only ranges when the key we want holds an array. */

(function() {
    var BAND_OPACITY = 0.12;
    /* Keyed by idx only: the sensor a page charts rides on the hash, and the
       hashchange handler below drops the cache, so a ?sensor= switch re-reads. */
    var cache = { idx: null, spec: null };
    var applyTimer = null;

    function currentLogDeviceIdx() {
        var m = location.hash.match(/^#\/Devices\/(\d+)\/Log/);
        return m ? m[1] : null;
    }

    var SENSOR_KEYS = ["temp", "hum", "speed", "rain", "baro", "uvi"];

    /* Which y-axis carries a given sensor. Measured against the live charts, not
       read off a series name or axis title, because those are translated: core
       builds its temp charts with degrees on yAxis[0] and humidity on yAxis[1],
       and every other family charts its sensor on yAxis[0] - a humidity-ONLY
       device included, which is why this asks the device rather than assuming
       humidity is always second. An index that does not exist on a given chart
       (a temp device's compare chart has no humidity axis) is skipped, not
       banded onto the wrong axis. */
    function axisIndex(key, device) {
        return (key === "hum" && device.Temp !== undefined) ? 1 : 0;
    }

    /* Every sensor the device has ranges for, each with the axis it belongs on.
       Deliberately NOT a single "which sensor is this device" guess: core itself
       answers that differently per page (a Temp+Hum+Baro device gets dz-temp-bar
       on #/Temperature and dz-weather-bar on #/Weather, so 'temp' on one and
       'baro' on the other), and a Log page has no such context to go on. Banding
       each configured sensor on its own axis needs no guess at all.
       Core's own Log links do carry ?sensor= (a wind device's link from the
       Temperature page passes sensor=temp for its chill chart); when present it
       narrows the set to that one sensor. */
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

    /* Clearing walks every axis, not just the targeted ones: the sensor a Log
       page charts can change under us (the ?sensor= links), and bands left on an
       axis we no longer target would never be removed. Band ids are only unique
       within an axis, which is all removePlotBand needs. */
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
