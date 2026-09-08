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
   this file because there is no container it could operate on.

   The camera cards on the CLASSIC dashboard are the second surface here, and
   they are here for a different reason: core's engine reaches every card it
   can recognise, and a camera is markup core has never seen (see
   dzFilterCameras below). Everything else on that surface stays core's. */

var DZ_FILTER_HIDDEN = "dz-filtered-out";

/* A class of its own, not DZ_FILTER_HIDDEN: cameras are hidden on a surface
   core filters itself, and the two marks have to stay tellable apart so
   "the theme never marks a device card on the classic dashboard" stays a
   thing that can be asserted. */
var DZ_CAMERA_HIDDEN = "dz-camera-filtered-out";

/* The armed predicate itself, or null. It takes a card's search TEXT, not the
   card: the DOM read that produces that text is cached per query (see
   dzCardSearchText), and a predicate that reached into the element again would
   put the cost straight back. */
var dzActiveFilter = null;

/* Bumped once per armed query. Cards carry the generation their cached text was
   read under, so a new query re-reads every card exactly once and the live
   device_update path re-reads nothing. */
var dzFilterGeneration = 0;

function dzFilterCards() {
    var root = document.querySelector(".dd-grid");
    if (!root) { return []; }
    return Array.prototype.slice.call(root.querySelectorAll(".itemBlock"));
}

/* Core's data-search sits on a td INSIDE the card, so reading it per card costs
   a descendant query plus an attribute read, and dzReapplyDeviceFilter runs on
   every device_update (measured: 546 in a 10-second window against 228 devices).
   Paying it there scaled the cost with the card count on exactly the
   configuration where a filter is active: measured on a 42-card dashboard, 100
   reapplies cost 4300 element queries reading the text per card against 100
   caching it. The text is therefore read once per card per query and cached on
   the element. Re-reading it on a later device_update would not change what the
   user sees anyway: core's own engine re-evaluates a query on keystrokes only,
   never on a value arriving. */
function dzCardSearchText(card) {
    if (card.dzSearchGeneration !== dzFilterGeneration) {
        var nameEl = card.querySelector("td#name");
        card.dzSearchText = ((nameEl && (nameEl.getAttribute("data-search") || nameEl.textContent)) || "").toLowerCase();
        card.dzSearchGeneration = dzFilterGeneration;
    }
    return card.dzSearchText;
}

function dzApplyDeviceFilter(predicate) {
    dzActiveFilter = predicate;
    dzFilterGeneration++;
    dzReapplyDeviceFilter();
}

function dzClearDeviceFilter() {
    dzActiveFilter = null;
    var cards = dzFilterCards();
    cards.forEach(function (card) {
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
        if (wasHidden) {
            /* Same re-show contract as dzReapplyDeviceFilter below: a card
               that was actually hidden gets the event core's dzLightWidget
               listens for, a card that was never hidden does not. */
            $(card).trigger("dz:livesearch:show");
        }
    });
    if (!cards.length) { return; }

    /* Dash2 only, and a correction rather than a race. Core paints the result
       badge from $('.liveSearchShown').length and strips that class only inside
       the branch it gates on $('.devicesList').hasClass('devicesListFiltered');
       Dash2 renders no .devicesList, so on this surface the class outlives every
       clear, and the badge keeps counting the cards of a query that is no longer
       in the box. Stripping the class is what core's own restore branch would
       have done, and it keeps the NEXT query's count honest; the repaint is
       needed on top of it because core's handler is bound directly on the input
       while this one is delegated on document, so the stale number is already on
       screen by the time this runs. _tbDisplayResults is a global in
       js/domoticz.js and takes the same arguments core passes for an empty
       query. */
    $(".liveSearchShown").removeClass("liveSearchShown");
    if (typeof _tbDisplayResults === "function") { _tbDisplayResults(false, 0); }
}

function dzReapplyDeviceFilter() {
    /* Runs on every live device_update, so it stays classList-only: no
       getBoundingClientRect, no inline style writes, no per-card DOM reads
       (dzCardSearchText above), and nothing at all when no filter is active
       (setDeviceOptions alone has been measured at 500+ calls in a 10-second
       window on a busy dashboard). */
    if (!dzActiveFilter) { return; }
    var predicate = dzActiveFilter;
    dzFilterCards().forEach(function (card) {
        var show = predicate(dzCardSearchText(card));
        var wasHidden = card.classList.contains(DZ_FILTER_HIDDEN);
        card.classList.toggle(DZ_FILTER_HIDDEN, !show);
        if (show && wasHidden) {
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
            $(card).trigger("dz:livesearch:show");
        }
    });
}

/* Matches core's data-search attribute with the same multi-term AND rule
   WatchLiveSearch applies in js/domoticz.js, so a query behaves the same on
   the Dynamic Dashboard as on every page core filters itself. */
function dzDashboardSearchPredicate(query) {
    var terms = String(query || "").toLowerCase().split(/[\s,]+/).filter(Boolean);
    return function (text) {
        if (!terms.length) { return true; }
        for (var i = 0; i < terms.length; i++) {
            if (text.indexOf(terms[i]) === -1) { return false; }
        }
        return true;
    };
}

/* Camera cards are the theme's own markup: js/dashboard_camera.js injects
   <section id="dashCameras"> onto the classic dashboard, with a .movable card
   per enabled camera. They carry neither .itemBlock nor a data-search
   attribute, the two things core's WatchLiveSearch matches on, so core's
   engine filters the devices around them and leaves every camera on screen.
   Handing the job back to core by adding .itemBlock would make them HARDER to
   hide, not easier: views/dashboard_desktop.html carries an inline
   "#dashcontent .itemBlock { display: block !important }" rule so that core's
   jQuery hiding cannot fight Angular's ng-repeat on that surface, and it would
   outrank any hiding of a camera too. The theme owns the markup, so the theme
   filters it.

   A camera exposes nothing but its name, and the devices beside it are
   filtered by DashboardDesktopController's filterDevices
   (app/dashboard/DashboardDesktopController.js), which tests the WHOLE query
   against each field with indexOf, as one phrase rather than as independent
   terms. Matching the name the same way is what keeps one query meaning one
   thing on one page. (dzDashboardSearchPredicate above splits into terms
   instead because the Dynamic Dashboard is the surface core's own
   WatchLiveSearch would otherwise match, and that engine splits.) */
function dzFilterCameras(query) {
    var section = document.getElementById("dashCameras");
    if (!section) { return; }
    var phrase = String(query || "").toLowerCase();
    var showAll = phrase.trim() === "";
    var shown = 0;
    Array.prototype.forEach.call(section.querySelectorAll(".movable"), function (card) {
        var nameEl = card.querySelector("td#name");
        var name = ((nameEl && nameEl.textContent) || "").toLowerCase();
        var show = showAll || name.indexOf(phrase) !== -1;
        card.classList.toggle(DZ_CAMERA_HIDDEN, !show);
        if (show) { shown++; }
    });
    /* The heading belongs to the section, not to the row of cards, so hiding
       the cards alone leaves a "Cameras:" label standing over nothing. */
    section.classList.toggle(DZ_CAMERA_HIDDEN, shown === 0);
}

function dzWireDashboardSearch() {
    $(document).on("keyup change", "#searchInput", function () {
        var value = this.value;
        /* Always, on every surface: the camera section only exists on the
           classic dashboard and dzFilterCameras is a no-op everywhere else,
           and the clear path below must reach it as well as the query path. */
        dzFilterCameras(value);
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
        dzApplyDeviceFilter(dzDashboardSearchPredicate(value));
    });
}
