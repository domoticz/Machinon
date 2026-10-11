(function() {
var customMenu = $("#appnavbar");
if (customMenu.length && customMenu.find("#customPage").length == 0) {
var link = $('<a class="lcursor"><img src="images/custompage.png" class="dz-nav-img"><i class="fa-solid fa-desktop dz-nav-glyph"></i><span class="hidden-phone hidden-tablet dz-custom-page-label"></span></a>');
customMenu.append('<li class="divider-vertical"></li>', $('<li id="customPage">').append(link));
dzApplyCustomPageLabel();
}
$("#customPage").click(function() {
var frame = $('<iframe class="cIFrameLarge" id="IMain">');
var src = dzValidHttpUrl(theme.custom_url);
if (src) frame.attr("src", src);
$("#main-view").empty().append(frame);
$(".navbar-inner").removeClass("slide");
});
})();
