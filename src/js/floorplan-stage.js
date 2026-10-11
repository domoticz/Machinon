(function () {
'use strict';
var STAGE_CLASS = 'machinon-fp-stage';
var coreFn = null;
var installed = false;
function getStage() {
return document.getElementById('floorplancontent');
}
function wrapper(tagName, animate) {
var result = coreFn.apply(this, arguments);
try {
var stage = getStage();
var target = (typeof tagName === 'string') ? document.getElementById(tagName) : null;
if (stage && target && stage.contains(target) &&
window.getComputedStyle(stage).overflowX === 'hidden') {
var left = target.offsetLeft;
var $ = window.jQuery;
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
}
return result;
}
function installWrap() {
if (installed) return;
try {
var desc = Object.getOwnPropertyDescriptor(window, 'ScrollFloorplans');
if (desc && !desc.configurable) return;
var existing = window.ScrollFloorplans;
Object.defineProperty(window, 'ScrollFloorplans', {
configurable: true,
get: function () { return (typeof coreFn === 'function') ? wrapper : coreFn; },
set: function (fn) { coreFn = fn; }
});
if (typeof existing === 'function') coreFn = existing;
installed = true;
} catch (e) {
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
dzOnDomSettled(applyClass);
}
installWrap();
if (window.jQuery) window.jQuery(start);
})();
