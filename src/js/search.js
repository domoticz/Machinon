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

    search.appendChild(input);
    search.appendChild(icon);
    search.appendChild(results);

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

    window.addEventListener("keydown", function (e) {
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
            $("#searchInput").focus();
            e.preventDefault();
        }
    });
    $("#search").click(function () {
        $("#searchInput").focus();
    });
    $("#searchInput").keyup(function (event) {
        if (event.keyCode === 13) {
            $("#searchInput").blur();
        }
        if (event.keyCode === 27) {
            $("#searchInput").val("").trigger("change");
        }
    });

    /* Core calls WatchLiveSearch once at app.js boot, before this box exists,
       so bind it again now that it does. The call is .off().on(), so binding
       twice is safe. */
    if (typeof WatchLiveSearch === "function") {
        WatchLiveSearch();
    }
}
