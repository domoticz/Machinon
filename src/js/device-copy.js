function dzDeviceCopyClean(value) {
if (value === null || value === undefined) return "";
return String(value).replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").trim();
}
function dzDeviceCopyIdx(idx) {
var s = dzDeviceCopyClean(idx);
return /^\d+$/.test(s) ? s : null;
}
var DZ_COPY_DZVENTS = { device: "devices", scene: "scenes", group: "groups" };
var DZ_COPY_API = { device: "getdevices", scene: "getscenes", group: "getscenes" };
function dzDeviceCopyKind(device, inSceneList) {
var type = device && device.Type;
if (type === "Scene") return "scene";
if (type === "Group") return "group";
if (inSceneList) return null;
return "device";
}
function dzDeviceCopyDzVents(idx, name, kind) {
var id = dzDeviceCopyIdx(idx);
var collection = DZ_COPY_DZVENTS[kind];
if (id === null || !collection) return null;
var label = dzDeviceCopyClean(name);
return "domoticz." + collection + "(" + id + ")" + (label ? " -- " + label : "");
}
function dzDeviceCopyApiUrl(idx, base, kind) {
var id = dzDeviceCopyIdx(idx);
var param = DZ_COPY_API[kind];
if (id === null || !param) return null;
try {
var url = new URL("json.htm?type=command&param=" + param + "&rid=" + id, base);
url.username = "";
url.password = "";
url.hash = "";
return url.href;
} catch (e) {
return null;
}
}
function dzDeviceCopyDetails(device, idx, versions, kind) {
var d = device || {};
var id = dzDeviceCopyIdx(idx);
var lines = [];
function add(label, value) {
var v = dzDeviceCopyClean(value);
if (v) lines.push(label + ": " + v);
}
var name = dzDeviceCopyClean(d.Name);
var noun = kind === "scene" ? "Scene" : kind === "group" ? "Group" : "Device";
lines.push(noun + ": " + (name || "(no name)") + (id !== null ? " (idx " + id + ")" : ""));
add("Type", [d.Type, d.SubType, d.SwitchType].map(dzDeviceCopyClean).filter(Boolean).join(", "));
add("Hardware", d.HardwareName);
add("Hardware type", d.HardwareType);
var devId = dzDeviceCopyClean(d.ID);
var unit = dzDeviceCopyClean(d.Unit);
if (devId || unit) lines.push("Device ID / unit: " + (devId || "-") + " / " + (unit || "-"));
add("Value", kind === "scene" || kind === "group" ? d.Status : d.Data);
add("Last update", d.LastUpdate);
var v = versions || {};
var built = [];
if (dzDeviceCopyClean(v.domoticz)) built.push("Domoticz " + dzDeviceCopyClean(v.domoticz));
if (dzDeviceCopyClean(v.theme)) built.push("Machinon " + dzDeviceCopyClean(v.theme));
if (built.length) lines.push(built.join(", "));
return lines.join("\n");
}
function dzDeviceCopyRecord(itemEl) {
if (typeof angular === "undefined" || !itemEl) return null;
var scope = angular.element(itemEl).scope();
return (scope && (scope.device || (scope.ctrl && scope.ctrl.device) || scope.item || scope.scene)) || null;
}
function dzDeviceCopyVersions() {
return {
domoticz: (typeof dzApiState !== "undefined" && dzApiState.domoticzVersion) || "",
theme: (typeof theme !== "undefined" && theme && theme.version) || ""
};
}
function dzDeviceCopyButton(className, label, onActivate) {
var a = document.createElement("a");
a.className = "btnsmall " + className;
a.setAttribute("role", "button");
a.setAttribute("tabindex", "0");
a.textContent = label;
a.addEventListener("click", function(e) {
e.preventDefault();
e.stopPropagation();
onActivate(a);
});
a.addEventListener("keydown", function(e) {
if (e.key === "Enter" || e.key === " ") {
e.preventDefault();
onActivate(a);
}
});
return a;
}
function dzDeviceCopyMount(idx, itemEl) {
var id = dzDeviceCopyIdx(idx);
var frag = document.createDocumentFragment();
var panel = document.createElement("div");
panel.className = "dz-copy-menu";
panel.hidden = true;
function kind(dev) {
return dzDeviceCopyKind(dev, !!(itemEl && itemEl.closest && itemEl.closest("#scenecontent, #dashScenes")));
}
var toggle = dzDeviceCopyButton("dz-idno", "Idx: " + dzDeviceCopyClean(idx), function() {
panel.hidden = !panel.hidden;
toggle.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
});
toggle.setAttribute("aria-expanded", "false");
toggle.title = dzT("device_copy.title");
frag.appendChild(toggle);
if (id === null) return frag;
var fallback = document.createElement("div");
fallback.className = "dz-copy-fallback";
fallback.hidden = true;
var area = document.createElement("textarea");
area.className = "dz-copy-fallback-text";
area.readOnly = true;
area.rows = 4;
area.setAttribute("aria-label", dzT("device_copy.fallback"));
fallback.appendChild(area);
function copy(btn, label, build) {
var text = build();
if (!text) return;
fallback.hidden = true;
dzCopyText(text).then(function(ok) {
if (ok) {
btn.textContent = dzT("device_copy.copied");
setTimeout(function() { btn.textContent = label; }, 1500);
return;
}
area.value = text;
fallback.hidden = false;
try { area.focus(); area.select(); } catch (e) { }
});
}
[
["copy_idx", function() { return id; }],
["copy_dzvents", function() {
var dev = dzDeviceCopyRecord(itemEl);
return dzDeviceCopyDzVents(id, dev && dev.Name, kind(dev));
}],
["copy_api", function() {
return dzDeviceCopyApiUrl(id, document.baseURI, kind(dzDeviceCopyRecord(itemEl)));
}],
["copy_details", function() {
var dev = dzDeviceCopyRecord(itemEl);
return dzDeviceCopyDetails(dev, id, dzDeviceCopyVersions(), kind(dev));
}]
].forEach(function(entry) {
var label = dzT("device_copy." + entry[0]);
panel.appendChild(dzDeviceCopyButton("dz-copy-item", label, function(btn) {
copy(btn, label, entry[1]);
}));
});
panel.appendChild(fallback);
frag.appendChild(panel);
return frag;
}
function dzDeviceCopyCollapse(menuEl) {
if (!menuEl) return;
var panel = menuEl.querySelector(".dz-copy-menu");
if (panel) panel.hidden = true;
var toggle = menuEl.querySelector(".dz-idno");
if (toggle) toggle.setAttribute("aria-expanded", "false");
var fallback = menuEl.querySelector(".dz-copy-fallback");
if (fallback) fallback.hidden = true;
}
