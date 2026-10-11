const mSettings = $("#appnavbar").find("li[has-permission='Admin']");
if (mSettings.length > 0) {
mSettings.removeClass("dropdown");
mSettings.children("a").removeClass("dropdown-toggle").removeAttr("data-toggle");
mSettings.find("a > b").remove();
mSettings.children("ul").hide();
if (!document.getElementById("dzSetupMenuProblems")) {
const problemsLabel = (typeof dzT === "function") ? dzT("problems.title") : "Problem Devices";
const problemsLink = $("<a>", { href: "#/ProblemDevices", onclick: "dzOpenProblemDevices()" });
$("<img>", { src: "images/settings/problems.png" }).appendTo(problemsLink);
problemsLink.append(" ");
$("<span>", { text: problemsLabel }).appendTo(problemsLink);
const problemsLi = $("<li>", { id: "dzSetupMenuProblems" }).append(problemsLink);
const themeLi = mSettings.children("ul").find("a[href='#/Theme']").first().closest("li");
if (themeLi.length) themeLi.after(problemsLi); else problemsLi.appendTo(mSettings.children("ul"));
}
const TILE_ICONS = {
"#/ProblemDevices": "problems.png",
"#Hardware": "hardware.png",
"#Devices": "devices.png",
"#Setup": "setup.png",
"#Energy": "energy.png",
"#Update": "update.png",
"#Cam": "cam.png",
"#Users": "users.png",
"#Events": "events.png",
"#CustomIcons": "customicons.png",
"#Applications": "app.png",
"#AccessTokens": "accesstokens.png",
"#Mobile": "mobile.png",
"#UserVariables": "variables.png",
"#Notification": "notification.png",
"#MyProfile": "userprofile.png",
"#Log": "log.png",
"#About": "about.png"
};
const LABEL_ICONS = {
"Plans": "plan.png",
"Data push": "contact.png",
"Check for Update": "update.png",
"SecurityPanel": "security.png",
"Theme": "paint-palette.png"
};
const DEFAULT_ICON = "setup.png";
function readLabel(a) {
const span = a.children("span").last();
return {
i18n: (span.length ? span : a).attr("data-i18n") || null,
text: (span.length ? span : a).text().trim()
};
}
function harvestMenu(ul) {
let entries = [];
ul.children("li").each(function () {
const li = $(this);
if (li.hasClass("divider") || li.hasClass("ng-hide") || this.style.display === "none") return;
const sub = li.children("ul");
if (sub.length) {
const nested = harvestMenu(sub);
if (nested.some(function (e) { return e.links; })) {
entries = entries.concat(nested);
} else if (nested.length) {
entries.push({ label: readLabel(li.children("a")), links: nested });
}
return;
}
const a = li.children("a");
if (!a.length) return;
const href = a.attr("href") || null;
const onclick = a.attr("onclick") || null;
if (href && href.indexOf("javascript:") === 0) return;
if (href === "#Logout") return;
if (!href && !onclick) return;
entries.push({ label: readLabel(a), href: href, onclick: onclick });
});
return entries;
}
function appendLabel(parent, label, cls) {
const div = $("<div>", { "class": cls, text: label.text });
if (label.i18n) div.attr("data-i18n", label.i18n);
div.appendTo(parent);
}
function tileIcon(entry) {
return TILE_ICONS[entry.href] || LABEL_ICONS[entry.label.i18n] || DEFAULT_ICON;
}
function normalizeRouteHash(href) {
return (href && href.charAt(0) === "#" && href.charAt(1) !== "/")
? "#/" + href.slice(1)
: href;
}
function buildTile(entry) {
const li = $("<li>", { "class": "rectangle-8" });
$("<img>", { src: "images/settings/" + tileIcon(entry) }).appendTo(li);
appendLabel(li, entry.label, "machinoText");
if (entry.onclick) {
li.attr("onclick", entry.onclick);
} else if (entry.href) {
li.attr("data-target", normalizeRouteHash(entry.href));
}
return li;
}
function buildDropdownTile(entry) {
const li = $("<li>", { "class": "rectangle-8-dropdown" });
$("<img>", { src: "images/settings/" + tileIcon(entry) }).appendTo(li);
appendLabel(li, entry.label, "machinoText");
const content = $("<div>", { "class": "dropdown-content rectangle-8" }).appendTo(li);
entry.links.forEach(function (link) {
const span = $("<span>", { text: link.label.text });
if (link.label.i18n) span.attr("data-i18n", link.label.i18n);
$("<p>").append(
$("<a>", { href: normalizeRouteHash(link.href) }).append(
$("<div>", { "class": "mDropdown-Text" }).append(span)))
.appendTo(content);
});
return li;
}
function buildSettingsGrid(host) {
$("#machinoSettings").remove();
$("#search").addClass("readonly");
$("body").css("overflow", "auto");
$(host).append('<div id="machinoSettings" class="container-fluid">');
$("#machinoSettings").append('<ul class="mHeaderBtn">').append('<div class="page-header-small"><h1 data-i18n="Settings">Settings</h2></div>').append('<ul class="machinon_ul">');
$("#machinoSettings ul.mHeaderBtn").append('<li class="btn btn-danger" onclick="javascript:SwitchLayout(\'Restart\')"><i class="ion-ios-refresh"></i><div data-i18n="Restart System">Restart System</div></li><li class="btn btn-danger" onclick="javascript:SwitchLayout(\'Shutdown\')"><i class="ion-ios-power"></i><div data-i18n="Shutdown System">Shutdown System</div></li><li class="btn btn-danger" onclick="location.href=\'#/Logout\'"><i class="ion-ios-log-out"></i><div data-i18n="Logout">Logout</div></li>');
const grid = $("#machinoSettings ul.machinon_ul");
harvestMenu(mSettings.children("ul")).forEach(function (entry) {
grid.append(entry.links ? buildDropdownTile(entry) : buildTile(entry));
});
grid.on("click", "li[data-target]", function () {
location.href = $(this).attr("data-target");
});
$("#machinoSettings").i18n();
if (!dzIsAdmin()) $("#machinoSettings").remove();
}
mSettings.click(function (event) {
if ($(event.target).closest(mSettings.children("ul")).length) return;
$(".navbar-inner").removeClass("slide");
if (window.dzRoutesActive) {
dzThemeNavigate("#/SetupMenu");
return;
}
$("#appnavbar li").removeClass("current_page_item");
mSettings.addClass("current_page_item");
buildSettingsGrid($("#holder #main-view").empty());
});
function syncSettingsMenuActive() {
mSettings.toggleClass("current_page_item",
window.dzRoutesActive === true && location.hash.indexOf("#/SetupMenu") === 0);
}
if (window.dzSyncSettingsMenuActive) {
window.removeEventListener("hashchange", window.dzSyncSettingsMenuActive);
}
window.dzSyncSettingsMenuActive = syncSettingsMenuActive;
window.addEventListener("hashchange", syncSettingsMenuActive);
syncSettingsMenuActive();
window.dzBuildSettingsGrid = buildSettingsGrid;
if (typeof dzRouteMilestone === "function") dzRouteMilestone("settingsGrid");
}
