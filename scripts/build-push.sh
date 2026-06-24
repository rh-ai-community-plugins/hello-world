#!/usr/bin/env bash
set -euo pipefail

# Configuration
IMAGE="quay.io/rh-ai-community-plugins/hello-plugin-world"
CONTAINERFILE="Containerfile"
DEFAULT_VERSION="0.1.0"

# Get the next semantic version tag
get_next_version() {
  local max_version="0.0.0"

  # Check remote tags (macOS compatible - no -P flag)
  local remote_tags
  remote_tags=$(git ls-remote --tags origin 2>/dev/null | sed -nE 's|.*/(v?[0-9]+\.[0-9]+\.[0-9]+)$|\1|p' || true)

  if [[ -n "$remote_tags" ]]; then
    while IFS= read -r tag; do
      # Strip leading 'v' if present
      tag="${tag#v}"
      local major minor patch
      IFS='.' read -r major minor patch <<< "$tag"
      local max_major max_minor max_patch
      IFS='.' read -r max_major max_minor max_patch <<< "$max_version"

      if [[ "$major" -gt "$max_major" ]] || \
         [[ "$major" -eq "$max_major" && "$minor" -gt "$max_minor" ]] || \
         [[ "$major" -eq "$max_major" && "$minor" -eq "$max_minor" && "$patch" -gt "$max_patch" ]]; then
        max_version="$tag"
      fi
    done <<< "$remote_tags"
  fi

  # Also check local tags
  local local_tags
  local_tags=$(git tag -l 'v?[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || true)
  if [[ -n "$local_tags" ]]; then
    while IFS= read -r tag; do
      tag="${tag#v}"
      local major minor patch
      IFS='.' read -r major minor patch <<< "$tag"
      local max_major max_minor max_patch
      IFS='.' read -r max_major max_minor max_patch <<< "$max_version"

      if [[ "$major" -gt "$max_major" ]] || \
         [[ "$major" -eq "$max_major" && "$minor" -gt "$max_minor" ]] || \
         [[ "$major" -eq "$max_major" && "$minor" -eq "$max_minor" && "$patch" -gt "$max_patch" ]]; then
        max_version="$tag"
      fi
    done <<< "$local_tags"
  fi

  # Increment minor version
  local major minor patch
  IFS='.' read -r major minor patch <<< "$max_version"
  echo "$major.$((minor + 1)).0"
}

# Determine the version to use
if [[ $# -gt 0 ]]; then
  VERSION="$1"
else
  VERSION=$(get_next_version)
fi

FULL_IMAGE="${IMAGE}:${VERSION}"

# Login to Quay.io
echo "Logging in to quay.io..."
podman login quay.io

echo "Building image with tag: ${FULL_IMAGE}"

# Build the image
podman build -t "${FULL_IMAGE}" -f "${CONTAINERFILE}" .

# Push the image
echo "Pushing image to ${FULL_IMAGE}..."
podman push "${FULL_IMAGE}"

# Create and push a local git tag (with 'v' prefix for semver)
echo "Creating local tag v${VERSION}..."
git tag "v${VERSION}"

echo "Pushing tag v${VERSION} to origin..."
git push origin "v${VERSION}"

echo ""
echo "Done! Image pushed to: ${FULL_IMAGE}"
echo "Tag 'v${VERSION}' pushed to origin."
