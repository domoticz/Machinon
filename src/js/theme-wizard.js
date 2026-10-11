var DZ_WIZARD_ID = "dz-theme-wizard";
var DZ_WIZARD = null;
var DZ_WIZARD_OPENER = null;
function dzWizardDefaults() {
return { step: 1, accent: "#3B7DD8", surface: null, look: "soft", name: "" };
}
function dzWizardEl(tag, cls, parent) {
var el = document.createElement(tag);
if (cls) { el.className = cls; }
if (parent) { parent.appendChild(el); }
return el;
}
function dzOpenThemeWizard() {
if (document.getElementById(DZ_WIZARD_ID)) { return; }
DZ_WIZARD = dzWizardDefaults();
DZ_WIZARD_OPENER = document.activeElement;
var scrim = document.getElementById("mk-rgbw-scrim");
if (!scrim) {
scrim = dzWizardEl("div", null, document.body);
scrim.id = "mk-rgbw-scrim";
}
scrim.style.display = "block";
scrim.addEventListener("click", dzCloseThemeWizard);
var dialog = dzWizardEl("div", "dz-wizard", document.body);
dialog.id = DZ_WIZARD_ID;
dialog.setAttribute("role", "dialog");
dialog.setAttribute("aria-modal", "true");
dialog.setAttribute("aria-label", dzT("hub.wizard.aria"));
document.addEventListener("keydown", dzWizardKeydown);
dzWizardRender();
}
function dzWizardKeydown(e) {
if (e.key === "Escape") { dzCloseThemeWizard(); return; }
if (e.key !== "Tab") { return; }
var dialog = document.getElementById(DZ_WIZARD_ID);
if (!dialog) { return; }
var items = dzWizardFocusables(dialog);
if (!items.length) { return; }
var first = items[0], last = items[items.length - 1];
var inside = dialog.contains(document.activeElement);
if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
}
function dzWizardFocusables(dialog) {
return Array.prototype.filter.call(
dialog.querySelectorAll("button, [href], input, select, textarea, [tabindex]"),
function (el) { return !el.disabled && el.tabIndex >= 0 && el.offsetParent !== null; });
}
function dzCloseThemeWizard() {
var dialog = document.getElementById(DZ_WIZARD_ID);
if (dialog && dialog.parentNode) { dialog.parentNode.removeChild(dialog); }
var scrim = document.getElementById("mk-rgbw-scrim");
if (scrim) {
scrim.style.display = "none";
scrim.removeEventListener("click", dzCloseThemeWizard);
}
document.removeEventListener("keydown", dzWizardKeydown);
DZ_WIZARD = null;
if (DZ_WIZARD_OPENER && document.contains(DZ_WIZARD_OPENER)) { DZ_WIZARD_OPENER.focus(); }
DZ_WIZARD_OPENER = null;
}
function dzWizardRender() {
var dialog = document.getElementById(DZ_WIZARD_ID);
if (!dialog || !DZ_WIZARD) { return; }
dialog.textContent = "";
var head = dzWizardEl("div", "dz-wizard-head", dialog);
dzWizardEl("div", "dz-wizard-title", head).textContent = dzT("hub.wizard.title");
var close = dzWizardEl("button", "dz-wizard-close", head);
close.type = "button";
close.setAttribute("aria-label", dzT("common.close"));
dzWizardEl("i", "icon ion-md-close", close);
close.addEventListener("click", dzCloseThemeWizard);
var steps = dzWizardEl("div", "dz-wizard-steps", head);
[dzT("hub.wizard.steps.colours"), dzT("hub.wizard.steps.look"), dzT("hub.wizard.steps.name")].forEach(function (label, i) {
var stepEl = dzWizardEl("span", "dz-wizard-step", steps);
if (i + 1 === DZ_WIZARD.step) {
stepEl.className += " is-current";
stepEl.setAttribute("aria-current", "step");
}
stepEl.textContent = label;
});
var bodyEl = dzWizardEl("div", "dz-wizard-body", dialog);
if (DZ_WIZARD.step === 1) { dzWizardStepColours(bodyEl); }
else if (DZ_WIZARD.step === 2) { dzWizardStepLook(bodyEl); }
else { dzWizardStepName(bodyEl); }
var foot = dzWizardEl("div", "dz-wizard-foot", dialog);
var cancel = dzWizardEl("button", "btn btn-default dz-wizard-cancel", foot);
cancel.type = "button";
cancel.textContent = dzT("hub.wizard.cancel");
cancel.addEventListener("click", dzCloseThemeWizard);
if (DZ_WIZARD.step > 1) {
var back = dzWizardEl("button", "btn btn-default dz-wizard-back", foot);
back.type = "button";
back.textContent = dzT("hub.wizard.back");
back.addEventListener("click", function () {
DZ_WIZARD.step -= 1;
dzWizardRender();
});
}
var next = dzWizardEl("button", "btn btn-primary dz-wizard-next", foot);
next.type = "button";
next.textContent = DZ_WIZARD.step === 3 ? dzT("hub.wizard.save_theme") : dzT("hub.wizard.next");
next.addEventListener("click", function () {
if (DZ_WIZARD.step < 3) { DZ_WIZARD.step += 1; dzWizardRender(); }
else { dzWizardSave(); }
});
if (!dialog.contains(document.activeElement)) { close.focus(); }
}
function dzWizardMockup(colors, label) {
var wrap = dzWizardEl("div", "dz-wizard-mock");
wrap.style.background = colors.background;
wrap.style.borderColor = colors.border;
var nav = dzWizardEl("div", "dz-wizard-mock-nav", wrap);
nav.style.background = colors.navbar;
nav.style.color = colors.main_text;
var dot = dzWizardEl("span", "dz-wizard-mock-dot", nav);
dot.style.background = colors.main_color;
nav.appendChild(document.createTextNode("Machinon"));
var body = dzWizardEl("div", "dz-wizard-mock-body", wrap);
var card = dzWizardEl("div", "dz-wizard-mock-card", body);
card.style.background = colors.item;
card.style.borderColor = colors.border;
var t = dzWizardEl("div", "dz-wizard-mock-t", card);
t.style.color = colors.main_text;
t.textContent = dzT("hub.wizard.preview.device");
var s = dzWizardEl("div", "dz-wizard-mock-s", card);
s.style.color = colors.alt_text;
s.textContent = dzT("hub.wizard.preview.status");
var v = dzWizardEl("div", "dz-wizard-mock-v", card);
v.style.color = colors.main_color;
v.textContent = dzT("hub.wizard.preview.value");
var card2 = dzWizardEl("div", "dz-wizard-mock-card", body);
card2.style.background = colors.item;
card2.style.borderColor = colors.border;
var t2 = dzWizardEl("div", "dz-wizard-mock-t", card2);
t2.style.color = colors.main_text;
t2.textContent = dzT("hub.wizard.preview.device2");
var s2 = dzWizardEl("div", "dz-wizard-mock-s", card2);
s2.style.color = colors.disabled;
s2.textContent = dzT("hub.wizard.preview.status2");
var row = dzWizardEl("div", "dz-wizard-mock-row", body);
var btn = dzWizardEl("span", "dz-wizard-mock-btn", row);
btn.style.background = colors.main_color;
btn.style.color = colors.accent_text;
btn.textContent = dzT("hub.wizard.apply");
[["error", "hub.wizard.preview.err"], ["success", "hub.wizard.preview.ok"], ["warning", "hub.wizard.preview.warn"]].forEach(function (pair) {
var chip = dzWizardEl("span", "dz-wizard-mock-chip", row);
chip.style.color = colors[pair[0]];
chip.style.borderColor = colors[pair[0]];
chip.textContent = dzT(pair[1]);
});
if (label) {
var cap = dzWizardEl("div", "dz-wizard-mock-cap", wrap);
cap.style.color = colors.alt_text;
cap.textContent = label;
}
return wrap;
}
function dzWizardSwatch(label, value, onChange, anchor) {
var built = dzBuildColorField(label, value, onChange, {
nativeEvent: "input",
disclosureAnchor: anchor
});
return built.wrap;
}
function dzWizardCurrentPair() {
return dzGenerateSchemePair({
accent: DZ_WIZARD.accent, surface: DZ_WIZARD.surface, look: DZ_WIZARD.look
});
}
function dzWizardPreviewRow(host, pair) {
var row = dzWizardEl("div", "dz-wizard-previews", host);
row.appendChild(dzWizardMockup(pair.light, dzT("hub.schemes.light")));
row.appendChild(dzWizardMockup(pair.dark, dzT("hub.schemes.dark")));
}
function dzWizardRefreshPreviews(host) {
var row = host.querySelector(".dz-wizard-previews");
if (!row) { return; }
row.textContent = "";
var pair = dzWizardCurrentPair();
row.appendChild(dzWizardMockup(pair.light, dzT("hub.schemes.light")));
row.appendChild(dzWizardMockup(pair.dark, dzT("hub.schemes.dark")));
}
function dzWizardStepColours(host) {
dzWizardEl("p", "dz-wizard-lead", host).textContent = dzT("hub.wizard.lead_colours");
var swatches = dzWizardEl("div", "dz-hub-swatches dz-wizard-swatches", host);
swatches.appendChild(dzWizardSwatch(dzT("hub.wizard.accent_label"), DZ_WIZARD.accent, function (value) {
if (!DZ_WIZARD) { return; }
DZ_WIZARD.accent = value;
dzWizardRefreshPreviews(host);
}, swatches));
if (DZ_WIZARD.surface !== null) {
swatches.appendChild(dzWizardSwatch(dzT("hub.wizard.surface_label"), DZ_WIZARD.surface, function (value) {
if (!DZ_WIZARD) { return; }
DZ_WIZARD.surface = value;
dzWizardRefreshPreviews(host);
}, swatches));
}
var toggleLabel = dzWizardEl("label", "dz-wizard-check", host);
var toggle = dzWizardEl("input", null, toggleLabel);
toggle.type = "checkbox";
toggle.checked = DZ_WIZARD.surface !== null;
dzWizardEl("span", null, toggleLabel).textContent = dzT("hub.wizard.tint_toggle");
toggle.addEventListener("change", function () {
DZ_WIZARD.surface = toggle.checked ? DZ_WIZARD.accent : null;
dzWizardRender();
});
if (DZ_WIZARD.surface !== null) {
dzWizardEl("p", "dz-wizard-hint", host).textContent = dzT("hub.wizard.hint_colours");
}
dzWizardPreviewRow(host, dzWizardCurrentPair());
}
function dzWizardStepLook(host) {
dzWizardEl("p", "dz-wizard-lead", host).textContent = dzT("hub.wizard.lead_look");
var grid = dzWizardEl("div", "dz-wizard-looks", host);
DZ_LOOK_ORDER.forEach(function (look) {
var opt = dzWizardEl("div", "dz-wizard-look", grid);
if (look === DZ_WIZARD.look) { opt.className += " is-selected"; }
opt.setAttribute("data-look", look);
var pair = dzGenerateSchemePair({
accent: DZ_WIZARD.accent, surface: DZ_WIZARD.surface, look: look
});
var row = dzWizardEl("div", "dz-wizard-look-pair", opt);
row.appendChild(dzWizardMockup(pair.light, null));
row.appendChild(dzWizardMockup(pair.dark, null));
dzWizardEl("div", "dz-wizard-look-name", opt).textContent = dzT("hub.wizard.looks." + look + ".label");
dzWizardEl("div", "dz-wizard-look-desc", opt).textContent = dzT("hub.wizard.looks." + look + ".description");
opt.addEventListener("click", function () {
DZ_WIZARD.look = look;
dzWizardRender();
});
});
}
function dzWizardAccentDrift(host, pair) {
var lightDrift = pair.light.main_color.toUpperCase() !== DZ_WIZARD.accent.toUpperCase();
var darkDrift = pair.dark.main_color.toUpperCase() !== DZ_WIZARD.accent.toUpperCase();
if (!lightDrift && !darkDrift) { return; }
var wrap = dzWizardEl("div", "dz-wizard-drift", host);
dzWizardEl("span", "dz-wizard-drift-label", wrap).textContent = dzT("hub.wizard.drift_label");
[[dzT("hub.schemes.light"), pair.light.main_color], [dzT("hub.schemes.dark"), pair.dark.main_color]].forEach(function (row) {
var line = dzWizardEl("span", "dz-wizard-drift-row", wrap);
var from = dzWizardEl("span", "dz-wizard-drift-chip", line);
from.style.background = DZ_WIZARD.accent;
line.appendChild(document.createTextNode(" → "));
var to = dzWizardEl("span", "dz-wizard-drift-chip", line);
to.style.background = row[1];
line.appendChild(document.createTextNode(" " + row[0]));
});
}
function dzWizardStepName(host) {
var pair = dzWizardCurrentPair();
var field = dzWizardEl("div", "dz-wizard-name-field", host);
var label = dzWizardEl("label", "dz-wizard-name-label", field);
label.textContent = dzT("hub.wizard.name_label");
label.setAttribute("for", "dz-wizard-name-input");
var input = dzWizardEl("input", "dz-wizard-name", field);
input.id = "dz-wizard-name-input";
input.type = "text";
input.maxLength = 40;
input.placeholder = dzT("hub.wizard.name_placeholder");
input.value = DZ_WIZARD.name;
var lead = dzWizardEl("p", "dz-wizard-lead", host);
function dzWizardNameSummary() {
var shown = DZ_WIZARD.name.trim() || dzT("hub.wizard.name_placeholder");
lead.textContent = dzT("hub.wizard.saved_lead", { name: shown });
}
dzWizardNameSummary();
input.addEventListener("input", function () {
DZ_WIZARD.name = input.value;
dzWizardNameSummary();
});
dzWizardPreviewRow(host, pair);
dzWizardAccentDrift(host, pair);
}
function dzWizardSave() {
var name = (DZ_WIZARD.name || "").trim();
if (!name) {
if (typeof generate_noty === "function") {
generate_noty("warning", dzT("toasts.wizard_name_first"), 4000);
}
return;
}
var nameError = dzSchemeNameError(name);
if (nameError) {
if (typeof generate_noty === "function") {
generate_noty("warning", nameError, 5000);
}
return;
}
var pair = dzWizardCurrentPair();
var problems = [];
["light", "dark"].forEach(function (variant) {
if (typeof schemeContrastFailures === "function") {
schemeContrastFailures(pair[variant]).forEach(function (f) {
problems.push(variant + ": " + f);
});
}
});
if (problems.length) {
console.log(themeName + " - generator produced a failing scheme:", problems);
if (typeof generate_noty === "function") {
generate_noty("error", dzT("toasts.wizard_unreadable"), 8000);
}
return;
}
var seed = { accent: DZ_WIZARD.accent, surface: DZ_WIZARD.surface, look: DZ_WIZARD.look };
dzSaveGeneratedPair(name, seed, pair);
dzCloseThemeWizard();
if (typeof generate_noty === "function") {
generate_noty("success", dzT("toasts.wizard_created", { name: name }), 4000);
}
}
