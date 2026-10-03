/* The navbar search box. Domoticz owns the matching: core's WatchLiveSearch
   binds with $('.jsLiveSearch'), a class selector, and its controllers drive
   that class after every re-render (RefreshLiveSearch in LightsController,
   UtilityController, ScenesController, TemperatureController). Carrying the
   class is therefore enough to get core's multi-term matching over its own
   data-search attribute, its result count, and its restore across navigation.

   This box exists because core hides its own on the Dashboard; the theme
   offers search on every page. The dashboard surfaces core's engine cannot
   see are handled by src/js/device-filter.js. */

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

    /* Same hazard as syncLiveSearchSiblings above, on the same element: a
       jQuery-bound handler here would be stripped by WatchLiveSearch's
       argument-less .off() moments after being attached, silently killing
       Enter and Escape. Native addEventListener survives it. The dispatch in
       clearSearch re-enters this handler with no key at all, which matches
       neither branch, so there is no recursion to guard against. */
    input.addEventListener("keyup", function (event) {
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

    /* Core calls WatchLiveSearch once at app.js boot, before this box exists,
       so bind it again now that it does. The call is .off().on(), so binding
       twice is safe. */
    if (typeof WatchLiveSearch === "function") {
        WatchLiveSearch();
    }
}
