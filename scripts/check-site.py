#!/usr/bin/env python3
"""Guard the landing page against bugs it has already shipped once.

1. Absolute asset references. GitHub Pages serves this project site under
   /Machinon/, so "/assets/x.png" resolves at the domain root and 404s live
   while working fine when the tree is served from a local root. This is why
   scripts/serve-site.sh serves under the real prefix, and why this check
   exists as well: the script catches it if you look, this catches it if you
   do not.

2. Scheme list drift. The scheme ids live in FOUR places: site/tokens.css's
   [data-scheme] blocks (generated from schemes/index.json), the <option
   value> list in index.html's #scheme-picker, the SCHEMES array in
   site/app.js, and the inline pre-paint IDS array in index.html's <head>.
   Only the first is generated; the other three are hand-written, so a
   scheme added to schemes/index.json reaches tokens.css automatically and
   never reaches the other three. The pre-paint array exists at all because a
   deferred app.js cannot stamp data-scheme before first paint, and without
   it a visitor whose stored or OS-preferred scheme is dark saw a flash of
   Machinon Light on the one feature the page is selling.

3. Mapping drift. gen-site-tokens.py's SCHEME_KEY_TO_TOKENS mirrors
   applyCustomColorScheme() in src/js/scheme.js, but only by comment. Change
   the runtime mapping and the site keeps painting the old one, which is the
   exact silent drift the generator exists to prevent. Added after Task 1's
   review flagged the gap.

4. Declared image dimensions match the real files' aspect ratio. Task 3
   shipped the hero declaring width="1600" for a 1440px-wide file: same
   height, wrong width, so the reserved box was the wrong shape and the
   largest element on the page shifted the moment the real image loaded.
   The check compares ratios, not raw pixels: the device icons legitimately
   declare width="40" height="40" against a 96x96 source (the theme's real
   icon files, scaled down for the card grid), and 40x40 against 96x96 is
   the same 1:1 ratio, so that is not this bug. A changed ratio is. PNG
   stores width and height as big-endian uint32 at byte offsets 16 and 20,
   inside the IHDR chunk, so this needs no image library and no new
   dependency.

5. Every file under site/assets/ is referenced at least once, and every
   reference resolves. Both directions. Task 3 demonstrated the need twice
   in one round: machinon_Batman48_Off.png shipped unreferenced because its
   card does not toggle, and then fixing a duplicate-icon defect silently
   orphaned Dimmer48_On.png the moment its card pointed at a different icon.

Run: python3 scripts/check-site.py
"""
import importlib.util
import pathlib
import re
import struct
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
INDEX = SITE / "index.html"
TOKENS = SITE / "tokens.css"
APP_JS = SITE / "app.js"
SCHEME_JS = ROOT / "src" / "js" / "scheme.js"
ASSETS = SITE / "assets"

# The published prefix every asset URL resolves under. og:image, og:url and
# the canonical link are absolute (scrapers need a resolvable URL, not a
# page-relative one), so asset_refs() below normalizes a reference under
# this prefix back to its assets/-relative form before matching it.
SITE_URL = "https://domoticz.github.io/Machinon/"

_REF = re.compile(r'(?:href|src)\s*=\s*"([^"]+)"')
_ASSET_REF = re.compile(r'(?:href|src|content)\s*=\s*"([^"]+)"')
_OPTION = re.compile(r'<option\s+value="([^"]+)"')
_SELECT = re.compile(r'<select[^>]+id="scheme-picker"[^>]*>(.*?)</select>', re.S)
_DATA_SCHEME = re.compile(r'\[data-scheme="([^"]+)"\]')
_IDS_ARRAY = re.compile(r"var\s+IDS\s*=\s*\[([^\]]*)\]")
_SCHEMES_ARRAY = re.compile(r"var\s+SCHEMES\s*=\s*\[(.*?)\n\s*\];", re.S)
_QUOTED = re.compile(r"'([^']+)'")
_ID_FIELD = re.compile(r"id:\s*'([^']+)'")
_IMG_TAG = re.compile(r"<img\b[^>]*>")
_ATTR = re.compile(r'(\w[\w-]*)\s*=\s*"([^"]*)"')
# set('--dz-token', cs.key) inside applyCustomColorScheme.
_SET_CALL = re.compile(r"set\('(--[\w-]+)',\s*cs\.(\w+)\)")

_PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def _generator_mapping():
    """Import SCHEME_KEY_TO_TOKENS from the generator (hyphenated filename)."""
    spec = importlib.util.spec_from_file_location(
        "gen_site_tokens", ROOT / "scripts" / "gen-site-tokens.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.SCHEME_KEY_TO_TOKENS


def runtime_scheme_keys(js_text):
    """Return applyCustomColorScheme's colors-key to token-list mapping.

    Only the set() calls inside that function count. The two setProperty
    calls for --dz-accent-values and --dz-accent-red-values are derived
    triplets rather than a mapped key, so they are handled separately in the
    generator's resolve_scheme and are deliberately not compared here.
    """
    start = js_text.index("function applyCustomColorScheme(")
    depth = 0
    i = js_text.index("{", start)
    end = i
    while True:
        if js_text[end] == "{":
            depth += 1
        elif js_text[end] == "}":
            depth -= 1
            if depth == 0:
                break
        end += 1
    mapping = {}
    for token, key in _SET_CALL.findall(js_text[i : end + 1]):
        mapping.setdefault(key, []).append(token)
    return mapping


def absolute_refs(html_text):
    """Return every href/src that resolves from the domain root.

    External URLs, protocol-relative URLs, fragments, mailto: and relative
    paths are all fine. Only a leading single slash is the problem.
    """
    bad = []
    for ref in _REF.findall(html_text):
        if ref.startswith("//"):
            continue
        if ref.startswith("/"):
            bad.append(ref)
    return bad


def picker_options(html_text):
    """Return the scheme ids offered by the nav picker, in document order."""
    match = _SELECT.search(html_text)
    if not match:
        return []
    return _OPTION.findall(match.group(1))


def token_schemes(css_text):
    """Return the scheme ids that tokens.css defines, de-duplicated in order."""
    seen = []
    for scheme_id in _DATA_SCHEME.findall(css_text):
        if scheme_id not in seen:
            seen.append(scheme_id)
    return seen


def prepaint_ids(html_text):
    """Return the scheme ids from the inline pre-paint IDS array in <head>.

    That array exists so data-scheme can be stamped before first paint, which
    is before app.js (deferred) or the <select> (parsed later in the body)
    can be relied on, so it carries its own independent copy of the list.
    """
    match = _IDS_ARRAY.search(html_text)
    if not match:
        return []
    return _QUOTED.findall(match.group(1))


def app_scheme_ids(js_text):
    """Return the scheme ids from SCHEMES in site/app.js, in document order."""
    match = _SCHEMES_ARRAY.search(js_text)
    if not match:
        return []
    return _ID_FIELD.findall(match.group(1))


def declared_dimensions(html_text):
    """Return (src, width, height) for every <img> that declares both.

    An <img> with only one of the two, or neither, is not this check's
    concern: the browser reserves no aspect-ratio box from a partial pair.
    """
    found = []
    for tag in _IMG_TAG.findall(html_text):
        attrs = dict(_ATTR.findall(tag))
        if "src" not in attrs or "width" not in attrs or "height" not in attrs:
            continue
        try:
            found.append((attrs["src"], int(attrs["width"]), int(attrs["height"])))
        except ValueError:
            continue
    return found


def png_size(path):
    """Read a PNG's width and height directly from its IHDR chunk.

    No PIL, no new dependency: width and height are two big-endian uint32
    values at fixed byte offsets 16 and 20, right after the 8-byte PNG
    signature and the IHDR chunk's own 8-byte length+type header. Every PNG
    starts this way; the PNG spec requires IHDR to be the first chunk.
    """
    with open(path, "rb") as handle:
        header = handle.read(24)
    if header[:8] != _PNG_SIGNATURE:
        raise ValueError("{}: not a PNG file".format(path))
    width, height = struct.unpack(">II", header[16:24])
    return width, height


def resolve_asset(ref):
    """Map an index.html reference to the file that serves it, once built.

    docs/... references resolve against the repo root: mkdocs owns that
    tree, and scripts/serve-site.sh copies it under build/docs alongside
    site/'s own files, so the real pixel data for a docs/ screenshot lives
    outside site/ entirely. Everything else resolves against site/ itself.
    """
    if ref.startswith("docs/"):
        return ROOT / ref
    return SITE / ref


def asset_refs(html_text):
    """Return every distinct assets/... path referenced in index.html.

    content= is included alongside href/src because the og:image meta tag
    points at social-preview.png through content=, not href or src. A
    reference given as an absolute URL under SITE_URL (as og:image must be,
    for scrapers that will not resolve a relative one) is normalized back to
    its assets/-relative form first, so it still matches.
    """
    refs = set()
    for ref in _ASSET_REF.findall(html_text):
        if ref.startswith(SITE_URL):
            ref = ref[len(SITE_URL):]
        if ref.startswith("assets/"):
            refs.add(ref)
    return sorted(refs)


def asset_files(assets_dir):
    """Return every file under assets_dir, as assets/-relative posix paths."""
    return sorted(
        "assets/" + p.relative_to(assets_dir).as_posix()
        for p in assets_dir.rglob("*")
        if p.is_file()
    )


def main():
    html = INDEX.read_text()
    css = TOKENS.read_text()
    failures = []

    for ref in absolute_refs(html):
        failures.append(
            'absolute reference "{}" in site/index.html: it 404s under '
            "https://domoticz.github.io/Machinon/. Make it relative.".format(ref)
        )

    # --- Check 2: scheme ids across all four lists ---
    schemes = token_schemes(css)
    options = picker_options(html)
    js_schemes = app_scheme_ids(APP_JS.read_text())
    ids = prepaint_ids(html)
    if not options:
        failures.append("no #scheme-picker options found in site/index.html")
    if not ids:
        failures.append("no pre-paint IDS array found in site/index.html <head>")
    canonical = sorted(schemes)
    for label, values in (
        ("index.html #scheme-picker options", options),
        ("site/app.js SCHEMES", js_schemes),
        ("index.html pre-paint IDS", ids),
    ):
        if sorted(values) != canonical:
            failures.append(
                "scheme list drift between tokens.css and {}:\n"
                "  tokens.css only: {}\n"
                "  {} only:         {}".format(
                    label,
                    sorted(set(schemes) - set(values)) or "none",
                    label,
                    sorted(set(values) - set(schemes)) or "none",
                )
            )

    # --- Check 3: generator mapping mirrors the runtime applier ---
    runtime = runtime_scheme_keys(SCHEME_JS.read_text())
    generator = _generator_mapping()
    if runtime != generator:
        for key in sorted(set(runtime) | set(generator)):
            if runtime.get(key) != generator.get(key):
                failures.append(
                    'scheme mapping drift for colors key "{}":\n'
                    "  src/js/scheme.js:          {}\n"
                    "  scripts/gen-site-tokens.py: {}".format(
                        key, runtime.get(key, "absent"), generator.get(key, "absent")
                    )
                )

    # --- Check 4: declared image dimensions match the real files' ratio ---
    dimension_checks = 0
    for src, dw, dh in declared_dimensions(html):
        path = resolve_asset(src)
        if not path.exists() or path.suffix.lower() != ".png":
            continue
        try:
            aw, ah = png_size(path)
        except (OSError, ValueError):
            continue
        dimension_checks += 1
        if dw * ah != dh * aw:
            failures.append(
                'declared size {}x{} for "{}" does not match its file\'s '
                "{}x{} aspect ratio: the reserved box is the wrong shape, so "
                "the element shifts when the real image loads.".format(
                    dw, dh, src, aw, ah
                )
            )

    # --- Check 5: every asset referenced, every reference resolves ---
    referenced = set(asset_refs(html))
    existing = set(asset_files(ASSETS))
    for ref in sorted(referenced - existing):
        failures.append(
            'dangling asset reference "{}" in site/index.html: no such file '
            "under site/assets/.".format(ref)
        )
    for path in sorted(existing - referenced):
        failures.append(
            'orphaned asset "{}": present under site/assets/ but never '
            "referenced from site/index.html.".format(path)
        )

    for failure in failures:
        print("check-site: " + failure, file=sys.stderr)
    if failures:
        return 1
    print(
        "check-site: OK ({} schemes, {} mapped colour keys, {} image "
        "dimensions checked, {} assets referenced, no absolute "
        "references)".format(
            len(schemes), len(generator), dimension_checks, len(existing)
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
