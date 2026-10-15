/* Copy text to the clipboard. Resolves true when the text is on the
   clipboard, false when the browser refused; it never rejects, so a caller
   only has to decide what to show when the copy did not happen.

   Most installs are plain-HTTP LAN addresses, which are not a secure
   context, so navigator.clipboard is absent there and the execCommand path
   is the common one rather than the edge case. execCommand only works
   inside the user's click, so it runs synchronously, before any await.

   Where the API exists, the write is judged by its REJECTION, not by a
   presence check: writeText still rejects with NotAllowedError when the
   document is not focused or permission is denied, and treating presence as
   success reports a copy that never happened.

   The fallback writes textarea.value, never innerHTML: the text carries
   device and hardware names supplied by users and plugins. */
function dzCopyText(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function() { return true; }, function() { return false; });
    }
    return Promise.resolve(dzCopyTextLegacy(text));
}

function dzCopyTextLegacy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    /* Off-screen but rendered: a display:none field cannot be selected. */
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    var ok = false;
    try {
        area.select();
        ok = document.execCommand("copy") === true;
    } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
}
