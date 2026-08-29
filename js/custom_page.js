var customMenu = $("#appnavbar");

var customPage = customMenu.find("#customPage");

if (customMenu.length && customPage.length == 0) {
    /* Image AND glyph, the twin Domoticz 2026.3 ships for its own navigation
       entries (upstream PR #6995), so this button follows Settings > System >
       Icon style like every entry beside it instead of staying the one PNG in a
       bar of glyphs. fa-desktop is what images/custompage.png already draws, so
       the icon keeps its meaning.

       The switch is THEME-owned, not core's: css/nav.css hides .dz-nav-glyph by
       default and css/navbar_icons.css re-shows it only under html.dz-icons-glyph.
       Relying on core's own hide rule would break older Domoticz, which has no
       such rule, and would paint both halves at once, which is the exact
       duplicate-icon bug the glyph work just fixed. */
    customMenu.append('<li class="divider-vertical"></li><li id="customPage"><a class="lcursor"><img src="images/custompage.png" class="dz-nav-img"><i class="fa-solid fa-desktop dz-nav-glyph"></i><span class="hidden-phone hidden-tablet" data-i18n="' + theme.button_name + '">' + theme.button_name + "</span></a></li>");
}

$("#customPage").click(function() {
    var htmlcontent = "";
    htmlcontent += '<iframe class="cIFrameLarge" id="IMain" src="' + theme.custom_url + '"></iframe>';
    $("#main-view").html(htmlcontent);
    $(".navbar-inner").removeClass("slide");
});
