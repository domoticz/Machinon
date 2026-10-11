var DZ_PROBLEM_FILTER_ROUTES = [
["light", "#/LightSwitches"],
["temp", "#/Temperature"],
["weather", "#/Weather"],
["utility", "#/Utility"]
];
function dzProblemsBuildRouteMap(lists) {
var map = {};
DZ_PROBLEM_FILTER_ROUTES.forEach(function (pair) {
(lists[pair[0]] || []).forEach(function (idx) {
if (!map[idx]) map[idx] = pair[1];
});
});
return map;
}
var dzProblemsRouteCache = null;
function dzProblemsResolveRoutes(cb) {
if (dzProblemsRouteCache) { cb(dzProblemsRouteCache); return; }
var lists = {};
var left = DZ_PROBLEM_FILTER_ROUTES.length;
var failed = false;
DZ_PROBLEM_FILTER_ROUTES.forEach(function (pair) {
$.ajax({
url: "json.htm?type=command&param=getdevices&filter=" + pair[0] + "&used=true",
dataType: "json",
timeout: 15000,
success: function (data) {
lists[pair[0]] = ((data && data.result) || []).map(function (d) { return String(d.idx); });
},
error: function () { failed = true; },
complete: function () {
left--;
if (left) return;
if (failed) { cb(null); return; }
dzProblemsRouteCache = dzProblemsBuildRouteMap(lists);
cb(dzProblemsRouteCache);
}
});
});
}
function dzProblemsRoute(map, idx) {
return (map && map[idx]) || null;
}
function dzProblemsReduce(devices) {
var rows = [];
(devices || []).forEach(function (d) {
if (d.HardwareDisabled === true) return;
var battery = parseInt(d.BatteryLevel, 10);
if (d.HaveTimeout === true) {
rows.push({ idx: String(d.idx), name: d.Name, kind: "timeout", battery: null,
lastUpdate: d.LastUpdate });
} else if (!isNaN(battery) && battery !== 255 && battery <= 10) {
rows.push({ idx: String(d.idx), name: d.Name, kind: "battery", battery: battery,
lastUpdate: d.LastUpdate });
}
});
rows.sort(function (a, b) {
if (a.kind !== b.kind) return a.kind === "timeout" ? -1 : 1;
if (a.kind === "battery" && a.battery !== b.battery) return a.battery - b.battery;
return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
});
return rows;
}
function dzProblemsFingerprint(rows) {
return rows.map(function (r) { return r.idx + ":" + r.kind + ":" + r.battery; }).join(",");
}
function dzProblemsFetch(cb) {
$.ajax({
url: "json.htm?type=command&param=getdevices&filter=all&used=true",
dataType: "json",
timeout: 15000,
success: function (data) {
if (data && data.status === "OK" && Array.isArray(data.result)) {
cb(null, dzProblemsReduce(data.result));
} else {
cb(new Error("getdevices malformed answer"));
}
},
error: function () { cb(new Error("getdevices failed")); }
});
}
var DZ_PROBLEMS_POLL_MS = 60000;
var dzProblemsInitArmed = false;
var dzProblemsInFlight = false;
function dzOpenProblemDevices() {
if (!window.dzRoutesActive) {
console.warn("machinon_problems", "routes_inactive", "theme routes are inactive; #/ProblemDevices has no legacy path, entry point suppressed");
return;
}
dzThemeNavigate("#/ProblemDevices");
}
function dzProblemsBadgeEl() {
var badge = document.getElementById("dz-problem-badge");
if (badge) return badge;
var logo = document.querySelector(".container-logo");
if (!logo) return null;
badge = document.createElement("button");
badge.type = "button";
badge.id = "dz-problem-badge";
badge.hidden = true;
badge.title = dzT("problems.badge_title");
var icon = document.createElement("i");
icon.className = "ion-ios-warning";
icon.setAttribute("aria-hidden", "true");
badge.appendChild(icon);
var count = document.createElement("span");
count.className = "dz-problem-count";
badge.appendChild(count);
badge.addEventListener("click", dzOpenProblemDevices);
var search = document.getElementById("search");
if (search) { logo.insertBefore(badge, search); } else { logo.appendChild(badge); }
return badge;
}
function dzProblemsRefresh() {
if (dzProblemsInFlight) return;
if (document.hidden) return;
dzProblemsInFlight = true;
dzProblemsFetch(function (err, rows) {
dzProblemsInFlight = false;
var badge = dzProblemsBadgeEl();
if (badge) {
if (!window.dzRoutesActive) {
badge.hidden = true;
} else if (err || !rows.length) {
badge.hidden = true;
} else {
badge.querySelector(".dz-problem-count").textContent = String(rows.length);
badge.setAttribute("aria-label", dzT("problems.badge_label", { count: rows.length }));
badge.hidden = false;
}
}
if (typeof dzProblemsRenderRows === "function" &&
location.hash.indexOf("#/ProblemDevices") === 0) {
dzProblemsRenderRows(err ? null : rows);
}
});
}
function dzProblemsRenderPage() {
dzProblemsRenderedPrint = null;
dzProblemsRouteCache = null;
dzProblemsFetch(function (err, rows) {
dzProblemsRenderRows(err ? null : rows);
});
}
var dzProblemsRenderedPrint = null;
function dzProblemsRenderRows(rows) {
var table = document.getElementById("dz-problems-table");
var state = document.getElementById("dz-problems-state");
var title = document.getElementById("dz-problems-title");
if (!table || !state || !title) return;
var tbody = table.querySelector("tbody");
title.textContent = dzT("problems.title");
document.getElementById("dz-problems-intro").textContent = dzT("problems.intro");
document.getElementById("dz-problems-th-name").textContent = dzT("problems.th_name");
document.getElementById("dz-problems-th-what").textContent = dzT("problems.th_what");
document.getElementById("dz-problems-th-seen").textContent = dzT("problems.th_seen");
if (rows === null) {
state.textContent = dzT("problems.error");
state.hidden = false; table.hidden = true;
dzProblemsRenderedPrint = null;
return;
}
if (!rows.length) {
state.textContent = dzT("problems.empty");
state.hidden = false; table.hidden = true;
dzProblemsRenderedPrint = "";
return;
}
var print = dzProblemsFingerprint(rows);
if (print === dzProblemsRenderedPrint) return;
dzProblemsRenderedPrint = print;
state.hidden = true; table.hidden = false;
tbody.textContent = "";
dzProblemsResolveRoutes(function (map) {
if (print !== dzProblemsRenderedPrint) return;
rows.forEach(function (row) {
var tr = document.createElement("tr");
var iconCell = document.createElement("td");
var icon = document.createElement("i");
icon.className = row.kind === "battery"
? "ion-md-battery-full dz-problems-icon dz-problems-icon--battery"
: "ion-ios-wifi dz-problems-icon dz-problems-icon--timeout";
icon.setAttribute("aria-hidden", "true");
iconCell.appendChild(icon);
tr.appendChild(iconCell);
var nameCell = document.createElement("td");
nameCell.textContent = row.name;
tr.appendChild(nameCell);
var whatCell = document.createElement("td");
whatCell.textContent = row.kind === "battery"
? dzT("problems.battery", { level: row.battery })
: dzT("problems.timeout");
tr.appendChild(whatCell);
var seenCell = document.createElement("td");
seenCell.textContent = moment(row.lastUpdate, ["YYYY-MM-DD HH:mm:ss", "L LT"]).format("L HH:mm");
tr.appendChild(seenCell);
var route = dzProblemsRoute(map, row.idx);
if (route) {
tr.classList.add("dz-problems-row--link");
tr.tabIndex = 0;
tr.title = dzT("problems.show_device");
tr.addEventListener("click", function () {
var members = {};
members["d:" + row.idx] = true;
dzNavigateAndFilter(route, members, row.name);
});
tr.addEventListener("keydown", function (e) { if (e.key === "Enter") tr.click(); });
}
tbody.appendChild(tr);
});
});
}
function dzProblemsInit() {
if (dzProblemsInitArmed) return;
dzProblemsInitArmed = true;
dzProblemsRefresh();
setInterval(dzProblemsRefresh, DZ_PROBLEMS_POLL_MS);
document.addEventListener("visibilitychange", function () {
if (!document.hidden) dzProblemsRefresh();
});
if (typeof dzRouteMilestone === "function") dzRouteMilestone("problems");
}
if (typeof dzDiagRegister === "function") {
dzDiagRegister("problems", function() {
var badge = document.querySelector("#dz-problem-badge .dz-problem-count");
var rows = document.querySelectorAll("#dz-problems-table tbody tr").length;
return {
badge: badge ? (parseInt(badge.textContent, 10) || 0) : 0,
rows: rows,
outcome: (typeof dzRoutesActive !== "undefined" && dzRoutesActive) ? "routes_active" : "routes_inactive"
};
});
}
