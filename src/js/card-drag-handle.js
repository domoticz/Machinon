/* card-drag-handle.js - reorder a device card only by its name area.

   Core makes the whole card wrapper draggable (jQuery UI .draggable() with no
   handle), on the Dashboard (incl. its burst re-inits), the per-type pages
   (Temperature/Weather/Utility/Scenes) and the classic dashboard. We cannot edit
   core, so we make the drag start only from the device-name cell (.item-name).

   Two mechanisms, because the theme's JS loads asynchronously (after Angular has
   already rendered the first route and core may have made those cards draggable):

   1. Wrap the public $.fn.draggable bridge: any INIT call (options is a plain
      object) on a card - detected structurally by the target containing a
      .item-name cell - gets handle:'.item-name' merged in. Slider draggables
      (.SliderHandle, called as .draggable() with no options) and string commands
      (.draggable('destroy')) pass through untouched. This catches every init made
      after the wrap is installed, including core's burst re-inits.
   2. A debounced observer that (re-)applies handle:'.item-name' to any already
      .ui-draggable card whose handle is not yet set. This heals the load-order
      race (cards made draggable before the wrap installed) and any init the wrap
      missed, and re-applies after a re-init before the next mousedown.

   See the spec: docs/superpowers/specs/2026-07-16-card-drag-handle-design.md */
(function () {
    'use strict';
    var HANDLE = '.item-name';
    var scheduled = false;

    function isCardSet($set) {
        // true if any element in the target set is a card (contains a name cell);
        // slider draggables contain none, so they are never rewritten.
        return $set.toArray().some(function (el) {
            return window.jQuery(el).find(HANDLE).length > 0;
        });
    }

    function applyHandle() {
        scheduled = false;
        var $ = window.jQuery;
        if (!$) return;
        $('.ui-draggable').each(function () {
            var $c = $(this);
            if (!$c.data('ui-draggable') || $c.find(HANDLE).length === 0) return;
            if ($c.draggable('option', 'handle') !== HANDLE) {
                $c.draggable('option', 'handle', HANDLE);
            }
        });
    }

    function schedule() {
        if (scheduled) return;
        scheduled = true;
        window.setTimeout(applyHandle, 50);
    }

    function installWrap() {
        var $ = window.jQuery;
        if (!$ || !$.fn || !$.fn.draggable || $.fn.draggable.__machinonHandleWrap) return;
        var original = $.fn.draggable;
        var wrapped = function (options) {
            if ($.isPlainObject(options) && !('handle' in options) && isCardSet(this)) {
                options = $.extend({}, options, { handle: HANDLE });
            }
            return original.apply(this, arguments);
        };
        wrapped.__machinonHandleWrap = true;
        $.fn.draggable = wrapped;
    }

    function start() {
        installWrap();
        applyHandle();
        var target = document.getElementById('holder') || document.body;
        if (target) {
            new MutationObserver(schedule).observe(target, {
                childList: true, subtree: true, attributes: true, attributeFilter: ['class']
            });
        }
    }

    installWrap();                 // as early as possible (module load)
    if (window.jQuery) window.jQuery(start);
})();
