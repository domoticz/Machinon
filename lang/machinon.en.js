// English (Template). This file defines the COMPLETE key set: every other
// lang/machinon.*.js may only translate keys that exist here (enforced by
// scripts/check-lang-parity.mjs). A key missing from a translation falls back
// to this file's string at runtime (custom.js merges English underneath).
language = {
  common: {
    and: "and",
    more: "more"
  },
  header: {
    mainmenu: "Main menu",
    type_to_search: "Type to search",
    search_placeholder: "Name, Desc, Idx, Status"
  },
  hub: {
    groups: {
      general: "General",
      menus: "Menus and navbar",
      dashboard: "Dashboard",
      cards: "Device cards",
      charts: "Charts and log",
      background: "Background and branding",
      colors: "Colors and schemes",
      iconpacks: "Icons",
      about: "About"
    },
    settings: {
      standby: {
        label: "Screen standby",
        description: "After a period of inactivity, the whole page fades to a dark clock screen; any tap or click brings it back."
      },
      standby_after: {
        label: "Standby after (minutes)",
        description: "Sets how many minutes of inactivity trigger screen standby. Only applies while Screen standby is also on."
      },
      check_update: {
        label: "Update notice",
        description: "Checks GitHub for a newer version of the theme and shows a notice if one exists. Separate from Domoticz's own app-update check."
      },
      warn_timeout: {
        label: "Sensor timeout warnings",
        description: "Pops up a message when a sensor stops reporting. The warning icon next to the device name appears either way."
      },
      warn_battery: {
        label: "Low battery warnings",
        description: "Pops up a message when a device reports a low battery. The warning icon next to the device name appears either way."
      },
      warn_repeat: {
        label: "How often warnings repeat",
        description: "How often the same device may warn you again: once per visit, once a day, or only when the problem clears and comes back. The warning icon next to the device name appears either way."
      },
      center_popups: {
        label: "Center popup dialogs",
        description: "Forces every popup dialog to a fixed centered position, instead of wherever Domoticz would otherwise place it."
      },
      rgbw_popup: {
        label: "Machinon color picker",
        description: "Replaces Domoticz's own color picker with a Machinon-styled one for color lights."
      },
      footer_text_disabled: {
        label: "Hide footer text",
        description: "Hides the copyright line Domoticz prints at the bottom of every page."
      },
      floorplan_popup_details: {
        label: "Expandable floorplan popups",
        description: "Restores the expand arrow on floorplan device popups (hidden by default), revealing Log and Notifications shortcuts."
      },
      custom_settings_menu: {
        label: "Settings menu as tile grid",
        description: "Replaces the Setup dropdown with a full-page grid of icon tiles, one per settings page."
      },
      navbar_icons: {
        label: "Navbar icons",
        description: "Shows the small icon next to each navbar item's label. Hidden by default."
      },
      navbar_icons_text: {
        label: "Icon-only navbar (hide text)",
        description: "Hides each navbar item's text, leaving just its icon. Only applies while Navbar icons is also on."
      },
      custom_page_menu: {
        label: "Custom menu page",
        description: "Adds an extra navbar item that loads a web page of your choosing in place of the usual Domoticz page."
      },
      button_name: {
        label: "Custom page button name",
        description: "Sets the label text on the custom menu page's navbar button. Only applies while Custom menu page is also on."
      },
      custom_url: {
        label: "Custom page URL",
        description: "Sets the address the custom menu page loads. Only applies while Custom menu page is also on."
      },
      sidemenu: {
        label: "Side menu on desktop",
        description: "Switches desktop screens to the same collapsible side menu phones already use, replacing the horizontal navbar across the top."
      },
      dashboard_show_last_update: {
        label: "Last-seen line on dashboard cards",
        description: "Shows each device's last-updated time as a small line on its dashboard card."
      },
      dashboard_columns: {
        label: "Column layout on wide screens",
        description: "On screens 1200px and wider, arranges dashboard sections into side-by-side columns instead of stacking them full width."
      },
      dashboard_camera: {
        label: "Camera previews on the dashboard",
        description: "Adds live camera thumbnails to the dashboard, refreshed on an interval. Its own two settings below control where they appear and how often they refresh."
      },
      dashboard_camera_refresh: {
        label: "Camera preview refresh (seconds)",
        description: "Sets how many seconds pass between refreshes of each camera thumbnail. Only applies while Camera previews on the dashboard is also on."
      },
      dashboard_camera_section: {
        label: "Dedicated cameras section",
        description: "Groups every camera into its own \"Cameras\" section at the top of the dashboard; off, each camera's preview appears in place of that device's status text wherever it appears. Only applies while Camera previews on the dashboard is also on."
      },
      time_ago: {
        label: "Relative times",
        description: "Shows a device's last-updated time as a relative phrase like \"5 minutes ago\" instead of the raw date and time."
      },
      fade_off_items: {
        label: "Dim off devices",
        description: "Dim cards of devices that are off"
      },
      switch_instead_of_bigtext: {
        label: "Toggles instead of status text",
        description: "Replaces the plain On/Off status text on a simple switch's card with a slider you can flip directly, without opening the device."
      },
      switch_instead_of_bigtext_scenes: {
        label: "Also toggles on scene cards",
        description: "Extends the same slider toggle to Scene and Group cards. Only applies while Toggles instead of status text is also on."
      },
      wind_direction: {
        label: "Wind arrow direction",
        description: "Domoticz reports the direction wind comes FROM, and the arrow normally points that way. Turn this on to point it the opposite way, at where the wind is blowing TO. The compass label (N, SW) always stays the reported one. Only affects the classic picture icons; with Settings > Icon style set to glyphs the arrow is core's own and this setting does nothing."
      },
      icon_image: {
        label: "Device photos instead of icons",
        description: "Shows a custom photo as a device's card icon instead of its normal on/off icon. Set per device with the editor this reveals."
      },
      card_min_width: {
        label: "Card min width",
        description: "Sets the narrowest a device card is allowed to shrink to, in pixels, before the grid wraps to fewer columns."
      },
      card_max_width: {
        label: "Card max width",
        description: "Sets the widest a device card is allowed to stretch to, in pixels, when there's spare room in the row."
      },
      log_plot_bands: {
        label: "Range bands in log graphs",
        description: "Draws the colored threshold bands from a device's Bar Ranges dialog onto its Log page chart, where Domoticz itself never draws them."
      },
      background_img: {
        label: "Background image",
        description: "Sets the image used as the page background. Give it a web address or the name of an image file in the theme's images folder; leave it empty for no background image."
      },
      background_type: {
        label: "Background type",
        description: "Chooses how the background image is displayed: stretched to fill the screen (cover), or tiled at its original size as a pattern."
      },
      logo: {
        label: "Custom logo",
        description: "Sets an alternate image to use as the navbar logo, in place of Machinon's default. Give it the name of an image file in the theme's images folder."
      },
      hide_logo: {
        label: "Hide logo",
        description: "Hides the navbar logo image entirely, leaving that space empty."
      },
      scheme: {
        label: "Color scheme",
        description: "Sets the theme's overall color scheme: a light or dark base, with named color palettes."
      },
      custom_color_scheme: {
        label: "Custom colors",
        description: "Builds your own color scheme by picking 7 individual colors."
      },
      iconpacks: {
        label: "Icon library",
        description: "Browse the icon library and install just the icons you want onto individual devices."
      },
      about: {
        label: "About Machinon",
        description: "Theme version, description, credits, links, and maintenance actions"
      }
    },
    appliesTo: {
      whole_ui: "Whole UI",
      navbar_badge: "Navbar badge",
      toasts: "Toasts",
      all_dialogs: "All dialogs",
      color_light_devices: "Color light devices",
      page_footer: "Page footer",
      floorplan: "Floorplan",
      setup_menu: "Setup menu",
      navbar: "Navbar",
      navbar_new_page: "Navbar + new page",
      desktop_layout: "Desktop layout",
      classic_dashboard: "Classic dashboard",
      all_device_pages: "All device pages",
      device_scene_cards: "Device + scene cards",
      wind_device_cards: "Wind device cards",
      device_cards: "Device cards",
      all_card_grids: "All card grids",
      device_log_charts: "Device log charts",
      device_icons: "Device icons",
      theme: "Theme"
    },
    options: {
      background_type: {
        cover: "Cover",
        pattern: "Pattern"
      },
      warn_repeat: {
        visit: "Once per visit",
        daily: "Once a day",
        episode: "Only when it changes"
      }
    },
    about: {
      aria: "About this theme",
      title: "Machinon theme V.{version}",
      short_description: "A modern Domoticz theme with color schemes, Theme Hub settings, "
        + "refreshed icons, and light and dark variants. See the About tab for "
        + "details and maintenance.",
      description: "Machinon ships a built-in icon library of more than 250 icons "
        + "to browse and install from, written straight into the Domoticz device "
        + "database, so every installed icon is "
        + "available from any device's own icon picker, not just this theme's cards. "
        + "This settings hub applies every change live with instant previews, offers "
        + "light and dark color schemes plus a custom palette with automatic contrast "
        + "checking, and the theme itself is fully responsive with a mobile layout "
        + "that fits phone viewports.",
      contributions: "Contributions",
      role_design: "Design",
      role_code: "Code",
      link_repo: "GitHub repository",
      link_wiki: "Wiki",
      icons8_credit: "Icons by Icons8"
    },
    maintenance: {
      aria: "Theme maintenance",
      title: "Maintenance",
      note: "Each action asks for confirmation first.",
      reset_theme: "Reset theme to defaults",
      reset_theme_confirm: "Reset all theme settings to their defaults? This deletes the stored theme settings and reloads the page.",
      clear_cache: "Clear cached settings",
      clear_cache_confirm: "Clear this browser's cached theme settings and reload? Your settings saved on the server are kept.",
      reset_colors: "Reset colours to the selected scheme",
      reset_colors_confirm: "Reset the custom colours to the selected scheme's default palette?",
      promote: "Save my current preferences as house defaults",
      promote_confirm: "Copy your current personal settings over the house defaults? Your own settings stay yours; this changes what new and reset users get.",
      promote_done: "House defaults updated",
      reset_mine: "Reset my personal settings",
      reset_mine_confirm: "Reset your personal theme settings? You fall back to the house defaults.",
      reset_house: "Reset the house defaults",
      reset_house_confirm: "Reset the HOUSE defaults to factory values? Personal settings of users are untouched.",
      reset_partial: "Part of the reset completed. Press Reset again to finish."
    },
    imageEditor: {
      help: "Map a device (by Idx) to an image file in the theme's images folder. Works with light devices shown with a bulb icon.",
      idx_aria: "Device Idx",
      idx_placeholder: "Idx",
      img_aria: "Image file name",
      add: "Add",
      empty: "No device images yet.",
      idx_cell: "Idx {idx}",
      remove: "Remove",
      remove_aria: "Remove image for device {idx}"
    }
  },
  toasts: {
    sensors_timed_out: "{count} sensors timed out",
    devices_low_on_battery: "{count} devices low on battery",
    devices: "{count} devices",
    update_available: "Machinon version {version} is available!",
    update_action: "Click here to download"
  }
};
