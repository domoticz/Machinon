Machinon issue and contributing Guidelines
==========================================

### Issue Guidelines

Bugs and feature requests belong in this repository's GitHub Issues. The [forum thread](https://forum.domoticz.com/viewtopic.php?t=45132) is for discussion: questions, how-to, and showing what you built with the theme.

Before opening an issue:

* Search the existing issues, open and closed. Yours may already be reported or answered.
* Update to the latest Machinon release and check whether the problem still happens.
* State both versions: the theme's (Theme Hub, About tab) and your Domoticz version.
* Include a screenshot of what you see. If something is broken rather than merely ugly, add the browser console output, which is usually where a theme problem shows up.

Pull requests target the `master` branch.

### Development setup

Clone the full source (Option 4 in the README):

```
cd domoticz/www/styles
git clone https://github.com/domoticz/Machinon.git machinon
```

The clone must live at `domoticz/www/styles/machinon`; Domoticz only finds themes in that folder. Select Machinon as the active theme in Domoticz (see the README's Installation section for the exact steps) before you start editing, otherwise your changes have no page to show up on.

The source CSS is modular: `custom.css` at the repo root pulls in the individual files
under `css/` through a single level of `@import` statements (see the ONE-LEVEL IMPORT
RULE comment at the top of `custom.css` for why the chain stays flat). Edits are plain
files, so there is no build step to run while developing; save a file and hard-refresh
the browser to see the change.

`DESIGN.md` is the source of truth for design tokens (colors, type scale, spacing, radius); `scripts/check-tokens.sh` and `scripts/check-typography.sh` fail when the CSS drifts from what it documents, so update `DESIGN.md` in the same edit as any token change.

### Checks

Before opening a PR, run the guard suite and the build check locally. Install the pinned dev tools first with `pip install -r requirements-dev.txt`. CI runs the same commands on every push, so a clean local run means CI will be clean too:

```
scripts/check-typography.sh && scripts/check-buttons.sh && scripts/check-shadows.sh && scripts/check-menus.sh && scripts/check-tokens.sh
scripts/build-dist.sh --check
python3 -m pytest scripts/test_strip_comments.py -q
scripts/build-release.sh
```

`scripts/build-release.sh` mirrors the packaging step the release workflow runs, so a
clean local run there means the eventual release build will also succeed.

One check cannot run in CI: `~/docker/domoticz-test/scripts/dz-repair-live.js` needs a running
Domoticz with the theme bind-mounted. It is the only thing that checks the live colour-scheme
wiring - that no shipped scheme's colours move, and that hand-built and generated palettes are
repaired - so run it by hand if you touch `src/js/scheme.js`, `src/js/color-repair.js` or
`css/toasts.css`.

### Settings key lookup

Each setting's name in the [settings reference](docs/settings-reference.md) is its on-screen
Theme Hub label. That page never shows the name it's stored under; if you're comparing a backup,
a support request, or Domoticz's own device debug output against what the Theme Hub shows, use
the table below, generated from `src/js/theme-manifest.js` in manifest order, to look up the
label for a storage key or vice versa. `scripts/check-settings-docs.py` keeps this in sync with
the manifest and the reference page two ways: it fails if a manifest key has no `<!-- key: -->`
anchor in `docs/settings-reference.md`, and it fails if an anchor names a key the manifest no
longer has.

| Storage key | On-screen label |
|---|---|
| `standby` | Screen standby |
| `standby_after` | Standby after (minutes) |
| `check_update` | Update notice |
| `warn_timeout` | Sensor timeout warnings |
| `warn_battery` | Low battery warnings |
| `warn_repeat` | Repeat device warnings |
| `center_popups` | Center popup dialogs |
| `rgbw_popup` | Machinon color picker popup |
| `footer_text_disabled` | Hide the footer text |
| `floorplan_popup_details` | Expandable floorplan popups |
| `custom_settings_menu` | Settings menu as tile grid |
| `navbar_icons` | Navbar icons |
| `navbar_icons_text` | Icon-only navbar (hide text) |
| `custom_page_menu` | Custom menu page |
| `button_name` | Custom page button name |
| `custom_url` | Custom page URL |
| `sidemenu` | Side menu on desktop |
| `dashboard_show_last_update` | Last-seen line on dashboard cards |
| `dashboard_columns` | Column layout on wide screens |
| `dashboard_camera` | Camera previews on the dashboard |
| `dashboard_camera_refresh` | Camera preview refresh (seconds) |
| `dashboard_camera_section` | Dedicated cameras section |
| `time_ago` | Relative times |
| `fade_off_items` | Dim off devices |
| `switch_instead_of_bigtext` | Toggles instead of status text |
| `switch_instead_of_bigtext_scenes` | Also toggles on scene cards |
| `wind_direction` | Wind arrow points where the wind goes |
| `icon_image` | Device photos instead of icons |
| `card_min_width` | Card min width |
| `card_max_width` | Card max width |
| `log_plot_bands` | Range bands in log graphs |
| `background_img` | Background image |
| `background_type` | Background type |
| `logo` | Custom logo |
| `hide_logo` | Hide logo |
| `scheme` | Color scheme |
| `custom_color_scheme` | Custom colors |
| `iconpacks` | Icon Library |
| `about` | About Machinon |

### Changelog

Every user-visible change adds a one-line entry under `## [Unreleased]` in `CHANGELOG.md`, in the same commit or pull request as the change itself. Those lines become the next release's notes, so write them for theme users, not developers.

When the change fixes something tracked in an issue, link the issue at the end of that line: `(#123)`. Because the line becomes a release note, GitHub turns the number into a link in both the changelog and the release, and the issue itself records who reported it and the full context. Prefer this to crediting a reporter with `@handle`: an `@mention` in a release adds that person to the release's Contributors list and notifies them, which we avoid. For a fix we found ourselves or that has no issue, leave it off.

### Releasing

This section is for maintainers cutting a release. The steps must happen in this order:

1. Bump `version` in `theme.json`, and in `CHANGELOG.md` move the `Unreleased` lines into a new `## [<version>] - <date>` section.
2. Commit the version bump and changelog roll together.
3. Tag the commit `v<version>`, matching the `theme.json` version exactly; the release
   workflow checks this, and that `CHANGELOG.md` has a section for the version, and
   fails the release if either disagrees.
4. Push `master` and the tag.
5. Publish a GitHub Release for the tag. The release workflow then builds the lean
   `machinon-<version>.zip`, attaches it to the release, and updates the `dist` branch
   automatically.

Never hand-edit the `dist` branch or release assets; they are generated by the release
workflow and any manual change will be overwritten by the next release.

Screenshots in `docs/screenshots/` are used by both the manual and the landing
page under `site/`. A visual change to the theme therefore invalidates two
consumers at once. Before cutting a release, check whether any shipped change
makes a screenshot wrong, and recapture it if so.

### Writing comments in the theme

Machinon styles a UI it does not own. Many of its rules exist because of something in
Domoticz core rather than because of a preference, and that reason is invisible in the
code. An unexplained rule looks arbitrary, gets simplified away, and the bug it prevented
comes back. Comments exist to stop that.

Write a comment only when the code cannot say it. Restating a rule in prose is noise.
Three kinds are worth writing:

* An invariant that other rules depend on. Mark it `CONTRACT:` so it reads as something
  you may not break.
* A "do not do X, because Y" note wherever the obvious simplification is wrong. This is
  the most valuable kind: it records a trap, so the next person does not fall into it.
* A pointer to the code that forces our hand, named by file and line. When a rule exists
  because of Domoticz core, cite core.

Record measurements, not intentions. A stated pixel value or a measured constraint can be
checked and stays honest; a description of what a rule was meant to achieve cannot.

Use Domoticz's own vocabulary for Domoticz's features, and never refer to internal project
phases, task numbers or milestones. They mean nothing to a reader and outlive the work
they name.

Comments rot like code. When you change a rule, reread its comment in the same edit.

When a fix is constrained rather than chosen, say what would have to change to lift the
constraint and what that would cost. Such notes accumulate into a map of where the theme
is tangled and what untangling each knot would take.

The same applies to JavaScript comments.
