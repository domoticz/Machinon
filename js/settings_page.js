// Replaces core's Setup dropdown (index.html, li[has-permission="Admin"]) with a tile grid.
// The grid is built from that menu at click time, so pages core adds or removes appear here
// without a theme change. A hardcoded tile list silently dropped #AccessTokens when core
// added it.
const mSettings = $("#appnavbar").find("li[has-permission='Admin']");
if (mSettings.length > 0) {
    mSettings.removeClass("dropdown");
    // Bootstrap's document-level dropdown handler keys on the data-toggle attribute, not the
    // class. Leaving the attribute would let a click toggle .open on the li again.
    mSettings.children("a").removeClass("dropdown-toggle").removeAttr("data-toggle");
    mSettings.find("a > b").remove();
    // CONTRACT: the menu ul stays in the DOM, hidden, and is the source the grid is built
    // from. Angular must compile it, so hrefs interpolate ({{config.language}} on the
    // Security Panel link) and ng-show resolves (#Update vs Check for Update). Removing it
    // instead would freeze the grid to whatever was in the markup at load.
    mSettings.children("ul").hide();

    // Tile icons for the pages the theme skins, keyed by menu href. A page not listed here
    // (new upstream, or renamed) still gets a tile, with the default icon.
    const TILE_ICONS = {
        "#Hardware": "hardware.png",
        "#Devices": "devices.png",
        "#Setup": "setup.png",
        "#Energy": "energy.png",
        "#Update": "update.png",
        "#Cam": "cam.png",
        "#Users": "users.png",
        "#Events": "events.png",
        "#CustomIcons": "customicons.png",
        "#Applications": "app.png",
        "#AccessTokens": "accesstokens.png",
        "#Mobile": "mobile.png",
        "#UserVariables": "variables.png",
        "#Notification": "notification.png",
        "#MyProfile": "userprofile.png",
        "#Log": "log.png",
        "#About": "about.png"
    };
    // For tiles without an href: submenu tiles and action items, keyed by data-i18n label.
    const LABEL_ICONS = {
        "Plans": "plan.png",
        "Data push": "contact.png",
        "Check for Update": "update.png",
        "SecurityPanel": "security.png",
        // Theme hub (src/js/theme-hub.js): the hub menu <li> carries an href
        // ("#/Theme") but buildTile below keys the tile on onclick instead (its
        // href is Angular-routed, not in TILE_ICONS), so this keys on the label.
        "Theme": "paint-palette.png"
    };
    const DEFAULT_ICON = "setup.png";

    function readLabel(a) {
        const span = a.children("span").last();
        return {
            i18n: (span.length ? span : a).attr("data-i18n") || null,
            text: (span.length ? span : a).text().trim()
        };
    }

    // Walks one dropdown ul. A submenu holding only links becomes a dropdown tile; a submenu
    // holding further submenus (More options) is a container, so its entries are flattened
    // into the grid. Keyed on structure, not on menu names, so renames cost nothing.
    function harvestMenu(ul) {
        let entries = [];
        ul.children("li").each(function () {
            const li = $(this);
            // Skip what core itself is not showing: ng-hide from ng-show bindings, inline
            // display:none from core's permission code (can-Logout items).
            if (li.hasClass("divider") || li.hasClass("ng-hide") || this.style.display === "none") return;
            const sub = li.children("ul");
            if (sub.length) {
                const nested = harvestMenu(sub);
                if (nested.some(function (e) { return e.links; })) {
                    entries = entries.concat(nested);
                } else if (nested.length) {
                    entries.push({ label: readLabel(li.children("a")), links: nested });
                }
                return;
            }
            const a = li.children("a");
            if (!a.length) return;
            const href = a.attr("href") || null;
            const onclick = a.attr("onclick") || null;
            if (href && href.indexOf("javascript:") === 0) return; // Restart/Shutdown: header buttons
            if (href === "#Logout") return;                        // header button
            if (!href && !onclick) return;
            entries.push({ label: readLabel(a), href: href, onclick: onclick });
        });
        return entries;
    }

    function appendLabel(parent, label, cls) {
        const div = $("<div>", { "class": cls, text: label.text });
        if (label.i18n) div.attr("data-i18n", label.i18n);
        div.appendTo(parent);
    }

    function tileIcon(entry) {
        return TILE_ICONS[entry.href] || LABEL_ICONS[entry.label.i18n] || DEFAULT_ICON;
    }

    function buildTile(entry) {
        const li = $("<li>", { "class": "rectangle-8" });
        $("<img>", { src: "images/settings/" + tileIcon(entry) }).appendTo(li);
        appendLabel(li, entry.label, "machinoText");
        // onclick takes precedence over href when an entry carries both (only the
        // Theme hub entry does, src/js/theme-hub.js ENTRY LINK POLICY): its href
        // is mode-dependent (only a real route once Angular's routes are live),
        // while onclick="dzOpenThemeHub()" is the one open path that already
        // knows which mode it is in, so the tile must go through it too instead
        // of navigating the href directly (that would 404 into core's .otherwise
        // -> Dashboard redirect whenever routes are not live). Every other entry
        // still carries exactly one of the two, so this is behavior-preserving
        // for them.
        if (entry.onclick) {
            // Copied verbatim from core's own anchor markup (Check for Update), not built here.
            li.attr("onclick", entry.onclick);
        } else if (entry.href) {
            li.attr("data-target", entry.href);
        }
        return li;
    }

    function buildDropdownTile(entry) {
        const li = $("<li>", { "class": "rectangle-8-dropdown" });
        $("<img>", { src: "images/settings/" + tileIcon(entry) }).appendTo(li);
        appendLabel(li, entry.label, "machinoText");
        const content = $("<div>", { "class": "dropdown-content rectangle-8" }).appendTo(li);
        entry.links.forEach(function (link) {
            const span = $("<span>", { text: link.label.text });
            if (link.label.i18n) span.attr("data-i18n", link.label.i18n);
            $("<p>").append(
                $("<a>", { href: link.href }).append(
                    $("<div>", { "class": "mDropdown-Text" }).append(span)))
                .appendTo(content);
        });
        return li;
    }

    // Build the grid into `host`. Routed (#/SetupMenu), the host is the routed
    // template's div inside core's ng-view; unrouted, it is #main-view itself,
    // emptied by the click handler below. Either way the tiles are harvested
    // from the LIVE hidden ul on every build (see CONTRACT above), never cloned.
    function buildSettingsGrid(host) {
        $("#machinoSettings").remove();
        $("#search").addClass("readonly");
        $("body").css("overflow", "auto");
        $(host).append('<div id="machinoSettings" class="container-fluid">');
        $("#machinoSettings").append('<ul class="mHeaderBtn">').append('<div class="page-header-small"><h1 data-i18n="Settings">Settings</h2></div>').append('<ul class="machinon_ul">');
        $("#machinoSettings ul.mHeaderBtn").append('<li class="btn btn-danger" onclick="javascript:SwitchLayout(\'Restart\')"><i class="ion-ios-refresh"></i><div data-i18n="Restart System">Restart System</div></li><li class="btn btn-danger" onclick="javascript:SwitchLayout(\'Shutdown\')"><i class="ion-ios-power"></i><div data-i18n="Shutdown System">Shutdown System</div></li><li class="btn btn-danger" onclick="location.href=\'#Logout\'"><i class="ion-ios-log-out"></i><div data-i18n="Logout">Logout</div></li>');

        const grid = $("#machinoSettings ul.machinon_ul");
        harvestMenu(mSettings.children("ul")).forEach(function (entry) {
            grid.append(entry.links ? buildDropdownTile(entry) : buildTile(entry));
        });
        grid.on("click", "li[data-target]", function () {
            location.href = $(this).attr("data-target");
        });

        $("#machinoSettings").i18n();
        if (!isAdmin()) $("#machinoSettings").remove();
    }

    mSettings.click(function (event) {
        // Clicks that originate inside the hidden source ul (the Theme hub entry
        // is one of its <li>s) are that entry's own navigation bubbling up, not a
        // request for the grid: let them through untouched.
        if ($(event.target).closest(mSettings.children("ul")).length) return;
        $(".navbar-inner").removeClass("slide");
        if (window.dzRoutesActive) {
            location.hash = "#/SetupMenu"; // the route builds the grid; one open path
            return;
        }
        $("#appnavbar li").removeClass("current_page_item");
        mSettings.addClass("current_page_item");
        buildSettingsGrid($("#holder #main-view").empty());
    });

    // Routed mode: the grid page belongs to this feature file, which core's menu
    // markup knows nothing about, so mirror core's
    // ng-class="{'current_page_item':getClass(...)}" on the Setup entry by hand.
    function syncSettingsMenuActive() {
        mSettings.toggleClass("current_page_item",
            window.dzRoutesActive === true && location.hash.indexOf("#/SetupMenu") === 0);
    }

    // Registered unconditionally: this file can execute before Angular has
    // booted, so dzRoutesActive is not settled yet; the handler re-checks it per
    // call and is a no-op without routes.
    window.addEventListener("hashchange", syncSettingsMenuActive);
    syncSettingsMenuActive();

    // The #/SetupMenu route controller (custom.js) waits for this milestone:
    // this file is a feature file loaded through RequireJS, so it can execute
    // long after the route has already rendered its empty host.
    window.dzBuildSettingsGrid = buildSettingsGrid;
    if (typeof dzRouteMilestone === "function") dzRouteMilestone("settingsGrid");
}
