function setDeviceSwitch(idx, status) {
    var switchState = switchLabels();

    /* Trim whitespace - Angular templates include newlines in text nodes */
    if (typeof status === "string") status = status.trim();

    /* The same device can render as SEVERAL cards at once (classic page,
       Dynamic Dashboard widget, Favorites widget), so create/update the
       toggle PER CARD; a single global exists-check skipped every copy
       after the first. */
    $("tr[data-idx='" + idx + "']").each(function() {
        var tr = $(this);
        var switcher = tr.find(".switch");
        var rowStatus = status;
        if (tr.find(".dimslider").length > 0) {
            rowStatus = (rowStatus == switchState.off ? switchState.off : switchState.on);
            tr.find(".input").css("margin-top", "20px");
        }
        var checked = !(!rowStatus || rowStatus === switchState.off || rowStatus === 'Off' || rowStatus === switchState.closed || rowStatus === 'Closed');
        /* The checkbox is the toggle's keyboard and screen-reader handle
           (css/switch.css keeps it focusable), so it carries the device name:
           a bare switch announces nothing about what it switches. */
        var name = tr.find("#name").first().text().trim();

        /* Check if switch exists --> create or update */
        if (switcher.length == 0) {
            tr.find("#status, #bigtext").hide();
            var input = $('<input type="checkbox" role="switch">').prop("checked", checked).attr("aria-label", name);
            var label = $('<label class="switch" title="">').append(input, '<span class="slider round"></span>');
            tr.append($('<td class="input">').append(label));
            /* Space on the focused checkbox arrives here as a click on the
               input, bubbling to the label; preventDefault keeps the box from
               flipping on its own, so it only ever mirrors the device state
               that core reports back. */
            tr.find(".switch").on("click", function(e) {
                e.preventDefault();

                if (tr.parents("#dashScenes").length > 0 || tr.parents("#scenecontent").length > 0) {
                    /* Scenes */
                    if ($(this).find("input").prop("checked")) {
                        tr.find("#img2 img").click();
                    } else {
                        tr.find("#img1 img").click();
                    }
                } else {
                    /* Switches - use descendant selector, upstream wraps img in div */
                    tr.find("#img img").click();
                }
            });
        } else {
            switcher.find("input").prop("checked", checked).attr("aria-label", name);
        }
    });
}
