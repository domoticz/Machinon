var DZ_TOAST_BASE_MS = 4000;
var DZ_TOAST_ERROR_MS = 6000;
var DZ_TOAST_GROUP_CAP_MS = 8000;
var DZ_TOAST_COALESCE_MS = 1200;
var DZ_TOAST_LOG_MAX = 50;
var DZ_TOAST_NAME_CAP = 5;
var DZ_TOAST_DEFAULT_ICON = {
success: "ion-ios-checkmark-circle",
warning: "ion-ios-alert",
error: "ion-ios-close-circle",
info: "ion-ios-information-circle"
};
function dzToastCreateState() {
return { seen: {}, log: [] };
}
function dzToastShouldSuppress(state, key) {
if (!key) return false;
return state.seen[key] === true;
}
function dzToastMarkSeen(state, key) {
if (!key) return;
state.seen[key] = true;
}
function dzToastClearKey(state, key) {
if (!key) return;
delete state.seen[key];
}
var DZ_WARN_STORE_KEY_SUFFIX = ".warnSeen";
var DZ_WARN_DAILY_MS = 24 * 60 * 60 * 1000;
var DZ_WARN_PRUNE_MS = 30 * 24 * 60 * 60 * 1000;
function dzWarnRepeatAllows(store, key, mode, now) {
if (mode === "visit") return true;
var last;
try {
last = store.get(key);
} catch (e) {
return true;
}
if (last === undefined || last === null) return true;
if (mode === "episode") return false;
return (now - last) >= DZ_WARN_DAILY_MS;
}
function dzWarnRecord(store, key, mode, now) {
if (mode === "visit") return;
try {
store.set(key, now);
} catch (e) { }
}
function dzWarnKey(prefix, idx, name) {
if (idx) return prefix + ":" + idx;
if (name) return prefix + ":name:" + name;
return null;
}
function dzWarnClearableKeys(warnedKeys, clearedKeys) {
var warned = {};
(warnedKeys || []).forEach(function (k) { if (k) warned[k] = true; });
return (clearedKeys || []).filter(function (k) { return k && warned[k] !== true; });
}
function dzWarnPrune(store, now) {
var keys;
try {
keys = store.keys();
} catch (e) {
return;
}
keys.forEach(function(key) {
var last;
try {
last = store.get(key);
} catch (e) {
return;
}
if (last === undefined || last === null) return;
if (now - last > DZ_WARN_PRUNE_MS) {
try { store.remove(key); } catch (e) { }
}
});
}
function dzToastSummary(names, total) {
var shown = names.slice(0, DZ_TOAST_NAME_CAP);
var rest = total - shown.length;
var lines = shown.slice();
if (rest > 0) {
lines.push(dzT("toasts.and_more", { count: rest }));
}
return lines;
}
function dzToastDeadline(base, grouped) {
if (base === false) return false;
if (!grouped) return base;
return base > DZ_TOAST_GROUP_CAP_MS ? base : DZ_TOAST_GROUP_CAP_MS;
}
function dzToastPushLog(state, event) {
state.log.push(event);
while (state.log.length > DZ_TOAST_LOG_MAX) state.log.shift();
}
var dzToastState = dzToastCreateState();
var dzToastStackEl = null;
var dzToastVisible = [];
var dzToastQueue = [];
var dzToastGroups = {};
function dzToastMaxVisible() {
return window.innerWidth <= 767 ? 2 : 4;
}
function dzToastStack() {
if (dzToastStackEl && dzToastStackEl.parentNode) return dzToastStackEl;
dzToastStackEl = document.createElement("div");
dzToastStackEl.id = "dz-toast-stack";
dzToastStackEl.setAttribute("aria-live", "polite");
document.body.appendChild(dzToastStackEl);
return dzToastStackEl;
}
function dzToastLine(cls, text) {
var el = document.createElement("div");
el.className = cls;
el.appendChild(document.createTextNode(text));
return el;
}
function dzToastRenderBodyLines(container, lines) {
container.textContent = "";
lines.forEach(function(line) {
container.appendChild(dzToastLine("dz-toast-body-line", line));
});
}
function dzToastBuildAction(action) {
var row = document.createElement("div");
row.className = "dz-toast-action-row";
var label = (action && action.label) || "";
var url = action ? dzValidHttpUrl(action.href) : null;
if (url) {
var a = document.createElement("a");
a.className = "dz-toast-action";
a.href = url;
a.target = "_blank";
a.rel = "noopener noreferrer";
a.appendChild(document.createTextNode(label));
row.appendChild(a);
} else {
row.appendChild(document.createTextNode(label));
}
return row;
}
function dzToastBuild(ev) {
var el = document.createElement("div");
el.className = "dz-toast dz-toast--" + (ev.type || "info");
if (ev.type === "error") el.setAttribute("role", "alert");
if (ev.source === "device-warning" && ev.group) {
el.classList.add("dz-toast--" + ev.group);
}
var icon = document.createElement("i");
icon.className = "dz-toast-icon " + (ev.icon || DZ_TOAST_DEFAULT_ICON[ev.type] || DZ_TOAST_DEFAULT_ICON.info);
icon.setAttribute("aria-hidden", "true");
el.appendChild(icon);
var content = document.createElement("div");
content.className = "dz-toast-content";
content.appendChild(dzToastLine("dz-toast-title", ev.title || ""));
if (ev.bodyLines && ev.bodyLines.length) {
var body = document.createElement("div");
body.className = "dz-toast-body";
dzToastRenderBodyLines(body, ev.bodyLines);
content.appendChild(body);
} else if (ev.body) {
content.appendChild(dzToastLine("dz-toast-body", ev.body));
}
if (ev.action) content.appendChild(dzToastBuildAction(ev.action));
if (ev.source === "device-warning") {
var show = document.createElement("button");
show.type = "button";
show.className = "dz-toast-show-devices";
show.hidden = true;
show.appendChild(document.createTextNode(dzT("toasts.show_devices")));
content.appendChild(show);
}
el.appendChild(content);
var close = document.createElement("button");
close.type = "button";
close.className = "dz-toast-close";
close.setAttribute("aria-label",
(typeof $ !== "undefined" && $.t) ? $.t("Close") : "Close");
close.appendChild(document.createTextNode("×"));
el.appendChild(close);
return { el: el, closeBtn: close };
}
function dzToastFilterLabel(rec) {
if (rec.total > 1 && rec.ev.groupTitle) return rec.ev.groupTitle(rec.total);
return rec.names[0] || rec.ev.title || "";
}
function dzToastSyncShowDevices(rec) {
var btn = rec.el && rec.el.querySelector(".dz-toast-show-devices");
if (btn) btn.hidden = !rec.idxs.length;
}
function dzToastRemove(rec) {
if (rec.removed) return;
rec.removed = true;
if (rec.timer) clearTimeout(rec.timer);
if (rec.group && dzToastGroups[rec.group] === rec) delete dzToastGroups[rec.group];
var i = dzToastVisible.indexOf(rec);
if (i >= 0) dzToastVisible.splice(i, 1);
rec.el.classList.remove("dz-toast--in");
setTimeout(function() {
if (rec.el.parentNode) rec.el.parentNode.removeChild(rec.el);
dzToastDrain();
}, 320);
}
function dzToastArm(rec, ms) {
if (ms === false) return;
rec.startedAt = Date.now();
rec.remaining = ms;
rec.timer = setTimeout(function() { dzToastRemove(rec); }, ms);
}
function dzToastStopTimer(rec) {
if (rec.remaining === false || !rec.timer) return;
clearTimeout(rec.timer);
rec.timer = null;
rec.remaining = Math.max(0, rec.remaining - (Date.now() - rec.startedAt));
}
function dzToastStartTimer(rec) {
if (rec.remaining === false || rec.timer || rec.removed || rec.paused) return;
dzToastArm(rec, rec.remaining);
}
function dzToastPause(rec) {
rec.paused = true;
dzToastStopTimer(rec);
}
function dzToastResume(rec) {
rec.paused = false;
dzToastStartTimer(rec);
}
function dzToastShow(ev) {
var built = dzToastBuild(ev);
var rec = {
el: built.el, group: ev.group || null, names: ev.deviceName ? [ev.deviceName] : [],
members: dzToastMembers(ev),
total: ev.deviceName ? 1 : 0, base: ev.timeout, removed: false, timer: null,
remaining: ev.timeout, startedAt: 0, paused: false, ev: ev,
idxs: ev.deviceIdx ? [String(ev.deviceIdx)] : [],
hash: (typeof location !== "undefined" ? location.hash : "")
};
built.closeBtn.addEventListener("click", function(e) {
e.stopPropagation();
dzToastRemove(rec);
});
built.el.addEventListener("mouseenter", function() { dzToastPause(rec); });
built.el.addEventListener("mouseleave", function() { dzToastResume(rec); });
built.el.addEventListener("focusin", function() { dzToastPause(rec); });
built.el.addEventListener("focusout", function() { dzToastResume(rec); });
var showBtn = rec.el.querySelector(".dz-toast-show-devices");
if (showBtn) {
showBtn.addEventListener("click", function (e) {
e.stopPropagation();
if (rec.idxs.length && location.hash === rec.hash &&
typeof dzApplySetFilter === "function") {
var members = {};
rec.idxs.forEach(function (idx) { members["d:" + idx] = true; });
dzApplySetFilter(members, dzToastFilterLabel(rec));
}
dzToastRemove(rec);
});
}
dzToastSyncShowDevices(rec);
rec.createdAt = Date.now();
dzToastStack().appendChild(built.el);
dzToastVisible.push(rec);
if (rec.group) dzToastGroups[rec.group] = rec;
void built.el.offsetHeight;
built.el.classList.add("dz-toast--in");
dzToastArm(rec, dzToastDeadline(ev.timeout, false));
return rec;
}
function dzToastMember(ev) {
return {
name: ev.deviceName || null,
idx: ev.deviceIdx ? String(ev.deviceIdx) : null
};
}
function dzToastMembers(ev) {
return (ev.deviceName || ev.deviceIdx) ? [dzToastMember(ev)] : [];
}
function dzToastMemberIndex(rec, ev) {
var idx = ev.deviceIdx ? String(ev.deviceIdx) : null;
var members = rec.members || [];
for (var i = 0; i < members.length; i++) {
var m = members[i];
if (idx && m.idx === idx) return i;
if (ev.deviceName && m.name === ev.deviceName && (!idx || !m.idx)) return i;
}
return -1;
}
function dzToastAdoptIdx(rec, member, ev) {
if (!ev.deviceIdx) return;
var idx = String(ev.deviceIdx);
if (member && !member.idx) member.idx = idx;
if (rec.idxs.indexOf(idx) === -1) rec.idxs.push(idx);
}
var DZ_TOAST_CONTENT_KIND = "browser-notify";
function dzToastIsContentRepeat(rec, ev) {
return ev.groupKind === DZ_TOAST_CONTENT_KIND && !!rec.ev && rec.ev.groupKind === DZ_TOAST_CONTENT_KIND;
}
function dzToastMerge(rec, ev) {
if (dzToastIsContentRepeat(rec, ev)) return true;
var at = dzToastMemberIndex(rec, ev);
if (at !== -1) {
dzToastAdoptIdx(rec, rec.members[at], ev);
dzToastSyncShowDevices(rec);
return true;
}
if (ev.deviceName || ev.deviceIdx) rec.members.push(dzToastMember(ev));
if (ev.deviceName) rec.names.push(ev.deviceName);
if (ev.deviceIdx) rec.idxs.push(String(ev.deviceIdx));
dzToastSyncShowDevices(rec);
rec.total += 1;
var title = rec.el.querySelector(".dz-toast-title");
var body = rec.el.querySelector(".dz-toast-body");
title.textContent = ev.groupTitle ? ev.groupTitle(rec.total) : rec.total + " devices";
if (!body) {
body = document.createElement("div");
body.className = "dz-toast-body";
rec.el.querySelector(".dz-toast-content").appendChild(body);
}
dzToastRenderBodyLines(body, dzToastSummary(rec.names, rec.total));
var want = dzToastDeadline(rec.base, true);
if (want !== false && !rec.extended) {
rec.extended = true;
dzToastStopTimer(rec);
rec.remaining = want;
dzToastStartTimer(rec);
}
return false;
}
function dzToastQueueMerge(entry, ev) {
if (dzToastIsContentRepeat(entry, ev)) return true;
var at = dzToastMemberIndex(entry, ev);
if (at !== -1) {
dzToastAdoptIdx(entry, entry.members[at], ev);
return true;
}
if (ev.deviceName || ev.deviceIdx) entry.members.push(dzToastMember(ev));
if (ev.deviceName) entry.names.push(ev.deviceName);
if (ev.deviceIdx) entry.idxs.push(String(ev.deviceIdx));
entry.total += 1;
entry.ev.title = ev.groupTitle ? ev.groupTitle(entry.total) : dzT("toasts.devices", { count: entry.total });
entry.ev.bodyLines = dzToastSummary(entry.names, entry.total);
delete entry.ev.body;
if (!entry.extended) {
var want = dzToastDeadline(entry.ev.timeout, true);
if (want !== false) {
entry.extended = true;
entry.ev.timeout = want;
}
}
}
function dzToastQueuePush(ev) {
var entry = {
ev: ev, queued: true, removed: false, createdAt: Date.now(),
names: ev.deviceName ? [ev.deviceName] : [], total: ev.deviceName ? 1 : 0,
idxs: ev.deviceIdx ? [String(ev.deviceIdx)] : [],
members: dzToastMembers(ev),
hash: (typeof location !== "undefined" ? location.hash : ""),
extended: false
};
dzToastQueue.push(entry);
if (ev.group) dzToastGroups[ev.group] = entry;
return entry;
}
function dzToastCancelQueued(entry) {
if (entry.removed) return;
entry.removed = true;
var i = dzToastQueue.indexOf(entry);
if (i >= 0) dzToastQueue.splice(i, 1);
if (entry.ev.group && dzToastGroups[entry.ev.group] === entry) delete dzToastGroups[entry.ev.group];
}
function dzToastDrain() {
while (dzToastQueue.length && dzToastVisible.length < dzToastMaxVisible()) {
var entry = dzToastQueue.shift();
var rec = dzToastShow(entry.ev);
if (entry.total) {
rec.total = entry.total;
rec.names = entry.names.slice();
rec.idxs = entry.idxs.slice();
rec.members = entry.members.slice();
rec.hash = entry.hash;
dzToastSyncShowDevices(rec);
}
if (entry.extended) rec.extended = true;
}
}
function dzToast(ev) {
if (!ev || typeof ev !== "object") return { close: function() {}, shown: false };
if (ev.timeout === undefined) {
ev.timeout = ev.type === "error" ? DZ_TOAST_ERROR_MS : DZ_TOAST_BASE_MS;
}
if (dzToastShouldSuppress(dzToastState, ev.key)) {
dzToastLogDecision(ev, "suppressed", 0);
return { close: function() {}, shown: false };
}
dzToastMarkSeen(dzToastState, ev.key);
dzToastPushLog(dzToastState, {
t: Date.now(), type: ev.type, title: ev.title, body: ev.body,
source: ev.source, deviceIdx: ev.deviceIdx || null
});
var live = ev.group ? dzToastGroups[ev.group] : null;
if (live && !live.removed && (Date.now() - live.createdAt) <= DZ_TOAST_COALESCE_MS) {
if (live.queued) {
var dupQ = dzToastQueueMerge(live, ev);
dzToastLogDecision(ev, dupQ ? "duplicate" : "merged_queued", live.total);
return { close: function() { dzToastCancelQueued(live); }, shown: true, duplicate: dupQ };
}
var dup = dzToastMerge(live, ev);
dzToastLogDecision(ev, dup ? "duplicate" : "merged", live.total);
return { close: function() { dzToastRemove(live); }, shown: true, duplicate: dup };
}
if (dzToastVisible.length >= dzToastMaxVisible()) {
var entry = dzToastQueuePush(ev);
dzToastLogDecision(ev, "queued", entry.total);
return { close: function() { dzToastCancelQueued(entry); }, shown: true };
}
var rec = dzToastShow(ev);
dzToastLogDecision(ev, "shown", rec.total);
return { close: function() { dzToastRemove(rec); }, shown: true };
}
function dzToastLogDecision(ev, outcome, total) {
if (typeof dzLogOn === "undefined" || !dzLogOn) return;
try {
dzLog("toast", "decision", {
outcome: outcome,
group: ev.groupKind || ev.group || "none",
source: ev.source || "core",
type: ev.type || "info",
total: total || 0
});
} catch (e) { }
}
function dzToastLog() { return dzToastState.log.slice(); }
function dzToastCloseAll() {
dzToastVisible.slice().forEach(dzToastRemove);
dzToastQueue.forEach(function(entry) {
if (entry.ev.group && dzToastGroups[entry.ev.group] === entry) delete dzToastGroups[entry.ev.group];
});
dzToastQueue.length = 0;
}
function dzToastInstallKeyboard() {
document.addEventListener("keydown", function(e) {
if (e.key !== "Escape" || !dzToastVisible.length) return;
dzToastRemove(dzToastVisible[dzToastVisible.length - 1]);
});
}
if (typeof document !== "undefined") dzToastInstallKeyboard();
if (typeof dzDiagRegister === "function") {
dzDiagRegister("toasts", function(opts) {
var out = {
visible: dzToastVisible.length,
queued: dzToastQueue.length,
groups: dzToastVisible.map(function(r) { return r.ev.groupKind || r.group || "none"; })
};
if (opts && opts.names) {
out.names = dzToastVisible.map(function(r) { return (r.names || []).join(", "); });
}
return out;
});
}
