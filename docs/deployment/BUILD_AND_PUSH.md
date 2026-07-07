# Build and Push Container Image to Quay.io

## Image Details

- **Registry**: `quay.io`
- **Full image name**: `quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0`

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
podman build -t quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0 -f Containerfile .
```

### 3. Push the image to Quay.io

```bash
podman push quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0
```

---

## Alternative: Buildah (Recommended for OpenShift)

### 1. Login to Quay.io

```bash
podman login quay.io
```

### 2. Build the image

```bash
buildah build -t quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0 -f Containerfile .
```

### 3. Push the image to Quay.io

```bash
buildah push quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0 docker://quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0
```

---

## Alternative: Docker

### 1. Login to Quay.io

```bash
docker login quay.io
```

### 2. Build the image

```bash
docker build -t quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0 -f Containerfile .
```

### 3. Push the image

```bash
docker push quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0
```

---

## Verify the Push

After pushing, verify the image is available on Quay.io:

```bash
# Check image details locally
podman inspect quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0

# Or visit https://quay.io/rh-ai-community-plugins/hello-plugin-world in your browser
```

---

## One-Liner (Build + Push)

```bash
podman login quay.io && podman build -t quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0 -f Containerfile . && podman push quay.io/rh-ai-community-plugins/hello-plugin-world:0.1.0
```
