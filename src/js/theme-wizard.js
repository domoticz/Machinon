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

/* Stubs: Tasks 6 and 7 fill in the real step bodies and save logic. */
function dzWizardStepColours(host) { host.textContent = "step 1"; }
function dzWizardStepLook(host) { host.textContent = "step 2"; }
function dzWizardStepName(host) { host.textContent = "step 3"; }
function dzWizardSave() { dzCloseThemeWizard(); }
