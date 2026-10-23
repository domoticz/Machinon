/* Adapters between Domoticz's two toast globals and Machinon's toast surface.
 *
 * THIS IS THE ONLY FILE THAT KNOWS CORE'S SIGNATURES:
 *   generate_noty(ntype, ntext, ntimeout)   ntext is HTML, ntimeout false = sticky
 *   ShowNotify(txt, timeout, iserror)       ARG 3 is the error flag, arg 2 a number
 *   HideNotify()                            hides the shared surface
 *   notifyBrowser.notify(title, body)       plain text, decorated in custom.js
 *
 * Nightglass hooks ShowNotify as (txt, ntype) and tests /error/i on arg 2, which
 * is the timeout NUMBER, so all 516 of core's error call sites render as info
 * and every caller's timeout is discarded. Keeping the signature knowledge in
 * one small file is the countermeasure.
 */

/* Core's toast text is HTML. Parsed INERT: DOMParser never runs scripts and the
   result is never inserted into the live document, so this is safe for text
   that came from hardware, plugins or a remote device name. */
function dzToastHtmlToText(html) {
    if (html === null || html === undefined) return "";
    var s = String(html);
    if (s.indexOf("<") === -1) return s;
    var doc = new DOMParser().parseFromString(s.replace(/<br\s*\/?>/gi, "\n"), "text/html");
    return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

var DZ_NOTY_TYPE_MAP = {
    success: "success", warning: "warning", error: "error",
    info: "info", information: "info", alert: "warning", notification: "info"
};

function dzToastFromNoty(ntype, ntext, ntimeout) {
    var text = dzToastHtmlToText(ntext);
    var nl = text.indexOf("\n");
    return dzToast({
        type: DZ_NOTY_TYPE_MAP[ntype] || "info",
        title: nl === -1 ? text : text.slice(0, nl),
        body: nl === -1 ? "" : text.slice(nl + 1).trim(),
        timeout: ntimeout === false ? false : (typeof ntimeout === "number" ? ntimeout : undefined),
        source: "core"
    });
}

/* The ONE suppression Machinon keeps. custom.css hid the whole #notification
   element to silence core's "Switching On/Off" chatter and silenced all 565
   ShowNotify call sites with it. Filtering by MESSAGE restores everything else.
   Matched against the translated string so it holds in every language. */
function dzToastIsSwitchChatter(txt) {
    var word = (typeof $ !== "undefined" && $.t) ? $.t("Switching") : "Switching";
    return String(txt || "").indexOf(word) === 0;
}

var dzToastLastShowNotify = null;

function dzToastFromShowNotify(txt, timeout, iserror) {
    /* The chatter filter never applies to an error. Core itself only ever
       raises "Switching ..." as a non-error progress message (arg 3 always
       omitted at its five call sites), but this guard means a message that
       merely starts with the same word can never be silently dropped when
       arg 3 says it is a real failure. Silently dropping a genuine error is
       exactly the defect this whole change exists to end. */
    if (!iserror && dzToastIsSwitchChatter(txt)) return { close: function() {} };
    dzToastLastShowNotify = dzToast({
        type: iserror ? "error" : "info",
        title: iserror ? ((typeof $ !== "undefined" && $.t) ? $.t("Error") : "Error")
                       : ((typeof $ !== "undefined" && $.t) ? $.t("Notification") : "Notification"),
        body: dzToastHtmlToText(txt),
        timeout: typeof timeout === "number" ? timeout : undefined,
        source: "core"
    });
    return dzToastLastShowNotify;
}

/* Core calls HideNotify() to dismiss the shared surface, e.g. immediately
   before raising a replacement. Closing the toast it raised preserves that. */
function dzToastHideNotify() {
    if (dzToastLastShowNotify) dzToastLastShowNotify.close();
    dzToastLastShowNotify = null;
}

/* A browser notification (core's notifyBrowser service, fed by the websocket
   "notification" event that SendNotification(..., subsystem="browser") raises)
   is plain text: core renders it with {{ }} interpolation, so it is not run
   through dzToastHtmlToText, and markup a plugin sends shows as typed. The
   switch-chatter filter does not apply: that silences core's own "Switching"
   progress lines, and a plugin's subject can begin with the same word. The
   group key is the message itself, so the same message twice in quick
   succession merges into one toast (dzToastIsContentRepeat in toasts.js);
   groupKind keeps that text out of diagnostics. */
function dzToastFromBrowserNotify(title, body) {
    var t = title === null || title === undefined ? "" : String(title);
    var b = body === null || body === undefined ? "" : String(body);
    return dzToast({
        type: "info",
        title: t || ((typeof $ !== "undefined" && $.t) ? $.t("Notification") : "Notification"),
        body: b,
        group: "browser-notify:" + t + "\n" + b,
        groupKind: "browser-notify",
        source: "browser-notify"
    });
}

function dzToastFromBuffered(e) {
    if (e.fn === "noty") return dzToastFromNoty.apply(null, e.args);
    if (e.fn === "notify") return dzToastFromBrowserNotify.apply(null, e.args);
    return dzToastFromShowNotify.apply(null, e.args);
}

function dzToastInstallHooks() {
    window.generate_noty = dzToastFromNoty;
    window.ShowNotify = dzToastFromShowNotify;
    window.HideNotify = dzToastHideNotify;

    /* Drain anything the custom.js bootstrap buffered while these modules were
       still loading. Raw calls were buffered, not interpreted, so the signature
       knowledge stays here. */
    var buf = window.__dzToastBuffer || [];
    for (var i = 0; i < buf.length; i++) {
        var e = buf[i];
        if (e.cancelled) continue;
        e.handle = dzToastFromBuffered(e);
    }
    window.__dzToastBuffer = null;
    /* Half of the gate that hides core's alertarea (css/toasts.css): the
       other half is custom.js's notifyBrowser decorator. Both have to be live,
       or a browser notification would have nowhere visible to go. */
    if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.classList.add("dz-notify-toasts");
    }
}

if (typeof window !== "undefined") dzToastInstallHooks();
