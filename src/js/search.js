var dzSearchClear = null;
function dzSearchEmptyUpdate() {
var input = document.getElementById("searchInput");
var search = document.getElementById("search");
var query = input ? input.value.trim() : "";
var existing = document.getElementById("dz-search-empty");
var countEl = search ? search.querySelector(".jsTbResultsCount") : null;
var counted = countEl ? parseInt(countEl.textContent.replace(/\s/g, ""), 10) : NaN;
var empty = false;
if (query && counted === 0 && search && !search.classList.contains("readonly")) {
empty = true;
var cards = document.querySelectorAll("#main-view .itemBlock, #main-view #dashCameras .movable");
for (var i = 0; i < cards.length; i++) {
if (cards[i].getClientRects().length) { empty = false; break; }
}
}
var view = document.querySelector("#main-view > .container-fluid, #main-view > .container");
if (!empty || !view) {
if (existing) existing.parentNode.removeChild(existing);
return;
}
if (!existing || existing.parentNode !== view) {
if (existing) existing.parentNode.removeChild(existing);
existing = document.createElement("div");
existing.id = "dz-search-empty";
existing.setAttribute("role", "status");
var text = document.createElement("span");
text.className = "dz-search-empty-text";
existing.appendChild(text);
var clear = document.createElement("button");
clear.type = "button";
clear.className = "btn btn-default dz-search-empty-clear";
clear.textContent = dzT("header.clear_search");
clear.addEventListener("click", function () { if (dzSearchClear) dzSearchClear(); });
existing.appendChild(clear);
view.insertBefore(existing, view.firstChild);
}
existing.querySelector(".dz-search-empty-text").textContent = dzT("header.search_no_match", { query: query });
}
var dzSearchEmptyTimer = null;
function dzSearchEmptySchedule() {
if (dzSearchEmptyTimer !== null) return;
dzSearchEmptyTimer = setTimeout(function () {
dzSearchEmptyTimer = null;
dzSearchEmptyUpdate();
}, 60);
}
function setSearch() {
var search = document.createElement("div");
search.id = "search";
var icon = document.createElement("i");
icon.className = "ion-md-search jsTbSearch";
var results = document.createElement("span");
results.className = "tbIcon jsTbResults dz-search-results";
results.title = dzT("header.clear_search");
var clear = document.createElement("i");
clear.className = "ion-md-close jsTbResultsClose";
var count = document.createElement("span");
count.className = "tbResultsCount jsTbResultsCount";
results.appendChild(clear);
results.appendChild(count);
var input = document.createElement("input");
input.type = "text";
input.id = "searchInput";
input.className = "jsLiveSearch";
input.autocomplete = "off";
input.placeholder = dzT("header.search_placeholder");
input.title = dzT("header.type_to_search");
var field = document.createElement("div");
field.className = "dz-search-field";
field.appendChild(input);
field.appendChild(icon);
field.appendChild(results);
search.appendChild(field);
var logo = document.querySelector(".container-logo");
if (logo) { logo.appendChild(search); }
function syncLiveSearchSiblings() {
var v = this.value;
$(".jsLiveSearch").not(this).each(function () { this.value = v; });
}
input.addEventListener("keyup", syncLiveSearchSiblings);
input.addEventListener("change", syncLiveSearchSiblings);
window.addEventListener("keydown", function (e) {
if ((e.key === "F3" || (e.ctrlKey && (e.key === "f" || e.key === "F"))) && !search.classList.contains("readonly")) {
input.focus();
e.preventDefault();
}
});
search.addEventListener("click", function () {
input.focus();
});
search.addEventListener("touchend", function (e) {
if (e.target === input) { return; }
e.preventDefault();
if (e.target.closest(".jsTbResults") && document.activeElement === input) {
clearSearch();
}
input.focus();
});
function clearSearch() {
input.value = "";
input.dispatchEvent(new Event("keyup", { bubbles: true }));
input.dispatchEvent(new Event("change", { bubbles: true }));
}
dzSearchClear = clearSearch;
input.addEventListener("keyup", function (event) {
if (event.key === "Enter") {
input.blur();
}
if (event.key === "Escape") {
clearSearch();
}
});
results.addEventListener("click", clearSearch);
input.addEventListener("keyup", dzSearchEmptySchedule);
input.addEventListener("change", dzSearchEmptySchedule);
new MutationObserver(dzSearchEmptySchedule).observe(count, { childList: true, characterData: true, subtree: true });
if (typeof dzOnDomSettled === "function") { dzOnDomSettled(dzSearchEmptySchedule); }
window.addEventListener("hashchange", dzSearchEmptySchedule);
if (typeof WatchLiveSearch === "function") {
WatchLiveSearch();
}
}
