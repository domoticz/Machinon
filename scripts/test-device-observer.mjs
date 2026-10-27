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

/* dzLiveUpdateQueue: a hidden tab keeps only each device's latest update and
   applies them once, without the live flag, when the tab shows again. */
function queueWith(hidden) {
    const calls = [];
    const state = { hidden };
    const q = dz.dzLiveUpdateQueue(() => state.hidden, (data, live) => calls.push([data.idx, data.v, live]));
    return { q, calls, state };
}

test("a visible update is applied at once, as live", () => {
    const { q, calls } = queueWith(false);
    q.push({ idx: "7", v: 1 });
    assert.deepEqual(calls, [["7", 1, true]]);
    assert.equal(q.flush(), 0);
});

test("hidden updates are held until flush", () => {
    const { q, calls } = queueWith(true);
    q.push({ idx: "7", v: 1 });
    q.push({ idx: "8", v: 1 });
    assert.deepEqual(calls, []);
    assert.equal(q.flush(), 2);
    assert.deepEqual(calls, [["7", 1, false], ["8", 1, false]]);
});

test("a device updated several times while hidden is applied once, with its latest data", () => {
    const { q, calls } = queueWith(true);
    q.push({ idx: "7", v: 1 });
    q.push({ idx: "7", v: 2 });
    q.push({ idx: "7", v: 3 });
    q.flush();
    assert.deepEqual(calls, [["7", 3, false]]);
});

test("flush empties the queue, and later visible updates are live again", () => {
    const { q, calls, state } = queueWith(true);
    q.push({ idx: "7", v: 1 });
    q.flush();
    assert.equal(q.flush(), 0);
    state.hidden = false;
    q.push({ idx: "7", v: 2 });
    assert.deepEqual(calls, [["7", 1, false], ["7", 2, true]]);
});
