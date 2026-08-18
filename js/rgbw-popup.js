/* Machinon colour popup (feature: rgbw_popup). Wraps core's ShowRGBWPopup;
   the Machinon modal lives in its own #mk-rgbw-popup div, core's #rgbw_popup
   markup is never touched so delegation to the original always works.
   Delegates to core for: DimmerType "rel", custom w/ww subtypes, or any
   drift-guard failure (core signature changed -> never hook, zero risk). */
(function () {
    "use strict";
    if (typeof window.ShowRGBWPopup !== "function" ||
        window.ShowRGBWPopup.length !== 8 ||           /* (event, idx, Protected, MaxDimLevel, LevelInt, color, SubType, DimmerType) */
        typeof window.HandleProtection !== "function" ||
        typeof window.getLEDType !== "function") {
        return; /* upstream drifted: leave core's popup alone */
    }
    if (window.ShowRGBWPopup._mkHooked) return;

    var orig = window.ShowRGBWPopup;

    window.ShowRGBWPopup = function (event, idx, Protected, MaxDimLevel, LevelInt, color, SubType, DimmerType) {
        var led = window.getLEDType(SubType || "");
        if ((DimmerType && DimmerType === "rel") || led.bHasCustom) {
            return orig.apply(this, arguments);
        }
        return orig.apply(this, arguments); /* Task 4 replaces this line with the modal open */
    };
    window.ShowRGBWPopup._mkHooked = true;
})();
