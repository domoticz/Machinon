/* The navbar search box: injected into the logo container, filters device
   cards live, and hides dashboard sections that end up empty. */

function setSearch() {
    $('<div id="search"><input type="text" id="searchInput" autocomplete="off" onkeyup="searchFunction()" placeholder="' + dzT("header.search_placeholder") + '" title="' + dzT("header.type_to_search") + '"><i class="ion-md-search"></i></div>').appendTo(".container-logo");
    window.addEventListener("keydown",function (e) {
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
            $("#searchInput").focus();
            e.preventDefault();
        }
    })
    $("#search").click(function() {
        $("#searchInput").focus();
    });
    $("#searchInput").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#searchInput").blur();
        }
        if (event.keyCode === 27) {
            $("#searchInput").val("");
            $("#searchInput").keyup();
        }
    });

}

function searchFunction() {
    var value = $("#searchInput").val().toLowerCase();
    $("div .item").each(function() {
        var element = $(this);
        if ($("#dashcontent").length || $("#weatherwidgets").length || $("#tempwidgets").length) {
            element = $(this).parent();
        }
		if ($("#dashcontent").length){
			var visibility = $(this).find("#name").html().toLowerCase().indexOf(value) > -1;
			element.toggle(visibility);
		}else{
			var visibility = $(this).find("#name").attr('data-search').toLowerCase().indexOf(value) > -1;
			element.toggle(visibility);
		}
    });
    /* Scoped like the section reveal below, and for the same reason: this
       runs on every live device_update push via searchFunction, on EVERY
       page. An unscoped div.row.divider would re-show hidden rows anywhere
       in the document; the only rows search itself ever hides live in the
       three search surfaces (weather/temp rows via element.toggle on the
       parent, classic dashboard rows via removeEmptySectionDashboard). */
    $("#weatherwidgets div.row.divider, #tempwidgets div.row.divider, #dashcontent div.row").show();
    // Scoped to #dashcontent: this undoes whatever removeEmptySectionDashboard
    // hid on the PREVIOUS keyup, before recomputing below, so it only ever
    // needs the same container that function already scopes to. An unscoped
    // $("section").show() would hit EVERY <section> in the document,
    // including the theme hub's .dz-hub-section group panels (also
    // <section> elements) whenever this ran for ANY reason on ANY page --
    // and initDeviceLiveUpdates (devices.js) calls searchFunction() on every
    // live device_update push, not just on a real keystroke. With the hub
    // open, that would blow away dzHubShowGroup's per-group display:none on
    // every background device update, showing all groups at once until the
    // user clicked a tab again. #dashcontent is the only container search
    // ever needs this reveal step for: weatherwidgets/tempwidgets (the other
    // two search surfaces referenced above) use <div class="row divider">,
    // not <section>, so they were never part of what this line was for.
    $("#dashcontent section").show();
    if (value.length) {
        removeEmptySectionDashboard();
    }
}

function removeEmptySectionDashboard() {
    $("#dashcontent section").each(function() {
        $(this).show();
        if (!$(this).children("div.row").children(":visible").length) {
            $(this).hide();
        }
    });
}
