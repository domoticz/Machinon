/* Settings manifest: the single declarative source of truth for every
   setting the theme hub page (src/js/theme-hub.js, task 2+) renders as a
   group/row. This module owns no behavior; it only describes what exists.
   The hub reads THEME_MANIFEST to build groups/rows/previews, calls the
   existing appliers on change (settings-store.js), and persists through the
   settings-transport.js seam. Content is transcribed VERBATIM from the
   "Settings rationalization table" in
   docs/superpowers/specs/2026-07-20-theme-hub-design.md; see that table for
   the owner-approved label/description/appliesTo/status per row.

   Schema:
     THEME_MANIFEST = [ group, ... ]
     group = {
       id:      stable group id, one of the eight spec groups, in this order:
                "general","menus","dashboard","cards","charts","background","colors","iconpacks".
       label:   display heading for the group.
       entries: [ entry, ... ]
     }
     entry = {
       key:              stable manifest id. Equal to storageKey for every
                         theme.json-backed setting; a manifest-only id
                         ("scheme", "iconpacks") for control:"custom" hosted
                         sections that have no single seam-stored key.
       storageKey:       the theme.json feature key or top-level value name
                         this entry persists, EXACTLY as stored today (never
                         renamed; the storage seam's positional format is
                         migration-compatible on these names). null on a
                         control:"custom" entry with no direct seam key (the
                         icon-pack installer writes device icons via the
                         Domoticz API directly, not through theme.json).
       control:          "toggle" | "number" | "text" | "select" | "custom".
                         "custom" = hosted section rendered by its own
                         existing UI (scheme picker, color swatches, icon
                         pack installer), not a single input.
       label:            short display name.
       description:      one-sentence description of the setting's effect.
                         Rationalization-table "New label" text, verbatim
                         where the table has a single dedicated row per
                         setting; for a settings pair the table bundles into
                         one row (children of the five parent/child pairs
                         below, plus the logo/hide_logo, background_img/
                         background_type and card_min_width/card_max_width
                         pairs that are NOT parent/child cascades), the
                         bundled cell text is reused for both entries since
                         the table gives no separate per-field text.
       appliesTo:        the rationalization table's "Applies to" tag.
                         Inherited verbatim by child/bundled entries from
                         their parent row (the table gives one tag per row,
                         covering the whole bundle).
       previewId:        id the preview registry (src/js/theme-hub-previews.js,
                         DZ_HUB_PREVIEWS) looks up to build this row's mini, or
                         null for a row that has no meaningful preview (the row
                         is still valid, it just renders no mini). Two kinds of
                         id: a LIVE TOKEN MINI (card-toggle, card-dim,
                         card-lastseen, navbar-strip, menu-tilegrid,
                         dash-columns, dialog-center, card-width, chart-bands)
                         built from --dz-* tokens so it follows the scheme, and
                         a scheme-neutral SVG SKETCH (sketch-standby,
                         sketch-update, sketch-notification) for the three
                         non-visualizable settings. card_min_width and
                         card_max_width share "card-width" (one width-range
                         picture). Null is used where no faithful token mini
                         exists (image-backed background/logo settings), the mini
                         would duplicate another (time_ago vs the last-seen line),
                         or the setting is a child/variant/retire-candidate; see
                         theme-hub-task-4-report.md for the full rationale.
       parent:            the manifest key this entry indents under and is
                         disabled together with, or null. Set ONLY for the
                         five checkbox-gated pairs the current
                         themesettings.html marks with the
                         parentrequired/parentrequiredchild CSS classes:
                         standby_after<-standby, navbar_icons_text<-navbar_icons,
                         button_name+custom_url<-custom_page_menu,
                         dashboard_camera_refresh+dashboard_camera_section<-dashboard_camera,
                         switch_instead_of_bigtext_scenes<-switch_instead_of_bigtext.
                         Settings the table merely bundles in one row without
                         a disable cascade (hide_logo/logo, background_img/
                         background_type, card_min_width/card_max_width) are
                         independent entries with parent:null.
       reloadOnDisable:  true only for a theme.json feature whose "files"
                         include a .js file AND whose disable therefore
                         cannot apply live. Cross-checked against
                         settings-store.js applyThemeDeltaInPlace(): a
                         feature with a .js file that transitions
                         enabled->disabled hits its reloadNeeded branch
                         (an executed script cannot be un-executed); a
                         CSS-only feature unloads its stylesheet live
                         instead (see reloadOnDisable determinations below
                         and task-1-report.md). Always false on
                         control:"custom" and plain-value entries (they are
                         not theme.json features and never take this path).
       status:           "keep" (default posture, every settled row) or
                         "audit" for the three rows the spec table leaves
                         unresolved (sidemenu, check_update, dark_theme).
                         Task 9 owns resolving these; this manifest keeps
                         them visible and correctly flagged, never drops
                         them silently.
     }

   reloadOnDisable:true determinations (theme.json features[].files, .js present):
     custom_settings_menu (settings_page.js), log_plot_bands (log_ranges.js),
     standby (standby.js + standby.css), check_update (check_update.js),
     custom_page_menu (custom_page.js), switch_instead_of_bigtext (switch.js +
     switch.css), dashboard_camera (dashboard_camera.js + dashboard_camera.css).
   Every other feature's files are CSS-only or empty, so applyThemeDeltaInPlace's
   hasJs branch never triggers for them; disabling unloads the stylesheet (or is
   a no-op for a files:[] feature) live, no reload needed. */

var THEME_MANIFEST = [
    {
        id: "general",
        label: "General",
        entries: [
            {
                key: "standby", storageKey: "standby", control: "toggle",
                label: "Screen standby", description: "Screen standby (after N minutes)",
                appliesTo: "Whole UI", previewId: "sketch-standby", parent: null,
                reloadOnDisable: true, status: "keep"
            },
            {
                key: "standby_after", storageKey: "standby_after", control: "number",
                label: "Standby after (minutes)", description: "Screen standby (after N minutes)",
                appliesTo: "Whole UI", previewId: null, parent: "standby",
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "check_update", storageKey: "check_update", control: "toggle",
                label: "Update notice", description: "Update notice for the theme",
                appliesTo: "Navbar badge", previewId: "sketch-update", parent: null,
                reloadOnDisable: true, status: "audit"
            },
            {
                key: "notification", storageKey: "notification", control: "toggle",
                label: "Device warnings", description: "Device warnings (battery, timed out)",
                appliesTo: "Navbar / toasts", previewId: "sketch-notification", parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "center_popups", storageKey: "center_popups", control: "toggle",
                label: "Center popup dialogs", description: "Center popup dialogs",
                appliesTo: "All dialogs", previewId: "dialog-center", parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "footer_text_disabled", storageKey: "footer_text_disabled", control: "toggle",
                label: "Hide the footer text", description: "Hide the footer text",
                appliesTo: "Page footer", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            }
        ]
    },
    {
        id: "menus",
        label: "Menus and navbar",
        entries: [
            {
                key: "custom_settings_menu", storageKey: "custom_settings_menu", control: "toggle",
                label: "Settings menu as tile grid", description: "Settings menu as tile grid",
                appliesTo: "Setup menu", previewId: "menu-tilegrid", parent: null,
                reloadOnDisable: true, status: "keep"
            },
            {
                key: "navbar_icons", storageKey: "navbar_icons", control: "toggle",
                label: "Navbar icons", description: "Icons in the navbar (optionally icon-only)",
                appliesTo: "Navbar", previewId: "navbar-strip", parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "navbar_icons_text", storageKey: "navbar_icons_text", control: "toggle",
                label: "Icon-only navbar (hide text)", description: "Icons in the navbar (optionally icon-only)",
                appliesTo: "Navbar", previewId: null, parent: "navbar_icons",
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "custom_page_menu", storageKey: "custom_page_menu", control: "toggle",
                label: "Custom menu page", description: "Custom menu page (iframe)",
                appliesTo: "Navbar + new page", previewId: null, parent: null,
                reloadOnDisable: true, status: "keep"
            },
            {
                key: "button_name", storageKey: "button_name", control: "text",
                label: "Custom page button name", description: "Custom menu page (iframe)",
                appliesTo: "Navbar + new page", previewId: null, parent: "custom_page_menu",
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "custom_url", storageKey: "custom_url", control: "text",
                label: "Custom page URL", description: "Custom menu page (iframe)",
                appliesTo: "Navbar + new page", previewId: null, parent: "custom_page_menu",
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "sidemenu", storageKey: "sidemenu", control: "toggle",
                label: "Side menu (legacy)",
                description: "RETIRE CANDIDATE: docs pass found sidemenu.css loads unconditionally via custom.css's media-gated import; flag appears dead. Verify feature-loader does nothing meaningful, then retire flag + feature entry",
                appliesTo: "Navigation", previewId: null, parent: null,
                reloadOnDisable: false, status: "audit"
            }
        ]
    },
    {
        id: "dashboard",
        label: "Dashboard",
        entries: [
            {
                key: "dashboard_show_last_update", storageKey: "dashboard_show_last_update", control: "toggle",
                label: "Last-seen line on dashboard cards", description: "Last-seen line on dashboard cards",
                appliesTo: "Classic dashboard", previewId: "card-lastseen", parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "dashboard_columns", storageKey: "dashboard_columns", control: "toggle",
                label: "Column layout on wide screens", description: "Column layout on wide screens (>1200px)",
                appliesTo: "Classic dashboard", previewId: "dash-columns", parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "dashboard_camera", storageKey: "dashboard_camera", control: "toggle",
                label: "Camera previews on the dashboard",
                description: "Camera previews on the dashboard (+refresh seconds, dedicated section)",
                appliesTo: "Classic dashboard", previewId: null, parent: null,
                reloadOnDisable: true, status: "keep"
            },
            {
                key: "dashboard_camera_refresh", storageKey: "dashboard_camera_refresh", control: "number",
                label: "Camera preview refresh (seconds)",
                description: "Camera previews on the dashboard (+refresh seconds, dedicated section)",
                appliesTo: "Classic dashboard", previewId: null, parent: "dashboard_camera",
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "dashboard_camera_section", storageKey: "dashboard_camera_section", control: "toggle",
                label: "Dedicated cameras section",
                description: "Camera previews on the dashboard (+refresh seconds, dedicated section)",
                appliesTo: "Classic dashboard", previewId: null, parent: "dashboard_camera",
                reloadOnDisable: false, status: "keep"
            }
        ]
    },
    {
        id: "cards",
        label: "Device cards",
        entries: [
            {
                key: "time_ago", storageKey: "time_ago", control: "toggle",
                label: "Relative times", description: "Relative times (\"5 minutes ago\")",
                appliesTo: "All device pages", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "fade_off_items", storageKey: "fade_off_items", control: "toggle",
                label: "Dim off devices", description: "Dim cards of devices that are off",
                appliesTo: "All device pages", previewId: "card-dim", parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "switch_instead_of_bigtext", storageKey: "switch_instead_of_bigtext", control: "toggle",
                label: "Toggles instead of status text",
                description: "Toggles instead of status text (+ also on scenes)",
                appliesTo: "Device + scene cards", previewId: "card-toggle", parent: null,
                reloadOnDisable: true, status: "keep"
            },
            {
                key: "switch_instead_of_bigtext_scenes", storageKey: "switch_instead_of_bigtext_scenes", control: "toggle",
                label: "Also toggles on scene cards",
                description: "Toggles instead of status text (+ also on scenes)",
                appliesTo: "Device + scene cards", previewId: null, parent: "switch_instead_of_bigtext",
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "wind_direction", storageKey: "wind_direction", control: "toggle",
                label: "Wind direction as an icon", description: "Wind direction as an icon",
                appliesTo: "Weather cards", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "icon_image", storageKey: "icon_image", control: "toggle",
                label: "Device photos instead of icons",
                description: "Device photos instead of icons (per-device list)",
                appliesTo: "Device cards", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "card_min_width", storageKey: "card_min_width", control: "number",
                label: "Card min width", description: "Card width range (min/max px)",
                appliesTo: "All card grids", previewId: "card-width", parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "card_max_width", storageKey: "card_max_width", control: "number",
                label: "Card max width", description: "Card width range (min/max px)",
                appliesTo: "All card grids", previewId: "card-width", parent: null,
                reloadOnDisable: false, status: "keep"
            }
        ]
    },
    {
        id: "charts",
        label: "Charts and log",
        entries: [
            {
                key: "log_plot_bands", storageKey: "log_plot_bands", control: "toggle",
                label: "Range bands in log graphs", description: "Range bands in log graphs",
                appliesTo: "Device log charts", previewId: "chart-bands", parent: null,
                reloadOnDisable: true, status: "keep"
            }
        ]
    },
    {
        id: "background",
        label: "Background and branding",
        entries: [
            {
                key: "background_img", storageKey: "background_img", control: "text",
                label: "Background image", description: "Page background image (cover or pattern)",
                appliesTo: "Whole UI", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "background_type", storageKey: "background_type", control: "select",
                label: "Background type", description: "Page background image (cover or pattern)",
                appliesTo: "Whole UI", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "logo", storageKey: "logo", control: "text",
                label: "Custom logo", description: "Custom logo / hide logo",
                appliesTo: "Navbar", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "hide_logo", storageKey: "hide_logo", control: "toggle",
                label: "Hide logo", description: "Custom logo / hide logo",
                appliesTo: "Navbar", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            }
        ]
    },
    {
        id: "colors",
        label: "Colors and schemes",
        entries: [
            {
                key: "scheme", storageKey: "scheme", control: "custom",
                label: "Color scheme", description: "Scheme picker (light/dark base and named schemes)",
                appliesTo: "Whole UI", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "custom_color_scheme", storageKey: "custom_color_scheme", control: "custom",
                label: "Custom colors", description: "Custom colors (7 swatches)",
                appliesTo: "Whole UI", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            },
            {
                key: "dark_theme", storageKey: "dark_theme", control: "toggle",
                label: "Dark theme (legacy)",
                description: "AUDIT: legacy dark_theme.css feature vs the scheme system's dark base; if the scheme system fully supersedes it, retire; else expose honestly in S",
                appliesTo: "Whole UI", previewId: null, parent: null,
                reloadOnDisable: false, status: "audit"
            }
        ]
    },
    {
        id: "iconpacks",
        label: "Icon packs",
        entries: [
            {
                key: "iconpacks", storageKey: null, control: "custom",
                label: "Icon packs", description: "Install and switch device icon packs (tabbed installer)",
                appliesTo: "Device icons", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep"
            }
        ]
    }
];

/* Lookup by the theme.json storage key (feature key or top-level value name).
   A null/undefined argument returns undefined rather than matching the
   control:"custom" entries whose storageKey is null (the icon-pack installer):
   those have no single key to look up by, so callers that need them use
   dzManifestAllEntries() and filter on control instead. */
function dzManifestEntryByStorageKey(storageKey) {
    if (storageKey === null || storageKey === undefined) return undefined;
    var entries = dzManifestAllEntries();
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].storageKey === storageKey) return entries[i];
    }
    return undefined;
}

/* Flat list of every entry across every group, in manifest order. */
function dzManifestAllEntries() {
    var all = [];
    for (var i = 0; i < THEME_MANIFEST.length; i++) {
        all = all.concat(THEME_MANIFEST[i].entries);
    }
    return all;
}
