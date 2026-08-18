/* Machinon colour popup (feature: rgbw_popup). Wraps core's ShowRGBWPopup;
   the Machinon modal lives in its own #mk-rgbw-popup div, core's #rgbw_popup
   markup is never touched so delegation to the original always works.
   Custom w/ww subtypes (RGBWZ, RGBWWZ) open the Machinon popup too, on the
   same Colour/White tabs as RGBW/RGBWW; the Colour pane also grows a
   white-mix slider for these (core's m:4 mode, see buildColorJSON).
   Delegates to core for: DimmerType "rel", or any drift-guard failure
   (core signature changed -> never hook, zero risk). */
(function () {
    "use strict";
    if (typeof window.ShowRGBWPopup !== "function" ||
        window.ShowRGBWPopup.length !== 8 ||           /* (event, idx, Protected, MaxDimLevel, LevelInt, color, SubType, DimmerType) */
        typeof window.HandleProtection !== "function" ||
        typeof window.getLEDType !== "function" ||
        typeof window.SwitchLightPopup !== "function") {
        return; /* upstream drifted: leave core's popup alone */
    }
    if (window.ShowRGBWPopup._mkHooked) return;

    var orig = window.ShowRGBWPopup;

    window.ShowRGBWPopup = function (event, idx, Protected, MaxDimLevel, LevelInt, color, SubType, DimmerType) {
        var led = window.getLEDType(SubType || "");
        if (DimmerType && DimmerType === "rel") {
            return orig.apply(this, arguments);
        }
        /* Title = the clicked card's own name (owner revision 2026-08-18):
           resolved from the DOM at click time, zero network. No card found
           (e.g. a stubbed/programmatic call) falls back to the Color/White
           label in openPopup. */
        var card = event && event.target && event.target.closest ? event.target.closest(".item") : null;
        var nameEl = card ? card.querySelector(".item-name, #name") : null;
        window.HandleProtection(Protected, function () {
            openPopup({ idx: idx, led: led, maxDim: MaxDimLevel, levelInt: LevelInt, colorJSON: color, protected: Protected, event: event, name: nameEl ? nameEl.textContent.trim() : "" });
        });
    };
    window.ShowRGBWPopup._mkHooked = true;

    var state = { idx: null, led: null, mode: "color", h: 0, s: 1, warmth: 0.5, bright: 100, maxDim: 100, protected: null, mix: 0 };
    var openerEl = null;
    var docListenerTimer = null;

    function el(tag, cls, parent) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (parent) parent.appendChild(n);
        return n;
    }

    function ensureDom() {
        if (document.getElementById("mk-rgbw-popup")) return;
        var scrim = el("div", null, document.body);
        scrim.id = "mk-rgbw-scrim";
        scrim.addEventListener("click", closePopup);
        var pop = el("div", null, document.body);
        pop.id = "mk-rgbw-popup";
        pop.setAttribute("role", "dialog");
        pop.setAttribute("aria-modal", "true");
        pop.setAttribute("aria-labelledby", "mk-rgbw-title");
        var head = el("div", "mk-rgbw-head", pop);
        var title = el("span", null, head);
        title.id = "mk-rgbw-title";
        var close = el("div", "ui-close", head);
        close.setAttribute("role", "button");
        close.setAttribute("tabindex", "0");
        close.setAttribute("aria-label", $.t("Close"));
        close.addEventListener("click", closePopup);
        close.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") closePopup(); });
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
        state.idx = String(args.idx);
        state.led = args.led;
        state.maxDim = parseInt(args.maxDim, 10) || 100;
        state.protected = args.protected;
        state.bright = Math.max(1, Math.min(100, Math.round(((parseInt(args.levelInt, 10) || 0) / state.maxDim) * 99) + 1));
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
            /* Clamp stays in viewport space (matches ev.clientX/Y), then the
               scroll offset is added so the written coordinates are page
               coordinates: position is absolute (see rgbw-popup.css), so the
               popup scrolls with the content like core's own #rgbw_popup. */
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
        var c = document.querySelector("#mk-rgbw-popup .ui-close");
        if (c) c.focus();
    }

    function closePopup() {
        var pop = document.getElementById("mk-rgbw-popup");
        if (!pop) return;
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
        state.mode = (col.m === 1 || col.m === 2) ? "white" : "color";
        if (col.r !== undefined || col.g !== undefined || col.b !== undefined) {
            var hsv = rgbToHsv(col.r || 0, col.g || 0, col.b || 0);
            state.h = hsv.h; state.s = hsv.s;
        }
        state.warmth = col.t !== undefined ? col.t / 255 : 0.5;
        /* Reset on every seed (not just when col.m === 4): a leftover mix
           from a previously opened device must never leak into the next
           one's Colour pane. The channel read must branch the same way the
           send side does (buildColorJSON): bHasTemperature devices split
           mix across cw+ww (cw=mix*(1-warmth)*255, ww=mix*warmth*255, they
           sum to mix*255, so a plain sum reads them back correctly).
           bHasCustom-without-temperature devices (RGBWZ) are asymmetric on
           the wire: OUR OWN sends set cw=ww=mix*255 (both channels carry
           the full value), but the DEVICE's own state echo only carries it
           in ww, reporting cw:0 (confirmed via MQTT capture on real
           hardware); reading cw alone missed a genuinely mixed lamp
           entirely (0%), and reading cw+ww double-counted our own sends.
           max(cw,ww) inverts both conventions correctly, since at least
           one of the two channels always holds the true mix value here.
           state.led is already set by openPopup before this call runs. */
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
                /* White-mix slider (m:4 custom subtypes only, RGBWZ/RGBWWZ):
                   core parity, core offers customw/customww only there.
                   Flanked by end chips (left: live picked colour, right:
                   fixed white) so the row stays legible even when the
                   gradient itself goes near-white (field finding). */
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
                    scheduleSend();
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
                scheduleSend();
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
        var brMin = el("span", "mk-rgbw-scale", br);
        brMin.textContent = "0%";
        var slider = el("input", null, br);
        slider.id = "mk-rgbw-bright";
        slider.type = "range"; slider.min = 0; slider.max = 100; slider.value = state.bright;
        slider.setAttribute("aria-label", $.t("Brightness"));
        var brMax = el("span", "mk-rgbw-scale", br);
        brMax.textContent = "100%";
        var brVal = el("span", null, br);
        brVal.id = "mk-rgbw-bright-value";
        brVal.textContent = state.bright + "%";
        paintRangeFill(slider);
        slider.addEventListener("input", function () {
            /* Card-slider consistency (owner revision 2026-08-18): the
               brightness slider ranges 0-100 and 0 means Off, exactly like
               the theme's card dimmer sliders. */
            var v = parseInt(this.value, 10) || 0;
            paintRangeFill(this);
            if (v >= 1) {
                state.bright = v;
                brVal.textContent = state.bright + "%";
                scheduleSend();
            } else {
                /* Passing through 0 mid-drag sends nothing: reflect 0 in the
                   readout, but leave state.bright at its last >=1 value
                   (floor 1) so the other controls keep sending a valid
                   brightness, and cancel any send queued moments ago so a
                   stale >=1 update never fires while the user drags to Off. */
                brVal.textContent = "0%";
                cancelPendingSend();
            }
        });
        slider.addEventListener("change", function () {
            if ((parseInt(this.value, 10) || 0) === 0) {
                /* Releasing at 0 sends Off via the protected path, like the
                   card dimmer sliders; the popup stays open so the user can
                   drag back up to turn the lamp on again. */
                window.SwitchLightPopup(state.idx, "Off", state.protected);
            } else {
                flushSend();
            }
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
        /* Live-send model: switching the mode applies it (an RGBW White tab
           has no further control to act on). */
        scheduleSend(); flushSend();
    }

    /* Pure HSV<->RGB math (textbook formulas; own implementation, no code
       taken from any other theme). h,s,v in 0..1; r,g,b in 0..255. */
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

    var WHEEL = 210, WR = WHEEL / 2, wheelImage = null;

    function drawWheelBase(ctx) {
        if (!wheelImage) {
            var img = ctx.createImageData(WHEEL, WHEEL);
            var d = img.data;
            for (var y = 0; y < WHEEL; y++) {
                for (var x = 0; x < WHEEL; x++) {
                    var dx = x - WR, dy = y - WR, dist = Math.sqrt(dx * dx + dy * dy);
                    var i4 = (y * WHEEL + x) * 4;
                    if (dist > WR) { d[i4 + 3] = 0; continue; }
                    var hue = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1;
                    var rgb = hsvToRgb(hue, Math.min(dist / WR, 1), 1);
                    d[i4] = rgb.r; d[i4 + 1] = rgb.g; d[i4 + 2] = rgb.b; d[i4 + 3] = 255;
                }
            }
            wheelImage = img;
        }
        ctx.putImageData(wheelImage, 0, 0);
    }

    function drawWheel(canvas) {
        var ctx = canvas.getContext("2d");
        drawWheelBase(ctx);
        /* Picker cursor: 15px circle (slider-handle scale) FILLED with the
           picked colour, 2px widget-bg ring; the codified 2D-picker-cursor
           language. */
        var ang = state.h * 2 * Math.PI, rad = state.s * (WR - 8);
        var cx = WR + rad * Math.cos(ang), cy = WR + rad * Math.sin(ang);
        var rgb = hsvToRgb(state.h, state.s, 1);
        ctx.beginPath();
        ctx.arc(cx, cy, 7.5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--dz-widget-bg").trim() || "#fff";
        ctx.stroke();
    }

    function updateReadout() {
        var readout = document.querySelector(".mk-rgbw-readout");
        var sw = document.querySelector(".mk-rgbw-swatch");
        var hx = document.getElementById("mk-rgbw-hex");
        if (!sw || !hx) return;
        /* Owner revision 2026-08-18: on the White tab, a device with no
           colour temperature (RGBW/RGBWZ) has nothing meaningful to show
           here, a white swatch labelled "White" conveys nothing, so hide
           the whole row. Devices with a warmth slider (bHasTemperature)
           keep it: the tinted swatch + Cool/Natural/Warm text reflect the
           slider. Always visible on the Colour tab. */
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

    /* Warmth swatch preview colours: fixed literals by design, they depict
       physical colour temperature (6500K cool .. 2700K warm), not scheme
       colours. */
    function warmthRgb(w) {
        return {
            r: Math.round(219 + (255 - 219) * w),
            g: Math.round(233 + (180 - 233) * w),
            b: Math.round(255 + (94 - 255) * w)
        };
    }

    /* Accent range fill on a native range input (the card slider language's
       filled track); CSS alone cannot paint a fill on input[type=range]. */
    function paintRangeFill(inp) {
        if (inp.id === "mk-rgbw-warmth") return;
        if (inp.id === "mk-rgbw-mix") return;    /* its background is the mix gradient, not the accent fill */
        var p = ((inp.value - inp.min) / (inp.max - inp.min)) * 100;
        inp.style.background =
            "linear-gradient(to right, rgba(var(--dz-accent-values),0.5) 0 " + p + "%, " +
            "var(--dz-card-slider-track-bg) " + p + "% 100%)";
    }

    /* White-mix track: live gradient from the currently picked colour to
       white (repainted on wheel drag and hex edit, so it always shows what
       mix>0 would blend toward). No-ops when the control is not in the DOM
       (RGB-only and non-custom subtypes never render it). White is a fixed
       literal by design: it depicts the physical white channel, not a
       scheme colour. */
    function paintMixTrack() {
        var mixInput = document.getElementById("mk-rgbw-mix");
        if (!mixInput) return;
        var rgb = hsvToRgb(state.h, state.s, 1);
        var rgbCss = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
        mixInput.style.background = "linear-gradient(to right, " + rgbCss + ", #ffffff)";
        /* Left end chip mirrors the live picked colour; the right chip is a
           static white background from CSS (the fixed physical channel). */
        var chipLeft = document.getElementById("mk-rgbw-mix-chip-left");
        if (chipLeft) chipLeft.style.background = rgbCss;
    }

    /* Colour payloads exactly as core's getJSONColor builds them
       (domoticz.js:1644): m:3 RGB, m:2 temperature, m:1 fixed white. The
       m:4 custom mix branch mirrors core's customw/customww formulas
       (domoticz.js:1662-1669): RGBWZ splits mix evenly (cw=ww=mix*255),
       RGBWWZ splits it by warmth (cw=mix*(1-warmth)*255, ww=mix*warmth*255,
       t=warmth*255). mix===0 keeps sending plain m:3, unchanged. */
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

    /* Card-slider consistency: other controls (wheel/mix/warmth/hex/tab)
       send using state.bright, which is always >=1 (see the brightness
       input handler), so a send while the slider visually sits at 0 turns
       the lamp on at that floor value. Sync the slider's own UI to match
       what was actually sent, so it stops showing 0% for a lamp that just
       turned on. */
    function syncBrightnessUI() {
        var slider = document.getElementById("mk-rgbw-bright");
        if (!slider || slider.value !== "0") return;
        slider.value = state.bright;
        paintRangeFill(slider);
        var brVal = document.getElementById("mk-rgbw-bright-value");
        if (brVal) brVal.textContent = state.bright + "%";
    }

    function sendColor() {
        if (!state.idx) return;
        syncBrightnessUI();
        var colorJSON = buildColorJSON();
        if (typeof window.SetColValue === "function") {
            /* Page-global from the Angular controllers: keeps permission
               checks and page behaviour (LightsController.js etc.). */
            window.SetColValue(state.idx, colorJSON, state.bright);
        } else {
            $.ajax({ url: "json.htm?type=command&param=setcolbrightnessvalue&idx=" + state.idx +
                          "&color=" + encodeURIComponent(colorJSON) + "&brightness=" + state.bright,
                     dataType: "json" });
        }
    }

    /* Deadline rate-limit, NOT a resettable debounce: the timer is never
       reset by new events, so a continuous drag sends every 400ms instead
       of starving until the pointer pauses (core's own code marks its
       debounce with "TODO: Rate limit instead of debounce"). */
    var sendTimer = null, sendDirty = false;
    function scheduleSend() {
        sendDirty = true;
        if (sendTimer) return;
        sendTimer = setTimeout(function () {
            sendTimer = null;
            if (sendDirty) { sendDirty = false; sendColor(); }
        }, 400);
    }
    function flushSend() {
        if (sendTimer) { clearTimeout(sendTimer); sendTimer = null; }
        if (sendDirty) { sendDirty = false; sendColor(); }
    }
    /* Card-slider consistency: dragging the brightness slider to 0 must
       drop any send queued a moment earlier (from just before the pointer
       reached 0), otherwise a stale >=1 brightness update could still fire
       while the user's intent is Off. */
    function cancelPendingSend() {
        if (sendTimer) { clearTimeout(sendTimer); sendTimer = null; }
        sendDirty = false;
    }
    function onPick() { scheduleSend(); }

    /* The wheel drag surface changes identity every popup open (buildBody
       rebuilds the canvas from scratch), but the drag gesture itself is
       tracked with document-level mousemove/mouseup/touchmove/touchend
       listeners so dragging still works once the pointer leaves the small
       canvas. Registering those four listeners inside attachWheel would add
       a fresh set (and pin the previous, now-detached canvas in a closure)
       on every popup open with no matching removal. Instead they are
       registered exactly once here, at module init, and read the current
       drag target off the module-scope activeWheel/wheelDragging vars;
       attachWheel only swaps activeWheel and adds the canvas-scoped
       mousedown/touchstart listeners, which die with the canvas itself. */
    var activeWheel = null, wheelDragging = false;

    function wheelPick(e) {
        if (!activeWheel) return;
        var rect = activeWheel.getBoundingClientRect();
        var scale = WHEEL / (rect.width || WHEEL);
        var px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        var py = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        var dx = px * scale - WR, dy = py * scale - WR;
        state.h = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1;
        state.s = Math.min(Math.sqrt(dx * dx + dy * dy) / WR, 1);
        drawWheel(activeWheel);
        paintMixTrack();
        updateReadout();
        onPick();
    }

    document.addEventListener("mousemove", function (e) { if (wheelDragging) wheelPick(e); });
    document.addEventListener("mouseup", function () { if (wheelDragging) { wheelDragging = false; flushSend(); } });
    document.addEventListener("touchmove", function (e) { if (wheelDragging) { wheelPick(e); e.preventDefault(); } }, { passive: false });
    document.addEventListener("touchend", function () { if (wheelDragging) { wheelDragging = false; flushSend(); } });

    function attachWheel(canvas) {
        activeWheel = canvas;
        canvas.addEventListener("mousedown", function (e) { wheelDragging = true; wheelPick(e); });
        canvas.addEventListener("touchstart", function (e) { wheelDragging = true; wheelPick(e); e.preventDefault(); }, { passive: false });
    }
})();
