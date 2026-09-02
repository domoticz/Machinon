# Settings reference

This page explains every one of the 39 settings in the Theme Hub, one entry per setting,
grouped into the same nine tabs as the [Theme Hub](theme-hub.md). Two of those entries, the icon
library and the About panel, aren't settings in the toggle-or-value sense (see [Theme Hub:
personal settings versus shared settings](theme-hub.md#personal-settings-versus-shared-settings));
they're documented here for completeness alongside the 37 actual settings. If you're new to the
Theme Hub itself, its own page explains where to find it, what the nine groups cover, and how
personal settings differ from shared ones; this page is the per-setting detail it points at, not
a repeat of it.

**Personal versus shared:** most settings below are personal, some are shared. Rather than
repeat that explanation here, see [Theme Hub: personal settings versus shared
settings](theme-hub.md#personal-settings-versus-shared-settings) for what the distinction means
and how to tell the two apart in the Theme Hub itself.

**Parent and child settings:** a handful of settings only matter when another setting is also
turned on, for example Standby after (minutes) only matters while Screen standby is on. Every
setting below that depends on another one says so directly in its own description.

The Domoticz Setup menu, restyled as a grid of tiles, has its own address too:

```text
http://your-domoticz:8080/#/SetupMenu
```

Like `#/Theme`, this one exists only while Machinon is active.

## General

### Screen standby
<!-- key: standby -->

After a period with no clicks, taps, or mouse movement, the whole page fades to a plain dark
screen showing a large clock and today's date. Any click or tap brings the page straight back.
How long the quiet period is comes from "Standby after (minutes)" below, which only matters
while this is on.

### Standby after (minutes)
<!-- key: standby_after -->

Sets how many minutes of inactivity trigger screen standby. Only takes effect while Screen
standby is also on.

### Update notice
<!-- key: check_update -->

A few seconds after the page loads, checks Machinon's GitHub repository for a released version
newer than the one installed, and shows a small notice with a link to the release page if one
exists. It checks against the version that's actually been released, not whatever is
mid-development, so it never nags you about a version that isn't out yet. This is separate from
Domoticz's own app-update check.

### Sensor timeout warnings
<!-- key: warn_timeout -->

A timed-out sensor already shows a small warning icon next to its name everywhere it appears;
turning this on additionally pops up a message for that condition as it happens.

### Low battery warnings
<!-- key: warn_battery -->

A device reporting a low battery already shows a small warning icon next to its name everywhere
it appears; turning this on additionally pops up a message for that condition as it happens.

### Repeat device warnings
<!-- key: warn_repeat -->

Controls how often the same device may pop up its warning message again: **Once per visit**
shows it again after you reload the page; **Once a day** (the default) waits 24 hours before
repeating it; **Only when it changes** stays quiet until the problem clears and then comes back.
However you set this, a problem that clears and then comes back always warns again right away,
and the warning icon next to the device name is shown regardless of this setting. The quiet
period is remembered by the browser you're using, so a warning you've already seen on your
computer can still show up once on your phone.

### Center popup dialogs
<!-- key: center_popups -->

Forces every popup dialog, including plain message and confirmation popups, to a fixed position
centered in the browser window, instead of wherever Domoticz would otherwise place it (often
near where you clicked, and for a few dialogs, partly off the top of the screen).

### Machinon color picker popup
<!-- key: rgbw_popup -->

Replaces Domoticz's own color picker dialog with a Machinon-styled one for color lights. On by
default. Turning it off restores the original picker; the change takes effect after the page
reloads. Lights with a relative dimmer keep the original picker either way.

### Hide the footer text
<!-- key: footer_text_disabled -->

Hides the copyright line Domoticz prints at the bottom of every page. Nothing else on the page
moves or changes.

### Expandable floorplan popups
<!-- key: floorplan_popup_details -->

Machinon hides Domoticz's own expand arrow on the small popup that opens when you click a device
on a floorplan; turning this on restores that arrow, letting the popup expand to reveal Log and
Notifications shortcuts and the favorite star.

## Menus and navbar

### Settings menu as tile grid
<!-- key: custom_settings_menu -->

Replaces the Setup dropdown with a full-page grid of icon tiles, one per settings page, instead
of a plain text list.

### Navbar icons
<!-- key: navbar_icons -->

Machinon hides the small icon next to each navbar item's label by default; turning this on shows
it.

### Icon-only navbar (hide text)
<!-- key: navbar_icons_text -->

Hides each navbar item's text label, leaving just its icon. Only takes effect while Navbar icons
is also on, since without an icon showing there'd be nothing left after hiding the text.

### Custom menu page
<!-- key: custom_page_menu -->

Adds an extra item to the navbar. Clicking it loads a web page of your choosing inside
Domoticz's main content area, in place of whatever Domoticz page would normally show there.

### Custom page button name
<!-- key: button_name -->

Sets the label text on the custom menu page's navbar button. Only takes effect while Custom
menu page is also on. On a browser that has never loaded the page before, the button may briefly
show the default label until you reload once; after that it always shows your chosen text right
away.

### Custom page URL
<!-- key: custom_url -->

Sets the address the custom menu page loads. Only takes effect while Custom menu page is also
on. A change here takes effect the next time you open that page, no reload needed.

### Side menu on desktop
<!-- key: sidemenu -->

Switches desktop screens to the same collapsible side menu phones already use: a hamburger icon
in the corner that slides a menu panel out from the side, replacing the horizontal navbar across
the top. See [Mobile layouts](mobile.md) for the phone behavior this reuses.

## Dashboard

The five settings below only affect the **classic** Domoticz dashboard, the grid-of-cards layout
that predates Domoticz's newer drag-and-drop dashboard. Current Domoticz installations default
to the drag-and-drop dashboard, so on a fresh install these five settings have no visible effect
at all until you switch back: open **My Profile** (from the **Other** menu, or your username menu
on an admin login) and turn off **Use dynamic dashboard**. Confirmed against the running test
instance: with the dynamic dashboard on, none of these five settings changes anything visible;
switching to the classic dashboard makes all five apply exactly as described below.

### Last-seen line on dashboard cards
<!-- key: dashboard_show_last_update -->

Shows each device's last-updated time as a small line on its dashboard card; without it, that
line stays hidden.

### Column layout on wide screens
<!-- key: dashboard_columns -->

On screens 1200px and wider, arranges the dashboard's category sections (Lights and switches,
Weather, and so on) into a row of side-by-side columns sharing the available width, instead of
stacking every section full width down the page.

### Camera previews on the dashboard
<!-- key: dashboard_camera -->

Adds live camera thumbnails to the dashboard, refreshed on an interval. Its own two settings
below control where they appear and how often they refresh.

### Camera preview refresh (seconds)
<!-- key: dashboard_camera_refresh -->

Sets how many seconds pass between refreshes of each camera thumbnail. Only takes effect while
Camera previews on the dashboard is also on.

### Dedicated cameras section
<!-- key: dashboard_camera_section -->

When on, groups every enabled camera into its own "Cameras" section at the top of the dashboard.
When off, each camera's preview instead replaces that device's own status text wherever the
device already appears on the dashboard. Only takes effect while Camera previews on the
dashboard is also on.

## Device cards

### Relative times
<!-- key: time_ago -->

Shows a device's last-updated timestamp as a relative phrase like "5 minutes ago" instead of the
raw date and time.

### Dim off devices
<!-- key: fade_off_items -->

Fades the card of any device that's currently off to a dimmer opacity, so devices that are on
stand out at a glance.

### Toggles instead of status text
<!-- key: switch_instead_of_bigtext -->

Replaces the plain "On"/"Off" status text on a simple switch's card with a slider-style toggle
you can flip directly from the card, without opening the device. Works the same way whichever of
Domoticz's own icon styles you use, picture icons or Font Awesome glyphs.

### Also toggles on scene cards
<!-- key: switch_instead_of_bigtext_scenes -->

Extends the same slider toggle to Scene and Group cards. Only takes effect while Toggles instead
of status text is also on: the two ship as one feature, so with the parent off, scene and group
cards keep showing plain status text instead, nothing breaks either way.

### Wind arrow points where the wind goes
<!-- key: wind_direction -->

Domoticz reports the direction wind is coming FROM, and by default points a wind device's arrow
that way. Turning this on swaps in Machinon's own mirrored arrow so it instead points at where
the wind is blowing TO; the compass label next to it (N, SW, and so on) always keeps showing the
reported origin either way. This only affects the classic picture icons. If Domoticz's own
Setting > Icon style is set to Font Awesome glyphs instead (see [Icon
style](icons.md#icon-style-classic-images-or-glyphs)), the wind device shows a plain generic wind
glyph with no directional meaning at all, and this setting has no effect on it.

### Device photos instead of icons
<!-- key: icon_image -->

For an individual device that has a custom photo assigned (a per-device choice made elsewhere,
not a global one), shows that photo as its card icon instead of the normal on/off icon.

### Card min width
<!-- key: card_min_width -->

Sets the narrowest a device card is allowed to shrink to, in pixels, before the grid wraps to
fewer columns.

### Card max width
<!-- key: card_max_width -->

Sets the widest a device card is allowed to stretch to, in pixels, when there's spare room in
the row.

## Charts and log

### Range bands in log graphs
<!-- key: log_plot_bands -->

Draws the colored threshold bands you configured in a device's Bar Ranges dialog onto its Log
page chart as well. Domoticz itself only draws those bands on the card strip and Dynamic
Dashboard widgets, never on the chart. See [Bar ranges](bar-ranges.md).

## Background and branding

### Background image
<!-- key: background_img -->

Sets the image used as the whole UI's page background, painted behind every page. Leave it
empty for no background image.

### Background type
<!-- key: background_type -->

Chooses how the background image is displayed: stretched and cropped to fill the whole screen
(cover), or tiled at its original size to repeat as a pattern.

### Custom logo
<!-- key: logo -->

Sets an alternate image to use as the navbar logo, in place of Machinon's default.

### Hide logo
<!-- key: hide_logo -->

Hides the navbar logo image entirely, leaving that space empty.

## Colors and schemes

### Color scheme
<!-- key: scheme -->

See [Color schemes](color-schemes.md).

### Custom colors
<!-- key: custom_color_scheme -->

See [Color schemes: building your own colors](color-schemes.md#building-your-own-colors).

## Icons

### Icon Library
<!-- key: iconpacks -->

See [Icons](icons.md).

## About

### About Machinon
<!-- key: about -->

See [Theme Hub: the nine groups](theme-hub.md#the-nine-groups) for what the About tab covers.
