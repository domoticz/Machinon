import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Same pattern as test-diag.mjs and test-toast-policy.mjs: settings-transport.js
   is a plain browser script whose top level only declares things, so the
   SHIPPING file runs in a vm context and its globals are read back. The
   diagnostics seam is the part exercised here, because it is the part with a
   contract that can silently invert: an ERR arrives as a RESOLVED object from
   dzApiPost, so a seam that reads "the promise kept its word" reports a failed
   save as a success. */
function loadTransport(extra) {
    const ctx = vm.createContext(Object.assign({
        Math, console, JSON, Promise, URLSearchParams,
        window: {},
        theme: { features: {}, values: {} },
        performance: { now: () => 0 }
    }, extra || {}));
    vm.runInContext(readFileSync("src/js/settings-transport.js", "utf8"), ctx,
                    { filename: "src/js/settings-transport.js" });
    return ctx;
}

/* Captures what the seam handed the recorder. */
function withRecorder(extra) {
    const lines = [];
    const ctx = loadTransport(Object.assign({
        dzLog: (seam, event, fields) => { lines.push({ seam, event, fields }); return true; },
        dzLogOn: true,
        dzDiagNow: () => 0
    }, extra || {}));
    ctx.lines = lines;
    return ctx;
}

test("a save that resolved an ERR object is recorded as an error, not as ok", () => {
    /* dzApiPost resolves { status: "ERR" } rather than rejecting, so that one
       failing write cannot wedge the serialised write chain. Every reader of
       this seam has to take the outcome off the payload for the same reason. */
    const ctx = withRecorder();
    ctx.dzSettingsLogSave("native", { ok: false, error: "conflict" }, 0);
    assert.equal(ctx.lines.length, 1);
    assert.equal(ctx.lines[0].fields.outcome, "error:conflict");
});

test("a save with no error field still records ok", () => {
    const ctx = withRecorder();
    ctx.dzSettingsLogSave("native", { ok: true }, 0);
    assert.equal(ctx.lines[0].fields.outcome, "ok");
    assert.equal(ctx.lines[0].fields.transport, "native");
});

test("the load layer names which layers were actually present", () => {
    const ctx = withRecorder();
    ctx.dzApiState.instanceSnap = { features: {}, values: {} };
    ctx.dzApiState.userSnap = null;
    ctx.dzSettingsLogLoad("native", "loaded", 0);
    assert.equal(ctx.lines[0].fields.layer, "instance");
    ctx.dzApiState.userSnap = { features: {}, values: {} };
    ctx.dzSettingsLogLoad("native", "loaded", 0);
    assert.equal(ctx.lines[1].fields.layer, "instance+user");
});

test("the save layer follows what dzApiSaveSettings would actually write", () => {
    const ctx = withRecorder();
    ctx.dzApiState.perUser = false;
    assert.equal(ctx.dzSettingsSaveLayer(), "instance");
    ctx.dzApiState.perUser = true;
    ctx.window.my_config = { userrights: 0 };
    assert.equal(ctx.dzSettingsSaveLayer(), "user");
    ctx.window.my_config = { userrights: 2 };
    assert.equal(ctx.dzSettingsSaveLayer(), "user+instance");
});

test("keys_changed counts the settings a save actually changes", () => {
    const ctx = withRecorder();
    const stored = { features: { time_ago: true, warn_battery: false }, values: { scheme: "blue" } };
    const current = { features: { time_ago: true, warn_battery: true }, values: { scheme: "magenta" } };
    assert.equal(ctx.dzSettingsChangedKeys(current, stored), 2);
    assert.equal(ctx.dzSettingsChangedKeys(stored, stored), 0);
});

test("keys_changed is null, not zero, when there is no stored layer to compare against", () => {
    /* Absent rather than 0 in the recorded line: "nothing changed" and "there
       was nothing there yet" are different facts about the house and a reader
       cannot tell them apart from a zero. */
    const ctx = withRecorder();
    assert.equal(ctx.dzSettingsChangedKeys({ features: {}, values: {} }, null), null);
    ctx.dzApiState.instanceSnap = null;
    ctx.dzSettingsLogSave("native", { ok: true }, 0);
    assert.equal("keys_changed" in ctx.lines[0].fields, false);
});

test("a legacy save reports no keys_changed at all", () => {
    /* The uservariable transport has no stored snapshot to diff against, so a
       count there would be a number with no meaning behind it. */
    const ctx = withRecorder();
    ctx.dzApiState.instanceSnap = { features: { a: 1 }, values: {} };
    ctx.dzSettingsLogSave("legacy", { ok: true }, 0);
    assert.equal(ctx.lines[0].fields.layer, "uservars");
    assert.equal("keys_changed" in ctx.lines[0].fields, false);
});

test("the seam is silent, not fatal, with no recorder present", () => {
    const ctx = loadTransport();
    ctx.dzSettingsLogLoad("native", "failed", 0);
    ctx.dzSettingsLogSave("native", { ok: false, error: "unreachable" }, 0);
});

test("a throwing recorder does not take the boot chain or the save with it", () => {
    const ctx = withRecorder({ dzLog: () => { throw new Error("recorder broke"); } });
    ctx.dzSettingsLogLoad("native", "loaded", 0);
    ctx.dzSettingsLogSave("native", { ok: true }, 0);
});
