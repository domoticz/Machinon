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
    dialog.setAttribute("aria-label", dzT("hub.wizard.aria"));

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
    dzWizardEl("div", "dz-wizard-title", head).textContent = dzT("hub.wizard.title");

    /* Codified dialog-close language (DESIGN.md, Color Popup): an icon-quiet
       control with its own class holding an Ionicon, never .btn-icon itself. */
    var close = dzWizardEl("button", "dz-wizard-close", head);
    close.type = "button";
    close.setAttribute("aria-label", dzT("common.close"));
    dzWizardEl("i", "icon ion-md-close", close);
    close.addEventListener("click", dzCloseThemeWizard);

    var steps = dzWizardEl("div", "dz-wizard-steps", head);
    [dzT("hub.wizard.steps.colours"), dzT("hub.wizard.steps.look"), dzT("hub.wizard.steps.name")].forEach(function (label, i) {
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
    cancel.textContent = dzT("hub.wizard.cancel");
    cancel.addEventListener("click", dzCloseThemeWizard);

    if (DZ_WIZARD.step > 1) {
        var back = dzWizardEl("button", "btn btn-default dz-wizard-back", foot); // Ghost family
        back.type = "button";
        back.textContent = dzT("hub.wizard.back");
        back.addEventListener("click", function () {
            DZ_WIZARD.step -= 1;
            dzWizardRender();
        });
    }
    var next = dzWizardEl("button", "btn btn-primary dz-wizard-next", foot); // Filled primary
    next.type = "button";
    next.textContent = DZ_WIZARD.step === 3 ? dzT("hub.wizard.save_theme") : dzT("hub.wizard.next");
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
    t.textContent = dzT("hub.wizard.preview.device");
    var s = dzWizardEl("div", "dz-wizard-mock-s", card);
    s.style.color = colors.alt_text;
    s.textContent = dzT("hub.wizard.preview.status");
    var v = dzWizardEl("div", "dz-wizard-mock-v", card);
    v.style.color = colors.main_color;
    v.textContent = dzT("hub.wizard.preview.value");

    var card2 = dzWizardEl("div", "dz-wizard-mock-card", body);
    card2.style.background = colors.item;
    card2.style.borderColor = colors.border;
    var t2 = dzWizardEl("div", "dz-wizard-mock-t", card2);
    t2.style.color = colors.main_text;
    t2.textContent = dzT("hub.wizard.preview.device2");
    var s2 = dzWizardEl("div", "dz-wizard-mock-s", card2);
    s2.style.color = colors.disabled;
    s2.textContent = dzT("hub.wizard.preview.status2");

    var row = dzWizardEl("div", "dz-wizard-mock-row", body);
    var btn = dzWizardEl("span", "dz-wizard-mock-btn", row);
    btn.style.background = colors.main_color;
    btn.style.color = colors.accent_text;
    btn.textContent = dzT("hub.wizard.apply");
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

/* One colour field, via the shared factory dzBuildColorField
   (src/js/theme-hub.js - loaded before this file, THEME_MODULES in
   custom.js): the hub's .dz-hub-swatch label/geometry plus the wheel + hex
   disclosure, so the wizard and the hub's 7-swatch editor share one
   implementation rather than drifting. `anchor` is the swatches row
   (`.dz-wizard-swatches`) the wheel/hex panel is inserted after when opened.
   `onChange` is called here, never bound directly to theme.color_scheme:
   the wizard must not touch live theme state before Save, so the caller
   (dzWizardStepColours) only ever updates DZ_WIZARD's own local state. The
   native input keeps firing "input" (continuous), not "change" - see
   dzWizardRefreshPreviews for why a full re-render on every event would
   fight the native colour picker mid-drag. */
function dzWizardSwatch(label, value, onChange, anchor) {
    var built = dzBuildColorField(label, value, onChange, {
        nativeEvent: "input",
        disclosureAnchor: anchor
    });
    return built.wrap;
}

function dzWizardCurrentPair() {
    return dzGenerateSchemePair({
        accent: DZ_WIZARD.accent, surface: DZ_WIZARD.surface, look: DZ_WIZARD.look
    });
}

function dzWizardPreviewRow(host, pair) {
    var row = dzWizardEl("div", "dz-wizard-previews", host);
    row.appendChild(dzWizardMockup(pair.light, dzT("hub.wizard.light")));
    row.appendChild(dzWizardMockup(pair.dark, dzT("hub.wizard.dark")));
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
    row.appendChild(dzWizardMockup(pair.light, dzT("hub.wizard.light")));
    row.appendChild(dzWizardMockup(pair.dark, dzT("hub.wizard.dark")));
}

function dzWizardStepColours(host) {
    dzWizardEl("p", "dz-wizard-lead", host).textContent = dzT("hub.wizard.lead_colours");

    /* Colour inputs are the hub's own swatch component, class-for-class
       (.dz-hub-swatch / -label / -input, css/theme-hub.css), so they match
       the seven swatches sitting directly behind this dialog in the Colors
       group. No wizard-specific colour input exists. */
    var swatches = dzWizardEl("div", "dz-hub-swatches dz-wizard-swatches", host);
    /* Both swatches update ONLY the preview row, not dzWizardRender() - see
       the comment on dzWizardRefreshPreviews for why a full re-render here
       would fight the native colour picker mid-drag. */
    swatches.appendChild(dzWizardSwatch(dzT("hub.wizard.accent_label"), DZ_WIZARD.accent, function (value) {
        /* DZ_WIZARD can go null between this callback being wired and it
           firing: pressing Escape while dragging the wheel closes the
           dialog (dzCloseThemeWizard nulls DZ_WIZARD) but the drag's
           document-level mouseup still runs, and its onCommit still calls
           this onChange. Console-only and self-recovering without the
           guard (a TypeError here does not corrupt any state), but cheap
           to avoid. */
        if (!DZ_WIZARD) { return; }
        DZ_WIZARD.accent = value;
        dzWizardRefreshPreviews(host);
    }, swatches));
    if (DZ_WIZARD.surface !== null) {
        swatches.appendChild(dzWizardSwatch(dzT("hub.wizard.surface_label"), DZ_WIZARD.surface, function (value) {
            if (!DZ_WIZARD) { return; } // see the same guard above
            DZ_WIZARD.surface = value;
            dzWizardRefreshPreviews(host);
        }, swatches));
    }

    var toggleLabel = dzWizardEl("label", "dz-wizard-check", host);
    var toggle = dzWizardEl("input", null, toggleLabel);
    toggle.type = "checkbox";
    toggle.checked = DZ_WIZARD.surface !== null;
    dzWizardEl("span", null, toggleLabel).textContent = dzT("hub.wizard.tint_toggle");
    toggle.addEventListener("change", function () {
        DZ_WIZARD.surface = toggle.checked ? DZ_WIZARD.accent : null;
        dzWizardRender();
    });

    if (DZ_WIZARD.surface !== null) {
        dzWizardEl("p", "dz-wizard-hint", host).textContent = dzT("hub.wizard.hint_colours");
    }

    dzWizardPreviewRow(host, dzWizardCurrentPair());
}

/* Three real previews rather than three adjectives: the looks differ in ways
   ("how much hue is in the greys", "how deep the dark variant goes") that a
   radio label cannot convey. */
function dzWizardStepLook(host) {
    dzWizardEl("p", "dz-wizard-lead", host).textContent = dzT("hub.wizard.lead_look");
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
        dzWizardEl("div", "dz-wizard-look-name", opt).textContent = dzT("hub.wizard.looks." + look + ".label");
        dzWizardEl("div", "dz-wizard-look-desc", opt).textContent = dzT("hub.wizard.looks." + look + ".description");
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
    dzWizardEl("span", "dz-wizard-drift-label", wrap).textContent = dzT("hub.wizard.drift_label");
    [[dzT("hub.wizard.light"), pair.light.main_color], [dzT("hub.wizard.dark"), pair.dark.main_color]].forEach(function (row) {
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
    label.textContent = dzT("hub.wizard.name_label");
    label.setAttribute("for", "dz-wizard-name-input");
    var input = dzWizardEl("input", "dz-wizard-name", field);
    input.id = "dz-wizard-name-input";
    input.type = "text";
    input.maxLength = 40;
    input.placeholder = dzT("hub.wizard.name_placeholder");
    input.value = DZ_WIZARD.name;

    /* The summary line below must track what the user is typing, but the
       `input` handler must NOT call dzWizardRender(): a full re-render would
       destroy and recreate this very field mid-keystroke, losing focus and
       the caret position (the same class of bug Task 6 fixed for the colour
       swatch). So the one line is rewritten in place via a kept reference
       instead - textContent only, never markup, since this is user input. */
    var lead = dzWizardEl("p", "dz-wizard-lead", host);
    function dzWizardNameSummary() {
        var shown = DZ_WIZARD.name.trim() || dzT("hub.wizard.name_placeholder");
        lead.textContent = dzT("hub.wizard.saved_lead", { name: shown });
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
            generate_noty("warning", dzT("toasts.wizard_name_first"), 4000);
        }
        return;
    }
    /* Shared with saveCurrentColorsAsScheme (src/js/schemes.js, loaded before
       this file in THEME_MODULES): see dzSchemeNameError there for why "|" is
       refused and why the check lives in one place rather than here alone. */
    var nameError = dzSchemeNameError(name);
    if (nameError) {
        if (typeof generate_noty === "function") {
            generate_noty("warning", nameError, 5000);
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
            generate_noty("error", dzT("toasts.wizard_unreadable"), 8000);
        }
        return;
    }
    var seed = { accent: DZ_WIZARD.accent, surface: DZ_WIZARD.surface, look: DZ_WIZARD.look };
    dzSaveGeneratedPair(name, seed, pair);
    dzCloseThemeWizard();
    if (typeof generate_noty === "function") {
        generate_noty("success", dzT("toasts.wizard_created", { name: name }), 4000);
    }
}
