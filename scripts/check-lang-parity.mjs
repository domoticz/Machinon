#!/usr/bin/env node
/**
 * Keep the six lang/machinon.*.js tables, the dzT("...") call sites, and the
 * settings manifest in step with lang/machinon.en.js, the complete key set.
 *
 * lang/machinon.en.js is the template every other translation is merged on
 * top of (custom.js deep-merges the active language over English, so a key
 * a translation lacks falls back to English at runtime). That fallback is
 * safe only as long as:
 *   - no translation carries a key English does not have (renamed/removed
 *     upstream but never cleaned up downstream: dead weight at best, a typo
 *     nobody will ever see rendered at worst);
 *   - a key both files share interpolates the same {tokens} (a translation
 *     that drops or renames a {token} silently prints the literal braces or
 *     eats a value dzT() would otherwise have interpolated);
 *   - every dzT("literal.path") call site in the theme's own JS resolves
 *     against English (a typo'd path is a runtime console.warn no one sees
 *     until a user reports "the button just says days_ago");
 *   - every settings-manifest entry and group has the label/description (or
 *     group heading) English needs to render it at all;
 *   - every settings-manifest entry's appliesTo slug has its display string
 *     in English (hub.appliesTo.<slug>: the "Applies to" tag is built from
 *     the slug, so a typo there is the same silent-fallback-to-last-segment
 *     failure as a hand-typed dzT() path);
 *   - every option value in theme-hub.js's DZ_HUB_INPUT_META has its display
 *     label in English (hub.options.<storageKey>.<value>: a select control
 *     resolves each option's label the same way);
 *   - every colour-scheme swatch field has its display label in English
 *     (hub.schemes.swatches.<field>: extracted from schemes.js's
 *     DZ_COLOR_SCHEME_FIELDS table);
 *   - every scheme-generator "look" has its label and description in English
 *     (hub.wizard.looks.<look>.label / .description: extracted from
 *     scheme-generator.js's DZ_LOOKS table).
 *
 * All dynamic key families the theme's JS defines are enforced above: none
 * are reviewed by hand only.
 *
 * A key missing from a translation is not an error: it reports (falls back
 * to English, which is a real string, not a broken page) rather than fails.
 *
 * Run: node scripts/check-lang-parity.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LANG_DIR = path.join(ROOT, "lang");
const EN_FILE = path.join(LANG_DIR, "machinon.en.js");
const MANIFEST_FILE = path.join(ROOT, "src", "js", "theme-manifest.js");
const THEME_HUB_FILE = path.join(ROOT, "src", "js", "theme-hub.js");
const SCHEMES_FILE = path.join(ROOT, "src", "js", "schemes.js");
const SCHEME_GENERATOR_FILE = path.join(ROOT, "src", "js", "scheme-generator.js");

// Vendored third-party scripts: never call dzT and are not ours to scan.
const VENDORED_JS = new Set(["moment.js", "livestamp.js"]);

/* ---- Pure helpers (exported for the test file) ---- */

/** Flatten a nested language table to dot-path -> leaf string. */
export function flattenKeys(obj, prefix) {
    prefix = prefix || "";
    const out = {};
    for (const k of Object.keys(obj)) {
        const val = obj[k];
        const keyPath = prefix ? prefix + "." + k : k;
        if (val && typeof val === "object" && !Array.isArray(val)) {
            Object.assign(out, flattenKeys(val, keyPath));
        } else {
            out[keyPath] = val;
        }
    }
    return out;
}

/** Every distinct {token} name interpolated in a string, as a Set. */
export function interpolationTokens(str) {
    const tokens = new Set();
    const re = /\{(\w+)\}/g;
    let m;
    while ((m = re.exec(String(str))) !== null) tokens.add(m[1]);
    return tokens;
}

function sameTokenSet(a, b) {
    if (a.size !== b.size) return false;
    for (const t of a) if (!b.has(t)) return false;
    return true;
}

/**
 * Compare a translation's flattened table against English's.
 * Returns { errors, missing }: errors are blocking (extra key, {token}
 * mismatch on a shared key); missing is report-only (English keys the
 * translation lacks, which fall back to English at runtime).
 */
export function compareTables(enFlat, otherFlat, lang) {
    const errors = [];
    const missing = [];

    for (const key of Object.keys(otherFlat)) {
        if (!Object.prototype.hasOwnProperty.call(enFlat, key)) {
            errors.push(`${lang}: "${key}" is not an English key (renamed or removed upstream?)`);
        }
    }

    for (const key of Object.keys(enFlat)) {
        if (!Object.prototype.hasOwnProperty.call(otherFlat, key)) {
            missing.push(key);
            continue;
        }
        const enTokens = interpolationTokens(enFlat[key]);
        const otherTokens = interpolationTokens(otherFlat[key]);
        if (!sameTokenSet(enTokens, otherTokens)) {
            errors.push(
                `${lang}: "${key}" {token} mismatch: en={${[...enTokens].sort().join(", ")}} `
                + `${lang}={${[...otherTokens].sort().join(", ")}}`
            );
        }
    }

    return { errors, missing };
}

/**
 * Scan a JS source's dzT("literal.path") call sites and flag any path not
 * in English's key set. A literal ending in "." is a dynamic-path prefix
 * (e.g. dzT("hub.groups." + group.id)) and is deliberately skipped here;
 * the manifest rule covers groups/settings, and other dynamic bases are
 * covered by their own English keys existing.
 */
export function scanDzTLiterals(text, enKeySet, filename) {
    const errors = [];
    const re = /dzT\(\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        const key = m[1];
        if (key.endsWith(".")) continue;
        if (!enKeySet.has(key)) {
            errors.push(`${filename}: dzT("${key}") is not a key in lang/machinon.en.js`);
        }
    }
    return errors;
}

/**
 * English paths a settings-manifest fragment requires: hub.groups.<id> for
 * each group, hub.settings.<key>.label and .description for each entry.
 * Anchored on the same quoted, indented form check-settings-docs.py uses,
 * so the schema docblock's own prose ("key:", "id:") never false-matches.
 */
export function manifestRequiredKeys(text) {
    const required = [];
    const keyRe = /^\s+key: "([^"]+)"/gm;
    let m;
    while ((m = keyRe.exec(text)) !== null) {
        required.push(`hub.settings.${m[1]}.label`);
        required.push(`hub.settings.${m[1]}.description`);
    }
    const idRe = /^\s+id: "([^"]+)"/gm;
    while ((m = idRe.exec(text)) !== null) {
        required.push(`hub.groups.${m[1]}`);
    }
    return required;
}

/**
 * English paths every manifest entry's appliesTo slug requires:
 * hub.appliesTo.<slug>. Anchored the same way as the key/id extraction above
 * (line starts with the field name, straight into its quoted value), which
 * also naturally skips the schema docblock's own "appliesTo:" prose line
 * (that one is followed by descriptive text, not a quoted string).
 */
export function appliesToRequiredKeys(text) {
    const required = [];
    const re = /^\s+appliesTo: "([^"]+)"/gm;
    let m;
    while ((m = re.exec(text)) !== null) {
        required.push(`hub.appliesTo.${m[1]}`);
    }
    return required;
}

/**
 * English paths every DZ_HUB_INPUT_META option value requires:
 * hub.options.<storageKey>.<value> (dzHubBuildControl resolves each select
 * option's display label through dzT the same way). Extracted from the
 * literal `var DZ_HUB_INPUT_META = { ... };` object in theme-hub.js: each
 * top-level `storageKey: { ...options: ["a", "b"]... }` entry is captured by
 * one line-anchored regex on the block body, then the quoted values inside
 * its own options array are pulled out. Storage keys without an options
 * array (min/max-only entries) are skipped. Returns [] if the block itself
 * cannot be found, so a refactor of DZ_HUB_INPUT_META fails loud (0 keys
 * checked is visible in the summary count) rather than silently.
 */
export function inputMetaOptionsRequiredKeys(text) {
    const required = [];
    const blockMatch = text.match(/var DZ_HUB_INPUT_META = \{([\s\S]*?)\n\};/);
    if (!blockMatch) return required;
    const entryRe = /^\s*(\w+):\s*\{([^}]*)\}/gm;
    let m;
    while ((m = entryRe.exec(blockMatch[1])) !== null) {
        const storageKey = m[1];
        const optionsMatch = m[2].match(/options:\s*\[([^\]]*)\]/);
        if (!optionsMatch) continue;
        const valueRe = /"([^"]+)"/g;
        let optMatch;
        while ((optMatch = valueRe.exec(optionsMatch[1])) !== null) {
            required.push(`hub.options.${storageKey}.${optMatch[1]}`);
        }
    }
    return required;
}

/**
 * English paths every colour-scheme swatch requires: hub.schemes.swatches.<field>
 * (schemes.js's card-swatch rendering resolves each field's display label
 * through dzT the same way). Extracted from the literal
 * `var DZ_COLOR_SCHEME_FIELDS = [ ... ];` array in src/js/schemes.js: each
 * `{ suffix: "...", field: "..." }` entry contributes its `field` value.
 * Anchored on the array literal itself, not on any surrounding prose, so a
 * comment mentioning "field:" elsewhere in the file cannot false-match.
 * Returns [] if the block itself cannot be found, so a refactor of
 * DZ_COLOR_SCHEME_FIELDS fails loud (0 keys checked is visible in the
 * summary count) rather than silently.
 */
export function swatchesRequiredKeys(text) {
    const required = [];
    const blockMatch = text.match(/var DZ_COLOR_SCHEME_FIELDS = \[([\s\S]*?)\n\];/);
    if (!blockMatch) return required;
    const fieldRe = /field:\s*"([^"]+)"/g;
    let m;
    while ((m = fieldRe.exec(blockMatch[1])) !== null) {
        required.push(`hub.schemes.swatches.${m[1]}`);
    }
    return required;
}

/**
 * English paths every generator "look" requires: hub.wizard.looks.<key>.label
 * and .description (dzWizardStepLook resolves both through dzT the same way).
 * Extracted from the literal `var DZ_LOOKS = { ... };` object in
 * src/js/scheme-generator.js: each top-level `<key>: { ... }` entry
 * (line-anchored, same style as inputMetaOptionsRequiredKeys) contributes its
 * key. Returns [] if the block itself cannot be found, so a refactor of
 * DZ_LOOKS fails loud (0 keys checked is visible in the summary count)
 * rather than silently.
 */
export function looksRequiredKeys(text) {
    const required = [];
    const blockMatch = text.match(/var DZ_LOOKS = \{([\s\S]*?)\n\};/);
    if (!blockMatch) return required;
    const entryRe = /^\s{4}(\w+):\s*\{/gm;
    let m;
    while ((m = entryRe.exec(blockMatch[1])) !== null) {
        required.push(`hub.wizard.looks.${m[1]}.label`);
        required.push(`hub.wizard.looks.${m[1]}.description`);
    }
    return required;
}

/* ---- I/O and wiring (not exercised by the unit tests) ---- */

function loadLangTable(file) {
    const ctx = vm.createContext({ Math, console, JSON });
    vm.runInContext(readFileSync(file, "utf8"), ctx, { filename: file });
    return ctx.language;
}

function langName(filename) {
    return filename.replace(/^machinon\./, "").replace(/\.js$/, "");
}

/** Every JS file the theme itself ships that may call dzT(), relative to ROOT. */
function scanTargets() {
    const files = [];
    for (const f of readdirSync(path.join(ROOT, "src", "js")).sort()) {
        if (f.endsWith(".js")) files.push(path.join("src", "js", f));
    }
    files.push("custom.js");
    for (const f of readdirSync(path.join(ROOT, "js")).sort()) {
        if (f.endsWith(".js") && !VENDORED_JS.has(f)) files.push(path.join("js", f));
    }
    return files;
}

export function main() {
    const enFlat = flattenKeys(loadLangTable(EN_FILE));
    const enKeySet = new Set(Object.keys(enFlat));

    const errors = [];
    const missingByLang = {};

    const langFiles = readdirSync(LANG_DIR)
        .filter((f) => f.endsWith(".js") && f !== "machinon.en.js")
        .sort();
    for (const f of langFiles) {
        const lang = langName(f);
        const flat = flattenKeys(loadLangTable(path.join(LANG_DIR, f)));
        const { errors: langErrors, missing } = compareTables(enFlat, flat, lang);
        errors.push(...langErrors);
        missingByLang[lang] = missing.length;
    }

    const scanned = scanTargets();
    for (const rel of scanned) {
        const text = readFileSync(path.join(ROOT, rel), "utf8");
        errors.push(...scanDzTLiterals(text, enKeySet, rel));
    }

    const manifestText = readFileSync(MANIFEST_FILE, "utf8");
    const required = manifestRequiredKeys(manifestText);
    for (const key of required) {
        if (!enKeySet.has(key)) {
            errors.push(`theme-manifest.js: requires "${key}", missing from lang/machinon.en.js`);
        }
    }

    const appliesToRequired = appliesToRequiredKeys(manifestText);
    for (const key of appliesToRequired) {
        if (!enKeySet.has(key)) {
            errors.push(`theme-manifest.js: requires "${key}", missing from lang/machinon.en.js`);
        }
    }

    const themeHubText = readFileSync(THEME_HUB_FILE, "utf8");
    const optionsRequired = inputMetaOptionsRequiredKeys(themeHubText);
    for (const key of optionsRequired) {
        if (!enKeySet.has(key)) {
            errors.push(`theme-hub.js: requires "${key}", missing from lang/machinon.en.js`);
        }
    }

    const schemesText = readFileSync(SCHEMES_FILE, "utf8");
    const swatchesRequired = swatchesRequiredKeys(schemesText);
    for (const key of swatchesRequired) {
        if (!enKeySet.has(key)) {
            errors.push(`schemes.js: requires "${key}", missing from lang/machinon.en.js`);
        }
    }

    const schemeGeneratorText = readFileSync(SCHEME_GENERATOR_FILE, "utf8");
    const looksRequired = looksRequiredKeys(schemeGeneratorText);
    for (const key of looksRequired) {
        if (!enKeySet.has(key)) {
            errors.push(`scheme-generator.js: requires "${key}", missing from lang/machinon.en.js`);
        }
    }

    for (const lang of Object.keys(missingByLang)) {
        const count = missingByLang[lang];
        if (count > 0) {
            console.log(
                `check-lang-parity: ${lang} is missing ${count} key(s) present in en `
                + "(falls back to English at runtime, not blocking)"
            );
        }
    }

    if (errors.length) {
        console.error(`check-lang-parity: FAIL (${errors.length} error(s))`);
        for (const e of errors) console.error("  " + e);
        return 1;
    }

    console.log(
        `check-lang-parity: OK (${enKeySet.size} English keys, ${langFiles.length} translations, `
        + `${scanned.length} JS files scanned, ${required.length} manifest keys, `
        + `${appliesToRequired.length} appliesTo keys, ${optionsRequired.length} option keys, `
        + `${swatchesRequired.length} swatch keys, ${looksRequired.length} look keys checked)`
    );
    return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    process.exit(main());
}
