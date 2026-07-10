/* Settings persistence: the theme object's round-trip between the browser
   (localStorage cache) and Domoticz (three theme-<folder>-* user variables,
   so settings follow the user across browsers). UI wiring lives in
   settings-ui.js; feature file loading in feature-loader.js. */

/* The theme object's localStorage cache. Plain functions instead of the old
   Storage.prototype monkey-patch: no global prototype pollution, and every
   caller stores the same thing, so the key/value pair lives here once. */
function cacheThemeSettings() {
    localStorage.setItem(themeFolder + ".themeSettings", JSON.stringify(theme));
}

function readCachedThemeSettings() {
    var value = localStorage.getItem(themeFolder + ".themeSettings");
    return value && JSON.parse(value);
}

function isEmptyObject(obj) {
    for (var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            return false;
        }
    }
    return true;
}

function loadSettings() {
    if (typeof Storage !== "undefined") {
        if (localStorage.getItem(themeFolder + ".themeSettings") === null) {
            return fetch("styles/" + themeFolder + "/theme.json", { cache: "no-cache", credentials: "include" })
                .then(function(response) { return response.json(); })
                .then(function(localJson) {
                    theme = localJson;
                    themeName = theme.name;
                    if (isEmptyObject(theme) === false) {
                        cacheThemeSettings();
                        setTimeout(function() {
                            location.reload();
                        }, 3000);
                    }
                    console.log(themeName + " - local theme settingsfile loaded and saved to localStorage");
                })
                .catch(function(error) {
                    console.log("Machinon - failed to load theme.json:", error);
                });
        } else {
            theme = readCachedThemeSettings();
            themeName = theme.name;
            console.log(themeName + " - theme settings was already found in the browser.");
            // Features added after a user's settings were cached: seed a default instead of
            // hitting the unknown-feature reset prompt in loadSettingsHTML.
            if (theme.features && !theme.features.hide_logo) {
                theme.features.hide_logo = { id: 42, enabled: false, files: [] };
            }
        }
    }
    return Promise.resolve();
}

var unableCreateUserVariable = false;

function checkUserVariableThemeSettings() {
    $.ajax({
        url: "json.htm?type=command&param=getuservariables",
        async: true,
        dataType: "json",
        success: function(data) {
            if (data.status == "ERR") {
                $.get("json.htm?type=command&param=addlogmessage&message=Theme Error - The theme was unable to load your preferences from Domoticz.");
            }
            if (data.status == "OK") {
                var didDomoticzHaveSettings = false;
                var featuresVarName = "theme-" + themeFolder + "-features";
                var customVarName = "theme-" + themeFolder + "-custom";
                var colorsVarName = "theme-" + themeFolder + "-colors";
                $.each(data.result, function(variable, value) {
                    if (value.Name == featuresVarName) {
                        console.log(themeName + " - found theme feature settings in Domoticz database (user variable Idx: " + value.idx + ")");
                        didDomoticzHaveSettings = true;
                        theme.userfeaturesvariable = value.idx;
                        getFeatureThemeSettings(value.idx);
                    }
                    if (value.Name == customVarName) {
                        console.log(themeName + " - found theme custom settings in Domoticz database (user variable Idx: " + value.idx + ")");
                        didDomoticzHaveSettings = true;
                        theme.usercustomsvariable = value.idx;
                        getCustomThemeSettings(value.idx);
                    }
                    if (value.Name == colorsVarName) {
                        console.log(themeName + " - found theme colors settings in Domoticz database (user variable Idx: " + value.idx + ")");
                        didDomoticzHaveSettings = true;
                        theme.usercolorsvariable = value.idx;
                        getColorsThemeSettings(value.idx);
                    }
                });
                if (didDomoticzHaveSettings === false) {
                    if (unableCreateUserVariable == false) {
                        storeUserVariableThemeSettings("add");
                    } else {
                        storeUserVariableThemeSettings("update");
                    }
                }
            }
        },
        error: function() {
            console.log("The theme was unable to check if Domoticz had theme settings. Permission denied? Still on login page? No connection? Stopping..");
        }
    });
}

function storeUserVariableThemeSettings(action) {
    if (themeFolder === "undefined") return Promise.resolve();

    var settings = [];
    $.each(theme.features, function(key, feature) {
        if (feature.enabled === true) {
            settings.push(feature.id);
        }
    });

    var custom = [
        theme.standby_after, theme.button_name, theme.custom_url,
        theme.logo, theme.icons, theme.background_img, theme.background_type
    ];

    function saveVariable(varName, value) {
        var url = "json.htm?type=command&param=" + action + "uservariable&vname=" + varName + "&vtype=2&vvalue=" + encodeURIComponent(value);
        return fetch(url, { credentials: "include" })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.status == "ERR") {
                    bootbox.alert("Unable to create or update theme settings uservariable, Try to reset the theme");
                    if (varName.indexOf("-features") !== -1) unableCreateUserVariable = true;
                }
                if (data.status == "OK") {
                    console.log(themeName + " - theme settings uservariable is updated");
                }
            })
            .catch(function() {
                console.log(themeName + " - Ajax error while creating or updating user variable in Domoticz.");
            });
    }

    return Promise.all([
        saveVariable("theme-" + themeFolder + "-features", JSON.stringify(settings)),
        saveVariable("theme-" + themeFolder + "-custom", JSON.stringify(custom)),
        saveVariable("theme-" + themeFolder + "-colors", JSON.stringify(theme.color_scheme))
    ]);
}

/* Fetch one theme settings user variable and hand its parsed JSON value to
   applyFn; caching the merged theme to localStorage happens here, so appliers
   only mutate the in-memory theme object. */
function getThemeUserVar(idx, settingType, applyFn) {
    $.ajax({
        url: "json.htm?type=command&param=getuservariable" + "&idx=" + idx,
        async: true,
        dataType: "json",
        success: function(data) {
            if (data.status == "ERR") {
                console.log(themeName + " - Although they seem to exist, there was an error loading theme preferences from Domoticz");
                $.get("json.htm?type=command&param=addlogmessage&message=Theme Error - The theme was unable to load your user variable.");
            }
            if (data.status == "OK") {
                applyFn(JSON.parse(data.result[0].Value));
                cacheThemeSettings();
            }
        },
        error: function() {
            console.log(themeName + " - ERROR reading " + settingType + " settings from Domoticz for theme " + theme.name + " from user variable #" + idx);
        }
    });
}

function getFeatureThemeSettings(idx) {
    getThemeUserVar(idx, "feature", function(enabledFeatureIds) {
        $.each(theme.features, function(key, feature) {
            feature.enabled = $.inArray(feature.id, enabledFeatureIds) > -1;
        });
    });
}

function getCustomThemeSettings(idx) {
    getThemeUserVar(idx, "custom", function(customThemeSettings) {
        theme.standby_after = customThemeSettings[0];
        theme.button_name = customThemeSettings[1];
        theme.custom_url = customThemeSettings[2];
        theme.logo = customThemeSettings[3];
        theme.icons = customThemeSettings[4];
        theme.background_img = customThemeSettings[5];
        theme.background_type = customThemeSettings[6];
    });
}

function getColorsThemeSettings(idx) {
    getThemeUserVar(idx, "colors", function(colorScheme) {
        theme.color_scheme = colorScheme;
    });
}

function resetTheme() {
    var deletePromises = [];

    function deleteVariable(idx, settingType) {
        return fetch("json.htm?type=command&param=deleteuservariable&idx=" + idx, { credentials: "include" })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                console.log(themeName + " - server responded " + data.status + " while deleting user variable that stored " + settingType + " settings");
            })
            .catch(function() {
                console.log(themeName + " - The theme was unable to delete the user variable in Domoticz that holds the theme " + settingType + " settings");
            });
    }

    if (typeof theme.userfeaturesvariable !== "undefined") {
        deletePromises.push(deleteVariable(theme.userfeaturesvariable, "feature"));
    }
    if (typeof theme.usercustomsvariable !== "undefined") {
        deletePromises.push(deleteVariable(theme.usercustomsvariable, "custom"));
    }
    if (typeof theme.usercolorsvariable !== "undefined") {
        deletePromises.push(deleteVariable(theme.usercolorsvariable, "colors"));
    }

    Promise.all(deletePromises).then(function() {
        if (typeof Storage !== "undefined") {
            localStorage.removeItem(themeFolder + ".themeSettings");
        }
        $.get("json.htm?type=command&param=addlogmessage&message=" + themeFolder + " theme reset to defaults");
        location.reload();
    });
}
