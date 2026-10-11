import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* The central observer in src/js/devices.js watches #holder, which also holds
   core's top-bar clock (#jsTbTime, #jsTbSunRise, #jsTbSunSet, rewritten every
   second) and the time-ago text in cards. Those records only swap a text node,
   so they can never add, remove or restyle a card or control, and must not
   start a device pass. Plain browser script: run the SHIPPING file in a vm
   context and read the predicate back. */
const dz = vm.createContext({ console, JSON, window: {} });
vm.runInContext(readFileSync("src/js/devices.js", "utf8"), dz, { filename: "src/js/devices.js" });

const TEXT = { nodeType: 3 };
const ELEMENT = { nodeType: 1 };
const childList = (added, removed) => ({ type: "childList", addedNodes: added, removedNodes: removed || [] });

test("a clock tick (text node swapped for a text node) needs no pass", () => {
    assert.equal(dz.dzRecordsNeedPass([childList([TEXT], [TEXT]), childList([TEXT], [TEXT])]), false);
});

test("an added element needs a pass", () => {
    assert.equal(dz.dzRecordsNeedPass([childList([ELEMENT])]), true);
});

test("a removed element needs a pass", () => {
    assert.equal(dz.dzRecordsNeedPass([childList([], [ELEMENT])]), true);
});

test("a class change needs a pass", () => {
    assert.equal(dz.dzRecordsNeedPass([{ type: "attributes", attributeName: "class", addedNodes: [], removedNodes: [] }]), true);
});

test("one real change among clock ticks still needs a pass", () => {
    assert.equal(dz.dzRecordsNeedPass([childList([TEXT], [TEXT]), childList([ELEMENT]), childList([TEXT], [TEXT])]), true);
});

test("an empty batch needs no pass", () => {
    assert.equal(dz.dzRecordsNeedPass([]), false);
});
