/* Checked against the dist branch, NOT master. The release workflow rebuilds
   dist only on `release: published`, so dist's theme.json is always the latest
   version a user can actually install. master's is bumped one commit before
   the tag is pushed and the release published, which opened a window where
   every install was told a version was available that did not exist yet. */
var branch = "dist";

setTimeout(update, 5000);

/* True only when `remote` is genuinely NEWER than `local`, comparing the
   numeric release components. A plain inequality also fires when the local
   version is AHEAD, so anyone running an unreleased build was nagged to
   "update" to something older. Non-numeric suffixes are ignored for ordering
   (a prerelease sorts with its release), and anything unparseable falls back
   to no notification: a silent check is better than a wrong one. */
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
                var newVersionText = "Machinon version " + data.version + " " + language.is_available + '! <a href="https://github.com/domoticz/Machinon/releases" target="_blank">' + language.click_here + "</a>";
                generate_noty('success', newVersionText, false);
            }
        })
        .catch(function(error) {
            console.log("Machinon - update check failed:", error);
        });
}
