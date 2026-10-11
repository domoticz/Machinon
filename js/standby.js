/* Function scope: requirejs runs this feature file as a plain script, so
   top-level names (md, standbyTime, ...) would become window globals. The one
   name exported is dzStandby, for the rig harness dz-standby-hub.js. */
(function() {
    var standbyActive = false;

    var standbyTime = 0;

    var standby_after = theme.standby_after;

    var md = window.matchMedia("only screen and (max-width: 992px)");

    if (md.matches) {
        console.log(theme.name + " - Width smaller than 992px");
    } else {
        if (!isMobile) {
            $("body").on("mousemove", function(e) {
                standbyTime = 0;
                disableStandby();
            });
        }
    }

    $("body").on("touchend click", function(e) {
        setTimeout(function() {
            standbyTime = 0;
            disableStandby();
        }, 100);
    });

    if (parseFloat(standby_after) > 0) {
        setInterval(function() {
            standbyTime += 5000;
            if (standbyActive != true) {
                if (standbyTime >= standby_after * 1000 * 60) {
                    $("body").addClass("standby");
                    buildStandby();
                }
            }
        }, 5000);
    }

    /* One clock per standby screen: the handle is kept so disableStandby can stop
       it. Unkept, every activation started another self-rescheduling chain that
       ran for the rest of the page's life, on the wall tablets this feature is for. */
    var clockTimer = null;

    function showTime() {
        $("#MyClockDisplay").text(moment().format("LTS"));
        $("#MyDateDisplay").text(moment().format("L"));
        clockTimer = setTimeout(showTime, 1000);
    }

    function buildStandby() {
        standbyActive = true;
        if ($(".screenstandby").length == 0) {
            var screenhtml = '<div class="screen screenstandby" style="height:' + $(window).height() + 'px"><div class="row"></div>';
            $("#main-view").hide();
            $(".container-logo").hide();
            $(".navbar-inner").hide();
            $(".logo").hide();
            $("#copyright").hide();
            $("#main-view").before(screenhtml);
            $("div.screenstandby .row").append('<div id="MyDateDisplay" class="standbyDate"></div>');
            $("div.screenstandby .row").append('<div id="MyClockDisplay" class="standbyClock"></div>');
            showTime();
        }
    }

    function disableStandby() {
        // Only restore the screen when standby actually blanked it. Every click
        // and (on desktop) every mousemove calls this function, so without this
        // guard it unconditionally re-shows #main-view even when standby never
        // activated, clobbering any other feature (e.g. the Theme hub) that
        // legitimately hid #main-view for its own purpose.
        if (standbyActive != true) {
            return;
        }
        standbyTime = 0;
        clearTimeout(clockTimer);
        clockTimer = null;
        $(".screenstandby").remove();
        $("body").removeClass("standby");
        $("#main-view").show();
        $(".container-logo").show();
        $(".navbar-inner").show();
        $(".logo").show();
        $("#copyright").show();
        standbyActive = false;
    }

    window.dzStandby = {
        build: buildStandby,
        disable: disableStandby,
        active: function() { return standbyActive; }
    };
})();
