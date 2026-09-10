import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Same pattern as test-toast-policy.mjs: src/js files are plain browser scripts
   declaring globals, so run the SHIPPING file in a vm context and read the
   globals back. The context has no `document` and no `window`, which also
   proves diag.js touches neither at load time. That matters more here than
   elsewhere: the kernel half of this feature is expected to run before Angular
   exists, so anything that reaches for the DOM on load is a bug. */
function loadDiag() {
    const ctx = vm.createContext({ Math, console, JSON, performance: { now: () => 0 } });
    vm.runInContext(readFileSync("src/js/diag.js", "utf8"), ctx, { filename: "src/js/diag.js" });
    return ctx;
}

const dz = loadDiag();

/* ---- The coalescing identity ----

   The first draft of the spec bound a monotonic pass counter into every line
   and duration_ms into three seams, so "append only when the summary differs"
   was true on every single invocation and the ring degraded to sampling the
   fastest seam. Two independent reviews caught it before a line was written.
   The identity is therefore an explicit per-seam allowlist, and these tests
   exist to stop a clock-derived field creeping back into one. */

test("the coalescing identity ignores clock and counter fields", () => {
    const a = { event: "pass_complete", stage: "visible", cards: 27, route: "#/Dashboard",
                duration_ms: 4.2, pass: 17, t_minus_ms: 900 };
    const b = { event: "pass_complete", stage: "visible", cards: 27, route: "#/Dashboard",
                duration_ms: 9.9, pass: 18, t_minus_ms: 40 };
    assert.equal(dz.dzDiagIdentity("device_pass", a), dz.dzDiagIdentity("device_pass", b),
        "two passes differing only in duration and counter are the same entry");
});

test("the coalescing identity still separates entries that differ in substance", () => {
    const a = { event: "pass_complete", stage: "visible", cards: 27, route: "#/Dashboard" };
    const b = { event: "pass_complete", stage: "visible", cards: 26, route: "#/Dashboard" };
    assert.notEqual(dz.dzDiagIdentity("device_pass", a), dz.dzDiagIdentity("device_pass", b));
});

test("an unknown seam falls back to a defined identity rather than throwing", () => {
    /* Diagnostics is best-effort and never throws: a seam added without an
       identity entry must degrade to "every entry is distinct", not crash the
       render pass it is instrumenting. */
    const id = dz.dzDiagIdentity("seam_nobody_declared", { event: "x", a: 1 });
    assert.equal(typeof id, "string");
    assert.notEqual(id, dz.dzDiagIdentity("seam_nobody_declared", { event: "x", a: 2 }));
});

/* ---- The ring ---- */

test("an identical consecutive entry for the same seam is coalesced away", () => {
    const state = dz.dzDiagNewState();
    const e = { event: "pass_complete", stage: "visible", cards: 27, route: "#/Dashboard" };
    assert.equal(dz.dzDiagAppend(state, "device_pass", { ...e, duration_ms: 1 }), "appended");
    assert.equal(dz.dzDiagAppend(state, "device_pass", { ...e, duration_ms: 2 }), "coalesced");
    assert.equal(dz.dzDiagAppend(state, "device_pass", { ...e, duration_ms: 3 }), "coalesced");
    assert.equal(state.rings.device_pass.length, 1, "a house sitting still writes one entry, not three");
});

test("a hot seam cannot evict a cold one, because each seam has its own ring", () => {
    /* The whole reason the ring is partitioned. Under a websocket burst the
       render pass fires roughly ten times a second; with one shared 100-slot
       FIFO it would flush every warn and toast row before the reader reached
       the button, which is the failure the recorder exists to prevent. */
    const state = dz.dzDiagNewState();
    dz.dzDiagAppend(state, "warn_pass", { event: "pass_complete", condition: "statusTimeout", flagged: 2 });
    for (let i = 0; i < 500; i++) {
        dz.dzDiagAppend(state, "device_pass", { event: "pass_complete", stage: "visible", cards: i });
    }
    assert.equal(state.rings.warn_pass.length, 1, "the warn entry survives 500 render passes");
    assert.ok(state.rings.device_pass.length <= dz.dzDiagCap("device_pass"));
});

test("a ring evicts oldest first and counts what it dropped", () => {
    const state = dz.dzDiagNewState();
    const cap = dz.dzDiagCap("device_pass");
    for (let i = 0; i < cap + 5; i++) {
        dz.dzDiagAppend(state, "device_pass", { event: "pass_complete", stage: "visible", cards: i });
    }
    assert.equal(state.rings.device_pass.length, cap);
    assert.equal(state.rings.device_pass[0].cards, 5, "the five oldest are gone");
    assert.equal(state.evicted, 5);
    assert.equal(state.appends, cap + 5);
});

test("appending never throws, whatever it is handed", () => {
    const state = dz.dzDiagNewState();
    for (const bad of [null, undefined, 42, "x", { event: undefined }]) {
        assert.doesNotThrow(() => dz.dzDiagAppend(state, "device_pass", bad));
    }
    assert.doesNotThrow(() => dz.dzDiagAppend(state, null, { event: "a" }));
});

/* ---- The output schema ----

   Redaction is an output-side property here, not a promise about what the
   collectors hand over. The first draft asserted "the ring never holds a
   device name" and was wrong: warn keys carry one whenever a card's idx does
   not resolve. An allowlist cannot be wrong in that direction, and a visible
   _dropped list means a field someone adds without extending the schema shows
   up as a question rather than a silent leak. */

test("a key the schema does not list is stripped, and its NAME is reported", () => {
    const out = dz.dzDiagSanitize("view", { route: "#/Dashboard", secret_device_name: "Anna Bedroom" });
    assert.deepEqual(Object.keys(out.value), ["route"]);
    /* Array.from re-homes the array: it is built inside diag.js's own vm
       context, and strict deepEqual treats that as a different constructor
       from a literal written here, even with identical contents. */
    assert.deepEqual(Array.from(out.dropped), ["secret_device_name"]);
    assert.ok(!JSON.stringify(out).includes("Anna Bedroom"), "a dropped value never survives anywhere in the result");
});

test("a listed key carrying the wrong type is stripped too", () => {
    const out = dz.dzDiagSanitize("view", { route: { toString: () => "#/Dashboard" } });
    assert.deepEqual(Object.keys(out.value), []);
    assert.deepEqual(Array.from(out.dropped), ["route"]);
});

test("route is normalised to a stem, because a custom page name is household data", () => {
    /* Core registers /Custom/:custompage, so the live hash on a custom page
       carries a name the user chose. The spec attaches route to every line. */
    assert.equal(dz.dzDiagRoute("#/Dashboard"), "#/Dashboard");
    assert.equal(dz.dzDiagRoute("#/Custom/Kids Room Cam"), "#/Custom/:1");
    assert.equal(dz.dzDiagRoute("#/Devices/54/Log"), "#/Devices/:1/Log");
    assert.equal(dz.dzDiagRoute("#/SomethingCoreAddedLater"), "#/:unknown");
});

test("a warn key is reduced to its shape, never exported verbatim", () => {
    /* dzWarnKey falls back to prefix:name:NAME when a card's idx does not
       resolve. The 2026-09-09 toast fix makes that rare by resolving idx from
       core's own attribute, but rare is not never, and this guarantee must not
       rest on another module's key format. */
    const out = dz.dzDiagKeyShape(["timeout:54", "timeout:7", "timeout:name:Anna Bedroom Window"]);
    assert.equal(out.keys_idx, 2);
    assert.equal(out.keys_named, 1);
    assert.ok(!JSON.stringify(out).includes("Anna"), "no fragment of a device name survives");
});

/* ---- The registry and the snapshot ----

   diag.js owns the rings, the gate and a registry; each module contributes the
   state it already owns, next to that state. Specified the other way round,
   diag.js would read six modules' private globals while loading before all of
   them, so every rename elsewhere would silently break the snapshot. */

test("a registered collector contributes its section, sanitised", () => {
    const d = loadDiag();
    d.dzDiagRegister("view", () => ({ route: "#/Custom/Kids Room", width: 390, leaked: "Anna" }));
    const snap = d.machinonDiag({ quiet: true });
    assert.equal(snap.live.view.route, "#/Custom/:1", "the collector's raw hash is normalised on the way out");
    assert.equal(snap.live.view.width, 390);
    assert.ok(!JSON.stringify(snap).includes("Anna"), "an unlisted key never reaches the artifact");
    assert.ok(Array.from(snap.live._dropped || []).indexOf("view.leaked") !== -1,
        "and the reader is told a key was dropped, by name");
});

test("a collector that throws costs its own section and nothing else", () => {
    const d = loadDiag();
    d.dzDiagRegister("view", () => { throw new Error("boom"); });
    d.dzDiagRegister("build", () => ({ theme_version: "2.6.1" }));
    const snap = d.machinonDiag({ quiet: true });
    assert.ok(snap.live.view.error, "the failing section reports an error in place of its content");
    assert.equal(snap.live.build.theme_version, "2.6.1", "every other section still collected");
});

test("with the recorder off the snapshot says so, instead of showing an empty history", () => {
    /* The setting is off by default, so most first reports arrive with no
       history. An empty array would read as "the house was quiet", which is the
       opposite of the truth, and a reader would act on it. */
    const d = loadDiag();
    d.dzDiagSetEnabled(false);
    const snap = d.machinonDiag({ quiet: true });
    assert.equal(snap.history.recorder, "off");
    assert.ok(!Array.isArray(snap.history.entries));
});

test("with the recorder on the snapshot carries the rings and cannot be mutated afterwards", () => {
    /* Devtools expands a logged array lazily, reading it when the triangle is
       clicked rather than when it was logged, so returning the live ring by
       reference would show a buffer that has already turned over. */
    const d = loadDiag();
    d.dzDiagSetEnabled(true);
    d.dzLog("device_pass", "pass_complete", { stage: "visible", cards: 27 });
    const snap = d.machinonDiag({ quiet: true });
    assert.equal(snap.history.recorder, "on");
    assert.equal(snap.history.entries.device_pass.length, 1);
    d.dzLog("device_pass", "pass_complete", { stage: "visible", cards: 99 });
    assert.equal(snap.history.entries.device_pass.length, 1, "the returned snapshot is a copy, not the live ring");
});

test("dzLog records nothing at all while the setting is off", () => {
    const d = loadDiag();
    d.dzDiagSetEnabled(false);
    d.dzLog("device_pass", "pass_complete", { stage: "visible", cards: 27 });
    const snap = d.machinonDiag({ quiet: true });
    assert.equal(snap.history.recorder, "off");
    assert.equal(d.dzDiagState.appends, 0, "off means nothing collected, not merely nothing printed");
});

test("machinonDiagNames includes device names where machinonDiag does not", () => {
    const d = loadDiag();
    d.dzDiagRegister("cards", (opts) => (opts && opts.names
        ? { total: 2, names: ["Hall Light"] }
        : { total: 2 }));
    assert.ok(!JSON.stringify(d.machinonDiag({ quiet: true })).includes("Hall Light"));
    assert.ok(JSON.stringify(d.machinonDiagNames({ quiet: true })).includes("Hall Light"));
});

test("the kernel buffer is drained when the setting turns out to be on, and dropped when off", () => {
    /* custom.js buffers dzLog calls made before diag.js loads, because the
       Angular config callbacks run first and a bare call there is a
       ReferenceError inside core's bootstrap. The gate is not known yet at that
       point, so the buffer is only ever admitted once the setting resolves. */
    const on = loadDiag();
    on.dzDiagAdoptBuffer([["routes", "registered", { routes: 2, active: true }]]);
    on.dzDiagSetEnabled(true);
    assert.equal(on.machinonDiag({ quiet: true }).history.entries.routes.length, 1);

    const off = loadDiag();
    off.dzDiagAdoptBuffer([["routes", "registered", { routes: 2, active: true }]]);
    off.dzDiagSetEnabled(false);
    assert.equal(off.dzDiagState.appends, 0, "nothing buffered before the gate resolved is retained when it is off");
});

/* ---- The warn_pass seam's contract ----

   dzWarnPass lives in devices.js and needs a DOM, so the seam itself is covered
   by a rig harness. What is testable here is the shape it must emit, and the
   two rules that shape has to obey. */

test("a warn_pass entry coalesces while the house is unchanged and separates when it is not", () => {
    /* The entry that would have made the 2026-09-09 defect self-evident:
       `warned` and `cleared` naming the same key in one pass is the whole bug
       in one line. It must survive a quiet house without filling the ring. */
    const d = loadDiag();
    d.dzDiagSetEnabled(true);
    const steady = { condition: "statusTimeout", enabled: true, flagged: 1, warned: 1, cleared: 0,
                     suppressed: 0, route: "#/Dashboard", keys_idx: 1, keys_named: 0 };
    d.dzLog("warn_timeout", "pass_complete", { ...steady });
    d.dzLog("warn_timeout", "pass_complete", { ...steady });
    d.dzLog("warn_timeout", "pass_complete", { ...steady, cleared: 1 });
    const ring = d.machinonDiag({ quiet: true }).history.entries.warn_timeout;
    assert.equal(ring.length, 2, "three passes, one change, two entries");
    assert.equal(ring[1].cleared, 1);
});

test("a warn_pass entry carries no device name, only key counts", () => {
    const d = loadDiag();
    d.dzDiagSetEnabled(true);
    const shape = d.dzDiagKeyShape(["timeout:54", "timeout:name:Anna Bedroom Window"]);
    d.dzLog("warn_timeout", "pass_complete", {
        condition: "timeout", enabled: true, flagged: 2,
        keys_idx: shape.keys_idx, keys_named: shape.keys_named
    });
    const json = JSON.stringify(d.machinonDiag({ quiet: true }));
    assert.ok(!json.includes("Anna"), "the seam records key SHAPE, never the keys themselves");
    assert.ok(json.includes('"keys_named":1'), "but it does say one key had to fall back to a name");
});

test("a disabled warn type records that it was not measured, not a zero", () => {
    /* dzWarnPass returns early when the feature is off, so warned, cleared,
       suppressed and the key counts are never computed. Recording them as 0
       would tell a reader "nothing cleared" when the truth is "not measured",
       and computing them anyway would mean a document-wide DOM sweep on every
       pass for a user who asked for less. */
    const d = loadDiag();
    d.dzDiagSetEnabled(true);
    d.dzLog("warn_battery", "pass_complete", { condition: "battery", enabled: false, flagged: 3 });
    const e = d.machinonDiag({ quiet: true }).history.entries.warn_battery[0];
    assert.equal(e.enabled, false);
    assert.equal(e.flagged, 3, "the flagged count is free even when the feature is off");
    assert.equal(e.warned, undefined, "and the fields that were never computed are absent, not zero");
    assert.equal(e.cleared, undefined);
});

test("two warn conditions do not share a ring, or neither ever coalesces", () => {
    /* The rig caught this: setAllDevicesIconsStatus runs the timeout pass and
       the battery pass back to back, so in one ring their entries alternate,
       every entry differs from the one before it by `condition`, and the
       coalescing rule can never fire for either. They are two streams. */
    const d = loadDiag();
    d.dzDiagSetEnabled(true);
    for (let i = 0; i < 6; i++) {
        d.dzLog("warn_timeout", "pass_complete", { condition: "timeout", enabled: true, flagged: 1, warned: 0, cleared: 0, suppressed: 0 });
        d.dzLog("warn_battery", "pass_complete", { condition: "battery", enabled: true, flagged: 0, warned: 0, cleared: 0, suppressed: 0 });
    }
    const h = d.machinonDiag({ quiet: true }).history.entries;
    assert.equal(h.warn_timeout.length, 1, "six identical timeout passes are one entry");
    assert.equal(h.warn_battery.length, 1, "and the battery stream is independent of it");
});
