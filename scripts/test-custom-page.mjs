import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* js/custom_page.js renders two house settings, button_name and custom_url, into
   the navbar and an iframe. Both are stored values that reach the page from
   outside the browser (a legacy uservariable can be written over core's MQTT
   gateway, which applies no rights check), so they must never pass through an
   HTML parser. The file is a jQuery feature script, so it runs here against a
   recording stand-in for jQuery: every string jQuery would PARSE as markup is
   logged, and the tests assert the stored values never appear in that log.

   Core's i18next (1.8) also parses: a data-i18n value starting with "[html]"
   is rendered with .html() by the .nav i18n() pass, so the button name must not
   be written into data-i18n either. */

function makeFakeJquery() {
    const parsed = [];
    const byId = {};

    function el(tag, markup) {
        return { tag, markup, text: null, attrs: {}, children: [], handlers: {}, classes: new Set() };
    }
    function wrap(nodes) {
        const api = {
            length: nodes.length,
            nodes,
            text(v) { nodes.forEach((n) => { n.text = String(v); }); return api; },
            attr(k, v) {
                if (v === undefined) return nodes[0] ? nodes[0].attrs[k] : undefined;
                nodes.forEach((n) => { n.attrs[k] = String(v); });
                return api;
            },
            append(...items) {
                items.forEach((item) => {
                    const kids = typeof item === "string" ? parse(item).nodes : item.nodes;
                    nodes.forEach((n) => n.children.push(...kids));
                });
                return api;
            },
            html(v) {
                const kids = parse(v).nodes;
                nodes.forEach((n) => { n.children = kids.slice(); });
                return api;
            },
            empty() { nodes.forEach((n) => { n.children = []; }); return api; },
            click(fn) { nodes.forEach((n) => { n.handlers.click = fn; }); return api; },
            removeClass(c) { nodes.forEach((n) => n.classes.delete(c)); return api; },
            find(sel) { return wrap(nodes.flatMap((n) => findAll(n, sel))); }
        };
        return api;
    }
    function findAll(root, sel) {
        const out = [];
        (function walk(n) {
            n.children.forEach((c) => {
                if (sel.startsWith("#") && c.attrs.id === sel.slice(1)) out.push(c);
                if (!sel.startsWith("#") && c.tag === sel) out.push(c);
                walk(c);
            });
        })(root);
        return out;
    }
    /* Every opening tag in the markup becomes a flat node carrying the
       attributes the tests look at. Nesting is not modelled: the assertions
       only need to know what an HTML parser would have been handed and which
       attributes it would have produced. */
    function parse(markup) {
        parsed.push(String(markup));
        const nodes = [];
        const tag = /<([a-z0-9]+)([^>]*)>/gi;
        let m;
        while ((m = tag.exec(String(markup)))) {
            const node = el(m[1].toLowerCase(), markup);
            const attr = /([a-z0-9-]+)="([^"]*)"/gi;
            let a;
            while ((a = attr.exec(m[2]))) node.attrs[a[1].toLowerCase()] = a[2];
            nodes.push(node);
        }
        return wrap(nodes);
    }
    function $(sel) {
        if (typeof sel === "string" && sel.trim().startsWith("<")) return parse(sel);
        if (typeof sel === "string" && sel.startsWith("#")) {
            const id = sel.slice(1);
            if (byId[id]) return wrap([byId[id]]);
            const found = Object.values(byId).flatMap((n) => findAll(n, sel));
            return wrap(found);
        }
        return wrap(byId[sel] ? [byId[sel]] : []);
    }
    byId.appnavbar = el("ul");
    byId["main-view"] = el("div");
    byId[".navbar-inner"] = el("div");
    return { $, parsed, byId, findAll };
}

function runCustomPage(theme) {
    const fake = makeFakeJquery();
    const ctx = vm.createContext({
        URL, theme, $: fake.$,
        document: { baseURI: "http://192.0.2.10:8080/" }
    });
    for (const f of ["src/js/url-guards.js", "js/custom_page.js"]) {
        vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    }
    const button = fake.findAll(fake.byId.appnavbar, "#customPage")[0];
    function openPage() {
        button.handlers.click.call(button);
        return fake.findAll(fake.byId["main-view"], "iframe")[0];
    }
    return { fake, button, openPage };
}

function allNodes(root) {
    const out = [];
    (function walk(n) { n.children.forEach((c) => { out.push(c); walk(c); }); })(root);
    return out;
}

const PAYLOAD = '"><img src=x onerror=alert(1)>[html]<b>';

test("the button name is rendered as text, never parsed as markup", () => {
    const { fake } = runCustomPage({ button_name: PAYLOAD, custom_url: "https://example.com/" });
    assert.ok(!fake.parsed.some((m) => m.includes("onerror")), "button_name reached an HTML parser");
    const texts = allNodes(fake.byId.appnavbar).map((n) => n.text);
    assert.ok(texts.includes(PAYLOAD), "button_name is not shown as the label text");
});

test("the button name is never written into data-i18n", () => {
    const { fake } = runCustomPage({ button_name: "Home", custom_url: "https://example.com/" });
    const tagged = allNodes(fake.byId.appnavbar).filter((n) => "data-i18n" in n.attrs);
    assert.deepEqual(tagged.map((n) => n.attrs["data-i18n"]), []);
});

test("an http(s) custom URL becomes the iframe src", () => {
    const { fake, openPage } = runCustomPage({ button_name: "Home", custom_url: "https://example.com/a?b=1" });
    const frame = openPage();
    assert.equal(frame.attrs.src, "https://example.com/a?b=1");
    assert.ok(!fake.parsed.some((m) => m.includes("example.com")), "custom_url reached an HTML parser");
});

test("a relative custom URL keeps working, resolved against the page", () => {
    const { openPage } = runCustomPage({ button_name: "Home", custom_url: "templates/house.html" });
    const src = openPage().attrs.src;
    assert.equal(new URL(src, "http://192.0.2.10:8080/").href, "http://192.0.2.10:8080/templates/house.html");
});

test("a javascript: custom URL never becomes the iframe src", () => {
    const { openPage } = runCustomPage({ button_name: "Home", custom_url: "javascript:alert(1)" });
    assert.equal(openPage().attrs.src, undefined);
});

test("a custom URL that breaks out of the attribute is not parsed as markup", () => {
    const { fake, openPage } = runCustomPage({ button_name: "Home", custom_url: PAYLOAD });
    openPage();
    assert.ok(!fake.parsed.some((m) => m.includes("onerror")), "custom_url reached an HTML parser");
});

test("dzValidHttpUrl accepts only http and https", () => {
    const ctx = vm.createContext({ URL, document: { baseURI: "http://192.0.2.10:8080/" } });
    vm.runInContext(readFileSync("src/js/url-guards.js", "utf8"), ctx);
    assert.equal(ctx.dzValidHttpUrl("https://example.com/"), "https://example.com/");
    assert.equal(ctx.dzValidHttpUrl("/floorplan.html"), "http://192.0.2.10:8080/floorplan.html");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "vbscript:x", "http://[bad"]) {
        assert.equal(ctx.dzValidHttpUrl(bad), null, bad);
    }
});
