(function() {
var branch = "dist";
setTimeout(update, 5000);
function isNewerVersion(remote, local) {
var parse = function(v) {
return String(v || "").split(".").map(function(part) {
return parseInt(part, 10);
});
};
var r = parse(remote);
var l = parse(local);
if (!r.length || r.some(isNaN) || !l.length || l.some(isNaN)) { return false; }
for (var i = 0; i < Math.max(r.length, l.length); i++) {
var a = r[i] || 0;
var b = l[i] || 0;
if (a !== b) { return a > b; }
}
return false;
}
function update() {
fetch("https://raw.githubusercontent.com/domoticz/Machinon/" + branch + "/theme.json")
.then(function(response) { return response.json(); })
.then(function(data) {
if (isNewerVersion(data.version, theme.version)) {
dzToast({
type: "info",
title: dzT("toasts.update_available", { version: data.version }),
action: { label: dzT("toasts.update_action"), href: "https://github.com/domoticz/Machinon/releases" },
icon: "ion-ios-cloud-download",
timeout: false,
source: "update-check"
});
}
})
.catch(function(error) {
console.log("Machinon - update check failed:", error);
});
}
})();
