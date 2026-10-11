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
function dzToastIsSwitchChatter(txt) {
var word = (typeof $ !== "undefined" && $.t) ? $.t("Switching") : "Switching";
return String(txt || "").indexOf(word) === 0;
}
var dzToastLastShowNotify = null;
function dzToastFromShowNotify(txt, timeout, iserror) {
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
function dzToastHideNotify() {
if (dzToastLastShowNotify) dzToastLastShowNotify.close();
dzToastLastShowNotify = null;
}
function dzToastInstallHooks() {
window.generate_noty = dzToastFromNoty;
window.ShowNotify = dzToastFromShowNotify;
window.HideNotify = dzToastHideNotify;
var buf = window.__dzToastBuffer || [];
for (var i = 0; i < buf.length; i++) {
var e = buf[i];
if (e.cancelled) continue;
e.handle = e.fn === "noty" ? dzToastFromNoty.apply(null, e.args)
: dzToastFromShowNotify.apply(null, e.args);
}
window.__dzToastBuffer = null;
}
if (typeof window !== "undefined") dzToastInstallHooks();
