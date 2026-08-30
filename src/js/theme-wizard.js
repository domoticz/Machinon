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

function dzWizardStepColours(host) {
    dzWizardEl("p", "dz-wizard-lead", host).textContent =
        "Pick your main colour. Everything else is calculated from it and checked for contrast.";

    /* Colour inputs are the hub's own swatch component, class-for-class
       (.dz-hub-swatch / -label / -input, css/theme-hub.css), so they match
       the seven swatches sitting directly behind this dialog in the Colors
       group. No wizard-specific colour input exists. */
    var swatches = dzWizardEl("div", "dz-hub-swatches dz-wizard-swatches", host);
    swatches.appendChild(dzWizardSwatch("Main colour", DZ_WIZARD.accent, function (value) {
        DZ_WIZARD.accent = value;
        dzWizardRender();
    }));
    if (DZ_WIZARD.surface !== null) {
        swatches.appendChild(dzWizardSwatch("Grey tint", DZ_WIZARD.surface, function (value) {
            DZ_WIZARD.surface = value;
            dzWizardRender();
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

/* Stub: Task 7 fills in the real step-3 body and save logic. */
function dzWizardStepName(host) { host.textContent = "step 3"; }
function dzWizardSave() { dzCloseThemeWizard(); }
