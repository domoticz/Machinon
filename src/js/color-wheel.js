/* Shared hue/saturation colour wheel: a canvas picker extracted from the
   RGBW popup (js/rgbw-popup.js), which is FEATURE-TOGGLED (feature id 45)
   and may be switched off. The theme wizard and the Theme Hub's colour
   editor are always loaded, so neither may depend on popup-private code;
   this file is the shared, DOM-light home for the wheel itself. It knows
   nothing about devices, popups or theme state: it draws a wheel and
   reports drag picks in hue degrees + saturation fraction. Callers own the
   colour they are editing, keep their own state, and re-draw the wheel
   themselves via dzDrawColorWheel whenever that colour changes.

   Singleton state (owner review, 2026-08-30): activeCanvas/dragging and
   the wheelImage cache below are module-scope, not per-canvas, so only one
   wheel can be live at a time -- attaching a second one silently steals the
   drag gesture from the first. That was already true of the code this file
   was extracted from (js/rgbw-popup.js only ever has one popup open), and
   is fine today because nothing calls dzAttachColorWheel twice
   concurrently. The wizard (Task 13) becomes the second consumer; if it and
   the RGBW popup are ever live at once, or the wizard draws at a different
   size than the popup, drawWheelBase's cache does a full recompute on every
   size switch rather than caching both. Not a bug to fix speculatively, but
   worth knowing before assuming two wheels can coexist.

   Style: var/function only, no arrow functions/let/const/classes/ES
   modules (src/js/ convention, see custom.js THEME_MODULES). */
(function () {
    "use strict";

    /* Pure HSV<->RGB math (textbook formulas; own implementation, no code
       taken from any other theme). h,s,v in 0..1; r,g,b in 0..255. Carried
       verbatim from js/rgbw-popup.js hsvToRgb, which keeps its own copy
       (still needed there for the hex field, swatches and colour payloads)
       rather than reaching back into this file. */
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

    /* Base wheel image is cached by size: recomputed only when a caller
       asks for a different size than the one already cached. The RGBW
       popup always draws at one fixed size (210), so in practice this is
       still a compute-once cache for that caller, exactly like the
       original wheelImage cache in js/rgbw-popup.js. See the singleton-state
       note above the module comment: a second consumer drawing at a
       different size thrashes this cache rather than getting a second slot. */
    var wheelImageSize = 0, wheelImage = null;

    function drawWheelBase(ctx, size) {
        var r = size / 2;
        if (wheelImageSize !== size || !wheelImage) {
            var img = ctx.createImageData(size, size);
            var d = img.data;
            for (var y = 0; y < size; y++) {
                for (var x = 0; x < size; x++) {
                    var dx = x - r, dy = y - r, dist = Math.sqrt(dx * dx + dy * dy);
                    var i4 = (y * size + x) * 4;
                    if (dist > r) { d[i4 + 3] = 0; continue; }
                    var hue = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1;
                    var rgb = hsvToRgb(hue, Math.min(dist / r, 1), 1);
                    d[i4] = rgb.r; d[i4 + 1] = rgb.g; d[i4 + 2] = rgb.b; d[i4 + 3] = 255;
                }
            }
            wheelImage = img;
            wheelImageSize = size;
        }
        ctx.putImageData(wheelImage, 0, 0);
    }

    /* Draws the base hue/saturation wheel at `size` px, plus a picker
       cursor when hueDegrees/saturation are both given (hueDegrees 0..360,
       saturation 0..1 -- this API's own units; a caller carrying an
       internal 0..1 hue fraction, like the RGBW popup's state.h, converts
       at the boundary: hueDegrees = state.h * 360). Omit both to draw the
       bare wheel with no cursor. Carried from js/rgbw-popup.js
       drawWheel/drawWheelBase. */
    function dzDrawColorWheel(canvas, size, hueDegrees, saturation) {
        var ctx = canvas.getContext("2d");
        drawWheelBase(ctx, size);
        if (typeof hueDegrees !== "number" || typeof saturation !== "number") return;
        var r = size / 2;
        var h = (((hueDegrees % 360) + 360) % 360) / 360;
        var s = Math.max(0, Math.min(1, saturation));
        /* Picker cursor: 15px circle (slider-handle scale) FILLED with the
           picked colour, 2px widget-bg ring; the codified 2D-picker-cursor
           language. */
        var ang = h * 2 * Math.PI, rad = s * (r - 8);
        var cx = r + rad * Math.cos(ang), cy = r + rad * Math.sin(ang);
        var rgb = hsvToRgb(h, s, 1);
        ctx.beginPath();
        ctx.arc(cx, cy, 7.5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--dz-widget-bg").trim() || "#fff";
        ctx.stroke();
    }

    /* The wheel drag surface changes identity every time a caller rebuilds
       its canvas (the RGBW popup does this on every popup open), but the
       drag gesture itself is tracked with document-level mousemove/mouseup/
       touchmove/touchend listeners so dragging still works once the pointer
       leaves the small canvas. Registering those four listeners inside
       dzAttachColorWheel on every call would add a fresh set (and pin the
       previous, now-detached canvas in a closure) on every attach with no
       matching removal, so they are registered exactly once -- but NOT at
       module init (owner review, 2026-08-30): this file is always loaded
       (THEME_MODULES), unlike js/rgbw-popup.js, which only loads when
       feature 45 is on. Registering at module init would put a
       non-passive `touchmove` listener on `document` for every visitor,
       including one who has the colour popup switched off and will never
       see a wheel -- a real mobile scroll-perf cost for a feature they
       opted out of, and a global side effect a pure refactor must not add.
       Wiring is deferred to the first dzAttachColorWheel call instead (see
       wired/dzWireDocumentListeners below), which preserves "registered
       exactly once" while keeping it inert until something actually uses a
       wheel. dzAttachColorWheel only swaps activeCanvas/activeSize (and the
       pick/commit callbacks) and adds the canvas-scoped mousedown/
       touchstart listeners, which die with the canvas itself. Carried from
       js/rgbw-popup.js attachWheel/wheelPick. */
    var activeCanvas = null, activeSize = 0, activeOnPick = null, activeOnCommit = null, dragging = false;
    var wired = false;

    function pick(e) {
        if (!activeCanvas) return;
        var rect = activeCanvas.getBoundingClientRect();
        var size = activeSize;
        var scale = size / (rect.width || size);
        var px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        var py = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        var r = size / 2;
        var dx = px * scale - r, dy = py * scale - r;
        var h = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1;
        var s = Math.min(Math.sqrt(dx * dx + dy * dy) / r, 1);
        if (activeOnPick) activeOnPick(h * 360, s);
    }

    function dzWireDocumentListeners() {
        if (wired) return;
        wired = true;
        document.addEventListener("mousemove", function (e) { if (dragging) pick(e); });
        document.addEventListener("mouseup", function () {
            if (dragging) { dragging = false; if (activeOnCommit) activeOnCommit(); }
        });
        document.addEventListener("touchmove", function (e) { if (dragging) { pick(e); e.preventDefault(); } }, { passive: false });
        document.addEventListener("touchend", function () {
            if (dragging) { dragging = false; if (activeOnCommit) activeOnCommit(); }
        });
    }

    /* Attaches drag handling to canvas, at `size` px (must match the size
       canvas was/will be drawn at via dzDrawColorWheel: pick math scales
       pointer coordinates by size/rect.width, so a mismatch would silently
       pick the wrong colour rather than error). onPick(hueDegrees,
       saturation) fires on every position update while dragging (the
       initial mousedown/touchstart and every document-level move that
       follows), mirroring what js/rgbw-popup.js's wheelPick used to do
       inline (update state, redraw, refresh readouts, schedule a send) --
       this module does none of that itself, the caller does, from inside
       onPick. onCommit(), if given, fires once when the drag releases
       (mouseup/touchend), mirroring the popup's separate flushSend()-on-
       release call so a caller can reproduce its schedule-during-drag /
       flush-on-release send contract without owning the drag gesture
       itself. Carried from js/rgbw-popup.js attachWheel. */
    function dzAttachColorWheel(canvas, size, onPick, onCommit) {
        dzWireDocumentListeners();
        activeCanvas = canvas;
        activeSize = size;
        activeOnPick = onPick;
        activeOnCommit = onCommit || null;
        canvas.addEventListener("mousedown", function (e) { dragging = true; pick(e); });
        canvas.addEventListener("touchstart", function (e) { dragging = true; pick(e); e.preventDefault(); }, { passive: false });
    }

    window.dzDrawColorWheel = dzDrawColorWheel;
    window.dzAttachColorWheel = dzAttachColorWheel;
})();
