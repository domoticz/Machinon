/* Filtering for the Dynamic Dashboard, the one surface core's own search
   engine cannot use correctly. Core's WatchLiveSearch (js/domoticz.js) reads
   $('.itemBlock') with no container scoping at all, so it DOES find Dash2's
   cards too (dd-dz-device-widget renders the same .itemBlock markup, with the
   same data-search attribute, as every other page). What breaks is layout:
   each card sits inside its own grid-stack cell (.dd-widget-cell), and core's
   jQuery .hide()/.show() only ever touches the inner .itemBlock, so a
   filtered-out card leaves its full-size cell behind as a blank box. The
   classic dashboard (#dashcontent.devicesList) and every other page core owns
   need none of this, so this file must stay out of their way.

   Hiding .itemBlock here removes that blank box visually (no border, no
   background, no content), but the .dd-widget-cell grid slot around it still
   occupies its space: grid-stack positions cells with fixed x/y coordinates,
   not document flow, and a bare CSS display:none on a child does not make it
   reflow or compact the layout. A filtered Dash2 still has gaps where hidden
   cards used to sit; only the visible blank-card artifact is fixed.

   .dd-grid is the one container class exclusive to the Dynamic Dashboard; no
   other route renders it. Anchoring dzFilterCards() on it, rather than on a
   route name, is what keeps every function below inert wherever core already
   does the job: with no .dd-grid in the document the card list is empty, and
   every entry point here is a no-op on an empty list.

   Dash2's "section" headings (Lights and switches, Energy, Controls, ...) are
   dd-text-note-widget grid cells with no DOM relationship to the item widgets
   placed under them (verified: grid position only, sibling .dd-grid cells,
   no shared ancestor closer than the grid itself), so unlike the classic
   dashboard's <section class="dashCategory"> there is nothing here a filter
   could collapse when a group empties out; no section-hiding step exists in
   this file because there is no container it could operate on. */

var DZ_FILTER_HIDDEN = "dz-filtered-out";
var dzActiveFilter = null;

function dzFilterCards() {
    var root = document.querySelector(".dd-grid");
    if (!root) { return []; }
    return Array.prototype.slice.call(root.querySelectorAll(".itemBlock"));
}

function dzApplyDeviceFilter(predicate, meta) {
    dzActiveFilter = { predicate: predicate, meta: meta || {} };
    dzReapplyDeviceFilter();
}

function dzClearDeviceFilter() {
    dzActiveFilter = null;
    dzFilterCards().forEach(function (card) {
        var wasHidden = card.classList.contains(DZ_FILTER_HIDDEN) || card.style.display === "none";
        card.classList.remove(DZ_FILTER_HIDDEN);
        /* #searchInput carries core's .jsLiveSearch class too, so WatchLiveSearch
           (js/domoticz.js) runs on the same keystroke and writes its own inline
           display:none on non-matching .itemBlock elements. Its restore path for
           an EMPTY query only runs when $('.devicesList').hasClass(
           'devicesListFiltered'), a container class Dash2 never carries, so that
           inline style is left behind permanently once WatchLiveSearch has ever
           hidden a card here. Removing it is this function's job: the class
           toggle above is not enough to undo a plain inline style core wrote
           directly on the element, and this only runs once per keystroke, not
           on the device_update path dzReapplyDeviceFilter serves. */
        card.style.removeProperty("display");
        if (wasHidden && window.jQuery) {
            /* Same re-show contract as dzReapplyDeviceFilter below: a card
               that was actually hidden gets the event core's dzLightWidget
               listens for, a card that was never hidden does not. */
            window.jQuery(card).trigger("dz:livesearch:show");
        }
    });
}

function dzReapplyDeviceFilter() {
    /* Runs on every live device_update, so it stays classList-only: no
       getBoundingClientRect, no inline style writes, and nothing at all when
       no filter is active (setDeviceOptions alone has been measured at 500+
       calls in a 10-second window on a busy dashboard). */
    if (!dzActiveFilter) { return; }
    var predicate = dzActiveFilter.predicate;
    dzFilterCards().forEach(function (card) {
        var show = predicate(card);
        var wasHidden = card.classList.contains(DZ_FILTER_HIDDEN);
        card.classList.toggle(DZ_FILTER_HIDDEN, !show);
        if (show && wasHidden && window.jQuery) {
            /* Only on an actual hidden-to-shown transition, not on every card
               that already happened to be visible: this runs on every
               device_update, so re-triggering core's dzLightWidget (which
               re-measures on this event) for cards nothing changed on would
               undo the cost guarantee above for no reason. Core's contract
               for a re-shown card: dzLightWidget listens for this to
               re-measure dimmer sliders. Inert today because css/cards.css
               sizes .dimslider with !important, which outranks the inline
               width core's resizeSliders would otherwise write; fired anyway
               so a future removal of that !important does not silently
               reintroduce mis-sized sliders here. */
            window.jQuery(card).trigger("dz:livesearch:show");
        }
    });
}

/* Matches core's data-search attribute with the same multi-term AND rule
   WatchLiveSearch applies in js/domoticz.js, so a query behaves the same on
   the Dynamic Dashboard as on every page core filters itself. */
function dzDashboardSearchPredicate(query) {
    var terms = String(query || "").toLowerCase().split(/[\s,]+/).filter(Boolean);
    return function (card) {
        if (!terms.length) { return true; }
        var nameEl = card.querySelector("td#name");
        var text = ((nameEl && (nameEl.getAttribute("data-search") || nameEl.textContent)) || "").toLowerCase();
        for (var i = 0; i < terms.length; i++) {
            if (text.indexOf(terms[i]) === -1) { return false; }
        }
        return true;
    };
}

function dzWireDashboardSearch() {
    $(document).on("keyup change", "#searchInput", function () {
        var value = this.value;
        if (!value) {
            /* Always runs, even off Dash2: this is the only place
               dzActiveFilter ever gets cleared, and it must not survive
               past its own query. Gating this behind dzFilterCards().length
               (as the narrowing branch below does) would leave a stale
               predicate armed whenever the user clears the box on a
               DIFFERENT page after core persisted a Dash2 query there --
               core's own restore is a no-op for an empty stored query, so
               nothing would ever re-fire this handler on returning to
               Dash2, and the next live device_update would apply the stale
               predicate and hide cards behind an input showing nothing.
               dzClearDeviceFilter()'s own DOM loop already iterates an
               empty array on every non-Dash2 surface, so calling it
               unconditionally costs nothing there. */
            dzClearDeviceFilter();
            return;
        }
        /* Narrowing stays Dash2-only: dzFilterCards() is empty on every
           other page, so arming a predicate there would have nothing to
           run against until the user is back on Dash2 anyway, and core's
           own restore re-fires this same handler with the persisted,
           non-empty value once they arrive. */
        if (!dzFilterCards().length) { return; }
        dzApplyDeviceFilter(dzDashboardSearchPredicate(value), { kind: "search", label: value });
    });
}
