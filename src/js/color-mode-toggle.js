/* The light/dark quick toggle: one sun/moon switch in the header strip (from
   980px) and one at the top right of the phone's flyout menu (below 980px,
   where css/sidemenu.css turns the menu bar into the drawer). Both flip the
   theme on screen between its light and dark version on THIS device only,
   through the override in color-mode.js; nothing is saved to Domoticz.

   Header order, outermost first: problem badge, search, toggle. The header
   controls are right floats, so DOM order is visual order from the right
   edge; the badge inserts itself before #search (problems.js) and the toggle
   goes after it, inward, so neither the toggle appearing nor the badge
   appearing moves search.

   The buttons are built hidden and stay hidden until the first dz:colormode
   says what is painted, so a visible button always has a name that matches
   the screen. They also hide while a single-version theme is painted (there
   is nothing to flip to) and while the color_mode_toggle setting is off. */

var DZ_MODE_TOGGLE_IDS = ["dz-mode-toggle", "dz-mode-toggle-menu"];

function dzModeToggleEnabled() {
    var feature = theme && theme.features ? theme.features.color_mode_toggle : null;
    return !!(feature && feature.enabled === true);
}

/* Visibility, name and highlighted half of both buttons from the last paint. */
function dzSyncModeToggles() {
    var painted = dzLastColorMode;
    var show = !!(painted && !painted.single && painted.variant) && dzModeToggleEnabled();
    var dark = !!painted && painted.variant === "dark";
    var label = dzT(dark ? "header.mode_to_light" : "header.mode_to_dark");
    DZ_MODE_TOGGLE_IDS.forEach(function (id) {
        var btn = document.getElementById(id);
        if (!btn) { return; }
        btn.hidden = !show;
        btn.title = label;
        btn.setAttribute("aria-label", label);
        btn.setAttribute("data-painted", dark ? "dark" : "light");
    });
}

/* A tap paints the other variant. Asking for what the saved mode already
   paints clears the override instead of storing one, so tapping back leaves
   no trace on the device. */
function dzToggleColorMode() {
    var painted = dzPaintedVariant();
    if (!painted) { return; }
    var target = painted === "dark" ? "light" : "dark";
    var natural = dzWantedVariant(theme.scheme_mode, null, dzDeviceDark());
    dzSetColorOverride(target === natural ? null : target);
    dzApplyColorMode();
}

/* One button drawn as a two-segment pill, sun then moon; CSS fills the
   segment of the painted variant (data-painted). The whole pill is the
   control and its name is the action, so no segment carries a state of its
   own for assistive technology. */
function dzBuildModeToggle(id) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = id;
    btn.className = "dz-mode-toggle";
    btn.hidden = true;
    var pill = document.createElement("span");
    pill.className = "dz-mode-pill";
    [["light", "ion-md-sunny"], ["dark", "ion-md-moon"]].forEach(function (seg) {
        var half = document.createElement("span");
        half.className = "dz-mode-seg dz-mode-seg-" + seg[0];
        var icon = document.createElement("i");
        icon.className = seg[1];
        icon.setAttribute("aria-hidden", "true");
        half.appendChild(icon);
        pill.appendChild(half);
    });
    btn.appendChild(pill);
    btn.addEventListener("click", dzToggleColorMode);
    return btn;
}

/* Inserts the two buttons once; a second call finds them and only syncs. */
function setModeToggles() {
    var search = document.getElementById("search");
    var logo = document.querySelector(".container-logo");
    if (logo && !document.getElementById(DZ_MODE_TOGGLE_IDS[0])) {
        logo.insertBefore(dzBuildModeToggle(DZ_MODE_TOGGLE_IDS[0]),
                          search && search.parentNode === logo ? search.nextSibling : null);
    }
    /* Last in the drawer: absolutely positioned at its top right it does not
       matter where it sits in the DOM, but in the icons-only drawer it is in
       flow under the menu rows (css/color-mode-toggle.css), and last keeps
       it after the links in the tab order. */
    var menu = document.querySelector(".navbar-inner");
    if (menu && !document.getElementById(DZ_MODE_TOGGLE_IDS[1])) {
        menu.appendChild(dzBuildModeToggle(DZ_MODE_TOGGLE_IDS[1]));
    }
    dzSyncModeToggles();
}

document.addEventListener("dz:colormode", function (e) {
    dzLastColorMode = e.detail;
    dzSyncModeToggles();
});
