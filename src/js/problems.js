/* House-wide problem list: badge + #/Problems page, both fed by ONE reduction
   of ONE query per tick (dzProblemsRefresh fetches once and fans the same
   rows out to both consumers, so they cannot diverge within a tick). The
   query is the getdevices call core itself uses, so the result is scoped
   exactly as core scopes its own pages for this session's user (see
   GetJSonDevices, WebServer.cpp: the SharedDevices filter is gated on
   TotSensors > 0 at :1337 and falls open to all devices at :1477 for a
   shareless non-admin, the same view core's own pages give that user). The
   data source is the API, never the toast log: toasts are page-scoped and
   only know about pages visited this session. */

/* Which page does a device live on? The server already answers this: each of
   core's four device pages populates itself with getdevices&filter=<page>
   (LightsController, TemperatureController, WeatherController,
   UtilityController), so membership in those responses IS the routing truth,
   and deriving the map from them cannot drift when upstream moves a type.
   Cached per session: a device changes page only when its type changes, and
   every Problems-page VISIT refreshes the cache anyway. */
var DZ_PROBLEM_FILTER_ROUTES = [
    ["light", "#/LightSwitches"],
    ["temp", "#/Temperature"],
    ["weather", "#/Weather"],
    ["utility", "#/Utility"]
];

function dzProblemsBuildRouteMap(lists) {
    var map = {};
    DZ_PROBLEM_FILTER_ROUTES.forEach(function (pair) {
        (lists[pair[0]] || []).forEach(function (idx) {
            if (!map[idx]) map[idx] = pair[1];
        });
    });
    return map;
}

var dzProblemsRouteCache = null;

function dzProblemsResolveRoutes(cb) {
    if (dzProblemsRouteCache) { cb(dzProblemsRouteCache); return; }
    var lists = {};
    var left = DZ_PROBLEM_FILTER_ROUTES.length;
    var failed = false;
    DZ_PROBLEM_FILTER_ROUTES.forEach(function (pair) {
        $.ajax({
            url: "json.htm?type=command&param=getdevices&filter=" + pair[0] + "&used=true",
            dataType: "json",
            timeout: 15000,
            success: function (data) {
                lists[pair[0]] = ((data && data.result) || []).map(function (d) { return String(d.idx); });
            },
            error: function () { failed = true; },
            complete: function () {
                left--;
                if (left) return;
                if (failed) { cb(null); return; } /* rows render non-clickable, never wrongly clickable */
                dzProblemsRouteCache = dzProblemsBuildRouteMap(lists);
                cb(dzProblemsRouteCache);
            }
        });
    });
}

function dzProblemsRoute(map, idx) {
    return (map && map[idx]) || null;
}

/* Matches core's GetItemBackgroundStatus (www/app/app.js:921): disabled
   hardware wins (deliberately off is not a problem), then HaveTimeout, then
   battery, where 255 means "does not report" and low is <= 10. Core emits
   these fields from C++ bools, so === true is exact. Keep in lockstep with
   core; the card classes (statusTimeout/statusLowBattery) that drive the
   warning toasts come from the same function, so toast, badge and page agree
   on what a problem is. */
function dzProblemsReduce(devices) {
    var rows = [];
    (devices || []).forEach(function (d) {
        if (d.HardwareDisabled === true) return;
        var battery = parseInt(d.BatteryLevel, 10);
        if (d.HaveTimeout === true) {
            rows.push({ idx: String(d.idx), name: d.Name, kind: "timeout", battery: null,
                        lastUpdate: d.LastUpdate });
        } else if (!isNaN(battery) && battery !== 255 && battery <= 10) {
            rows.push({ idx: String(d.idx), name: d.Name, kind: "battery", battery: battery,
                        lastUpdate: d.LastUpdate });
        }
    });
    rows.sort(function (a, b) {
        if (a.kind !== b.kind) return a.kind === "timeout" ? -1 : 1;
        if (a.kind === "battery" && a.battery !== b.battery) return a.battery - b.battery;
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    return rows;
}

/* Cheap identity for "did anything the user can see change": used to skip
   the page rebuild on quiet ticks (steady-state DOM churn would also retrigger
   the theme's #holder MutationObserver pass and throw away keyboard focus
   once a minute). */
function dzProblemsFingerprint(rows) {
    return rows.map(function (r) { return r.idx + ":" + r.kind + ":" + r.battery; }).join(",");
}

function dzProblemsFetch(cb) {
    $.ajax({
        url: "json.htm?type=command&param=getdevices&filter=all&used=true",
        dataType: "json",
        timeout: 15000, /* well under the poll period, so ticks cannot stack */
        success: function (data) {
            /* Shape-validated: an HTTP-200 body without status OK and a result
               ARRAY is an error, not an empty house. Rendering a degraded
               answer as "no problems" would be a false all-clear on the one
               surface whose job is truthful health reporting; core has at
               least one path returning status OK with no result. */
            if (data && data.status === "OK" && Array.isArray(data.result)) {
                cb(null, dzProblemsReduce(data.result));
            } else {
                cb(new Error("getdevices malformed answer"));
            }
        },
        error: function () { cb(new Error("getdevices failed")); }
    });
}

var DZ_PROBLEMS_POLL_MS = 60000; /* a timeout is a slow-moving fact */
var dzProblemsInitArmed = false; /* re-entrancy guard, same convention as flyoutContainmentArmed */
var dzProblemsInFlight = false;  /* single-flight: a tick never stacks on a slow server */

function dzProblemsBadgeEl() {
    var badge = document.getElementById("dz-problem-badge");
    if (badge) return badge;
    /* The container is fallible (setSearch guards the same lookup): without
       it, return null and let the caller's guard skip the tick, rather than
       throwing inside the ajax callback every minute forever. */
    var logo = document.querySelector(".container-logo");
    if (!logo) return null;
    badge = document.createElement("button");
    badge.type = "button";
    badge.id = "dz-problem-badge";
    badge.hidden = true;
    badge.title = dzT("problems.badge_title");
    var icon = document.createElement("i");
    icon.className = "ion-ios-warning";
    icon.setAttribute("aria-hidden", "true");
    badge.appendChild(icon);
    var count = document.createElement("span");
    count.className = "dz-problem-count";
    badge.appendChild(count);
    badge.addEventListener("click", function () { location.hash = "#/Problems"; });
    /* Inserted BEFORE #search, not appended: float:right stacks its FIRST
       DOM child flush against the container's right edge and later
       siblings to its left, so DOM order is what puts the badge outermost
       (owner's placement: search inward, the badge at the far right) with
       search unaffected either way (css/problems.css never touches
       search.css). Falls back to appendChild if #search is ever missing,
       so a boot-order change degrades to "badge somewhere in the bar"
       rather than a hard failure. */
    var search = document.getElementById("search");
    if (search) { logo.insertBefore(badge, search); } else { logo.appendChild(badge); }
    return badge;
}

/* One fetch per tick, fanned out: the badge and (when open) the page consume
   the SAME rows, which is what makes "badge N equals page row count N" a
   guarantee instead of a race between two snapshots. */
function dzProblemsRefresh() {
    if (dzProblemsInFlight) return;
    if (document.hidden) return; /* a hidden tab resumes via visibilitychange below */
    dzProblemsInFlight = true;
    dzProblemsFetch(function (err, rows) {
        dzProblemsInFlight = false;
        var badge = dzProblemsBadgeEl();
        if (badge) {
            if (err || !rows.length) {
                /* An errored fetch HIDES the badge rather than showing a stale
                   number: a wrong count is worse than none, and the page
                   carries the visible error state. */
                badge.hidden = true;
            } else {
                badge.querySelector(".dz-problem-count").textContent = String(rows.length);
                badge.hidden = false;
            }
        }
        if (typeof dzProblemsRenderRows === "function" &&
            location.hash.indexOf("#/Problems") === 0) {
            dzProblemsRenderRows(err ? null : rows);
        }
    });
}

/* Route-entry render: fetch, then hand the rows to the same renderer the
   poll tick uses. Forcing a fresh fingerprint makes a visit always repaint. */
function dzProblemsRenderPage() {
    dzProblemsRenderedPrint = null;
    dzProblemsFetch(function (err, rows) {
        dzProblemsRenderRows(err ? null : rows);
    });
}

var dzProblemsRenderedPrint = null;

/* rows === null means "the fetch failed" (error state); [] means an honestly
   empty house. Every element is re-resolved here and null-guarded: this also
   runs from the poll tick's callback, which can land after the user left the
   route and ng-view destroyed the template (jQuery 3 would rethrow an
   uncaught TypeError otherwise). */
function dzProblemsRenderRows(rows) {
    var table = document.getElementById("dz-problems-table");
    var state = document.getElementById("dz-problems-state");
    var title = document.getElementById("dz-problems-title");
    if (!table || !state || !title) return;
    var tbody = table.querySelector("tbody");
    title.textContent = dzT("problems.title");
    document.getElementById("dz-problems-intro").textContent = dzT("problems.intro");
    document.getElementById("dz-problems-th-name").textContent = dzT("problems.th_name");
    document.getElementById("dz-problems-th-what").textContent = dzT("problems.th_what");
    document.getElementById("dz-problems-th-seen").textContent = dzT("problems.th_seen");
    if (rows === null) {
        state.textContent = dzT("problems.error");
        state.hidden = false; table.hidden = true;
        dzProblemsRenderedPrint = null;
        return;
    }
    if (!rows.length) {
        state.textContent = dzT("problems.empty");
        state.hidden = false; table.hidden = true;
        dzProblemsRenderedPrint = "";
        return;
    }
    var print = dzProblemsFingerprint(rows);
    if (print === dzProblemsRenderedPrint) return; /* quiet tick: no DOM churn, no focus loss */
    dzProblemsRenderedPrint = print;
    state.hidden = true; table.hidden = false;
    tbody.textContent = "";
    dzProblemsResolveRoutes(function (map) {
        rows.forEach(function (row) {
            var tr = document.createElement("tr");
            var nameCell = document.createElement("td");
            nameCell.textContent = row.name;
            tr.appendChild(nameCell);
            var whatCell = document.createElement("td");
            whatCell.textContent = row.kind === "battery"
                ? dzT("problems.battery", { level: row.battery })
                : dzT("problems.timeout");
            tr.appendChild(whatCell);
            var seenCell = document.createElement("td");
            /* Core shows LastUpdate in 24h everywhere (it renders the raw
               "YYYY-MM-DD HH:mm:ss" API value as-is), and the owner fixed 24h
               for this theme too, so LT's locale-dependent 12h variant (e.g.
               "9:12 AM" under en) is deliberately not used here; "L" still
               follows the locale's own date order. Seconds are dropped, same
               as the rest of the theme's last-seen displays. */
            seenCell.textContent = moment(row.lastUpdate, ["YYYY-MM-DD HH:mm:ss", "L LT"]).format("L HH:mm");
            tr.appendChild(seenCell);
            var route = dzProblemsRoute(map, row.idx);
            if (route) {
                tr.classList.add("dz-problems-row--link");
                tr.tabIndex = 0;
                tr.title = dzT("problems.show_device");
                tr.addEventListener("click", function () {
                    var members = {};
                    members["d:" + row.idx] = true;
                    dzNavigateAndFilter(route, members, row.name);
                });
                tr.addEventListener("keydown", function (e) { if (e.key === "Enter") tr.click(); });
            }
            tbody.appendChild(tr);
        });
    });
}

function dzProblemsInit() {
    if (dzProblemsInitArmed) return;
    dzProblemsInitArmed = true;
    dzProblemsRefresh();
    setInterval(dzProblemsRefresh, DZ_PROBLEMS_POLL_MS);
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) dzProblemsRefresh();
    });
    if (typeof dzRouteMilestone === "function") dzRouteMilestone("problems");
}
