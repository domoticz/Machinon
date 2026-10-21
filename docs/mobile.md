# Mobile layouts

Machinon adapts every page to smaller screens rather than just shrinking the desktop layout, and
it does that in two separate steps as the window narrows, not one. Widen or narrow your browser
window past 979 pixels and the navigation bar itself changes; keep narrowing past 767 pixels and
a further set of pages, forms and dialogs adapts on top of that. A tablet held between those two
widths sees only the first change, not the second, so which one applies to you depends on exactly
how narrow the screen is.

## The compact mobile dashboard

On a phone, Domoticz doesn't show you the same dashboard as on desktop, scaled down. It
automatically switches to its own compact mobile dashboard: your favorite devices, listed as
rows with their controls right beside them, so you can flip a switch or check a sensor without
opening the device.

![Machinon compact mobile dashboard](screenshots/mobile-dashboard-compact.png)

Domoticz's compact mobile dashboard, which lists your favorite devices as rows with their
controls beside them. Domoticz picks this layout automatically on a phone.

The regular card dashboard is still there if you reach it another way, for example by widening
the window past the phone breakpoint or opening it on a tablet; on a narrow screen it stacks into
a single column instead of a grid.

![Machinon dashboard on a mobile screen](screenshots/mobile-dashboard.png)

The dashboard on a phone, with the cards stacked into a single column.

## Other pages on a phone

Every page in Domoticz gets the same mobile treatment, not just the dashboard: cards and tables
stack into a single column, and controls stay full-width and easy to tap.

![Switches page on a mobile screen](screenshots/mobile-switches.png)

The Switches page.

![Temperature page on a mobile screen](screenshots/mobile-temperature.png)

The Temperature page.

![Utility page on a mobile screen](screenshots/mobile-utility.png)

The Utility page.

![The Theme Hub's Colors and schemes tab on a phone in light mode](screenshots/mobile-theme-hub-colors.png){ width="390" height="844" loading=lazy }
![The same tab on a phone in dark mode](screenshots/mobile-theme-hub-colors-dark.png){ width="390" height="844" loading=lazy }

The Theme Hub's Colors and schemes tab with Follow device selected, on a phone in light mode and
on one in dark mode. The cards stack into one column.

![Device graph on a mobile screen](screenshots/mobile-device-graph.png)

A device's Log page, with the chart scaled to fit the screen.

## The light/dark switch in the menu

Once the menu bar has collapsed into the hamburger icon (below 980 pixels wide, see below), the
sun and moon switch moves from the header into the menu. Tap the hamburger and the switch is at
the top right, on the row with the close button. Tap it to flip this device between the light
and the dark version of your theme; the filled half shows the version on screen.

![The phone menu open, with the light/dark switch at its top right](screenshots/mobile-menu-mode-toggle.png){ width="390" height="844" loading=lazy }

Like the header switch on a larger screen, a tap changes only this device and saves nothing to
Domoticz. See [Color schemes: the light/dark switch](color-schemes.md#the-lightdark-switch) for
how long a tap lasts and how to turn the switch off.

## At 979px: the navigation bar switches

Once the window narrows past 979 pixels, the horizontal menu bar collapses into a hamburger icon
in the top-left corner, and pages that don't fit a narrow screen switch to a stacked,
single-column layout instead of trying to squeeze the desktop one down. This is the change a
tablet in portrait orientation typically sees.

The full horizontal menu is still showing at 980 pixels wide, and the hamburger icon has fully
replaced it by 960 pixels; the switch itself happens at 979.

## At 767px: forms, tables, search and the Settings page adapt further

Narrower than 767 pixels, roughly phone width, a further set of changes kicks in on top of the
979px one above. A tablet that stays wider than this generally doesn't see this second set at
all.

- The search box collapses to a small icon and expands when you tap it, rather than sitting open
  in the navigation bar all the time. Checked live: the search box is still open at 768 pixels
  wide, and fully collapsed at 767.
- Tables inside dialogs wrap their text instead of running wide and needing to scroll sideways.
- Edit forms (for devices, and similar dialogs) stack each field's label above the field, instead
  of placing them side by side, so the field itself can use the full width.
- The Settings page's tile grid (the one behind the Setup menu) packs its icons into narrower
  tiles so more of them fit on screen at once; their labels stay put, just in a smaller tile.
  Checked live: the tiles measure 250 pixels wide down to 768 pixels, and drop to 100 pixels wide
  at 767. (How many actually fit per row at a given width also depends on how much horizontal
  space the page has around the grid, not on the tile width alone, so that's deliberately left
  out here.)
- The Settings page's **Apply Settings** button also changes position here: instead of sitting at
  the top right next to the row of tabs (see [Troubleshooting and
  FAQ](troubleshooting-and-faq.md#the-theme-is-selected-but-nothing-changed) for where it
  normally is), it moves to a bar along the bottom of the screen, below the settings, so it stays
  reachable without scrolling back up.
