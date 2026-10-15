import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* src/js/device-copy.js builds the texts behind the card menu's copy
   actions, and src/js/clipboard.js puts them on the clipboard. Plain
   browser scripts, so the SHIPPING files run in a vm context and their
   globals are read back. */
function load(extra) {
    const ctx = vm.createContext(Object.assign({ URL, Promise }, extra || {}));
    for (const f of ["src/js/clipboard.js", "src/js/device-copy.js"]) {
        vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    }
    return ctx;
}
const dz = load();

const SELECTOR = {
    Name: "HVAC Mode", Type: "Light/Switch", SubType: "Selector Switch", SwitchType: "Selector",
    HardwareName: "Dummy", HardwareType: "Dummy (Does nothing, use for virtual switches only)",
    ID: "000140AA", Unit: 1, Data: "Auto", LastUpdate: "2026-10-15 09:00:00"
};

test("only a plain number is an idx", () => {
    assert.equal(dz.dzDeviceCopyIdx("4549"), "4549");
    assert.equal(dz.dzDeviceCopyIdx(90), "90");
    assert.equal(dz.dzDeviceCopyIdx(" 12 "), "12");
    for (const bad of ["", null, undefined, "12a", "1;2", "../1", "1e3", "-1"]) {
        assert.equal(dz.dzDeviceCopyIdx(bad), null, String(bad));
    }
});

test("the dzVents line names the device in a comment", () => {
    assert.equal(dz.dzDeviceCopyDzVents("4549", "Vakantie_Verlichting_Modus", "device"),
        "domoticz.devices(4549) -- Vakantie_Verlichting_Modus");
    assert.equal(dz.dzDeviceCopyDzVents("4549", "", "device"), "domoticz.devices(4549)");
    assert.equal(dz.dzDeviceCopyDzVents("4549", undefined, "device"), "domoticz.devices(4549)");
    assert.equal(dz.dzDeviceCopyDzVents("x", "Lamp", "device"), null);
});

test("a line break in a name cannot push the rest of the name onto a code line", () => {
    const line = dz.dzDeviceCopyDzVents("7", "Lamp\nos.execute('x')\r\n\u2028end", "device");
    assert.equal(line.split("\n").length, 1);
    assert.equal(line, "domoticz.devices(7) -- Lamp os.execute('x') end");
});

test("the API URL follows the page address, sub-path included", () => {
    assert.equal(dz.dzDeviceCopyApiUrl("90", "http://192.0.2.10:8080/", "device"),
        "http://192.0.2.10:8080/json.htm?type=command&param=getdevices&rid=90");
    assert.equal(dz.dzDeviceCopyApiUrl("90", "https://example.org/domoticz/index.html", "device"),
        "https://example.org/domoticz/json.htm?type=command&param=getdevices&rid=90");
});

test("the API URL never carries credentials or the page's route", () => {
    assert.equal(dz.dzDeviceCopyApiUrl("90", "http://user:secret@192.0.2.10:8080/#/Dashboard", "device"),
        "http://192.0.2.10:8080/json.htm?type=command&param=getdevices&rid=90");
    assert.equal(dz.dzDeviceCopyApiUrl("abc", "http://192.0.2.10:8080/", "device"), null);
    assert.equal(dz.dzDeviceCopyApiUrl("90", "not a url", "device"), null);
});

test("the details block has one line per field, versions last", () => {
    assert.equal(dz.dzDeviceCopyDetails(SELECTOR, "90", { domoticz: "2026.4 (build 18468)", theme: "2.7.3" }, "device"), [
        "Device: HVAC Mode (idx 90)",
        "Type: Light/Switch, Selector Switch, Selector",
        "Hardware: Dummy",
        "Hardware type: Dummy (Does nothing, use for virtual switches only)",
        "Device ID / unit: 000140AA / 1",
        "Value: Auto",
        "Last update: 2026-10-15 09:00:00",
        "Domoticz 2026.4 (build 18468), Machinon 2.7.3"
    ].join("\n"));
});

test("missing fields are left out, not printed empty", () => {
    assert.equal(dz.dzDeviceCopyDetails({ Name: "Temp", Type: "Temp", Data: "21.5 C" }, "5", {}, "device"),
        "Device: Temp (idx 5)\nType: Temp\nValue: 21.5 C");
    assert.equal(dz.dzDeviceCopyDetails(null, "5", undefined, "device"), "Device: (no name) (idx 5)");
    assert.equal(dz.dzDeviceCopyDetails({ Unit: 0 }, "5", {}, "device"), "Device: (no name) (idx 5)\nDevice ID / unit: - / 0");
});

test("a multi-line value stays on its own line", () => {
    const out = dz.dzDeviceCopyDetails({ Name: "Text", Data: "line one\nline two" }, "3", {}, "device");
    assert.deepEqual(out.split("\n"), ["Device: Text (idx 3)", "Value: line one line two"]);
});

/* Scenes and groups number a different table from devices, so a device
   reference built from a scene's idx would name an unrelated device. */
test("the kind comes from the record's type, and a scene list without a record has none", () => {
    assert.equal(dz.dzDeviceCopyKind({ Type: "Scene" }, true), "scene");
    assert.equal(dz.dzDeviceCopyKind({ Type: "Group" }, false), "group");
    assert.equal(dz.dzDeviceCopyKind({ Type: "Light/Switch" }, false), "device");
    assert.equal(dz.dzDeviceCopyKind(null, false), "device");
    assert.equal(dz.dzDeviceCopyKind(null, true), null);
});

test("scenes and groups get their own dzVents collection and API call", () => {
    assert.equal(dz.dzDeviceCopyDzVents("1", "Good Morning", "scene"), "domoticz.scenes(1) -- Good Morning");
    assert.equal(dz.dzDeviceCopyDzVents("2", "All Lights", "group"), "domoticz.groups(2) -- All Lights");
    assert.equal(dz.dzDeviceCopyApiUrl("1", "http://192.0.2.10:8080/", "scene"),
        "http://192.0.2.10:8080/json.htm?type=command&param=getscenes&rid=1");
    assert.equal(dz.dzDeviceCopyApiUrl("2", "http://192.0.2.10:8080/", "group"),
        "http://192.0.2.10:8080/json.htm?type=command&param=getscenes&rid=2");
});

test("an unknown kind builds no reference rather than a wrong one", () => {
    assert.equal(dz.dzDeviceCopyDzVents("1", "x", null), null);
    assert.equal(dz.dzDeviceCopyApiUrl("1", "http://192.0.2.10:8080/", null), null);
});

test("a scene's details name it a scene and report its status", () => {
    const scene = { Name: "Good Morning", Type: "Scene", Status: "Off", LastUpdate: "2026-10-14 13:32:19" };
    assert.equal(dz.dzDeviceCopyDetails(scene, "1", { theme: "2.7.3" }, "scene"),
        "Scene: Good Morning (idx 1)\nType: Scene\nValue: Off\nLast update: 2026-10-14 13:32:19\nMachinon 2.7.3");
});

test("dzCopyText reports a refused clipboard write as false, not success", async () => {
    const refused = load({ navigator: { clipboard: { writeText: () => Promise.reject(new Error("NotAllowedError")) } } });
    assert.equal(await refused.dzCopyText("x"), false);
    const allowed = load({ navigator: { clipboard: { writeText: () => Promise.resolve() } } });
    assert.equal(await allowed.dzCopyText("x"), true);
});

test("without the clipboard API, dzCopyText falls back to a selected field", async () => {
    let selected = null, removed = false;
    const field = { style: {}, setAttribute() {}, select() { selected = this.value; } };
    const doc = {
        createElement: () => field,
        body: { appendChild() {}, removeChild() { removed = true; } },
        execCommand: (cmd) => cmd === "copy" && selected === "hello"
    };
    const ctx = load({ navigator: {}, document: doc });
    assert.equal(await ctx.dzCopyText("hello"), true);
    assert.equal(removed, true);
    const refusing = load({ navigator: {}, document: Object.assign({}, doc, { execCommand: () => false }) });
    assert.equal(await refusing.dzCopyText("hello"), false);
    const throwing = load({ navigator: {}, document: Object.assign({}, doc, { execCommand: () => { throw new Error("x"); } }) });
    assert.equal(await throwing.dzCopyText("hello"), false);
});
