var DZ_HUB_ID = "dz-theme-hub";
var DZ_HUB_MENU_ID = "dzThemeHubMenu";
var DZ_HUB_MENU_OTHER_ID = "dzThemeHubMenuOther";
var DZ_HUB_LABEL = "Theme";
var dzHubActiveGroup = null;
function dzBuildHubMenuLi(id) {
var li = document.createElement("li");
li.id = id;
var a = document.createElement("a");
a.className = "lcursor";
a.setAttribute("href", "#/Theme");
a.setAttribute("onclick", "dzOpenThemeHub()");
function dzGuardHubMenuLinkClick(event) {
if (!window.dzRoutesActive) event.preventDefault();
}
a.addEventListener("click", dzGuardHubMenuLinkClick);
a.addEventListener("auxclick", dzGuardHubMenuLinkClick);
var img = document.createElement("img");
img.src = "images/settings/paint-palette.png";
var span = document.createElement("span");
span.setAttribute("data-i18n", DZ_HUB_LABEL);
span.textContent = DZ_HUB_LABEL;
a.appendChild(img);
a.appendChild(document.createTextNode(" "));
a.appendChild(span);
li.appendChild(a);
return li;
}
function dzInsertHubMenuEntry() {
var ul = document.querySelector("#appnavbar li[has-permission='Admin'] > ul");
if (!ul) {
console.warn("machinon_theme_hub", "setup_menu_ul_absent", "no #appnavbar Admin ul; hub entry not added (fail closed)");
return;
}
if (document.getElementById(DZ_HUB_MENU_ID)) return;
var li = dzBuildHubMenuLi(DZ_HUB_MENU_ID);
var settingsLi = null;
var settingsAnchor = ul.querySelector("a[href='#Setup'], a[href='#Settings'], a > span[data-i18n='Settings']");
if (settingsAnchor) settingsLi = settingsAnchor.closest("li");
if (!settingsLi || settingsLi.parentNode !== ul) {
console.warn("machinon_theme_hub", "settings_item_absent", "no Settings menu item to anchor to; hub entry not added (fail closed)");
return;
}
settingsLi.insertAdjacentElement("afterend", li);
dzHubSyncMenuActive();
}
function dzInsertHubMenuEntryOther() {
var ul = document.querySelector("#appnavbar li[has-login-no-admin] > ul");
if (!ul) {
console.warn("machinon_theme_hub", "other_menu_ul_absent", "no #appnavbar has-login-no-admin ul; hub entry not added (fail closed)");
return;
}
if (document.getElementById(DZ_HUB_MENU_OTHER_ID)) return;
var li = dzBuildHubMenuLi(DZ_HUB_MENU_OTHER_ID);
var logoutDivider = ul.querySelector("#dLogoutSetup");
if (logoutDivider && logoutDivider.parentNode === ul) {
ul.insertBefore(li, logoutDivider);
} else {
ul.appendChild(li);
}
dzHubSyncMenuActive();
}
function dzHubSyncMenuActive() {
if (!window.dzRoutesActive) return;
var onHub = location.hash.indexOf("#/Theme") === 0;
[DZ_HUB_MENU_ID, DZ_HUB_MENU_OTHER_ID].forEach(function (id) {
var li = document.getElementById(id);
if (li) li.classList.toggle("current_page_item", onHub);
});
}
function dzBuildThemeHub(routeHost) {
var built = document.getElementById(DZ_HUB_ID);
if (built) return routeHost ? dzAdoptHubInto(built, routeHost) : built;
if (typeof THEME_MANIFEST === "undefined" || !THEME_MANIFEST.length) {
console.warn("machinon_theme_hub", "manifest_absent", "THEME_MANIFEST missing; hub not built (fail closed)");
return null;
}
var mainView = document.getElementById("main-view");
if (!routeHost && (!mainView || !mainView.parentNode)) {
console.warn("machinon_theme_hub", "main_view_absent", "no #main-view mount point; hub not built (fail closed)");
return null;
}
var container = document.createElement("div");
container.id = DZ_HUB_ID;
if (!routeHost) container.style.display = "none";
var tabs = document.createElement("div");
tabs.className = "dz-hub-tabs";
tabs.setAttribute("role", "tablist");
tabs.setAttribute("aria-label", dzT("hub.tabs_label"));
tabs.addEventListener("keydown", function (e) {
var all = Array.prototype.slice.call(tabs.querySelectorAll(".dz-hub-tab"));
var i = all.indexOf(document.activeElement);
if (i < 0) return;
var next = null;
if (e.key === "ArrowRight") next = all[(i + 1) % all.length];
else if (e.key === "ArrowLeft") next = all[(i - 1 + all.length) % all.length];
else if (e.key === "Home") next = all[0];
else if (e.key === "End") next = all[all.length - 1];
if (!next) return;
e.preventDefault();
next.click();
next.focus();
});
var panel = document.createElement("div");
panel.className = "dz-hub-panel";
var hubIsAdmin = (typeof dzSettingsMode === "function") ? dzSettingsMode().admin !== false : true;
THEME_MANIFEST.forEach(function (group) {
if (group.adminOnly && !hubIsAdmin) return;
var item = document.createElement("button");
item.type = "button";
item.className = "dz-hub-tab";
item.setAttribute("data-group", group.id);
item.setAttribute("role", "tab");
item.id = "dz-hub-tab-" + group.id;
item.setAttribute("aria-controls", "dz-hub-panel-" + group.id);
item.textContent = dzT("hub.groups." + group.id);
item.addEventListener("click", function () { dzHubShowGroup(group.id); });
tabs.appendChild(item);
var section = document.createElement("section");
section.className = "dz-hub-section";
section.setAttribute("data-group", group.id);
section.id = "dz-hub-panel-" + group.id;
section.setAttribute("role", "tabpanel");
section.setAttribute("aria-labelledby", item.id);
var h = document.createElement("h2");
h.className = "dz-hub-section-title";
h.textContent = dzT("hub.groups." + group.id);
section.appendChild(h);
if (group.id === "general") { section.appendChild(dzBuildShortAbout()); }
dzRenderGroupRows(section, group);
panel.appendChild(section);
});
container.appendChild(tabs);
container.appendChild(panel);
if (routeHost) routeHost.appendChild(container);
else mainView.parentNode.insertBefore(container, mainView.nextSibling);
dzHubApplyLegacyReadOnlyLock();
if (typeof renderSchemePicker === "function") { renderSchemePicker(); }
if (typeof mountIconPackInHub === "function") { mountIconPackInHub(); }
var dzHubRestoreGroup = (dzHubActiveGroup && dzHubHasGroup(dzHubActiveGroup)) ? dzHubActiveGroup : THEME_MANIFEST[0].id;
dzHubShowGroup(dzHubRestoreGroup);
return container;
}
var DZ_HUB_ABOUT_ID = "dz-hub-about";
function dzHubVersionLabel() {
var v = (typeof theme !== "undefined" && theme && theme.version) ? theme.version : "";
if (typeof branch !== "undefined" && branch === "beta") return v + " " + branch;
return v;
}
function dzBuildHubAbout() {
if (typeof theme === "undefined" || !theme || !theme.version) {
console.warn("machinon_theme_hub", "about_theme_absent", "theme.json not loaded; About footer omitted (fail closed)");
return null;
}
var about = document.createElement("section");
about.id = DZ_HUB_ABOUT_ID;
about.className = "dz-hub-about";
about.setAttribute("aria-label", dzT("hub.about.aria"));
var title = document.createElement("h2");
title.className = "dz-hub-about-title";
title.textContent = dzT("hub.about.title", { version: dzHubVersionLabel() });
about.appendChild(title);
var desc = document.createElement("p");
desc.className = "dz-hub-about-desc";
desc.textContent = dzT("hub.about.description");
about.appendChild(desc);
var credits = document.createElement("div");
credits.className = "dz-hub-about-credits";
var creditsHeading = document.createElement("h3");
creditsHeading.className = "dz-hub-about-credits-title";
creditsHeading.textContent = dzT("hub.about.contributions");
credits.appendChild(creditsHeading);
[
{ role: dzT("hub.about.role_design"), people: [["EdddieN", "https://github.com/EdddieN"]] },
{ role: dzT("hub.about.role_code"), people: [
["davidlb", "https://github.com/davidlb"],
["DewGew", "https://github.com/DewGew"],
["landaisbenj", "https://github.com/landaisbenj"],
["Rouzax", "https://github.com/Rouzax"]
] }
].forEach(function(group) {
var line = document.createElement("p");
line.className = "dz-hub-about-credit-line";
var label = document.createElement("span");
label.className = "dz-hub-about-credit-role";
label.textContent = group.role + ": ";
line.appendChild(label);
group.people.forEach(function(person, i) {
if (i) line.appendChild(document.createTextNode(", "));
line.appendChild(dzHubExternalLink(person[1], person[0]));
});
credits.appendChild(line);
});
about.appendChild(credits);
var links = document.createElement("p");
links.className = "dz-hub-about-links";
if (theme.homepage) links.appendChild(dzHubExternalLink(theme.homepage, dzT("hub.about.link_repo")));
if (theme.wiki) {
if (links.childNodes.length) links.appendChild(document.createTextNode(" "));
links.appendChild(dzHubExternalLink(theme.wiki, dzT("hub.about.link_wiki")));
}
if (links.childNodes.length) about.appendChild(links);
var credit = document.createElement("p");
credit.className = "dz-hub-about-credit";
credit.appendChild(dzHubExternalLink("https://icons8.com/", dzT("hub.about.icons8_credit")));
about.appendChild(credit);
return about;
}
function dzHubExternalLink(href, text) {
var a = document.createElement("a");
a.className = "dz-hub-about-link";
a.href = href;
a.target = "_blank";
a.rel = "noopener noreferrer";
a.textContent = text;
return a;
}
function dzBuildShortAbout() {
var box = document.createElement("div");
box.id = "dz-hub-short-about";
box.className = "dz-hub-short-about";
var title = document.createElement("div");
title.className = "dz-hub-short-about-title";
title.textContent = dzT("hub.about.title", { version: dzHubVersionLabel() });
box.appendChild(title);
var desc = document.createElement("p");
desc.className = "dz-hub-short-about-desc";
desc.textContent = dzT("hub.about.short_description");
box.appendChild(desc);
return box;
}
function dzHubAboutMount(entry) {
var mount = document.createElement("div");
mount.className = "dz-hub-custom-mount";
mount.setAttribute("data-custom", entry.key);
var about = dzBuildHubAbout();
if (about) mount.appendChild(about);
mount.appendChild(dzBuildMaintenanceBlock());
return mount;
}
function dzBuildMaintenanceBlock() {
var block = document.createElement("section");
block.id = "dz-hub-maintenance";
block.className = "dz-hub-maintenance";
block.setAttribute("aria-label", dzT("hub.maintenance.aria"));
var title = document.createElement("h3");
title.className = "dz-hub-maintenance-title";
title.textContent = dzT("hub.maintenance.title");
block.appendChild(title);
var note = document.createElement("p");
note.className = "dz-hub-maintenance-note";
note.textContent = dzT("hub.maintenance.note");
block.appendChild(note);
var actions = document.createElement("div");
actions.className = "dz-hub-maintenance-actions";
actions.appendChild(dzHubMaintenanceButton(
"dz-hub-reset-theme", dzT("hub.maintenance.reset_theme"),
dzT("hub.maintenance.reset_theme_confirm"),
dzHubDoResetTheme));
actions.appendChild(dzHubMaintenanceButton(
"dz-hub-clear-cache", dzT("hub.maintenance.clear_cache"),
dzT("hub.maintenance.clear_cache_confirm"),
dzHubDoClearCache));
actions.appendChild(dzHubMaintenanceButton(
"dz-hub-reset-colors", dzT("hub.maintenance.reset_colors"),
dzT("hub.maintenance.reset_colors_confirm"),
dzHubDoResetColors));
var mode = dzSettingsMode();
if (mode.api) {
if (mode.admin && mode.perUser) {
actions.appendChild(dzHubActionButton(
"dz-hub-promote", "btn btn-primary dz-hub-promote-btn",
dzT("hub.maintenance.promote"), dzHubPromote));
}
if (mode.perUser) {
actions.appendChild(dzHubActionButton(
"dz-hub-reset-mine", "btn btn-danger dz-hub-reset-mine-btn",
dzT("hub.maintenance.reset_mine"), dzHubResetMine));
}
if (mode.admin) {
actions.appendChild(dzHubActionButton(
"dz-hub-reset-house", "btn btn-danger dz-hub-reset-house-btn",
dzT("hub.maintenance.reset_house"), dzHubResetHouse));
}
}
block.appendChild(actions);
return block;
}
function dzHubMaintenanceButton(id, label, confirmMsg, action) {
var btn = document.createElement("button");
btn.type = "button";
btn.id = id;
btn.className = "btn btn-danger dz-hub-maintenance-btn";
btn.textContent = label;
btn.addEventListener("click", function () { dzHubConfirm(confirmMsg, action); });
return btn;
}
function dzHubActionButton(id, className, label, onClick) {
var btn = document.createElement("button");
btn.type = "button";
btn.id = id;
btn.className = className;
btn.textContent = label;
btn.addEventListener("click", onClick);
return btn;
}
function dzHubConfirm(message, onConfirm) {
if (typeof bootbox !== "undefined" && bootbox.confirm) {
bootbox.confirm({
className: "rubberBand animated",
message: message,
callback: function (result) { if (result) onConfirm(); }
});
return;
}
if (window.confirm(message)) { onConfirm(); }
}
function dzHubDoResetTheme() {
var mode = dzSettingsMode();
if (!mode.api) {
if (typeof resetTheme === "function") { resetTheme(); }
return;
}
var jobs = [];
if (mode.admin) jobs.push(dzApiResetHouse());
if (mode.perUser) jobs.push(dzApiResetUser());
if (!jobs.length) { location.reload(); return; }
Promise.all(jobs).then(function (results) {
var ok = results.filter(function (r) { return r.ok; }).length;
if (ok === 0) return;
if (ok < results.length) {
var msg = dzT("hub.maintenance.reset_partial");
if (typeof bootbox === "object" && typeof bootbox.alert === "function") {
bootbox.alert(msg, function () { dzHubDoClearCache(); });
return;
}
if (typeof ShowNotify === "function") { ShowNotify(msg, 6000); }
}
dzHubDoClearCache();
});
}
function dzHubDoClearCache() {
try {
if (typeof Storage !== "undefined") { localStorage.removeItem(themeFolder + ".themeSettings"); }
} catch (e) { }
location.reload();
}
function dzHubDoResetColors() {
if (typeof getSchemeDefaults !== "function") return;
var d = getSchemeDefaults();
theme.color_scheme = {
background: d.bg, main_color: d.main, navbar: d.navbar, item: d.item,
main_text: d.text, alt_text: d.alt_text, disabled: d.disabled
};
if (typeof applyCustomColorScheme === "function") { applyCustomColorScheme(theme.color_scheme); }
if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
cacheThemeSettings();
dzHubPersist();
}
function dzHubPromote() {
dzHubConfirm(
dzT("hub.maintenance.promote_confirm"),
function () {
dzApiPromote().then(function (r) {
if (r.ok && typeof ShowNotify === "function") ShowNotify(dzT("hub.maintenance.promote_done"), 3000);
});
}
);
}
function dzHubResetMine() {
dzHubConfirm(
dzT("hub.maintenance.reset_mine_confirm"),
function () {
dzApiResetUser().then(function (r) { if (r.ok) location.reload(); });
}
);
}
function dzHubResetHouse() {
dzHubConfirm(
dzT("hub.maintenance.reset_house_confirm"),
function () {
dzApiResetHouse().then(function (r) { if (r.ok) location.reload(); });
}
);
}
function dzHubBuildImageEditor() {
var editor = document.createElement("div");
editor.id = "dz-hub-image-editor";
editor.className = "dz-hub-image-editor";
var on = !!(theme.features && theme.features.icon_image && theme.features.icon_image.enabled === true);
editor.hidden = !on;
var help = document.createElement("p");
help.className = "dz-hub-image-help";
help.textContent = dzT("hub.imageEditor.help");
editor.appendChild(help);
var list = document.createElement("div");
list.className = "dz-hub-image-list";
editor.appendChild(list);
var addRow = document.createElement("div");
addRow.className = "dz-hub-image-add";
var idxInput = document.createElement("input");
idxInput.type = "number";
idxInput.min = "1";
idxInput.className = "dz-hub-image-idx";
idxInput.setAttribute("aria-label", dzT("hub.imageEditor.idx_aria"));
idxInput.placeholder = dzT("hub.imageEditor.idx_placeholder");
var imgInput = document.createElement("input");
imgInput.type = "text";
imgInput.className = "dz-hub-image-img";
imgInput.setAttribute("aria-label", dzT("hub.imageEditor.img_aria"));
imgInput.placeholder = "image.png";
var addBtn = document.createElement("button");
addBtn.type = "button";
addBtn.className = "btn btn-primary dz-hub-image-add-btn";
addBtn.textContent = dzT("hub.imageEditor.add");
var addError = document.createElement("div");
addError.className = "dz-hub-image-add-error";
addBtn.addEventListener("click", function () {
var idx = idxInput.value.trim();
var img = imgInput.value.trim();
var idxBad = !/^\d+$/.test(idx);
var imgBad = !img || dzThemeImageName(img) === null;
dzHubFieldError(addError, idxInput, null);
dzHubFieldError(addError, imgInput, null);
if (idxBad) { dzHubFieldError(addError, idxInput, dzT("hub.imageEditor.idx_invalid")); return; }
if (imgBad) { dzHubFieldError(addError, imgInput, dzT("hub.invalid_image_name")); return; }
dzHubImageAdd(idx, img);
idxInput.value = "";
imgInput.value = "";
dzHubRenderImageList(list);
});
idxInput.id = "dz-hub-image-idx";
imgInput.id = "dz-hub-image-img";
addRow.appendChild(idxInput);
addRow.appendChild(imgInput);
addRow.appendChild(addBtn);
editor.appendChild(addRow);
editor.appendChild(addError);
dzHubRenderImageList(list);
return editor;
}
function dzHubRenderImageList(list) {
list.textContent = "";
var icons = (theme && Array.isArray(theme.icons)) ? theme.icons : [];
if (!icons.length) {
var empty = document.createElement("p");
empty.className = "dz-hub-image-empty";
empty.textContent = dzT("hub.imageEditor.empty");
list.appendChild(empty);
return;
}
icons.forEach(function (m, i) {
var row = document.createElement("div");
row.className = "dz-hub-image-row";
var idxCell = document.createElement("span");
idxCell.className = "dz-hub-image-cell";
idxCell.textContent = dzT("hub.imageEditor.idx_cell", { idx: m.idx });
var imgCell = document.createElement("span");
imgCell.className = "dz-hub-image-cell dz-hub-image-name";
imgCell.textContent = m.img;
var refused = dzThemeImageName(m.img) === null;
var rm = document.createElement("button");
rm.type = "button";
rm.className = "btn btn-danger dz-hub-image-remove";
rm.textContent = dzT("hub.imageEditor.remove");
rm.setAttribute("aria-label", dzT("hub.imageEditor.remove_aria", { idx: m.idx }));
rm.addEventListener("click", function () { dzHubImageRemove(i); dzHubRenderImageList(list); });
row.appendChild(idxCell);
row.appendChild(imgCell);
row.appendChild(rm);
if (refused) {
var why = document.createElement("p");
why.className = "dz-hub-field-error";
why.textContent = dzT("hub.invalid_image_name");
row.appendChild(why);
}
list.appendChild(row);
});
}
function dzHubImageAdd(idx, img) {
theme.icons = Array.isArray(theme.icons) ? theme.icons : [];
theme.icons = theme.icons.filter(function (m) { return String(m.idx) !== String(idx); });
theme.icons.push({ idx: idx, img: img });
dzHubPersistImages();
}
function dzHubImageRemove(i) {
if (!Array.isArray(theme.icons)) return;
theme.icons.splice(i, 1);
dzHubPersistImages();
}
function dzHubPersistImages() {
cacheThemeSettings();
dzHubPersist();
if (typeof setAllDevicesFeatures === "function") { setAllDevicesFeatures(); }
}
function dzHubToggleImageEditor(show) {
var hub = document.getElementById(DZ_HUB_ID);
var ed = hub && hub.querySelector("#dz-hub-image-editor");
if (ed) ed.hidden = !show;
}
function dzHubShowGroup(groupId) {
var hub = document.getElementById(DZ_HUB_ID);
if (!hub) return;
if (!hub.querySelector('.dz-hub-section[data-group="' + groupId + '"]')) {
var first = hub.querySelector(".dz-hub-section[data-group]");
if (!first) return;
groupId = first.getAttribute("data-group");
}
dzHubActiveGroup = groupId;
hub.querySelectorAll(".dz-hub-section").forEach(function (s) {
s.style.display = s.getAttribute("data-group") === groupId ? "" : "none";
});
var activeTab = null;
hub.querySelectorAll(".dz-hub-tab").forEach(function (it) {
var on = it.getAttribute("data-group") === groupId;
it.classList.toggle("is-active", on);
it.setAttribute("aria-selected", on ? "true" : "false");
it.tabIndex = on ? 0 : -1;
if (on) activeTab = it;
});
if (activeTab && typeof activeTab.scrollIntoView === "function") {
activeTab.scrollIntoView({ inline: "nearest", block: "nearest" });
}
}
function dzAdoptHubInto(hub, routeHost) {
if (hub.parentNode !== routeHost) routeHost.appendChild(hub);
hub.style.display = "";
var mainView = document.getElementById("main-view");
if (mainView && mainView.style.display === "none") mainView.style.display = "";
return hub;
}
function dzMountThemeHubIn(host, tab) {
var hub = dzBuildThemeHub(host);
if (!hub) return null;
if (tab) {
if (dzHubHasGroup(tab)) dzHubShowGroup(tab);
else console.warn("machinon_routes", "unknown_hub_group", "no hub group '" + tab + "'; showing " + dzHubActiveGroup);
}
dzHubSyncMenuActive();
return hub;
}
function dzHubHasGroup(id) {
if (typeof THEME_MANIFEST === "undefined") return false;
return THEME_MANIFEST.some(function (group) { return group.id === id; });
}
function dzOpenThemeHub() {
if (window.dzRoutesActive) {
dzThemeNavigate("#/Theme");
return;
}
var hub = dzBuildThemeHub();
var mainView = document.getElementById("main-view");
if (!hub || !mainView) return;
mainView.style.display = "none";
hub.style.display = "";
window.addEventListener("hashchange", dzCloseThemeHubOnLeave);
if (window.jQuery) jQuery(".navbar-inner").removeClass("slide");
}
function dzCloseThemeHubOnLeave() {
window.removeEventListener("hashchange", dzCloseThemeHubOnLeave);
var hub = document.getElementById(DZ_HUB_ID);
var mainView = document.getElementById("main-view");
if (mainView) mainView.style.display = "";
if (hub) hub.style.display = "none";
}
var DZ_HUB_APPLIERS = {
card_min_width: applyCardWidths,
card_max_width: applyCardWidths,
logo: setLogo,
hide_logo: setLogo,
button_name: dzApplyCustomPageLabel,
background_img: applyBackground,
background_type: applyBackground,
navbar_icons_text: applyNavbarIconsText
};
var DZ_HUB_INPUT_META = {
standby_after: { min: 1 },
dashboard_camera_refresh: { min: 1 },
card_min_width: { min: 200, max: 800 },
card_max_width: { min: 250, max: 1200 },
background_type: { options: ["cover", "pattern"] },
warn_repeat: { options: ["visit", "daily", "episode"] }
};
function dzHubCurrentValue(entry) {
var v = theme[entry.storageKey];
return (v === null || v === undefined) ? "" : v;
}
function dzRenderGroupRows(section, group) {
var byKey = {};
group.entries.forEach(function (entry) {
if (entry.parent) return;
if (entry.control === "custom") { section.appendChild(dzHubCustomMount(entry)); return; }
var row = dzRenderHubRow(entry);
byKey[entry.key] = row;
section.appendChild(row);
});
group.entries.forEach(function (entry) {
if (!entry.parent) return;
var childRow = entry.control === "custom" ? dzHubCustomMount(entry) : dzRenderHubRow(entry);
var parentRow = byKey[entry.parent];
if (!parentRow) { section.appendChild(childRow); return; }
var kids = parentRow.querySelector(".dz-hub-children") || parentRow;
kids.appendChild(childRow);
var parentOn = !!(theme.features && theme.features[entry.parent] && theme.features[entry.parent].enabled === true);
if (!parentOn) dzHubSetRowDisabled(childRow, true);
});
}
function dzHubCustomHeader(entry) {
var frag = document.createDocumentFragment();
var label = document.createElement("div");
label.className = "dz-hub-label";
label.textContent = dzT("hub.settings." + entry.key + ".label");
var desc = document.createElement("p");
desc.className = "dz-hub-desc";
desc.textContent = dzT("hub.settings." + entry.key + ".description");
frag.appendChild(label);
frag.appendChild(desc);
return frag;
}
function dzHubCustomPlaceholder(entry) {
var mount = document.createElement("div");
mount.className = "dz-hub-custom-mount";
mount.setAttribute("data-custom", entry.key);
mount.appendChild(dzHubCustomHeader(entry));
return mount;
}
function dzHubCustomMount(entry) {
if (entry.key === "diagnostics_copy") return dzHubDiagCopyMount(entry);
if (entry.key === "scheme") return dzHubSchemeMount(entry);
if (entry.key === "custom_color_scheme") return dzHubCustomColorsMount(entry);
if (entry.key === "iconpacks") return dzHubIconPacksMount(entry);
if (entry.key === "about") return dzHubAboutMount(entry);
return dzHubCustomPlaceholder(entry);
}
function dzHubDiagCopyMount(entry) {
var mount = document.createElement("div");
mount.className = "dz-hub-row dz-hub-row-child dz-hub-diag";
mount.setAttribute("data-setting", "diagnostics_copy");
mount.id = "dz-hub-diagnostics-copy";
var label = document.createElement("div");
label.className = "dz-hub-label";
label.textContent = dzT("hub.settings.diagnostics_copy.label");
mount.appendChild(label);
var hint = document.createElement("p");
hint.className = "dz-hub-desc";
hint.textContent = dzT("hub.diag.hint");
mount.appendChild(hint);
var status = document.createElement("p");
status.className = "dz-hub-desc dz-hub-diag-status";
status.setAttribute("role", "status");
var area = document.createElement("textarea");
area.className = "dz-hub-diag-fallback";
area.readOnly = true;
area.hidden = true;
area.rows = 6;
function showFallback(text) {
area.value = text;
area.hidden = false;
status.textContent = dzT("hub.diag.fallback");
try { area.focus(); area.select(); } catch (e) { }
}
var btn = dzHubActionButton("dz-hub-diag-copy", "btn btn-primary dz-hub-diag-copy-btn",
dzT("hub.diag.copy"), function() {
var text;
try { text = machinonDiagText(); }
catch (e) { status.textContent = String(e && e.message ? e.message : e); return; }
area.hidden = true;
if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(text).then(function() {
status.textContent = dzT("hub.diag.copied");
}, function() { showFallback(text); });
return;
}
showFallback(text);
});
mount.appendChild(btn);
mount.appendChild(status);
mount.appendChild(area);
return mount;
}
function dzHubIconPacksMount(entry) {
var mount = document.createElement("div");
mount.className = "dz-hub-custom-mount";
mount.setAttribute("data-custom", entry.key);
mount.appendChild(dzHubCustomHeader(entry));
var container = document.createElement("section");
container.id = "iconpack";
container.textContent = dzT("hub.loading");
mount.appendChild(container);
return mount;
}
var DZ_HUB_SCHEME_PICKER_ID = "dzHubSchemePicker";
var DZ_HUB_COLOR_INPUT_PREFIX = "dz-hub-color-";
function dzHubSchemeMount(entry) {
var mount = document.createElement("div");
mount.className = "dz-hub-custom-mount";
mount.setAttribute("data-custom", entry.key);
mount.appendChild(dzHubCustomHeader(entry));
var actions = document.createElement("div");
actions.className = "dz-hub-swatch-actions";
var createBtn = document.createElement("button");
createBtn.type = "button";
createBtn.className = "btn btn-primary dz-hub-wizard-btn";
createBtn.textContent = dzT("hub.wizard.title");
createBtn.addEventListener("click", function () {
if (typeof dzOpenThemeWizard === "function") { dzOpenThemeWizard(); }
});
actions.appendChild(createBtn);
mount.appendChild(actions);
var picker = document.createElement("div");
picker.id = DZ_HUB_SCHEME_PICKER_ID;
picker.className = "dz-hub-scheme-picker";
mount.appendChild(picker);
if (typeof registerSchemePickerContainer === "function") {
registerSchemePickerContainer(DZ_HUB_SCHEME_PICKER_ID);
}
return mount;
}
var DZ_COLOR_FIELD_DISCLOSURE = null;
var DZ_COLOR_FIELD_ACTIVE = null;
var DZ_COLOR_FIELD_WHEEL_SIZE = 180;
function dzColorFieldHsvToRgb(h, s, v) {
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
function dzColorFieldRgbToHsv(r, g, b) {
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
function dzColorFieldToHex2(n) { return ("0" + n.toString(16)).slice(-2); }
function dzColorFieldRgbToHex(r, g, b) {
return "#" + dzColorFieldToHex2(r) + dzColorFieldToHex2(g) + dzColorFieldToHex2(b);
}
function dzColorFieldParseHex(raw) {
var m = /^#?([0-9a-f]{6})$/i.exec(String(raw || "").trim());
return m ? ("#" + m[1]).toUpperCase() : null;
}
function dzBuildColorField(label, value, onChange, opts) {
opts = opts || {};
var wrap = document.createElement("div");
wrap.className = "dz-color-field";
var cell = document.createElement("label");
cell.className = "dz-hub-swatch";
var span = document.createElement("span");
span.className = "dz-hub-swatch-label";
span.textContent = label;
cell.appendChild(span);
var input = document.createElement("input");
input.type = "color";
input.className = "dz-hub-swatch-input";
if (opts.inputId) input.id = opts.inputId;
if (opts.dataColorKey) input.setAttribute("data-color-key", opts.dataColorKey);
input.value = value || "#000000";
if (opts.disabled) input.disabled = true;
cell.appendChild(input);
wrap.appendChild(cell);
var wheelBtn = document.createElement("button");
wheelBtn.type = "button";
wheelBtn.className = "dz-color-field-wheel-btn";
wheelBtn.disabled = !!opts.disabled;
wheelBtn.setAttribute("aria-label", dzT("hub.schemes.wheel_aria", { label: label }));
var icon = document.createElement("i");
icon.className = "icon ion-md-color-palette";
wheelBtn.appendChild(icon);
wrap.appendChild(wheelBtn);
var field = {
wrap: wrap,
input: input,
anchor: opts.disclosureAnchor || wrap,
label: label,
liveWheel: (opts.nativeEvent || "change") === "input",
commit: function (hex) {
input.value = hex;
onChange(hex.toUpperCase());
}
};
input.addEventListener(opts.nativeEvent || "change", function () {
onChange(input.value.toUpperCase());
if (DZ_COLOR_FIELD_ACTIVE === field) { dzColorFieldPaint(input.value); }
});
wheelBtn.addEventListener("click", function () { dzColorFieldToggle(field); });
return field;
}
function dzColorFieldDisclosure() {
if (!DZ_COLOR_FIELD_DISCLOSURE) {
DZ_COLOR_FIELD_DISCLOSURE = document.createElement("div");
DZ_COLOR_FIELD_DISCLOSURE.className = "dz-color-field-disclosure";
}
return DZ_COLOR_FIELD_DISCLOSURE;
}
function dzColorFieldClose() {
if (!DZ_COLOR_FIELD_DISCLOSURE) return;
if (DZ_COLOR_FIELD_DISCLOSURE.parentNode) {
DZ_COLOR_FIELD_DISCLOSURE.parentNode.removeChild(DZ_COLOR_FIELD_DISCLOSURE);
}
DZ_COLOR_FIELD_DISCLOSURE.textContent = "";
DZ_COLOR_FIELD_ACTIVE = null;
}
function dzColorFieldToggle(field) {
if (DZ_COLOR_FIELD_ACTIVE === field) { dzColorFieldClose(); return; }
dzColorFieldOpen(field);
}
function dzColorFieldOpen(field) {
if (field.input.disabled) return;
var panel = dzColorFieldDisclosure();
panel.textContent = "";
DZ_COLOR_FIELD_ACTIVE = field;
var head = document.createElement("div");
head.className = "dz-color-field-disclosure-head";
var title = document.createElement("span");
title.className = "dz-color-field-disclosure-title";
title.textContent = field.label;
var close = document.createElement("button");
close.type = "button";
close.className = "dz-color-field-disclosure-close";
close.setAttribute("aria-label", dzT("common.close"));
var closeIcon = document.createElement("i");
closeIcon.className = "icon ion-md-close";
close.appendChild(closeIcon);
close.addEventListener("click", dzColorFieldClose);
head.appendChild(title);
head.appendChild(close);
panel.appendChild(head);
var wheelWrap = document.createElement("div");
wheelWrap.className = "dz-color-field-wheel-wrap";
var canvas = document.createElement("canvas");
canvas.className = "dz-color-field-wheel";
canvas.width = DZ_COLOR_FIELD_WHEEL_SIZE;
canvas.height = DZ_COLOR_FIELD_WHEEL_SIZE;
wheelWrap.appendChild(canvas);
panel.appendChild(wheelWrap);
var readout = document.createElement("div");
readout.className = "dz-color-field-readout";
var swatch = document.createElement("span");
swatch.className = "dz-color-field-swatch";
var hex = document.createElement("input");
hex.type = "text";
hex.className = "dz-color-field-hex";
hex.maxLength = 7;
hex.autocomplete = "off";
hex.setAttribute("aria-label", dzT("hub.schemes.hex_aria", { label: field.label }));
readout.appendChild(swatch);
readout.appendChild(hex);
panel.appendChild(readout);
field.anchor.insertAdjacentElement("afterend", panel);
function paintFrom(hexValue) {
var parsed = dzColorFieldParseHex(hexValue);
if (!parsed) return;
var v = parseInt(parsed.slice(1), 16);
var r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
swatch.style.background = "rgb(" + r + "," + g + "," + b + ")";
hex.value = parsed;
field.input.value = parsed;
if (typeof window.dzDrawColorWheel === "function") {
var hsv = dzColorFieldRgbToHsv(r, g, b);
window.dzDrawColorWheel(canvas, DZ_COLOR_FIELD_WHEEL_SIZE, hsv.h * 360, hsv.s);
}
}
field.paint = paintFrom;
paintFrom(field.input.value);
hex.addEventListener("change", function () {
var parsed = dzColorFieldParseHex(hex.value);
if (!parsed) { paintFrom(field.input.value); return; }
paintFrom(parsed);
field.commit(parsed);
});
function onWheelPick(hueDegrees, saturation) {
var rgb = dzColorFieldHsvToRgb((((hueDegrees % 360) + 360) % 360) / 360, saturation, 1);
var liveHex = dzColorFieldRgbToHex(rgb.r, rgb.g, rgb.b);
paintFrom(liveHex);
if (field.liveWheel) { field.commit(liveHex); }
}
function onWheelCommit() {
var parsed = dzColorFieldParseHex(hex.value) || field.input.value;
field.commit(parsed);
}
function reclaimWheelSingleton() {
if (typeof window.dzReclaimColorWheel === "function") {
window.dzReclaimColorWheel(canvas, DZ_COLOR_FIELD_WHEEL_SIZE, onWheelPick, onWheelCommit);
}
}
if (typeof window.dzAttachColorWheel === "function") {
canvas.addEventListener("mousedown", reclaimWheelSingleton);
canvas.addEventListener("touchstart", reclaimWheelSingleton);
window.dzAttachColorWheel(canvas, DZ_COLOR_FIELD_WHEEL_SIZE, onWheelPick, onWheelCommit);
}
}
function dzColorFieldPaint(hex) {
if (DZ_COLOR_FIELD_ACTIVE && typeof DZ_COLOR_FIELD_ACTIVE.paint === "function") {
DZ_COLOR_FIELD_ACTIVE.paint(hex);
}
}
function dzHubCustomColorsMount(entry) {
var mount = document.createElement("div");
mount.className = "dz-hub-custom-mount";
mount.setAttribute("data-custom", entry.key);
mount.appendChild(dzHubCustomHeader(entry));
var row = document.createElement("div");
row.className = "dz-hub-swatches";
DZ_COLOR_SCHEME_FIELDS.forEach(function (field) {
row.appendChild(dzHubBuildColorSwatch(field, row));
});
mount.appendChild(row);
var actions = document.createElement("div");
actions.className = "dz-hub-swatch-actions";
var saveBtn = document.createElement("button");
saveBtn.type = "button";
saveBtn.className = "btn btn-primary dz-hub-swatch-save-btn";
saveBtn.textContent = dzT("hub.schemes.save_preset");
saveBtn.addEventListener("click", function () {
if (typeof bootbox === "undefined" || typeof saveCurrentColorsAsScheme !== "function") return;
bootbox.prompt(dzT("hub.schemes.preset_name_prompt"), function (name) {
if (name) { saveCurrentColorsAsScheme(name); }
});
});
actions.appendChild(saveBtn);
mount.appendChild(actions);
return mount;
}
function dzHubBuildColorSwatch(field, anchor) {
var current = (theme.color_scheme && theme.color_scheme[field.field]) || "#000000";
var built = dzBuildColorField(dzT("hub.schemes.swatches." + field.field), current, function (hex) {
theme.color_scheme = theme.color_scheme || {};
theme.color_scheme[field.field] = hex;
applyCustomColorScheme(theme.color_scheme);
cacheThemeSettings();
dzHubPersist();
warnIfContrastFails(theme.color_scheme, dzT("hub.schemes.wcag_what_custom"));
}, {
inputId: DZ_HUB_COLOR_INPUT_PREFIX + field.suffix,
dataColorKey: field.suffix,
disabled: theme.scheme !== "custom",
nativeEvent: "change",
disclosureAnchor: anchor
});
return built.wrap;
}
function dzHubSyncSchemeSwatches() {
var hub = document.getElementById(DZ_HUB_ID);
if (!hub) return;
var isCustom = theme.scheme === "custom";
var cs = theme.color_scheme || {};
DZ_COLOR_SCHEME_FIELDS.forEach(function (field) {
var input = hub.querySelector("#" + DZ_HUB_COLOR_INPUT_PREFIX + field.suffix);
if (!input) return;
if (cs[field.field]) {
input.value = cs[field.field];
if (DZ_COLOR_FIELD_ACTIVE && DZ_COLOR_FIELD_ACTIVE.input === input) {
dzColorFieldPaint(input.value);
}
}
input.disabled = !isCustom;
var wrap = input.closest(".dz-color-field");
var wheelBtn = wrap && wrap.querySelector(".dz-color-field-wheel-btn");
if (wheelBtn) {
wheelBtn.disabled = !isCustom;
if (!isCustom && DZ_COLOR_FIELD_ACTIVE && DZ_COLOR_FIELD_ACTIVE.input === input) {
dzColorFieldClose();
}
}
});
}
function dzRenderHubRow(entry) {
var row = document.createElement("div");
row.className = "dz-hub-row";
row.setAttribute("data-setting", entry.key);
if (entry.parent) row.classList.add("dz-hub-row-child");
if (entry.control !== "toggle") row.classList.add("dz-hub-row-input");
var controlCell = document.createElement("div");
controlCell.className = "dz-hub-control";
var control = dzHubBuildControl(entry);
if (control) controlCell.appendChild(control);
var textCell = document.createElement("div");
textCell.className = "dz-hub-text";
var labelLine = document.createElement("div");
labelLine.className = "dz-hub-label-line";
var label = document.createElement("label");
label.className = "dz-hub-label";
label.textContent = dzT("hub.settings." + entry.key + ".label");
if (control && control.id) label.setAttribute("for", control.id);
labelLine.appendChild(label);
if (entry.appliesTo) {
var tag = document.createElement("span");
tag.className = "dz-hub-tag";
tag.textContent = dzT("hub.appliesTo." + entry.appliesTo);
labelLine.appendChild(tag);
}
if (entry.scope === "house" && dzSettingsMode().perUser) {
var houseChip = document.createElement("span");
houseChip.className = "dz-hub-chip-house";
houseChip.title = dzT("hub.house_managed");
houseChip.textContent = dzT("hub.house_badge");
labelLine.appendChild(houseChip);
if (!dzSettingsMode().admin) {
row.classList.add("dz-hub-row-locked");
if (control) control.disabled = true;
}
}
textCell.appendChild(labelLine);
var desc = document.createElement("p");
desc.className = "dz-hub-desc";
desc.textContent = dzT("hub.settings." + entry.key + ".description");
textCell.appendChild(desc);
if (entry.reloadOnDisable) textCell.appendChild(dzHubBuildReloadNote(entry));
if (DZ_HUB_IMAGE_NAME_KEYS[entry.key] && control && dzHubImageNameRefused(control.value)) {
dzHubFieldError(textCell, control, dzT("hub.invalid_image_name"));
}
var preview = document.createElement("div");
preview.className = "dz-hub-preview";
if (entry.previewId) {
preview.setAttribute("data-preview", entry.previewId);
var mini = (typeof dzRenderPreview === "function") ? dzRenderPreview(entry.previewId, entry) : null;
if (mini) preview.appendChild(mini);
}
row.appendChild(controlCell);
row.appendChild(textCell);
row.appendChild(preview);
if (!entry.parent) {
var kids = document.createElement("div");
kids.className = "dz-hub-children";
row.appendChild(kids);
}
if (entry.key === "icon_image") { row.appendChild(dzHubBuildImageEditor()); }
return row;
}
var DZ_HUB_IMAGE_NAME_KEYS = { logo: true };
function dzHubImageNameRefused(value) {
var v = String(value == null ? "" : value).trim();
return v !== "" && dzThemeImageName(v) === null;
}
function dzHubFieldError(anchor, input, message) {
var note = anchor.querySelector(".dz-hub-field-error");
if (!message) {
if (note) note.remove();
input.removeAttribute("aria-invalid");
input.removeAttribute("aria-describedby");
return;
}
if (!note) {
note = document.createElement("p");
note.className = "dz-hub-field-error";
note.id = input.id + "-error";
note.setAttribute("aria-live", "polite");
anchor.appendChild(note);
}
note.textContent = message;
input.setAttribute("aria-invalid", "true");
input.setAttribute("aria-describedby", note.id);
}
function dzHubBuildControl(entry) {
var meta = DZ_HUB_INPUT_META[entry.storageKey] || {};
var el;
if (entry.control === "toggle") {
el = document.createElement("input");
el.type = "checkbox";
el.checked = !!(theme.features && theme.features[entry.storageKey] && theme.features[entry.storageKey].enabled === true);
} else if (entry.control === "number") {
el = document.createElement("input");
el.type = "number";
if (meta.min !== undefined) el.min = meta.min;
if (meta.max !== undefined) el.max = meta.max;
el.value = dzHubCurrentValue(entry);
} else if (entry.control === "select") {
el = document.createElement("select");
(meta.options || []).forEach(function (value) {
var opt = document.createElement("option");
opt.value = value;
opt.textContent = dzT("hub.options." + entry.storageKey + "." + value);
el.appendChild(opt);
});
el.value = dzHubCurrentValue(entry);
} else if (entry.control === "text") {
el = document.createElement("input");
el.type = "text";
el.value = dzHubCurrentValue(entry);
} else {
return null;
}
el.id = "dz-hub-ctl-" + entry.key;
el.className = "dz-hub-input dz-hub-input-" + entry.control;
el.setAttribute("data-setting-input", entry.key);
el.addEventListener("change", function () {
var value = (entry.control === "toggle") ? el.checked : el.value;
if (DZ_HUB_IMAGE_NAME_KEYS[entry.key]) {
var textCell = el.closest(".dz-hub-row").querySelector(".dz-hub-text");
var refused = dzHubImageNameRefused(value);
dzHubFieldError(textCell, el, refused ? dzT("hub.invalid_image_name") : null);
if (refused) return;
}
dzApplyHubSetting(entry, value);
if (entry.control === "toggle") dzHubSyncChildren(entry, el.checked);
if (entry.key === "icon_image") dzHubToggleImageEditor(el.checked);
});
return el;
}
function dzHubBuildReloadNote(entry) {
var note = document.createElement("div");
note.className = "dz-hub-reload-note";
note.setAttribute("data-reload-for", entry.key);
note.hidden = true;
var span = document.createElement("span");
span.className = "dz-hub-reload-text";
span.textContent = dzT("hub.reload_note");
var btn = document.createElement("button");
btn.type = "button";
btn.className = "btn btn-primary dz-hub-reload-btn";
btn.textContent = dzT("hub.reload_now");
btn.addEventListener("click", dzHubReloadIntoHub);
note.appendChild(span);
note.appendChild(btn);
return note;
}
function dzHubToggleReloadNote(entry, show) {
var hub = document.getElementById(DZ_HUB_ID);
var note = hub && hub.querySelector('.dz-hub-reload-note[data-reload-for="' + entry.key + '"]');
if (note) note.hidden = !show;
}
function dzHubSetRowDisabled(row, disabled) {
if (!row) return;
row.classList.toggle("is-disabled", disabled);
row.querySelectorAll("input, select, button").forEach(function (c) { c.disabled = disabled; });
}
function dzHubSyncChildren(parentEntry, enabled) {
var hub = document.getElementById(DZ_HUB_ID);
if (!hub) return;
dzManifestAllEntries().forEach(function (e) {
if (e.parent !== parentEntry.key) return;
dzHubSetRowDisabled(hub.querySelector('.dz-hub-row[data-setting="' + e.key + '"]'), !enabled);
});
}
function dzHubFailClosed(entry, message) {
var hub = document.getElementById(DZ_HUB_ID);
var row = hub && hub.querySelector('.dz-hub-row[data-setting="' + entry.key + '"]');
console.warn("machinon_theme_hub", "applier_missing", entry.key + ": " + message);
if (!row) return;
dzHubSetRowDisabled(row, true);
var note = row.querySelector(".dz-hub-fail-note");
if (!note) {
note = document.createElement("p");
note.className = "dz-hub-fail-note";
(row.querySelector(".dz-hub-text") || row).appendChild(note);
}
note.textContent = message;
}
var dzHubNoIdentityLocked = false;
function dzHubApplyNoIdentityLock() {
dzHubLockAllRows(dzT("hub.locked_token"));
}
function dzHubLockAllRows(reason) {
if (dzHubNoIdentityLocked) return;
dzHubNoIdentityLocked = true;
var hub = document.getElementById(DZ_HUB_ID);
if (!hub) return;
hub.querySelectorAll(".dz-hub-row").forEach(function (row) {
row.classList.add("dz-hub-row-locked");
row.querySelectorAll("input, select").forEach(function (c) { c.disabled = true; });
});
var about = hub.querySelector('.dz-hub-custom-mount[data-custom="about"]');
if (about && !about.querySelector("#dz-hub-no-identity-note")) {
var note = document.createElement("p");
note.id = "dz-hub-no-identity-note";
note.className = "dz-hub-no-identity-note";
note.textContent = reason;
about.insertBefore(note, about.firstChild);
}
}
function dzHubApplyLegacyReadOnlyLock() {
var mode = dzSettingsMode();
if (mode.api || mode.admin) return;
dzHubLockAllRows(dzT("hub.locked_version"));
}
function dzHubPersist() {
return storeUserVariableThemeSettings("update").then(function (res) {
if (dzSettingsMode().noIdentity) dzHubApplyNoIdentityLock();
return res;
});
}
function dzApplyHubSetting(entry, value) {
if (!entry || entry.control === "custom") return;
var key = entry.storageKey;
if (entry.control === "toggle") {
if (!theme.features || !Object.prototype.hasOwnProperty.call(theme.features, key)) {
dzHubFailClosed(entry, dzT("hub.no_backing"));
return;
}
var feature = theme.features[key];
var was = feature.enabled === true;
var now = value === true;
feature.enabled = now;
var files = feature.files || [];
var hasJs = files.some(function (f) { return f.split(".").pop() === "js"; });
if (now && !was) {
if (files.length) loadThemeFeatureFiles(key);
if (entry.reloadOnDisable) dzHubToggleReloadNote(entry, false);
if (key === "log_plot_bands" && typeof dzApplyLogPlotBands === "function") dzApplyLogPlotBands();
if (key === "diagnostic_logging" && typeof dzDiagRefreshGate === "function") dzDiagRefreshGate();
} else if (!now && was) {
if (key === "diagnostic_logging" && typeof dzDiagRefreshGate === "function") dzDiagRefreshGate();
if (hasJs) {
dzHubToggleReloadNote(entry, true);
} else if (files.length) {
unloadThemeFeatureFiles(key);
}
}
if (DZ_HUB_APPLIERS[key]) {
DZ_HUB_APPLIERS[key]();
} else if (!files.length && typeof setAllDevicesFeatures === "function") {
setAllDevicesFeatures();
}
} else {
theme[key] = value;
if (DZ_HUB_APPLIERS[key]) {
DZ_HUB_APPLIERS[key]();
}
}
cacheThemeSettings();
dzHubPersist();
}
var DZ_HUB_REOPEN_FLAG = "machinon_reopen_hub";
function dzHubReloadIntoHub() {
if (!window.dzRoutesActive) {
try { localStorage.setItem(DZ_HUB_REOPEN_FLAG, "1"); } catch (e) { }
}
location.reload();
}
function dzMaybeReopenHub() {
var flag;
try { flag = localStorage.getItem(DZ_HUB_REOPEN_FLAG); } catch (e) { return; }
if (flag !== "1") return;
try { localStorage.removeItem(DZ_HUB_REOPEN_FLAG); } catch (e) { }
var timer = null;
function openHubOnce() {
window.removeEventListener("hashchange", reschedule);
if (typeof dzOpenThemeHub === "function") { dzOpenThemeHub(); }
}
function reschedule() {
if (timer) clearTimeout(timer);
timer = setTimeout(openHubOnce, 700);
}
window.addEventListener("hashchange", reschedule);
reschedule();
}
(function dzThemeHubInit() {
if (typeof whenElementRenders === "function") {
whenElementRenders("dzThemeHubMenu", "#appnavbar li[has-permission='Admin'] > ul", dzInsertHubMenuEntry);
whenElementRenders("dzThemeHubMenuOther", "#appnavbar li[has-login-no-admin] > ul", dzInsertHubMenuEntryOther);
} else {
if (window.jQuery) jQuery(function () { dzInsertHubMenuEntry(); dzInsertHubMenuEntryOther(); });
}
window.addEventListener("hashchange", dzHubSyncMenuActive);
dzMaybeReopenHub();
})();
