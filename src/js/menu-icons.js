/* Core's Setup dropdown hardcodes the SAME image for several menu items in index.html:
   images/customicons.png for Applications, Access Tokens AND Mobile Devices, and
   images/users.png for My Profile. So in the core dropdown those items are indistinguishable.
   The theme cannot edit core's index.html; instead, once the menu has rendered, repoint each
   <img> at a distinct theme icon.

   This runs regardless of the Machinon Settings tile-grid feature: when that grid is enabled
   it replaces the dropdown (settings_page.js), and the still-present hidden <img> are patched
   harmlessly; when it is disabled the core dropdown is what the user sees, now with distinct
   icons. Uses whenElementRenders (page.js), which loads earlier in THEME_MODULES. */
var DROPDOWN_ICON_FIX = {
    mApplications: "images/app.png",
    mAccessTokens: "images/accesstokens.png",
    mMobile: "images/mobile.png",
    mProfile: "images/userprofile.png"
};
whenElementRenders("dropdown-icon-fix", "#mAccessTokens img", function() {
    Object.keys(DROPDOWN_ICON_FIX).forEach(function(id) {
        $("#" + id + " > a > img").attr("src", DROPDOWN_ICON_FIX[id]);
    });
});
