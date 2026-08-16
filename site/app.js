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
       scripts/check-site.py enforces that they do. The same ids also appear in
       the <select> options and in the pre-paint IDS array inline in index.html's
       <head>, which stamps data-scheme before this deferred file can run.
       Change one, change all three. */
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

    /* Three cards are interactive demos (lights, dimmer, garage). Each click
       proves the same three things: the card is the theme's real layout, the
       icon library carries per-state artwork, and icons are chosen per
       device.

       Both PNGs of a pair are already in the DOM with one hidden, so a swap
       is a display toggle and never waits on a fetch. site/style.css carries
       the img[hidden] rule that makes hiding an <img> work at all here. */
    function wireGarageCard() {
        var card = byId('garage-card');
        var button = byId('garage-toggle');
        if (!card || !button) { return; }

        var onImg = card.querySelector('[data-garage-on]');
        var offImg = card.querySelector('[data-garage-off]');
        var value = card.querySelector('[data-garage-value]');
        var status = card.querySelector('[data-garage-status]');
        var stamp = card.querySelector('[data-garage-stamp]');
        if (!onImg || !offImg || !value || !status || !stamp) { return; }

        /* Ships disabled in the markup so a JS-less visitor gets an inert,
           unfocusable control rather than a live one that does nothing. */
        button.disabled = false;

        var STATES = {
            open: { value: 'Open', status: 'Contact open' },
            closed: { value: 'Closed', status: 'Contact closed' }
        };

        function render(isOpen) {
            var state = isOpen ? STATES.open : STATES.closed;
            button.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
            /* .is-on is what paints the track on the accent, same class the
               static switches use. */
            if (isOpen) { button.classList.add('is-on'); }
            else { button.classList.remove('is-on'); }
            onImg.hidden = !isOpen;
            offImg.hidden = isOpen;
            value.textContent = state.value;
            status.textContent = state.status;
            stamp.textContent = 'just now';
        }

        /* A <button> fires click for Enter and Space already, so keyboard
           support needs no extra key handling. */
        button.addEventListener('click', function () {
            render(button.getAttribute('aria-pressed') !== 'true');
        });
    }

    /* Kitchen lights: the garage's swap pattern on the pack's Light48 pair. */
    function wireLightsCard() {
        var card = byId('lights-card');
        var button = byId('lights-toggle');
        if (!card || !button) { return; }

        var onImg = card.querySelector('[data-lights-on]');
        var offImg = card.querySelector('[data-lights-off]');
        var value = card.querySelector('[data-lights-value]');
        var stamp = card.querySelector('[data-lights-stamp]');
        if (!onImg || !offImg || !value || !stamp) { return; }

        button.disabled = false;

        function render(isOn) {
            button.setAttribute('aria-pressed', isOn ? 'true' : 'false');
            if (isOn) { button.classList.add('is-on'); }
            else { button.classList.remove('is-on'); }
            onImg.hidden = !isOn;
            offImg.hidden = isOn;
            value.textContent = isOn ? 'On' : 'Off';
            stamp.textContent = 'just now';
        }

        button.addEventListener('click', function () {
            render(button.getAttribute('aria-pressed') !== 'true');
        });
    }

    /* Hallway dimmer: a draggable level. Pointer events cover mouse and
       touch in one path; arrow keys serve keyboard users. At 0% the bulb
       swaps to its off artwork, as the theme's own dimmer cards do. Ships
       aria-disabled and unfocusable in the markup for JS-less visitors,
       mirroring the toggles' disabled attribute. */
    function wireDimmerCard() {
        var card = byId('dimmer-card');
        var slider = byId('dimmer-slider');
        if (!card || !slider) { return; }

        var fill = slider.querySelector('.slider-fill');
        var knob = slider.querySelector('.slider-knob');
        var onImg = card.querySelector('[data-dimmer-on]');
        var offImg = card.querySelector('[data-dimmer-off]');
        var value = card.querySelector('[data-dimmer-value]');
        var stamp = card.querySelector('[data-dimmer-stamp]');
        if (!fill || !knob || !onImg || !offImg || !value || !stamp) { return; }

        slider.removeAttribute('aria-disabled');
        slider.tabIndex = 0;

        var level = 62;

        function render(next) {
            level = Math.max(0, Math.min(100, Math.round(next)));
            fill.style.inset = '0 ' + (100 - level) + '% 0 0';
            knob.style.left = level + '%';
            slider.setAttribute('aria-valuenow', String(level));
            value.textContent = level === 0 ? 'Off' : level + '%';
            onImg.hidden = level === 0;
            offImg.hidden = level !== 0;
            stamp.textContent = 'just now';
        }

        function levelFromEvent(event) {
            var rect = slider.getBoundingClientRect();
            return ((event.clientX - rect.left) / rect.width) * 100;
        }

        var dragging = false;
        slider.addEventListener('pointerdown', function (event) {
            dragging = true;
            slider.setPointerCapture(event.pointerId);
            render(levelFromEvent(event));
            event.preventDefault();
        });
        slider.addEventListener('pointermove', function (event) {
            if (dragging) { render(levelFromEvent(event)); }
        });
        slider.addEventListener('pointerup', function () { dragging = false; });
        slider.addEventListener('pointercancel', function () { dragging = false; });
        slider.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                render(level - 5);
                event.preventDefault();
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                render(level + 5);
                event.preventDefault();
            }
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

    /* Flashes a word on the button and puts the original back. The label is
       captured from data-label, never from textContent: reading textContent
       inside the async callback meant a second click during the 1500ms window
       captured "Copied" and restored that permanently. Re-arming the timer on
       every click keeps rapid clicks from stacking restores. */
    function flashLabel(button, word) {
        button.textContent = word;
        if (button._resetTimer) { clearTimeout(button._resetTimer); }
        button._resetTimer = setTimeout(function () {
            button.textContent = button.getAttribute('data-label');
            button._resetTimer = null;
        }, 1500);
    }

    function wireCopyButtons() {
        var buttons = document.querySelectorAll('.copy-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].setAttribute('data-label', buttons[i].textContent);
            buttons[i].addEventListener('click', function (event) {
                var button = event.currentTarget;
                var text = button.getAttribute('data-copy') || '';
                /* No clipboard API (or an insecure origin, where it is absent):
                   say so instead of failing silently. The command is on screen
                   directly above the button, so it can still be selected. */
                if (!navigator.clipboard) {
                    flashLabel(button, 'Select it');
                    return;
                }
                navigator.clipboard.writeText(text).then(function () {
                    flashLabel(button, 'Copied');
                }, function () {
                    /* Permission denied or document not focused. */
                    flashLabel(button, 'Press Ctrl+C');
                });
            });
        }
    }

    buildSchemeGrid();
    wirePicker();
    wireReveals();
    wireCopyButtons();
    wireGarageCard();
    wireLightsCard();
    wireDimmerCard();
    applyScheme(defaultScheme());
}());
