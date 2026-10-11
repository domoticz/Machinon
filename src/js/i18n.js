function dzDeepMerge(base, overlay) {
var out = {};
Object.keys(base).forEach(function (k) { out[k] = base[k]; });
Object.keys(overlay || {}).forEach(function (k) {
var b = out[k];
var o = overlay[k];
var mergeable = b && o && typeof b === "object" && typeof o === "object"
&& !Array.isArray(b) && !Array.isArray(o);
out[k] = mergeable ? dzDeepMerge(b, o) : o;
});
return out;
}
function dzT(path, params) {
var node = (typeof language !== "undefined") ? language : null;
var parts = path.split(".");
for (var i = 0; i < parts.length && node !== null && node !== undefined; i++) {
node = node[parts[i]];
}
if (typeof node !== "string") {
console.warn("machinon_i18n", "missing_key", path);
node = parts[parts.length - 1];
}
if (params) {
node = node.replace(/\{(\w+)\}/g, function (m, k) {
return Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : m;
});
}
return node;
}
