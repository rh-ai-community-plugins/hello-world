# Build and Push Container Image to Quay.io

## Image Details

- **Registry**: `quay.io`
- **Frontend image**: `quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0`
- **BFF image**: `quay.io/rh-ai-community-plugins/hello-world-bff:0.4.0`

## Prerequisites

- [Podman](https://podman.io/) installed (recommended on macOS)
- [Quay.io](https://quay.io/) account with push access to `rh-ai-community-plugins`

---

## Quick Start (Podman - Recommended)

### 1. Login to Quay.io

```bash
podman login quay.io
```

Enter your Quay.io username and password (or robot account token).

### 2. Build the image

```bash
podman build -t quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0 -f Containerfile .
```

### 3. Push the image to Quay.io

```bash
podman push quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0
```

---

## Alternative: Buildah (Recommended for OpenShift)

### 1. Login to Quay.io

```bash
podman login quay.io
```

### 2. Build the image

```bash
buildah build -t quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0 -f Containerfile .
```

### 3. Push the image to Quay.io

```bash
buildah push quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0 docker://quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0
```

---

## Alternative: Docker

### 1. Login to Quay.io

```bash
docker login quay.io
```

### 2. Build the image

```bash
docker build -t quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0 -f Containerfile .
```

### 3. Push the image

```bash
docker push quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0
```

---

## Verify the Push

After pushing, verify the image is available on Quay.io:

```bash
# Check image details locally
podman inspect quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0

# Or visit https://quay.io/rh-ai-community-plugins/hello-plugin-world in your browser
```

---

## One-Liner (Build + Push)

```bash
podman login quay.io && podman build -t quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0 -f Containerfile . && podman push quay.io/rh-ai-community-plugins/hello-plugin-world:0.4.0
```

---

## Building the BFF Image

The BFF service has its own Containerfile at `bff/Containerfile`. Build it from the repo root:

```bash
podman build -t quay.io/rh-ai-community-plugins/hello-world-bff:0.4.0 -f bff/Containerfile bff/
podman push quay.io/rh-ai-community-plugins/hello-world-bff:0.4.0
```

---

## Automated Build, Push, and Tag

The `scripts/build-push.sh` script builds container images, pushes them to Quay.io, and creates a git version tag in one step.

### Usage

```bash
./scripts/build-push.sh [TARGET] [VERSION]
```

| Argument  | Values                        | Default |
|-----------|-------------------------------|---------|
| `TARGET`  | `frontend`, `bff`, or `all`   | `all`   |
| `VERSION` | Semver version (e.g. `0.5.0`) | Auto-computed from git tags |

When `VERSION` is omitted, the script computes the next minor version from existing git tags and prompts for confirmation before proceeding.

### Examples

```bash
./scripts/build-push.sh                  # Build+push both, auto-version with confirmation
./scripts/build-push.sh frontend         # Build+push frontend only
./scripts/build-push.sh bff 0.5.0        # Build+push BFF with explicit version
./scripts/build-push.sh all 0.5.0        # Build+push both with explicit version
```

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
