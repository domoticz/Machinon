self.addEventListener('message', async event => {
const cameraURL = "../../../camsnapshot.jpg?idx=" + event.data + "&t=" + Date.now();
fetch(cameraURL)
.then(function(response) {
if(response.ok) {
response.blob().then(function(blob) {
self.postMessage({
cameraId: event.data,
blob: blob,
})
})
}
})
.catch(function(error) {
console.log("Error fetching " + cameraURL + " --> " + error.message);
});
})
