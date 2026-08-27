# Installation

## Requirements

- A running Domoticz installation: Domoticz 2025.2 or newer. Machinon is developed against the
  latest Domoticz beta, so that's the recommended version to run it on. The Setup menu, and the
  Theme Hub entry inside it (see [Theme Hub](theme-hub.md)), is visible to admin users only, on
  both stable and beta releases; non-admin logins have a separate path to it, covered on that
  same page.
- A browser you can hard-refresh (Ctrl+Shift+R), since you'll need to do that once after
  installing or updating the theme.

## Installing Machinon

Pick one of the five options below. Option 1 is recommended for most users; Option 3 installs and updates from inside Domoticz with no terminal.

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

### Option 3: PyPluginStore

[PyPluginStore](https://github.com/adrighem/PyPluginStore) installs themes and plugins from a
catalogue inside Domoticz, and Machinon is listed in it, so you can install and update the theme
without a terminal. Install PyPluginStore following its own instructions, then find Machinon in
its list and install it.

It refreshes the theme by resetting to the published branch rather than a plain `git pull`, so it
keeps working across releases, including the v2.0.0 history rewrite.

### Option 4: Theme Manager plugin (optional)

The [Theme Manager plugin](https://github.com/galadril/domoticz-theme-manager) can also install
Machinon. It installs the full source repository rather than the lean dist build, so Option 1
loads faster if you don't need the plugin for other themes. Machinon's listing in Theme Manager is
still being finalised, so you may need to point it at this repository manually for now.

To update, use Theme Manager's own update flow; see that plugin's documentation.

### Option 5: full source (developers)

```
cd domoticz/www/styles
git clone https://github.com/domoticz/Machinon.git machinon
```

The source loads around 27 separate CSS files rather than one flattened file. That's fine for
development, where you want to edit and reload individual files, but it's slower than the dist
build for everyday use. To update, run `git pull` inside the `machinon` folder, the same as
Option 1.

## Activating the theme

None of the five install options above make Machinon the active theme by themselves; they only
put the files in place. To switch to it:

1. In Domoticz, open the **Setup** menu in the navbar and choose **Settings**.
2. On the **System** tab (the tab that opens by default), find the **Theme** dropdown under
   **User Interface** and select `machinon`.
3. Click **Apply Settings**. On a desktop screen it's the red button next to the row of tabs at
   the top of the page; narrower than 767 pixels (see [Mobile layouts](mobile.md)), Machinon pins
   it to a bar fixed to the bottom of the screen instead.

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
The Theme Manager plugin (Option 4) also installs a git clone under the hood, so it breaks the
same way; remove and reinstall through Theme Manager too. PyPluginStore (Option 3) resets to the
published branch, so it updates cleanly across the rewrite with no manual step.

Nothing needs migrating: all of your theme settings live in Domoticz itself, not in the theme
folder, so a clean reinstall picks them up automatically. See [Theme Hub](theme-hub.md) for how
that storage works.
