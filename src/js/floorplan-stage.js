/* floorplan-stage.js - keep the mobile menu reachable on the floorplans page.

   Core lays the floorplans out side by side in the DOCUMENT (one
   full-viewport-wide .imageparent per plan, FloorplanController.js:514-515,
   sized to the stage width at :179-180) and switches plans by scrolling the
   document horizontally: every entry point (bullet mouseup :562, touch bullet
   :34, swipe :51/:54, nav arrows :533/:539, keyboard :111/:114, resize realign
   :186) funnels into the global ScrollFloorplans (:71), whose only mechanism
   is window.scrollTo (:81 instant, :85 animated). Below 980px the theme's
   navbar is position:static in flow by design (css/sidemenu.css), so that
   document scroll slides the whole menu off-screen.

   The fix pairs this module with css/floorplan.css: the CSS turns
   #floorplancontent into the horizontal scroll box (overflow-x hidden), and
   this module redirects core's plan switching to the stage's own scrollLeft.
   Cannot be CSS-only: window.scrollTo is bound to the document, no stylesheet
   can retarget it, and clipping the overflow without retargeting would leave
   every plan-switch a silent no-op (measured: scrollTo(346) clamps to 20).

   FAIL CLOSED, two directions:
   1. The CSS containment only activates on a body class
      (machinon-fp-stage) that THIS module sets, and only after it has
      verified its exact hooks: the ScrollFloorplans wrap is installed, core
      has assigned the function, and the #floorplancontent stage with its
      .imageparent children exists. Core drift means the class never appears
      and core behavior stays fully stock, never half-applied.
   2. The wrapper only redirects when the containment is actually active,
      checked by computed style at call time (overflow-x of the stage), never
      by duplicating the 979px breakpoint. On desktop the rule does not match,
      the wrapper no-ops, and core scrolls the document exactly as today.

   Wrap shape: ScrollFloorplans is assigned without var on every controller
   instantiation (each visit to #/Floorplans), so a plain function swap would
   be clobbered on route re-entry. An accessor property intercepts every
   assignment instead: core's assignments land in coreFn via the setter, and
   all callers read the wrapper back through the getter. */
(function () {
    'use strict';

    var STAGE_CLASS = 'machinon-fp-stage';
    var coreFn = null;
    var installed = false;

    function getStage() {
        return document.getElementById('floorplancontent');
    }

    function wrapper(tagName, animate) {
        /* Core first: it owns actFloorplan, the bullet class swap and the nav
           arrows, and its window.scrollTo is inert while the stage is
           contained (the document has no horizontal range left). */
        var result = coreFn.apply(this, arguments);
        try {
            var stage = getStage();
            var target = (typeof tagName === 'string') ? document.getElementById(tagName) : null;
            if (stage && target && stage.contains(target) &&
                window.getComputedStyle(stage).overflowX === 'hidden') {
                /* offsetLeft is relative to the stage (its offsetParent: the
                   stage is the nearest positioned ancestor, position:absolute
                   per views/floorplans.html:2), so it is exactly the scroll
                   offset of plan i, matching core's width*i arithmetic (:81)
                   without re-deriving the width. */
                var left = target.offsetLeft;
                var $ = window.jQuery;
                /* Mirror core's animation gate (:72-75): the AnimateZoom
                   setting, overridden by an explicit second argument (the
                   resize realign passes false). */
                var allowAnimation = !!($ && $.myglobals && $.myglobals.AnimateTransitions);
                if (arguments.length > 1) allowAnimation = !!animate;
                if (allowAnimation && $) {
                    $(stage).stop(true).animate({ scrollLeft: left }, {
                        duration: 500,
                        easing: ($.easing && $.easing.easeOutQuint) ? 'easeOutQuint' : 'swing'
                    });
                } else {
                    stage.scrollLeft = left;
                }
            }
        } catch (e) {
            /* Redirect failure must never break core's own result. */
        }
        return result;
    }

    function installWrap() {
        if (installed) return;
        try {
            var desc = Object.getOwnPropertyDescriptor(window, 'ScrollFloorplans');
            if (desc && !desc.configurable) return; /* fail closed: leave core alone */
            var existing = window.ScrollFloorplans;
            Object.defineProperty(window, 'ScrollFloorplans', {
                configurable: true,
                get: function () { return (typeof coreFn === 'function') ? wrapper : coreFn; },
                set: function (fn) { coreFn = fn; }
            });
            if (typeof existing === 'function') coreFn = existing;
            installed = true;
        } catch (e) {
            /* fail closed: without the wrap the class below is never set,
               so the CSS containment stays inert and core is untouched */
        }
    }

    function applyClass() {
        var stage = getStage();
        var hooksLive = installed && typeof coreFn === 'function' &&
            !!stage && !!stage.querySelector('.imageparent');
        if (document.body) {
            document.body.classList.toggle(STAGE_CLASS, hooksLive);
        }
    }

    function start() {
        applyClass();
        /* The stage and its plans only exist while #/Floorplans is loaded, so
           presence-toggle the class from devices.js's shared DOM-settled
           debounce (dzOnDomSettled), same pattern as card-drag-handle; devices.js
           already debounces 50ms, so this registers the work directly rather
           than debouncing a second time. That observer watches #holder, not
           #main-view: ngView replaces the #main-view ELEMENT itself on every
           route change, which would leave an observer bound to a detached
           node. applyClass() itself is a cheap no-op off #/Floorplans
           (getStage() finds nothing). */
        dzOnDomSettled(applyClass);
    }

    installWrap();
    if (window.jQuery) window.jQuery(start);
})();
