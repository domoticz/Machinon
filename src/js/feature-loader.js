function enableThemeFeatures() {
$.each(theme.features, function(key, feature) {
if (key === "dark_theme") return;
if (feature.enabled === true) {
if (feature.files.length > 0) {
loadThemeFeatureFiles(key);
}
}
});
}
function dzFeatureFileQuery() {
return "?v=" + encodeURIComponent(theme.version || themeName);
}
function loadThemeFeatureFiles(featureName) {
var files = theme.features[featureName].files;
var arrayLength = files.length;
for (var i = 0; i < arrayLength; i++) {
if (files[i].split(".").pop() == "js") {
var getviarequire = "./styles/" + themeFolder + "/js/" + files[i] + dzFeatureFileQuery();
requirejs([ getviarequire ]);
}
if (files[i].split(".").pop() == "css") {
var CSSfile = "styles/" + themeFolder + "/css/" + files[i] + dzFeatureFileQuery();
var fileref = document.createElement("link");
fileref.setAttribute("rel", "stylesheet");
fileref.setAttribute("type", "text/css");
fileref.setAttribute("href", CSSfile);
document.getElementsByTagName("head")[0].appendChild(fileref);
}
}
}
function unloadThemeFeatureFiles(featureName) {
var files = theme.features[featureName].files;
var arrayLength = files.length;
for (var i = 0; i < arrayLength; i++) {
if (files[i].split(".").pop() == "css") {
$('head link[href*="' + files[i] + '"]').remove();
}
}
}
