/*
  tour.js - the hero screenshot tour.

  One job: rotate the hero image through a set of Domoticz pages and keep it
  honest about the active colour scheme. Split out of app.js rather than added
  to it so each file stays small: app.js owns the scheme picker, the scroll
  reveal and the copy buttons, this owns the hero.

  TWO SLIDE SETS, ONE MACHINE. Below 768px the hero shows PHONE_SLIDES, six
  real 390x844 phone captures; above it, SLIDES, eight 1440x900 desktop ones.
  This is not a nicety: a 1440px capture inside a 360px hero paints at 24% of
  native and reads as grey mush, which is why the phone showed a single
  screenshot and no rotation before this set existed. Everything else (the
  crossfade, the dots, the timer, the scheme handling) is shared, and
  applyForm() switches sets when the breakpoint is crossed.

  HOW THE SOURCES RESOLVE. Two rules, not one, because captures cost repo
  weight and only the first desktop slide is worth eight of them:
    - The desktop Dashboard slide has a capture per scheme, so the picker
      changes the hero exactly on the slide that loads first and that visitors
      experiment on.
    - Every other slide, desktop and phone alike, has a light and a dark
      capture, chosen by the active scheme's base. Its alt text therefore
      names the page and the base only, never the scheme: claiming Gruvbox for
      a capture that is merely dark would be a lie told only to screen reader
      users.

  PROGRESSIVE ENHANCEMENT. index.html ships slide one, its caption, and an
  empty dots container. Without JavaScript that is a single labelled
  screenshot, which is what the page showed before this file existed. The
  second buffer and the dots are built here.

  WHY TWO BUFFERS. Crossfading needs both images live at once. Swapping one
  element's src flashes the alt text and repaints the box; writing the next
  source into the hidden buffer, waiting for its load, then swapping which one
  is opaque, never shows an empty frame.
*/
(function () {
    'use strict';

    var ADVANCE_MS = 5000;
    var PHONE_QUERY = '(max-width: 768px)';

    /* Slide order. `perScheme` marks the one slide with a capture per scheme;
       the rest carry a light and a dark path. Paths are literal strings on
       purpose: scripts/check-site.py parses this file to prove every one of
       them exists and that no slide is missing its dark twin. */
    var SLIDES = [
        { name: 'Dashboard', caption: 'Dashboard, your devices as cards', perScheme: true },
        { name: 'Floorplan', caption: 'Floorplan, the whole house at a glance',
          light: 'docs/screenshots/floorplan.png', dark: 'docs/screenshots/floorplan-dark.png' },
        { name: 'Switches', caption: 'Switches, every light and relay in one place',
          light: 'docs/screenshots/switches.png', dark: 'docs/screenshots/switches-dark.png' },
        { name: 'Weather', caption: 'Weather, readings from your own sensors',
          light: 'docs/screenshots/weather.png', dark: 'docs/screenshots/weather-dark.png' },
        { name: 'Utility', caption: 'Utility, energy, water and gas with bar ranges',
          light: 'docs/screenshots/utility.png', dark: 'docs/screenshots/utility-dark.png' },
        { name: 'Device log', caption: 'Device log, history charted per device',
          light: 'docs/screenshots/device-graph.png', dark: 'docs/screenshots/device-graph-dark.png' },
        { name: 'Theme Hub', caption: 'Theme Hub, every theme setting on one page',
          light: 'docs/screenshots/theme-hub.png', dark: 'docs/screenshots/theme-hub-dark.png' },
        { name: 'Icon packs', caption: 'Icon packs, installed onto individual devices',
          light: 'docs/screenshots/icon-packs.png', dark: 'docs/screenshots/icon-packs-dark.png' }
    ];

    /* The phone set, below PHONE_QUERY. Same shape as SLIDES minus perScheme:
       there is one phone capture per base, not one per scheme, so the phone
       hero answers the picker's light/dark half and never claims a scheme in
       its alt text. `alt` is spelled out per slide rather than derived,
       because "The Compact dashboard page on a phone" is not a sentence a
       template produces well.

       Six, not eight: Floorplan and Theme Hub are the two desktop slides with
       no phone story worth a first impression (the floorplan wants width, the
       hub is a settings page). The #mobile section further down the page
       carries the same six captures as a static grid.

       Paths are literal strings on purpose: scripts/check-site.py parses this
       file to prove every one of them exists and that no slide is missing its
       dark twin. */
    var PHONE_SLIDES = [
        { name: 'Dashboard', caption: 'Dashboard, your devices as cards',
          alt: 'The dashboard on a phone, cards stacked in one column',
          light: 'docs/screenshots/mobile-dashboard.png',
          dark: 'docs/screenshots/mobile-dashboard-dark.png' },
        { name: 'Compact dashboard', caption: 'Compact dashboard, favorites as rows',
          alt: 'The compact mobile dashboard listing favorite devices as rows',
          light: 'docs/screenshots/mobile-dashboard-compact.png',
          dark: 'docs/screenshots/mobile-dashboard-compact-dark.png' },
        { name: 'Switches', caption: 'Switches, every light and relay in one place',
          alt: 'The Switches page on a phone',
          light: 'docs/screenshots/mobile-switches.png',
          dark: 'docs/screenshots/mobile-switches-dark.png' },
        { name: 'Temperature', caption: 'Temperature, every sensor in the house',
          alt: 'The Temperature page on a phone',
          light: 'docs/screenshots/mobile-temperature.png',
          dark: 'docs/screenshots/mobile-temperature-dark.png' },
        { name: 'Utility', caption: 'Utility, energy, water and gas with bar ranges',
          alt: 'The Utility page on a phone',
          light: 'docs/screenshots/mobile-utility.png',
          dark: 'docs/screenshots/mobile-utility-dark.png' },
        { name: 'Device log', caption: 'Device log, history charted per device',
          alt: 'A device log chart scaled to a phone screen',
          light: 'docs/screenshots/mobile-device-graph.png',
          dark: 'docs/screenshots/mobile-device-graph-dark.png' }
    ];

    /* One per scheme id in tokens.css. check-site.py compares these keys
       against that canonical list, NOT against schemes/index.json, which holds
       only the six add-on schemes and would silently accept both Machinon
       defaults missing. */
    var DASHBOARD_SHOTS = {
        'machinon-light': 'docs/screenshots/dashboard-light.png',
        'machinon-dark': 'docs/screenshots/dashboard-dark.png',
        'magenta-light': 'docs/screenshots/dashboard-magenta-light.png',
        'magenta-dark': 'docs/screenshots/dashboard-magenta-dark.png',
        'paper-light': 'docs/screenshots/dashboard-paper-light.png',
        'paper-dark': 'docs/screenshots/dashboard-paper-dark.png',
        'gruvbox-light': 'docs/screenshots/dashboard-gruvbox-light.png',
        'gruvbox-dark': 'docs/screenshots/dashboard-gruvbox-dark.png'
    };

    var SCHEME_LABELS = {
        'machinon-light': 'Machinon Light', 'machinon-dark': 'Machinon Dark',
        'magenta-light': 'Magenta Light', 'magenta-dark': 'Magenta Dark',
        'paper-light': 'Paper Light', 'paper-dark': 'Paper Dark',
        'gruvbox-light': 'Gruvbox Light', 'gruvbox-dark': 'Gruvbox Dark'
    };

    var frame = null;
    var buffers = [];
    var active = 0;      // index into buffers
    var index = 0;       // index into SLIDES
    var timer = null;
    var stopped = false; // true once the visitor has steered
    var pending = false; // true while show() is waiting on an image load
    var swapToken = 0;   // bumped to invalidate a stale in-flight swap
    var scheme = 'machinon-light';
    var base = 'light';

    function reduced() {
        return window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function onPhone() {
        return !!(window.matchMedia && window.matchMedia(PHONE_QUERY).matches);
    }

    /* The live slide set. Every index in this file is an index INTO THIS, never
       into SLIDES directly: crossing the breakpoint has to swap the whole tour,
       its dots and its captions, not just the image behind slide n. */
    function slides() {
        return onPhone() ? PHONE_SLIDES : SLIDES;
    }

    function pathFor(slide) {
        if (slide.perScheme) {
            return DASHBOARD_SHOTS[scheme] || DASHBOARD_SHOTS['machinon-light'];
        }
        return base === 'dark' ? slide.dark : slide.light;
    }

    function altFor(slide) {
        if (slide.perScheme) {
            return 'The Machinon dashboard in the '
                + (SCHEME_LABELS[scheme] || 'Machinon Light') + ' scheme';
        }
        /* Phone slides carry their own wording; both forms end in the base, so
           a screen reader hears which half of the scheme pair it is looking at
           without either claiming a scheme the capture cannot prove. */
        return (slide.alt || 'The ' + slide.name + ' page') + ', ' + base;
    }

    /* Paint slide `next` into the hidden buffer and swap. Returns immediately;
       the swap happens on the image's load event, or straight away if the
       browser already has it.

       `pending` lets an auto-advance tick yield to an in-flight swap, because
       a dropped tick costs nothing. A USER action must never be dropped, so a
       dot click passes userInitiated and supersedes instead: it reassigns the
       hidden buffer's src, and `swapToken` makes the superseded load's
       handler a no-op when it eventually fires. That is what stops the
       stale-closure double swap (the original hazard both buffers reused on
       every call created) without silently eating a click. */
    function show(next, userInitiated) {
        if (!frame || !buffers.length) { return; }
        if (pending && !userInitiated) { return; }
        var token = ++swapToken;
        var set = slides();
        var slide = set[next];
        var path = pathFor(slide);
        var incoming = buffers[1 - active];

        var swap = function () {
            if (token !== swapToken) { return; } // superseded by a later show()
            pending = false;
            incoming.classList.add('is-active');
            buffers[active].classList.remove('is-active');
            active = 1 - active;
            index = next;
            paintCaption(slide);
            paintDots();
            preload(set[(next + 1) % set.length]);
        };

        if (incoming.getAttribute('src') === path) { swap(); return; }
        pending = true;
        incoming.onload = function () { incoming.onload = null; swap(); };
        incoming.onerror = function () {
            /* A missing capture must not park the tour on a blank frame. Skip
               it and keep going; check-site.py exists to stop this reaching
               production in the first place. */
            incoming.onerror = null;
            pending = false;
            if (next !== index) { show((next + 1) % set.length); }
        };
        incoming.setAttribute('alt', altFor(slide));
        incoming.setAttribute('src', path);
    }

    function preload(slide) {
        var img = new Image();
        img.src = pathFor(slide);
    }

    function paintCaption(slide) {
        var el = document.getElementById('hero-slide-name');
        if (el) { el.textContent = slide.caption; }
    }

    function paintDots() {
        var dots = document.querySelectorAll('.hero-dots button');
        for (var i = 0; i < dots.length; i++) {
            if (i === index) { dots[i].setAttribute('aria-current', 'true'); }
            else { dots[i].removeAttribute('aria-current'); }
        }
    }

    function start() {
        if (timer || stopped || reduced()) { return; }
        timer = window.setInterval(function () {
            show((index + 1) % slides().length);
        }, ADVANCE_MS);
    }

    function pause() {
        if (timer) { window.clearInterval(timer); timer = null; }
    }

    /* A click means the visitor wants to steer, so the rotation ends for the
       session. This is also what gives WCAG 2.2.2 a real stop mechanism: a
       hover-only pause does not qualify. */
    function stop() {
        stopped = true;
        pause();
    }

    /* Rebuilt rather than built once, because the two slide sets are different
       lengths: eight dots for six phone slides would leave two that steer to
       nothing. Cheap enough to redo wholesale (at most eight buttons, only on
       init and on a breakpoint crossing) that diffing would be the more
       fragile choice. */
    function rebuildDots(host) {
        var set = slides();
        while (host.firstChild) { host.removeChild(host.firstChild); }
        for (var i = 0; i < set.length; i++) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'hero-dot';
            dot.setAttribute('aria-label', 'Show ' + set[i].name);
            dot.addEventListener('click', (function (target) {
                return function () { stop(); show(target, true); };
            }(i)));
            host.appendChild(dot);
        }
        paintDots();
    }

    /* Called at init and whenever the phone breakpoint is crossed, so a device
       rotation or a resized desktop window lands in the right mode rather than
       keeping whatever was true at first paint.

       Crossing the breakpoint is a user action (a resize or a rotation) same
       as a dot click, so it must not be silently undone by a crossfade that
       was already in flight: it writes the active buffer directly, below, and
       invalidates any pending swap so that swap's eventual onload cannot
       overwrite what this just painted with a now-stale slide. */
    function applyForm() {
        var set = slides();
        /* The sets are different pages, not the same pages at two sizes, so a
           desktop position has no phone counterpart to carry across. Restart
           rather than invent a mapping; the alternative is landing a phone
           visitor on a slide they never chose. */
        if (index >= set.length) { index = 0; }
        var dotHost = document.querySelector('.hero-dots');
        if (dotHost) { rebuildDots(dotHost); }
        start();
        swapToken++;
        pending = false;
        var img = buffers.length ? buffers[active] : null;
        if (img) {
            var path = pathFor(set[index]);
            img.setAttribute('alt', altFor(set[index]));
            if (img.getAttribute('src') !== path) { img.setAttribute('src', path); }
        }
        paintCaption(set[index]);
        preload(set[(index + 1) % set.length]);
    }

    function init() {
        frame = document.querySelector('.hero-frame');
        var first = document.getElementById('hero-screenshot');
        var dotHost = document.querySelector('.hero-dots');
        if (!frame || !first || !dotHost) { return; }

        first.classList.add('is-active');

        /* Hand control of the first buffer over from the markup to this file.
           index.html wraps it in a <picture> whose <source> serves the phone
           capture below 768px, which is what a visitor without JavaScript
           sees and what keeps a phone from ever requesting the 1440x900
           desktop shot. A <source> outranks the src set below, though, so
           leaving it in place would pin the phone hero to slide one forever.
           Removing it re-runs the selection algorithm, and applyForm() sets
           the right src in this same task, so the intermediate state is never
           fetched. dz-site-hero.js measures both halves: that the phone
           issues no request for the desktop capture, and that the rotation
           still moves afterwards. */
        var picture = first.parentNode;
        if (picture && picture.tagName === 'PICTURE') {
            var sources = picture.getElementsByTagName('source');
            while (sources.length) { picture.removeChild(sources[0]); }
        }

        var second = document.createElement('img');
        second.setAttribute('width', '1440');
        second.setAttribute('height', '900');
        second.setAttribute('alt', '');
        frame.appendChild(second);
        buffers = [first, second];

        frame.parentNode.addEventListener('mouseenter', pause);
        frame.parentNode.addEventListener('mouseleave', start);
        frame.parentNode.addEventListener('focusin', pause);
        frame.parentNode.addEventListener('focusout', start);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { pause(); } else { start(); }
        });

        if (window.matchMedia) {
            var phoneQuery = window.matchMedia(PHONE_QUERY);
            /* addEventListener on a MediaQueryList, with the addListener
               fallback: Safari only gained the modern form in 14. */
            if (phoneQuery.addEventListener) { phoneQuery.addEventListener('change', applyForm); }
            else if (phoneQuery.addListener) { phoneQuery.addListener(applyForm); }
        }

        applyForm();
    }

    window.machinonTour = {
        /* app.js calls this on every scheme change. Re-resolves the CURRENT
           slide so the hero never contradicts the picker.

           A scheme pick is a user action too: it writes the active buffer
           directly, same as applyForm, and invalidates any crossfade already
           in flight for the same reason, so a stale onload cannot overwrite
           the scheme the visitor just chose. */
        setScheme: function (schemeId, schemeBase) {
            scheme = schemeId;
            base = schemeBase;
            if (!buffers.length) { return; }
            swapToken++;
            pending = false;
            var slide = slides()[index];
            var img = buffers[active];
            img.setAttribute('alt', altFor(slide));
            var path = pathFor(slide);
            if (img.getAttribute('src') !== path) { img.setAttribute('src', path); }
        },
        /* Read by the dz-site-hero.js contract harness. */
        slideCount: function () { return slides().length; },
        currentIndex: function () { return index; },
        allPaths: function () {
            var out = [], key, i;
            for (key in DASHBOARD_SHOTS) {
                if (Object.prototype.hasOwnProperty.call(DASHBOARD_SHOTS, key)) {
                    out.push(DASHBOARD_SHOTS[key]);
                }
            }
            for (i = 1; i < SLIDES.length; i++) { out.push(SLIDES[i].light, SLIDES[i].dark); }
            for (i = 0; i < PHONE_SLIDES.length; i++) {
                out.push(PHONE_SLIDES[i].light, PHONE_SLIDES[i].dark);
            }
            return out;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
