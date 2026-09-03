/* Settings manifest: the single declarative source of truth for every
   setting the theme hub page (src/js/theme-hub.js) renders as a group/row.
   This module owns no behavior; it only describes what exists. The hub
   reads THEME_MANIFEST to build groups/rows/previews, calls the existing
   appliers on change (settings-store.js), and persists through the
   settings-transport.js seam. Every entry below owns structure (keys,
   controls, storage, previews, parents); lang/machinon.en.js owns the
   prose (group heading, entry label/description, appliesTo tag), keyed by
   group id and entry key.

   Scope classification: every entry with a storageKey is tagged "user" or
   "house" so the per-user overlay knows which keys it may ever write. The
   rule: per-user = anything that only changes how your own browser renders;
   house = shared content, branding, infrastructure, and per-device data.

   Schema:
     THEME_MANIFEST = [ group, ... ]
     group = {
       id:      stable group id, one of the nine spec groups, in this order:
                "general","menus","dashboard","cards","charts","background","colors","iconpacks","about".
                ("about" is the last tab: a hosted-custom section carrying the
                expansive About + the theme maintenance actions; its short
                summary also renders on General.)
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
                         icon library writes device icons via the
                         Domoticz API directly, not through theme.json).
       control:          "toggle" | "number" | "text" | "select" | "custom".
                         "custom" = hosted section rendered by its own
                         existing UI (scheme picker, color swatches, icon
                         icon library), not a single input.
       appliesTo:        a lower-snake slug for the rationalization table's
                         "Applies to" tag; the display string lives in
                         lang/machinon.en.js under hub.appliesTo.<slug>.
                         Inherited verbatim by child/bundled entries from
                         their parent row (the table gives one tag per row,
                         covering the whole bundle). label/description are
                         NOT properties here: they live in
                         lang/machinon.en.js under
                         hub.settings.<entry.key>.{label,description} (a
                         parent/child pair or a bundled non-cascading pair
                         each keeps its own dedicated description text
                         there, a child additionally naming the parent it
                         depends on).
       previewId:        id the preview registry (src/js/theme-hub-previews.js,
                         DZ_HUB_PREVIEWS) looks up to build this row's mini, or
                         null for a row that has no meaningful preview (the row
                         is still valid, it just renders no mini). Two kinds of
                         id: a LIVE TOKEN MINI (card-toggle, card-dim,
                         card-lastseen, navbar-strip, menu-tilegrid,
                         dash-columns, dialog-center, card-width, chart-bands)
                         built from --dz-* tokens so it follows the scheme, and
                         a scheme-neutral SVG SKETCH for a setting with no
                         on-screen colour to mirror. Which previewId is which
                         kind is not enumerated here: DZ_HUB_PREVIEWS above is
                         the single source, and a restated subset list is
                         exactly what went stale when warn_timeout/warn_battery
                         split sketch-notification across two settings.
                         card_min_width and card_max_width share "card-width"
                         (one width-range picture). Null is used where no
                         faithful token mini exists (image-backed
                         background/logo settings), the mini would duplicate
                         another (time_ago vs the last-seen line), or the
                         setting is a child/variant/retire-candidate.
       parent:            the manifest key this entry indents under and is
                         disabled together with, or null. Set ONLY for the
                         five checkbox-gated pairs the legacy Theme tab
                         expressed as parent/child checkboxes (that tab no
                         longer exists; the pairs live on here):
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
                         instead (see reloadOnDisable determinations
                         below). Always false on control:"custom" and
                         plain-value entries (they are not theme.json
                         features and never take this path).
       status:           "keep" (default posture, every settled row) or
                         "audit" for the three rows that remain open
                         questions (sidemenu, check_update, dark_theme);
                         this manifest keeps them visible and correctly
                         flagged, never drops them silently.
       scope:            "user" or "house" for every entry with a storageKey
                         (see classification rule above); null on the two
                         control:"custom" entries whose storageKey is also
                         null (iconpacks, about), which have no single key to
                         scope. Read through dzSettingScope(storageKey)
                         below, never off entry.scope directly, so callers
                         also resolve the snapshot keys that have no manifest
                         row (DZ_SCOPE_EXTRAS).
     }

   reloadOnDisable:true determinations (theme.json features[].files, .js present):
     custom_settings_menu (settings_page.js), log_plot_bands (log_ranges.js),
     standby (standby.js + standby.css), check_update (check_update.js),
     custom_page_menu (custom_page.js), switch_instead_of_bigtext (switch.js +
     switch.css), dashboard_camera (dashboard_camera.js + dashboard_camera.css),
     rgbw_popup (rgbw-popup.js + rgbw-popup.css).
   Every other feature's files are CSS-only or empty, so applyThemeDeltaInPlace's
   hasJs branch never triggers for them; disabling unloads the stylesheet (or is
   a no-op for a files:[] feature) live, no reload needed. */

var THEME_MANIFEST = [
    {
        id: "general",
        entries: [
            {
                key: "standby", storageKey: "standby", control: "toggle",
                appliesTo: "whole_ui", previewId: "sketch-standby", parent: null,
                reloadOnDisable: true, status: "keep", scope: "user"
            },
            {
                key: "standby_after", storageKey: "standby_after", control: "number",
                appliesTo: "whole_ui", previewId: null, parent: "standby",
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "check_update", storageKey: "check_update", control: "toggle",
                appliesTo: "navbar_badge", previewId: "sketch-update", parent: null,
                reloadOnDisable: true, status: "keep", scope: "user"
            },
            {
                key: "warn_timeout", storageKey: "warn_timeout", control: "toggle",
                appliesTo: "toasts", previewId: "sketch-notification", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "warn_battery", storageKey: "warn_battery", control: "toggle",
                appliesTo: "toasts", previewId: "sketch-notification", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "warn_repeat", storageKey: "warn_repeat", control: "select",
                appliesTo: "toasts", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "center_popups", storageKey: "center_popups", control: "toggle",
                appliesTo: "all_dialogs", previewId: "dialog-center", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "rgbw_popup", storageKey: "rgbw_popup", control: "toggle",
                appliesTo: "color_light_devices", previewId: "sketch-rgbw-popup", parent: null,
                reloadOnDisable: true, status: "keep", scope: "user"
            },
            {
                key: "footer_text_disabled", storageKey: "footer_text_disabled", control: "toggle",
                appliesTo: "page_footer", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "floorplan_popup_details", storageKey: "floorplan_popup_details", control: "toggle",
                appliesTo: "floorplan", previewId: "sketch-floorplan-details", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            }
        ]
    },
    {
        id: "menus",
        entries: [
            {
                key: "custom_settings_menu", storageKey: "custom_settings_menu", control: "toggle",
                appliesTo: "setup_menu", previewId: "menu-tilegrid", parent: null,
                reloadOnDisable: true, status: "keep", scope: "user"
            },
            {
                key: "navbar_icons", storageKey: "navbar_icons", control: "toggle",
                appliesTo: "navbar", previewId: "navbar-strip", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "navbar_icons_text", storageKey: "navbar_icons_text", control: "toggle",
                appliesTo: "navbar", previewId: null, parent: "navbar_icons",
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "custom_page_menu", storageKey: "custom_page_menu", control: "toggle",
                appliesTo: "navbar_new_page", previewId: null, parent: null,
                reloadOnDisable: true, status: "keep", scope: "house"
            },
            {
                key: "button_name", storageKey: "button_name", control: "text",
                appliesTo: "navbar_new_page", previewId: null, parent: "custom_page_menu",
                reloadOnDisable: false, status: "keep", scope: "house"
            },
            {
                key: "custom_url", storageKey: "custom_url", control: "text",
                appliesTo: "navbar_new_page", previewId: null, parent: "custom_page_menu",
                reloadOnDisable: false, status: "keep", scope: "house"
            },
            {
                key: "sidemenu", storageKey: "sidemenu", control: "toggle",
                appliesTo: "desktop_layout", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            }
        ]
    },
    {
        id: "dashboard",
        entries: [
            {
                key: "dashboard_show_last_update", storageKey: "dashboard_show_last_update", control: "toggle",
                appliesTo: "classic_dashboard", previewId: "card-lastseen", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "dashboard_columns", storageKey: "dashboard_columns", control: "toggle",
                appliesTo: "classic_dashboard", previewId: "dash-columns", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "dashboard_camera", storageKey: "dashboard_camera", control: "toggle",
                appliesTo: "classic_dashboard", previewId: null, parent: null,
                reloadOnDisable: true, status: "keep", scope: "house"
            },
            {
                key: "dashboard_camera_refresh", storageKey: "dashboard_camera_refresh", control: "number",
                appliesTo: "classic_dashboard", previewId: null, parent: "dashboard_camera",
                reloadOnDisable: false, status: "keep", scope: "house"
            },
            {
                key: "dashboard_camera_section", storageKey: "dashboard_camera_section", control: "toggle",
                appliesTo: "classic_dashboard", previewId: null, parent: "dashboard_camera",
                reloadOnDisable: false, status: "keep", scope: "house"
            }
        ]
    },
    {
        id: "cards",
        entries: [
            {
                key: "time_ago", storageKey: "time_ago", control: "toggle",
                appliesTo: "all_device_pages", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "fade_off_items", storageKey: "fade_off_items", control: "toggle",
                appliesTo: "all_device_pages", previewId: "card-dim", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "switch_instead_of_bigtext", storageKey: "switch_instead_of_bigtext", control: "toggle",
                appliesTo: "device_scene_cards", previewId: "card-toggle", parent: null,
                reloadOnDisable: true, status: "keep", scope: "user"
            },
            {
                key: "switch_instead_of_bigtext_scenes", storageKey: "switch_instead_of_bigtext_scenes", control: "toggle",
                appliesTo: "device_scene_cards", previewId: null, parent: "switch_instead_of_bigtext",
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "wind_direction", storageKey: "wind_direction", control: "toggle",
                appliesTo: "wind_device_cards", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "icon_image", storageKey: "icon_image", control: "toggle",
                appliesTo: "device_cards", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "card_min_width", storageKey: "card_min_width", control: "number",
                appliesTo: "all_card_grids", previewId: "card-width", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "card_max_width", storageKey: "card_max_width", control: "number",
                appliesTo: "all_card_grids", previewId: "card-width", parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            }
        ]
    },
    {
        id: "charts",
        entries: [
            {
                key: "log_plot_bands", storageKey: "log_plot_bands", control: "toggle",
                appliesTo: "device_log_charts", previewId: "chart-bands", parent: null,
                reloadOnDisable: true, status: "keep", scope: "user"
            }
        ]
    },
    {
        id: "background",
        entries: [
            {
                key: "background_img", storageKey: "background_img", control: "text",
                appliesTo: "whole_ui", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "background_type", storageKey: "background_type", control: "select",
                appliesTo: "whole_ui", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "logo", storageKey: "logo", control: "text",
                appliesTo: "navbar", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "house"
            },
            {
                key: "hide_logo", storageKey: "hide_logo", control: "toggle",
                appliesTo: "navbar", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "house"
            }
        ]
    },
    {
        id: "colors",
        entries: [
            {
                key: "scheme", storageKey: "scheme", control: "custom",
                appliesTo: "whole_ui", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            },
            {
                key: "custom_color_scheme", storageKey: "custom_color_scheme", control: "custom",
                appliesTo: "whole_ui", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: "user"
            }
            /* dark_theme has NO standalone toggle row here on purpose. It is a
               live theme.json feature (drives applyScheme("dark") / Machinon
               Dark via setDarkFeature + setColorScheme, and loads
               dark_theme.css), but dark is chosen through the scheme picker
               above, not a manual flag. A manual flip of dark_theme desyncs
               <html data-dz-scheme> from the loaded dark_theme.css (light
               token base + dark-only overrides = a broken half-dark render),
               so no standalone toggle exists for it. */
        ]
    },
    {
        id: "iconpacks",
        /* Admin-only: installing a pack writes to the instance, which a
           non-admin session cannot do, so the whole group (tab AND section) is
           omitted from the hub for them rather than shown and left to fail.
           dzBuildThemeHub reads this; see its comment for why the group is
           dropped rather than locked, and for the deep-link fallback. This is
           the only group carrying the flag today, but it is a flag rather than
           an id check so a second one costs one line here.
           theme-manifest.js's own contract only requires id/label/entries[] per
           group, so the extra property is inert to it. */
        adminOnly: true,
        entries: [
            {
                key: "iconpacks", storageKey: null, control: "custom",
                appliesTo: "device_icons", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: null
            }
        ]
    },
    {
        /* The last tab: a hosted-custom section (like iconpacks: storageKey
           null, no theme.json key of its own) that renders the expansive
           About and the theme maintenance actions (reset to defaults, clear
           cache, reset colours). The General tab additionally shows a SHORT
           summary (name + version + one line); this tab is the full surface.
           Kept out of the coverage check the same way iconpacks is (null
           storageKey, control:"custom"). */
        id: "about",
        entries: [
            {
                key: "about", storageKey: null, control: "custom",
                appliesTo: "theme", previewId: null, parent: null,
                reloadOnDisable: false, status: "keep", scope: null
            }
        ]
    }
];

/* Lookup by the theme.json storage key (feature key or top-level value name).
   A null/undefined argument returns undefined rather than matching the
   control:"custom" entries whose storageKey is null (the icon library):
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

/* Scope for snapshot keys that have no manifest row of their own: the scheme
   companions ride the colors classification (user), dark_theme is the feature
   key behind the retired standalone toggle (see the colors group above), and
   the per-device photo list is house data. custom_color_scheme is NOT listed
   here: it has a real manifest row in the colors group, which dzSettingScope
   resolves first, so an entry here would never be reached. */
var DZ_SCOPE_EXTRAS = {
    scheme_base: "user", color_scheme: "user", user_schemes: "user",
    dark_theme: "user", icons: "house"
};

/* "user" | "house" for any persisted settings key, null for unknown keys. */
function dzSettingScope(storageKey) {
    var entry = dzManifestEntryByStorageKey(storageKey);
    if (entry && entry.scope) return entry.scope;
    if (Object.prototype.hasOwnProperty.call(DZ_SCOPE_EXTRAS, storageKey)) return DZ_SCOPE_EXTRAS[storageKey];
    return null;
}
