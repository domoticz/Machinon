function setDeviceSwitch(idx, status) {
var switchState = switchLabels();
if (typeof status === "string") status = status.trim();
$("tr[data-idx='" + idx + "']").each(function() {
var tr = $(this);
var switcher = tr.find(".switch");
var rowStatus = status;
if (tr.find(".dimslider").length > 0) {
rowStatus = (rowStatus == switchState.off ? switchState.off : switchState.on);
tr.find(".input").css("margin-top", "20px");
}
var checked = !(!rowStatus || rowStatus === switchState.off || rowStatus === 'Off' || rowStatus === switchState.closed || rowStatus === 'Closed');
var name = tr.find("#name").first().text().trim();
if (switcher.length == 0) {
tr.find("#status, #bigtext").hide();
var input = $('<input type="checkbox" role="switch">').prop("checked", checked).attr("aria-label", name);
var label = $('<label class="switch" title="">').append(input, '<span class="slider round"></span>');
tr.append($('<td class="input">').append(label));
tr.find(".switch").on("click", function(e) {
e.preventDefault();
if (tr.parents("#dashScenes").length > 0 || tr.parents("#scenecontent").length > 0) {
if ($(this).find("input").prop("checked")) {
tr.find("#img2 img").click();
} else {
tr.find("#img1 img").click();
}
} else {
tr.find("#img img").click();
}
});
} else {
switcher.find("input").prop("checked", checked).attr("aria-label", name);
}
});
}
