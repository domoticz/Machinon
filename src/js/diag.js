var DZ_DIAG_CAPS = {
device_pass: 20,
warn_timeout: 30,
warn_battery: 30,
toast: 20,
set_filter: 10,
settings: 10,
routes: 5,
filter: 10,
problems: 10
};
var DZ_DIAG_DEFAULT_CAP = 10;
function dzDiagCap(seam) {
return Object.prototype.hasOwnProperty.call(DZ_DIAG_CAPS, seam)
? DZ_DIAG_CAPS[seam] : DZ_DIAG_DEFAULT_CAP;
}
var DZ_DIAG_IDENTITY = {
device_pass: ["event", "stage", "cards", "flagged", "unresolved_idx", "route"],
warn_timeout: ["event", "condition", "enabled", "flagged", "warned", "cleared", "suppressed", "route"],
warn_battery: ["event", "condition", "enabled", "flagged", "warned", "cleared", "suppressed", "route"],
toast: ["event", "outcome", "group", "source"],
set_filter: ["event", "members", "cards_matched", "route"],
settings: ["event", "outcome", "transport", "layer"],
routes: ["event", "routes", "active", "reason"],
filter: ["event", "query_len", "cards_in", "cards_out", "route"],
problems: ["event", "rows", "badge", "outcome"]
};
var dzDiagIdentitySeq = 0;
function dzDiagIdentity(seam, entry) {
var fields = DZ_DIAG_IDENTITY[seam];
if (!fields) return "unkeyed:" + (++dzDiagIdentitySeq);
var out = [];
for (var i = 0; i < fields.length; i++) {
var v = entry && Object.prototype.hasOwnProperty.call(entry, fields[i]) ? entry[fields[i]] : null;
out.push(fields[i] + "=" + String(v));
}
return out.join("|");
}
function dzDiagNewState() {
return { rings: {}, appends: 0, coalesced: 0, evicted: 0, failures: 0 };
}
function dzDiagAppend(state, seam, entry) {
try {
if (!state || !entry || typeof entry !== "object") { return "failed"; }
var key = String(seam || "unknown");
var ring = state.rings[key] || (state.rings[key] = []);
var id = dzDiagIdentity(key, entry);
for (var i = ring.length - 1; i >= 0; i--) {
if (ring[i].__id !== id) continue;
state.coalesced += 1;
ring[i].__seen = (ring[i].__seen || 1) + 1;
return "coalesced";
}
entry.__id = id;
ring.push(entry);
state.appends += 1;
var cap = dzDiagCap(key);
while (ring.length > cap) { ring.shift(); state.evicted += 1; }
return "appended";
} catch (e) {
if (state) { state.failures = (state.failures || 0) + 1; }
return "failed";
}
}
var DZ_DIAG_SCHEMA = {
build: { theme_version: "string", theme_folder: "string", domoticz_version: "string" },
view: { route: "string", width: "number", height: "number", phone: "boolean", scheme: "string", base: "string", engine: "string" },
features: { enabled: "string[]" },
cards: { total: "number", flagged_timeout: "number", flagged_battery: "number", unresolved_idx: "number" },
warnings: { keys_idx: "number", keys_named: "number", repeat_mode: "string", store_ages: "object" },
toasts: { visible: "number", queued: "number", groups: "string[]" },
problems: { badge: "number", rows: "number", outcome: "string" },
filter: { members: "number", label_len: "number", chip: "boolean" },
mode: { admin: "boolean", per_user: "boolean", no_identity: "boolean", transport: "string" },
layout: { dpr: "number", visual_scale: "number", chrome_px: "number", root_font_px: "number",
body_font_px: "number", forced_colors: "boolean", prefers_contrast: "boolean",
reduced_motion: "boolean", fonts: "string", icon_font: "boolean",
card_bounds: "string", cards_painted: "number", card_width: "string",
width_buckets: "number", gutter_px: "number", header_px: "number",
foreign_css: "number", violations: "string[]" },
recorder: { state: "string", appends: "number", coalesced: "number", evicted: "number", page_open_ms: "number" }
};
function dzDiagTypeOk(value, want) {
if (want === "string") return typeof value === "string";
if (want === "number") return typeof value === "number" && isFinite(value);
if (want === "boolean") return typeof value === "boolean";
if (want === "string[]") {
if (!Array.isArray(value)) return false;
for (var i = 0; i < value.length; i++) { if (typeof value[i] !== "string") return false; }
return true;
}
if (want === "object") return !!value && typeof value === "object" && !Array.isArray(value);
return false;
}
function dzDiagSanitize(section, obj) {
var allowed = DZ_DIAG_SCHEMA[section] || {};
var value = {};
var dropped = [];
try {
Object.keys(obj || {}).forEach(function(k) {
if (Object.prototype.hasOwnProperty.call(allowed, k) && dzDiagTypeOk(obj[k], allowed[k])) {
value[k] = obj[k];
} else {
dropped.push(k);
}
});
} catch (e) {
}
return { value: value, dropped: dropped };
}
var DZ_DIAG_ROUTES = [
"Dashboard", "LightSwitches", "Scenes", "Temperature", "Weather", "Utility",
"Floorplans", "ProblemDevices", "Theme", "SetupMenu", "Custom", "Devices",
"Hardware", "Log", "Users", "Events", "Setup", "Energy", "Cam"
];
function dzDiagRoute(hash) {
try {
var raw = String(hash || "").replace(/^#\/?/, "");
if (!raw) return "#/";
var parts = raw.split("/");
if (DZ_DIAG_ROUTES.indexOf(parts[0]) === -1) return "#/:unknown";
var out = ["#", parts[0]];
var n = 0;
for (var i = 1; i < parts.length; i++) {
if (DZ_DIAG_ROUTES.indexOf(parts[i]) !== -1) { out.push(parts[i]); }
else { n += 1; out.push(":" + n); }
}
return out.join("/");
} catch (e) { return "#/:unknown"; }
}
var DZ_DIAG_ENGINES = [
["edge", /Edg(?:e|A|iOS)?\/(\d+)/],
["opera", /OPR\/(\d+)/],
["samsung", /SamsungBrowser\/(\d+)/],
["firefox", /Firefox\/(\d+)?/],
["chrome", /Chrome\/(\d+)/],
["safari", /Version\/(\d+)[.\d]* Safari/]
];
function dzDiagEngine(ua) {
try {
if (typeof ua !== "string" || !ua) return "unknown";
for (var i = 0; i < DZ_DIAG_ENGINES.length; i++) {
var m = ua.match(DZ_DIAG_ENGINES[i][1]);
if (m) { return DZ_DIAG_ENGINES[i][0] + (m[1] ? "/" + m[1] : ""); }
}
return "other";
} catch (e) { return "unknown"; }
}
function dzDiagKeyShape(keys) {
var out = { keys_idx: 0, keys_named: 0 };
try {
(keys || []).forEach(function(k) {
if (typeof k !== "string") return;
if (k.indexOf(":name:") !== -1) { out.keys_named += 1; }
else { out.keys_idx += 1; }
});
} catch (e) { }
return out;
}
var dzLogOn = false;
var dzDiagState = dzDiagNewState();
var dzDiagCollectors = {};
function dzDiagNow() {
return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
}
var dzDiagStartedAt = dzDiagNow();
var dzDiagPending = null;
var DZ_DIAG_PENDING_CAP = 50;
var dzDiagSettled = false;
function dzDiagAdoptBuffer(buf) {
if (Array.isArray(buf) && buf.length) { dzDiagPending = buf; }
}
function dzDiagHold(seam, event, fields) {
if (!dzDiagPending) { dzDiagPending = []; }
if (dzDiagPending.length < DZ_DIAG_PENDING_CAP) { dzDiagPending.push([seam, event, fields]); }
}
function dzDiagSetEnabled(on, settled) {
dzLogOn = on === true;
if (settled === true) { dzDiagSettled = true; }
if (dzLogOn) {
var pending = dzDiagPending;
dzDiagPending = null;
if (pending) {
for (var i = 0; i < pending.length; i++) {
try { dzLog(pending[i][0], pending[i][1], pending[i][2]); } catch (e) { }
}
}
} else if (settled === true) {
dzDiagPending = null;
}
return dzLogOn;
}
function dzLog(seam, event, fields) {
if (!dzLogOn) {
if (!dzDiagSettled) { dzDiagHold(seam, event, fields); }
return false;
}
try {
var entry = fields && typeof fields === "object" ? fields : {};
entry.event = event;
dzDiagAppend(dzDiagState, seam, entry);
if (typeof console !== "undefined" && console.debug) {
console.debug("machinon_" + seam, event, entry);
}
return true;
} catch (e) {
dzDiagState.failures = (dzDiagState.failures || 0) + 1;
return false;
}
}
function dzDiagRegister(section, collect) {
if (typeof collect === "function") { dzDiagCollectors[section] = collect; }
}
function dzDiagCollect(opts) {
var live = {};
var dropped = [];
Object.keys(dzDiagCollectors).forEach(function(section) {
try {
var raw = dzDiagCollectors[section](opts) || {};
if (raw.route) { raw.route = dzDiagRoute(raw.route); }
if (opts && opts.names) {
live[section] = raw;
return;
}
var clean = dzDiagSanitize(section, raw);
live[section] = clean.value;
clean.dropped.forEach(function(k) { dropped.push(section + "." + k); });
} catch (e) {
live[section] = { error: String(e && e.message ? e.message : e) };
}
});
if (dropped.length) { live._dropped = dropped; }
return live;
}
function dzDiagHistory() {
if (!dzLogOn) { return { recorder: "off" }; }
var out = { recorder: "on", appends: dzDiagState.appends, coalesced: dzDiagState.coalesced,
evicted: dzDiagState.evicted, entries: {} };
Object.keys(dzDiagState.rings).forEach(function(seam) {
out.entries[seam] = dzDiagState.rings[seam].map(function(e) {
var copy = {};
Object.keys(e).forEach(function(k) { if (k !== "__id") { copy[k] = e[k]; } });
return copy;
});
});
return out;
}
function dzDiagSnapshot(opts) {
var snap = { live: dzDiagCollect(opts), history: dzDiagHistory() };
snap.live.recorder = {
state: dzLogOn ? "on" : "off",
appends: dzDiagState.appends,
coalesced: dzDiagState.coalesced,
evicted: dzDiagState.evicted,
page_open_ms: Math.round(dzDiagNow() - dzDiagStartedAt)
};
return snap;
}
function machinonDiag(opts) {
var snap = dzDiagSnapshot({ names: false, quiet: opts && opts.quiet });
if (!(opts && opts.quiet) && typeof console !== "undefined" && console.log) {
console.log("Machinon diagnostics", snap);
}
return snap;
}
function machinonDiagNames(opts) {
var snap = dzDiagSnapshot({ names: true, quiet: opts && opts.quiet });
if (!(opts && opts.quiet) && typeof console !== "undefined" && console.log) {
console.log("Machinon diagnostics (with device names, not for public issues)", snap);
}
return snap;
}
function machinonDiagText() {
try { return JSON.stringify(machinonDiag({ quiet: true }), null, 2); }
catch (e) { return "{}"; }
}
(function() {
try {
if (typeof window === "undefined") return;
dzDiagAdoptBuffer(window.__dzDiagBuffer);
window.__dzDiagBuffer = null;
window.dzLog = dzLog;
} catch (e) { }
})();
function dzDiagRefreshGate(settled) {
var on = false;
try {
on = !!(typeof theme !== "undefined" && theme && theme.features &&
theme.features.diagnostic_logging &&
theme.features.diagnostic_logging.enabled === true);
} catch (e) { }
if (!on) {
try {
if (typeof localStorage !== "undefined" && typeof themeFolder !== "undefined") {
on = localStorage.getItem(themeFolder + ".diag") === "on";
}
} catch (e) { }
}
try {
if (typeof localStorage !== "undefined" && typeof themeFolder !== "undefined") {
var key = themeFolder + ".diag.last";
if (settled === true) { localStorage.setItem(key, on ? "on" : "off"); }
else if (!on) { on = localStorage.getItem(key) === "on"; }
}
} catch (e) { }
return dzDiagSetEnabled(on, settled);
}
(function() {
try {
if (typeof window === "undefined") return;
window.addEventListener("storage", function(ev) {
if (ev && typeof ev.key === "string" && ev.key.indexOf(".diag") !== -1) {
dzDiagRefreshGate();
}
});
dzDiagRefreshGate();
} catch (e) { }
})();
