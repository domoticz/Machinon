/* Theme hub setting previews.

   Each setting row in the hub (src/js/theme-hub.js dzRenderHubRow) carries an
   empty .dz-hub-preview[data-preview] box. This module owns what goes inside it:
   a registry (DZ_HUB_PREVIEWS) mapping a manifest entry's previewId to a builder
   that returns a small DOM node illustrating the setting, and dzRenderPreview()
   which looks the builder up and calls it.

   TWO KINDS of preview, by what the setting does:

   1. LIVE TOKEN MINIS (the visual settings): a schematic built ONLY from the
      theme's own --dz-* tokens (dz-tokens.css / dark.css), applied as inline
      var() references. Because the colours are var() lookups, the mini
      re-resolves against the active scheme automatically: switch the scheme
      (src/js/schemes.js applyScheme) and the mini recolours with the rest of the
      UI, with no JS re-render. No frozen hex, no external image. These show what
      the setting changes: a device card, a navbar strip, a chart band, etc.

   2. SVG SKETCH FALLBACKS (the non-visualizable settings): behaviours with no
      on-screen colour to mirror, so a live token mini would be misleading.
      Which settings those are is NOT restated here - DZ_HUB_PREVIEWS at the
      foot of this file is the registry, and its `sketch-*` keys are the list.
      Instead of a mini they get an inline, SCHEME-NEUTRAL
      <svg> schematic (a fixed muted grey that reads on both light and dark
      backgrounds, NOT a --dz-* colour, so it deliberately does not "follow" a
      scheme it has nothing to say about). Purely illustrative.

   Settings with neither a meaningful live mini nor a sensible sketch keep
   previewId null in the manifest and render no preview (the row is still valid).

   SPACING: the 8px rhythm (and its 2/4px sub-steps at this mini scale) is
   annotated inline for the future --dz-gap token. FONTS: text inside a mini uses
   the --dz-text-* scale only (no invented sizes). CONTAINMENT: the box size and
   overflow live in css/theme-hub.css (.dz-hub-mini); builders never set a fixed
   pixel width that could overflow a 360px row.

   Load order: registered in custom.js THEME_MODULES BEFORE theme-hub.js, so
   dzRenderPreview is defined when dzRenderHubRow calls it. */

/* Small DOM helper: create an element, apply an inline style string (token
   var() references live here) and optional text. Keeps each builder terse and
   readable without a template engine. */
function dzMiniEl(tag, style, text) {
    var node = document.createElement(tag);
    if (style) node.setAttribute("style", style);
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
}

/* The mini's outer box. class "dz-hub-mini" carries the containment (size,
   overflow hidden, radius) from css/theme-hub.css; the inline style only sets
   layout for this particular schematic. */
function dzMiniBox(style) {
    var box = dzMiniEl("div", style || "");
    box.className = "dz-hub-mini";
    return box;
}

/* An inline SVG element in the SVG namespace (createElement("svg") makes an HTML
   element that never renders). attrs is a flat {name:value} map. */
function dzSvg(tag, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
}

/* Scheme-neutral stroke for the SVG sketches: a mid grey that stays legible on
   both the light (#f4f8fc, 3.01:1) and dark (#0f1620, 5.65:1) body backgrounds.
   Deliberately NOT a --dz-* token: these settings have no scheme colour to
   mirror. */
var DZ_SKETCH_INK = "#8a9099";

/* ---- Live token minis ----------------------------------------------------- */

/* Reusable mini "device card": rounded widget surface on the body background,
   the house card idiom (--dz-widget-bg fill, 6px card radius, faint border). */
function dzMiniCard(extra) {
    return dzMiniEl("div",
        "background:var(--dz-widget-bg);border:1px solid var(--dz-input-border);" +
        "border-radius:6px;" + (extra || ""));
}

/* switch_instead_of_bigtext -> a mini device card whose status is an ON toggle
   (the setting: a switch control instead of a big status word). The toggle track
   is painted from --dz-accent-color, so it recolours with the scheme; it carries
   data-token-probe as the harness's scheme-follow read point. */
function dzPreviewCardToggle() {
    var box = dzMiniBox("display:flex;align-items:center;justify-content:center;padding:6px;"); // 6px inset
    var card = dzMiniCard("width:100%;padding:6px;display:flex;align-items:center;justify-content:space-between;gap:6px;"); // 6px gap
    var label = dzMiniEl("span",
        "flex:1 1 auto;height:6px;border-radius:3px;" +
        "background:color-mix(in srgb, var(--dz-body-text) 30%, transparent);");
    // Toggle: accent track + white knob to the right (ON). data-token-probe marks
    // the accent-driven surface the scheme-follow assertion reads.
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

/* fade_off_items -> two mini cards, the second dimmed (opacity), showing that
   OFF devices fade. Both are --dz-widget-bg so the pair follows the scheme; the
   dim is opacity, not a frozen grey. */
function dzPreviewCardDim() {
    var box = dzMiniBox("display:flex;align-items:center;gap:6px;padding:6px;"); // 6px gap + inset
    var on = dzMiniCard("flex:1 1 0;height:26px;");
    var off = dzMiniCard("flex:1 1 0;height:26px;opacity:0.4;"); // OFF device: dimmed
    box.appendChild(on);
    box.appendChild(off);
    return box;
}

/* dashboard_show_last_update -> a mini card with a value line and a faint
   "last seen" line beneath it (the setting adds that line). Muted via a
   color-mix over --dz-body-text (house pattern), so it tracks the scheme. */
function dzPreviewCardLastseen() {
    var box = dzMiniBox("display:flex;align-items:center;justify-content:center;padding:6px;");
    var card = dzMiniCard("width:100%;padding:6px;display:flex;flex-direction:column;gap:5px;"); // 5px stack
    var value = dzMiniEl("span",
        "width:60%;height:7px;border-radius:3px;background:var(--dz-accent-color);");
    var seen = dzMiniEl("span",
        "width:85%;height:5px;border-radius:2px;" +
        "background:color-mix(in srgb, var(--dz-body-text) 35%, transparent);"); // faint last-seen line
    card.appendChild(value);
    card.appendChild(seen);
    box.appendChild(card);
    return box;
}

/* navbar_icons -> a mini navbar (--dz-nav-bg) with three items, each an accent
   icon dot above a text line: the setting adds icons to the navbar. */
function dzPreviewNavbarStrip() {
    var box = dzMiniBox("padding:0;");
    var bar = dzMiniEl("div",
        "background:var(--dz-nav-bg);border:1px solid var(--dz-input-border);border-radius:6px;" +
        "height:100%;display:flex;align-items:center;justify-content:space-around;padding:6px 4px;"); // 6/4 inset
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

/* custom_settings_menu -> a 2x2 tile grid on the body background (the setting
   turns the Setup menu into a tile grid). Tiles are --dz-widget-bg. */
function dzPreviewMenuTilegrid() {
    var box = dzMiniBox("background:var(--dz-body-bg);padding:6px;" +
        "display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;"); // 4px grid gap
    for (var i = 0; i < 4; i++) {
        box.appendChild(dzMiniCard("border-radius:4px;"));
    }
    return box;
}

/* dashboard_columns -> two columns of stacked blocks (the setting arranges wide
   dashboards into columns). Blocks are --dz-widget-bg on the body background. */
function dzPreviewDashColumns() {
    var box = dzMiniBox("background:var(--dz-body-bg);padding:6px;display:flex;gap:5px;"); // 5px column gap
    for (var c = 0; c < 2; c++) {
        var col = dzMiniEl("div", "flex:1 1 0;display:flex;flex-direction:column;gap:4px;"); // 4px stack
        col.appendChild(dzMiniCard("height:12px;border-radius:3px;"));
        col.appendChild(dzMiniCard("height:12px;border-radius:3px;"));
        box.appendChild(col);
    }
    return box;
}

/* center_popups -> a viewport frame with a small dialog box centered in it (the
   setting centers popups). Frame is --dz-body-bg, the dialog --dz-modal-bg with
   a faint border, both tokened so it follows the scheme. */
function dzPreviewDialogCenter() {
    var box = dzMiniBox("background:var(--dz-body-bg);padding:0;position:relative;");
    var frame = dzMiniEl("div", "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;");
    // dz-shadow-exception: mini dialog mockup rendered at 52%x46% scale of a small preview
    // box, not a real dialog. The full-strength --dz-elev-overlay/--dz-elev-popup token
    // would read oversized and heavy-handed at that scale; kept literal and deliberately
    // subdued to match the mockup's proportions.
    var dialog = dzMiniEl("div",
        "width:52%;height:46%;border-radius:4px;background:var(--dz-modal-bg);" +
        "border:1px solid var(--dz-input-border);box-shadow:0 1px 3px rgba(0,0,0,.25);");
    frame.appendChild(dialog);
    box.appendChild(frame);
    return box;
}

/* rgbw_popup -> a mini dialog with a colour wheel disc and a slider bar (the
   setting swaps core's colour picker for the Machinon modal). Wheel disc is a
   conic-gradient, the one CSS paint that reads as "colour wheel" at this scale;
   fixed literal hues by design (they depict the physical hue circle, not a
   scheme colour). */
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

/* card_min_width / card_max_width -> a row of card blocks with a width caliper
   beneath (the setting sets the card width range). Blocks are --dz-widget-bg;
   the caliper bar is accent, so the whole mini follows the scheme. */
function dzPreviewCardWidth() {
    var box = dzMiniBox("padding:6px;display:flex;flex-direction:column;gap:5px;justify-content:center;"); // 5px stack
    var grid = dzMiniEl("div", "display:flex;gap:4px;"); // 4px card gap
    grid.appendChild(dzMiniCard("flex:0 0 22px;height:18px;"));
    grid.appendChild(dzMiniCard("flex:0 0 22px;height:18px;"));
    grid.appendChild(dzMiniCard("flex:1 1 auto;height:18px;opacity:0.5;")); // the flexible remainder
    // Caliper: a full-width accent bar with end ticks, reading "adjustable width".
    var caliper = dzMiniEl("div",
        "height:3px;border-radius:2px;background:var(--dz-accent-color);");
    box.appendChild(grid);
    box.appendChild(caliper);
    return box;
}

/* log_plot_bands -> a mini chart: a plot area with one horizontal range band
   (accent-alpha fill) behind a small trend line (the setting draws range bands
   in log graphs). The band uses rgba(--dz-accent-values), the line the accent
   colour, both tokened. */
function dzPreviewChartBands() {
    var box = dzMiniBox("padding:6px;position:relative;background:var(--dz-widget-bg);" +
        "border:1px solid var(--dz-input-border);");
    // Range band: a horizontal accent-tinted stripe across the plot.
    var band = dzMiniEl("div",
        "position:absolute;left:6px;right:6px;top:38%;height:26%;border-radius:2px;" +
        "background:rgba(var(--dz-accent-values), 0.22);");
    band.setAttribute("data-token-probe", "band");
    // Trend line: a thin accent polyline via an SVG on top of the band.
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

/* ---- SVG sketch fallbacks (scheme-neutral) -------------------------------- */

/* Common sketch scaffold: a class-marked box holding a viewBox 0 0 88 52 svg
   drawn in the neutral ink. Builders add their own shapes. */
function dzSketchBox() {
    var box = dzMiniBox("display:flex;align-items:center;justify-content:center;padding:4px;");
    box.classList.add("dz-hub-sketch");
    var svg = dzSvg("svg", { viewBox: "0 0 88 52", width: "100%", height: "100%",
        fill: "none", stroke: DZ_SKETCH_INK, "stroke-width": "2",
        "stroke-linecap": "round", "stroke-linejoin": "round" });
    box.appendChild(svg);
    return { box: box, svg: svg };
}

/* standby -> a screen going to sleep: a monitor outline with a moon inside
   (the setting blanks the screen to a standby clock after N minutes). */
function dzSketchStandby() {
    var s = dzSketchBox();
    s.svg.appendChild(dzSvg("rect", { x: "16", y: "12", width: "56", height: "34", rx: "3" }));
    s.svg.appendChild(dzSvg("line", { x1: "36", y1: "46", x2: "52", y2: "46" })); // stand base
    // Crescent moon: an arc suggesting standby/sleep.
    s.svg.appendChild(dzSvg("path", { d: "M50 21a9 9 0 1 0 0 16 11 11 0 0 1 0-16z", fill: DZ_SKETCH_INK, stroke: "none" }));
    return s.box;
}

/* check_update -> a navbar bar with an update badge dot at the corner (the
   setting shows an update notice as a navbar badge). */
function dzSketchUpdate() {
    var s = dzSketchBox();
    s.svg.appendChild(dzSvg("rect", { x: "12", y: "18", width: "64", height: "16", rx: "3" })); // navbar
    s.svg.appendChild(dzSvg("line", { x1: "20", y1: "26", x2: "30", y2: "26" })); // a menu item
    s.svg.appendChild(dzSvg("line", { x1: "38", y1: "26", x2: "48", y2: "26" }));
    s.svg.appendChild(dzSvg("circle", { cx: "72", cy: "16", r: "6", fill: DZ_SKETCH_INK, stroke: "none" })); // badge
    return s.box;
}

/* warn_timeout / warn_battery -> a bell with a badge dot (both settings surface
   device warnings as toasts; the previewId sketch-notification is shared by
   both rows, same as card-width is shared by card_min_width/card_max_width). */
function dzSketchNotification() {
    var s = dzSketchBox();
    // Bell body + clapper.
    s.svg.appendChild(dzSvg("path", { d: "M32 34c0-12 4-18 12-18s12 6 12 18c0 3 3 5 3 5H29s3-2 3-5z" }));
    s.svg.appendChild(dzSvg("path", { d: "M40 41a4 4 0 0 0 8 0" }));
    s.svg.appendChild(dzSvg("line", { x1: "44", y1: "12", x2: "44", y2: "16" })); // top nub
    s.svg.appendChild(dzSvg("circle", { cx: "58", cy: "18", r: "6", fill: DZ_SKETCH_INK, stroke: "none" })); // badge
    return s.box;
}

/* floorplan_popup_details -> a mini popup card with a value line and a chevron beneath,
   the chevron being what this setting reveals. Sketch rather than live-mini: the real
   surface is SVG inside a floorplan and does not reduce to a token mini. */
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

/* ---- Registry + entry point ----------------------------------------------- */

/* previewId -> builder(entry) -> DOM node. Assigned in src/js/theme-manifest.js;
   see this module's header for the live-mini vs sketch split. card_min_width and
   card_max_width intentionally share "card-width" (one width-range picture). */
var DZ_HUB_PREVIEWS = {
    // Live token minis
    "card-toggle":   dzPreviewCardToggle,
    "card-dim":      dzPreviewCardDim,
    "card-lastseen": dzPreviewCardLastseen,
    "navbar-strip":  dzPreviewNavbarStrip,
    "menu-tilegrid": dzPreviewMenuTilegrid,
    "dash-columns":  dzPreviewDashColumns,
    "dialog-center": dzPreviewDialogCenter,
    "sketch-rgbw-popup": dzSketchRgbwPopup,
    "card-width":    dzPreviewCardWidth,
    "chart-bands":   dzPreviewChartBands,
    // SVG sketch fallbacks (scheme-neutral)
    "sketch-standby":           dzSketchStandby,
    "sketch-update":            dzSketchUpdate,
    "sketch-notification":      dzSketchNotification,
    "sketch-floorplan-details": dzSketchFloorplanDetails
};

/* Look up and build the preview for a previewId. Returns a DOM node, or null if
   the id is absent/unregistered (the caller leaves the placeholder empty; the
   row is still valid). entry is passed through for future value-aware previews;
   today's builders are value-independent (they illustrate the setting, not its
   current value), so it is currently unused by every builder. */
function dzRenderPreview(previewId, entry) {
    if (!previewId) return null;
    var builder = DZ_HUB_PREVIEWS[previewId];
    if (typeof builder !== "function") {
        console.warn("machinon_theme_hub", "preview_missing", "no builder for previewId '" + previewId + "'");
        return null;
    }
    return builder(entry);
}
