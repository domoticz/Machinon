#!/usr/bin/env bash
# Assemble the published site exactly as .github/workflows/deploy-docs.yml does,
# then serve it at the SAME sub-path GitHub Pages uses.
#
# The /Machinon/ sub-path is the point. Pages serves project sites under the
# repo name, so an absolute /assets/x.png reference works when served from the
# root and 404s in production. Serving under the real prefix catches that here.
#
#   http://127.0.0.1:8081/Machinon/        landing page
#   http://127.0.0.1:8081/Machinon/docs/   manual
#
# Port 8081 because 8080 is the Domoticz test container.
#
# Binds to loopback by default, so a preview of unreleased work is not exposed
# to the network by simply running this script. To review from another machine
# on the LAN, opt in explicitly:
#
#   HOST=0.0.0.0 scripts/serve-site.sh
#
# python3's http.server is a development server with no access control, so keep
# the opt-in deliberate and do not make 0.0.0.0 the default.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-8081}"
HOST="${HOST:-127.0.0.1}"

rm -rf build build-preview
mkdocs build -d build/docs
cp -r site/* build/
cp -r fonts build/fonts
# Keep in lockstep with .github/workflows/deploy-docs.yml: this script's whole
# value is assembling the tree the same way, so a preview that passes means
# production passes.
cp -r iconpack build/iconpack
cp -r images build/images
touch build/.nojekyll

# Serve build/ under a /Machinon/ prefix without copying the tree twice.
mkdir -p build-preview
ln -sfn ../build build-preview/Machinon

if [ "$HOST" = "0.0.0.0" ]; then
    echo "Serving on ALL interfaces, port ${PORT}, path /Machinon/  (Ctrl-C to stop)"
    echo "  local:   http://127.0.0.1:${PORT}/Machinon/"
    echo "  network: http://$(hostname):${PORT}/Machinon/"
else
    echo "Serving http://${HOST}:${PORT}/Machinon/  (Ctrl-C to stop)"
fi
cd build-preview
exec python3 -m http.server "$PORT" --bind "$HOST"
