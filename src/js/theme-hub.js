/* Theme hub pseudo-route + page shell.

   WHY a pseudo-route: the theme cannot register an Angular route (core owns
   app.routes.js, and any unknown hash falls through to `.otherwise` ->
   redirectTo:'/Dashboard', app/app.routes.js:324). So the hub follows the
   js/custom_page.js technique: inject ONE <li> into core's Setup menu ul and,
   on click, HIDE core's routed content (#main-view, the ng-view container at
   index.html:1373) and SHOW the theme's own #dz-theme-hub, then restore core's
   content when the route changes. The hub container is a SIBLING of #main-view,
   never a child: Angular re-renders ng-view on every digest and would wipe any
   content placed inside it (the same way it wiped the injected Setup tabs), but
   it never touches DOM outside its own view, so a sibling survives.

   The single menu insertion feeds BOTH surfaces at once: it shows in the Setup
   dropdown AND, because js/settings_page.js builds its tile grid from the very
   same ul at click time, as a tile in the custom_settings_menu grid. No second
   registration. The tile's icon is wired in settings_page.js (LABEL_ICONS,
   keyed by the entry's data-i18n label, since this entry has no href to key on).

   FAIL CLOSED (card-enhancement rule): if the Setup menu ul is not present, log
   a structured warning and add NO entry, never a broken one. */

var DZ_HUB_ID = "dz-theme-hub";
var DZ_HUB_MENU_ID = "dzThemeHubMenu";
var DZ_HUB_LABEL = "Theme"; // data-i18n key; settings_page.js LABEL_ICONS keys the tile on this
var dzHubActiveGroup = null;

/* True once the hub DOM exists (built lazily on first open). */
function dzThemeHubMounted() {
    return !!document.getElementById(DZ_HUB_ID);
}

/* Insert the single Setup-menu <li> that opens the hub. Idempotent (re-arm safe)
   and fail-closed: no ul -> structured warning, no entry. Mirrors
   js/custom_page.js: an <a class="lcursor"> with NO href (so clicking it never
   changes the hash and Angular never routes/redirects), an <img> icon, and a
   <span> label. settings_page.js harvests this li (anchor + onclick) into a
   grid tile automatically. */
function dzInsertHubMenuEntry() {
    var ul = document.querySelector("#appnavbar li[has-permission='Admin'] > ul");
    if (!ul) {
        console.warn("machinon_theme_hub", "setup_menu_ul_absent", "no #appnavbar Admin ul; hub entry not added (fail closed)");
        return;
    }
    if (document.getElementById(DZ_HUB_MENU_ID)) return;

    var li = document.createElement("li");
    li.id = DZ_HUB_MENU_ID;
    // onclick (attribute, not just a bound handler) so settings_page.js harvestMenu
    // copies it verbatim onto the grid tile; the tile then opens the hub too.
    var a = document.createElement("a");
    a.className = "lcursor";
    a.setAttribute("onclick", "dzOpenThemeHub()");
    var img = document.createElement("img");
    img.src = "images/settings/paint-palette.png";
    var span = document.createElement("span");
    span.setAttribute("data-i18n", DZ_HUB_LABEL);
    span.textContent = DZ_HUB_LABEL;
    a.appendChild(img);
    a.appendChild(document.createTextNode(" "));
    a.appendChild(span);
    li.appendChild(a);

    // Position the entry next to core's "Settings" item (index.html:1301,
    // li#mSetup / a[href="#Setup"] / span[data-i18n="Settings"]). FAIL CLOSED: if
    // the Settings item cannot be matched (core markup drift), add NO entry, so a
    // wrongly-placed hub entry never appears. settings_page.js builds the tile
    // grid from this same ul in DOM order, so the tile lands next to Settings too.
    var settingsLi = null;
    var settingsAnchor = ul.querySelector("a[href='#Setup'], a[href='#Settings'], a > span[data-i18n='Settings']");
    if (settingsAnchor) settingsLi = settingsAnchor.closest("li");
    if (!settingsLi || settingsLi.parentNode !== ul) {
        console.warn("machinon_theme_hub", "settings_item_absent", "no Settings menu item to anchor to; hub entry not added (fail closed)");
        return;
    }
    settingsLi.insertAdjacentElement("afterend", li);
}

/* Build the hub shell from THEME_MANIFEST: an underlined-tab bar (one tab per
   group) and a panel holding one empty .dz-hub-section[data-group] per group (rows arrive in
   task 3). Appended after #main-view inside .bannercontent so it is a sibling of
   the ng-view, hidden until opened. Returns the container, or null if the mount
   point or the manifest is missing (fail closed). */
function dzBuildThemeHub() {
    if (dzThemeHubMounted()) return document.getElementById(DZ_HUB_ID);
    if (typeof THEME_MANIFEST === "undefined" || !THEME_MANIFEST.length) {
        console.warn("machinon_theme_hub", "manifest_absent", "THEME_MANIFEST missing; hub not built (fail closed)");
        return null;
    }
    var mainView = document.getElementById("main-view");
    if (!mainView || !mainView.parentNode) {
        console.warn("machinon_theme_hub", "main_view_absent", "no #main-view mount point; hub not built (fail closed)");
        return null;
    }

    var container = document.createElement("div");
    container.id = DZ_HUB_ID;
    container.style.display = "none";

    var tabs = document.createElement("div");
    tabs.className = "dz-hub-tabs";
    tabs.setAttribute("role", "tablist");

    var panel = document.createElement("div");
    panel.className = "dz-hub-panel";

    THEME_MANIFEST.forEach(function (group, i) {
        var item = document.createElement("button");
        item.type = "button";
        item.className = "dz-hub-tab";
        item.setAttribute("data-group", group.id);
        item.setAttribute("role", "tab");
        item.textContent = group.label;
        item.addEventListener("click", function () { dzHubShowGroup(group.id); });
        tabs.appendChild(item);

        var section = document.createElement("section");
        section.className = "dz-hub-section";
        section.setAttribute("data-group", group.id);
        // Section heading; rows (task 3) render below it. Empty shell for now.
        var h = document.createElement("h2");
        h.className = "dz-hub-section-title";
        h.textContent = group.label;
        section.appendChild(h);
        panel.appendChild(section);

        if (i === 0) dzHubActiveGroup = group.id;
    });

    container.appendChild(tabs);
    container.appendChild(panel);
    mainView.parentNode.insertBefore(container, mainView.nextSibling);

    dzHubShowGroup(dzHubActiveGroup); // default to the first group
    return container;
}

/* Show one group's section, hide the rest, mark its tab active. One group
   visible at a time (the underlined-tab bar behaves the same on desktop and
   mobile). */
function dzHubShowGroup(groupId) {
    var hub = document.getElementById(DZ_HUB_ID);
    if (!hub) return;
    dzHubActiveGroup = groupId;
    hub.querySelectorAll(".dz-hub-section").forEach(function (s) {
        s.style.display = s.getAttribute("data-group") === groupId ? "" : "none";
    });
    hub.querySelectorAll(".dz-hub-tab").forEach(function (it) {
        var on = it.getAttribute("data-group") === groupId;
        it.classList.toggle("is-active", on);
        it.setAttribute("aria-selected", on ? "true" : "false");
    });
}

/* Open the hub: build it if needed, hide core's ng-view content, show the hub,
   and arm a one-time hashchange handler that restores core content when the user
   navigates away (so the hub is a pseudo-page, not a permanent hijack).
   addEventListener is used, not window.onhashchange, so page.js's
   locationHashChanged handler (set in custom.js init_theme) is left intact. */
function dzOpenThemeHub() {
    var hub = dzBuildThemeHub();
    var mainView = document.getElementById("main-view");
    if (!hub || !mainView) return; // dzBuildThemeHub already warned
    mainView.style.display = "none";
    hub.style.display = "";
    window.addEventListener("hashchange", dzCloseThemeHubOnLeave);
    // Close the mobile side menu if it is open (mirrors custom_page.js).
    if (window.jQuery) jQuery(".navbar-inner").removeClass("slide");
}

/* Restore core's routed content and hide the hub; unbinds itself so it only
   fires once per open. */
function dzCloseThemeHubOnLeave() {
    window.removeEventListener("hashchange", dzCloseThemeHubOnLeave);
    var hub = document.getElementById(DZ_HUB_ID);
    var mainView = document.getElementById("main-view");
    if (mainView) mainView.style.display = "";
    if (hub) hub.style.display = "none";
}

/* Wire the menu entry once the navbar has rendered. whenElementRenders (page.js)
   runs the callback immediately if the ul is already present, or when it renders,
   with no long-lived polling. */
(function dzThemeHubInit() {
    if (typeof whenElementRenders === "function") {
        whenElementRenders("dzThemeHubMenu", "#appnavbar li[has-permission='Admin'] > ul", dzInsertHubMenuEntry);
    } else {
        // page.js not loaded yet in some ordering; try on DOM ready as a fallback.
        if (window.jQuery) jQuery(dzInsertHubMenuEntry);
    }
})();
