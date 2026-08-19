# Changelog

User-visible changes to the Machinon theme. New entries go under Unreleased as one-liners when a change lands; at release time they move into a version section, which also becomes the GitHub release notes. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Fixed

- Bar Ranges now show up on temperature, humidity and weather cards too, not only on utility cards. The colored strip was being wiped off those cards as the theme drew the "last seen" line.
- Dynamic Dashboard widgets and the mobile dashboard cards now have the same rounded corners as every other card in the theme; they were a shade squarer than the rest.
- The "Range bands in log graphs" setting now works on temperature, humidity and weather graphs as well, not just utility ones. On a device that has bands for more than one reading, each one is drawn against its own scale.

## [2.1.0] - 2026-08-18

### Added

- Three new icon families in both Blue UI and Color: Automatic (a framed gear, for auto-mode switches), Settings (a single gear) and Gears (a three-gear cluster).
- Three more icon families in both Blue UI and Color: Curtains (for curtain motors, alongside the existing Blinds), CO2 Gauge (for CO2 sensors) and Humidity Gauge (a dial reading, alongside the existing Hygrometer droplet).
- A Machinon-styled color picker dialog for color lights: it opens next to the device card (centered when the Center popup dialogs setting is on), with mode tabs, a color wheel, warmth, brightness and white-mix sliders and On/Off buttons (new theme feature, on by default; turn it off in the Theme Hub to get the original picker back).

### Changed

- Icon-pack icons you have already installed will offer a refresh in the Theme Hub. Every icon was re-cut from its original artwork, so the pictures are a touch cleaner (the difference is hard to see) and the corrected descriptions come with them. Refreshing is optional and nothing changes until you do.

### Fixed

- The battery voltage now shows up in the Dynamic Dashboard's Energy and Battery Status tiles; it was being drawn in white on a white card, so it looked like the reading was missing.
- On the Dynamic Dashboard, values like `0.809 m3` and `440 Liter` are no longer cut off in the Energy Dashboard's tiles: the tiles get the full page width, and a value that would not fit is drawn slightly smaller instead of being clipped.
- The device edit window is usable on a phone again: the fields fit, the Sensor Icon picker opens, and you can scroll down to the buttons.
- On a narrow dynamic dashboard tile, a selector device's dropdown no longer sits on top of the device icon: it now stays in its own half of the card.
- On a narrow dynamic dashboard tile, the device's value no longer prints on top of its name: the name gets the full first line and the value sits on the line below it, so both are readable and long names are no longer cut short.
- On a phone, a selector switch with enough levels to wrap onto a second line no longer loses the corner where the two lines meet; the rounded shape is drawn properly again.
- Icon pack descriptions match the icons again: twenty-one entries (Gate, Mood, Safe, Pet Bowl, Router and more) still promised green or red states that the redrawn icons no longer use, and another twenty-three read inconsistently or said nothing about their on and off states.
- The Color Mailbox icon now matches the Blue UI one: its empty state showed an open mailbox and its mail-waiting state showed a closed one, the wrong way round.

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
