# Installation

## Requirements

- A running Domoticz installation: Domoticz 2025.2 or newer. Machinon is developed against the
  latest Domoticz beta, so that's the recommended version to run it on. On stable Domoticz
  releases, the Theme Hub menu entry (see [Theme Hub](theme-hub.md)) is available to admin
  users.
- A browser you can hard-refresh (Ctrl+Shift+R), since you'll need to do that once after
  installing or updating the theme.

## Installing Machinon

Pick one of the four options below. Option 1 is recommended for most users.

### Option 1: dist branch (recommended)

The leanest install: just the built theme, no source files.

```
cd domoticz/www/styles
git clone -b dist --single-branch https://github.com/domoticz/Machinon.git machinon
```

To update later, run `git pull` inside the `machinon` folder.

### Option 2: release zip

Download `machinon-<version>.zip` from the [GitHub Releases
page](https://github.com/domoticz/Machinon/releases) and unzip it into
`domoticz/www/styles/`. The zip already contains a `machinon/` folder, so you don't need to
create one yourself.

To update, download and unzip the next release the same way; it overwrites the old files.

### Option 3: Theme Manager plugin

The [Theme Manager plugin](https://github.com/galadril/domoticz-theme-manager) can install
Machinon for you. It installs the full source repository rather than the lean dist build, so
Option 1 loads faster if you don't need the plugin for other themes too.

To update, use Theme Manager's own update flow; see that plugin's documentation. If a specific
version doesn't pull cleanly, remove and reinstall Machinon through Theme Manager, the same fix
described for the 1.x upgrade below.

### Option 4: full source (developers)

```
cd domoticz/www/styles
git clone https://github.com/domoticz/Machinon.git machinon
```

The source loads around 27 separate CSS files rather than one flattened file. That's fine for
development, where you want to edit and reload individual files, but it's slower than the dist
build for everyday use. To update, run `git pull` inside the `machinon` folder, the same as
Option 1.

## Activating the theme

None of the four install options above make Machinon the active theme by themselves; they only
put the files in place. To switch to it:

1. In Domoticz, open the **Setup** menu in the navbar and choose **Settings**.
2. On the **System** tab (the tab that opens by default), find the **Theme** dropdown under
   **User Interface** and select `machinon`.
3. Click **Apply Settings**, the red button next to the row of tabs at the top of the page.

!!! warning "The theme choice only persists once you click Apply Settings"
    Picking `machinon` from the dropdown previews it, but the choice is not saved to Domoticz
    until you click Apply Settings. Leaving the page, or refreshing before clicking it, discards
    the change and you'll still be on your previous theme.

4. Hard-refresh your browser (Ctrl+Shift+R).

!!! warning "A hard refresh is required"
    Browsers cache the old theme's files. A normal refresh (F5) often keeps serving them, so the
    page can look unchanged or broken after switching themes. Ctrl+Shift+R forces the browser to
    fetch Machinon's files fresh. Do this again after every theme update, for the same reason.

No Domoticz restart is needed for any of this.

## Upgrading from 1.x

Machinon's repository history was rewritten for the v2.0.0 release. If you have a pre-2.0
clone, `git pull` inside it will fail, because the old and new histories no longer share a
common base.

To update, delete the old `machinon` folder and reinstall using Option 1 or Option 2 above.
Theme Manager (Option 3) installs are also git clones under the hood, so they break the same
way; remove and reinstall through Theme Manager too.

Nothing needs migrating: all of your theme settings live in Domoticz itself, not in the theme
folder, so a clean reinstall picks them up automatically. See [Theme Hub](theme-hub.md) for how
that storage works.
