import { test } from "node:test";
import assert from "node:assert/strict";
import { flattenKeys, interpolationTokens, compareTables,
         scanDzTLiterals, manifestRequiredKeys } from "./check-lang-parity.mjs";

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

test("flatten and tokens helpers", () => {
    assert.deepEqual(flattenKeys({ a: { b: "x {p}" } }), { "a.b": "x {p}" });
    assert.deepEqual([...interpolationTokens("x {p} {q}")].sort(), ["p", "q"]);
});
