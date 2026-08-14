# Changelog

User-visible changes to the Machinon theme. New entries go under Unreleased as one-liners when a change lands; at release time they move into a version section, which also becomes the GitHub release notes. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
