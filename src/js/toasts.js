/* Machinon toast surface.
 *
 * WHY THIS FILE EXISTS. Domoticz ships two unrelated toast mechanisms, both
 * globals in www/js/domoticz.js: generate_noty (Noty 3, 20 core call sites) and
 * ShowNotify (one static #notification div, 565 core call sites). Machinon
 * styled neither, and custom.css hid the second outright, so 565 core messages
 * plus two of our own rendered NOTHING. See the 2026-08-31 audit in todo.md.
 *
 * This module owns rendering. It knows nothing about Domoticz: the adapters in
 * src/js/toast-hooks.js own core's signatures.
 *
 * TOP-LEVEL CODE MUST NOT TOUCH `document`. scripts/test-toast-policy.mjs runs
 * this file in a node:vm context with no DOM, so the policy below stays
 * testable without a browser. Function bodies may use the DOM freely.
 */

/* Timings. The group cap is the important one: a coalesced toast's deadline is
   set once and extended AT MOST ONCE, never reset per arrival. A reset-per-event
   deadline starves under exactly the storm coalescing exists to handle. */
var DZ_TOAST_BASE_MS = 4000;
var DZ_TOAST_ERROR_MS = 6000;
var DZ_TOAST_GROUP_CAP_MS = 8000;
var DZ_TOAST_COALESCE_MS = 1200;
var DZ_TOAST_LOG_MAX = 50;
var DZ_TOAST_NAME_CAP = 3;

function dzToastCreateState() {
    return { seen: {}, log: [] };
}

/* Dedupe is per device+condition and lasts the SESSION, not a short window:
   the measured defect is the same warning re-firing across route changes
   minutes apart. A null key (every core toast) is never deduped. */
function dzToastShouldSuppress(state, key) {
    if (!key) return false;
    return state.seen[key] === true;
}

function dzToastMarkSeen(state, key) {
    if (!key) return;
    state.seen[key] = true;
}

/* Called when a render pass sees the device WITHOUT the status class, i.e. the
   condition genuinely cleared. Told once when it goes bad, again if it goes
   bad again. */
function dzToastClearKey(state, key) {
    if (!key) return;
    delete state.seen[key];
}

function dzToastSummary(names, total) {
    var shown = names.slice(0, DZ_TOAST_NAME_CAP);
    var rest = total - shown.length;
    return rest > 0 ? shown.join(", ") + " and " + rest + " more" : shown.join(", ");
}

/* Grouping may only ever RAISE a short deadline to the cap. It never shortens a
   caller's deliberately long timeout, and sticky (false) stays sticky. */
function dzToastDeadline(base, grouped) {
    if (base === false) return false;
    if (!grouped) return base;
    return base > DZ_TOAST_GROUP_CAP_MS ? base : DZ_TOAST_GROUP_CAP_MS;
}

function dzToastPushLog(state, event) {
    state.log.push(event);
    while (state.log.length > DZ_TOAST_LOG_MAX) state.log.shift();
}

/* ---- Renderer ---- */

var dzToastState = dzToastCreateState();
var dzToastStackEl = null;
var dzToastVisible = [];   /* live toast records, oldest first */
var dzToastQueue = [];     /* events waiting for a slot; never dropped */
var dzToastGroups = {};    /* group -> live record, for coalescing */

/* 4 on desktop, 2 on a phone: a three-line toast stacked three deep eats the
   top third of an 844px viewport, and coalescing keeps a real storm at one or
   two toasts anyway. */
function dzToastMaxVisible() {
    return window.innerWidth <= 767 ? 2 : 4;
}

function dzToastStack() {
    if (dzToastStackEl && dzToastStackEl.parentNode) return dzToastStackEl;
    dzToastStackEl = document.createElement("div");
    dzToastStackEl.id = "dz-toast-stack";
    /* One polite region for the whole stack; individual error toasts add
       role="alert" so they interrupt, without making every toast interrupt. */
    dzToastStackEl.setAttribute("aria-live", "polite");
    document.body.appendChild(dzToastStackEl);
    return dzToastStackEl;
}

/* Text nodes only, never innerHTML: titles and bodies carry device names, which
   come from hardware and plugins. Injection is closed structurally here rather
   than by remembering to escape at each of the ~600 call sites. */
function dzToastLine(cls, text) {
    var el = document.createElement("div");
    el.className = cls;
    el.appendChild(document.createTextNode(text));
    return el;
}

function dzToastBuild(ev) {
    var el = document.createElement("div");
    el.className = "dz-toast dz-toast--" + (ev.type || "info");
    if (ev.type === "error") el.setAttribute("role", "alert");
    if (ev.source === "device-warning" && ev.group) {
        el.classList.add("dz-toast--" + ev.group);
    }
    var content = document.createElement("div");
    content.className = "dz-toast-content";
    content.appendChild(dzToastLine("dz-toast-title", ev.title || ""));
    if (ev.body) content.appendChild(dzToastLine("dz-toast-body", ev.body));
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

/* Deadline arming. rec.deadline is set ONCE and only ever raised by
   dzToastDeadline; the remaining time is recomputed on resume, never reset by
   a new arrival. */
function dzToastArm(rec, ms) {
    if (ms === false) return;
    rec.startedAt = Date.now();
    rec.remaining = ms;
    rec.timer = setTimeout(function() { dzToastRemove(rec); }, ms);
}

function dzToastPause(rec) {
    if (rec.remaining === false || !rec.timer) return;
    clearTimeout(rec.timer);
    rec.timer = null;
    rec.remaining = Math.max(0, rec.remaining - (Date.now() - rec.startedAt));
}

function dzToastResume(rec) {
    if (rec.remaining === false || rec.timer || rec.removed) return;
    dzToastArm(rec, rec.remaining);
}

function dzToastShow(ev) {
    var built = dzToastBuild(ev);
    var rec = {
        el: built.el, group: ev.group || null, names: ev.deviceName ? [ev.deviceName] : [],
        total: ev.deviceName ? 1 : 0, base: ev.timeout, removed: false, timer: null,
        remaining: ev.timeout, startedAt: 0, ev: ev
    };
    built.closeBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        dzToastRemove(rec);
    });
    built.el.addEventListener("mouseenter", function() { dzToastPause(rec); });
    built.el.addEventListener("mouseleave", function() { dzToastResume(rec); });
    built.el.addEventListener("focusin", function() { dzToastPause(rec); });
    built.el.addEventListener("focusout", function() { dzToastResume(rec); });

    /* Set here, not in dzToast: a toast that waited in the queue is shown by
       dzToastDrain, and a createdAt assigned only on the dzToast path would be
       undefined for those, making the coalesce window comparison NaN and
       silently disabling grouping for exactly the storm case. */
    rec.createdAt = Date.now();
    dzToastStack().appendChild(built.el);
    dzToastVisible.push(rec);
    if (rec.group) dzToastGroups[rec.group] = rec;
    /* Reflow before adding the transition class, or the entrance never plays. */
    void built.el.offsetHeight;
    built.el.classList.add("dz-toast--in");
    dzToastArm(rec, dzToastDeadline(ev.timeout, false));
    return rec;
}

/* Merge a same-group arrival into the live toast instead of stacking a second
   one. Twelve stale devices become one toast, not twelve serialised over 48s. */
function dzToastMerge(rec, ev) {
    if (ev.deviceName) rec.names.push(ev.deviceName);
    rec.total += 1;
    var title = rec.el.querySelector(".dz-toast-title");
    var body = rec.el.querySelector(".dz-toast-body");
    title.textContent = ev.groupTitle ? ev.groupTitle(rec.total) : rec.total + " devices";
    if (!body) {
        body = dzToastLine("dz-toast-body", "");
        rec.el.querySelector(".dz-toast-content").appendChild(body);
    }
    body.textContent = dzToastSummary(rec.names, rec.total);
    /* One-way extension only. See dzToastDeadline. */
    var want = dzToastDeadline(rec.base, true);
    if (want !== false && !rec.extended) {
        rec.extended = true;
        dzToastPause(rec);
        rec.remaining = want;
        dzToastResume(rec);
    }
}

function dzToastDrain() {
    while (dzToastQueue.length && dzToastVisible.length < dzToastMaxVisible()) {
        dzToastShow(dzToastQueue.shift());
    }
}

/* The single entry point. Everything in the app - core's ~600 call sites, the
   theme's own, and the device warnings - arrives here. */
function dzToast(ev) {
    if (!ev || typeof ev !== "object") return { close: function() {} };
    if (ev.timeout === undefined) {
        ev.timeout = ev.type === "error" ? DZ_TOAST_ERROR_MS : DZ_TOAST_BASE_MS;
    }
    if (dzToastShouldSuppress(dzToastState, ev.key)) return { close: function() {} };
    dzToastMarkSeen(dzToastState, ev.key);
    dzToastPushLog(dzToastState, {
        t: Date.now(), type: ev.type, title: ev.title, body: ev.body,
        source: ev.source, deviceIdx: ev.deviceIdx || null
    });

    var live = ev.group ? dzToastGroups[ev.group] : null;
    if (live && !live.removed && (Date.now() - live.createdAt) <= DZ_TOAST_COALESCE_MS) {
        dzToastMerge(live, ev);
        return { close: function() { dzToastRemove(live); } };
    }

    if (dzToastVisible.length >= dzToastMaxVisible()) {
        /* Queue, never drop: dropping the oldest means a storm shows only the
           last few warnings. */
        dzToastQueue.push(ev);
        return { close: function() {
            var i = dzToastQueue.indexOf(ev);
            if (i >= 0) dzToastQueue.splice(i, 1);
        } };
    }
    var rec = dzToastShow(ev);
    return { close: function() { dzToastRemove(rec); } };
}

function dzToastLog() { return dzToastState.log.slice(); }

/* Tear down every toast through the real removal path. Removing .dz-toast
   DOM nodes directly (as a caller resetting the surface might be tempted to
   do) leaks a visible slot forever: dzToastVisible only shrinks via
   dzToastRemove, which the close button and the per-toast timer call. Skip
   that path and every dzToast() call afterward is silently queued against
   slots that still look occupied, starving the stack for good. Both the dev
   preview panel's "close all" button and the screenshot gallery harness
   need this, so it lives here once instead of being reimplemented, wrong,
   in each caller. Iterate a COPY of dzToastVisible: dzToastRemove splices
   the live array, so iterating it directly would skip every other entry.
   Also empties dzToastQueue so nothing queued drains in behind the wipe. */
function dzToastCloseAll() {
    dzToastVisible.slice().forEach(dzToastRemove);
    dzToastQueue.length = 0;
}

/* Esc dismisses the newest toast. Guarded by a typeof check because this file
   is also executed in a node:vm context with no DOM by
   scripts/test-toast-policy.mjs; a bare top-level document reference would
   throw there and take the whole policy suite with it. */
function dzToastInstallKeyboard() {
    document.addEventListener("keydown", function(e) {
        if (e.key !== "Escape" || !dzToastVisible.length) return;
        dzToastRemove(dzToastVisible[dzToastVisible.length - 1]);
    });
}
if (typeof document !== "undefined") dzToastInstallKeyboard();
