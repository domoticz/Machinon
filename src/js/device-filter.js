var DZ_FILTER_HIDDEN = "dz-filtered-out";
var DZ_CAMERA_HIDDEN = "dz-camera-filtered-out";
var dzActiveFilter = null;
var dzFilterGeneration = 0;
function dzFilterCards() {
var root = document.querySelector(".dd-grid");
if (!root) { return []; }
return Array.prototype.slice.call(root.querySelectorAll(".itemBlock"));
}
function dzCardSearchText(card) {
if (card.dzSearchGeneration !== dzFilterGeneration) {
var nameEl = card.querySelector("td#name");
card.dzSearchText = ((nameEl && (nameEl.getAttribute("data-search") || nameEl.textContent)) || "").toLowerCase();
card.dzSearchGeneration = dzFilterGeneration;
}
return card.dzSearchText;
}
function dzApplyDeviceFilter(predicate) {
dzActiveFilter = predicate;
dzFilterGeneration++;
dzReapplyDeviceFilter();
}
function dzClearDeviceFilter() {
dzActiveFilter = null;
var cards = dzFilterCards();
cards.forEach(function (card) {
var wasHidden = card.classList.contains(DZ_FILTER_HIDDEN) || card.style.display === "none";
card.classList.remove(DZ_FILTER_HIDDEN);
card.style.removeProperty("display");
if (wasHidden) {
$(card).trigger("dz:livesearch:show");
}
});
if (!cards.length) { return; }
$(".liveSearchShown").removeClass("liveSearchShown");
if (typeof _tbDisplayResults === "function") { _tbDisplayResults(false, 0); }
}
function dzReapplyDeviceFilter() {
if (!dzActiveFilter) { return; }
var predicate = dzActiveFilter;
dzFilterCards().forEach(function (card) {
var show = predicate(dzCardSearchText(card));
var wasHidden = card.classList.contains(DZ_FILTER_HIDDEN);
card.classList.toggle(DZ_FILTER_HIDDEN, !show);
if (show && wasHidden) {
$(card).trigger("dz:livesearch:show");
}
});
}
function dzDashboardSearchPredicate(query) {
var terms = String(query || "").toLowerCase().split(/[\s,]+/).filter(Boolean);
return function (text) {
if (!terms.length) { return true; }
for (var i = 0; i < terms.length; i++) {
if (text.indexOf(terms[i]) === -1) { return false; }
}
return true;
};
}
function dzFilterCameras(query) {
var section = document.getElementById("dashCameras");
if (!section) { return; }
var phrase = String(query || "").toLowerCase();
var showAll = phrase.trim() === "";
var shown = 0;
Array.prototype.forEach.call(section.querySelectorAll(".movable"), function (card) {
var nameEl = card.querySelector("td#name");
var name = ((nameEl && nameEl.textContent) || "").toLowerCase();
var show = showAll || name.indexOf(phrase) !== -1;
card.classList.toggle(DZ_CAMERA_HIDDEN, !show);
if (show) { shown++; }
});
section.classList.toggle(DZ_CAMERA_HIDDEN, shown === 0);
if (showAll) { return; }
var count = $(".liveSearchShown").length + shown;
if (typeof _tbDisplayResults === "function") { _tbDisplayResults(count || phrase.length, count); }
}
function dzWireDashboardSearch() {
$(document).on("keyup change", "#searchInput", function () {
var value = this.value;
dzFilterCameras(value);
if (!value) {
dzClearDeviceFilter();
return;
}
if (!dzFilterCards().length) { return; }
dzApplyDeviceFilter(dzDashboardSearchPredicate(value));
});
}
