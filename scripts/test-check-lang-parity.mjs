import { test } from "node:test";
import assert from "node:assert/strict";
import { flattenKeys, interpolationTokens, compareTables,
         scanDzTLiterals, manifestRequiredKeys, appliesToRequiredKeys,
         inputMetaOptionsRequiredKeys, swatchesRequiredKeys,
         looksRequiredKeys } from "./check-lang-parity.mjs";

test("extra key in a translation is an error", () => {
    const r = compareTables({ a: "x" }, { a: "y", b: "z" }, "de");
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0], /b/);
});

test("missing key in a translation is a report, not an error", () => {
    const r = compareTables({ a: "x", b: "y" }, { a: "x2" }, "de");
    assert.equal(r.errors.length, 0);
    assert.equal(r.missing.length, 1);
});

test("interpolation token mismatch is an error", () => {
    const r = compareTables({ t: "Hi {name}" }, { t: "Hallo {naam}" }, "nl");
    assert.equal(r.errors.length, 1);
});

test("dzT literal not present in en is an error", () => {
    const errs = scanDzTLiterals('x = dzT("hub.nope");', new Set(["hub.yes"]), "f.js");
    assert.equal(errs.length, 1);
});

test("manifest keys demand label and description keys in en", () => {
    const req = manifestRequiredKeys('  key: "foo",\n  id: "general",');
    assert.deepEqual(req.sort(), ["hub.groups.general",
        "hub.settings.foo.description", "hub.settings.foo.label"]);
});

test("appliesTo slugs demand hub.appliesTo.<slug> keys in en", () => {
    const text = [
        "            {",
        '                key: "standby", storageKey: "standby", control: "toggle",',
        '                appliesTo: "whole_ui", previewId: "sketch-standby", parent: null,',
        "            },"
    ].join("\n");
    assert.deepEqual(appliesToRequiredKeys(text), ["hub.appliesTo.whole_ui"]);
});

test("appliesTo extraction ignores the schema docblock's own prose line", () => {
    const text = [
        "       appliesTo:        a lower-snake slug for the rationalization table's",
        '                appliesTo: "toasts", previewId: null, parent: null,'
    ].join("\n");
    assert.deepEqual(appliesToRequiredKeys(text), ["hub.appliesTo.toasts"]);
});

test("DZ_HUB_INPUT_META option values demand hub.options.<key>.<value> keys in en", () => {
    const text = [
        "var DZ_HUB_INPUT_META = {",
        "    standby_after:            { min: 1 },",
        '    background_type:          { options: ["cover", "pattern"] },',
        '    warn_repeat:              { options: ["visit", "daily", "episode"] }',
        "};"
    ].join("\n");
    assert.deepEqual(inputMetaOptionsRequiredKeys(text), [
        "hub.options.background_type.cover",
        "hub.options.background_type.pattern",
        "hub.options.warn_repeat.visit",
        "hub.options.warn_repeat.daily",
        "hub.options.warn_repeat.episode"
    ]);
});

test("DZ_HUB_INPUT_META extraction returns no keys when the block is absent", () => {
    assert.deepEqual(inputMetaOptionsRequiredKeys("no such block here"), []);
});

test("DZ_COLOR_SCHEME_FIELDS field names demand hub.schemes.swatches.<field> keys in en", () => {
    const text = [
        "var DZ_COLOR_SCHEME_FIELDS = [",
        '    { suffix: "bg", field: "background" },',
        '    { suffix: "navbar", field: "navbar" },',
        '    { suffix: "text", field: "main_text" }',
        "];"
    ].join("\n");
    assert.deepEqual(swatchesRequiredKeys(text), [
        "hub.schemes.swatches.background",
        "hub.schemes.swatches.navbar",
        "hub.schemes.swatches.main_text"
    ]);
});

test("swatches extraction returns no keys when the block is absent", () => {
    assert.deepEqual(swatchesRequiredKeys("no such block here"), []);
});

test("DZ_LOOKS keys demand hub.wizard.looks.<key>.label/.description keys in en", () => {
    const text = [
        "var DZ_LOOKS = {",
        "    crisp: {",
        "        anchor: 0.24, danchor: 0.90, nC: 0.002",
        "    },",
        "    soft: {",
        "        anchor: 0.32, danchor: 0.84, nC: 0.022",
        "    }",
        "};"
    ].join("\n");
    assert.deepEqual(looksRequiredKeys(text), [
        "hub.wizard.looks.crisp.label",
        "hub.wizard.looks.crisp.description",
        "hub.wizard.looks.soft.label",
        "hub.wizard.looks.soft.description"
    ]);
});

test("looks extraction returns no keys when the block is absent", () => {
    assert.deepEqual(looksRequiredKeys("no such block here"), []);
});

test("flatten and tokens helpers", () => {
    assert.deepEqual(flattenKeys({ a: { b: "x {p}" } }), { "a.b": "x {p}" });
    assert.deepEqual([...interpolationTokens("x {p} {q}")].sort(), ["p", "q"]);
});
