/* Feature module loading: each theme.json feature lists the js/css files it
   needs; enabled features load them at init, and the settings panel loads or
   unloads them live when a feature is toggled. JS loads through requirejs
   (core ships it) and is NOT unloaded on toggle-off: an executed script
   cannot be un-executed, so js-backed features fully stop only on reload. */

function enableThemeFeatures() {
    $.each(theme.features, function(key, feature) {
        if (feature.enabled === true) {
            if (feature.files.length > 0) {
                loadThemeFeatureFiles(key);
            }
        }
    });
}

function loadThemeFeatureFiles(featureName) {
    var files = theme.features[featureName].files;
    var arrayLength = files.length;
    for (var i = 0; i < arrayLength; i++) {
        if (files[i].split(".").pop() == "js") {
            var getviarequire = "./styles/" + themeFolder + "/js/" +  files[i] + "?" + themeName;
            requirejs([ getviarequire ]);
        }
        if (files[i].split(".").pop() == "css") {
            var CSSfile = "styles/" + themeFolder + "/css/" + files[i] + "?" + themeName;
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
