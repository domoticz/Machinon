/* The navbar search box: injected into the logo container, filters device
   cards live, and hides dashboard sections that end up empty. */

function setSearch() {
    $('<div id="search"><input type="text" id="searchInput" autocomplete="off" onkeyup="searchFunction()" placeholder="Name, Desc, Idx, Status" title="' + language.type_to_search + '"><i class="ion-md-search"></i></div>').appendTo(".container-logo");
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
    $("div.row.divider, #dashcontent div.row").show();
    // Scoped to #dashcontent (task 10 fix): this undoes whatever
    // removeEmptySectionDashboard hid on the PREVIOUS keyup, before
    // recomputing below, so it only ever needs the same container that
    // function already scopes to. The old unscoped $("section").show() hit
    // EVERY <section> in the document, including the theme hub's
    // .dz-hub-section group panels (also <section> elements) whenever this
    // ran for ANY reason on ANY page -- and initDeviceLiveUpdates
    // (devices.js) calls searchFunction() on every live device_update
    // push, not just on a real keystroke. With the hub open, that blew away
    // dzHubShowGroup's per-group display:none on every background device
    // update, showing all groups at once until the user clicked a tab
    // again (the reported "sometimes ALL groups render as one long list"
    // bug). #dashcontent is the only container search ever needs this
    // reveal step for: weatherwidgets/tempwidgets (the other two search
    // surfaces referenced above) use <div class="row divider">, not
    // <section>, so they were never part of what this line was for.
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
