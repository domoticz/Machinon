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
