/* Theme i18n: the merged `language` table and its single read path.
 *
 * custom.js always loads lang/machinon.en.js first and, for a non-English
 * Domoticz language, deep-merges that language's file ON TOP of the English
 * table. The merged table therefore always carries the complete English key
 * set: a key missing from a translation falls back per-key to English by
 * construction, and a raw key never reaches a user.
 *
 * dzT(path, params) is the read path for every theme string:
 *   dzT("hub.groups.general")
 *   dzT("toasts.icons_installing", { n: 1, total: 3, name: ic.name })
 * {param} tokens interpolate from `params`; unknown tokens stay literal so a
 * translation with a typo degrades visibly instead of printing "undefined".
 * A missing path warns on console and returns the last path segment; the
 * lang-parity guard (scripts/check-lang-parity.mjs) makes that a build-time
 * failure, never a shipped state. */

/* Recursive plain-object merge, overlay wins on leaves; arrays and null are
   leaves (replaced, not merged). Returns a new object, mutates neither input. */
function dzDeepMerge(base, overlay) {
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(overlay || {}).forEach(function (k) {
        var b = out[k];
        var o = overlay[k];
        var mergeable = b && o && typeof b === "object" && typeof o === "object"
            && !Array.isArray(b) && !Array.isArray(o);
        out[k] = mergeable ? dzDeepMerge(b, o) : o;
    });
    return out;
}

/* Translate: walk `path` ("a.b.c") into the global language table, then
   interpolate {param} tokens from `params`. */
function dzT(path, params) {
    var node = (typeof language !== "undefined") ? language : null;
    var parts = path.split(".");
    for (var i = 0; i < parts.length && node !== null && node !== undefined; i++) {
        node = node[parts[i]];
    }
    if (typeof node !== "string") {
        console.warn("machinon_i18n", "missing_key", path);
        node = parts[parts.length - 1];
    }
    if (params) {
        node = node.replace(/\{(\w+)\}/g, function (m, k) {
            return Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : m;
        });
    }
    return node;
}
