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

5b. iconpack/ and images/ references resolve. The icon gallery points
   directly at the theme's real shipped artwork under those two repo-root
   trees (see resolve_asset()), and unlike site/assets/ this is a one-way
   check: only dangling references are flagged. The orphan direction does
   not apply here, since both trees hold hundreds of files the gallery
   deliberately does not reference (every icon that is not in the gallery's
   sample, every unused style variant), and demanding each one be
   referenced from the landing page would be a false requirement.

6. Tour manifest drift. site/tour.js holds the hero's eight slides: one
   Dashboard capture per scheme, and a light and a dark capture for each of
   the other seven. This check proves every path exists, that the Dashboard
   map covers exactly the canonical scheme list, that no slide lost a twin,
   and that no two manifest entries resolve to the same file. It matters
   because tour.js deliberately SKIPS a slide whose image fails to load, so
   a deleted or renamed capture is invisible in a warm browser and simply
   shortens the rotation. The canonical list is tokens.css's [data-scheme]
   blocks, the same source check 2 uses, and deliberately not
   schemes/index.json: that file holds only the six add-on schemes and would
   accept a set with both Machinon defaults missing. Two entries sharing a
   path is its own failure, separate from the existence check: every path
   can exist and the tour still show one screenshot twice under two
   different captions, which is exactly how Task 2's capture harness once
   produced two byte-identical captures from a navigation that silently did
   not take. An entry the parser cannot read (a stray double-quoted field,
   for instance) is ALSO a failure, not a silent skip: the first version of
   this check let tour_slide_paths() skip past what it could not parse,
   which meant a manifest reformatted to double quotes parsed as zero
   slides and check 6 passed while guarding none of the fourteen
   non-dashboard captures.

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

# The two repo-root trees the icon gallery points at directly (see check 5b
# and resolve_asset()). Unlike site/assets/, only the dangling-reference
# direction is checked against these: both hold hundreds of files the
# gallery deliberately does not reference.
EXTERNAL_REF_ROOTS = ("iconpack/", "images/")
TOUR_JS = SITE / "tour.js"

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
# Indentation-independent on purpose: no slide entry contains "];", so a
# non-greedy match to the first one always ends at the array's close, and the
# regex does not break the day someone reindents tour.js.
_SLIDES_ARRAY = re.compile(r"var SLIDES\s*=\s*\[(.*?)\];", re.S)
# The phone set, below tour.js's 768px breakpoint. A separate array and not a
# flag on SLIDES because it is a different set of PAGES, not the same pages at
# another size. "var SLIDES" cannot match inside "var PHONE_SLIDES", so the two
# patterns stay independent however the file is reordered.
_PHONE_SLIDES_ARRAY = re.compile(r"var PHONE_SLIDES\s*=\s*\[(.*?)\];", re.S)
_DASHBOARD_MAP = re.compile(r"var DASHBOARD_SHOTS\s*=\s*\{(.*?)\};", re.S)
_MAP_PAIR = re.compile(r"'([^']+)'\s*:\s*'([^']+)'")
_SLIDE_ENTRY = re.compile(r"\{(.*?)\}", re.S)
_FIELD = re.compile(r"(\w+)\s*:\s*'([^']*)'")

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


def tour_dashboard_shots(js_text):
    """Return the Dashboard slide's scheme id -> capture path map from tour.js.

    That slide is the only one with a capture per scheme, because it is the
    slide the hero loads first and the one visitors experiment on with the
    picker. Every other slide gets a light and a dark file instead.
    """
    match = _DASHBOARD_MAP.search(js_text)
    if not match:
        return {}
    return dict(_MAP_PAIR.findall(match.group(1)))


def tour_slide_paths(js_text, phone=False):
    """Return (name, light, dark) for every slide that is NOT per-scheme.

    A missing path comes back as "" rather than being skipped, so main() can
    name the slide that lost its twin. The per-scheme Dashboard slide is
    excluded: it legitimately carries no light/dark pair.

    An entry this cannot read (no `name` field, most often because it is
    quoted in a style _FIELD does not match) is silently absent from the
    result: this function reports what it found, not what went wrong.
    tour_slide_problems() below is what turns an unreadable entry into a
    build failure instead of a quiet gap.
    """
    match = (_PHONE_SLIDES_ARRAY if phone else _SLIDES_ARRAY).search(js_text)
    if not match:
        return []
    slides = []
    for entry in _SLIDE_ENTRY.findall(match.group(1)):
        if "perScheme" in entry:
            continue
        fields = dict(_FIELD.findall(entry))
        if "name" not in fields:
            continue
        slides.append((fields["name"], fields.get("light", ""), fields.get("dark", "")))
    return slides


def tour_slide_problems(js_text, phone=False):
    """Return human-readable reasons the SLIDES manifest could not be fully
    parsed. An empty list means every entry parsed.

    This exists because tour_slide_paths() silently `continue`s past an
    entry it cannot read. A manifest reformatted from single to double
    quotes therefore parses as ZERO slides there, and check 6 would pass
    while guarding none of the fourteen non-dashboard captures. Silence is
    the dangerous outcome for a guard, so an entry it cannot read is now an
    error rather than a skip.
    """
    name = "PHONE_SLIDES" if phone else "SLIDES"
    match = (_PHONE_SLIDES_ARRAY if phone else _SLIDES_ARRAY).search(js_text)
    if not match:
        return ["no `var {} = [...]` array found in site/tour.js".format(name)]
    entries = _SLIDE_ENTRY.findall(match.group(1))
    if not entries:
        return ["the {} array in site/tour.js contains no entries".format(name)]
    problems = []
    for entry in entries:
        if "perScheme" in entry:
            continue
        if "name" not in dict(_FIELD.findall(entry)):
            problems.append(
                "a {} entry has no readable `name` field, so its "
                "captures cannot be checked: ".format(name)
                + " ".join(entry.split())[:90]
            )
    return problems


def duplicate_tour_paths(dashboard_shots, slides):
    """Return (label_a, label_b, path) for every capture path used by more
    than one manifest entry, across DASHBOARD_SHOTS and SLIDES together.

    A missing path ("" from tour_slide_paths, for a slide with no dark twin)
    is never compared: that gap is check 6's separate missing-capture
    failure, not a shared-path failure. Every path can individually exist and
    the tour still be broken this way, because the visitor sees the same
    screenshot twice under two different captions: this is exactly how
    Task 2's capture harness once produced two byte-identical captures from a
    navigation that silently did not take.
    """
    entries = []
    for scheme_id, path in dashboard_shots.items():
        if path:
            entries.append(("Dashboard ({})".format(scheme_id), path))
    for name, light, dark in slides:
        if light:
            entries.append(("{} (light)".format(name), light))
        if dark:
            entries.append(("{} (dark)".format(name), dark))

    seen = {}
    duplicates = []
    for label, path in entries:
        if path in seen:
            duplicates.append((seen[path], label, path))
        else:
            seen[path] = label
    return duplicates


# Phone captures in index.html. These are the ones the #mobile grid swaps by
# base, so each needs a declared dark twin; the hero's desktop captures are
# swapped by tour.js from its own manifest and carry no attribute.
_PHONE_CAPTURE = re.compile(r"docs/screenshots/mobile-[\w-]+\.png$")


def dark_twin_refs(html_text):
    """Return (light_src, dark_src) for every <img> declaring a data-dark twin.

    app.js reads the light path off src ONCE at load and swaps between the two
    on every scheme change, so both halves have to exist and, because the
    tiles reserve a box from their width/height pair, be the same size. A
    dangling or mis-sized twin is invisible in light and only shows up to a
    visitor who picks a dark scheme, which is precisely the class of bug this
    file exists to catch before a release does.
    """
    pairs = []
    for tag in _IMG_TAG.findall(html_text):
        attrs = dict(_ATTR.findall(tag))
        if "src" in attrs and "data-dark" in attrs:
            pairs.append((attrs["src"], attrs["data-dark"]))
    return pairs


def phone_shots_missing_twin(html_text):
    """Return every mobile-*.png <img> src in index.html with no data-dark.

    Catches the seventh phone figure added without its twin: it would sit in
    the grid staying light while the six beside it go dark.
    """
    missing = []
    for tag in _IMG_TAG.findall(html_text):
        attrs = dict(_ATTR.findall(tag))
        src = attrs.get("src", "")
        if _PHONE_CAPTURE.search(src) and "data-dark" not in attrs:
            missing.append(src)
    return missing


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

    Three trees resolve against the repo root rather than site/: docs/ is
    owned by the docs build, and iconpack/ and images/ are the theme's real shipped
    artwork, which the icon gallery points at directly so the site cannot
    drift from what installs. All three are copied into the built tree by
    deploy-docs.yml and by scripts/serve-site.sh. Everything else resolves
    against site/ itself.
    """
    if ref.split("/", 1)[0] in ("docs", "iconpack", "images"):
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


def external_refs(html_text):
    """Return every distinct iconpack/... or images/... path referenced in
    index.html.

    Companion to asset_refs(), but one-directional (see check 5b): this
    feeds only a dangling-reference check, never an orphan check, since
    both trees hold hundreds of files the gallery legitimately never
    references.
    """
    refs = set()
    for ref in _ASSET_REF.findall(html_text):
        if ref.startswith(EXTERNAL_REF_ROOTS):
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

    # --- Check 5b: iconpack/ and images/ references resolve (one direction) ---
    icon_refs = external_refs(html)
    for ref in icon_refs:
        if not resolve_asset(ref).exists():
            failures.append(
                'dangling reference "{}" in site/index.html: no such file '
                "under {}/.".format(ref, ref.split("/", 1)[0])
            )

    # --- Check 5c: every phone capture has a dark twin, same size ---
    for src in phone_shots_missing_twin(html):
        failures.append(
            'phone capture "{}" in site/index.html has no data-dark twin: the '
            "#mobile grid would leave it light while the tiles beside it go "
            "dark.".format(src)
        )
    for light_ref, dark_ref in dark_twin_refs(html):
        dark_path = resolve_asset(dark_ref)
        if not dark_path.exists():
            failures.append(
                'dark twin "{}" declared by "{}" does not exist: picking a '
                "dark scheme would break that image.".format(dark_ref, light_ref)
            )
            continue
        light_path = resolve_asset(light_ref)
        if not light_path.exists():
            continue  # check 5 already reports a dangling src
        light_size = png_size(light_path)
        dark_size = png_size(dark_path)
        if light_size != dark_size:
            failures.append(
                'dark twin "{}" is {}x{} but "{}" is {}x{}: the tile would '
                "resize when the scheme changes.".format(
                    dark_ref, dark_size[0], dark_size[1],
                    light_ref, light_size[0], light_size[1],
                )
            )

    # --- Check 6: the tour manifest resolves, and covers every scheme ---
    tour_js = TOUR_JS.read_text()
    dashboard_shots = tour_dashboard_shots(tour_js)
    slides = tour_slide_paths(tour_js)
    phone_slides = tour_slide_paths(tour_js, phone=True)
    slide_problems = (tour_slide_problems(tour_js)
                      + tour_slide_problems(tour_js, phone=True))
    for problem in slide_problems:
        failures.append(problem)
    if not slide_problems and not slides:
        failures.append(
            "site/tour.js SLIDES parsed with no non-perScheme slides: the "
            "manifest read cleanly but covers none of the light/dark "
            "captures, which is as blind a guard as an unreadable entry."
        )
    if not dashboard_shots:
        failures.append(
            "no DASHBOARD_SHOTS map found in site/tour.js: the hero cannot "
            "answer the scheme picker."
        )
    missing_schemes = sorted(set(schemes) - set(dashboard_shots))
    extra_schemes = sorted(set(dashboard_shots) - set(schemes))
    if missing_schemes:
        failures.append(
            "site/tour.js DASHBOARD_SHOTS has no capture for: {}. A visitor "
            "picking one of those sees another scheme's dashboard.".format(
                ", ".join(missing_schemes)
            )
        )
    if extra_schemes:
        failures.append(
            "site/tour.js DASHBOARD_SHOTS names schemes tokens.css does not "
            "define: {}.".format(", ".join(extra_schemes))
        )
    # The phone set is labelled, not merged blind: the two sets legitimately
    # share slide NAMES (Dashboard, Switches, Utility, Device log) and must
    # never share a PATH, so a collision has to say which set it came from.
    labelled_phone = [
        ("{} (phone)".format(name), light, dark)
        for name, light, dark in phone_slides
    ]
    for name, light, dark in slides + labelled_phone:
        for label, ref in (("light", light), ("dark", dark)):
            if not ref:
                failures.append(
                    'tour slide "{}" has no {} capture: the rotation would '
                    "skip it in that base.".format(name, label)
                )
    for label_a, label_b, path in duplicate_tour_paths(
            dashboard_shots, slides + labelled_phone):
        failures.append(
            'tour entries "{}" and "{}" both resolve to "{}": the visitor '
            "sees the same screenshot twice under different captions."
            .format(label_a, label_b, path)
        )
    if not phone_slides:
        failures.append(
            "no PHONE_SLIDES entries found in site/tour.js: below 768px the "
            "hero would fall back to desktop captures painted at a quarter of "
            "native, or to a single shot that ignores the scheme picker."
        )
    tour_refs = sorted(set(dashboard_shots.values())
                       | {p for _, light, dark in slides + labelled_phone
                          for p in (light, dark) if p})
    for ref in tour_refs:
        if not resolve_asset(ref).exists():
            failures.append(
                'tour capture "{}" referenced by site/tour.js does not exist. '
                "tour.js skips a slide whose image fails, so this ships as an "
                "invisible hole in the rotation.".format(ref)
            )

    for failure in failures:
        print("check-site: " + failure, file=sys.stderr)
    if failures:
        return 1
    print(
        "check-site: OK ({} schemes, {} mapped colour keys, {} image "
        "dimensions checked, {} assets referenced, {} iconpack/images "
        "references, {} tour captures, no absolute references)".format(
            len(schemes), len(generator), dimension_checks, len(existing),
            len(icon_refs), len(tour_refs),
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
