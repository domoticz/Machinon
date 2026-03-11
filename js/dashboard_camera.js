/* Feature - Display camera preview on dashboard */
theme.features.dashboard_camera_section && cameraPreview(theme.features.dashboard_camera_section.enabled);
var workers = [];

function cameraPreview(section) {
    if ($("#dashcontent").length == 0) {
        if($('body.onMobile').length > 0) return;
        setTimeout(cameraPreview, 50, section);
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
                            html += "<td id='name' class='name'>" + cam.Name + "</td>";
                            html += "</tr></tbody></table>";
                            html += "</div></div>";
                            refreshCamera(camId);
                        }
                    });
                    if (activeCam) {
                        html += "</div></section>";
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
            camId = $(this).attr("href").split(/\'/)[3];
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
