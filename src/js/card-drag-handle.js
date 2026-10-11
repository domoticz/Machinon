(function () {
'use strict';
var HANDLE = '.item-name';
function isCardSet($set) {
return $set.toArray().some(function (el) {
return window.jQuery(el).find(HANDLE).length > 0;
});
}
function applyHandle() {
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
dzOnDomSettled(applyHandle);
}
installWrap();
if (window.jQuery) window.jQuery(start);
})();
