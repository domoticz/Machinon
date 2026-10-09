#!/usr/bin/env bash
# Make the repository's labels match the list below, which is the source of truth, and
# make sure the standing milestones exist.
#
#   .github/sync-labels.sh            create or update every listed label
#   .github/sync-labels.sh --prune    also delete labels that are not listed
#
# What an issue is (Bug, Feature, Task) is its issue type, set by the issue forms; the
# bug and enhancement labels mirror it. Other labels say what an issue is about or what
# it waits on. When it ships is its milestone. A release renames "Next" to its version
# and closes it; scripts/roll-milestone.sh then reruns this script to open a fresh one.
# Without --prune an unlisted label is only reported: deleting one strips it from every
# issue that carries it.
#
# Dependabot applies dependencies, python and github_actions to its pull requests and
# recreates them if missing, so they are listed to survive --prune. The icon request
# form applies "icons"; GitHub silently drops a form label that does not exist.
#
# needs-domoticz is a state, removed once Domoticz has moved; from-domoticz is a
# permanent record of where a problem came from. An issue can carry both.
# javascript and php are retired Dependabot labels kept on the pull requests of the
# pre-v2.0.0 code base; they are listed so --prune never strips that history.
#
# The shared labels keep the names and colours of the maintainer's other repositories.

set -euo pipefail

REPO="${REPO:-domoticz/Machinon}"

# name|colour|description
LABELS="$(cat <<'EOF'
bug|d73a4a|Something isn't working
enhancement|a2eeef|New feature or request
documentation|0075ca|Improvements or additions to documentation
icons|c2e0c6|Device icons and the icon pack
needs-info|fbca04|Waiting on the reporter for details
needs-domoticz|5319e7|Waiting on Domoticz itself: a change or release of Domoticz
from-domoticz|d4c5f9|Caused by a change or defect in Domoticz itself; the theme adapts or works around it
question|d876e3|Further information is requested
duplicate|cfd3d7|This issue or pull request already exists
invalid|e4e669|This doesn't seem right
wontfix|ffffff|This will not be worked on
good first issue|7057ff|Good for newcomers
help wanted|008672|Extra attention is needed
dependencies|0366d6|Pull requests that update a dependency file
python|2b67c6|Pull requests that update python code
github_actions|000000|Pull requests that update GitHub Actions code
javascript|168700|Historical: Dependabot npm updates from before v2.0.0
php|45229e|Historical: Dependabot composer updates from before v2.0.0
EOF
)"

# title|description
MILESTONES="$(cat <<'EOF'
Next|Planned for the next release; renamed to its version when it ships.
Later|Accepted, not yet planned for a release.
EOF
)"

prune=false
case "${1:-}" in
    "") ;;
    --prune) prune=true ;;
    *) echo "usage: sync-labels.sh [--prune]" >&2; exit 2 ;;
esac

while IFS='|' read -r name color description; do
    gh label create "$name" --repo "$REPO" --color "$color" --description "$description" --force >/dev/null
    echo "ok       $name"
done <<< "$LABELS"

listed="$(cut -d'|' -f1 <<< "$LABELS")"
gh label list --repo "$REPO" --limit 200 --json name --jq '.[].name' | while IFS= read -r name; do
    grep -qxF "$name" <<< "$listed" && continue
    if $prune; then
        gh label delete "$name" --repo "$REPO" --yes >/dev/null
        echo "deleted  $name"
    else
        echo "unlisted $name (kept; --prune deletes it)"
    fi
done

# Every release leaves a closed milestone behind, so read all pages: a "Next" past
# the first page would otherwise look missing and fail as a duplicate title.
existing="$(gh api --paginate "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title')"
while IFS='|' read -r title description; do
    if grep -qxF "$title" <<< "$existing"; then
        echo "ok       milestone $title"
    else
        gh api "repos/$REPO/milestones" -f title="$title" -f description="$description" >/dev/null
        echo "created  milestone $title"
    fi
done <<< "$MILESTONES"
