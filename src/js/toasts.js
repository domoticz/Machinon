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
var DZ_TOAST_NAME_CAP = 5;

/* Default glyph by severity, used when an event carries no explicit ev.icon.
   Ionicons is loaded unconditionally (custom.css imports css/ionicons.min.css),
   so every one of these classes is always available. */
var DZ_TOAST_DEFAULT_ICON = {
    success: "ion-ios-checkmark-circle",
    warning: "ion-ios-alert",
    error: "ion-ios-close-circle",
    info: "ion-ios-information-circle"
};

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

/* Persisted warn state, layered ON TOP OF the session dedupe above. The
   session dedupe (dzToastShouldSuppress/dzToastMarkSeen) always applies and
   resets on reload; this is the OPTIONAL extra quiet period a user can pick
   (theme.warn_repeat: "visit" | "daily" | "episode"), backed by localStorage
   ONLY, never the server: this is bookkeeping, not preference, and every
   ThemeSettings write goes through a serialisation queue built for settings
   edits, so a house with fifteen bad devices would push fifteen writes a day
   through it. Per-browser is also arguably the right granularity for "have I
   already told you". A storage failure degrades to `visit` behaviour, never
   to silence: the functions below never let a throwing store suppress a
   warning, only fail to remember one.

   `store` is an abstraction, not raw localStorage: { get(key), set(key, ms),
   remove(key), keys() }, each of which may throw (private browsing, quota,
   disabled storage). The real implementation (devices.js) backs it with the
   single localStorage key themeFolder + DZ_WARN_STORE_KEY_SUFFIX, one JSON
   blob of key->last-warned-ms. Clearing a key (store.remove) is how a
   recovered-then-failed-again device re-arms in EVERY mode, including
   `daily`: dzWarnPass calls it the same way it already calls
   dzToastClearKey for the session store, so a condition clearing is always
   new information and never waits out the timer. */
var DZ_WARN_STORE_KEY_SUFFIX = ".warnSeen";
var DZ_WARN_DAILY_MS = 24 * 60 * 60 * 1000;
var DZ_WARN_PRUNE_MS = 30 * 24 * 60 * 60 * 1000;

/* true = allowed to warn now. `visit` never touches the store: a reload
   always warns again, by design. */
function dzWarnRepeatAllows(store, key, mode, now) {
    if (mode === "visit") return true;
    var last;
    try {
        last = store.get(key);
    } catch (e) {
        return true; /* unusable storage: never suppress, only fail to remember */
    }
    if (last === undefined || last === null) return true;
    if (mode === "episode") return false; /* any recorded warning holds until cleared */
    return (now - last) >= DZ_WARN_DAILY_MS; /* daily */
}

/* Record that `key` warned at `now`. Best-effort: a failed write just means
   the next check also finds nothing and allows again, i.e. it fails open,
   never silently suppresses. */
function dzWarnRecord(store, key, mode, now) {
    if (mode === "visit") return;
    try {
        store.set(key, now);
    } catch (e) { /* best effort */ }
}

/* Drop entries older than 30 days so the store does not grow forever for a
   house whose devices come and go. */
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
            try { store.remove(key); } catch (e) { /* best effort */ }
        }
    });
}

/* Returns one LINE per device, never a comma-joined sentence: device names
   come from hardware and plugins and freely contain dashes, brackets and
   other punctuation ("Woonkamer - Screen Links [kWh]"), which makes a comma
   an ambiguous separator. Capped at DZ_TOAST_NAME_CAP names; anything past
   that collapses into one trailing "and N more" line instead of growing the
   toast without bound. */
function dzToastSummary(names, total) {
    var shown = names.slice(0, DZ_TOAST_NAME_CAP);
    var rest = total - shown.length;
    var lines = shown.slice();
    if (rest > 0) {
        /* Localised, like every other group title in this file (see devices.js's
           groupTitle functions). Guarded the same way the close button's aria-label
           guards $.t: this keeps dzToastSummary callable from the node:vm policy
           test, which loads no lang file. */
        var and = (typeof language !== "undefined" && language.toast_and) || "and";
        var more = (typeof language !== "undefined" && language.toast_more) || "more";
        lines.push(and + " " + rest + " " + more);
    }
    return lines;
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
var dzToastQueue = [];     /* queued entries (dzToastQueuePush) waiting for a slot; never dropped */
var dzToastGroups = {};    /* group -> live record OR still-queued entry, for coalescing */

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

/* Renders a merged-toast body as one line per device, replacing whatever the
   container currently holds. Text nodes only, same as dzToastLine and for
   the same reason: device names are untrusted (hardware, plugins), so each
   line is its own escaped text node rather than a comma-joined string or,
   worse, innerHTML with a <br> separator. Plain <div>s give the line break
   for free via block layout, with no list markup and so no bullet glyph.
   container.textContent = "" also clears any existing child elements, not
   just text, so this is safe to call on a body div that already holds
   lines from a previous merge. */
function dzToastRenderBodyLines(container, lines) {
    container.textContent = "";
    lines.forEach(function(line) {
        container.appendChild(dzToastLine("dz-toast-body-line", line));
    });
}

/* Accepts an href ONLY when it parses as an absolute http or https URL.
   The URL constructor (not a regex) does the parsing, so this rejects
   javascript:, data:, and every other scheme the same way a browser's own
   scheme allow-list would, without trying to enumerate the deny-list by
   hand. Returns the normalised href on success, null otherwise. */
function dzToastValidHttpUrl(href) {
    try {
        var u = new URL(String(href), (typeof document !== "undefined" && document.baseURI) || undefined);
        return (u.protocol === "http:" || u.protocol === "https:") ? u.href : null;
    } catch (e) {
        return null;
    }
}

/* ev.action is a structured { label, href }, never raw markup: it exists so a
   toast can carry a real link (e.g. the update notice's release page) without
   the body ever being allowed to contain HTML. A rejected href still shows the
   label, as plain text, so a bad action degrades to information rather than
   silently disappearing. */
function dzToastBuildAction(action) {
    var row = document.createElement("div");
    row.className = "dz-toast-action-row";
    var label = (action && action.label) || "";
    var url = action ? dzToastValidHttpUrl(action.href) : null;
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
    /* ev.bodyLines is set instead of ev.body once a device-warning group has
       merged past one device (dzToastQueueMerge, below): a queued entry
       carries no DOM until dzToastDrain shows it, so the line-per-device
       body has to be expressible on the plain event object, not only built
       against a live element the way dzToastMerge builds it. */
    if (ev.bodyLines && ev.bodyLines.length) {
        var body = document.createElement("div");
        body.className = "dz-toast-body";
        dzToastRenderBodyLines(body, ev.bodyLines);
        content.appendChild(body);
    } else if (ev.body) {
        content.appendChild(dzToastLine("dz-toast-body", ev.body));
    }
    if (ev.action) content.appendChild(dzToastBuildAction(ev.action));
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

/* Low-level countdown control: stop/start the timer and recompute the
   remaining time, without deciding whether the toast SHOULD be counting down.
   Used both by the public pause/resume below (hover, focus) and by a group
   merge extending the deadline, which must not silently restart a timer the
   user paused. */
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

/* Explicit paused flag, not one inferred from a null timer: a null rec.timer
   also happens mid-merge, while the deadline is being recomputed, which is
   not the same thing as "the user is reading this and it must not
   disappear". Only hover and focus (via these two) ever set rec.paused, so a
   merge's internal stop/start dance (dzToastMerge) can never un-pause a toast
   the user is still hovering or focused on. */
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
        total: ev.deviceName ? 1 : 0, base: ev.timeout, removed: false, timer: null,
        remaining: ev.timeout, startedAt: 0, paused: false, ev: ev
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
        body = document.createElement("div");
        body.className = "dz-toast-body";
        rec.el.querySelector(".dz-toast-content").appendChild(body);
    }
    dzToastRenderBodyLines(body, dzToastSummary(rec.names, rec.total));
    /* One-way extension only. See dzToastDeadline. Stop/start the timer, not
       pause/resume: a merge recomputing the deadline must never flip
       rec.paused, or it would silently resume a toast the user is currently
       hovering or focused on (dzToastStartTimer still no-ops while paused). */
    var want = dzToastDeadline(rec.base, true);
    if (want !== false && !rec.extended) {
        rec.extended = true;
        dzToastStopTimer(rec);
        rec.remaining = want;
        dzToastStartTimer(rec);
    }
}

/* Same idea as dzToastMerge, but for a group leader that is still sitting in
   the queue: no DOM, no timer yet. Fold the arrival into the queued entry
   directly (title, body, extended deadline) so it renders with the full
   count the moment a slot opens, instead of every arrival before that being
   lost. This, plus dzToastGroups registration in dzToastQueuePush below, is
   what lets a group survive queueing instead of fanning out into one queued
   event per arrival. */
function dzToastQueueMerge(entry, ev) {
    if (ev.deviceName) entry.names.push(ev.deviceName);
    entry.total += 1;
    entry.ev.title = ev.groupTitle ? ev.groupTitle(entry.total) : entry.total + " devices";
    /* bodyLines, not body: see the comment on ev.bodyLines in dzToastBuild.
       The single-device body string this entry queued with is now stale and
       must not coexist with the line list dzToastBuild would otherwise skip. */
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

/* Wrap a queued event with the same group bookkeeping a live toast carries
   (names, total, createdAt, a removed flag), and register it in
   dzToastGroups so a same-group arrival that shows up while this one is
   still queued finds it and merges, instead of queuing a second event. */
function dzToastQueuePush(ev) {
    var entry = {
        ev: ev, queued: true, removed: false, createdAt: Date.now(),
        names: ev.deviceName ? [ev.deviceName] : [], total: ev.deviceName ? 1 : 0,
        extended: false
    };
    dzToastQueue.push(entry);
    if (ev.group) dzToastGroups[ev.group] = entry;
    return entry;
}

/* Cancel a still-queued entry (its close() handle was called before a slot
   ever opened). Identity-checked exactly like dzToastRemove clears a live
   group entry: only delete dzToastGroups[group] if it still points at THIS
   entry, so cancelling a stale handle can never clobber whatever group
   record - live or queued - has taken its place since, and a closed group
   can never be resurrected by a leftover reference. */
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
        /* Carry over whatever this leader merged while it was still queued:
           dzToastShow only knows about entry.ev's own single device. */
        if (entry.total) {
            rec.total = entry.total;
            rec.names = entry.names.slice();
        }
        if (entry.extended) rec.extended = true;
    }
}

/* The single entry point. Everything in the app - core's ~600 call sites, the
   theme's own, and the device warnings - arrives here. */
function dzToast(ev) {
    if (!ev || typeof ev !== "object") return { close: function() {}, shown: false };
    if (ev.timeout === undefined) {
        ev.timeout = ev.type === "error" ? DZ_TOAST_ERROR_MS : DZ_TOAST_BASE_MS;
    }
    if (dzToastShouldSuppress(dzToastState, ev.key)) return { close: function() {}, shown: false };
    dzToastMarkSeen(dzToastState, ev.key);
    dzToastPushLog(dzToastState, {
        t: Date.now(), type: ev.type, title: ev.title, body: ev.body,
        source: ev.source, deviceIdx: ev.deviceIdx || null
    });

    /* dzToastGroups holds either a live rec or a still-queued entry (queued:
       true); both carry .removed and .createdAt, so the coalesce-window check
       below is the same regardless of which one it finds. */
    var live = ev.group ? dzToastGroups[ev.group] : null;
    if (live && !live.removed && (Date.now() - live.createdAt) <= DZ_TOAST_COALESCE_MS) {
        if (live.queued) {
            dzToastQueueMerge(live, ev);
            return { close: function() { dzToastCancelQueued(live); }, shown: true };
        }
        dzToastMerge(live, ev);
        return { close: function() { dzToastRemove(live); }, shown: true };
    }

    if (dzToastVisible.length >= dzToastMaxVisible()) {
        /* Queue, never drop: dropping the oldest means a storm shows only the
           last few warnings. Group identity is preserved via dzToastQueuePush,
           so a same-group storm still coalesces into one toast while it
           waits for a slot instead of fanning out into a dozen serialised
           ones. */
        var entry = dzToastQueuePush(ev);
        return { close: function() { dzToastCancelQueued(entry); }, shown: true };
    }
    var rec = dzToastShow(ev);
    return { close: function() { dzToastRemove(rec); }, shown: true };
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
   Also empties dzToastQueue so nothing queued drains in behind the wipe,
   clearing dzToastGroups entries a queued entry (still) owns first so no
   stale reference survives the wipe. */
function dzToastCloseAll() {
    dzToastVisible.slice().forEach(dzToastRemove);
    dzToastQueue.forEach(function(entry) {
        if (entry.ev.group && dzToastGroups[entry.ev.group] === entry) delete dzToastGroups[entry.ev.group];
    });
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
