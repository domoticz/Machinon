function setDeviceSwitch(idx, status) {
    var switchState = switchLabels();

    /* Trim whitespace — Angular templates include newlines in text nodes */
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
        var checked = (!rowStatus || rowStatus === switchState.off || rowStatus === 'Off' || rowStatus === switchState.closed || rowStatus === 'Closed')
            ? "" : "checked";

        /* Check if switch exists --> create or update */
        if (switcher.length == 0) {
            tr.find("#status, #bigtext").hide();
            var string = '<td class="input"><label class="switch" title=""><input type="checkbox"' + checked + '><span class="slider round"></span></label></td>';
            tr.append(string);
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
                    /* Switches — use descendant selector, upstream wraps img in div */
                    tr.find("#img img").click();
                }
            });
        } else {
            switcher.find("input").prop("checked", (checked.length > 0));
        }
    });
}
