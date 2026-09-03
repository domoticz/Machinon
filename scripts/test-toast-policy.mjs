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

const dz = loadThemeGlobals(["src/js/toasts.js"]);

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
            addEventListener() { /* driven directly via dz.dzToastPause/Resume in tests */ },
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

/* A fresh vm context (document/window/clock included) per call, so each test
   gets isolated dzToastVisible/dzToastQueue/dzToastGroups singletons rather
   than leaking state between tests. */
function loadToastRuntime() {
    const clock = makeFakeClock();
    const dom = makeFakeDom();
    const ctx = vm.createContext({
        Math, console, JSON,
        document: dom, window: { innerWidth: 1024 },
        Date: clock.Date, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout
    });
    vm.runInContext(readFileSync("src/js/toasts.js", "utf8"), ctx, { filename: "src/js/toasts.js" });
    return { dz: ctx, clock };
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
