/* The "Create a theme" wizard: three steps over a generated light+dark pair.

   Owns DOM, state and persistence; all colour computation lives in
   src/js/scheme-generator.js. Nothing outside this dialog is mutated until
   Save, so Cancel is free at every step and needs no restore path. The
   alternative (repainting the real UI live) would have meant judging colours
   through the 50% scrim, plus a restore path that has to survive escape,
   backdrop click, route change and a mid-wizard reload.

   Reuses #mk-rgbw-scrim, the codified modal scrim (DESIGN.md, "Modal Scrim"),
   rather than introducing a second one. All DOM is createElement/textContent
   and colour values only ever reach style properties, never markup. */

var DZ_WIZARD_ID = "dz-theme-wizard";
var DZ_WIZARD = null;

function dzWizardDefaults() {
    return { step: 1, accent: "#3B7DD8", surface: null, look: "soft", name: "" };
}

function dzWizardEl(tag, cls, parent) {
    var el = document.createElement(tag);
    if (cls) { el.className = cls; }
    if (parent) { parent.appendChild(el); }
    return el;
}

function dzOpenThemeWizard() {
    if (document.getElementById(DZ_WIZARD_ID)) { return; }
    DZ_WIZARD = dzWizardDefaults();

    var scrim = document.getElementById("mk-rgbw-scrim");
    if (!scrim) {
        scrim = dzWizardEl("div", null, document.body);
        scrim.id = "mk-rgbw-scrim";
    }
    scrim.style.display = "block";
    scrim.addEventListener("click", dzCloseThemeWizard);

    var dialog = dzWizardEl("div", "dz-wizard", document.body);
    dialog.id = DZ_WIZARD_ID;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "Create a theme");

    document.addEventListener("keydown", dzWizardKeydown);
    dzWizardRender();
}

function dzWizardKeydown(e) {
    if (e.key === "Escape") { dzCloseThemeWizard(); }
}

function dzCloseThemeWizard() {
    var dialog = document.getElementById(DZ_WIZARD_ID);
    if (dialog && dialog.parentNode) { dialog.parentNode.removeChild(dialog); }
    var scrim = document.getElementById("mk-rgbw-scrim");
    if (scrim) {
        scrim.style.display = "none";
        scrim.removeEventListener("click", dzCloseThemeWizard);
    }
    document.removeEventListener("keydown", dzWizardKeydown);
    DZ_WIZARD = null;
}

/* Full re-render per step. The dialog is small and re-rendering keeps step
   state in one place instead of spread across per-control update handlers. */
function dzWizardRender() {
    var dialog = document.getElementById(DZ_WIZARD_ID);
    if (!dialog || !DZ_WIZARD) { return; }
    dialog.textContent = "";

    var head = dzWizardEl("div", "dz-wizard-head", dialog);
    dzWizardEl("div", "dz-wizard-title", head).textContent = "Create a theme";

    /* Codified dialog-close language (DESIGN.md, Color Popup): an icon-quiet
       control with its own class holding an Ionicon, never .btn-icon itself. */
    var close = dzWizardEl("button", "dz-wizard-close", head);
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    dzWizardEl("i", "icon ion-md-close", close);
    close.addEventListener("click", dzCloseThemeWizard);

    var steps = dzWizardEl("div", "dz-wizard-steps", head);
    ["Colours", "Look", "Name"].forEach(function (label, i) {
        var stepEl = dzWizardEl("span", "dz-wizard-step", steps);
        if (i + 1 === DZ_WIZARD.step) {
            stepEl.className += " is-current";
            stepEl.setAttribute("aria-current", "step");
        }
        stepEl.textContent = label;
    });

    var bodyEl = dzWizardEl("div", "dz-wizard-body", dialog);
    if (DZ_WIZARD.step === 1) { dzWizardStepColours(bodyEl); }
    else if (DZ_WIZARD.step === 2) { dzWizardStepLook(bodyEl); }
    else { dzWizardStepName(bodyEl); }

    var foot = dzWizardEl("div", "dz-wizard-foot", dialog);
    var cancel = dzWizardEl("button", "btn btn-default dz-wizard-cancel", foot); // Ghost family
    cancel.type = "button";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", dzCloseThemeWizard);

    if (DZ_WIZARD.step > 1) {
        var back = dzWizardEl("button", "btn btn-default dz-wizard-back", foot); // Ghost family
        back.type = "button";
        back.textContent = "Back";
        back.addEventListener("click", function () {
            DZ_WIZARD.step -= 1;
            dzWizardRender();
        });
    }
    var next = dzWizardEl("button", "btn btn-primary dz-wizard-next", foot); // Filled primary
    next.type = "button";
    next.textContent = DZ_WIZARD.step === 3 ? "Save theme" : "Next";
    next.addEventListener("click", function () {
        if (DZ_WIZARD.step < 3) { DZ_WIZARD.step += 1; dzWizardRender(); }
        else { dzWizardSave(); }
    });
}

/* A miniature of the real UI: navbar, two cards (one active, one
   unavailable), a filled button and the three semantic states. It shows the
   things a swatch strip cannot - whether text is readable on the card,
   whether the disabled state is perceivable, whether the semantics look like
   siblings of the accent. Every colour reaches a style property only. */
function dzWizardMockup(colors, label) {
    var wrap = dzWizardEl("div", "dz-wizard-mock");
    wrap.style.background = colors.background;
    wrap.style.borderColor = colors.border;

    var nav = dzWizardEl("div", "dz-wizard-mock-nav", wrap);
    nav.style.background = colors.navbar;
    nav.style.color = colors.main_text;
    var dot = dzWizardEl("span", "dz-wizard-mock-dot", nav);
    dot.style.background = colors.main_color;
    nav.appendChild(document.createTextNode("Machinon"));

    var body = dzWizardEl("div", "dz-wizard-mock-body", wrap);

    var card = dzWizardEl("div", "dz-wizard-mock-card", body);
    card.style.background = colors.item;
    card.style.borderColor = colors.border;
    var t = dzWizardEl("div", "dz-wizard-mock-t", card);
    t.style.color = colors.main_text;
    t.textContent = "Living Room";
    var s = dzWizardEl("div", "dz-wizard-mock-s", card);
    s.style.color = colors.alt_text;
    s.textContent = "21.4 °C · 47%";
    var v = dzWizardEl("div", "dz-wizard-mock-v", card);
    v.style.color = colors.main_color;
    v.textContent = "On";

    var card2 = dzWizardEl("div", "dz-wizard-mock-card", body);
    card2.style.background = colors.item;
    card2.style.borderColor = colors.border;
    var t2 = dzWizardEl("div", "dz-wizard-mock-t", card2);
    t2.style.color = colors.main_text;
    t2.textContent = "Back Door";
    var s2 = dzWizardEl("div", "dz-wizard-mock-s", card2);
    s2.style.color = colors.disabled;
    s2.textContent = "Unavailable";

    var row = dzWizardEl("div", "dz-wizard-mock-row", body);
    var btn = dzWizardEl("span", "dz-wizard-mock-btn", row);
    btn.style.background = colors.main_color;
    btn.style.color = colors.accent_text;
    btn.textContent = "Apply";
    [["error", "Err"], ["success", "Ok"], ["warning", "Warn"]].forEach(function (pair) {
        var chip = dzWizardEl("span", "dz-wizard-mock-chip", row);
        chip.style.color = colors[pair[0]];
        chip.style.borderColor = colors[pair[0]];
        chip.textContent = pair[1];
    });

    if (label) {
        var cap = dzWizardEl("div", "dz-wizard-mock-cap", wrap);
        cap.style.color = colors.alt_text;
        cap.textContent = label;
    }
    return wrap;
}

/* One colour field in the hub's swatch language. Mirrors
   dzHubBuildColorSwatch (src/js/theme-hub.js): a <label> wrapping a centered
   caption above a full-width type=color input. Built here rather than called
   from the hub because that function binds directly to theme.color_scheme,
   and the wizard must not touch live theme state before Save. */
function dzWizardSwatch(label, value, onChange) {
    var cell = dzWizardEl("label", "dz-hub-swatch");
    var span = dzWizardEl("span", "dz-hub-swatch-label", cell);
    span.textContent = label;
    var input = dzWizardEl("input", "dz-hub-swatch-input", cell);
    input.type = "color";
    input.value = value;
    input.addEventListener("input", function () { onChange(input.value.toUpperCase()); });
    return cell;
}

function dzWizardCurrentPair() {
    return dzGenerateSchemePair({
        accent: DZ_WIZARD.accent, surface: DZ_WIZARD.surface, look: DZ_WIZARD.look
    });
}

function dzWizardPreviewRow(host, pair) {
    var row = dzWizardEl("div", "dz-wizard-previews", host);
    row.appendChild(dzWizardMockup(pair.light, "Light"));
    row.appendChild(dzWizardMockup(pair.dark, "Dark"));
}

/* Repaint the step-1 preview miniatures in place, WITHOUT touching the
   swatch inputs above them. This exists because a type=color input fires
   `input` continuously while the user drags inside the OS colour picker,
   and dzWizardRender() starts with `dialog.textContent = ""`: rebuilding the
   whole dialog on every `input` would destroy and recreate the very
   <input type=color> element the native picker is anchored to mid-drag,
   which can close or stall it in some browsers. That is exactly why the
   hub's own swatch (dzHubBuildColorSwatch, src/js/theme-hub.js) binds
   `change`, not `input` - it can afford a full re-render because it only
   fires once, on commit. The wizard cannot copy that: the whole point of
   this preview is that it updates WHILE you choose, so it needs `input`,
   which means it must never re-render. Structural changes (the grey-tint
   checkbox, selecting a look, moving between steps) are not driven by a
   picker drag and still go through the normal dzWizardRender() path. */
function dzWizardRefreshPreviews(host) {
    var row = host.querySelector(".dz-wizard-previews");
    if (!row) { return; }
    row.textContent = "";
    var pair = dzWizardCurrentPair();
    row.appendChild(dzWizardMockup(pair.light, "Light"));
    row.appendChild(dzWizardMockup(pair.dark, "Dark"));
}

function dzWizardStepColours(host) {
    dzWizardEl("p", "dz-wizard-lead", host).textContent =
        "Pick your main colour. Everything else is calculated from it and checked for contrast.";

    /* Colour inputs are the hub's own swatch component, class-for-class
       (.dz-hub-swatch / -label / -input, css/theme-hub.css), so they match
       the seven swatches sitting directly behind this dialog in the Colors
       group. No wizard-specific colour input exists. */
    var swatches = dzWizardEl("div", "dz-hub-swatches dz-wizard-swatches", host);
    /* Both swatches update ONLY the preview row, not dzWizardRender() - see
       the comment on dzWizardRefreshPreviews for why a full re-render here
       would fight the native colour picker mid-drag. */
    swatches.appendChild(dzWizardSwatch("Main colour", DZ_WIZARD.accent, function (value) {
        DZ_WIZARD.accent = value;
        dzWizardRefreshPreviews(host);
    }));
    if (DZ_WIZARD.surface !== null) {
        swatches.appendChild(dzWizardSwatch("Grey tint", DZ_WIZARD.surface, function (value) {
            DZ_WIZARD.surface = value;
            dzWizardRefreshPreviews(host);
        }));
    }

    var toggleLabel = dzWizardEl("label", "dz-wizard-check", host);
    var toggle = dzWizardEl("input", null, toggleLabel);
    toggle.type = "checkbox";
    toggle.checked = DZ_WIZARD.surface !== null;
    dzWizardEl("span", null, toggleLabel).textContent = "Tint the greys with a different colour";
    toggle.addEventListener("change", function () {
        DZ_WIZARD.surface = toggle.checked ? DZ_WIZARD.accent : null;
        dzWizardRender();
    });

    if (DZ_WIZARD.surface !== null) {
        dzWizardEl("p", "dz-wizard-hint", host).textContent =
            "Only the hue is used, not the exact shade.";
    }

    dzWizardPreviewRow(host, dzWizardCurrentPair());
}

/* Three real previews rather than three adjectives: the looks differ in ways
   ("how much hue is in the greys", "how deep the dark variant goes") that a
   radio label cannot convey. */
function dzWizardStepLook(host) {
    dzWizardEl("p", "dz-wizard-lead", host).textContent =
        "Pick a look. Each one is your colour, arranged differently.";
    var grid = dzWizardEl("div", "dz-wizard-looks", host);
    DZ_LOOK_ORDER.forEach(function (look) {
        var opt = dzWizardEl("div", "dz-wizard-look", grid);
        if (look === DZ_WIZARD.look) { opt.className += " is-selected"; }
        opt.setAttribute("data-look", look);
        var pair = dzGenerateSchemePair({
            accent: DZ_WIZARD.accent, surface: DZ_WIZARD.surface, look: look
        });
        var row = dzWizardEl("div", "dz-wizard-look-pair", opt);
        row.appendChild(dzWizardMockup(pair.light, null));
        row.appendChild(dzWizardMockup(pair.dark, null));
        dzWizardEl("div", "dz-wizard-look-name", opt).textContent = DZ_LOOKS[look].label;
        dzWizardEl("div", "dz-wizard-look-desc", opt).textContent = DZ_LOOKS[look].description;
        opt.addEventListener("click", function () {
            DZ_WIZARD.look = look;
            dzWizardRender();
        });
    });
}

/* Contrast forces the accent's lightness to move whenever the picked colour
   cannot clear its ratio as-is - a bright yellow must darken a lot on a light
   background. Showing the before/after makes that an honest adjustment the
   user can see rather than a silent override of their choice. */
function dzWizardAccentDrift(host, pair) {
    var lightDrift = pair.light.main_color.toUpperCase() !== DZ_WIZARD.accent.toUpperCase();
    var darkDrift = pair.dark.main_color.toUpperCase() !== DZ_WIZARD.accent.toUpperCase();
    if (!lightDrift && !darkDrift) { return; }
    var wrap = dzWizardEl("div", "dz-wizard-drift", host);
    dzWizardEl("span", "dz-wizard-drift-label", wrap).textContent =
        "Your colour was adjusted to stay readable:";
    [["Light", pair.light.main_color], ["Dark", pair.dark.main_color]].forEach(function (row) {
        var line = dzWizardEl("span", "dz-wizard-drift-row", wrap);
        var from = dzWizardEl("span", "dz-wizard-drift-chip", line);
        from.style.background = DZ_WIZARD.accent;
        line.appendChild(document.createTextNode(" → "));
        var to = dzWizardEl("span", "dz-wizard-drift-chip", line);
        to.style.background = row[1];
        line.appendChild(document.createTextNode(" " + row[0]));
    });
}

function dzWizardStepName(host) {
    var pair = dzWizardCurrentPair();

    /* The input carries NO wizard styling: the theme already styles
       input[type="text"] globally (css/search.css) as transparent with an
       accent underline, and checkboxes likewise. Overriding that here would
       make this one dialog's fields look foreign. */
    var field = dzWizardEl("div", "dz-wizard-name-field", host);
    var label = dzWizardEl("label", "dz-wizard-name-label", field);
    label.textContent = "Theme name";
    label.setAttribute("for", "dz-wizard-name-input");
    var input = dzWizardEl("input", "dz-wizard-name", field);
    input.id = "dz-wizard-name-input";
    input.type = "text";
    input.maxLength = 40;
    input.placeholder = "My theme";
    input.value = DZ_WIZARD.name;

    /* The summary line below must track what the user is typing, but the
       `input` handler must NOT call dzWizardRender(): a full re-render would
       destroy and recreate this very field mid-keystroke, losing focus and
       the caret position (the same class of bug Task 6 fixed for the colour
       swatch). So the one line is rewritten in place via a kept reference
       instead - textContent only, never markup, since this is user input. */
    var lead = dzWizardEl("p", "dz-wizard-lead", host);
    function dzWizardNameSummary() {
        var shown = DZ_WIZARD.name.trim() || "My theme";
        lead.textContent = "Saved as two schemes, “" + shown + " Light” and “" + shown + " Dark”.";
    }
    dzWizardNameSummary();
    input.addEventListener("input", function () {
        DZ_WIZARD.name = input.value;
        dzWizardNameSummary();
    });

    dzWizardPreviewRow(host, pair);
    dzWizardAccentDrift(host, pair);
}

/* The generator meets every floor by construction, so a failure here is a
   generator bug, not a user mistake. Refuse rather than persist a scheme that
   fails the theme's own accessibility gate. */
function dzWizardSave() {
    var name = (DZ_WIZARD.name || "").trim();
    if (!name) {
        if (typeof generate_noty === "function") {
            generate_noty("warning", "Give your theme a name first.", 4000);
        }
        return;
    }
    /* "|" separates name from variant in a generated pair's slug
       (user:<name>|<variant>). A name containing one would collide with that
       grammar: a preset literally called "Sunset|light" and the light half of
       a pair called "Sunset" produce the same slug. applyScheme resolves the
       ambiguity by preferring an exact name match, so nothing breaks, but one
       of the two becomes unreachable. Cheaper to refuse the character here
       than to carry the ambiguity. */
    if (name.indexOf("|") !== -1) {
        if (typeof generate_noty === "function") {
            generate_noty("warning", "A theme name cannot contain the | character.", 5000);
        }
        return;
    }
    var pair = dzWizardCurrentPair();
    var problems = [];
    ["light", "dark"].forEach(function (variant) {
        if (typeof schemeContrastFailures === "function") {
            schemeContrastFailures(pair[variant]).forEach(function (f) {
                problems.push(variant + ": " + f);
            });
        }
    });
    if (problems.length) {
        console.log(themeName + " - generator produced a failing scheme:", problems);
        if (typeof generate_noty === "function") {
            generate_noty("error",
                "That combination could not be made readable. Please report this.", 8000);
        }
        return;
    }
    var seed = { accent: DZ_WIZARD.accent, surface: DZ_WIZARD.surface, look: DZ_WIZARD.look };
    dzSaveGeneratedPair(name, seed, pair);
    dzCloseThemeWizard();
    if (typeof generate_noty === "function") {
        generate_noty("success", "“" + name + "” created.", 4000);
    }
}
