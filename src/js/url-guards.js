function dzValidHttpUrl(href) {
try {
var u = new URL(String(href), (typeof document !== "undefined" && document.baseURI) || undefined);
return (u.protocol === "http:" || u.protocol === "https:") ? u.href : null;
} catch (e) {
return null;
}
}
function dzThemeImageName(name) {
if (typeof name !== "string" || name === "") return null;
if (/[?#:%\\]/.test(name) || name.charAt(0) === "/") return null;
if (name.split("/").indexOf("..") !== -1) return null;
return name;
}
