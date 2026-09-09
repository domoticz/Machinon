/* Set filter: hide every card on the current page that is not in an armed set
   of (kind, idx) members. This is the primitive behind the click-the-toast
   seam (src/js/toasts.js) and the problem page (src/js/problems.js); the
   studied-not-built search filter pills would be its third caller.

   It exists because a text query cannot express a set: core's multi-term
   matching is AND over terms ((?=.*a)(?=.*b) in WatchLiveSearch), so there is
   no query meaning "device 54 OR device 231". Deliberately the opposite scope
   of src/js/device-filter.js: that file is anchored on .dd-grid and inert
   wherever core filters itself, while this one must work on EVERY page,
   including the ones core owns. The two share conventions (marker-class
   hiding, classList-only reapply, the dz:livesearch:show re-show trigger) but
   no state, and the marker classes stay distinct so a set filter COMPOSES
   with a text search (intersection: either mark hides) instead of fighting
   over one class. */

var DZ_SET_HIDDEN = "dz-set-filtered-out";

/* The armed filter ({members, label}) or null. members is a plain object
   keyed "d:<idx>" / "s:<idx>"; kind matters because scene and device idx
   spaces overlap and scene cards are structurally identical to device cards
   (both div.item.itemBlock). */
var dzSetFilter = null;

/* One-shot handoff for dzNavigateAndFilter: the hashchange that navigation
   fires normally CLEARS the filter (page-scoped lifetime), so a row click on
   the problem page stores its filter here, tagged with the destination hash.
   The hashchange handler itself consumes it on arrival (so arming never
   depends on the destination rendering any card, and the chip always appears
   to tell the truth even over an empty page); a hashchange to anywhere else
   drops it. It lives only between the navigate call and its own hashchange
   event, so it needs no TTL. */
var dzSetFilterPending = null;

function dzSetFilterCards() {
    /* #main-view holds every routed page's cards, the Dynamic Dashboard's
       .dd-grid included; asserted per page family by the rig harness
       dz-set-filter-contract.js, which is the thing to re-run if core ever
       moves the container. */
    return Array.prototype.slice.call(document.querySelectorAll("#main-view .itemBlock"));
}

/* Kind comes from the CONTAINER, not a glyph class: .dz-scene-run marks only
   4 of 7 cards on the Scenes page (groups carry On/Off pairs instead), and
   core's icon rework has already moved glyph classes once. Scene cards render
   under #scenecontent ONLY on the Scenes page; on the classic dashboard they
   sit in section#dashScenes (views/dashboard_desktop.html, favourited scenes
   only); on the Dynamic Dashboard a scene widget is wrapped in
   .dd-widget--dz-scene (views/dashboardDynamic/widget-wrapper.html builds
   this class from the widget's OWN registry type, "dz-scene" vs "dz-device",
   app/dashboardDynamic/widgets/ddDzScene.widget.js). None of the three inner
   dz-scene-widget elements these surfaces eventually compile survive in the
   DOM to be a selector target: the directive declares replace: true
   (app/widgets/dzSceneWidget.js), so Angular swaps the custom tag for its
   template root at link time and no element named dz-scene-widget is ever
   actually in the tree; a card.closest("dz-scene-widget") is a permanent
   no-op measured live on both the classic dashboard's favourited scene
   (#dashScenes was also missing here originally) and the Dash2 scene widget,
   both misclassifying as a device, d:<idx>, until the rig contract's C4
   caught it. The idx is core's own td#name[data-idx], present in every
   widget template without any theme pass (the enhancement pass's
   tr[data-idx] also matches; either serves).

   The computed key is cached on the element: this runs on the render-pass
   reapply path, and the sibling module measured uncached per-card DOM reads
   at 43x the cached cost (dzCardSearchText). The key is stable for the
   element's life (a re-render produces a fresh element), so no generation
   counter is needed; null is a valid cached value, hence the `in` test. */
function dzSetCardKey(card) {
    if (!("dzSetKey" in card)) {
        var el = card.querySelector("[data-idx]");
        var idx = el && el.getAttribute("data-idx");
        card.dzSetKey = idx
            ? ((card.closest("#scenecontent") || card.closest("#dashScenes") || card.closest(".dd-widget--dz-scene")) ? "s:" : "d:") + idx
            : null;
    }
    return card.dzSetKey;
}

function dzApplySetFilter(members, label) {
    dzSetFilter = { members: members || {}, label: label || "" };
    dzReapplySetFilter();
    dzSetChipShow(dzSetFilter.label);
}

/* Two-phase on purpose (MERGED-9): the dz:livesearch:show handler is core's
   dzLightWidget resizeSliders, whose #name .width() read forces a layout;
   interleaving it with class writes would force one reflow per re-shown
   dimmer card. All writes land first, then all triggers, so layout flushes
   once. `silent` skips the triggers entirely: on the hashchange-away path the
   page's widgets are being destroyed and unbind on $destroy, so there is
   nobody to notify and nothing to pay for. */
function dzClearSetFilter(silent) {
    dzSetFilter = null;
    var hidden = Array.prototype.slice.call(document.getElementsByClassName(DZ_SET_HIDDEN));
    hidden.forEach(function (card) { card.classList.remove(DZ_SET_HIDDEN); });
    if (!silent) {
        hidden.forEach(function (card) { $(card).trigger("dz:livesearch:show"); });
    }
    dzSetChipHide();
}

function dzReapplySetFilter() {
    /* classList-only plus a cached-property read per card, and nothing at all
       when disarmed. This runs from the render pass (dzRunDevicePass visible
       stage), which the mutation observer fires within 150ms of any card
       change, INCLUDING every device_update burst; it is deliberately NOT
       also wired into initDeviceLiveUpdates (MERGED-10): the flush re-marks
       within MAX_WAIT_MS, in-place core updates keep the element and its
       class anyway, and single-path wiring matches dzReapplyDeviceFilter. */
    if (!dzSetFilter) return;
    var members = dzSetFilter.members;
    dzSetFilterCards().forEach(function (card) {
        var key = dzSetCardKey(card);
        var show = !!(key && members[key]);
        var wasHidden = card.classList.contains(DZ_SET_HIDDEN);
        card.classList.toggle(DZ_SET_HIDDEN, !show);
        if (show && wasHidden) $(card).trigger("dz:livesearch:show");
    });
}

/* Called from dzRunDevicePass's visible stage (src/js/devices.js), i.e. after
   every card render or re-render, so fresh cards from a room-combo re-render
   or a live-update repaint get re-marked. */
function dzSetFilterOnRender() {
    dzReapplySetFilter();
}

function dzNavigateAndFilter(route, members, label) {
    if (location.hash === route) {
        /* Same-route navigation fires no hashchange, so there would be no
           consumer; apply directly. */
        dzApplySetFilter(members, label);
        return;
    }
    dzSetFilterPending = { hash: route, members: members, label: label };
    location.hash = route;
}

/* ---- Chip: the visible armed state ---- */

function dzSetChipEl() {
    var chip = document.getElementById("dz-set-chip");
    if (chip) return chip;
    chip = document.createElement("div");
    chip.id = "dz-set-chip";
    chip.hidden = true;
    var label = document.createElement("span");
    label.className = "dz-set-chip-label";
    chip.appendChild(label);
    var clear = document.createElement("button");
    clear.type = "button";
    clear.className = "dz-set-chip-clear";
    clear.setAttribute("aria-label", dzT("setfilter.clear"));
    clear.title = dzT("setfilter.clear");
    clear.appendChild(document.createTextNode("×"));
    clear.addEventListener("click", function () { dzClearSetFilter(false); });
    chip.appendChild(clear);
    document.body.appendChild(chip);
    return chip;
}

function dzSetChipShow(label) {
    var chip = dzSetChipEl();
    /* textContent, never HTML: the label carries device names (user data). */
    chip.querySelector(".dz-set-chip-label").textContent = label;
    chip.hidden = false;
    dzSetChipPosition(chip);
}

/* Desktop header height is not a constant css/set-filter.css can bake in:
   it changes with the navbar_icons theme feature (icons on the menu tabs
   grow .navbar-fixed-top from 92px to 118px, measured live on the rig,
   2026-09-10) and has already drifted once between releases on top of
   that. Two earlier fixed-offset attempts on mobile (35px, then 118px, see
   that media query's own history comment) were wrong on a real device for
   exactly this reason: a static number cannot track content whose height
   this file does not control. This does the same job the mobile fix does
   by removing the dependency, but desktop's chip is top-anchored by design
   (unlike mobile's bottom anchor, an input-adjacent bottom sheet would
   fight the virtual keyboard there), so the fix here is to read the live
   fact instead of guessing it: measure .navbar-fixed-top's actual bottom
   edge at the moment the chip arms, and position from that. Runs once per
   dzApplySetFilter call (an arming event), not per render pass or on a
   timer, so the cost is one layout read per filter, not per card update.

   Mobile is untouched on purpose: css/set-filter.css's bottom anchor there
   depends on nothing above the chip, so it never needs measuring, and an
   inline style always outranks an external stylesheet rule regardless of
   specificity - setting one there would silently break the bottom anchor
   the same media query relies on. matchMedia mirrors that query's own
   breakpoint exactly rather than duplicating the number as a JS literal. */
function dzSetChipPosition(chip) {
    if (window.matchMedia && window.matchMedia("(max-width: 767px)").matches) {
        chip.style.top = ""; // defers to css/set-filter.css's bottom anchor
        return;
    }
    var header = document.querySelector(".navbar-fixed-top");
    if (!header) return; // CSS's own top:102px is the no-JS / no-header fallback
    var gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dz-card-space-lg")) || 10;
    chip.style.top = (header.getBoundingClientRect().bottom + gap) + "px";
}

function dzSetChipHide() {
    var chip = document.getElementById("dz-set-chip");
    if (chip) chip.hidden = true;
}

/* Page-scoped lifetime: any navigation disarms (silently: the old page's
   widgets are going away). The pending handoff is consumed HERE, on the
   navigation that armed it, so the chip shows even when the destination
   renders no cards (the all-hidden page then tells the truth and the chip is
   the way out); any other hashchange drops the pending. Guarded for the vm
   test context, which has no window. */
if (typeof window !== "undefined") {
    window.addEventListener("hashchange", function () {
        if (dzSetFilter) dzClearSetFilter(true);
        if (dzSetFilterPending) {
            var p = dzSetFilterPending;
            dzSetFilterPending = null;
            if (p.hash === location.hash) dzApplySetFilter(p.members, p.label);
        }
    });
}
