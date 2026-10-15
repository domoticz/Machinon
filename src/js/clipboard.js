function dzCopyText(text) {
if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
return navigator.clipboard.writeText(text).then(function() { return true; }, function() { return false; });
}
return Promise.resolve(dzCopyTextLegacy(text));
}
function dzCopyTextLegacy(text) {
var area = document.createElement("textarea");
area.value = text;
area.setAttribute("readonly", "");
area.style.position = "fixed";
area.style.top = "-1000px";
area.style.opacity = "0";
document.body.appendChild(area);
var ok = false;
try {
area.select();
ok = document.execCommand("copy") === true;
} catch (e) { ok = false; }
document.body.removeChild(area);
return ok;
}
