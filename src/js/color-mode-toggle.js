var DZ_MODE_TOGGLE_IDS = ["dz-mode-toggle", "dz-mode-toggle-menu"];
function dzModeToggleEnabled() {
var feature = theme && theme.features ? theme.features.color_mode_toggle : null;
return !!(feature && feature.enabled === true);
}
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
function dzToggleColorMode() {
var painted = dzPaintedVariant();
if (!painted) { return; }
var target = painted === "dark" ? "light" : "dark";
var natural = dzWantedVariant(theme.scheme_mode, null, dzDeviceDark());
dzSetColorOverride(target === natural ? null : target);
dzApplyColorMode();
}
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
function setModeToggles() {
var search = document.getElementById("search");
var logo = document.querySelector(".container-logo");
if (logo && !document.getElementById(DZ_MODE_TOGGLE_IDS[0])) {
logo.insertBefore(dzBuildModeToggle(DZ_MODE_TOGGLE_IDS[0]),
search && search.parentNode === logo ? search.nextSibling : null);
}
var menu = document.querySelector(".navbar-inner");
if (menu && !document.getElementById(DZ_MODE_TOGGLE_IDS[1])) {
menu.appendChild(dzBuildModeToggle(DZ_MODE_TOGGLE_IDS[1]));
}
dzSyncModeToggles();
}
document.addEventListener("dz:colormode", function () {
dzSyncModeToggles();
});
