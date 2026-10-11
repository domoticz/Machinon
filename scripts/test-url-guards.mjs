import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* src/js/url-guards.js checks stored values at the point they become a URL.
   Plain browser script, so the SHIPPING file runs in a vm context and its
   globals are read back. */
const dz = vm.createContext({ URL, document: { baseURI: "http://192.0.2.10:8080/" } });
vm.runInContext(readFileSync("src/js/url-guards.js", "utf8"), dz, { filename: "src/js/url-guards.js" });

test("dzValidHttpUrl accepts only http and https", () => {
    assert.equal(dz.dzValidHttpUrl("https://example.com/"), "https://example.com/");
    assert.equal(dz.dzValidHttpUrl("/floorplan.html"), "http://192.0.2.10:8080/floorplan.html");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "vbscript:x", "http://[bad"]) {
        assert.equal(dz.dzValidHttpUrl(bad), null, bad);
    }
});

/* logo and the per-device photos are documented as "the name of an image file
   placed in the theme's images folder" and are used as "images/" + name. A
   name that climbs out of that folder or carries a query turns every viewer's
   page load into a same-origin request of the writer's choosing, for example
   ../json.htm?type=command&param=switchlight&idx=1&switchcmd=On. */
test("dzThemeImageName keeps plain file names, subfolders included", () => {
    for (const ok of ["logo.png", "My Logo.png", "custom/house.svg", "a.b-c_d.JPG"]) {
        assert.equal(dz.dzThemeImageName(ok), ok, ok);
    }
});

test("dzThemeImageName rejects names that leave the images folder or add a query", () => {
    const bad = [
        "../json.htm?type=command&param=switchlight&idx=1&switchcmd=On",
        "..", "a/../../json.htm", "%2e%2e/json.htm", "x.png?y=1", "x.png#frag",
        "/json.htm", "//evil.example/x.png", "http://evil.example/x.png",
        "javascript:alert(1)", "a\\..\\b.png", ""
    ];
    for (const b of bad) assert.equal(dz.dzThemeImageName(b), null, b);
});

test("dzThemeImageName rejects anything that is not a string", () => {
    for (const b of [null, undefined, 42, {}, ["logo.png"]]) {
        assert.equal(dz.dzThemeImageName(b), null, String(b));
    }
});
