/* Guards for stored values that end up in a URL-bearing attribute (href, src).
   Settings reach the browser from outside it (a legacy uservariable can be
   written through core's MQTT gateway, which applies no rights check), so a
   value is checked where it is used, not trusted because it was saved. */

/* Accepts a value ONLY when it parses as an http or https URL, absolute or
   relative to the page. The URL constructor (not a regex) does the parsing, so
   this rejects javascript:, data:, and every other scheme the same way a
   browser's own scheme allow-list would, without trying to enumerate the
   deny-list by hand. Returns the normalised href on success, null otherwise. */
function dzValidHttpUrl(href) {
    try {
        var u = new URL(String(href), (typeof document !== "undefined" && document.baseURI) || undefined);
        return (u.protocol === "http:" || u.protocol === "https:") ? u.href : null;
    } catch (e) {
        return null;
    }
}

/* logo and the per-device photos are file names inside the theme's images
   folder, used as "images/" + name. Returns the name only when it stays in
   that folder and adds nothing but a path: no "..", no leading slash, no
   scheme, query or fragment, and no percent-escape (the URL parser treats
   "%2e" as "."). Subfolders are fine. Returns null otherwise. */
function dzThemeImageName(name) {
    if (typeof name !== "string" || name === "") return null;
    if (/[?#:%\\]/.test(name) || name.charAt(0) === "/") return null;
    if (name.split("/").indexOf("..") !== -1) return null;
    return name;
}
