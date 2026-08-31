# Troubleshooting and FAQ

Problems are grouped below by what you actually see, not by which part of the theme causes them.
Find the symptom that matches, and work through its steps in order.

## The theme doesn't show up in the dropdown

You've installed Machinon (see [Installation](installation.md)), but `machinon` isn't one of the
choices in the **Theme** dropdown on Setup > Settings.

1. Check the folder itself: Domoticz lists whatever folders it finds under
   `domoticz/www/styles/`, so the theme has to sit directly in `domoticz/www/styles/machinon/`,
   not nested one level deeper. This is the most common miss with the release zip, since it
   already contains a `machinon/` folder, unzipping it into a folder of the same name creates a
   `machinon/machinon/` nesting instead.
2. Check the folder name is exactly `machinon`, lowercase. Domoticz's theme scanning is
   case-sensitive on Linux.
3. Reopen the Settings page (or reload Domoticz entirely) after adding the files. The dropdown is
   built from the folder list at the time the page loads, so files added while the page was
   already open won't appear until it's reloaded.

## The theme is selected, but nothing changed

You picked `machinon` from the dropdown, but the dashboard still looks like the old theme.

1. Make sure you actually clicked **Apply Settings**. On Domoticz's Settings page, that button
   sits at the **top right**, next to the row of tabs, not at the bottom of the page. Picking a
   theme from the dropdown only previews it; the change isn't saved until you click that button.
   (On a narrow phone screen, the same button moves to a bar fixed at the bottom of the screen,
   see [Mobile
   layouts](mobile.md#at-767px-forms-tables-search-and-the-settings-page-adapt-further).)
2. Hard-refresh your browser (Ctrl+Shift+R). A normal refresh often keeps serving the old theme's
   cached files even after the setting is saved correctly.

## It looked right, and now it looks broken after an update

Machinon (or Domoticz itself) was updated, and the dashboard that used to look fine now looks
broken or half-styled.

1. Hard-refresh first (Ctrl+Shift+R). This is the fix for the large majority of post-update
   issues: your browser is still serving cached copies of files that changed in the update.
2. If a hard refresh doesn't fix it, open the site in a private or incognito window. A private
   window starts with no cache at all, so if the page looks correct there, the problem is
   confirmed to be caching, and clearing your browser's cache (not just refreshing) will fix it
   in your normal window too.

## Pop-up messages are showing up that never appeared before

Domoticz posts its own status messages when something needs your attention: "You do not have
permission to do that", a failed save on a hardware or setup page, or this theme's own warning
that your settings didn't save. Machinon used to hide the part of the page that shows those
messages, so they never appeared, even though Domoticz kept sending them the whole time.

As of this update, those messages show up again, in a pop-up that matches your color scheme and
dark mode, with a close button, and Esc to dismiss it. Seeing one now isn't a sign the theme just
started breaking something: it's the theme finally showing you what Domoticz already knew.

If a specific message is confusing on its own, treat it as a Domoticz message rather than a
Machinon one: the theme only displays the text, it doesn't write it, so look for what it means in
Domoticz's own documentation or issue tracker rather than here.

## The Theme Hub entry is missing

You expected to find **Theme** in the Setup menu, but it isn't there.

1. Confirm Machinon is actually the active theme first. The Theme Hub only exists once Machinon
   is selected and applied (see the two symptoms above); no other theme shows this menu entry.
2. If Machinon is active and you're logged in as an **admin** user, the entry lives in the
   **Setup** menu, next to **Settings**.
3. If you're logged in as a **non-admin** user on an installation with separate logins, the
   Setup menu isn't shown to you at all, that's normal Domoticz behavior, not something Machinon
   changes. You still have access to the Theme Hub, though: look for the dropdown that replaces
   Setup for a non-admin login, labeled **Other** on the current Domoticz beta and **Profile** on
   the 2025.2 stable release, holding items like Energy Dashboard, My Profile, About and Logout.
   Machinon adds a Theme Hub entry there too, directly above Logout, specifically so non-admin
   users on a multi-login installation aren't locked out of their own theme settings.
4. If your installation has no separate logins at all (or login is disabled), you're treated as
   admin and the entry is in the Setup menu as in step 2.

## A setting changed for everyone, or didn't change for anyone else

You changed something in the Theme Hub, and it either affected other users when you didn't
expect it to, or didn't affect them when you expected it to.

This comes down to whether the setting is **personal** or **shared**, and whether your
installation has separate logins for each person. The full explanation, including how to tell
the two kinds of setting apart in the Theme Hub, is in [Theme Hub: personal settings versus
shared settings](theme-hub.md#personal-settings-versus-shared-settings). In short: on an
installation without separate logins, there's only one copy of every setting, so any change
affects everyone; with separate logins, only settings marked shared (with a small "house" label)
spread to other users, and only an admin account can change them.
