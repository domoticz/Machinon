var branch = "master";

setTimeout(update, 5000);
function update() {
    fetch("https://raw.githubusercontent.com/domoticz/machinon/" + branch + "/theme.json")
        .then(function(response) { return response.json(); })
        .then(function(data) {
            gitVersion = data.version;
            if (theme.version !== gitVersion) {
                newVersionText = "Machinon version " + data.version + " " + language.is_available + '! <a href="https://github.com/domoticz/machinon/tree/' + branch + '" target="_blank">' + language.click_here + "</a>";
                generate_noty('success', newVersionText, false);
            }
        })
        .catch(function(error) {
            console.log("Machinon - update check failed:", error);
        });
}
