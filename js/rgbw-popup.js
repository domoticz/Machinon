/* Machinon colour popup (feature: rgbw_popup). Wraps core's ShowRGBWPopup;
   the Machinon modal lives in its own #mk-rgbw-popup div, core's #rgbw_popup
   markup is never touched so delegation to the original always works.
   Delegates to core for: DimmerType "rel", custom w/ww subtypes, or any
   drift-guard failure (core signature changed -> never hook, zero risk). */
(function () {
    "use strict";
    if (typeof window.ShowRGBWPopup !== "function" ||
        window.ShowRGBWPopup.length !== 8 ||           /* (event, idx, Protected, MaxDimLevel, LevelInt, color, SubType, DimmerType) */
        typeof window.HandleProtection !== "function" ||
        typeof window.getLEDType !== "function") {
        return; /* upstream drifted: leave core's popup alone */
    }
    if (window.ShowRGBWPopup._mkHooked) return;

    var orig = window.ShowRGBWPopup;

    window.ShowRGBWPopup = function (event, idx, Protected, MaxDimLevel, LevelInt, color, SubType, DimmerType) {
        var led = window.getLEDType(SubType || "");
        if ((DimmerType && DimmerType === "rel") || led.bHasCustom) {
            return orig.apply(this, arguments);
        }
        window.HandleProtection(Protected, function () {
            openPopup({ idx: idx, led: led, maxDim: MaxDimLevel, levelInt: LevelInt, colorJSON: color, protected: Protected, event: event });
        });
    };
    window.ShowRGBWPopup._mkHooked = true;

    var state = { idx: null, led: null, mode: "color", h: 0, s: 1, warmth: 0.5, bright: 100, maxDim: 100 };
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
        state.bright = Math.max(1, Math.min(100, Math.round(((parseInt(args.levelInt, 10) || 0) / state.maxDim) * 99) + 1));
        seedFromColor(args.colorJSON);
        document.getElementById("mk-rgbw-title").textContent = state.led.bHasRGB ? $.t("Color") : $.t("White");
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
            pop.style.left = Math.max(10, Math.min(x, vw - 10 - w)) + "px";
            pop.style.top = Math.max(10, Math.min(y, vh - 10 - h)) + "px";
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
    }

    function buildBody(led) {
        var body = document.querySelector("#mk-rgbw-popup .mk-rgbw-body");
        body.innerHTML = ""; /* Tasks 5-8 populate */
    }

    /* Task 5's pure color-conversion interface, reproduced here so this
       module parses and runs standalone; seedFromColor above needs
       rgbToHsv. hsvToRgb/toHex are unused until Task 5 wires the swatches
       and inputs, but ship together as one small, self-contained unit. */
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
})();
