var ICONPACK = { state: [], busy: false, tab: "blue" };
function packOpStarts() {
if (ICONPACK.busy) {
generate_noty("warning", dzT("toasts.icon_busy"), 3000);
return false;
}
ICONPACK.busy = true;
return true;
}
function packOpEnds() {
ICONPACK.busy = false;
return refreshIconPack();
}
function mountIconPackInHub() {
var container = $("#iconpack");
if (!container.length) return;
if (container.find("#iconpackTabs").length) return;
container.load("styles/" + themeFolder + "/iconsettings.html", initIconPack);
}
function initIconPack() {
$("#iconpack .iconpack-intro").text(dzT("hub.iconlib.intro"));
$('#iconpackTabs button[data-tab="blue"]').text(dzT("hub.iconlib.tab_blue"));
$('#iconpackTabs button[data-tab="color"]').text(dzT("hub.iconlib.tab_color"));
$('#iconpackTabs button[data-tab="fun"]').text(dzT("hub.iconlib.tab_fun"));
$("#iconpackSearch").attr("placeholder", dzT("hub.iconlib.search_placeholder"));
$("#iconpackInstallAll").text(dzT("hub.iconlib.install_all"));
$("#iconpackGrid").text(dzT("hub.loading"));
$("#iconpackSearch").on("input", renderIconPackGrid);
$("#iconpackInstallAll").on("click", installAllPackIcons);
$("#iconpackTabs").on("click", "button[data-tab]", function() {
setIconPackTab($(this).attr("data-tab"));
});
refreshIconPack();
}
function setIconPackTab(tab) {
ICONPACK.tab = tab;
$("#iconpackTabs button").removeClass("active");
$('#iconpackTabs button[data-tab="' + tab + '"]').addClass("active");
renderIconPackGrid();
}
function packPreviewUrl(base, state) {
return "styles/" + themeFolder + "/iconpack/" + base + "48_" + state + ".png";
}
function fetchPackJson(url, opts) {
return fetch(url, Object.assign({ credentials: "include" }, opts))
.then(function(r) {
if (!r.ok) { throw new Error("HTTP " + r.status); }
return r.json();
});
}
function loadPackManifest() {
return fetchPackJson("styles/" + themeFolder + "/iconpack/manifest.json", { cache: "no-cache" });
}
function installedPackIcons() {
return fetchPackJson("json.htm?type=command&param=getcustomiconset").then(function(data) {
var map = {};
(data.result || []).forEach(function(ic) {
var m = /^images\/(.+)48_On\.png$/.exec(ic.IconFile48On || "");
if (m) { map[m[1]] = { idx: ic.idx, title: ic.Title, description: ic.Description }; }
});
return map;
});
}
function refreshIconPack() {
return Promise.all([loadPackManifest(), installedPackIcons()]).then(function(res) {
var manifest = res[0], installed = res[1];
return Promise.all(manifest.icons.map(function(icon) {
var inst = installed[icon.base];
if (!inst) {
return Promise.resolve({ base: icon.base, name: icon.name,
description: icon.description, tab: icon.tab, idx: null, outdated: false });
}
return packIconOutdated(icon, inst).then(function(outdated) {
return { base: icon.base, name: icon.name,
description: icon.description, tab: icon.tab, idx: inst.idx, outdated: outdated };
});
}));
}).then(function(state) {
state.sort(function(a, b) { return a.name.localeCompare(b.name); });
ICONPACK.state = state;
renderIconPackGrid();
}).catch(function(e) {
var grid = document.getElementById("iconpackGrid");
if (grid) { grid.textContent = dzT("hub.iconlib.load_failed", { error: e.message }); }
});
}
function activeTabIcons() {
return ICONPACK.state.filter(function(ic) { return ic.tab === ICONPACK.tab; });
}
function visiblePackIcons() {
var q = ($("#iconpackSearch").val() || "").toLowerCase();
return activeTabIcons().filter(function(ic) {
return !q || (ic.base + " " + ic.name + " " + ic.description).toLowerCase().indexOf(q) !== -1;
});
}
function renderIconPackGrid() {
var grid = document.getElementById("iconpackGrid");
if (!grid) return;
var tabIcons = activeTabIcons();
var shown = visiblePackIcons();
var installedCount = tabIcons.filter(function(ic) { return ic.idx !== null; }).length;
document.getElementById("iconpackCounter").textContent =
dzT("hub.iconlib.counter", { count: installedCount, total: tabIcons.length });
var allBtn = document.getElementById("iconpackInstallAll");
if (allBtn) {
allBtn.textContent = shown.length === tabIcons.length
? dzT("hub.iconlib.install_all")
: dzT("hub.iconlib.install_shown", { count: shown.length });
}
grid.textContent = "";
shown.forEach(function(ic) { grid.appendChild(buildIconPackCard(ic)); });
if (!shown.length) { grid.textContent = dzT("hub.iconlib.no_match"); }
}
function buildIconPackCard(ic) {
var card = document.createElement("div");
card.className = "iconpack-card" + (ic.idx !== null ? " installed" : "");
card.setAttribute("data-base", ic.base);
var img = document.createElement("img");
img.className = "iconpack-preview";
img.loading = "lazy";
img.src = packPreviewUrl(ic.base, "On");
img.alt = ic.name;
var sticky = false, hover = false;
function paint() { img.src = packPreviewUrl(ic.base, (sticky !== hover) ? "Off" : "On"); }
img.addEventListener("mouseenter", function() { hover = true; paint(); });
img.addEventListener("mouseleave", function() { hover = false; paint(); });
img.addEventListener("click", function() { sticky = !sticky; paint(); });
card.appendChild(img);
var name = document.createElement("div");
name.className = "iconpack-name";
name.textContent = ic.name;
card.appendChild(name);
var desc = document.createElement("div");
desc.className = "iconpack-desc";
desc.textContent = ic.description;
card.appendChild(desc);
if (ic.idx !== null) {
var chip = document.createElement("span");
chip.className = "iconpack-chip";
chip.textContent = dzT("hub.iconlib.installed_chip");
card.appendChild(chip);
}
var actions = document.createElement("div");
actions.className = "iconpack-actions";
actions.appendChild(iconPackButton(
ic.idx === null ? "add" : (ic.outdated ? "refresh" : "add-disabled"), ic));
actions.appendChild(iconPackButton(ic.idx === null ? "remove-disabled" : "remove", ic));
card.appendChild(actions);
return card;
}
function iconPackButton(kind, ic) {
var btn = document.createElement("button");
btn.type = "button";
var img = document.createElement("img");
img.alt = "";
if (kind === "add" || kind === "add-disabled") {
btn.className = "iconpack-add";
img.src = "images/add.png";
btn.title = kind === "add-disabled" ? dzT("hub.iconlib.installed_current") : dzT("hub.iconlib.install");
if (kind === "add-disabled") { btn.disabled = true; }
else { btn.addEventListener("click", function() { installPackIcon(ic); }); }
} else if (kind === "refresh") {
btn.className = "iconpack-add";
img.src = "images/machinon/refresh.png";
btn.title = dzT("hub.iconlib.update_available");
btn.addEventListener("click", function() { installPackIcon(ic); });
} else {
btn.className = "iconpack-remove";
img.src = "images/remove.png";
btn.title = kind === "remove-disabled" ? dzT("hub.iconlib.not_installed") : dzT("hub.iconlib.remove");
if (kind === "remove-disabled") { btn.disabled = true; }
else { btn.addEventListener("click", function() { removePackIcon(ic); }); }
}
btn.appendChild(img);
return btn;
}
function fetchPackBytes(url) {
return fetch(url, { cache: "no-cache", credentials: "include" }).then(function(r) {
if (!r.ok) { throw new Error("HTTP " + r.status); }
return r.arrayBuffer();
});
}
function packArtSig(buf) {
var bytes = new Uint8Array(buf);
var h = 0x811C9DC5;
for (var i = 0; i < bytes.length; i++) {
h = h ^ bytes[i];
h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
}
return bytes.length + "-" + ("0000000" + h.toString(16)).slice(-8);
}
function packIconOutdated(icon, installed) {
if (installed.title !== icon.name || installed.description !== icon.description) {
return Promise.resolve(true);
}
if (!icon.on_sig || !icon.off_sig) { return Promise.resolve(false); }
return Promise.all([
fetchPackBytes("images/" + icon.base + "48_On.png"),
fetchPackBytes("images/" + icon.base + "48_Off.png")
]).then(function(b) {
return packArtSig(b[0]) !== icon.on_sig || packArtSig(b[1]) !== icon.off_sig;
}).catch(function() { return false; });
}
function uploadPackZip(base) {
return fetch("styles/" + themeFolder + "/iconpack/" + base + ".zip",
{ cache: "no-cache", credentials: "include" })
.then(function(r) {
if (!r.ok) { throw new Error("zip fetch HTTP " + r.status); }
return r.blob();
})
.then(function(blob) {
var fd = new FormData();
fd.append("file", blob, base + ".zip");
return fetch("json.htm?type=command&param=uploadcustomicon",
{ method: "POST", body: fd, credentials: "include" });
})
.then(function(r) {
if (!r.ok) { throw new Error("HTTP " + r.status); }
return r.json();
})
.then(function(data) {
if (data.status !== "OK") { throw new Error(data.error || "upload failed"); }
});
}
function installPackIcon(ic) {
if (!packOpStarts()) return;
return uploadPackZip(ic.base)
.then(function() { generate_noty("success", dzT("toasts.icon_installed", { name: ic.name }), 3000); })
.catch(function(e) { generate_noty("error", dzT("toasts.icon_install_failed", { name: ic.name, error: e.message }), 6000); })
.then(packOpEnds);
}
function devicesUsingPackIcon(idx) {
return fetchPackJson("json.htm?type=command&param=getdevices&used=true&displayhidden=1")
.then(function(data) {
return (data.result || [])
.filter(function(d) { return Number(d.CustomImage) === 100 + idx; })
.map(function(d) { return d.Name; });
});
}
function removePackIcon(ic) {
devicesUsingPackIcon(ic.idx).then(function(users) {
var msg = users.length
? dzT("hub.iconlib.remove_confirm_used", { name: ic.name, users: users.join(", ") })
: dzT("hub.iconlib.remove_confirm", { name: ic.name });
bootbox.confirm({
message: $("<div>").text(msg),
callback: function(ok) {
if (!ok) return;
if (!packOpStarts()) return;
fetchPackJson("json.htm?type=command&param=deletecustomicon&idx=" + ic.idx)
.then(function() { generate_noty("success", dzT("toasts.icon_removed", { name: ic.name }), 3000); })
.catch(function() { generate_noty("error", dzT("toasts.icon_remove_failed", { name: ic.name }), 6000); })
.then(packOpEnds);
}
});
})
.catch(function() { generate_noty("error", dzT("toasts.icon_usage_check_failed", { name: ic.name }), 6000); });
}
function installAllPackIcons() {
if (!packOpStarts()) return;
var pool = visiblePackIcons();
var todo = pool.filter(function(ic) { return ic.idx === null || ic.outdated; });
var current = pool.length - todo.length;
if (!todo.length) {
generate_noty("success", pool.length === activeTabIcons().length
? dzT("toasts.icons_all_current", { count: pool.length })
: dzT("toasts.icons_all_shown_current", { count: pool.length }), 3000);
ICONPACK.busy = false;
return;
}
var added = 0, updated = 0, failures = [];
var chain = Promise.resolve();
todo.forEach(function(ic, i) {
chain = chain.then(function() {
generate_noty("information", dzT("toasts.icons_installing", { n: i + 1, total: todo.length, name: ic.name }), 1000);
return uploadPackZip(ic.base)
.then(function() { if (ic.idx === null) { added++; } else { updated++; } })
.catch(function(e) { failures.push(ic.name + " (" + e.message + ")"); });
});
});
chain.then(function() {
var msg = dzT("toasts.icons_summary", { added: added, updated: updated, current: current });
if (failures.length) { generate_noty("error", dzT("toasts.icons_summary_failed", { summary: msg, failures: failures.join(", ") }), 8000); }
else { generate_noty("success", msg, 5000); }
packOpEnds();
});
}
