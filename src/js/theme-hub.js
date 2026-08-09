/* Theme hub page shell: the routed page behind #/Theme, with the original click
   pseudo-route kept as its fallback.

   ROUTED (window.dzRoutesActive; route table at the top of custom.js): the hub
   is built into the host div of the routed template templates/dz-theme-hub.html,
   so it lives INSIDE core's ng-view, which is legitimate because the route owns
   the view. ngView destroys that host when the route is left, so every entry
   rebuilds the hub, exactly as any real page does. #/Theme/:tab deep-links a
   group (dzMountThemeHubIn).

   FALLBACK (custom.js could not reach $routeProvider and failed closed): the
   original js/custom_page.js technique: on the menu click, HIDE core's routed
   content (#main-view, the ng-view container at index.html:1373) and SHOW the
   theme's own #dz-theme-hub, then restore core's content when the route
   changes. In this mode the hub container must be a SIBLING of #main-view,
   never a child: Angular re-renders ng-view and would wipe any content placed
   inside it (the same way it wiped the injected Setup tabs), but it never
   touches DOM outside its own view, so a sibling survives.

   TWO menu insertions feed the hub: the Setup-dropdown entry (admin-only,
   li[has-permission='Admin']) and the Other-dropdown entry (logged-in
   non-admin, li[has-login-no-admin]) -- core hides each dropdown for the
   sessions that should not see it (zero theme code, the directives in
   app.permissions.js), so between the two every session that can reach the
   hub gets exactly one visible way in. The Setup entry ALSO feeds the tile
   grid: js/settings_page.js builds custom_settings_menu from the very same
   ul at click time, so no second registration is needed there. The tile's
   icon is wired in settings_page.js (LABEL_ICONS, keyed by the entry's
   data-i18n label, since the tile-builder's normal href-keyed icon lookup is
   bypassed for this entry -- see the onclick-precedence note in
   settings_page.js buildTile).

   ENTRY LINK POLICY (Task 6/9 review, binding): both entries carry
   href="#/Theme" UNCONDITIONALLY, set at insertion time, plus the onclick
   attribute calling dzOpenThemeHub() (unchanged: the one open path, kept for
   settings_page.js to harvest onto the tile verbatim). A click listener
   preventDefaults the href ONLY when window.dzRoutesActive is false: with
   real routes the href is left to navigate normally, so the entry behaves
   like a real link (middle-click, copy link address, ctrl-click all work)
   and converges with dzOpenThemeHub()'s own location.hash write; without
   routes there is no #/Theme route to land the href on (core's .otherwise
   would redirect to Dashboard), so the href is blocked there and
   dzOpenThemeHub() alone builds the fallback hub.

   FAIL CLOSED (card-enhancement rule): if either target ul is not present,
   log a structured warning and add NO entry for it, never a broken one. */

var DZ_HUB_ID = "dz-theme-hub";
var DZ_HUB_MENU_ID = "dzThemeHubMenu";
var DZ_HUB_MENU_OTHER_ID = "dzThemeHubMenuOther";
var DZ_HUB_LABEL = "Theme"; // data-i18n key; settings_page.js LABEL_ICONS keys the tile on this
var dzHubActiveGroup = null;

/* Shared <li> builder for both hub menu entries: identical anchor markup
   (icon, label, href, onclick), differing only in id. See the ENTRY LINK
   POLICY note above for the href/onclick/preventDefault contract. Mirrors
   js/custom_page.js: an <a class="lcursor">, an <img> icon, and a <span>
   label. settings_page.js harvests the Setup entry's anchor (href + onclick)
   into a grid tile automatically. */
function dzBuildHubMenuLi(id) {
    var li = document.createElement("li");
    li.id = id;
    var a = document.createElement("a");
    a.className = "lcursor";
    a.setAttribute("href", "#/Theme");
    // onclick (attribute, not just a bound handler) so settings_page.js harvestMenu
    // copies it verbatim onto the grid tile; the tile then opens the hub too.
    a.setAttribute("onclick", "dzOpenThemeHub()");
    a.addEventListener("click", function (event) {
        if (!window.dzRoutesActive) event.preventDefault();
    });
    var img = document.createElement("img");
    img.src = "images/settings/paint-palette.png";
    var span = document.createElement("span");
    span.setAttribute("data-i18n", DZ_HUB_LABEL);
    span.textContent = DZ_HUB_LABEL;
    a.appendChild(img);
    a.appendChild(document.createTextNode(" "));
    a.appendChild(span);
    li.appendChild(a);
    return li;
}

/* Insert the Setup-dropdown <li> that opens the hub. Idempotent (re-arm safe)
   and fail-closed: no ul -> structured warning, no entry. */
function dzInsertHubMenuEntry() {
    var ul = document.querySelector("#appnavbar li[has-permission='Admin'] > ul");
    if (!ul) {
        console.warn("machinon_theme_hub", "setup_menu_ul_absent", "no #appnavbar Admin ul; hub entry not added (fail closed)");
        return;
    }
    if (document.getElementById(DZ_HUB_MENU_ID)) return;

    var li = dzBuildHubMenuLi(DZ_HUB_MENU_ID);

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
    dzHubSyncMenuActive();
}

/* Insert the Other-dropdown <li> that opens the hub, for logged-in
   non-admin users (core's has-login-no-admin directive, app.permissions.js,
   hides the whole dropdown for admin and no-login sessions with zero theme
   code, so this entry is admin-invisible for free). Idempotent and
   fail-closed like dzInsertHubMenuEntry.

   Anchor ONLY on the [has-login-no-admin] container, never on a child id:
   core repeats #mProfile/#dLogoutSetup/#mLogoutSetup verbatim inside BOTH
   this ul and the Setup ul (index.html), so a child-id selector run against
   `document` would silently match whichever menu happens to come first,
   not necessarily this one. `ul.querySelector` below is scoped to this ul's
   own subtree, so the duplicate ids elsewhere in the document cannot leak
   in. */
function dzInsertHubMenuEntryOther() {
    var ul = document.querySelector("#appnavbar li[has-login-no-admin] > ul");
    if (!ul) {
        console.warn("machinon_theme_hub", "other_menu_ul_absent", "no #appnavbar has-login-no-admin ul; hub entry not added (fail closed)");
        return;
    }
    if (document.getElementById(DZ_HUB_MENU_OTHER_ID)) return;

    var li = dzBuildHubMenuLi(DZ_HUB_MENU_OTHER_ID);

    // Sit above the logout divider when present; append otherwise (no fail
    // closed here, the divider is a placement nicety, not a correctness
    // requirement the way the Setup entry's Settings anchor is).
    var logoutDivider = ul.querySelector("#dLogoutSetup");
    if (logoutDivider && logoutDivider.parentNode === ul) {
        ul.insertBefore(li, logoutDivider);
    } else {
        ul.appendChild(li);
    }
    dzHubSyncMenuActive();
}

/* Neither entry has an ng-class of its own: they are injected after core
   compiled the navbar, so mirror core's
   ng-class="{'current_page_item':getClass('/Theme')}" by hand on both while
   the hub route is open. Same prefix test core's getClass uses, so
   #/Theme/colors highlights the entries too. No-op without routes, where the
   hub has no hash to key on. */
function dzHubSyncMenuActive() {
    if (!window.dzRoutesActive) return;
    var onHub = location.hash.indexOf("#/Theme") === 0;
    [DZ_HUB_MENU_ID, DZ_HUB_MENU_OTHER_ID].forEach(function (id) {
        var li = document.getElementById(id);
        if (li) li.classList.toggle("current_page_item", onHub);
    });
}

/* Build the hub shell from THEME_MANIFEST: an underlined-tab bar (one tab per
   group) and a panel holding one .dz-hub-section[data-group] per group.

   `routeHost` is the host element of the routed template (dzMountThemeHubIn):
   the hub is appended into it and shown straight away, because the route is
   already the page. Without it (fallback pseudo-route) the hub is inserted
   after #main-view inside .bannercontent, as a hidden sibling of the ng-view.
   Returns the container, or null if the mount point or the manifest is missing
   (fail closed). */
function dzBuildThemeHub(routeHost) {
    var built = document.getElementById(DZ_HUB_ID);
    if (built) return routeHost ? dzAdoptHubInto(built, routeHost) : built;
    if (typeof THEME_MANIFEST === "undefined" || !THEME_MANIFEST.length) {
        console.warn("machinon_theme_hub", "manifest_absent", "THEME_MANIFEST missing; hub not built (fail closed)");
        return null;
    }
    var mainView = document.getElementById("main-view");
    if (!routeHost && (!mainView || !mainView.parentNode)) {
        console.warn("machinon_theme_hub", "main_view_absent", "no #main-view mount point; hub not built (fail closed)");
        return null;
    }

    var container = document.createElement("div");
    container.id = DZ_HUB_ID;
    if (!routeHost) container.style.display = "none";

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
        var h = document.createElement("h2");
        h.className = "dz-hub-section-title";
        h.textContent = group.label;
        section.appendChild(h);
        // General tab carries a SHORT about intro (owner, hub-completion
        // 2026-07-20); the full About is its own tab (the "about" group below).
        if (group.id === "general") { section.appendChild(dzBuildShortAbout()); }
        dzRenderGroupRows(section, group); // task 3: fill the section with setting rows
        panel.appendChild(section);

        if (i === 0) dzHubActiveGroup = group.id;
    });

    container.appendChild(tabs);
    container.appendChild(panel);

    // The About used to be a persistent footer under every tab; it is now the
    // last tab (the manifest "about" group, hosted by dzHubAboutMount), plus a
    // short intro on the General tab. No footer append here anymore.

    if (routeHost) routeHost.appendChild(container);
    else mainView.parentNode.insertBefore(container, mainView.nextSibling);

    // schemes.js renderSchemePicker() resolves its containers with
    // getElementById, which only finds nodes attached to the live document;
    // the colors section's picker mount (dzHubSchemeMount, registered via
    // registerSchemePickerContainer) exists only as a detached DOM node until
    // the attach above runs, so the first real render happens here, once.
    if (typeof renderSchemePicker === "function") { renderSchemePicker(); }

    // iconpack.js mountIconPackInHub() loads iconsettings.html into the
    // iconpacks section's #iconpack container (dzHubIconPacksMount below) and
    // wires it via initIconPack; same live-document requirement as the scheme
    // picker above, so it also runs here, once, right after attach.
    if (typeof mountIconPackInHub === "function") { mountIconPackInHub(); }

    dzHubShowGroup(dzHubActiveGroup); // default to the first group
    return container;
}

/* Fixed dom id for the About footer (the harness dz-hub-about.js keys on it). */
var DZ_HUB_ABOUT_ID = "dz-hub-about";

/* The theme's live version string (the beta build appends the branch name),
   carried over from the deleted legacy Theme tab's version label. `theme` is
   the loaded theme.json (settings-store.js), so the version is ALWAYS live
   from theme.json, never a hardcoded copy. */
function dzHubVersionLabel() {
    var v = (typeof theme !== "undefined" && theme && theme.version) ? theme.version : "";
    if (typeof branch !== "undefined" && branch === "beta") return v + " " + branch;
    return v;
}

/* Build the About content: name + live version, an accurate one-paragraph
   description LEADING WITH what makes Machinon unique (owner, 2026-07-20
   rework) rather than generic "responsive theme" phrasing, the maintainer
   credits, the existing repo/wiki links (from theme.homepage/theme.wiki), and
   the Icons8 free-tier attribution the theme is obliged to show ("Icons by
   Icons8" linking icons8.com; confirmed against Icons8's current freebie
   terms 2026-07-20, intercom.help/icons8 "How to use the Icons8 freebie": a
   visible, clickable "Icons by Icons8" -> https://icons8.com/).

   The description order is deliberate: the icon-pack INSTALLER first (it
   writes packs straight into the Domoticz device database, so a pack is
   usable from every device's own icon picker, not just this theme's cards;
   the installer's tabs, css/iconpack.css, are its UI, not the headline), then
   this live settings hub (instant apply, live previews), then the scheme
   system (light/dark schemes plus custom colours with WCAG contrast
   checking), with the responsive/mobile-viewport work last as supporting
   detail rather than the opening line.

   FAIL CLOSED: if the theme object is not loaded yet (no theme.version to show),
   return null and let the hub render without the About footer, rather than an
   empty or half-populated box. Type on --dz-text-* tokens (css/theme-hub.css). */
function dzBuildHubAbout() {
    if (typeof theme === "undefined" || !theme || !theme.version) {
        console.warn("machinon_theme_hub", "about_theme_absent", "theme.json not loaded; About footer omitted (fail closed)");
        return null;
    }

    var about = document.createElement("section");
    about.id = DZ_HUB_ABOUT_ID;
    about.className = "dz-hub-about";
    about.setAttribute("aria-label", "About this theme");

    var title = document.createElement("h2");
    title.className = "dz-hub-about-title";
    // Matches the legacy "Machinon theme V.<version>" heading of the deleted
    // Theme tab, version live from theme.json via dzHubVersionLabel.
    title.textContent = "Machinon theme V." + dzHubVersionLabel();
    about.appendChild(title);

    var desc = document.createElement("p");
    desc.className = "dz-hub-about-desc";
    desc.textContent = "Machinon ships a built-in icon pack installer that writes packs "
        + "straight into the Domoticz device database, so every installed pack is "
        + "available from any device's own icon picker, not just this theme's cards. "
        + "This settings hub applies every change live with instant previews, offers "
        + "light and dark color schemes plus a custom palette with automatic contrast "
        + "checking, and the theme itself is fully responsive with a mobile layout "
        + "that fits phone viewports.";
    about.appendChild(desc);

    // Contributions / credits, restored verbatim from the published
    // attribution the deleted legacy Theme tab carried (themesettings.html
    // "Contributions" section): a Design line and a Code line, every name
    // linked to its GitHub profile, none highlighted over the others. These are
    // already-published open-source credits (public attribution, not PII), so
    // they are reproduced exactly as they appeared. Kept as data so the markup
    // is built by DOM API, never string-concatenated HTML (no injection
    // surface, same rule the rest of the hub follows). */
    var credits = document.createElement("div");
    credits.className = "dz-hub-about-credits";
    var creditsHeading = document.createElement("h3");
    creditsHeading.className = "dz-hub-about-credits-title";
    creditsHeading.textContent = "Contributions";
    credits.appendChild(creditsHeading);
    [
        { role: "Design", people: [["EdddieN", "https://github.com/EdddieN"]] },
        { role: "Code", people: [
            ["davidlb", "https://github.com/davidlb"],
            ["DewGew", "https://github.com/DewGew"],
            ["landaisbenj", "https://github.com/landaisbenj"],
            ["Rouzax", "https://github.com/Rouzax"]
        ] }
    ].forEach(function(group) {
        var line = document.createElement("p");
        line.className = "dz-hub-about-credit-line";
        var label = document.createElement("span");
        label.className = "dz-hub-about-credit-role";
        label.textContent = group.role + ": ";
        line.appendChild(label);
        group.people.forEach(function(person, i) {
            if (i) line.appendChild(document.createTextNode(", "));
            line.appendChild(dzHubExternalLink(person[1], person[0]));
        });
        credits.appendChild(line);
    });
    about.appendChild(credits);

    // Links row: repo + wiki, from theme.json (unchanged this task). Built only
    // for links that actually exist, so a missing theme.homepage/theme.wiki
    // never renders a dead "undefined" anchor.
    var links = document.createElement("p");
    links.className = "dz-hub-about-links";
    if (theme.homepage) links.appendChild(dzHubExternalLink(theme.homepage, "GitHub repository"));
    if (theme.wiki) {
        if (links.childNodes.length) links.appendChild(document.createTextNode(" "));
        links.appendChild(dzHubExternalLink(theme.wiki, "Wiki"));
    }
    if (links.childNodes.length) about.appendChild(links);

    // Icons8 attribution (free-tier licence obligation, not optional polish):
    // a visible, clickable "Icons by Icons8" linking icons8.com.
    var credit = document.createElement("p");
    credit.className = "dz-hub-about-credit";
    credit.appendChild(dzHubExternalLink("https://icons8.com/", "Icons by Icons8"));
    about.appendChild(credit);

    return about;
}

/* One external link: new tab, rel hardened (noopener noreferrer) so a linked
   page can never reach back through window.opener. */
function dzHubExternalLink(href, text) {
    var a = document.createElement("a");
    a.className = "dz-hub-about-link";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = text;
    return a;
}

/* SHORT about for the General tab (owner, hub-completion 2026-07-20): name +
   live version and a one-line description, so the first tab introduces the
   theme without the full credits/links (those live on the About tab). Type on
   --dz-text-* tokens (css/theme-hub.css .dz-hub-short-about). */
function dzBuildShortAbout() {
    var box = document.createElement("div");
    box.id = "dz-hub-short-about";
    box.className = "dz-hub-short-about";

    var title = document.createElement("div");
    title.className = "dz-hub-short-about-title";
    title.textContent = "Machinon theme V." + dzHubVersionLabel();
    box.appendChild(title);

    var desc = document.createElement("p");
    desc.className = "dz-hub-short-about-desc";
    desc.textContent = "A responsive Machinon theme for Domoticz with light and dark "
        + "colour schemes, tabbed icon packs, and a mobile layout. See the About "
        + "tab for details and maintenance.";
    box.appendChild(desc);
    return box;
}

/* The About tab's hosted mount (owner, hub-completion 2026-07-20): the expansive
   About (dzBuildHubAbout: name+version, modern description, repo/wiki links, the
   Icons8 credit) followed by the theme MAINTENANCE actions. Replaces the old
   persistent About footer; dzHubCustomMount dispatches the manifest "about"
   entry here. FAIL OPEN on the About content (dzBuildHubAbout returns null while
   theme.json is not loaded) so the maintenance actions still render. */
function dzHubAboutMount(entry) {
    var mount = document.createElement("div");
    mount.className = "dz-hub-custom-mount";
    mount.setAttribute("data-custom", entry.key);
    var about = dzBuildHubAbout();
    if (about) mount.appendChild(about);
    mount.appendChild(dzBuildMaintenanceBlock());
    return mount;
}

/* Theme maintenance actions (owner placement: bottom of the About tab). These
   are the coverage-gate affordances the old Theme tab exposed and the hub
   lacked: reset to defaults, clear the browser cache, reset custom colours to
   the selected scheme. Each runs behind a confirm (dzHubConfirm). Wired to the
   SAME functions the legacy tab used (resetTheme in settings-store.js; the
   cache clear + getSchemeDefaults reset-colours logic of the old reset dialog
   and reset-colours icon), so this is a UI relocation, not new behaviour. */
function dzBuildMaintenanceBlock() {
    var block = document.createElement("section");
    block.id = "dz-hub-maintenance";
    block.className = "dz-hub-maintenance";
    block.setAttribute("aria-label", "Theme maintenance");

    var title = document.createElement("h3");
    title.className = "dz-hub-maintenance-title";
    title.textContent = "Maintenance";
    block.appendChild(title);

    var note = document.createElement("p");
    note.className = "dz-hub-maintenance-note";
    note.textContent = "Each action asks for confirmation first.";
    block.appendChild(note);

    var actions = document.createElement("div");
    actions.className = "dz-hub-maintenance-actions";
    actions.appendChild(dzHubMaintenanceButton(
        "dz-hub-reset-theme", "Reset theme to defaults",
        "Reset all theme settings to their defaults? This deletes the stored theme settings and reloads the page.",
        dzHubDoResetTheme));
    actions.appendChild(dzHubMaintenanceButton(
        "dz-hub-clear-cache", "Clear cached settings",
        "Clear this browser's cached theme settings and reload? Your settings saved on the server are kept.",
        dzHubDoClearCache));
    actions.appendChild(dzHubMaintenanceButton(
        "dz-hub-reset-colors", "Reset colours to the selected scheme",
        "Reset the custom colours to the selected scheme's default palette?",
        dzHubDoResetColors));

    /* ThemeSettings migration: promote + scoped resets, additive to the three
       actions above (which stay verbatim in every mode) and gated per mode.
       Promote needs BOTH admin (only an admin may write the house layer) AND
       a personal layer to promote FROM (dzSettingsMode().perUser); with no
       per-user storage the session's current settings already ARE the house
       defaults (dzApiSaveSettings writes a single shared layer), so there is
       nothing to promote and the button would be a no-op. House reset needs
       only admin. Personal reset needs only a personal layer to reset. None
       of the three render in legacy mode (!mode.api). */
    var mode = dzSettingsMode();
    if (mode.api) {
        if (mode.admin && mode.perUser) {
            actions.appendChild(dzHubActionButton(
                "dz-hub-promote", "btn btn-primary dz-hub-promote-btn",
                "Save my current preferences as house defaults", dzHubPromote));
        }
        if (mode.perUser) {
            actions.appendChild(dzHubActionButton(
                "dz-hub-reset-mine", "btn btn-danger dz-hub-reset-mine-btn",
                "Reset my personal settings", dzHubResetMine));
        }
        if (mode.admin) {
            actions.appendChild(dzHubActionButton(
                "dz-hub-reset-house", "btn btn-danger dz-hub-reset-house-btn",
                "Reset the house defaults", dzHubResetHouse));
        }
    }
    block.appendChild(actions);
    return block;
}

/* One maintenance button: label + a confirm-gated click. */
function dzHubMaintenanceButton(id, label, confirmMsg, action) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = id;
    btn.className = "btn btn-danger dz-hub-maintenance-btn"; // house Filled-danger family (css/buttons.css); identity class kept for harnesses
    btn.textContent = label;
    btn.addEventListener("click", function () { dzHubConfirm(confirmMsg, action); });
    return btn;
}

/* Same shape as dzHubMaintenanceButton, for an action whose handler already
   gates itself behind a confirm (dzHubPromote/dzHubResetMine/dzHubResetHouse
   below, ThemeSettings migration): a bare click, no second confirm wrapper. */
function dzHubActionButton(id, className, label, onClick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = id;
    btn.className = className;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
}

/* Confirm gate. Uses bootbox (the same confirm library the legacy reset dialog
   used); falls back to window.confirm so a maintenance action is never fired
   without a confirmation. */
function dzHubConfirm(message, onConfirm) {
    if (typeof bootbox !== "undefined" && bootbox.confirm) {
        bootbox.confirm({
            className: "rubberBand animated",
            message: message,
            callback: function (result) { if (result) onConfirm(); }
        });
        return;
    }
    if (window.confirm(message)) { onConfirm(); }
}

/* Reset to defaults ("mode collapse", ThemeSettings migration). Legacy
   transport: settings-store.js resetTheme() deletes the theme uservariables,
   clears the localStorage cache, and reloads (unchanged, kept verbatim).
   Native transport: resetTheme() only ever deletes uservariables that exist,
   and the native path never creates any (checkThemeSettingsAPI's seed step
   only READS the legacy vars once to migrate them; a capable core never
   writes theme-<folder>-* vars itself), so calling resetTheme() alone is a
   silent no-op there -- a "reset to defaults" that leaves the server-stored
   settings untouched. Reset every native row this identity can reach instead
   (house row when admin, personal row when perUser; ThemeSettingsSetDefault/
   Set are gated the same way server-side, WebServerCmds.cpp
   Cmd_ThemeSettingsSetDefault/Set), then clear the cache and reload only once
   every attempted reset actually succeeded (fail closed: a partial failure,
   already warned by dzApiFail, must not also claim a clean reset). */
function dzHubDoResetTheme() {
    var mode = dzSettingsMode();
    if (!mode.api) {
        if (typeof resetTheme === "function") { resetTheme(); }
        return;
    }
    var jobs = [];
    if (mode.admin) jobs.push(dzApiResetHouse());
    if (mode.perUser) jobs.push(dzApiResetUser());
    if (!jobs.length) { location.reload(); return; } // nothing this identity can reset server-side
    Promise.all(jobs).then(function (results) {
        if (!results.every(function (r) { return r.ok; })) return; // a failure already warned; keep current state
        if (typeof Storage !== "undefined") {
            try { localStorage.removeItem(themeFolder + ".themeSettings"); } catch (e) { /* private mode: nothing cached to clear */ }
        }
        location.reload();
    });
}

/* Clear only the browser cache (the old reset dialog's "clear localStorage"
   button): drop the cached theme settings and reload; the server-stored settings
   are kept, so the reload re-seeds the cache from them. */
function dzHubDoClearCache() {
    try {
        if (typeof Storage !== "undefined") { localStorage.removeItem(themeFolder + ".themeSettings"); }
    } catch (e) { /* private mode: nothing cached to clear */ }
    location.reload();
}

/* Reset custom colours to the selected scheme's default palette (the legacy
   Theme tab's reset-colours icon): read the base scheme's token defaults
   (scheme.js getSchemeDefaults), write them into theme.color_scheme, apply
   live, refresh the hub swatches, and persist. Same logic as the deleted
   legacy handler, but instant-apply instead of Save-batched. */
function dzHubDoResetColors() {
    if (typeof getSchemeDefaults !== "function") return;
    var d = getSchemeDefaults();
    theme.color_scheme = {
        background: d.bg, main_color: d.main, navbar: d.navbar, item: d.item,
        main_text: d.text, alt_text: d.alt_text, disabled: d.disabled
    };
    if (typeof applyCustomColorScheme === "function") { applyCustomColorScheme(theme.color_scheme); }
    if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
    cacheThemeSettings();
    dzHubPersist();
}

/* ---- Per-user actions (ThemeSettings migration): promote personal settings
   to house defaults, and scoped resets. Visibility is decided in
   dzBuildMaintenanceBlock (mode-gated); each handler here only needs to gate
   its own confirm + API call. Routed through dzHubConfirm, the same bootbox
   convention every other maintenance action in this file uses (fallback to
   window.confirm, never fires without a confirmation). */
function dzHubPromote() {
    dzHubConfirm(
        "Copy your current personal settings over the house defaults? Your own settings stay yours; this changes what new and reset users get.",
        function () {
            dzApiPromote().then(function (r) {
                if (r.ok && typeof ShowNotify === "function") ShowNotify("House defaults updated", 3000);
            });
        }
    );
}

function dzHubResetMine() {
    dzHubConfirm(
        "Reset your personal theme settings? You fall back to the house defaults.",
        function () {
            dzApiResetUser().then(function (r) { if (r.ok) location.reload(); });
        }
    );
}

function dzHubResetHouse() {
    dzHubConfirm(
        "Reset the HOUSE defaults to factory values? Personal settings of users are untouched.",
        function () {
            dzApiResetHouse().then(function (r) { if (r.ok) location.reload(); });
        }
    );
}

/* ---- Device-image editor (icon_image / theme.icons) ---------------------- *
   Rebuilds the deleted legacy Theme tab's raw-JSON textarea editor as
   structured rows in the icon_image row's expanded area. theme.icons is the
   SAME array devices.js setDeviceCustomIcon reads ({idx, img}) and
   settings-transport.js persists; only the editing UI is new. */

/* The editor: a list of the current idx -> image mappings (each removable) plus
   an add row (device idx + image filename). Hidden while icon_image is off. */
function dzHubBuildImageEditor() {
    var editor = document.createElement("div");
    editor.id = "dz-hub-image-editor";
    editor.className = "dz-hub-image-editor";
    var on = !!(theme.features && theme.features.icon_image && theme.features.icon_image.enabled === true);
    editor.hidden = !on;

    var help = document.createElement("p");
    help.className = "dz-hub-image-help";
    help.textContent = "Map a device (by Idx) to an image file in the theme's images folder. "
        + "Works with light devices shown with a bulb icon.";
    editor.appendChild(help);

    var list = document.createElement("div");
    list.className = "dz-hub-image-list";
    editor.appendChild(list);

    var addRow = document.createElement("div");
    addRow.className = "dz-hub-image-add";
    var idxInput = document.createElement("input");
    idxInput.type = "number";
    idxInput.min = "1";
    idxInput.className = "dz-hub-image-idx";
    idxInput.setAttribute("aria-label", "Device Idx");
    idxInput.placeholder = "Idx";
    var imgInput = document.createElement("input");
    imgInput.type = "text";
    imgInput.className = "dz-hub-image-img";
    imgInput.setAttribute("aria-label", "Image file name");
    imgInput.placeholder = "image.png";
    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary dz-hub-image-add-btn"; // house Filled-primary family (css/buttons.css)
    addBtn.textContent = "Add";
    addBtn.addEventListener("click", function () {
        var idx = idxInput.value.trim();
        var img = imgInput.value.trim();
        // Fail closed: need a numeric idx and a non-empty filename.
        if (!/^\d+$/.test(idx) || !img) { return; }
        dzHubImageAdd(idx, img);
        idxInput.value = "";
        imgInput.value = "";
        dzHubRenderImageList(list);
    });
    addRow.appendChild(idxInput);
    addRow.appendChild(imgInput);
    addRow.appendChild(addBtn);
    editor.appendChild(addRow);

    dzHubRenderImageList(list);
    return editor;
}

/* Render the current theme.icons mappings, each with a remove button. Values
   reach the DOM through textContent/value only (never composed markup), so a
   stored filename cannot inject. */
function dzHubRenderImageList(list) {
    list.textContent = "";
    var icons = (theme && Array.isArray(theme.icons)) ? theme.icons : [];
    if (!icons.length) {
        var empty = document.createElement("p");
        empty.className = "dz-hub-image-empty";
        empty.textContent = "No device images yet.";
        list.appendChild(empty);
        return;
    }
    icons.forEach(function (m, i) {
        var row = document.createElement("div");
        row.className = "dz-hub-image-row";

        var idxCell = document.createElement("span");
        idxCell.className = "dz-hub-image-cell";
        idxCell.textContent = "Idx " + m.idx;

        var imgCell = document.createElement("span");
        imgCell.className = "dz-hub-image-cell dz-hub-image-name";
        imgCell.textContent = m.img;

        var rm = document.createElement("button");
        rm.type = "button";
        rm.className = "btn btn-danger dz-hub-image-remove"; // house Filled-danger family (css/buttons.css)
        rm.textContent = "Remove";
        rm.setAttribute("aria-label", "Remove image for device " + m.idx);
        rm.addEventListener("click", function () { dzHubImageRemove(i); dzHubRenderImageList(list); });

        row.appendChild(idxCell);
        row.appendChild(imgCell);
        row.appendChild(rm);
        list.appendChild(row);
    });
}

/* Add/replace a mapping, then persist. One entry per idx (not stacked): the
   legacy setDeviceCustomIcon reads the FIRST match, so keeping one per idx keeps
   the list truthful and lets a re-add update the image. */
function dzHubImageAdd(idx, img) {
    theme.icons = Array.isArray(theme.icons) ? theme.icons : [];
    theme.icons = theme.icons.filter(function (m) { return String(m.idx) !== String(idx); });
    theme.icons.push({ idx: idx, img: img });
    dzHubPersistImages();
}

function dzHubImageRemove(i) {
    if (!Array.isArray(theme.icons)) return;
    theme.icons.splice(i, 1);
    dzHubPersistImages();
}

/* Cache + persist theme.icons through the seam, then re-render device cards so a
   mapping change shows on the next pass (the hub itself renders no device
   cards). */
function dzHubPersistImages() {
    cacheThemeSettings();
    dzHubPersist();
    if (typeof setAllDevicesFeatures === "function") { setAllDevicesFeatures(); }
}

/* Reveal/hide the image editor with the icon_image toggle. */
function dzHubToggleImageEditor(show) {
    var hub = document.getElementById(DZ_HUB_ID);
    var ed = hub && hub.querySelector("#dz-hub-image-editor");
    if (ed) ed.hidden = !show;
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

/* A hub built BEFORE the routes settled (dzMaybeReopenHub's debounced reopen is
   the real case: it can fire while dzRoutesActive is still false) is a hidden
   SIBLING of #main-view. Handing that node back to a routed mount would leave
   #/Theme blank for the rest of the session, so adopt it into the routed host
   instead: move it, show it, and undo the legacy path's #main-view hide, since
   the routed hub lives inside #main-view and would be hidden with it. */
function dzAdoptHubInto(hub, routeHost) {
    if (hub.parentNode !== routeHost) routeHost.appendChild(hub);
    hub.style.display = "";
    var mainView = document.getElementById("main-view");
    if (mainView && mainView.style.display === "none") mainView.style.display = "";
    return hub;
}

/* Routed entry (#/Theme, #/Theme/:tab): build the hub into the routed template's
   host and honour the optional group deep link. Same builder as the fallback
   path, only the parent differs. Called by the route controller in custom.js. */
function dzMountThemeHubIn(host, tab) {
    var hub = dzBuildThemeHub(host);
    if (!hub) return null; // dzBuildThemeHub already warned
    if (tab) {
        if (dzHubHasGroup(tab)) dzHubShowGroup(tab);
        else console.warn("machinon_routes", "unknown_hub_group", "no hub group '" + tab + "'; showing " + dzHubActiveGroup);
    }
    dzHubSyncMenuActive();
    return hub;
}

/* Is `id` one of THEME_MANIFEST's group ids? Answered from the manifest, never
   by building a selector out of the url parameter. */
function dzHubHasGroup(id) {
    if (typeof THEME_MANIFEST === "undefined") return false;
    return THEME_MANIFEST.some(function (group) { return group.id === id; });
}

/* Open the hub from anywhere (menu entry, grid tile, feature code).

   Routed: hand over to the route, so every caller gains the URL for free and
   there is exactly one open path. Fallback: build it if needed, hide core's
   ng-view content, show the hub, and arm a one-time hashchange handler that
   restores core content when the user navigates away (so the hub is a
   pseudo-page, not a permanent hijack). addEventListener is used, not
   window.onhashchange, so page.js's locationHashChanged handler (set in
   custom.js init_theme) is left intact. */
function dzOpenThemeHub() {
    if (window.dzRoutesActive) {
        location.hash = "#/Theme";
        return;
    }
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

/* ===================================================================== *
 *  Task 3: setting rows + instant apply                                  *
 * ===================================================================== *

   Each non-custom manifest entry (theme-manifest.js) renders as a row:
   [ control | label + appliesTo tag + description (+ reload note) | preview ].
   Changing a control applies the setting LIVE through the SAME appliers the
   in-place reconcile uses (settings-store.js applyThemeDeltaInPlace) and then
   persists through the storage seam (storeUserVariableThemeSettings("update")).
   The applier mapping below MIRRORS applyThemeDeltaInPlace (and the deleted
   legacy Theme tab's handlers) verbatim; it never invents a different mapping. control:"custom" entries
   (scheme, custom colors, icon packs) are NOT rows here: Tasks 5/6 host those,
   so a placeholder mount stands in their place. */

/* Per-storageKey live visual applier. MIRRORS settings-store.js
   applyThemeDeltaInPlace() (lines cited). Feature FILE
   load/unload is handled generically in dzApplyHubSetting
   (loadThemeFeatureFiles/unloadThemeFeatureFiles); this map only names the
   ADDITIONAL idempotent visual applier a setting drives on top of that. */
var DZ_HUB_APPLIERS = {
    card_min_width: applyCardWidths,     // scheme.js applyCardWidths -> --dz-card-min/max-width (settings-store.js:194 setColorScheme/applyCardWidths block)
    card_max_width: applyCardWidths,     // "
    logo: setLogo,                       // page.js setLogo -> header.logo img (settings-store.js:195 setLogo())
    hide_logo: setLogo,                  // setLogo() re-applies on the hide_logo toggle (feature with files:[])
    background_img: applyBackground,     // page.js applyBackground -> html background (settings-store.js:197 applyBackground())
    background_type: applyBackground,    // "
    navbar_icons_text: applyNavbarIconsText // page.js applyNavbarIconsText -> .navbar.notext (settings-store.js:197 applyNavbarIconsText())
};

/* Number min/max and select options, carried over verbatim from the deleted
   legacy Theme tab's form so the hub inputs keep the same bounds. Appliers
   still clamp (scheme.js applyCardWidths), so these are UX hints, not the
   safety net. */
var DZ_HUB_INPUT_META = {
    standby_after:            { min: 1 },
    dashboard_camera_refresh: { min: 1 },
    card_min_width:           { min: 200, max: 800 },
    card_max_width:           { min: 250, max: 1200 },
    background_type:          { options: [["cover", "Cover"], ["pattern", "Pattern"]] }
};

/* Current stored value for a plain (number/text/select) entry; "" when unset so
   an input never shows "undefined". */
function dzHubCurrentValue(entry) {
    var v = theme[entry.storageKey];
    return (v === null || v === undefined) ? "" : v;
}

/* Render one group's rows into its section: top-level rows first, then nest each
   dependent (entry.parent) row inside its parent's .dz-hub-children with the
   correct initial disabled state. control:"custom" entries render a placeholder
   mount (Tasks 5/6 replace it), never a row. */
function dzRenderGroupRows(section, group) {
    var byKey = {};
    group.entries.forEach(function (entry) {
        if (entry.parent) return; // children handled in the second pass
        if (entry.control === "custom") { section.appendChild(dzHubCustomMount(entry)); return; }
        var row = dzRenderHubRow(entry);
        byKey[entry.key] = row;
        section.appendChild(row);
    });
    group.entries.forEach(function (entry) {
        if (!entry.parent || entry.control === "custom") return;
        var childRow = dzRenderHubRow(entry);
        var parentRow = byKey[entry.parent];
        if (!parentRow) { section.appendChild(childRow); return; } // fail open: orphan child stays visible
        var kids = parentRow.querySelector(".dz-hub-children") || parentRow;
        kids.appendChild(childRow);
        var parentOn = !!(theme.features && theme.features[entry.parent] && theme.features[entry.parent].enabled === true);
        if (!parentOn) dzHubSetRowDisabled(childRow, true);
    });
}

/* The label + description header every control:"custom" mount starts with
   (hosted content, if any, follows). Shared by the generic placeholder below
   and the task-5 scheme/custom-colour mounts so the three .dz-hub-custom-mount
   entries (scheme, custom_color_scheme, iconpacks) read consistently. */
function dzHubCustomHeader(entry) {
    var frag = document.createDocumentFragment();
    var label = document.createElement("div");
    label.className = "dz-hub-label";
    label.textContent = entry.label;
    var desc = document.createElement("p");
    desc.className = "dz-hub-desc";
    desc.textContent = entry.description;
    frag.appendChild(label);
    frag.appendChild(desc);
    return frag;
}

/* A hosted-section placeholder for a control:"custom" entry with no hosted
   content yet: keeps the group from being empty
   (.dz-hub-custom-mount[data-custom=<key>]). Every current control:"custom"
   entry now has a real mount (dzHubCustomMount below); this is the fallback
   for a future one that has not been wired up yet. */
function dzHubCustomPlaceholder(entry) {
    var mount = document.createElement("div");
    mount.className = "dz-hub-custom-mount";
    mount.setAttribute("data-custom", entry.key);
    mount.appendChild(dzHubCustomHeader(entry));
    return mount;
}

/* Dispatch a control:"custom" entry to its hosted mount. "scheme" and
   "custom_color_scheme" (hub-task-5) host the real scheme picker and
   custom-colour swatches (schemes.js/scheme.js, logic unchanged, only the
   mount point moves); "iconpacks" (hub-task-6) hosts the icon-pack
   installer (src/js/iconpack.js, same deal); any other control:"custom"
   entry still gets the generic placeholder above. */
function dzHubCustomMount(entry) {
    if (entry.key === "scheme") return dzHubSchemeMount(entry);
    if (entry.key === "custom_color_scheme") return dzHubCustomColorsMount(entry);
    if (entry.key === "iconpacks") return dzHubIconPacksMount(entry);
    if (entry.key === "about") return dzHubAboutMount(entry);
    return dzHubCustomPlaceholder(entry);
}

/* Mounts the icon-pack installer (src/js/iconpack.js) into the icon-packs
   section: a fixed #iconpack container (the id iconpack.js's initIconPack
   already targets via jQuery #id selectors -- unchanged, only the parent
   moves) that mountIconPackInHub loads iconsettings.html into once this
   mount is attached to the live document (dzBuildThemeHub, right after the
   insertBefore call, same timing as the scheme picker above). FAIL CLOSED:
   iconpack.js itself no-ops if #iconpack is ever absent. */
function dzHubIconPacksMount(entry) {
    var mount = document.createElement("div");
    mount.className = "dz-hub-custom-mount";
    mount.setAttribute("data-custom", entry.key);
    mount.appendChild(dzHubCustomHeader(entry));

    var container = document.createElement("section");
    container.id = "iconpack";
    container.textContent = "Loading..";
    mount.appendChild(container);

    return mount;
}

/* Fixed DOM ids the hub exposes to schemes.js. The scheme-picker container is
   registered with schemes.js's renderSchemePicker (registerSchemePickerContainer)
   rather than schemes.js hardcoding it: this is the "parameterize the mount"
   approach the brief called for, kept a one-line registration instead of
   threading a container argument through every renderSchemePicker call site
   (saveCurrentColorsAsScheme/deleteUserScheme all call it with no arguments
   and must keep refreshing every registered mount). */
var DZ_HUB_SCHEME_PICKER_ID = "dzHubSchemePicker";
var DZ_HUB_COLOR_INPUT_PREFIX = "dz-hub-color-";

/* Mounts schemes.js's renderSchemePicker cards (built-in schemes, user
   presets with their delete affordance, the Custom card) into the colors
   section. The cards themselves, click handling and applyScheme() call are
   100% schemes.js code, unchanged; this only provides the container and
   registers it. */
function dzHubSchemeMount(entry) {
    var mount = document.createElement("div");
    mount.className = "dz-hub-custom-mount";
    mount.setAttribute("data-custom", entry.key);
    mount.appendChild(dzHubCustomHeader(entry));

    var picker = document.createElement("div");
    picker.id = DZ_HUB_SCHEME_PICKER_ID;
    picker.className = "dz-hub-scheme-picker";
    mount.appendChild(picker);

    if (typeof registerSchemePickerContainer === "function") {
        registerSchemePickerContainer(DZ_HUB_SCHEME_PICKER_ID);
    }
    // The actual card render happens once, after this mount is attached to
    // the live document (dzBuildThemeHub, right after the insertBefore call);
    // getElementById cannot find a still-detached node.
    return mount;
}

/* Mounts the 7-swatch custom-colour editor (Background, Main, Menu, Item,
   Text, Secondary Text, Disabled: same fields/order as the deleted legacy
   Theme tab's colour inputs, DZ_COLOR_SCHEME_FIELDS in
   schemes.js) plus a "Save as preset" action (saveCurrentColorsAsScheme,
   schemes.js) so a user-saved preset from the hub can be deleted again via
   the picker card's own delete affordance (schemes.js renderSchemePicker). */
function dzHubCustomColorsMount(entry) {
    var mount = document.createElement("div");
    mount.className = "dz-hub-custom-mount";
    mount.setAttribute("data-custom", entry.key);
    mount.appendChild(dzHubCustomHeader(entry));

    var row = document.createElement("div");
    row.className = "dz-hub-swatches";
    DZ_COLOR_SCHEME_FIELDS.forEach(function (field) {
        row.appendChild(dzHubBuildColorSwatch(field));
    });
    mount.appendChild(row);

    var actions = document.createElement("div");
    actions.className = "dz-hub-swatch-actions";
    var saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn-primary dz-hub-swatch-save-btn"; // house Filled-primary family (css/buttons.css); identity class kept for harnesses
    saveBtn.textContent = "Save as preset";
    saveBtn.addEventListener("click", function () {
        if (typeof bootbox === "undefined" || typeof saveCurrentColorsAsScheme !== "function") return;
        bootbox.prompt("Preset name", function (name) {
            if (name) { saveCurrentColorsAsScheme(name); } // schemes.js: persists + re-renders every registered picker mount
        });
    });
    actions.appendChild(saveBtn);
    mount.appendChild(actions);

    return mount;
}

/* One swatch: a type=color input bound directly to theme.color_scheme[field],
   instant-apply (like every other hub control, DZ_HUB_APPLIERS above) rather
   than the deleted legacy form's Save-button batch harvest. Enabled only
   while theme.scheme === "custom" (dzHubSyncSchemeSwatches keeps this live as
   the picker selection changes). */
function dzHubBuildColorSwatch(field) {
    var cell = document.createElement("label");
    cell.className = "dz-hub-swatch";

    var span = document.createElement("span");
    span.className = "dz-hub-swatch-label";
    span.textContent = field.label;

    var input = document.createElement("input");
    input.type = "color";
    input.className = "dz-hub-swatch-input";
    input.id = DZ_HUB_COLOR_INPUT_PREFIX + field.suffix;
    input.setAttribute("data-color-key", field.suffix);
    input.value = (theme.color_scheme && theme.color_scheme[field.field]) || "#000000";
    input.disabled = theme.scheme !== "custom";
    input.addEventListener("change", function () {
        theme.color_scheme = theme.color_scheme || {};
        theme.color_scheme[field.field] = input.value;
        // scheme.js applyCustomColorScheme: the same setProperty applier a
        // scheme pick runs, unchanged.
        applyCustomColorScheme(theme.color_scheme);
        cacheThemeSettings();
        dzHubPersist();
        // schemes.js warnIfContrastFails: the same WCAG gate the deleted
        // legacy Save handler ran, preserved.
        warnIfContrastFails(theme.color_scheme, "The custom colour scheme");
    });

    cell.appendChild(span);
    cell.appendChild(input);
    return cell;
}

/* Keeps the hub's swatches in step with the scheme picker: called by
   schemes.js (renderSchemePicker's refresh + the per-card click handler)
   after theme.scheme/theme.color_scheme change. No-op if the hub is not
   built yet (fail-open: schemes.js calls this unconditionally, guarded by
   typeof at the call site, so a pre-hub-build call is simply impossible, and
   a post-build call while the hub happens to be closed is harmless). */
function dzHubSyncSchemeSwatches() {
    var hub = document.getElementById(DZ_HUB_ID);
    if (!hub) return;
    var isCustom = theme.scheme === "custom";
    var cs = theme.color_scheme || {};
    DZ_COLOR_SCHEME_FIELDS.forEach(function (field) {
        var input = hub.querySelector("#" + DZ_HUB_COLOR_INPUT_PREFIX + field.suffix);
        if (!input) return;
        if (cs[field.field]) { input.value = cs[field.field]; }
        input.disabled = !isCustom;
    });
}

/* Build one setting row: [control | text block | preview placeholder]. The
   control is bound to the entry's CURRENT value (features[storageKey].enabled
   for toggles, theme[storageKey] for values). reloadOnDisable rows carry a
   hidden reload note (shown only once the setting is toggled to the
   reload-needing/disabled state). Top-level rows carry an empty
   .dz-hub-children for their dependents. */
function dzRenderHubRow(entry) {
    var row = document.createElement("div");
    row.className = "dz-hub-row";
    row.setAttribute("data-setting", entry.key);
    if (entry.parent) row.classList.add("dz-hub-row-child");
    // Value inputs (number/text/select) stack label-above-control; toggles stay
    // inline (hub-task-5 FIX 2, see .dz-hub-row-input in css/theme-hub.css).
    if (entry.control !== "toggle") row.classList.add("dz-hub-row-input");

    var controlCell = document.createElement("div");
    controlCell.className = "dz-hub-control";
    var control = dzHubBuildControl(entry);
    if (control) controlCell.appendChild(control);

    var textCell = document.createElement("div");
    textCell.className = "dz-hub-text";
    var labelLine = document.createElement("div");
    labelLine.className = "dz-hub-label-line";
    var label = document.createElement("label");
    label.className = "dz-hub-label";
    label.textContent = entry.label;
    if (control && control.id) label.setAttribute("for", control.id);
    labelLine.appendChild(label);
    if (entry.appliesTo) {
        var tag = document.createElement("span");
        tag.className = "dz-hub-tag";
        tag.textContent = entry.appliesTo;
        labelLine.appendChild(tag);
    }
    // House-scope indicator (ThemeSettings migration): a per-user session sees
    // which rows are shared house defaults rather than their own personal
    // setting. Admins may still edit a house row (they own the house layer);
    // a non-admin per-user session cannot, so its control locks. A session with
    // no personal layer at all (dzSettingsMode().perUser === false: single
    // shared identity) has nothing to distinguish house from personal, so
    // neither the chip nor the lock applies there -- every row behaves like
    // the legacy page, editable by whoever can reach it.
    if (entry.scope === "house" && dzSettingsMode().perUser) {
        var houseChip = document.createElement("span");
        houseChip.className = "dz-hub-chip-house";
        houseChip.title = "House setting, managed by an admin";
        houseChip.textContent = "house";
        labelLine.appendChild(houseChip);
        if (!dzSettingsMode().admin) {
            row.classList.add("dz-hub-row-locked");
            if (control) control.disabled = true;
        }
    }
    textCell.appendChild(labelLine);
    if (entry.description) {
        var desc = document.createElement("p");
        desc.className = "dz-hub-desc";
        desc.textContent = entry.description;
        textCell.appendChild(desc);
    }
    if (entry.reloadOnDisable) textCell.appendChild(dzHubBuildReloadNote(entry));

    var preview = document.createElement("div");
    preview.className = "dz-hub-preview";
    // Fill the preview from the registry (src/js/theme-hub-previews.js): a live
    // token mini or an SVG sketch, per entry.previewId. Null previewId -> the box
    // stays empty (the row is still valid). dzRenderPreview is loaded before this
    // module (custom.js THEME_MODULES), but guard anyway (fail closed: no mini,
    // never a broken row) in case of a load-order regression.
    if (entry.previewId) {
        preview.setAttribute("data-preview", entry.previewId);
        var mini = (typeof dzRenderPreview === "function") ? dzRenderPreview(entry.previewId, entry) : null;
        if (mini) preview.appendChild(mini);
    }

    row.appendChild(controlCell);
    row.appendChild(textCell);
    row.appendChild(preview);
    if (!entry.parent) {
        var kids = document.createElement("div");
        kids.className = "dz-hub-children";
        row.appendChild(kids);
    }
    // icon_image ("Device photos instead of icons") carries the per-device
    // idx/img editor in its expanded area (spec rationalization table: "the
    // per-device idx/img list editor moves into the row's expanded area").
    // Rebuilt in the hub (owner, hub-completion 2026-07-20): same theme.icons
    // storage + persistence path, only the UI is new. Shown only while the
    // toggle is on (dzHubBuildImageEditor sets the initial hidden state).
    if (entry.key === "icon_image") { row.appendChild(dzHubBuildImageEditor()); }
    return row;
}

/* Build the input element for an entry and wire it to instant-apply. Returns
   null for an unsupported control type (the row still renders its text). */
function dzHubBuildControl(entry) {
    var meta = DZ_HUB_INPUT_META[entry.storageKey] || {};
    var el;
    if (entry.control === "toggle") {
        el = document.createElement("input");
        el.type = "checkbox";
        el.checked = !!(theme.features && theme.features[entry.storageKey] && theme.features[entry.storageKey].enabled === true);
    } else if (entry.control === "number") {
        el = document.createElement("input");
        el.type = "number";
        if (meta.min !== undefined) el.min = meta.min;
        if (meta.max !== undefined) el.max = meta.max;
        el.value = dzHubCurrentValue(entry);
    } else if (entry.control === "select") {
        el = document.createElement("select");
        (meta.options || []).forEach(function (o) {
            var opt = document.createElement("option");
            opt.value = o[0];
            opt.textContent = o[1];
            el.appendChild(opt);
        });
        el.value = dzHubCurrentValue(entry);
    } else if (entry.control === "text") {
        el = document.createElement("input");
        el.type = "text";
        el.value = dzHubCurrentValue(entry);
    } else {
        return null;
    }
    el.id = "dz-hub-ctl-" + entry.key;
    el.className = "dz-hub-input dz-hub-input-" + entry.control;
    el.setAttribute("data-setting-input", entry.key);
    el.addEventListener("change", function () {
        var value = (entry.control === "toggle") ? el.checked : el.value;
        dzApplyHubSetting(entry, value);
        if (entry.control === "toggle") dzHubSyncChildren(entry, el.checked);
        // icon_image: reveal/hide its per-device image editor with the toggle.
        if (entry.key === "icon_image") dzHubToggleImageEditor(el.checked);
    });
    return el;
}

/* The reload-disclosure element for a reloadOnDisable row: hidden until the
   feature is toggled OFF (an executed .js cannot be un-run, so the change
   cannot apply live: settings-store.js:180). "Reload now" boots the document so
   the disable takes effect. */
function dzHubBuildReloadNote(entry) {
    var note = document.createElement("div");
    note.className = "dz-hub-reload-note";
    note.setAttribute("data-reload-for", entry.key);
    note.hidden = true;
    var span = document.createElement("span");
    span.className = "dz-hub-reload-text";
    span.textContent = "Takes effect after reload";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary dz-hub-reload-btn"; // house Filled-primary family (css/buttons.css); identity class kept for harnesses
    btn.textContent = "Reload now";
    btn.addEventListener("click", dzHubReloadIntoHub);
    note.appendChild(span);
    note.appendChild(btn);
    return note;
}

function dzHubToggleReloadNote(entry, show) {
    var hub = document.getElementById(DZ_HUB_ID);
    var note = hub && hub.querySelector('.dz-hub-reload-note[data-reload-for="' + entry.key + '"]');
    if (note) note.hidden = !show;
}

/* Enable/disable a row's controls (dependency gating + fail-closed). */
function dzHubSetRowDisabled(row, disabled) {
    if (!row) return;
    row.classList.toggle("is-disabled", disabled);
    row.querySelectorAll("input, select, button").forEach(function (c) { c.disabled = disabled; });
}

/* When a parent toggle flips, enable/disable its dependent rows live (the child
   controls, not the child's stored value: gating never rewrites persisted
   child state). */
function dzHubSyncChildren(parentEntry, enabled) {
    var hub = document.getElementById(DZ_HUB_ID);
    if (!hub) return;
    dzManifestAllEntries().forEach(function (e) {
        if (e.parent !== parentEntry.key) return;
        dzHubSetRowDisabled(hub.querySelector('.dz-hub-row[data-setting="' + e.key + '"]'), !enabled);
    });
}

/* FAIL CLOSED: a setting whose applier cannot be resolved disables its row with
   a message rather than silently no-op'ing (brief step 4). */
function dzHubFailClosed(entry, message) {
    var hub = document.getElementById(DZ_HUB_ID);
    var row = hub && hub.querySelector('.dz-hub-row[data-setting="' + entry.key + '"]');
    console.warn("machinon_theme_hub", "applier_missing", entry.key + ": " + message);
    if (!row) return;
    dzHubSetRowDisabled(row, true);
    var note = row.querySelector(".dz-hub-fail-note");
    if (!note) {
        note = document.createElement("p");
        note.className = "dz-hub-fail-note";
        (row.querySelector(".dz-hub-text") || row).appendChild(note);
    }
    note.textContent = message;
}

/* First-failure no_identity handling (ThemeSettings migration, controller
   notes): dzSettingsMode().noIdentity flips true lazily, set by
   settings-transport.js's dzApiFail on the first write the server refuses for
   lacking a resolvable identity (an application-token session has no Users
   row to attach a personal layer to; Cmd_ThemeSettingsSet returns
   "no_identity"). No proactive detection needed or possible: this only reacts
   once a real write has failed that way, via dzHubPersist below. */
var dzHubNoIdentityLocked = false;

function dzHubApplyNoIdentityLock() {
    if (dzHubNoIdentityLocked) return;
    dzHubNoIdentityLocked = true;
    var hub = document.getElementById(DZ_HUB_ID);
    if (!hub) return;
    hub.querySelectorAll(".dz-hub-row").forEach(function (row) {
        row.classList.add("dz-hub-row-locked");
        row.querySelectorAll("input, select").forEach(function (c) { c.disabled = true; });
    });
    var about = hub.querySelector('.dz-hub-custom-mount[data-custom="about"]');
    if (about && !about.querySelector("#dz-hub-no-identity-note")) {
        var note = document.createElement("p");
        note.id = "dz-hub-no-identity-note";
        note.className = "dz-hub-no-identity-note";
        note.textContent = "This session cannot store settings (application token).";
        about.insertBefore(note, about.firstChild);
    }
}

/* Every hub write funnels through here (instead of calling
   storeUserVariableThemeSettings directly) so a no_identity failure locks the
   hub reactively right after the write settles, wherever it originated (a
   setting row, a colour swatch, the image editor, reset-colours). */
function dzHubPersist() {
    return storeUserVariableThemeSettings("update").then(function (res) {
        if (dzSettingsMode().noIdentity) dzHubApplyNoIdentityLock();
        return res;
    });
}

/* Apply one setting LIVE then persist. Toggles update
   theme.features[storageKey].enabled and run the feature's file load/unload +
   any live visual applier; values update theme[storageKey] and run the mapped
   applier (or persist only, for values a feature module reads on its own cycle).
   Mirrors settings-store.js applyThemeDeltaInPlace exactly. */
function dzApplyHubSetting(entry, value) {
    if (!entry || entry.control === "custom") return;
    var key = entry.storageKey;

    if (entry.control === "toggle") {
        // FAIL CLOSED: a toggle whose feature object is absent has no applier path.
        if (!theme.features || !Object.prototype.hasOwnProperty.call(theme.features, key)) {
            dzHubFailClosed(entry, "Setting unavailable (no feature backing).");
            return;
        }
        var feature = theme.features[key];
        var was = feature.enabled === true;
        var now = value === true;
        feature.enabled = now;
        var files = feature.files || [];
        var hasJs = files.some(function (f) { return f.split(".").pop() === "js"; });
        if (now && !was) {
            // Newly enabled: load its files in place (settings-store.js:171).
            if (files.length) loadThemeFeatureFiles(key);
            // A JS feature re-enabled after a live disable: its reload note no longer applies.
            if (entry.reloadOnDisable) dzHubToggleReloadNote(entry, false);
            // log_plot_bands re-reads its enabled flag (loaded JS cannot be unloaded).
            if (key === "log_plot_bands" && typeof dzApplyLogPlotBands === "function") dzApplyLogPlotBands();
        } else if (!now && was) {
            if (hasJs) {
                // reloadOnDisable: an executed script cannot be un-run
                // (settings-store.js:180). Do NOT pretend it applied; disclose reload.
                dzHubToggleReloadNote(entry, true);
            } else if (files.length) {
                unloadThemeFeatureFiles(key); // CSS-only feature (settings-store.js:183)
            }
        }
        // Additional live visual applier, or a device-pass re-render for a
        // file-less card flag (settings-store.js:191: "re-render on the next
        // device poll"); we run it now so currently rendered cards reflect it.
        if (DZ_HUB_APPLIERS[key]) {
            DZ_HUB_APPLIERS[key]();
        } else if (!files.length && typeof setAllDevicesFeatures === "function") {
            setAllDevicesFeatures();
        }
    } else {
        // Plain value (number/text/select) -> theme[storageKey].
        theme[key] = value;
        if (DZ_HUB_APPLIERS[key]) {
            DZ_HUB_APPLIERS[key](); // mapped visual applier (see DZ_HUB_APPLIERS)
        }
        // else persist-only: the owning feature module (standby.js,
        // dashboard_camera.js, custom_page.js) reads theme[storageKey] on its
        // own cycle, so persistence below is the whole instant-apply.
    }

    cacheThemeSettings();   // settings-store.js localStorage cache
    dzHubPersist();         // persist to Domoticz (the storage seam) + react to a no_identity failure
}

/* Routed, the hub HAS a url (#/Theme), so a reload lands right back on it and
   no flag is needed. In fallback mode the hub is a click pseudo-route with no
   url of its own (dzOpenThemeHub just hides #main-view and shows the sibling hub
   div), so a plain location.reload() would reload whatever real route the user
   was on BEFORE they opened the hub (e.g. #/LightSwitches) and dump them there.
   There, a hub-triggered reload sets a one-shot localStorage flag first;
   dzMaybeReopenHub (init) honours it once and reopens the hub, so "Reload now"
   returns the user to where they were. */
var DZ_HUB_REOPEN_FLAG = "machinon_reopen_hub";

function dzHubReloadIntoHub() {
    if (!window.dzRoutesActive) {
        try { localStorage.setItem(DZ_HUB_REOPEN_FLAG, "1"); } catch (e) { /* private mode: fall through, plain reload */ }
    }
    location.reload();
}

/* FAIL CLOSED: clear the flag BEFORE reopening, so a build/timing failure can
   never leave the flag set and loop-reload.

   The reopen must survive Angular's boot: dzOpenThemeHub arms a hashchange
   close-on-leave handler, and Angular fires an initial routing hashchange
   (-> #/Dashboard) shortly after boot. Opening the hub before that fires would
   immediately trip the close handler and dump the user on the route anyway
   (observed: hub built then re-hidden). So debounce on hashchange: open the hub
   only once the boot navigation has been quiet for a short window, by which
   point the next hashchange is a genuine user navigation the close handler
   should honour. Opens even if no hashchange comes (the initial schedule). */
function dzMaybeReopenHub() {
    var flag;
    try { flag = localStorage.getItem(DZ_HUB_REOPEN_FLAG); } catch (e) { return; }
    if (flag !== "1") return;
    try { localStorage.removeItem(DZ_HUB_REOPEN_FLAG); } catch (e) { /* ignore */ }

    var timer = null;
    function openHubOnce() {
        window.removeEventListener("hashchange", reschedule);
        if (typeof dzOpenThemeHub === "function") { dzOpenThemeHub(); } // fail closed: dzBuildThemeHub warns+bails if #main-view absent
    }
    function reschedule() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(openHubOnce, 700); // quiet window after the last (boot) hashchange
    }
    window.addEventListener("hashchange", reschedule);
    reschedule();
}

/* Wire both menu entries once their navbar ul has rendered. whenElementRenders
   (page.js) runs the callback immediately if the ul is already present, or
   when it renders, with no long-lived polling; each entry re-arms under its
   own key so the two waiters never collide. */
(function dzThemeHubInit() {
    if (typeof whenElementRenders === "function") {
        whenElementRenders("dzThemeHubMenu", "#appnavbar li[has-permission='Admin'] > ul", dzInsertHubMenuEntry);
        whenElementRenders("dzThemeHubMenuOther", "#appnavbar li[has-login-no-admin] > ul", dzInsertHubMenuEntryOther);
    } else {
        // page.js not loaded yet in some ordering; try on DOM ready as a fallback.
        if (window.jQuery) jQuery(function () { dzInsertHubMenuEntry(); dzInsertHubMenuEntryOther(); });
    }
    // Keep the menu entry's highlight in step with the hash. Registered
    // unconditionally: at this point Angular may not have booted yet, so
    // dzRoutesActive is not settled; dzHubSyncMenuActive re-checks it per call
    // and is a no-op without routes.
    window.addEventListener("hashchange", dzHubSyncMenuActive);
    dzMaybeReopenHub(); // honour a pending "Reload now" -> return to the hub
})();
