/* Feature - Display camera preview on dashboard */
var workers = [];

/* The camera list, kept across Dashboard visits so a return draws the section
   from it at once, and refreshed on every visit. getcameras_user lists only
   enabled cameras, with idx and name, for any user; getcameras is admin-only
   and also carries every camera's address and credentials. */
var dzCameraList = null;
var dzCameraFetch = null;

function dzFetchCameras() {
    dzCameraFetch = fetch("json.htm?type=command&param=getcameras_user", { credentials: 'include' })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            dzCameraList = (data && data.result) || [];
            return dzCameraList;
        })
        .catch(function(error) {
            console.log("Machinon - camera list fetch failed:", error);
            return null;
        });
    return dzCameraFetch;
}

theme.features.dashboard_camera_section && cameraPreview(theme.features.dashboard_camera_section.enabled);

function cameraPreview(section) {
    /* Fetched now, in parallel with core's own Dashboard requests, so the list
       is usually in hand by the time core draws its first section. */
    if (section === true) dzFetchCameras();
    /* Waits for core's first Dashboard section, not for #dashcontent: on the
       desktop template #dashcontent is static markup, present long before core
       has its devices, so inserting from it put the section on screen after the
       device sections (moving all of them down) and, when the camera list
       arrived first, found no section to insert before and dropped it. A
       MutationObserver callback runs before the browser paints, so a section
       inserted from it appears in the same frame as core's. It stays armed on
       the Dynamic Dashboard, which has no such sections, because a room plan
       opened from there switches to the classic one (core's
       _forceClassicDashboard, app.routes.js) and the section belongs there. */
    whenElementRenders("dashboard-cameras", "#dashcontent > section", function() {
        if (location.hash != "#/Dashboard") return;
        if (section !== true) {
            dzCameraCardPreviews();
            return;
        }
        /* Core's phone Dashboard (body.dashMobile, DashboardDesktopController)
           draws its own compact cards and has no room for a camera row. */
        if ($("body").hasClass("dashMobile")) return;
        if (dzCameraList) dzShowCameraSection(dzCameraList);
        var pending = dzCameraFetch;
        if (!pending) return;
        pending.then(function(list) {
            if (pending !== dzCameraFetch || !list || location.hash != "#/Dashboard") return;
            dzShowCameraSection(list);
        });
    });
}

/* Draws, redraws or removes #dashCameras for a camera list. A list identical to
   the one already drawn is left alone, so the refresh that follows a section
   drawn from the remembered list changes nothing on screen unless cameras were
   added, removed or renamed. */
function dzShowCameraSection(list) {
    var signature = list.map(function(cam) { return cam.idx + ":" + cam.Name; }).join("|");
    var $existing = $("#dashCameras");
    if ($existing.length && $existing.attr("data-cams") === signature) return;
    var $first = $("#dashcontent > section").not("#dashCameras").first();
    $existing.remove();
    if (!list.length || !$first.length) return;

    var compact = $("section.compact").length > 0;
    var html = "<section class='dashCategory" + (compact ? " compact" : "") + "' id='dashCameras'><h2 data-i18n='Cameras'>Cameras:</h2><div class='row divider'>";
    list.forEach(function(cam) {
        var camId = cam.idx;
        html += "<div class='" + (compact ? "span3" : "span4") + " movable ui-draggable ui-draggable-handle ui-droppable' id='cam_" + camId + "'><div class='item'>";
        html += "<table id='itemtablecam' class='itemtablesmall'><tbody><tr class='with-cam-preview' data-cam='" + camId + "'>";
        // Camera names are user data; escape before splicing into markup.
        html += "<td id='name' class='name'>" + $("<span>").text(cam.Name).html() + "</td>";
        html += "</tr></tbody></table>";
        html += "</div></div>";
    });
    html += "</div></section>";
    /* Injected with raw jQuery, never $compile'd: #dashCameras carries no
       ng-scope and never joins the Angular digest the other dashboard
       sections settle on, and its thumbnails arrive later as blob: URLs
       (refreshCamera). The row's height is set by the card grid, so the
       thumbnails arriving does not move anything below it. */
    $first.before(html);
    $("#dashCameras").attr("data-cams", signature);
    $("#dashCameras tr.with-cam-preview").on("click", function(e) {
        ShowCameraLiveStream($(this).children("td#name").text(), $(this).attr("data-cam"));
    });
    list.forEach(function(cam) { refreshCamera(cam.idx); });
    $("#dashCameras").i18n();
    /* The section can arrive after a query has already been restored into
       the search box (core persists the query across navigation). Applying
       the current query here is what keeps a freshly injected camera row
       from being the one part of the dashboard the active query does not
       hold on. */
    if (typeof dzFilterCameras === "function") {
        dzFilterCameras($("#searchInput").val() || "");
    }
}

/* With the section off, cards of devices that link a camera show its preview. */
function dzCameraCardPreviews() {
    $("#bigtext > span > a").each(function() {
        var camId = $(this).attr("href").split(/\'/)[3];
        if ($(this).parents("tr.with-cam-preview").length == 0) {
            $(this).parents("tr").attr("data-cam", camId).addClass("with-cam-preview").on("click", function(e) {
                ShowCameraLiveStream($(this).children("td#name").text(), $(this).attr("data-cam"), $(this).attr("data-cam"));
            });
        }
        refreshCamera(camId);
    });
}

/* One pending refresh per camera. Leaving the Dashboard and coming back
   before the pending timer fires used to start a second self-rescheduling
   chain beside the first, and every later return added another, each
   fetching a snapshot per interval. A new request or a new schedule first
   drops whatever is pending for that camera. */
var cameraTimers = [];

function refreshCamera(camId) {
    clearTimeout(cameraTimers[camId]);
    let workerId = workers[camId];
    if (typeof workerId === "undefined") {
        workerId = new Worker('styles/' + themeFolder +'/js/camera_worker.js');
        workers[camId] = workerId;

        workerId.addEventListener('message', event => {
            const camera = event.data;
            const $row = $("tr[data-cam='" + camera.cameraId + "']");
            /* Revoke previous blob URL to prevent memory leak */
            const prevBg = $row.css("background-image");
            if (prevBg && prevBg.startsWith("url(\"blob:")) {
                URL.revokeObjectURL(prevBg.slice(5, -2));
            }
            const background = URL.createObjectURL(camera.blob);
            $row.css("background-image", "url(" + background + ")");
            clearTimeout(cameraTimers[camera.cameraId]);
            if (location.hash == "#/Dashboard") {
                cameraTimers[camera.cameraId] = setTimeout(refreshCamera, theme.dashboard_camera_refresh*1000, camera.cameraId);
            }
        });
    }
    workerId.postMessage(camId);
}
