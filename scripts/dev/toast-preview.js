/* DEV ONLY. Never shipped: scripts/build-release.sh's ALLOWLIST has no
 * `scripts/` entry, and nothing outside that list reaches users. This is also
 * why it must NOT live in src/js/, which IS shipped wholesale.
 *
 * Injects a control panel into the running rig so the toast surface can be
 * looked at and tweaked live. Load it from the browser console:
 *
 *   var s=document.createElement('script');
 *   s.src='/styles/default/scripts/dev/toast-preview.js';
 *   document.head.appendChild(s);
 *
 * (The beta image serves the ACTIVE theme under /styles/default/; the
 * /styles/machinon/ path also works when that is the active theme.)
 */
(function () {
    if (document.getElementById("dz-toast-preview")) return;

    var panel = document.createElement("div");
    panel.id = "dz-toast-preview";
    panel.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:99999;" +
        "background:#fff;color:#111;border:1px solid #888;border-radius:6px;" +
        "padding:10px;font:12px sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.3);" +
        "max-width:260px;display:flex;flex-wrap:wrap;gap:4px;";

    function btn(label, fn) {
        var b = document.createElement("button");
        b.textContent = label;
        b.style.cssText = "font:11px sans-serif;padding:3px 6px;cursor:pointer;";
        b.addEventListener("click", fn);
        panel.appendChild(b);
        return b;
    }

    ["success", "warning", "error", "info"].forEach(function (t) {
        btn(t, function () {
            dzToast({ type: t, title: t.charAt(0).toUpperCase() + t.slice(1),
                      body: "Living Room Temperature", source: "theme" });
        });
    });

    btn("timeout x5", function () {
        ["Hall", "Garage", "Attic", "Shed", "Porch"].forEach(function (n) {
            dzToast({ type: "warning", title: "Sensor timed out", body: n,
                      deviceName: n, source: "device-warning", group: "device-timeout",
                      groupTitle: function (c) { return c + " sensors timed out"; } });
        });
    });

    btn("battery x4", function () {
        ["Front Door", "Motion Hall", "Window Attic", "Leak Kitchen"].forEach(function (n) {
            dzToast({ type: "warning", title: "Battery low", body: n,
                      deviceName: n, source: "device-warning", group: "device-battery",
                      groupTitle: function (c) { return c + " devices low on battery"; } });
        });
    });

    btn("storm 12", function () {
        for (var i = 1; i <= 12; i++) {
            dzToast({ type: "warning", title: "Warning " + i, body: "Device " + i, source: "theme" });
        }
    });

    btn("sticky", function () {
        dzToast({ type: "info", title: "Browser cache is being refreshed",
                  body: "Please standby", timeout: false, source: "core" });
    });

    btn("core HTML", function () {
        /* Exercises the adapter's HTML-to-text path with core's real markup. */
        generate_noty("information", "<b>Sent remote command</b><br>Please standby...", 6000);
    });

    btn("light", function () { setDarkFeature(false); setColorScheme(); });
    btn("dark", function () { setDarkFeature(true); setColorScheme(); });

    btn("narrow", function () {
        document.body.style.maxWidth = document.body.style.maxWidth ? "" : "390px";
    });

    btn("reload CSS", function () {
        document.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
            if (l.href.indexOf("custom.css") === -1) return;
            l.href = l.href.split("?")[0] + "?t=" + Date.now();
        });
    });

    btn("close all", function () {
        dzToastCloseAll();
    });

    btn("x", function () { panel.remove(); });

    document.body.appendChild(panel);
})();
