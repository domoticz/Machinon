/* Function scope: requirejs runs this feature file as a plain script, so
   top-level vars would become window globals. */
(function() {
    var customMenu = $("#appnavbar");

    if (customMenu.length && customMenu.find("#customPage").length == 0) {
        /* Image AND glyph, the twin Domoticz 2026.3 ships for its own navigation
           entries (upstream PR #6995), so this button follows Settings > System >
           Icon style like every entry beside it instead of staying the one PNG in a
           bar of glyphs. fa-desktop is what images/custompage.png already draws, so
           the icon keeps its meaning.

           The switch is THEME-owned, not core's: css/nav.css hides .dz-nav-glyph by
           default and css/navbar_icons.css re-shows it only under html.dz-icons-glyph.
           Relying on core's own hide rule would break older Domoticz, which has no
           such rule, and would paint both halves at once: a duplicate icon.

           button_name is a stored value, so it reaches the DOM as text only. No
           data-i18n either: core's i18next renders a "[html]"-prefixed key with
           .html() on its .nav pass, which would parse the name as markup. */
        var label = $('<span class="hidden-phone hidden-tablet">').text(theme.button_name);
        var link = $('<a class="lcursor"><img src="images/custompage.png" class="dz-nav-img"><i class="fa-solid fa-desktop dz-nav-glyph"></i></a>').append(label);
        customMenu.append('<li class="divider-vertical"></li>', $('<li id="customPage">').append(link));
    }

    $("#customPage").click(function() {
        /* custom_url is a stored value: set as an attribute, never composed into
           markup, and only when it is an http(s) URL, so javascript: and data:
           URLs leave the frame blank instead of running in this page. */
        var frame = $('<iframe class="cIFrameLarge" id="IMain">');
        var src = dzValidHttpUrl(theme.custom_url);
        if (src) frame.attr("src", src);
        $("#main-view").empty().append(frame);
        $(".navbar-inner").removeClass("slide");
    });
})();
