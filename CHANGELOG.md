# Changelog

User-visible changes to the Machinon theme. New entries go under Unreleased as one-liners when a change lands; at release time they move into a version section, which also becomes the GitHub release notes. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- New "Create a theme" button in Settings > Theme > Colors: pick one or two colours and a look, and Machinon generates a matching light and dark theme with readable, contrast-checked colours throughout.
- Colours can now be picked with a colour wheel or by typing a hex value, in the theme wizard and the custom colour editor, which previously depended on the browser's own picker and was very limited in some mobile browsers.

### Fixed

- On a Domoticz version that predates Domoticz's own built-in theme-settings storage, theme settings no longer silently fail to save once you have saved several custom colour themes or a lot of custom icons. It looked like a normal save, until the settings disappeared the next time you opened the theme in another browser or cleared your cache. Saves now use a method with no such limit.
- If a save of your theme settings to Domoticz fails for any reason, including a permissions problem, you are shown a message instead of losing your settings silently.
- With **Icon style** set to Font Awesome glyphs, the device icon on each row of **Setup > Devices** is readable on the dark colour schemes. For a device you can switch on or off, that icon was drawn almost black against the dark row.
- The small icon preview beside the **Change...** button, when you edit a device's icon, follows your colour scheme instead of staying Domoticz's fixed blue.
- The arrows that page between floorplans are readable on the light colour schemes and follow your accent. They were a white chevron on a translucent grey panel that all but vanished over a light floorplan; they are now a solid accent button with a soft shadow, matching the floating menu button.
- The icon picker Domoticz opens when you assign an icon to a device follows your colour scheme. On the light schemes not one icon in it had a readable name: the names under the icons, the counts beside each icon source, the search box and the window title were all drawn in colours meant for a dark dialog. The picker now matches the theme's other dialogs, and its icons, chips and selected source take your scheme's accent. (#209)

## [2.2.1] - 2026-08-29

### Fixed

- The icons Domoticz now draws as glyphs rather than pictures follow your colour scheme again. Device, blinds and scene icons, the action buttons in the Devices and Users tables, the trend arrows, the battery indicator and the favourite star kept Domoticz's own fixed blue, grey, green, amber and red whichever scheme you had chosen, and several were too faint to read on the light schemes. (#207)
- The coloured icons on the Dynamic Dashboard follow your colour scheme. On the light schemes the energy arrows, sun, bolt, plug, flame and water drop kept the colours meant for a dark background and were washed out against the white card, and the sunrise and sunset icons had the same problem. The icons in the widget library, which were close to invisible on a light scheme, and the show/hide and kiosk buttons in the dashboard toolbar are readable too. (#208)
- With the new **Settings > System > Icon style** set to "Font Awesome glyphs", every entry in the menu bar drew two icons at once, the classic picture and the new glyph side by side. Each entry shows a single icon again, in both icon styles. (#207)
- Your custom page button in the menu bar now follows the **Icon style** setting like every other entry. With Font Awesome glyphs chosen it was the one picture icon left in a row of glyphs. Turning the theme's own **Navbar icons** setting off now also hides the menu icons in that style; it was only hiding them in the classic one.

### Changed

- The manual explains the new **Icon style** setting: what picking Font Awesome glyphs instead of classic images changes, and that an icon you assigned to a device yourself keeps showing either way. The steps for assigning an icon are updated for Domoticz's new icon picker.

## [2.2.0] - 2026-08-27

### Fixed

- Submenu links on the Settings page (the tiles with a fly-out list, such as Data Push) are now readable when you hover them. On a dark theme the hovered link used to turn dark and disappear; it now highlights the whole row like the device card menu, in both light and dark themes. (#205)
- The "Create Virtual Sensors" button on the Setup > Hardware page no longer shows a shadow on its text, and now matches the size and shape of the theme's other buttons. (#204)
- A text device that has a custom icon now shows its text on the Dynamic Dashboard. It was appearing as an on/off switch with no text at all, on the Device, Favorites and Room widgets. Text devices using the standard icon were never affected, and the Utility page, the dashboard and the mobile cards always showed the text correctly. (#203)
- Selected table rows now use a soft accent tint with an accent edge, so in-row buttons stay readable. (#206)

### Changed

- The Theme Hub tab for device icons is now called **Icons** (previously "Icon packs"), with clearer wording throughout: it is a library you browse to install individual icons onto individual devices, not an all-or-nothing pack. What it does is unchanged.
- The top header has a new look: a coloured brand bar carrying the refreshed Machinon logo, above the menu, instead of the old blue gradient. The logo takes on your colour scheme, and the search box and menu button read clearly on the bar in both light and dark. Scrolling down lifts the menu button into a tidy floating button. A custom logo you have uploaded is unchanged, and Hide logo still works.
- The theme downloads about 600 KB less. It shipped its icon font in five different file formats, kept for browsers that predate the theme's own requirements by years, and now ships only the one every browser actually uses. Nothing looks different.
- The theme's images and icon pack are about 3.2 MB smaller. 0.4 MB of that is the images every page uses, which is what makes the theme load quicker; the other 2.8 MB is the icon pack, which only downloads when you open the Icon packs tab or install an icon. Nothing looks different: every icon is the same picture, stored more efficiently.
- Icons you already installed from the pack now show a blue refresh button on their card in the Icon packs tab. Install / update all brings them all up to date in one go. Refreshing is optional and changes nothing you can see.
- Dynamic Dashboard widget panels now carry the same soft drop shadow as the device cards, so both dashboards look consistent. Add-ons that follow the Domoticz theme, such as the PyPluginStore plugin manager, also pick up Machinon's card surface, elevation and hover colours now instead of falling back to their own palette.
- Table rows now highlight when you hover over them.

## [2.1.2] - 2026-08-24

### Added

- The icon pack gains 17 new icons: power plant, renewable energy, geothermal, ceiling fan, desk fan, ceiling light, electric teapot, BBQ grill, fire alarm, Apple TV, Disney Plus, Amazon, Amazon Music, YouTube, YouTube Music, Spotify and Netflix. Fourteen come in both the Blue UI and Color styles; ceiling light, Amazon Music and YouTube Music are Blue UI only. Install them from the Icons tab under Setup > Settings.

### Changed

- The manual is now built with [Zensical](https://zensical.org/) instead of MkDocs and Material for MkDocs, which entered maintenance mode in November 2025. Every page renders identically; the no-external-requests guarantee and its CI guard are unchanged.
- The manual gains an anchor link on every heading, breadcrumbs inside Using the theme, previous/next links at the foot of each page, and click-to-zoom on every screenshot. Screenshots on the Color schemes page no longer navigate away to the raw image; they open in the same overlay as the rest.

### Fixed

- A link inside a Text or Alert device's data is now visible on the light color schemes. It was being drawn in white on a white card, so the link text disappeared while the rest of the device's text read fine. Fixed everywhere such a device is shown: the dashboard, the Utility page, the mobile cards and the Dynamic Dashboard's text, note and gauge widgets.
- The barometer reading on the Dynamic Dashboard's Barometer widget is readable on the light color schemes. It was drawn in white on a white card, unlike the temperature reading next to it.
- The Events page now follows the active color scheme. On the dark schemes its script list, open-file tabs and editor toolbar stayed a fixed light grey, and anything drawn on top of them disappeared: the round Expand all and Collapse all buttons showed no plus or minus at all, and the Disabled, A-, A+ and Help buttons showed no label. The code editor itself is unchanged: it keeps whatever editor theme you picked from the dropdown, so a light editor inside dark surroundings is still yours to choose.
- The arrow that collapses the device list on the Devices page is visible again on the dark color schemes. It was drawn in a dark grey on a dark background.
- The sun in the sunrise and sunset line is now the same color everywhere. Domoticz draws that line two different ways, and on the Events page the sun was a fixed bright yellow that was all but invisible on the light color schemes, instead of the themed sun the device pages show.
- Counter chips, such as the number of scripts in a folder on the Events page, are readable again. They were drawn in the page's normal text color on top of the accent color, which left dark text on a mid-blue chip in the light schemes and light text on it in the dark ones.
- On phones, the colored bar at the top of each dashboard section now reaches the top edge of its card. A thin strip of page background used to show above it, so the bar looked detached from the card it belongs to.
- On phones, the soft shadow around each dashboard card is no longer sliced off down its left and right sides. The card sat in a container exactly its own width, so only the shadow below it had room to show, which left a hard vertical edge beside every card.
- The Icon packs tab is now shown only to administrators. Installing an icon changes it for everyone using this Domoticz, so it is an administrator action, and other users were being offered an installer that could only fail. The rest of the Theme Hub is unchanged for them, and icons an administrator has installed still show on their devices.

## [2.1.1] - 2026-08-19

### Fixed

- Bar Ranges now show up on temperature, humidity and weather cards too, not only on utility cards. The colored strip was being wiped off those cards as the theme drew the "last seen" line.
- Dynamic Dashboard widgets and the mobile dashboard cards now have the same rounded corners as every other card in the theme; they were a shade squarer than the rest.
- The "Range bands in log graphs" setting now works on temperature, humidity and weather graphs as well, not just utility ones. On a device that has bands for more than one reading, each one is drawn against its own scale.
- Dial widgets on the Dynamic Dashboard are readable on the light color schemes: the scale numbers and tick marks around the dial were being drawn in white on a white card, so they were invisible. The dial face now follows your color scheme too.
- Small text on Dynamic Dashboard widgets that was invisible on light color schemes now reads properly: RSS excerpts, the weather forecast day names and labels, log times and calendar times.

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
