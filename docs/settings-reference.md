# Settings reference

This page documents all 37 rows in the Theme Hub, one row per entry, grouped into the same nine
tabs as the [Theme Hub](theme-hub.md). Two of those rows, the icon pack browser and the About
panel, aren't settings in the toggle-or-value sense (see [Theme Hub: personal settings versus
shared settings](theme-hub.md#personal-settings-versus-shared-settings)); they're documented here
for completeness alongside the 35 actual settings. If you're new to the Theme Hub itself, its own
page explains where to find it, what the nine groups cover, and how personal settings differ
from shared ones, this page is the per-setting detail it points at, not a repeat of it.

**Reading the Key column:** each setting's first column is the name it's stored under. That's
the same name you'd see for that setting in an exported theme configuration, so if you're
comparing a backup, a support request, or Domoticz's own device debug output against what the
Theme Hub shows you, this is the name to search for.

**Personal versus shared:** most rows below are personal settings, some are shared. Rather than
repeat that explanation here, see [Theme Hub: personal settings versus shared
settings](theme-hub.md#personal-settings-versus-shared-settings) for what the distinction means
and how to tell the two apart in the Theme Hub itself.

**Parent and child settings:** a handful of settings only matter when another setting is also
turned on, for example Standby after (minutes) only matters while Screen standby is on. Every
row below that depends on another one says so directly in its "What it does" column.

The Domoticz Setup menu, restyled as a grid of tiles, has its own address too:

```text
http://your-domoticz:8080/#/SetupMenu
```

Like `#/Theme`, this one exists only while Machinon is active.

## General

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `standby` | Screen standby | After the configured number of minutes with no clicks, taps, or (on desktop) mouse movement, blanks the whole page to a plain dark screen showing a large clock and today's date. Any click or tap brings the dashboard straight back. | Whole UI |
| `standby_after` | Standby after (minutes) | Sets how many minutes of inactivity trigger screen standby. Only takes effect while Screen standby is also on. | Whole UI |
| `check_update` | Update notice | A few seconds after the page loads, checks Machinon's GitHub repository for a released version newer than the one installed, and shows a toast notification linking to the release page if one exists. It checks against the version that's actually been released, not whatever is mid-development, so it never nags you about a version that isn't out yet. | Navbar badge |
| `notification` | Device warnings | A timed-out or low-battery device already shows a small warning icon next to its name everywhere it appears; turning this on additionally pops up a toast notification for that timeout or low-battery condition as it happens. | Navbar / toasts |
| `center_popups` | Center popup dialogs | Forces every popup dialog to a fixed position centered in the browser window, instead of wherever Domoticz would otherwise place it (often near where you clicked). | All dialogs |
| `rgbw_popup` | Machinon color picker popup | Replaces Domoticz's own color picker dialog with a Machinon-styled one for color lights. On by default. Turning it off restores the original picker; the change takes effect after the page reloads. Lights with a relative dimmer keep the original picker. | Color light devices |
| `footer_text_disabled` | Hide the footer text | Hides the copyright line Domoticz prints at the bottom of every page. | Page footer |
| `floorplan_popup_details` | Expandable floorplan popups | Machinon hides Domoticz's own expand arrow on the small popup that opens when you click a device on a floorplan; turning this on restores that arrow, letting the popup expand to reveal Log and Notifications shortcuts and the favorite star. | Floorplan |

## Menus and navbar

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `custom_settings_menu` | Settings menu as tile grid | Replaces the Setup dropdown with a full-page grid of icon tiles, one per settings page, instead of a plain text list. | Setup menu |
| `navbar_icons` | Navbar icons | Machinon hides the small icon next to each navbar item's label by default; turning this on shows it. | Navbar |
| `navbar_icons_text` | Icon-only navbar (hide text) | Hides each navbar item's text label, leaving just its icon. Only takes effect while Navbar icons is also on: the CSS rule that hides the label ships as part of that setting's stylesheet, so with it off there's no icon to leave behind either. | Navbar |
| `custom_page_menu` | Custom menu page | Adds an extra item to the navbar that opens an embedded frame of an external URL you provide, filling Domoticz's main content area in place of any Domoticz page. | Navbar + new page |
| `button_name` | Custom page button name | Sets the label text on the custom menu page's navbar button. Only takes effect while Custom menu page is also on. | Navbar + new page |
| `custom_url` | Custom page URL | Sets the URL the custom menu page's embedded frame loads. Only takes effect while Custom menu page is also on. | Navbar + new page |
| `sidemenu` | Side menu on desktop | Switches desktop screens to the same collapsible side menu phones already use: a hamburger icon in the corner that slides a menu panel out from the side, replacing the horizontal navbar across the top. See [Mobile layouts](mobile.md) for the phone behavior this reuses. | Desktop layout |

## Dashboard

The five settings below only affect the **classic** Domoticz dashboard, the grid-of-cards layout
that predates Domoticz's newer drag-and-drop dashboard. Current Domoticz installations default
to the drag-and-drop dashboard, so on a fresh install these five settings have no visible effect
at all until you switch back: open **My Profile** (from the **Other** menu, or your username menu
on an admin login) and turn off **Use dynamic dashboard**. Confirmed against the running test
instance: with the dynamic dashboard on, none of these five settings changes anything visible;
switching to the classic dashboard makes all five apply exactly as described below.

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `dashboard_show_last_update` | Last-seen line on dashboard cards | Shows each device's last-updated time as a small line on its dashboard card; without it, that line exists in the markup but stays hidden. | Classic dashboard |
| `dashboard_columns` | Column layout on wide screens | On screens 1200px and wider, arranges the dashboard's category sections (Lights and switches, Weather, and so on) into a row of side-by-side columns sharing the available width, instead of stacking every section full width down the page. | Classic dashboard |
| `dashboard_camera` | Camera previews on the dashboard | Adds live camera thumbnails to the dashboard, refreshed on an interval. Its own two settings below control where they appear and how often they refresh. | Classic dashboard |
| `dashboard_camera_refresh` | Camera preview refresh (seconds) | Sets how many seconds pass between refreshes of each camera thumbnail. Only takes effect while Camera previews on the dashboard is also on. | Classic dashboard |
| `dashboard_camera_section` | Dedicated cameras section | When on, groups every enabled camera into its own "Cameras" section at the top of the dashboard. When off, each camera's preview instead replaces that device's own status text wherever the device already appears on the dashboard. Only takes effect while Camera previews on the dashboard is also on. | Classic dashboard |

## Device cards

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `time_ago` | Relative times | Shows a device's last-updated timestamp as a relative phrase like "5 minutes ago" instead of the raw date and time. | All device pages |
| `fade_off_items` | Dim off devices | Fades the card of any device that's currently off to a dimmer opacity, so devices that are on stand out at a glance. | All device pages |
| `switch_instead_of_bigtext` | Toggles instead of status text | Replaces the plain "On"/"Off" status text on a simple switch's card with a slider-style toggle you can flip directly from the card. | Device + scene cards |
| `switch_instead_of_bigtext_scenes` | Also toggles on scene cards | Extends the same slider toggle to Scene and Group cards. Only takes effect while Toggles instead of status text is also on: the code and styling that build the toggle ship together as one feature, so with the parent off, no toggle is built for scene cards either. Confirmed live: with the parent off and this setting on, scene cards fall back to plain status text and the browser's console logs a script error, rather than the toggle silently failing to appear. | Device + scene cards |
| `wind_direction` | Wind arrow points where the wind goes | Domoticz reports the direction wind comes FROM and points its arrow that way by default; turning this on swaps in Machinon's own mirrored arrow art so the arrow instead points at where the wind is blowing TO, while the compass label (N, SW, and so on) keeps showing the reported origin. | Wind device cards |
| `icon_image` | Device photos instead of icons | For an individual device that has a custom photo assigned (a per-device choice made elsewhere, not a global one), shows that photo as its card icon instead of the normal on/off icon. | Device cards |
| `card_min_width` | Card min width | Sets the narrowest a device card is allowed to shrink to, in pixels, before the grid wraps to fewer columns. | All card grids |
| `card_max_width` | Card max width | Sets the widest a device card is allowed to stretch to, in pixels, when there's spare room in the row. | All card grids |

## Charts and log

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `log_plot_bands` | Range bands in log graphs | Draws the colored threshold bands you configured in a device's Bar Ranges dialog onto its Log page chart as well. Domoticz itself only draws those bands on the card strip and Dynamic Dashboard widgets, never on the chart. See [Bar ranges](bar-ranges.md). | Device log charts |

## Background and branding

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `background_img` | Background image | Sets the image used as the whole UI's page background, painted behind every page. Leave it empty for no background image. | Whole UI |
| `background_type` | Background type | Chooses how the background image is displayed: stretched and cropped to fill the whole screen (cover), or tiled at its original size to repeat as a pattern. | Whole UI |
| `logo` | Custom logo | Sets an alternate image to use as the navbar logo, in place of Machinon's default. | Navbar |
| `hide_logo` | Hide logo | Hides the navbar logo image entirely, leaving that space empty. | Navbar |

## Colors and schemes

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `scheme` | Color scheme | See [Color schemes](color-schemes.md). | Whole UI |
| `custom_color_scheme` | Custom colors | See [Color schemes: building your own colors](color-schemes.md#building-your-own-colors). | Whole UI |

## Icon packs

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `iconpacks` | Icon packs | See [Icon packs](icon-packs.md). | Device icons |

## About

| Key | Setting | What it does | Applies to |
|---|---|---|---|
| `about` | About Machinon | See [Theme Hub: the nine groups](theme-hub.md#the-nine-groups) for what the About tab covers. | Theme |
