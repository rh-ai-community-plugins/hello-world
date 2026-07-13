# Build, Push, and Scan Container Images

## Image Details

- **Registry**: `quay.io`
- **Frontend image**: `quay.io/rh-ai-community-plugins/hello-plugin-world`
- **BFF image**: `quay.io/rh-ai-community-plugins/hello-world-bff`

## Prerequisites

- [Podman](https://podman.io/) installed
- [Quay.io](https://quay.io/) account with push access to `rh-ai-community-plugins`

---

## Build and Push

The `scripts/build-push.sh` script builds container images and pushes them to Quay.io.

### Usage

```bash
./scripts/build-push.sh [TARGET] [VERSION]
```

| Argument  | Values                        | Default |
|-----------|-------------------------------|---------|
| `TARGET`  | `frontend`, `bff`, or `all`   | `all`   |
| `VERSION` | Version tag (e.g. `0.5.0`, `0.5.0-rc1`) | Auto-computed from git tags |

When `VERSION` is omitted, the script computes the next minor version from existing git tags and prompts for confirmation before proceeding.

### Examples

```bash
./scripts/build-push.sh                  # Build+push both, auto-version with confirmation
./scripts/build-push.sh frontend         # Build+push frontend only
./scripts/build-push.sh bff 0.5.0-rc1    # Build+push BFF with explicit version
./scripts/build-push.sh all 0.5.0        # Build+push both with explicit version
```

### Manual build and push

To build and push images manually without the script:

```bash
podman login quay.io
podman build -t quay.io/rh-ai-community-plugins/hello-plugin-world:0.5.0 -f Containerfile .
podman push quay.io/rh-ai-community-plugins/hello-plugin-world:0.5.0

podman build -t quay.io/rh-ai-community-plugins/hello-world-bff:0.5.0 -f bff/Containerfile bff/
podman push quay.io/rh-ai-community-plugins/hello-world-bff:0.5.0
```

Buildah and Docker work the same way — substitute `buildah build` or `docker build`/`docker push`.

---

## Vulnerability Scanning

The `scripts/scan-image.sh` script builds container images and scans them for vulnerabilities using [Trivy](https://github.com/aquasecurity/trivy).

### Prerequisites

- [Podman](https://podman.io/) (or Docker)
- [Trivy](https://aquasecurity.github.io/trivy/) — install with `brew install aquasecurity/trivy/trivy`

### Usage

```bash
./scripts/scan-image.sh [TARGET] [SEVERITY]
```

| Argument   | Values                        | Default          |
|------------|-------------------------------|------------------|
| `TARGET`   | `frontend`, `bff`, or `all`   | `all`            |
| `SEVERITY` | Trivy severity levels         | `HIGH,CRITICAL`  |

### Examples

```bash
./scripts/scan-image.sh                  # Scan both frontend and BFF
./scripts/scan-image.sh frontend         # Scan frontend only
./scripts/scan-image.sh bff              # Scan BFF only
./scripts/scan-image.sh all MEDIUM       # Scan both with MEDIUM+ severity
BUILDER=docker ./scripts/scan-image.sh   # Use Docker instead of Podman
```

### Environment Variables

| Variable    | Description                          | Default   |
|-------------|--------------------------------------|-----------|
| `IMAGE_TAG` | Tag applied to built images          | `latest`  |
| `BUILDER`   | Container build tool (`podman`/`docker`) | `podman`  |

---

## CI Workflow

The `.github/workflows/build-push.yml` workflow can build and push both images from CI. It is manually triggered via GitHub's `workflow_dispatch` and requires a `version` input. It uses Buildah for builds and pushes to the same Quay.io registry.
