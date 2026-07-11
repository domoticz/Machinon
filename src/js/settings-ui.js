/* The Theme tab on core's Settings page: injects the tab, loads
   themesettings.html into it, and wires every control to the theme object.
   Persistence lives in settings-store.js; feature file loading in
   feature-loader.js. */

function showThemeSettings() {
    if (!$("#tabsystem").length) {
        /* Wait for the Settings page to render; every call used to start
           another 1s retry chain that never stopped if the user navigated
           away before the page rendered. */
        whenElementRenders("tabsystem", "#tabsystem", showThemeSettings);
        return;
    }
    if (!$("#tabtheme").length) {
        $('<li id="themeTabButton"><a data-target="#tabtheme" data-toggle="tab" data-i18n="Theme">Theme</a></li>').insertBefore("#tabs > li.pull-right");
        $("#tabs li:not(.pull-right)").click(function() {
            if ($(window).width() < 480) {
                $(this).siblings().show();
            }
        });
        $("#acceptnewhardwaretable > tbody > tr:nth-child(1) > td > button").click(function() {
            generate_noty('success', language.allow_new_hardware, 4000);
        });
        $("#tabs > li.pull-right > a").click(function() {
            generate_noty('success', language.domoticz_settings_saved, 4000)
        });
        $("#tabs").i18n();
        $("#my-tab-content").append('<div class="tab-pane" id="tabtheme"><section id="theme">Loading..</section></div>');
        $("#my-tab-content #theme").load("styles/" + themeFolder + "/themesettings.html", loadSettingsHTML);
    }
}

function setupIcons() {
    var code = JSON.stringify(theme.icons);
    if (typeof code === "undefined") {
        bootbox.alert({
            className: "rubberBand animated",
            message: '<p>Please reset the theme by clicking here:</p><p><a onClick="resetTheme(); return false;" href=""><button class="btn btn-info">Reset theme</button></a></p><p>(or find the theme reset button on the theme settings page)<p>',
            title: "Congratulations on the theme upgrade!"
        });
    } else {
        code = code.replace("[", "").replace("]", "");
        $("#textareaIcons").val(code);
    }
}

function addImgInsteadofIcon() {
    try {
        JSON.parse("[" + $("#tabtheme #textareaIcons").val() + "]");
    } catch (e) {
        bootbox.alert({
            className: "rubberBand animated",
            message: "<p>Data not saved!</p><p>Please check the syntax. Be sure you didn't add a comma at the end! <p>",
            title: "Syntax error"
        });
        return false;
    }
    $("#tabtheme #textareaIcons").each(function() {
        var value = $(this).val();
        value = "[" + value + "]";
        theme[this.name] = JSON.parse(value);
    });
    cacheThemeSettings();
    storeUserVariableThemeSettings("update");
}

function loadSettingsHTML() {
    if (typeof branch !== "undefined" && branch == "beta") {
        $("#themeversion").text(theme.version + " " + branch);
    } else {
        $("#themeversion").text(theme.version);
    }
    $("#themefolder").text(themeFolder);
    $("#themesettings").i18n();
    if (992 >= window.innerWidth) {
        $("#themevar28").prop("disabled", true);
        $('label[for="themevar28"]').addClass("disabledText");
    }
    if (1200 >= window.innerWidth) {
        $("#themevar30").prop("disabled", true);
        $('label[for="themevar30"]').addClass("disabledText");
    }
    setupIcons();
    $('#tabtheme input[type="checkbox"]').each(function() {
        if (typeof theme.features[this.value] !== "undefined") {
            if (theme.features[this.value].enabled === true) {
                $(this).prop("checked", true);
            } else if (theme.features[this.value].enabled === false) {
                $(this).prop("checked", false);
            }
        } else {
            if (typeof theme.upgradeAlerted === "undefined") {
                bootbox.alert({
                    className: "rubberBand animated",
                    message: '<p>Please reset the theme by clicking here:</p><p><a onClick="resetTheme(); return false;" href=""><button class="btn btn-info">Reset theme</button></a></p><p>(or find the theme reset button on the theme settings page)<p>',
                    title: "Congratulations on the theme upgrade!"
                });
                if (isEmptyObject(theme) === false) {
                    cacheThemeSettings();
                }
            }
        }
        if ($(this).not(":checked") && $(this).is(".parentrequired")) {
            $(this).siblings("span.option").children().each(function() {
                if ($(this).is(".parentrequiredchild")) {
                    $(this).prop("disabled", true);
                }
            });
        }
        if ($(this).is(":checked") && $(this).is(".parentrequired")) {
            $(this).siblings("span.option").children().each(function() {
                if ($(this).is(".parentrequiredchild")) {
                    $(this).prop("disabled", false);
                }
            });
        }
    });
    $('#tabtheme input[type="number"]').each(function() {
        var value = theme[this.name];
        // A settings object cached before a key existed has no value for it; show the
        // input's HTML default instead of an empty spinner.
        if (value == null || value === "") { value = this.getAttribute("value"); }
        $(this).val(value);
    });
    $('#tabtheme input[type="text"], #tabtheme input[type="color"]').each(function() {
        if (this.name.indexOf('.') !== -1) {
            const json = this.name.split('.');
            value = theme[json[0]][json[1]];
        } else {
            var value = theme[this.name];
        }
        $(this).val(value);
    });
    $("#tabtheme select").each(function() {
        var value = theme[this.name];
        $(this).val(value);
    });
    $('#tabtheme input[type="checkbox"]').click(function() {
        if ($(this).is(":checked")) {
            theme.features[this.value].enabled = true;
            loadThemeFeatureFiles(this.value);
        } else {
            if ($(this).is(".parentrequired")) {
                $(this).siblings("span.option").children().each(function() {
                    if ($(this).hasClass("parentrequiredchild")) {
                        $(this).prop("checked", false);
                        var childName = $(this).val();
                        if (typeof theme.features[childName] !== "undefined") {
                            unloadThemeFeatureFiles(childName);
                            theme.features[childName].enabled = false;
                        }
                    }
                });
            }
            theme.features[this.value].enabled = false;
            unloadThemeFeatureFiles(this.value);
        }
        if ($(this).not(":checked") && $(this).is(".parentrequired")) {
            $(this).siblings("span.option").children().each(function() {
                if ($(this).is(".parentrequiredchild")) {
                    $(this).prop("disabled", true);
                }
            });
        }
        if ($(this).is(":checked") && $(this).is(".parentrequired")) {
            $(this).siblings("span.option").children().each(function() {
                if ($(this).is(".parentrequiredchild")) {
                    $(this).prop("disabled", false);
                }
            });
        }
        cacheThemeSettings();
        console.log(theme.name + " - theme settings saved");
        // File-less features that apply through JS need an explicit re-apply for
        // immediate feedback; the others take effect via their loaded/unloaded files.
        if (this.value === "hide_logo") { setLogo(); }
        // Loaded JS cannot be unloaded, so the module re-reads its enabled flag.
        if (this.value === "log_plot_bands" && typeof dzApplyLogPlotBands === "function") { dzApplyLogPlotBands(); }
        // The scheme picker mirrors these legacy checkboxes; keep both truthful.
        if (this.value === "dark_theme" || this.value === "custom_color_scheme") { syncSchemeFromFeatures(); }
    });
    $("#saveSettingsButton").click(function() {
        $('#tabtheme input[type="number"], #tabtheme input[type="text"], #tabtheme input[type="color"], #tabtheme select').each(function() {
            var value = $(this).val();
            if (this.name.indexOf('.') !== -1) {
                const json = this.name.split('.');
                theme[json[0]][json[1]] = value;
            } else {
                theme[this.name] = value;
            }
        });
        cacheThemeSettings();
        storeUserVariableThemeSettings("update");
        applyCardWidths();
        setLogo();
        generate_noty('success', language.domoticz_settings_saved, 4000)
        /* location.reload(); */
    });
    $("#themeResetButton").click(function() {
        bootbox.dialog({
            title: '<font color="red">' + language.warning + "!</font>",
            size: "small",
            className: "rubberBand animated",
            message: "<p>" + language.resetTheme_message + "?</p>",
            buttons: {
                cancel: {
                    label: $.t("Cancel"),
                    className: "btn-info",
                    callback: function() {
                        console.log("Custom cancel button clicked");
                    }
                },
                clear: {
                    label: language.clear_localstorage,
                    className: "btn-warning",
                    callback: function() {
                        generate_noty('warning', language.storage_removed, 4000)
                        if (typeof Storage !== "undefined") {
                            localStorage.removeItem(themeFolder + ".themeSettings");
                        }
                        /* location.reload(); */
                    }
                },
                ok: {
                    label: $.t("Reset"),
                    className: "btn-danger",
                    callback: function() {
                        generate_noty('success', language.theme_restored, 4000)
                        resetTheme();
                    }
                }
            }
        });
    });
    renderSchemePicker();
    $('a.saveschemebtn').click(function(e) {
        e.preventDefault();
        bootbox.prompt("Preset name", function(name) {
            if (name) { saveCurrentColorsAsScheme(name); }
        });
        return false;
    });
    $('a.resetschemebtn').click(function(e) {
            e.preventDefault();
            var current_theme = getSchemeDefaults();
            $('input#themevar39_bg').val(current_theme.bg);
            $('input#themevar39_main_color').val(current_theme.main);
            $('input#themevar39_navbar').val(current_theme.navbar);
            $('input#themevar39_item').val(current_theme.item);
            $('input#themevar39_text').val(current_theme.text);
            $('input#themevar39_alt_text').val(current_theme.alt_text);
            $('input#themevar39_disabled').val(current_theme.disabled);
            return false;
    });
}
