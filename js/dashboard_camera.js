var workers = [];
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
if (section === true) dzFetchCameras();
whenElementRenders("dashboard-cameras", "#dashcontent > section", function() {
if (location.hash != "#/Dashboard") return;
if (section !== true) {
dzCameraCardPreviews();
return;
}
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
html += "<td id='name' class='name'>" + $("<span>").text(cam.Name).html() + "</td>";
html += "</tr></tbody></table>";
html += "</div></div>";
});
html += "</div></section>";
$first.before(html);
$("#dashCameras").attr("data-cams", signature);
$("#dashCameras tr.with-cam-preview").on("click", function(e) {
ShowCameraLiveStream($(this).children("td#name").text(), $(this).attr("data-cam"));
});
list.forEach(function(cam) { refreshCamera(cam.idx); });
$("#dashCameras").i18n();
if (typeof dzFilterCameras === "function") {
dzFilterCameras($("#searchInput").val() || "");
}
}
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
