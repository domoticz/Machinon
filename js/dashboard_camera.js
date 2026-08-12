/* Feature - Display camera preview on dashboard */
theme.features.dashboard_camera_section && cameraPreview(theme.features.dashboard_camera_section.enabled);
var workers = [];

function cameraPreview(section) {
    if ($("#dashcontent").length == 0) {
        if($('body.onMobile').length > 0) return;
        whenElementRenders("dashcontent", "#dashcontent", function() { cameraPreview(section); });
        return;
    }

    if (section === true) {
        if ($("#dashCameras").length == 0) {
            fetch("json.htm?type=command&param=getcameras", { credentials: 'include' })
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    var compact = $("section.compact").length > 0;
                    var html = "<section class='dashCategory" + (compact ? " compact" : "") + "' id='dashCameras'><h2 data-i18n='Cameras'>Cameras:</h2><div class='row divider'>";
                    var activeCam = false;
                    data.result && data.result.forEach(function(cam){
                        if (cam.Enabled === "true") {
                            activeCam = true;
                            var camId = cam.idx;
                            html += "<div class='" + (compact ? "span3" : "span4") + " movable ui-draggable ui-draggable-handle ui-droppable' id='cam_" + camId + "'><div class='item'>";
                            html += "<table id='itemtablecam' class='itemtablesmall'><tbody><tr class='with-cam-preview' data-cam='" + camId + "'>";
                            // Camera names are user data; escape before splicing into markup.
                            html += "<td id='name' class='name'>" + $("<span>").text(cam.Name).html() + "</td>";
                            html += "</tr></tbody></table>";
                            html += "</div></div>";
                            refreshCamera(camId);
                        }
                    });
                    if (activeCam) {
                        html += "</div></section>";
                        /* Injected with raw jQuery, never $compile'd: #dashCameras carries no
                           ng-scope and never joins the Angular digest the other dashboard
                           sections settle on, and its thumbnails arrive later as blob: URLs
                           (refreshCamera). CONSTRAINT for any geometry measurement or
                           screenshot of a dashboard with cameras: poll for #dashCameras
                           present in the DOM AND its height stable across two consecutive
                           polls before capturing - a plain "page loaded"/networkidle signal
                           does not guarantee the sections below it have stopped shifting. */
                        $("#dashcontent section:first").before(html);
                        $("tr.with-cam-preview").on("click", function(e) {
                            ShowCameraLiveStream($(this).children("td#name").text(), $(this).attr("data-cam"));
                        });
                    }
                    $("#dashCameras").i18n();
                })
                .catch(function(error) {
                    console.log("Machinon - camera list fetch failed:", error);
                });
        }
    } else {
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
}

function refreshCamera(camId) {
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
            if (location.hash == "#/Dashboard") {
                setTimeout(refreshCamera, theme.dashboard_camera_refresh*1000, camId);
            }
        });
    }
    workerId.postMessage(camId);
}
