/* Copy actions under the "Idx" row of a device card's options menu: the
   idx itself, a dzVents reference, the JSON API URL that reads the device,
   and a plain-text details block for support posts.

   Scene and group cards carry the same menu, but their idx numbers a
   different table: devices(5) and scenes(5) are unrelated. Every builder
   therefore takes the card's kind ("device", "scene" or "group"), and an
   unknown kind produces no text rather than a reference to the wrong thing.

   The text builders are pure functions of the device record so they can be
   tested without a browser; dzDeviceCopyMount wires them to the menu.

   The details block stays in English whatever the UI language: it is meant
   for forum and GitHub posts, where the readers are maintainers. The menu
   labels are translated. */

/* Names come from users and plugins and may hold line breaks or tabs; one
   would split a dzVents comment onto a line of code, and the rest would
   break the one-field-per-line block. */
function dzDeviceCopyClean(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").trim();
}

/* Only a plain number is an idx; anything else would end up inside a code
   line or a URL. */
function dzDeviceCopyIdx(idx) {
    var s = dzDeviceCopyClean(idx);
    return /^\d+$/.test(s) ? s : null;
}

var DZ_COPY_DZVENTS = { device: "devices", scene: "scenes", group: "groups" };
var DZ_COPY_API = { device: "getdevices", scene: "getscenes", group: "getscenes" };

/* The kind from the card's record: core's getscenes marks every entry
   "Scene" or "Group", and nothing else uses those types. Without a record a
   card in a scene list cannot be told apart (scene or group), so it has no
   kind. */
function dzDeviceCopyKind(device, inSceneList) {
    var type = device && device.Type;
    if (type === "Scene") return "scene";
    if (type === "Group") return "group";
    if (inSceneList) return null;
    return "device";
}

function dzDeviceCopyDzVents(idx, name, kind) {
    var id = dzDeviceCopyIdx(idx);
    var collection = DZ_COPY_DZVENTS[kind];
    if (id === null || !collection) return null;
    var label = dzDeviceCopyClean(name);
    return "domoticz." + collection + "(" + id + ")" + (label ? " -- " + label : "");
}

/* Resolved against the page's own address so an install under a sub-path
   or behind a reverse proxy gets a working URL. Credentials in the address
   bar (http://user:pass@host/) are dropped: this text gets pasted into
   public posts. */
function dzDeviceCopyApiUrl(idx, base, kind) {
    var id = dzDeviceCopyIdx(idx);
    var param = DZ_COPY_API[kind];
    if (id === null || !param) return null;
    try {
        var url = new URL("json.htm?type=command&param=" + param + "&rid=" + id, base);
        url.username = "";
        url.password = "";
        url.hash = "";
        return url.href;
    } catch (e) {
        return null;
    }
}

/* One "Label: value" line per field the record actually has; a missing
   field is left out rather than printed empty. Scenes and groups have no
   hardware and report their state in Status rather than Data. */
function dzDeviceCopyDetails(device, idx, versions, kind) {
    var d = device || {};
    var id = dzDeviceCopyIdx(idx);
    var lines = [];
    function add(label, value) {
        var v = dzDeviceCopyClean(value);
        if (v) lines.push(label + ": " + v);
    }
    var name = dzDeviceCopyClean(d.Name);
    var noun = kind === "scene" ? "Scene" : kind === "group" ? "Group" : "Device";
    lines.push(noun + ": " + (name || "(no name)") + (id !== null ? " (idx " + id + ")" : ""));
    add("Type", [d.Type, d.SubType, d.SwitchType].map(dzDeviceCopyClean).filter(Boolean).join(", "));
    add("Hardware", d.HardwareName);
    add("Hardware type", d.HardwareType);
    var devId = dzDeviceCopyClean(d.ID);
    var unit = dzDeviceCopyClean(d.Unit);
    if (devId || unit) lines.push("Device ID / unit: " + (devId || "-") + " / " + (unit || "-"));
    add("Value", kind === "scene" || kind === "group" ? d.Status : d.Data);
    add("Last update", d.LastUpdate);
    var v = versions || {};
    var built = [];
    if (dzDeviceCopyClean(v.domoticz)) built.push("Domoticz " + dzDeviceCopyClean(v.domoticz));
    if (dzDeviceCopyClean(v.theme)) built.push("Machinon " + dzDeviceCopyClean(v.theme));
    if (built.length) lines.push(built.join(", "));
    return lines.join("\n");
}

function dzDeviceCopyVersions() {
    return {
        domoticz: (typeof dzApiState !== "undefined" && dzApiState.domoticzVersion) || "",
        theme: (typeof theme !== "undefined" && theme && theme.version) || ""
    };
}

/* Anchors are what the menu's row styling targets (.options .btnsmall), so
   the actions are anchors with button semantics and keyboard activation. */
function dzDeviceCopyButton(className, label, onActivate) {
    var a = document.createElement("a");
    a.className = "btnsmall " + className;
    a.setAttribute("role", "button");
    a.setAttribute("tabindex", "0");
    a.textContent = label;
    a.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        onActivate(a);
    });
    a.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onActivate(a);
        }
    });
    return a;
}

/* Returns the nodes to append to the card's options menu: the Idx row,
   now a toggle, and the copy actions it reveals. itemEl is the card's
   .item element, used to find its device record at click time. */
function dzDeviceCopyMount(idx, itemEl) {
    var id = dzDeviceCopyIdx(idx);
    var frag = document.createDocumentFragment();

    var panel = document.createElement("div");
    panel.className = "dz-copy-menu";
    panel.hidden = true;

    function kind(dev) {
        return dzDeviceCopyKind(dev, !!(itemEl && itemEl.closest && itemEl.closest("#scenecontent, #dashScenes")));
    }

    var toggle = dzDeviceCopyButton("dz-idno", "Idx: " + dzDeviceCopyClean(idx), function() {
        panel.hidden = !panel.hidden;
        toggle.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
    });
    toggle.setAttribute("aria-expanded", "false");
    toggle.title = dzT("device_copy.title");
    frag.appendChild(toggle);
    if (id === null) return frag;

    /* The box sits in a wrapper so it takes the menu's width rather than
       setting it (css/cards.css .dz-copy-fallback). */
    var fallback = document.createElement("div");
    fallback.className = "dz-copy-fallback";
    fallback.hidden = true;
    var area = document.createElement("textarea");
    area.className = "dz-copy-fallback-text";
    area.readOnly = true;
    area.rows = 4;
    area.setAttribute("aria-label", dzT("device_copy.fallback"));
    fallback.appendChild(area);

    function copy(btn, label, build) {
        var text = build();
        if (!text) return;
        fallback.hidden = true;
        dzCopyText(text).then(function(ok) {
            if (ok) {
                btn.textContent = dzT("device_copy.copied");
                setTimeout(function() { btn.textContent = label; }, 1500);
                return;
            }
            area.value = text;
            fallback.hidden = false;
            try { area.focus(); area.select(); } catch (e) { /* best effort */ }
        });
    }

    [
        ["copy_idx", function() { return id; }],
        ["copy_dzvents", function() {
            var dev = dzCardRecord(itemEl);
            return dzDeviceCopyDzVents(id, dev && dev.Name, kind(dev));
        }],
        ["copy_api", function() {
            return dzDeviceCopyApiUrl(id, document.baseURI, kind(dzCardRecord(itemEl)));
        }],
        ["copy_details", function() {
            var dev = dzCardRecord(itemEl);
            return dzDeviceCopyDetails(dev, id, dzDeviceCopyVersions(), kind(dev));
        }]
    ].forEach(function(entry) {
        var label = dzT("device_copy." + entry[0]);
        panel.appendChild(dzDeviceCopyButton("dz-copy-item", label, function(btn) {
            copy(btn, label, entry[1]);
        }));
    });
    panel.appendChild(fallback);
    frag.appendChild(panel);
    return frag;
}

/* Collapses the copy actions, so the menu always reopens in its short form. */
function dzDeviceCopyCollapse(menuEl) {
    if (!menuEl) return;
    var panel = menuEl.querySelector(".dz-copy-menu");
    if (panel) panel.hidden = true;
    var toggle = menuEl.querySelector(".dz-idno");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    var fallback = menuEl.querySelector(".dz-copy-fallback");
    if (fallback) fallback.hidden = true;
}
