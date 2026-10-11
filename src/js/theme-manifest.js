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
key: "diagnostic_logging", storageKey: "diagnostic_logging", control: "toggle",
appliesTo: "whole_ui", previewId: null, parent: null,
reloadOnDisable: false, status: "keep", scope: "user"
},
{
key: "diagnostics_copy", storageKey: null, control: "custom",
appliesTo: "whole_ui", previewId: null, parent: "diagnostic_logging",
reloadOnDisable: false, status: "keep", scope: null
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
]
},
{
id: "iconpacks",
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
function dzManifestEntryByStorageKey(storageKey) {
if (storageKey === null || storageKey === undefined) return undefined;
var entries = dzManifestAllEntries();
for (var i = 0; i < entries.length; i++) {
if (entries[i].storageKey === storageKey) return entries[i];
}
return undefined;
}
function dzManifestAllEntries() {
var all = [];
for (var i = 0; i < THEME_MANIFEST.length; i++) {
all = all.concat(THEME_MANIFEST[i].entries);
}
return all;
}
var DZ_SCOPE_EXTRAS = {
scheme_base: "user", color_scheme: "user", user_schemes: "user",
dark_theme: "user", icons: "house"
};
function dzSettingScope(storageKey) {
var entry = dzManifestEntryByStorageKey(storageKey);
if (entry && entry.scope) return entry.scope;
if (Object.prototype.hasOwnProperty.call(DZ_SCOPE_EXTRAS, storageKey)) return DZ_SCOPE_EXTRAS[storageKey];
return null;
}
