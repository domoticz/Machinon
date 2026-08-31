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
