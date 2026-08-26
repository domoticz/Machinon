<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/machinon/brand/wordmark-dark.svg">
    <img alt="Machinon" src="images/machinon/brand/wordmark-light.svg" width="300">
  </picture>
</p>

A modern, responsive theme for [Domoticz](https://www.domoticz.com/).

**[domoticz.github.io/Machinon](https://domoticz.github.io/Machinon/)**: screenshots, a live
color scheme preview, and the full manual.

![Version](https://img.shields.io/badge/dynamic/json.svg?label=Version&url=https%3A%2F%2Fraw.githubusercontent.com%2Fdomoticz%2FMachinon%2Fmaster%2Ftheme.json&query=version&colorB=blue)

![Machinon dashboard, light scheme](docs/screenshots/dashboard-light.png)

## What is Machinon

Machinon gives your Domoticz dashboard a clean, modern look, with matching light and dark modes, a choice of color schemes, a refreshed icon set, and one Theme Hub settings page inside Domoticz where you control all of it.

It works with current Domoticz beta and stable releases.

## Highlights

- **Color schemes**: eight built in, Machinon's own light and dark default plus Gruvbox, Magenta, and Paper each in a light and dark variant, plus a custom color picker in the Theme Hub's "Colors and schemes" tab if you want to design your own palette and save it as a preset.

  ![Dark magenta color scheme](docs/screenshots/dashboard-magenta-dark.png)

- **Theme Hub**: every theme setting lives on one dedicated settings page, reachable from Domoticz's Setup menu once the theme is active.

  ![Theme Hub settings page](docs/screenshots/theme-hub.png)

- **Refreshed icon set**: a library of over 250 device icons, install just the ones you want onto individual devices straight from the Theme Hub's built-in pack installer.

  ![Icon pack installer in the Theme Hub](docs/screenshots/icon-packs.png)

- **Mobile-polished layouts**: dashboards, menus, and dialogs adapt to small screens instead of just shrinking the desktop layout.

  <details>
  <summary>Machinon on a phone</summary>

  ![Machinon dashboard on a mobile screen](docs/screenshots/mobile-dashboard.png)

  The dashboard on a phone, with the cards stacked into a single column.

  ![Machinon compact mobile dashboard](docs/screenshots/mobile-dashboard-compact.png)

  Domoticz's compact mobile dashboard, which lists your favorite devices as rows with their controls beside them. Domoticz picks this layout automatically on a phone.

  ![Switches page on a mobile screen](docs/screenshots/mobile-switches.png)

  The Switches page.

  ![Temperature page on a mobile screen](docs/screenshots/mobile-temperature.png)

  The Temperature page.

  ![Utility page on a mobile screen](docs/screenshots/mobile-utility.png)

  The Utility page.

  ![Device graph on a mobile screen](docs/screenshots/mobile-device-graph.png)

  A device's Log page, with the chart scaled to fit the screen.

  </details>

- **Light and dark variants**: every color scheme ships both, so the whole interface follows your preference.

  ![Machinon dashboard, dark scheme](docs/screenshots/dashboard-dark.png)

- **Fast loading**: releases are packaged so the theme loads quickly, especially on slower connections.

<details>
<summary>More screenshots</summary>

![Switches page](docs/screenshots/switches.png)

The Switches page, showing lights, sensors, and other on/off devices as cards.

![Utility page](docs/screenshots/utility.png)

The Utility page, listing counters and usage devices like electricity, gas, and water. The colored strips along the card tops are Bar Ranges, per-device thresholds you set yourself; see [Bar ranges](https://domoticz.github.io/Machinon/docs/bar-ranges/) in the manual.

![Floorplan page](docs/screenshots/floorplan.png)

The Floorplan page, with live device icons and readings placed on your home's plans.

![Weather page](docs/screenshots/weather.png)

The Weather page, with wind, rain, pressure, and sun readings.

![Device graph](docs/screenshots/device-graph.png)

A device's Log page. The colored background zones are the device's Bar Ranges, which Machinon draws on the charts as well, something the standard interface only shows on the cards.

</details>

## Requirements

- A running Domoticz installation: Domoticz 2025.2 or newer, latest beta recommended. The theme is developed against the beta. The Setup menu, and the Theme Hub entry inside it, is visible to admin users only, on both stable and beta; non-admin logins have a separate path to it, see [Theme Hub](https://domoticz.github.io/Machinon/docs/theme-hub/) in the manual.
- A browser you can hard-refresh (Ctrl+Shift+R) after installing or updating the theme.

## Installation

Pick one of the four options below. Option 1 is recommended for most users.

### Option 1: dist branch (recommended)

The leanest install: just the built theme, no source files.

```
cd domoticz/www/styles
git clone -b dist --single-branch https://github.com/domoticz/Machinon.git machinon
```

In Domoticz, go to Setup > Settings, open the System tab, and find the Theme dropdown under User Interface. Pick `machinon`, then click Apply Settings (top right next to the row of tabs on a desktop screen, or a bar fixed to the bottom of the screen on a phone) to save the choice, and hard-refresh your browser (Ctrl+Shift+R) so it picks up the new files. No Domoticz restart is needed.

To update later, run `git pull` inside the `machinon` folder.

### Option 2: release zip

Download `machinon-<version>.zip` from the [GitHub Releases page](https://github.com/domoticz/Machinon/releases) and unzip it into `domoticz/www/styles/` (the zip already contains a `machinon/` folder, so you don't need to create one). Select the theme in Domoticz and hard-refresh your browser, as in Option 1.

To update, download and unzip the next release the same way.

### Option 3: Theme Manager plugin

The [Theme Manager plugin](https://github.com/galadril/domoticz-theme-manager) can install Machinon for you. It installs the full source repository rather than the lean dist build, so Option 1 loads faster if you don't need the plugin for other themes too.

### Option 4: full source (developers)

```
cd domoticz/www/styles
git clone https://github.com/domoticz/Machinon.git machinon
```

The source loads around 27 separate CSS files rather than one flattened file. That's fine for development, where you want to edit and reload individual files, but it's slower than the dist build for everyday use.

## Updating from 1.x

Machinon's repository history was rewritten for the v2.0.0 release. If you have a pre-2.0 clone, `git pull` inside it will fail because the histories no longer share a common base.

To update, delete the old `machinon` folder and reinstall using Option 1 or Option 2 above. Theme Manager (Option 3) installs are also git clones under the hood, so they break the same way; remove and reinstall through Theme Manager too.

Nothing needs migrating: all of your theme settings live in Domoticz itself and your browser, not in the theme folder, so a clean reinstall picks them up automatically. The in-app update notification links to the [Releases page](https://github.com/domoticz/Machinon/releases) whenever a newer version is available.

## Theme settings

Once Machinon is active, open the Theme Hub from the Domoticz Setup menu to configure it. From there you can choose a color scheme, set custom colors in the "Colors and schemes" tab, and turn individual features on or off.

This README only covers the basics. See the [settings reference](https://domoticz.github.io/Machinon/docs/settings-reference/) in the full manual for every setting explained in detail.

## Cache problems

Most issues after updating Domoticz or the theme go away after a hard refresh (Ctrl+Shift+R) or clearing your browser's cache. If you want a quick way to check whether caching is the culprit, open the site in an incognito or private window first.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for issue and contribution guidelines.

The theme's source CSS is modular, split into feature files under `css/` and assembled through a one-level `@import` rule (see the top of `custom.css`). Guard scripts under `scripts/` check things like token usage and typography, and CI runs them on every push. The styling itself is driven by a design-token system (the `--dz-*` custom properties) documented in [DESIGN.md](DESIGN.md).

## Credits and license

Machinon was originally created by [EdddieN](https://github.com/domoticz/Machinon) and is now maintained by the Domoticz community.

Icons by [Icons8](https://icons8.com); see [NOTICE](NOTICE) for full attribution. Fonts: Inter, JetBrains Mono, and Ionicons (see [NOTICE](NOTICE) for licenses).

Machinon is licensed under the GPL v3; see [LICENSE.txt](LICENSE.txt).
