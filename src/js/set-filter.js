var DZ_SET_HIDDEN = "dz-set-filtered-out";
var dzSetFilter = null;
var dzSetFilterPending = null;
function dzSetFilterCards() {
return Array.prototype.slice.call(document.querySelectorAll("#main-view .itemBlock"));
}
function dzSetCardKey(card) {
if (!("dzSetKey" in card)) {
var el = card.querySelector("[data-idx]");
var idx = el && el.getAttribute("data-idx");
card.dzSetKey = idx
? ((card.closest("#scenecontent") || card.closest("#dashScenes") || card.closest(".dd-widget--dz-scene")) ? "s:" : "d:") + idx
: null;
}
return card.dzSetKey;
}
function dzApplySetFilter(members, label) {
dzSetFilter = { members: members || {}, label: label || "" };
dzReapplySetFilter();
dzSetChipShow(dzSetFilter.label);
dzSetFilterLog("armed");
}
function dzClearSetFilter(silent) {
var was = dzSetFilterMembers();
dzSetFilter = null;
var hidden = Array.prototype.slice.call(document.getElementsByClassName(DZ_SET_HIDDEN));
hidden.forEach(function (card) { card.classList.remove(DZ_SET_HIDDEN); });
if (!silent) {
hidden.forEach(function (card) { $(card).trigger("dz:livesearch:show"); });
}
dzSetChipHide();
dzSetFilterLog("cleared", null, was);
}
function dzReapplySetFilter() {
if (!dzSetFilter) return;
var members = dzSetFilter.members;
var matched = 0;
dzSetFilterCards().forEach(function (card) {
var key = dzSetCardKey(card);
var show = !!(key && members[key]);
if (show) matched += 1;
var wasHidden = card.classList.contains(DZ_SET_HIDDEN);
card.classList.toggle(DZ_SET_HIDDEN, !show);
if (show && wasHidden) $(card).trigger("dz:livesearch:show");
});
dzSetFilterLog("reapplied", matched);
}
function dzSetFilterMembers() {
return (dzSetFilter && dzSetFilter.members) ? Object.keys(dzSetFilter.members).length : 0;
}
function dzSetFilterLog(event, cardsMatched, membersOverride) {
if (typeof dzLogOn === "undefined" || !dzLogOn) return;
try {
var entry = {
members: (typeof membersOverride === "number") ? membersOverride : dzSetFilterMembers(),
route: (typeof location !== "undefined" ? location.hash : "")
};
if (typeof cardsMatched === "number") entry.cards_matched = cardsMatched;
dzLog("set_filter", event, entry);
} catch (e) { }
}
function dzSetFilterOnRender() {
dzReapplySetFilter();
}
function dzNavigateAndFilter(route, members, label) {
if (location.hash === route) {
dzApplySetFilter(members, label);
return;
}
dzSetFilterPending = { hash: route, members: members, label: label };
dzThemeNavigate(route);
}
function dzSetChipEl() {
var chip = document.getElementById("dz-set-chip");
if (chip) return chip;
chip = document.createElement("div");
chip.id = "dz-set-chip";
chip.hidden = true;
var label = document.createElement("span");
label.className = "dz-set-chip-label";
chip.appendChild(label);
var clear = document.createElement("button");
clear.type = "button";
clear.className = "dz-set-chip-clear";
clear.setAttribute("aria-label", dzT("setfilter.clear"));
clear.title = dzT("setfilter.clear");
clear.appendChild(document.createTextNode("×"));
clear.addEventListener("click", function () { dzClearSetFilter(false); });
chip.appendChild(clear);
document.body.appendChild(chip);
return chip;
}
function dzSetChipShow(label) {
var chip = dzSetChipEl();
chip.querySelector(".dz-set-chip-label").textContent = label;
chip.hidden = false;
dzSetChipPosition(chip);
}
function dzSetChipPosition(chip) {
if (window.matchMedia && window.matchMedia("(max-width: 767px)").matches) {
chip.style.top = "";
return;
}
var header = document.querySelector(".navbar-fixed-top");
if (!header) return;
var gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dz-card-space-lg")) || 10;
chip.style.top = (header.getBoundingClientRect().bottom + gap) + "px";
}
function dzSetChipHide() {
var chip = document.getElementById("dz-set-chip");
if (chip) chip.hidden = true;
}
if (typeof window !== "undefined") {
window.addEventListener("hashchange", function () {
if (dzSetFilter) dzClearSetFilter(true);
if (dzSetFilterPending) {
var p = dzSetFilterPending;
dzSetFilterPending = null;
if (p.hash === location.hash) dzApplySetFilter(p.members, p.label);
}
});
}
if (typeof dzDiagRegister === "function") {
dzDiagRegister("filter", function(opts) {
var f = dzSetFilter;
var out = {
members: f && f.members ? Object.keys(f.members).length : 0,
label_len: f && f.label ? f.label.length : 0,
chip: !!document.getElementById("dz-set-chip")
};
if (opts && opts.names && f) { out.label = f.label || ""; }
return out;
});
}
