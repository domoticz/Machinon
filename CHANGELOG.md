# Changelog

User-visible changes to the Machinon theme. New entries go under Unreleased as one-liners when a change lands; at release time they move into a version section, which also becomes the GitHub release notes. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [2.0.3] - 2026-08-16

### Added

- Machinon now has a website with a full manual at https://domoticz.github.io/Machinon/, covering installation, the Theme Hub, color schemes, icon packs, mobile layouts, every setting, and troubleshooting.
- The manual gained a Bar ranges guide (setting colored value bands on utility devices, and the theme's range bands on Log charts), and the README, manual, and website now show the floorplan and weather pages.
- The website's demo cards are more alive: the kitchen lights toggle, the hallway dimmer drags (its bulb switches off at 0%), and the card icons sit on the same left gutter as the real theme.

### Changed

- Device cards get their toggles, fade and icons right as they render instead of in one late redraw about a second after the page loads; options menus and "time ago" text follow within a beat.

### Fixed

- The Theme entry no longer intermittently disappears from the Setup and Other menus after a slow page load; the same fix restores the distinct Setup dropdown icons on those loads.
- Fresh installs no longer request three non-existent example icon images on every load (the custom-icons default list is now empty; your own stored icon settings are untouched).
- Device popups (color picker, setpoint, thermostat) now move back into view when the window is resized while they are open.

## [2.0.2] - 2026-08-14

### Fixed

- The theme now reports the version you actually have installed. After updating, the Theme Hub kept showing the previous version and you were repeatedly told a newer version was available, even though you already had it. Clearing your browser data was the only way around it.
- The update notice now only appears when the newer version has actually been released, and no longer appears if you are running a build newer than the latest release.

## [2.0.1] - 2026-08-14

### Fixed

- Dashboard device cards no longer run together into one continuous block in Chrome and Edge; they are spaced the same way in every browser.
- Selector switches with several options now fit on one row in Chrome and Edge instead of spilling onto a second line.

## [2.0.0] - 2026-08-14

Machinon returns with a full modernization. This release is a relaunch: new look, new settings experience, and a new, leaner way to install.

### Added

- Color schemes: Gruvbox, Magenta, and Paper, each in light and dark variants.
- Custom color picker with save-as-preset in the Theme Hub's "Colors and schemes" tab.
- Theme Hub: every theme setting on one page inside Domoticz, reachable from the Setup menu.
- Refreshed icon set with a built-in tabbed icon-pack installer (Blue UI, Color, Fun).
- Lean `dist` branch and release zip, built by CI on every release.

### Changed

- Mobile-polished layouts for dashboards, menus, and dialogs.
- Releases are packaged so the theme loads in one go, noticeably faster on slow connections.
- The in-app update notification now links to the Releases page.
- Repository slimmed: legacy server app and unused imagery removed from the tree and its history.

### Breaking

- The repository history was rewritten for this release: `git pull` in a pre-2.0 install fails. Delete the old `machinon` folder and reinstall (see the README's install options); Theme Manager installs need a remove and re-add. Theme settings are stored in Domoticz and the browser, so nothing is lost.
