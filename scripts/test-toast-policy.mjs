import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Same pattern as scripts/test-color-oklch.mjs: src/js files are plain browser
   scripts declaring globals with var/function, so run the SHIPPING file in a vm
   context and read the globals back. The context has no `document`, which also
   proves the module does not touch the DOM at load time. */
function loadThemeGlobals(files) {
    const ctx = vm.createContext({ Math, console, JSON });
    for (const f of files) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    return ctx;
}

const dz = loadThemeGlobals(["src/js/i18n.js", "lang/machinon.en.js", "src/js/toasts.js"]);

/* ---- Minimal fake DOM + fake clock, for the coalescing/pause tests below ----

   The renderer half of toasts.js (dzToastShow, dzToastMerge, dzToastDrain,
   dzToast itself) is only reachable with a `document`, `window` and working
   timers, none of which the pure-logic context above provides on purpose
   (that absence is what proves the file's top level never touches the DOM).
   Rather than skip testing the renderer, give it just enough of a DOM to run
   for real: createElement/appendChild/classList/querySelector/textContent,
   a controllable virtual clock standing in for Date.now()/setTimeout, so an
   8-second toast deadline can be exercised without an 8-second test. */
function makeFakeClock() {
    let now = 0;
    let seq = 0;
    const timers = new Map(); // id -> { fn, at }
    return {
        Date: { now: () => now },
        setTimeout(fn, ms) {
            const id = ++seq;
            timers.set(id, { fn: fn, at: now + ms });
            return id;
        },
        clearTimeout(id) { timers.delete(id); },
        /* Fires every pending timer due at or before now+ms, in due-time
           order, advancing `now` as it goes (so a timer's own setTimeout
           calls schedule relative to the right instant). */
        advance(ms) {
            const target = now + ms;
            for (;;) {
                let nextId = null, nextAt = Infinity;
                for (const [id, t] of timers) {
                    if (t.at <= target && t.at < nextAt) { nextAt = t.at; nextId = id; }
                }
                if (nextId === null) break;
                const t = timers.get(nextId);
                timers.delete(nextId);
                now = nextAt;
                t.fn();
            }
            now = target;
        }
    };
}

function makeFakeDom() {
    function queryDescendant(el, selector) {
        var cls = selector.charAt(0) === "." ? selector.slice(1) : selector;
        for (const child of el.children) {
            if (child._classes && child._classes.has(cls)) return child;
            const found = queryDescendant(child, selector);
            if (found) return found;
        }
        return null;
    }

    function createElement() {
        const classes = new Set();
        let text = "";
        const el = {
            nodeType: 1,
            children: [],
            parentNode: null,
            _attrs: {},
            offsetHeight: 0,
            appendChild(child) {
                if (child.nodeType === 3) { text += child.data; return child; }
                el.children.push(child);
                child.parentNode = el;
                return child;
            },
            removeChild(child) {
                const i = el.children.indexOf(child);
                if (i >= 0) el.children.splice(i, 1);
                child.parentNode = null;
                return child;
            },
            setAttribute(name, value) { el._attrs[name] = value; },
            getAttribute(name) { return el._attrs[name]; },
            _listeners: {},
            /* Real registration/dispatch for click (the button tests below
               drive the close and show-devices buttons this way); hover and
               focus are still driven directly via dz.dzToastPause/Resume in
               the older tests rather than dispatched, since this fake DOM
               has no pointer or focus model to dispatch them from. */
            addEventListener(type, fn) {
                (el._listeners[type] = el._listeners[type] || []).push(fn);
            },
            click() {
                var evt = { stopPropagation() {} };
                (el._listeners.click || []).slice().forEach((fn) => fn(evt));
            },
            querySelector(selector) { return queryDescendant(el, selector); }
        };
        Object.defineProperty(el, "className", {
            get() { return Array.from(classes).join(" "); },
            set(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); }
        });
        Object.defineProperty(el, "classList", {
            value: {
                add(c) { classes.add(c); },
                remove(c) { classes.delete(c); },
                contains(c) { return classes.has(c); }
            }
        });
        Object.defineProperty(el, "textContent", {
            get() { return text; },
            set(v) { text = String(v); el.children.length = 0; }
        });
        Object.defineProperty(el, "_classes", { get() { return classes; } });
        return el;
    }

    return {
        createElement,
        createTextNode(data) { return { nodeType: 3, data }; },
        body: createElement(),
        /* dzToastInstallKeyboard binds the Escape handler here at load time
           (guarded only by `typeof document !== "undefined"`, which this
           fake satisfies); it is never exercised by these tests. */
        addEventListener() {}
    };
}

/* A spy standing in for the real dzApplySetFilter (src/js/set-filter.js),
   which the click handler under test never loads: recording calls is enough
   to assert what the toast tried to arm, without pulling in the whole
   set-filter module and its own DOM surface. */
function makeSpy() {
    const calls = [];
    function spy() { calls.push(Array.prototype.slice.call(arguments)); }
    spy.calls = calls;
    return spy;
}

/* A fresh vm context (document/window/clock included) per call, so each test
   gets isolated dzToastVisible/dzToastQueue/dzToastGroups singletons rather
   than leaking state between tests. `location` and `dzApplySetFilter` back
   the show-devices button's click handler (src/js/toasts.js dzToastShow);
   `location` is a plain mutable object so a test can simulate navigation by
   changing its `.hash` after the toast was raised. */
function loadToastRuntime(overrides) {
    const clock = makeFakeClock();
    const dom = makeFakeDom();
    const location = (overrides && overrides.location) || { hash: "" };
    const applySetFilter = overrides && overrides.dzApplySetFilter;
    const ctx = vm.createContext({
        Math, console, JSON,
        document: dom, window: { innerWidth: 1024 },
        Date: clock.Date, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout,
        location: location, dzApplySetFilter: applySetFilter
    });
    ["src/js/i18n.js", "lang/machinon.en.js", "src/js/toasts.js"].forEach(function (f) {
        vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    });
    return { dz: ctx, clock, location };
}

test("a key warns once, then is suppressed until it is cleared", () => {
    const s = dz.dzToastCreateState();
    assert.equal(dz.dzToastShouldSuppress(s, "timeout:42"), false);
    dz.dzToastMarkSeen(s, "timeout:42");
    assert.equal(dz.dzToastShouldSuppress(s, "timeout:42"), true);
    // A different device is unaffected.
    assert.equal(dz.dzToastShouldSuppress(s, "timeout:43"), false);
    // Re-arms only when the condition actually cleared.
    dz.dzToastClearKey(s, "timeout:42");
    assert.equal(dz.dzToastShouldSuppress(s, "timeout:42"), false);
});

test("a null key is never suppressed", () => {
    // Core toasts carry no device identity; they must never be deduped away.
    const s = dz.dzToastCreateState();
    assert.equal(dz.dzToastShouldSuppress(s, null), false);
    dz.dzToastMarkSeen(s, null);
    assert.equal(dz.dzToastShouldSuppress(s, null), false);
});

test("the group summary is one line per device, up to five, then an 'and N more' line", () => {
    // One line per device, never a comma-joined sentence: device names carry
    // dashes and brackets ("Woonkamer - Screen Links [kWh]"), which makes a
    // comma an ambiguous separator.
    assert.deepEqual(dz.dzToastSummary(["Hall"], 1), ["Hall"]);
    assert.deepEqual(dz.dzToastSummary(["Hall", "Garage"], 2), ["Hall", "Garage"]);
    assert.deepEqual(
        dz.dzToastSummary(["Hall", "Garage", "Attic", "Loft", "Shed"], 5),
        ["Hall", "Garage", "Attic", "Loft", "Shed"]
    );
    assert.deepEqual(
        dz.dzToastSummary(["Hall", "Garage", "Attic", "Loft", "Shed"], 8),
        ["Hall", "Garage", "Attic", "Loft", "Shed", "and 3 more"]
    );
});

test("a grouped deadline extends once to the cap and never past it", () => {
    // The trap this guards: a deadline reset per arrival starves under exactly
    // the storm it exists to handle. Extension is one-way and capped.
    assert.equal(dz.dzToastDeadline(dz.DZ_TOAST_BASE_MS, false), 4000);
    assert.equal(dz.dzToastDeadline(dz.DZ_TOAST_BASE_MS, true), 8000);
    // A caller asking for longer than the cap keeps its own longer deadline:
    // the cap raises short toasts, it does not shorten deliberate ones.
    assert.equal(dz.dzToastDeadline(20000, true), 20000);
    // Sticky stays sticky.
    assert.equal(dz.dzToastDeadline(false, true), false);
});

test("the log is bounded and evicts oldest first", () => {
    const s = dz.dzToastCreateState();
    for (let i = 0; i < dz.DZ_TOAST_LOG_MAX + 10; i++) {
        dz.dzToastPushLog(s, { title: "t" + i, type: "info" });
    }
    assert.equal(s.log.length, dz.DZ_TOAST_LOG_MAX);
    assert.equal(s.log[0].title, "t10");
    assert.equal(s.log[s.log.length - 1].title, "t" + (dz.DZ_TOAST_LOG_MAX + 9));
});

/* ---- Persisted warn-repeat policy (theme.warn_repeat) ---- */

/* A plain in-memory map behind the { get, set, remove, keys } interface
   dzWarnRepeatAllows/dzWarnRecord/dzWarnPrune expect. */
function makeMemoryStore() {
    const m = new Map();
    return {
        get(key) { return m.has(key) ? m.get(key) : undefined; },
        set(key, value) { m.set(key, value); },
        remove(key) { m.delete(key); },
        keys() { return Array.from(m.keys()); }
    };
}

/* Every method throws, simulating localStorage in a private window or with
   storage disabled/full. */
function makeThrowingStore() {
    const boom = () => { throw new Error("storage unavailable"); };
    return { get: boom, set: boom, remove: boom, keys: boom };
}

test("visit never consults the store", () => {
    // A throwing store alone is not proof: a caught exception could still
    // happen to return the right answer. Count calls directly instead.
    let calls = 0;
    const store = makeThrowingStore();
    const counting = {
        get(...a) { calls++; return store.get(...a); },
        set(...a) { calls++; return store.set(...a); },
        remove(...a) { calls++; return store.remove(...a); },
        keys(...a) { calls++; return store.keys(...a); }
    };
    assert.equal(dz.dzWarnRepeatAllows(counting, "timeout:1", "visit", 0), true);
    dz.dzWarnRecord(counting, "timeout:1", "visit", 0);
    assert.equal(calls, 0, "visit mode must never call any store method");
});

test("daily suppresses at now + 23h59m and allows at now + 24h01m", () => {
    const store = makeMemoryStore();
    const t0 = 1000000;
    dz.dzWarnRecord(store, "timeout:1", "daily", t0);
    const almostADay = t0 + (23 * 60 + 59) * 60 * 1000;
    const justOverADay = t0 + (24 * 60 + 1) * 60 * 1000;
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:1", "daily", almostADay), false);
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:1", "daily", justOverADay), true);
});

test("episode suppresses indefinitely and allows only after the key is cleared", () => {
    const store = makeMemoryStore();
    const t0 = 1000000;
    dz.dzWarnRecord(store, "battery:2", "episode", t0);
    // Far beyond a day, still suppressed: episode mode never times out on its own.
    const muchLater = t0 + 365 * 24 * 60 * 60 * 1000;
    assert.equal(dz.dzWarnRepeatAllows(store, "battery:2", "episode", muchLater), false);
    store.remove("battery:2"); // the condition cleared, then re-triggered
    assert.equal(dz.dzWarnRepeatAllows(store, "battery:2", "episode", muchLater), true);
});

test("a cleared key allows immediately in daily, i.e. clearing beats the timer", () => {
    const store = makeMemoryStore();
    const t0 = 1000000;
    dz.dzWarnRecord(store, "timeout:3", "daily", t0);
    const oneHourLater = t0 + 60 * 60 * 1000; // well inside the 24h window
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:3", "daily", oneHourLater), false);
    store.remove("timeout:3"); // condition cleared and re-triggered
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:3", "daily", oneHourLater), true);
});

test("dzWarnPrune drops entries older than 30 days and keeps newer ones", () => {
    const store = makeMemoryStore();
    const now = 40 * 24 * 60 * 60 * 1000;
    store.set("timeout:old", now - (31 * 24 * 60 * 60 * 1000));
    store.set("timeout:new", now - (1 * 24 * 60 * 60 * 1000));
    dz.dzWarnPrune(store, now);
    assert.equal(store.get("timeout:old"), undefined);
    assert.equal(store.get("timeout:new"), now - (1 * 24 * 60 * 60 * 1000));
});

test("a throwing storage object degrades to visit behaviour rather than suppressing everything", () => {
    const store = makeThrowingStore();
    // The dangerous failure mode is suppressing a warning nobody ever saw;
    // the safe one is warning too often. Must be true (allowed), not false.
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:9", "daily", 1000000), true);
    assert.equal(dz.dzWarnRepeatAllows(store, "battery:9", "episode", 1000000), true);
    // Recording must not throw out through the caller either.
    assert.doesNotThrow(() => dz.dzWarnRecord(store, "timeout:9", "daily", 1000000));
    assert.doesNotThrow(() => dz.dzWarnPrune(store, 1000000));
});

/* ---- Coalescing and pause must both survive the queue path ---- */

test("a queued group leader keeps coalescing later arrivals instead of fanning out into a dozen toasts", () => {
    const rt = loadToastRuntime();
    const d = rt.dz;

    // Fill the stack (4 on this desktop width) with unrelated singles so the
    // group leader below has nowhere to render immediately.
    for (let i = 0; i < 4; i++) {
        d.dzToast({ type: "info", title: "core message " + i, timeout: 4000 });
    }
    assert.equal(d.dzToastVisible.length, 4);

    function groupTitle(n) { return n + " devices timed out"; }
    d.dzToast({
        type: "warning", title: "Hall timed out", deviceName: "Hall",
        group: "device-warning-timeout", groupTitle: groupTitle, timeout: 6000
    });
    assert.equal(d.dzToastQueue.length, 1, "the group leader queues, stack is full");

    // Eleven more arrivals from the same storm, all inside the 1200ms
    // coalesce window (the fake clock never advances during this loop).
    const names = ["Garage", "Attic", "Shed", "Loft", "Porch", "Study",
                   "Kitchen", "Bath", "Office", "Den", "Yard"];
    names.forEach(function(name) {
        d.dzToast({
            type: "warning", title: name + " timed out", deviceName: name,
            group: "device-warning-timeout", groupTitle: groupTitle, timeout: 6000
        });
    });

    // This is the regression: dzToastDrain used to call dzToastShow directly
    // on the raw queued event, so a queued leader never registered in
    // dzToastGroups and every later arrival queued as its own separate
    // event instead of merging. Fixed, all twelve collapse into one entry.
    assert.equal(d.dzToastQueue.length, 1,
        "12 same-group arrivals while queued must coalesce into one queued entry, not 12");

    // Free a slot through the real removal path and let its exit-animation
    // timeout run, which is what calls dzToastDrain().
    d.dzToastRemove(d.dzToastVisible[0]);
    rt.clock.advance(320);

    assert.equal(d.dzToastQueue.length, 0, "the queued group leader drained into the freed slot");
    assert.equal(d.dzToastVisible.length, 4);
    const shown = d.dzToastVisible[d.dzToastVisible.length - 1];
    assert.equal(shown.group, "device-warning-timeout");
    assert.equal(shown.total, 12, "every merged arrival survived the queue, not just the first");
    assert.equal(shown.el.querySelector(".dz-toast-title").textContent, groupTitle(12));

    // The body renders one device per line (capped at five), never a
    // comma-joined sentence, even for a leader that merged entirely while
    // still queued (dzToastQueueMerge, not dzToastMerge).
    const body = shown.el.querySelector(".dz-toast-body");
    const lines = body.children.map((c) => c.textContent);
    assert.deepEqual(lines, ["Hall", "Garage", "Attic", "Shed", "Loft", "and 7 more"]);
});

test("pausing a coalescing toast survives a group merge; the timer stays off until real resume", () => {
    const rt = loadToastRuntime();
    const d = rt.dz;

    function groupTitle(n) { return n + " devices"; }
    d.dzToast({
        type: "warning", title: "Hall timed out", deviceName: "Hall",
        group: "device-warning-timeout", groupTitle: groupTitle, timeout: 6000
    });
    const rec = d.dzToastVisible[0];
    assert.ok(rec.timer, "the toast starts with a running deadline");

    d.dzToastPause(rec); // what mouseenter/focusin call
    assert.equal(rec.timer, null);
    assert.equal(rec.paused, true);

    // A second device joins the group while the toast is still being read.
    d.dzToast({
        type: "warning", title: "Garage timed out", deviceName: "Garage",
        group: "device-warning-timeout", groupTitle: groupTitle, timeout: 6000
    });

    // The regression: dzToastMerge's pause/resume dance unconditionally
    // rearmed the timer, silently un-pausing a toast the user was still
    // hovering or focused on. Fixed, the merge only extends rec.remaining;
    // the timer stays off because rec.paused is still true.
    assert.equal(rec.timer, null, "a group merge must not rearm the timer while paused");
    assert.equal(rec.paused, true, "still paused after the merge");
    assert.equal(rec.remaining, 8000, "the deadline still extends to the group cap while paused");

    d.dzToastResume(rec); // what mouseleave/focusout call
    assert.ok(rec.timer, "resuming after the merge starts a timer");
    assert.equal(rec.paused, false);
});

/* ---- The show-devices button (Task 3): idx collection and the click seam ---- */

function groupTitleTimeout(n) { return n + " sensors timed out"; }

test("device-warning toast collects idxs across live merges", () => {
    const rt = loadToastRuntime();
    const d = rt.dz;
    d.dzToast({
        type: "warning", title: "Hall timed out", deviceName: "Hall", deviceIdx: "5",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    d.dzToast({
        type: "warning", title: "Garage timed out", deviceName: "Garage", deviceIdx: "9",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    const rec = d.dzToastVisible[0];
    // Array.from re-homes the array in this file's own realm: rec.idxs is an
    // array literal evaluated inside toasts.js's own vm context, and
    // assert's strict deepEqual treats that as a different constructor from
    // a literal written here, even with identical contents.
    assert.deepEqual(Array.from(rec.idxs), ["5", "9"]);
});

test("queued group leader collects idxs and carries them into show", () => {
    const rt = loadToastRuntime();
    const d = rt.dz;

    // Fill the stack so the group leader below has nowhere to render
    // immediately and must queue (same setup as the coalescing test above).
    for (let i = 0; i < 4; i++) {
        d.dzToast({ type: "info", title: "core message " + i, timeout: 4000 });
    }
    d.dzToast({
        type: "warning", title: "Hall timed out", deviceName: "Hall", deviceIdx: "5",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    assert.equal(d.dzToastQueue.length, 1, "the group leader queues, stack is full");

    // A second arrival merges into the still-queued leader.
    d.dzToast({
        type: "warning", title: "Garage timed out", deviceName: "Garage", deviceIdx: "9",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    assert.equal(d.dzToastQueue.length, 1, "still one queued entry, the arrival merged into it");

    // Free a slot and let the exit animation run, which drains the queue.
    d.dzToastRemove(d.dzToastVisible[0]);
    rt.clock.advance(320);

    const shown = d.dzToastVisible[d.dzToastVisible.length - 1];
    assert.equal(shown.group, "device-warning-timeout");
    assert.deepEqual(Array.from(shown.idxs), ["5", "9"], "both idxs survived the queue path");
    // MERGED-12: dzToastShow ran before the carry-over and would otherwise
    // have left the button hidden against entry.ev's own single idx.
    const btn = shown.el.querySelector(".dz-toast-show-devices");
    assert.equal(btn.hidden, false, "the button is enabled after the carry-over");
});

test("toast without deviceIdx renders no show-devices button", () => {
    const rt = loadToastRuntime();
    const d = rt.dz;
    // A plain core toast: no ev.source at all, so dzToastBuild never appends
    // the button element, not merely hides it.
    d.dzToast({ type: "info", title: "Something happened", timeout: 4000 });
    const rec = d.dzToastVisible[0];
    assert.equal(rec.el.querySelector(".dz-toast-show-devices"), null);
});

test("show-devices click arms the set filter with the rec's own label and removes the toast", () => {
    const spy = makeSpy();
    const rt = loadToastRuntime({ location: { hash: "#/LightSwitches" }, dzApplySetFilter: spy });
    const d = rt.dz;
    d.dzToast({
        type: "warning", title: "Hall timed out", deviceName: "Hall", deviceIdx: "5",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    d.dzToast({
        type: "warning", title: "Garage timed out", deviceName: "Garage", deviceIdx: "9",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    const rec = d.dzToastVisible[0];
    const btn = rec.el.querySelector(".dz-toast-show-devices");
    btn.click();

    assert.equal(spy.calls.length, 1);
    // Object.assign re-homes the members object in this file's own realm;
    // see the Array.from comment above for why a raw deepEqual fails here.
    assert.deepEqual(Object.assign({}, spy.calls[0][0]), { "d:5": true, "d:9": true });
    assert.equal(spy.calls[0][1], groupTitleTimeout(2));
    assert.equal(rec.removed, true, "the toast is dismissed after arming the filter");
});

test("merge-gained idxs enable a button that was hidden at show time", () => {
    const rt = loadToastRuntime();
    const d = rt.dz;
    // The leader carries no deviceIdx (dzCardIdx found no resolvable idx for
    // it), so the button exists but starts hidden.
    d.dzToast({
        type: "warning", title: "Hall timed out", source: "device-warning",
        group: "device-warning-timeout", groupTitle: groupTitleTimeout, timeout: 6000
    });
    const rec = d.dzToastVisible[0];
    const btn = rec.el.querySelector(".dz-toast-show-devices");
    assert.equal(btn.hidden, true, "no idx yet, button starts hidden");

    d.dzToast({
        type: "warning", title: "Garage timed out", deviceName: "Garage", deviceIdx: "9",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    assert.equal(btn.hidden, false, "a merge that gains an idx must reveal the button (MERGED-12)");
});

test("show-devices click after navigation dismisses without filtering", () => {
    const spy = makeSpy();
    const rt = loadToastRuntime({ location: { hash: "#/LightSwitches" }, dzApplySetFilter: spy });
    const d = rt.dz;
    d.dzToast({
        type: "warning", title: "Hall timed out", deviceName: "Hall", deviceIdx: "5",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    const rec = d.dzToastVisible[0];

    rt.location.hash = "#/Utility"; // the user navigated away while the toast sat on screen
    rec.el.querySelector(".dz-toast-show-devices").click();

    assert.equal(spy.calls.length, 0, "a click after navigation must never arm the filter (MERGED-6)");
    assert.equal(rec.removed, true, "it still degrades to a plain dismiss");
});

test("a queued toast keeps its origin hash and dismisses without filtering after draining onto a new page", () => {
    const spy = makeSpy();
    const rt = loadToastRuntime({ location: { hash: "#/LightSwitches" }, dzApplySetFilter: spy });
    const d = rt.dz;

    // Fill the stack so the warning below has nowhere to render immediately
    // and must queue while the page is still #/LightSwitches.
    for (let i = 0; i < 4; i++) {
        d.dzToast({ type: "info", title: "core message " + i, timeout: 4000 });
    }
    d.dzToast({
        type: "warning", title: "Hall timed out", deviceName: "Hall", deviceIdx: "5",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    assert.equal(d.dzToastQueue.length, 1, "the warning queues, stack is full");

    rt.location.hash = "#/Utility"; // navigated away while the toast was still queued

    // Free a slot and let the exit animation run, which drains the queue and
    // calls dzToastShow against the now-current (wrong) location.
    d.dzToastRemove(d.dzToastVisible[0]);
    rt.clock.advance(320);

    const shown = d.dzToastVisible[d.dzToastVisible.length - 1];
    assert.equal(shown.group, "device-warning-timeout");
    shown.el.querySelector(".dz-toast-show-devices").click();

    assert.equal(spy.calls.length, 0,
        "a toast that queued on one page must not filter the page it happened to drain onto");
    assert.equal(shown.removed, true, "it still degrades to a plain dismiss");
});

test("close button click does not arm the filter", () => {
    const spy = makeSpy();
    const rt = loadToastRuntime({ location: { hash: "#/LightSwitches" }, dzApplySetFilter: spy });
    const d = rt.dz;
    d.dzToast({
        type: "warning", title: "Hall timed out", deviceName: "Hall", deviceIdx: "5",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    });
    const rec = d.dzToastVisible[0];
    rec.el.querySelector(".dz-toast-close").click();

    assert.equal(spy.calls.length, 0, "the close button must never reach the filter (stopPropagation contract)");
    assert.equal(rec.removed, true);
});

/* ---- Re-warn defences (2026-09-09) ----

   All three cover the same measured defect: a grouped device warning whose
   count climbs and whose body lists one device several times. Reproduced on
   the rig by running the theme's own render pass repeatedly with one device
   painted as two cards, only one of them carrying the status class; the
   title went 2 -> 4 -> 5 -> 6 with the session dedupe left EMPTY after every
   pass, because the re-arm loop cleared the very key the trigger loop had
   just set. */

test("a device already in a group does not get counted or listed twice on merge", () => {
    const rt = loadToastRuntime();
    const d = rt.dz;
    const ev = {
        type: "warning", title: "Hall timed out", deviceName: "Hall", deviceIdx: "5",
        key: "timeout:5", source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    };
    d.dzToast(ev);
    d.dzToast({ ...ev, deviceName: "Garage", deviceIdx: "9", key: "timeout:9", title: "Garage timed out" });
    /* The re-arrival, under a DIFFERENT key form so the session dedupe does not
       swallow it first: keys are how dzWarnPass actually calls dzToast, and a
       keyless event would bypass the layer this test claims to exercise. */
    d.dzToast({ ...ev, deviceIdx: undefined, key: "timeout:name:Hall" });
    const rec = d.dzToastVisible[0];
    assert.equal(rec.total, 2, "a repeat of a device already in the group must not raise the count");
    assert.deepEqual(Array.from(rec.idxs), ["5", "9"]);
    assert.deepEqual(Array.from(rec.names), ["Hall", "Garage"]);
    assert.equal(rec.el.querySelector(".dz-toast-title").textContent, "2 sensors timed out");
});

test("a device warning with no resolvable idx still gets a dedupe key, from its name", () => {
    /* dzToastShouldSuppress returns false for a null key by design, because
       core's own keyless toasts must never be deduped. A device warning must
       therefore never HAND it a null key: a card whose idx will not resolve
       would otherwise re-warn on every single render pass, forever. */
    assert.equal(dz.dzWarnKey("timeout", "54", "Timeout Sensor"), "timeout:54");
    assert.equal(dz.dzWarnKey("timeout", null, "Timeout Sensor"), "timeout:name:Timeout Sensor");
    assert.equal(dz.dzWarnKey("timeout", "", "Timeout Sensor"), "timeout:name:Timeout Sensor");
    assert.equal(dz.dzWarnKey("timeout", null, ""), null, "nothing to key on at all stays keyless");
    assert.equal(dz.dzWarnKey("timeout", null, null), null);
});

test("the re-arm pass never clears a key that is still warning on the same page", () => {
    /* The root cause. One device painted as two cards, only one flagged: the
       trigger loop marks timeout:54 seen, then the clear loop sees the
       unflagged twin, resolves the SAME idx, and wipes the mark. Next render
       pass warns it again, and again, and again. */
    assert.deepEqual(
        dz.dzWarnClearableKeys(["timeout:54"], ["timeout:54", "timeout:7"]),
        ["timeout:7"],
        "a key present in the warned set must survive the clear pass"
    );
    assert.deepEqual(dz.dzWarnClearableKeys([], ["timeout:7"]), ["timeout:7"]);
    assert.deepEqual(dz.dzWarnClearableKeys(["timeout:7"], []), []);
    assert.deepEqual(dz.dzWarnClearableKeys(["timeout:7"], ["timeout:7"]), []);
});

test("one device arriving first without an idx and then with one is listed once, and its idx is still collected", () => {
    /* Reachable in production, not just in a probe: the live device_update
       handler (src/js/devices.js) calls setAllDevicesIconsStatus() on its own
       10ms timer, outside dzRunDevicePass's tagging loop, so a freshly
       re-rendered card can be idx-less on one pass and idx-bearing on the
       next. The user must not be told there are two bad sensors, and "Show
       these devices" must still be able to reach the device. */
    const rt = loadToastRuntime();
    const d = rt.dz;
    const base = {
        type: "warning", title: "Hall timed out", deviceName: "Hall",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    };
    d.dzToast({ ...base, deviceIdx: undefined, key: "timeout:name:Hall" });
    d.dzToast({ ...base, deviceName: "Garage", deviceIdx: "9", key: "timeout:9", title: "Garage timed out" });
    d.dzToast({ ...base, deviceIdx: "5", key: "timeout:5" });
    const rec = d.dzToastVisible[0];
    assert.deepEqual(Array.from(rec.names), ["Hall", "Garage"], "one line per device, not per arrival");
    assert.equal(rec.total, 2);
    assert.deepEqual(Array.from(rec.idxs), ["9", "5"], "the late idx is adopted so the filter can reach it");
});

/* ---- Post-review corrections (2026-09-09, adversarial review ledger) ---- */

test("two distinct devices sharing a display name are counted and titled as two", () => {
    /* The name match shipped in the first cut treated a shared display name as
       the same device, so two failed sensors were announced as one and the
       group title never fired. Domoticz does not enforce unique names, and the
       badge and Problem Devices page (problems.js, keyed on idx) report the
       true number on the same screen, so the toast contradicted them. */
    const rt = loadToastRuntime();
    const d = rt.dz;
    const base = {
        type: "warning", title: "Front Door timed out", deviceName: "Front Door",
        source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    };
    d.dzToast({ ...base, deviceIdx: "5", key: "timeout:5" });
    d.dzToast({ ...base, deviceIdx: "9", key: "timeout:9" });
    const rec = d.dzToastVisible[0];
    assert.equal(rec.total, 2, "two devices that both failed must count as two");
    assert.deepEqual(Array.from(rec.idxs), ["5", "9"]);
    assert.equal(rec.el.querySelector(".dz-toast-title").textContent, "2 sensors timed out");
});

test("a swallowed duplicate reports itself as one, so the caller does not record it as shown", () => {
    /* dzWarnPass gates its persisted "last shown" stamp on result.shown. A
       merge that renders nothing must not burn the daily quiet period or, in
       episode mode, block the key indefinitely for a warning nobody saw. */
    const rt = loadToastRuntime();
    const d = rt.dz;
    const ev = {
        type: "warning", title: "Hall timed out", deviceName: "Hall", deviceIdx: "5",
        key: "timeout:5", source: "device-warning", group: "device-warning-timeout",
        groupTitle: groupTitleTimeout, timeout: 6000
    };
    const first = d.dzToast(ev);
    assert.equal(first.shown, true);
    assert.ok(!first.duplicate, "the first arrival for a device is not a duplicate");
    /* Same device, different key form, so the session dedupe does not swallow
       it before the merge sees it (the idx-less-then-idx-bearing case). */
    const again = d.dzToast({ ...ev, deviceIdx: undefined, key: "timeout:name:Hall" });
    assert.equal(again.duplicate, true, "a merge that renders nothing must say so");
    const rec = d.dzToastVisible[0];
    assert.equal(rec.total, 1);
});
