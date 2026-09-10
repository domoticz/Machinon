/* diag.js - the diagnostics recorder and the state snapshot.

   WHY THIS EXISTS. Defects in this theme are reported from a house nobody
   working on the repo can log into: a phone screenshot and a recollection,
   against a rig that frequently cannot reproduce the state that caused it. On
   2026-09-09 a grouped warning toast reported "4 sensors timed out" for two
   devices; the root cause was found and fixed, but which production cards put a
   device into the triggering state was never identified, because the state had
   to be induced by hand. This module turns a symptom into evidence.

   TOP-LEVEL CODE MUST NOT TOUCH document OR window. The kernel half of this
   feature runs before Angular exists (see the buffer in custom.js), and
   scripts/test-diag.mjs runs this file in a vm context with neither global, so
   a load-time reach for either is both a bug and a test failure.

   BEST-EFFORT, ALWAYS. Nothing in here may throw into its caller. The warning
   pass is reached from setAllDevicesIconsStatus() inside the device_update
   handler's own setTimeout tail (src/js/devices.js), which has no containment
   at all, so a throw there is an uncaught error at the websocket update rate
   AND kills the update-pulse repaint that follows it in the same timer. Every
   other cross-module boundary in this theme is explicitly best-effort; an
   always-loaded diagnostic must not be the exception. Design detail lives in
   docs/superpowers/specs/2026-09-09-diagnostics-design.md (local only). */

/* Per-seam ring caps, not one shared ring. The render pass fires roughly ten
   times a second under a websocket burst, and setAllDevicesIconsStatus is
   called once per device_update with no coalescing (measured elsewhere in this
   repo at 546 updates in 10 seconds against 228 devices). A single shared FIFO
   would therefore be flushed by the fastest seam before the reader reached the
   Copy diagnostics button, evicting exactly the warn and toast rows the
   recorder exists to keep. Sizes are per seam so that cannot happen. */
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

/* Which fields decide "this is the same entry as the last one". An explicit
   allowlist per seam, and EVERY clock- or counter-derived field is excluded on
   purpose: duration_ms, the relative timestamp, and the pass counter all change
   by construction on every invocation, so including any of them makes the
   coalescing rule vacuously true and turns the ring into a per-invocation
   sample of whatever runs most often. That was the single worst defect in the
   first draft of this design and two independent reviews caught it. Anything
   added here must be a discrete fact about the house, never a measurement. */
var DZ_DIAG_IDENTITY = {
    device_pass: ["event", "stage", "cards", "flagged", "unresolved_idx", "route"],
    /* One stream per condition, not one "warn_pass" stream: setAllDevicesIconsStatus
       runs both passes back to back, so sharing a ring makes every entry differ
       from the one before it by `condition` alone and coalescing can never fire.
       Measured on the rig before this was split. */
    warn_timeout: ["event", "condition", "enabled", "flagged", "warned", "cleared", "suppressed", "route"],
    warn_battery: ["event", "condition", "enabled", "flagged", "warned", "cleared", "suppressed", "route"],
    /* Deliberately excludes `key` and `total`: this seam fires per ARRIVAL, so
       including anything that varies per device turns a storm of N devices into
       N entries that evict every other seam's rows. Without them, N arrivals
       coalesce into one entry seen N times, which is the fact worth keeping.
       `key` must not travel here anyway: a device warning's key embeds the
       device NAME whenever the card's idx does not resolve. */
    toast: ["event", "outcome", "group", "source"],
    /* cards_matched is in the identity, unlike every count on the seams
       above it: it is a fact about the page, not a measurement of the pass, and
       a filter that matches nothing on the first render and everything on the
       second would otherwise be recorded once, as the state that was wrong. It
       is stable while a page sits still, so a burst of render passes still
       coalesces to one entry. */
    set_filter: ["event", "members", "cards_matched", "route"],
    settings: ["event", "outcome", "transport", "layer"],
    routes: ["event", "routes", "active", "reason"],
    filter: ["event", "query_len", "cards_in", "cards_out", "route"],
    problems: ["event", "rows", "badge", "outcome"]
};

/* A seam with no declared identity degrades to "every entry is distinct"
   rather than throwing or silently coalescing unrelated rows: a new seam that
   records too much is a nuisance, one that records nothing is a lie. */
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

/* Returns "appended", "coalesced" or "failed", and never throws. The identity
   is computed from the candidate BEFORE it is stored, and compared against the
   identity already carried by the newest entry, so a house sitting still
   allocates one small string rather than a whole candidate entry. */
function dzDiagAppend(state, seam, entry) {
    try {
        if (!state || !entry || typeof entry !== "object") { return "failed"; }
        var key = String(seam || "unknown");
        var ring = state.rings[key] || (state.rings[key] = []);
        var id = dzDiagIdentity(key, entry);
        /* Matched against the most recent entry with the SAME identity anywhere
           in this ring, not merely against the last row. Seams routinely
           alternate: the warning pass runs timeout then battery back to back,
           and the device pass runs visible then deferred, so a compare with the
           previous row alone can never fire and the ring fills with near
           duplicates. This was found three separate times on the live rig
           before the rule was generalised. Bounded by the seam's cap, so it is
           at most a few dozen string compares. What it gives up is the exact
           interleaving of two alternating states, which no defect this exists
           to catch depends on: the signal is what a single entry says, plus how
           often it was seen. */
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

/* ---- Output schema ----

   Redaction is an OUTPUT-side property, enforced here, not a promise about what
   the collectors hand over. The first draft asserted "the ring never holds a
   device name" and was wrong: warn keys carry one whenever a card's idx does
   not resolve, and that is precisely the population the snapshot reports on.
   An allowlist cannot be wrong in that direction.

   Unknown keys are stripped and their NAMES reported, never their values, so a
   field added without extending this schema shows up in the artifact as a
   question rather than as a silent leak or a silent hole. */
var DZ_DIAG_SCHEMA = {
    build: { theme_version: "string", theme_folder: "string", domoticz_version: "string" },
    view: { route: "string", width: "number", height: "number", phone: "boolean", scheme: "string", base: "string" },
    features: { enabled: "string[]" },
    cards: { total: "number", flagged_timeout: "number", flagged_battery: "number", unresolved_idx: "number" },
    warnings: { keys_idx: "number", keys_named: "number", repeat_mode: "string", store_ages: "object" },
    toasts: { visible: "number", queued: "number", groups: "string[]" },
    problems: { badge: "number", rows: "number", outcome: "string" },
    filter: { members: "number", label_len: "number", chip: "boolean" },
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
    } catch (e) { /* best effort: a collector that returns something exotic
                     contributes nothing rather than aborting the snapshot */ }
    return { value: value, dropped: dropped };
}

/* Route carries user data: core registers /Custom/:custompage, so the live hash
   on a custom page is a name the user chose, and the recorder attaches a route
   to most lines. Reduced to an allowlisted stem plus parameter arity. Unknown
   stems collapse rather than passing through, because a route core adds later
   is exactly the case nobody will remember to review. */
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
            /* A path segment that is not itself a known stem is a parameter,
               and a parameter is user data or a device idx; either way it is
               reported by position, not by value. */
            if (DZ_DIAG_ROUTES.indexOf(parts[i]) !== -1) { out.push(parts[i]); }
            else { n += 1; out.push(":" + n); }
        }
        return out.join("/");
    } catch (e) { return "#/:unknown"; }
}

/* Warn keys are counted by shape, never exported. dzWarnKey (src/js/toasts.js)
   returns prefix:idx when a card's idx resolves and prefix:name:NAME when it
   does not. The 2026-09-09 fix teaching dzCardIdx to read core's own
   td#name[data-idx] makes that fallback rare, but rare is not never, and this
   guarantee must not rest on another module's key format. */
function dzDiagKeyShape(keys) {
    var out = { keys_idx: 0, keys_named: 0 };
    try {
        (keys || []).forEach(function(k) {
            if (typeof k !== "string") return;
            if (k.indexOf(":name:") !== -1) { out.keys_named += 1; }
            else { out.keys_idx += 1; }
        });
    } catch (e) { /* best effort */ }
    return out;
}

/* ---- The gate ----

   Both dzLog and the recorder are gated by the one Theme Hub setting
   ("Diagnostic logging"), OFF by default (owner decision, 2026-09-10). An
   earlier draft kept the recorder always on so it would catch a defect's first
   occurrence, but an always-on household activity record with no operator
   control is not a default to impose on every install: a wall panel is reachable
   by people who never agreed to it. The cost accepted is that a reporter who has
   not enabled it must turn it on and reproduce; what it keeps is the thing that
   motivated the recorder, which is that the evidence survives the navigation to
   the Copy diagnostics button.

   dzLogOn is a CACHED boolean, never a storage read at call time: the seams that
   call it run per card inside a render pass driven off every websocket update,
   so a synchronous localStorage read per call would be orders of magnitude past
   the one boolean test this is supposed to cost. It is recomputed only at module
   load, from dzDiagRefreshGate() on the settings-apply path, and from a storage
   event for the per-browser override. */
var dzLogOn = false;
var dzDiagState = dzDiagNewState();
var dzDiagCollectors = {};
/* One monotonic clock for the whole feature. performance.now() is coarsened
   (100us in Chromium outside a cross-origin-isolated context, which a LAN HTTP
   install is not; 1ms in Firefox), which is why the sub-millisecond render pass
   records no duration at all, but it is the right clock for the seams that
   measure a network round trip. Date.now() is the fallback only, and it can
   step backwards. */
function dzDiagNow() {
    return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
}

var dzDiagStartedAt = dzDiagNow();

/* Entries the custom.js kernel buffered before this file loaded. Held, not
   recorded: the Diagnostic logging setting has not resolved at kernel time, so
   admitting them early would retain data on an install where the setting turns
   out to be off, which is the default. */
var dzDiagPending = null;

/* Same cap the custom.js kernel applies to its own buffer, and for the same
   reason: this is data retained on an install that has not consented yet, so it
   is bounded by construction rather than by how long a boot takes. */
var DZ_DIAG_PENDING_CAP = 50;

/* False until a caller that can actually READ the Diagnostic logging setting
   has refreshed the gate. Until then "off" means "not answered yet", not "no",
   and that distinction decides whether an early entry is held or dropped. */
var dzDiagSettled = false;

function dzDiagAdoptBuffer(buf) {
    if (Array.isArray(buf) && buf.length) { dzDiagPending = buf; }
}

function dzDiagHold(seam, event, fields) {
    if (!dzDiagPending) { dzDiagPending = []; }
    if (dzDiagPending.length < DZ_DIAG_PENDING_CAP) { dzDiagPending.push([seam, event, fields]); }
}

/* `settled` says whether the caller knows the Diagnostic logging setting's real
   value, and it decides the fate of the buffer, not of the gate. Both this
   file's own load and the storage listener run BEFORE the stored settings
   arrive, so they see the default (off) and would otherwise throw the kernel
   buffer away seconds before the setting that wanted it resolves. That is not
   hypothetical and not a corner: route registration happens inside core's
   Angular bootstrap and exists ONLY as a buffered entry, so on the ordinary
   path (setting on, no per-browser override) the routes line was being
   discarded every time. Held entries are bounded by the kernel's own 50-entry
   cap, so retaining them across an unresolved gate costs nothing measurable and
   an install that never settles simply never records them. */
function dzDiagSetEnabled(on, settled) {
    dzLogOn = on === true;
    if (settled === true) { dzDiagSettled = true; }
    if (dzLogOn) {
        var pending = dzDiagPending;
        dzDiagPending = null;
        if (pending) {
            for (var i = 0; i < pending.length; i++) {
                try { dzLog(pending[i][0], pending[i][1], pending[i][2]); } catch (e) { /* best effort */ }
            }
        }
    } else if (settled === true) {
        dzDiagPending = null;
    }
    return dzLogOn;
}

/* The one entry point the seams call. Structured: a fixed namespace and event,
   with varying data in fields, never an interpolated sentence. Hot call sites
   still guard with `if (dzLogOn)` themselves, because JavaScript evaluates
   arguments eagerly and would otherwise build the payload before this function
   could decline it. */
function dzLog(seam, event, fields) {
    if (!dzLogOn) {
        /* The boot-time seams (route registration, the settings load itself)
           fire before the setting that governs them can be read, so an
           unanswered gate holds rather than drops: the same rule the kernel
           buffer follows, continued past this file's load. A settled "off"
           drops here as it does there. Hot seams never reach this branch: they
           guard on dzLogOn at the call site because their payload is built
           eagerly, and they repeat often enough that losing the first few
           costs nothing. */
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

/* Each module registers the contributor for state it already owns. `opts.names`
   is passed through so a collector can offer a richer local-reading form; the
   schema still decides what survives, so a collector cannot widen the redacted
   output by mistake. */
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
            /* One section's collector failing must not cost the rest of the
               snapshot: a broken collector is itself a thing worth reporting. */
            live[section] = { error: String(e && e.message ? e.message : e) };
        }
    });
    if (dropped.length) { live._dropped = dropped; }
    return live;
}

/* Deep-copied on the way out. Devtools reads a logged object lazily, when the
   reader expands it, so handing back the live rings would show a buffer that has
   already turned over by the time anyone looks. */
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

/* NOT dz-prefixed, deliberately and only here. These two are the only symbols
   printed in the manual and typed by hand, and core owns real browser globals in
   the dz namespace (window.dzEasterEggs, window.dzOpenBarPopup), so a future
   collision would break the one command a user runs manually and would surface
   as a bug report rather than a build failure. The theme's other dz* names stay
   as they are; a collision canary guards those. */
function machinonDiag(opts) {
    var snap = dzDiagSnapshot({ names: false, quiet: opts && opts.quiet });
    if (!(opts && opts.quiet) && typeof console !== "undefined" && console.log) {
        console.log("Machinon diagnostics", snap);
    }
    return snap;
}

/* Device names included, for reading your own house. Never called by the Copy
   diagnostics button and never part of the reporting flow: the manual names
   both and says which one belongs in a bug report. */
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

/* Take over from the kernel shim in custom.js. Guarded because this file also
   runs in a vm context with no window (scripts/test-diag.mjs), which is what
   proves it touches no DOM at load time. */
(function() {
    try {
        if (typeof window === "undefined") return;
        dzDiagAdoptBuffer(window.__dzDiagBuffer);
        window.__dzDiagBuffer = null;
        window.dzLog = dzLog;
    } catch (e) { /* best effort */ }
})();

/* Recompute the cached gate from the theme setting and the per-browser
   override, OR'd. Called at three points and no others: this file's own load,
   the settings-apply path in src/js/settings-store.js, and a storage event for
   the override. Never at a dzLog call site, because those run per card inside a
   render pass driven off every websocket update, and a synchronous storage read
   there would be orders of magnitude past the one boolean test the design
   budgets for.

   Read defensively: a cached theme object written before diagnostics shipped has
   no diagnostic_logging key at all until the seeding block in loadSettings runs,
   and this can be called before it. */
function dzDiagRefreshGate(settled) {
    var on = false;
    try {
        on = !!(typeof theme !== "undefined" && theme && theme.features &&
                theme.features.diagnostic_logging &&
                theme.features.diagnostic_logging.enabled === true);
    } catch (e) { /* best effort */ }
    if (!on) {
        /* Per-browser override. Settings are house-wide today, so without this
           one person debugging switches console noise on for every user of the
           install. */
        try {
            if (typeof localStorage !== "undefined" && typeof themeFolder !== "undefined") {
                on = localStorage.getItem(themeFolder + ".diag") === "on";
            }
        } catch (e) { /* private mode, disabled storage: stay off */ }
    }
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
    } catch (e) { /* best effort */ }
})();
