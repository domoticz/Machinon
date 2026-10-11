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
