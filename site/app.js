/*
  app.js - landing page behaviour.

  Three jobs: drive the scheme picker (which is the page's whole selling
  point), reveal sections on scroll, and back the copy buttons. No
  dependencies, no network access.
*/
(function () {
    'use strict';

    var STORAGE_KEY = 'machinon_site_scheme';

    /* Scheme ids and labels must match the [data-scheme] blocks in tokens.css.
       scripts/check-site.py enforces that they do. */
    var SCHEMES = [
        { id: 'machinon-light', label: 'Machinon Light', base: 'light' },
        { id: 'machinon-dark', label: 'Machinon Dark', base: 'dark' },
        { id: 'magenta-light', label: 'Magenta Light', base: 'light' },
        { id: 'magenta-dark', label: 'Magenta Dark', base: 'dark' },
        { id: 'paper-light', label: 'Paper Light', base: 'light' },
        { id: 'paper-dark', label: 'Paper Dark', base: 'dark' },
        { id: 'gruvbox-light', label: 'Gruvbox Light', base: 'light' },
        { id: 'gruvbox-dark', label: 'Gruvbox Dark', base: 'dark' }
    ];

    /* Screenshots exist for three schemes only. Anything else falls back to
       the base image for its light/dark side, which is honest: the page never
       claims an image is of a scheme it is not. */
    var SHOTS = {
        'machinon-light': 'docs/screenshots/dashboard-light.png',
        'machinon-dark': 'docs/screenshots/dashboard-dark.png',
        'magenta-dark': 'docs/screenshots/scheme-magenta.png'
    };

    function byId(id) { return document.getElementById(id); }

    function schemeById(id) {
        for (var i = 0; i < SCHEMES.length; i++) {
            if (SCHEMES[i].id === id) { return SCHEMES[i]; }
        }
        return SCHEMES[0];
    }

    function defaultScheme() {
        var stored = null;
        try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { stored = null; }
        if (stored) {
            for (var i = 0; i < SCHEMES.length; i++) {
                if (SCHEMES[i].id === stored) { return stored; }
            }
        }
        var prefersDark = window.matchMedia
            && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'machinon-dark' : 'machinon-light';
    }

    function applyScheme(id) {
        var scheme = schemeById(id);
        document.documentElement.setAttribute('data-scheme', scheme.id);
        try { localStorage.setItem(STORAGE_KEY, scheme.id); } catch (e) { /* private mode */ }

        var picker = byId('scheme-picker');
        if (picker && picker.value !== scheme.id) { picker.value = scheme.id; }

        var shot = byId('hero-screenshot');
        if (shot) {
            var src = SHOTS[scheme.id]
                || (scheme.base === 'dark'
                    ? 'docs/screenshots/dashboard-dark.png'
                    : 'docs/screenshots/dashboard-light.png');
            if (shot.getAttribute('src') !== src) { shot.setAttribute('src', src); }
            shot.setAttribute('alt',
                'The Machinon dashboard showing device cards in the '
                + scheme.label + ' scheme');
        }

        var active = document.querySelectorAll('.scheme-swatch');
        for (var i = 0; i < active.length; i++) {
            active[i].setAttribute('aria-pressed',
                active[i].getAttribute('data-scheme-id') === scheme.id ? 'true' : 'false');
        }
    }

    /* The schemes section: one button per scheme, each previewing that
       scheme's own palette by scoping the tokens to itself. */
    function buildSchemeGrid() {
        var grid = byId('scheme-grid');
        if (!grid) { return; }
        for (var i = 0; i < SCHEMES.length; i++) {
            var scheme = SCHEMES[i];
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'scheme-swatch';
            button.setAttribute('data-scheme', scheme.id);
            button.setAttribute('data-scheme-id', scheme.id);
            button.setAttribute('aria-pressed', 'false');
            button.innerHTML =
                '<span class="scheme-swatch-name">' + scheme.label + '</span>'
                + '<span class="scheme-swatch-chips">'
                + '<span class="chip chip-bg"></span>'
                + '<span class="chip chip-nav"></span>'
                + '<span class="chip chip-card"></span>'
                + '<span class="chip chip-accent"></span>'
                + '<span class="chip chip-text"></span>'
                + '</span>';
            grid.appendChild(button);
        }
        grid.addEventListener('click', function (event) {
            var target = event.target.closest('.scheme-swatch');
            if (target) { applyScheme(target.getAttribute('data-scheme-id')); }
        });
    }

    function wirePicker() {
        var picker = byId('scheme-picker');
        if (picker) {
            picker.addEventListener('change', function () { applyScheme(picker.value); });
        }
    }

    function wireReveals() {
        if (!('IntersectionObserver' in window)) { return; }
        var sections = document.querySelectorAll('main > section');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
        for (var i = 0; i < sections.length; i++) {
            sections[i].classList.add('reveal');
            observer.observe(sections[i]);
        }
    }

    function wireCopyButtons() {
        var buttons = document.querySelectorAll('.copy-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function (event) {
                var button = event.currentTarget;
                var text = button.getAttribute('data-copy') || '';
                if (!navigator.clipboard) { return; }
                navigator.clipboard.writeText(text).then(function () {
                    var original = button.textContent;
                    button.textContent = 'Copied';
                    setTimeout(function () { button.textContent = original; }, 1500);
                });
            });
        }
    }

    buildSchemeGrid();
    wirePicker();
    wireReveals();
    wireCopyButtons();
    applyScheme(defaultScheme());
}());
