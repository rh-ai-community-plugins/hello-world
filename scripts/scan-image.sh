#!/usr/bin/env bash
set -euo pipefail

# Configuration
IMAGE_NAME="${IMAGE_NAME:-hello-plugin-world}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
BUILDER="${BUILDER:-podman}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    local missing=0

    if ! command -v "${BUILDER}" &> /dev/null; then
        log_error "${BUILDER} is not installed or not in PATH"
        missing=1
    fi

    if ! command -v trivy &> /dev/null; then
        log_error "trivy is not installed or not in PATH"
        log_info "Install with: brew install aquasecurity/trivy/trivy"
        missing=1
    fi

    if [[ ! -f "Containerfile" ]] && [[ ! -f "Dockerfile" ]]; then
        log_error "No Containerfile or Dockerfile found in current directory"
        missing=1
    fi

    if [[ ${missing} -eq 1 ]]; then
        exit 1
    fi
}

# Build the container image
build_image() {
    log_info "Building image: ${FULL_IMAGE}"
    ${BUILDER} build -t "${FULL_IMAGE}" .
    log_success "Image built successfully: ${FULL_IMAGE}"
}

# Scan the image for vulnerabilities
scan_image() {
    log_info "Scanning image: ${FULL_IMAGE}"

    local severity="${1:-HIGH,CRITICAL}"
    trivy image --severity "${severity}" --format table "${FULL_IMAGE}"

    local exit_code=$?
    if [[ ${exit_code} -eq 0 ]]; then
        log_success "No ${severity} vulnerabilities found."
    else
        log_error "Vulnerabilities detected (exit code: ${exit_code})"
    fi

    return ${exit_code}
}

# Main
main() {
    local severity="${1:-HIGH,CRITICAL}"

    echo "============================================"
    echo "  Container Image Build & Vulnerability Scan"
    echo "============================================"
    echo ""
    log_info "Image: ${FULL_IMAGE}"
    log_info "Builder: ${BUILDER}"
    log_info "Severity filter: ${severity}"
    echo ""

    check_prerequisites
    build_image
    echo ""
    scan_image "${severity}"
}

main "$@"
