# Mobile layouts

Machinon adapts every page to smaller screens rather than just shrinking the desktop layout. The
main shift happens once your browser window (or phone, or tablet) narrows past 979 pixels wide:
the horizontal menu bar collapses into a hamburger icon, and pages that don't fit a narrow screen
switch to a stacked, single-column layout instead of trying to squeeze the desktop one down.

## The compact mobile dashboard

On a phone, Domoticz doesn't show you the same dashboard as on desktop, scaled down. It
automatically switches to its own compact mobile dashboard: your favourite devices, listed as
rows with their controls right beside them, so you can flip a switch or check a sensor without
opening the device.

![Machinon compact mobile dashboard](screenshots/mobile-dashboard-compact.png)

Domoticz's compact mobile dashboard, which lists your favourite devices as rows with their
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

![Device graph on a mobile screen](screenshots/mobile-device-graph.png)

A device's Log page, with the chart scaled to fit the screen.

## What else changes below 979px

Once the window is narrower than 979 pixels, a handful of other things adapt along with the
navigation bar and page layout:

- The search box collapses to a small icon and expands when you tap it, rather than sitting open
  in the navigation bar all the time.
- Notification toasts move to the left edge of the screen instead of the corner.
- Tables inside dialogs wrap their text instead of running wide and needing to scroll sideways.
- Edit forms (for devices, and similar dialogs) stack each field's label above the field, instead
  of placing them side by side.
- The Setup grid's icons shrink and drop their text labels, so more of them fit on screen.

On phone-width screens specifically (roughly 767 pixels and below), the Settings page's **Apply
Settings** button also changes position: instead of sitting at the top right next to the row of
tabs (see [Troubleshooting and FAQ](troubleshooting-and-faq.md#the-theme-is-selected-but-nothing-changed)
for where it normally is), it becomes a floating bar fixed to the bottom of the screen, so it
stays reachable without scrolling back up.
