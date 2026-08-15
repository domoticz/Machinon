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
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-8081}"

rm -rf build build-preview
mkdocs build -d build/docs
cp -r site/* build/
cp -r fonts build/fonts
touch build/.nojekyll

# Serve build/ under a /Machinon/ prefix without copying the tree twice.
mkdir -p build-preview
ln -sfn ../build build-preview/Machinon

echo "Serving http://127.0.0.1:${PORT}/Machinon/  (Ctrl-C to stop)"
cd build-preview
exec python3 -m http.server "$PORT" --bind 127.0.0.1
