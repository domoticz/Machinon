/* The navbar search box. Domoticz owns the matching: core's WatchLiveSearch
   binds with $('.jsLiveSearch'), a class selector, and its controllers drive
   that class after every re-render (RefreshLiveSearch in LightsController,
   UtilityController, ScenesController, TemperatureController). Carrying the
   class is therefore enough to get core's multi-term matching over its own
   data-search attribute, its result count, and its restore across navigation.

   This box exists because core hides its own on the Dashboard; the theme
   offers search on every page. The dashboard surfaces core's engine cannot
   see are handled by src/js/device-filter.js. */

/* The box's own clear (set by setSearch): one dispatched keyup+change that every
   engine hears, which the empty-state button below reuses. */
var dzSearchClear = null;

/* "No devices on this page match ..." with a Clear button, shown in the page
   itself whenever a query is active, the route is searchable and no card is
   left visible. Without it the only trace of the filter was the count beside
   the box, and a query that followed the user to the next page (core restores
   LastSearchFilter on every route) left that page blank for no visible reason.

   It counts what is painted rather than asking each engine: three engines filter
   (core's WatchLiveSearch, Angular on the classic dashboard, device-filter.js on
   Dash2), and all of them hide cards one way or another. Cameras count, so a
   query matching only a camera is not "no match". Lives inside the routed page's
   content container, so a route change takes it away with the page it
   described. */
function dzSearchEmptyUpdate() {
    var input = document.getElementById("searchInput");
    var search = document.getElementById("search");
    var query = input ? input.value.trim() : "";
    var existing = document.getElementById("dz-search-empty");
    /* Core's own result count, written by whichever engine just filtered this
       page. Required to read 0 as well as no card being painted: between a route
       change and the restore that re-applies the query, the new page's cards can
       be absent or not yet filtered, and judging by the painted cards alone
       flashed "no match" over a page the query does match (measured: three 50ms
       samples on Utility). The count still holds the previous page's number
       until the restore lands, so it cannot claim zero early. */
    var countEl = search ? search.querySelector(".jsTbResultsCount") : null;
    var counted = countEl ? parseInt(countEl.textContent.replace(/\s/g, ""), 10) : NaN;
    var empty = false;
    if (query && counted === 0 && search && !search.classList.contains("readonly")) {
        empty = true;
        var cards = document.querySelectorAll("#main-view .itemBlock, #main-view #dashCameras .movable");
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].getClientRects().length) { empty = false; break; }
        }
    }
    /* The page's content container, not merely the first child: several pages
       park hidden dialogs and log panels (#dialog-renameselectorlevel,
       #percentagelog, ...) ahead of or beside it. devices.js swaps its class
       .container -> .container-fluid after render, so accept either. */
    var view = document.querySelector("#main-view > .container-fluid, #main-view > .container");
    if (!empty || !view) {
        if (existing) existing.parentNode.removeChild(existing);
        return;
    }
    if (!existing || existing.parentNode !== view) {
        if (existing) existing.parentNode.removeChild(existing);
        existing = document.createElement("div");
        existing.id = "dz-search-empty";
        existing.setAttribute("role", "status");
        var text = document.createElement("span");
        text.className = "dz-search-empty-text";
        existing.appendChild(text);
        var clear = document.createElement("button");
        clear.type = "button";
        clear.className = "btn btn-default dz-search-empty-clear";
        clear.textContent = dzT("header.clear_search");
        clear.addEventListener("click", function () { if (dzSearchClear) dzSearchClear(); });
        existing.appendChild(clear);
        view.insertBefore(existing, view.firstChild);
    }
    /* textContent: the query is whatever the user typed. */
    existing.querySelector(".dz-search-empty-text").textContent = dzT("header.search_no_match", { query: query });
}

/* Coalesced, keep-first: a keystroke, the count repaint it causes and the
   DOM-settled flush all ask within a few ms, and one run after the engines have
   painted answers all of them. Never re-armed by a later request, so a stream of
   them cannot postpone it forever. */
var dzSearchEmptyTimer = null;
function dzSearchEmptySchedule() {
    if (dzSearchEmptyTimer !== null) return;
    dzSearchEmptyTimer = setTimeout(function () {
        dzSearchEmptyTimer = null;
        dzSearchEmptyUpdate();
    }, 60);
}

function setSearch() {
    var search = document.createElement("div");
    search.id = "search";

    /* Core's own count and clear affordances, keyed by the classes its
       _tbDisplayResults drives ($('.jsTbSearch') / $('.jsTbResults') /
       $('.jsTbResultsCount'), all class selectors). Placing them here means
       the count renders next to THIS box rather than in core's topbar, which
       the theme does not use. */
    var icon = document.createElement("i");
    icon.className = "ion-md-search jsTbSearch";

    var results = document.createElement("span");
    results.className = "tbIcon jsTbResults dz-search-results";
    results.title = dzT("header.clear_search");
    var clear = document.createElement("i");
    clear.className = "ion-md-close jsTbResultsClose";
    var count = document.createElement("span");
    count.className = "tbResultsCount jsTbResultsCount";
    results.appendChild(clear);
    results.appendChild(count);

    var input = document.createElement("input");
    input.type = "text";
    input.id = "searchInput";
    /* The class IS the adoption: core binds every element carrying it. */
    input.className = "jsLiveSearch";
    input.autocomplete = "off";
    input.placeholder = dzT("header.search_placeholder");
    input.title = dzT("header.type_to_search");

    /* The input and the affordances that act on it are one box, not three
       siblings. On a phone the collapsed box expands into a pill positioned
       below the header, and css/search.css makes that pill by translating this
       wrapper: as its children the count and the clear glyph ride inside the
       pill for free. Positioned as siblings of a transformed input they could
       not follow it at all, and the only CSS-only alternative is to repeat the
       same translate on the affordance group and keep the two values in
       lockstep by hand forever. */
    var field = document.createElement("div");
    field.className = "dz-search-field";
    field.appendChild(input);
    field.appendChild(icon);
    field.appendChild(results);
    search.appendChild(field);

    var logo = document.querySelector(".container-logo");
    if (logo) { logo.appendChild(search); }

    /* On core pages our box is the SECOND .jsLiveSearch: core's topbar
       carries one too. RefreshLiveSearch triggers change on all of them and
       each handler reads its own value, so an empty sibling would clear the
       filter depending on iteration order. Keeping them equal makes the
       outcome order-independent.

       Native addEventListener, not jQuery's .on(): core calls WatchLiveSearch
       again on every route that owns a search box (ScenesController, app.js,
       and inc_topbar.html's inline script on every topbar include), and each
       call does $('.jsLiveSearch').off() with no arguments, which strips
       every jQuery-bound handler on elements carrying the class, no matter
       when it was bound. A native listener is invisible to that .off() and
       survives every later re-render. Bound to keyup and change, matching
       what WatchLiveSearch itself listens for and what real typing plus the
       test harness's dispatchEvent calls actually fire. */
    function syncLiveSearchSiblings() {
        var v = this.value;
        $(".jsLiveSearch").not(this).each(function () { this.value = v; });
    }
    input.addEventListener("keyup", syncLiveSearchSiblings);
    input.addEventListener("change", syncLiveSearchSiblings);

    /* On a route with nothing to search the browser's own find is the better
       answer to F3 / Ctrl+F, so the shortcut is only taken where the box works. */
    window.addEventListener("keydown", function (e) {
        if ((e.key === "F3" || (e.ctrlKey && (e.key === "f" || e.key === "F"))) && !search.classList.contains("readonly")) {
            input.focus();
            e.preventDefault();
        }
    });
    search.addEventListener("click", function () {
        input.focus();
    });
    /* A tap cannot rely on the click above. On a phone, touchstart puts #search
       in :hover/:active, css/search.css then moves the field into the fixed pill
       below the header, and the click the browser synthesizes afterwards is
       hit-tested at the finger's position, where the icon no longer is: it lands
       on .container-logo and the input never gets focus, so the user has to tap
       a second time inside the pill. touchend still targets the element the
       touch started on, so focusing there works, and it counts as a user gesture,
       which mobile browsers require before raising the keyboard. preventDefault
       drops the stray synthesized click.

       The count that replaces the magnifier while a query is active has the
       same problem, and its click listener below never fires on a tap either.
       Collapsed, a tap on it opens the pill with the query in place, so the
       user can refine it or reach the clear glyph; inside the open pill nothing
       moves, but the synthesized mousedown would blur the input and collapse
       the pill before the click, so a tap on the glyph clears here and keeps
       the field focused for the next query. Taps on the input itself are left
       to the browser for native caret placement. */
    search.addEventListener("touchend", function (e) {
        if (e.target === input) { return; }
        e.preventDefault();
        if (e.target.closest(".jsTbResults") && document.activeElement === input) {
            clearSearch();
        }
        input.focus();
    });
    /* Domoticz runs TWO matching engines off this one input, and clearing it has
       to reach both. WatchLiveSearch (js/domoticz.js) binds with jQuery and
       filters every page core owns. The classic dashboard is filtered instead by
       Angular, through filterDevices, fed by NATIVE capture-phase listeners that
       DashboardDesktopController registers on document. A jQuery .trigger() only
       walks jQuery's own handler queues and dispatches nothing to the DOM, so it
       is the one path that cannot reach the capture listeners: clearing that way
       empties the box while the classic dashboard stays filtered, with no way
       back short of typing and deleting a character.

       A real dispatched event reaches all three consumers in one go: core's
       jQuery handler (jQuery binds through addEventListener), core's capture
       listeners, and the theme's own delegated handler in src/js/device-filter.js.
       It also re-enters the native listeners on this input, syncLiveSearchSiblings
       included, so the siblings need no separate call. bubbles is required for the
       delegated handler; the capture listeners would fire either way. */
    function clearSearch() {
        input.value = "";
        input.dispatchEvent(new Event("keyup", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    dzSearchClear = clearSearch;

    /* Same hazard as syncLiveSearchSiblings above, on the same element: a
       jQuery-bound handler here would be stripped by WatchLiveSearch's
       argument-less .off() moments after being attached, silently killing
       Enter and Escape. Native addEventListener survives it. The dispatch in
       clearSearch re-enters this handler with no key at all, which matches
       neither branch, so there is no recursion to guard against. */
    /* Every engine above filters on keyup or change, so text that arrives
       without a key (context-menu paste, drag and drop, dictation, autocomplete,
       spellcheck replacement) filtered only once the box lost focus. Such an
       input event has no key held down, so it gets the same real dispatched
       keyup the clear uses. Keyed off "no keydown in flight" rather than a list
       of inputTypes: dictation reports a plain insertText on some platforms, and
       a typed key must not filter twice. Blur resets the flag in case focus left
       between keydown and keyup. */
    var keyDown = false;
    input.addEventListener("keydown", function () { keyDown = true; });
    input.addEventListener("blur", function () { keyDown = false; });
    input.addEventListener("input", function () {
        if (!keyDown) {
            input.dispatchEvent(new Event("keyup", { bubbles: true }));
        }
    });

    input.addEventListener("keyup", function (event) {
        keyDown = false;
        if (event.key === "Enter") {
            input.blur();
        }
        if (event.key === "Escape") {
            clearSearch();
        }
    });

    /* The clear glyph needs its own native listener for the same reason: core
       binds one on .jsTbResultsClose,.jsTbResults, but it clears with
       $('.jsLiveSearch').val('').trigger('change'), the jQuery-simulated path
       that never reaches the classic dashboard's capture listeners. Core's
       binding cannot be corrected from here, so the theme adds the real
       dispatch alongside it; clearing an already-empty box twice is inert.
       Native again, because WatchLiveSearch calls .off() with no arguments on
       these elements too. Bound on the wrapper so a click on the glyph inside
       it counts. */
    results.addEventListener("click", clearSearch);

    /* Re-evaluate the empty state after every filter run. Typing reaches these
       native listeners; core's restore on arrival does not (it uses jQuery's
       .trigger, which dispatches nothing to the DOM, and hides cards with inline
       styles the device observer ignores), but every engine repaints the count
       when it finishes, so that repaint is the one signal they all share. The
       settled flush covers re-renders that change the cards themselves. */
    input.addEventListener("keyup", dzSearchEmptySchedule);
    input.addEventListener("change", dzSearchEmptySchedule);
    new MutationObserver(dzSearchEmptySchedule).observe(count, { childList: true, characterData: true, subtree: true });
    if (typeof dzOnDomSettled === "function") { dzOnDomSettled(dzSearchEmptySchedule); }
    window.addEventListener("hashchange", dzSearchEmptySchedule);

    /* Core calls WatchLiveSearch once at app.js boot, before this box exists,
       so bind it again now that it does. The call is .off().on(), so binding
       twice is safe. */
    if (typeof WatchLiveSearch === "function") {
        WatchLiveSearch();
    }
}
