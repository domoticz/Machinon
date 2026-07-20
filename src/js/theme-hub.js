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
        var h = document.createElement("h2");
        h.className = "dz-hub-section-title";
        h.textContent = group.label;
        section.appendChild(h);
        dzRenderGroupRows(section, group); // task 3: fill the section with setting rows
        panel.appendChild(section);

        if (i === 0) dzHubActiveGroup = group.id;
    });

    container.appendChild(tabs);
    container.appendChild(panel);
    mainView.parentNode.insertBefore(container, mainView.nextSibling);

    // schemes.js renderSchemePicker() resolves its containers with
    // getElementById, which only finds nodes attached to the live document;
    // the colors section's picker mount (dzHubSchemeMount, registered via
    // registerSchemePickerContainer) exists only as a detached DOM node until
    // the insertBefore above runs, so the first real render happens here, once.
    if (typeof renderSchemePicker === "function") { renderSchemePicker(); }

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

/* ===================================================================== *
 *  Task 3: setting rows + instant apply                                  *
 * ===================================================================== *

   Each non-custom manifest entry (theme-manifest.js) renders as a row:
   [ control | label + appliesTo tag + description (+ reload note) | preview ].
   Changing a control applies the setting LIVE through the SAME appliers the
   in-place reconcile uses (settings-store.js applyThemeDeltaInPlace) and then
   persists through the storage seam (storeUserVariableThemeSettings("update")).
   The applier mapping below MIRRORS applyThemeDeltaInPlace + settings-ui.js
   verbatim; it never invents a different mapping. control:"custom" entries
   (scheme, custom colors, icon packs) are NOT rows here: Tasks 5/6 host those,
   so a placeholder mount stands in their place. */

/* Per-storageKey live visual applier. MIRRORS settings-store.js
   applyThemeDeltaInPlace() (lines cited) and settings-ui.js. Feature FILE
   load/unload is handled generically in dzApplyHubSetting
   (loadThemeFeatureFiles/unloadThemeFeatureFiles); this map only names the
   ADDITIONAL idempotent visual applier a setting drives on top of that. */
var DZ_HUB_APPLIERS = {
    card_min_width: applyCardWidths,     // scheme.js applyCardWidths -> --dz-card-min/max-width (settings-store.js:194 setColorScheme/applyCardWidths block)
    card_max_width: applyCardWidths,     // "
    logo: setLogo,                       // page.js setLogo -> header.logo img (settings-store.js:195 setLogo())
    hide_logo: setLogo,                  // settings-ui.js:221 -> setLogo() on hide_logo toggle (feature with files:[])
    background_img: applyBackground,     // page.js applyBackground -> html background (settings-store.js:197 applyBackground())
    background_type: applyBackground,    // "
    navbar_icons_text: applyNavbarIconsText // page.js applyNavbarIconsText -> .navbar.notext (settings-store.js:197 applyNavbarIconsText())
};

/* Number min/max and select options, transcribed from themesettings.html so the
   hub inputs carry the same bounds as the legacy form. Appliers still clamp
   (scheme.js applyCardWidths), so these are UX hints, not the safety net. */
var DZ_HUB_INPUT_META = {
    standby_after:            { min: 1 },                                   // themesettings.html themevar14
    dashboard_camera_refresh: { min: 1 },                                   // themesettings.html themevar37
    card_min_width:           { min: 200, max: 800 },                       // themesettings.html themevar40
    card_max_width:           { min: 250, max: 1200 },                      // themesettings.html themevar41
    background_type:          { options: [["cover", "Cover"], ["pattern", "Pattern"]] } // themesettings.html themevar35
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
   (.dz-hub-custom-mount[data-custom=<key>]). Still backs "iconpacks" (Task 6). */
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
   mount point moves); any other control:"custom" entry (iconpacks, Task 6)
   still gets the generic placeholder above. */
function dzHubCustomMount(entry) {
    if (entry.key === "scheme") return dzHubSchemeMount(entry);
    if (entry.key === "custom_color_scheme") return dzHubCustomColorsMount(entry);
    return dzHubCustomPlaceholder(entry);
}

/* Fixed DOM ids the hub exposes to schemes.js. The scheme-picker container is
   registered with schemes.js's renderSchemePicker (registerSchemePickerContainer)
   rather than schemes.js hardcoding it: this is the "parameterize the mount"
   approach the brief called for, kept a one-line registration instead of
   threading a container argument through every renderSchemePicker call site
   (saveCurrentColorsAsScheme/deleteUserScheme/syncSchemeFromFeatures all call
   it with no arguments and must keep refreshing every registered mount). */
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
   Text, Secondary Text, Disabled: same fields/order as the legacy
   themesettings.html themevar39_* inputs, DZ_COLOR_SCHEME_FIELDS in
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
    saveBtn.className = "dz-hub-swatch-save-btn";
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
   than the legacy form's Save-button batch harvest (settings-ui.js
   showThemeSettings -> #saveSettingsButton handler). Enabled only while
   theme.scheme === "custom" (dzHubSyncSchemeSwatches keeps this live as the
   picker selection changes), mirroring schemes.js syncCustomCheckbox()'s
   gating of the legacy inputs. */
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
        storeUserVariableThemeSettings("update");
        // schemes.js warnIfContrastFails: the same WCAG gate the legacy
        // Save handler runs (settings-ui.js showThemeSettings), preserved.
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
    btn.className = "dz-hub-reload-btn";
    btn.textContent = "Reload now";
    btn.addEventListener("click", function () { location.reload(); });
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
            // log_plot_bands re-reads its enabled flag (settings-ui.js:223).
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

    cacheThemeSettings();                       // settings-store.js localStorage cache
    storeUserVariableThemeSettings("update");   // persist to Domoticz (the storage seam)
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
