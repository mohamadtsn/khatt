#!/usr/bin/env bash
# ==============================================================================
# Khatt Production Deployment Script
# 
# Supports both:
#   1. Native build (using host Node.js & npm)
#   2. Containerized build (using Docker — no Node.js required on host!)
# 
# Usage:
#   Default (auto-detects Node.js or Docker):
#     sudo ./deploy/deploy.sh
# 
#   Force Docker container build:
#     sudo ./deploy/deploy.sh --docker
# 
#   Force Host native build:
#     sudo ./deploy/deploy.sh --native
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Configuration & Defaults
# ------------------------------------------------------------------------------
APP_NAME="${APP_NAME:-khatt}"
REPO_URL="${REPO_URL:-https://github.com/mohamadtsn/khatt.git}"
BRANCH="${BRANCH:-main}"
DEFAULT_SOURCE_DIR="/opt/${APP_NAME}"
WEB_ROOT="${WEB_ROOT:-/var/www/${APP_NAME}}"
NGINX_AVAILABLE="/etc/nginx/sites-available/${APP_NAME}.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/${APP_NAME}.conf"
BUILD_MODE="${BUILD_MODE:-auto}" # auto | native | docker

# Color helpers
C_RESET='\033[0m'
C_BOLD='\033[1m'
C_GREEN='\033[32m'
C_BLUE='\033[34m'
C_YELLOW='\033[33m'
C_RED='\033[31m'

log_info()    { echo -e "${C_BLUE}${C_BOLD}[INFO]${C_RESET} $*"; }
log_success() { echo -e "${C_GREEN}${C_BOLD}[SUCCESS]${C_RESET} $*"; }
log_warn()    { echo -e "${C_YELLOW}${C_BOLD}[WARN]${C_RESET} $*"; }
log_error()   { echo -e "${C_RED}${C_BOLD}[ERROR]${C_RESET} $*" >&2; }

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --docker)
            BUILD_MODE="docker"
            shift
            ;;
        --native)
            BUILD_MODE="native"
            shift
            ;;
        -h|--help)
            echo "Usage: sudo $0 [--docker|--native]"
            echo "  --docker : Execute build inside Docker container (host doesn't need Node.js)"
            echo "  --native : Execute build directly on host using Node.js & npm"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# ------------------------------------------------------------------------------
# 1. Privilege Check
# ------------------------------------------------------------------------------
if [[ $EUID -ne 0 ]]; then
    log_warn "This script requires superuser privileges to deploy to ${WEB_ROOT} and manage Nginx."
    log_warn "Rerunning with sudo..."
    exec sudo -E bash "$0" "$@"
fi

# ------------------------------------------------------------------------------
# 2. Dependency Verification & Build Mode Decision
# ------------------------------------------------------------------------------
log_info "Checking prerequisites..."

for cmd in git nginx; do
    if ! command -v "$cmd" &>/dev/null; then
        log_error "Missing required core tool: '$cmd'"
        echo -e "Install on Debian/Ubuntu with:\n  apt-get update && apt-get install -y git nginx rsync\n"
        exit 1
    fi
done

# Determine build method
HAS_NODE=false
HAS_DOCKER=false

if command -v node &>/dev/null && command -v npm &>/dev/null; then
    HAS_NODE=true
fi

if command -v docker &>/dev/null; then
    HAS_DOCKER=true
fi

if [[ "${BUILD_MODE}" == "auto" ]]; then
    if [[ "${HAS_NODE}" == "true" ]]; then
        BUILD_MODE="native"
    elif [[ "${HAS_DOCKER}" == "true" ]]; then
        BUILD_MODE="docker"
    else
        log_error "Neither Node.js (with npm) nor Docker is installed on this system."
        echo -e "\nPlease install either:"
        echo -e "  A) Node.js (LTS):\n     curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs"
        echo -e "  B) Docker:\n     curl -fsSL https://get.docker.com | bash\n"
        exit 1
    fi
elif [[ "${BUILD_MODE}" == "docker" && "${HAS_DOCKER}" != "true" ]]; then
    log_error "Docker build was requested but Docker is not installed on this host."
    echo -e "Install Docker with:\n  curl -fsSL https://get.docker.com | bash\n"
    exit 1
elif [[ "${BUILD_MODE}" == "native" && "${HAS_NODE}" != "true" ]]; then
    log_error "Native build was requested but Node.js/npm is not installed on this host."
    echo -e "Install Node.js with:\n  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs\n"
    exit 1
fi

log_info "Selected build engine: ${C_BOLD}${BUILD_MODE}${C_RESET}"

# ------------------------------------------------------------------------------
# 2.5 Server Resource & Swap Verification (Safeguard for 1GB/2GB VPS)
# ------------------------------------------------------------------------------
if command -v free &>/dev/null; then
    TOTAL_MEM_MB=$(free -m | awk '/^Mem:/{print $2}')
    TOTAL_SWAP_MB=$(free -m | awk '/^Swap:/{print $2}')

    # Only create a swapfile if the server has ZERO swap and low physical RAM (<3GB)
    if [[ "${TOTAL_SWAP_MB:-0}" -eq 0 && "${TOTAL_MEM_MB:-4096}" -lt 3072 ]]; then
        log_warn "Zero swap detected on low-memory host (${TOTAL_MEM_MB}MB RAM)."
        log_info "Setting up a 2GB /swapfile to protect build from OOM crash..."
        if [[ ! -f /swapfile ]]; then
            fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
            chmod 600 /swapfile
            mkswap /swapfile 2>/dev/null
            swapon /swapfile 2>/dev/null || true
            log_success "2GB swapfile enabled."
        else
            swapon /swapfile 2>/dev/null || true
        fi
    fi
fi

# ------------------------------------------------------------------------------
# 3. Source Repository Setup (Clone if first time, pull if existing)
# ------------------------------------------------------------------------------
CURRENT_GIT_ROOT=""
if git rev-parse --show-toplevel &>/dev/null; then
    CURRENT_GIT_ROOT="$(git rev-parse --show-toplevel)"
fi

if [[ -n "${CURRENT_GIT_ROOT}" && -f "${CURRENT_GIT_ROOT}/package.json" ]]; then
    SOURCE_DIR="${CURRENT_GIT_ROOT}"
    log_info "Running from existing local repo at: ${SOURCE_DIR}"
    cd "${SOURCE_DIR}"
    if git remote get-url origin &>/dev/null; then
        log_info "Fetching latest commits from origin/${BRANCH}..."
        git fetch origin "${BRANCH}"
        git checkout "${BRANCH}"
        git reset --hard "origin/${BRANCH}"
    fi
elif [[ -d "${DEFAULT_SOURCE_DIR}/.git" ]]; then
    SOURCE_DIR="${DEFAULT_SOURCE_DIR}"
    log_info "Updating repository at: ${SOURCE_DIR}"
    cd "${SOURCE_DIR}"
    git fetch origin "${BRANCH}"
    git checkout "${BRANCH}"
    git reset --hard "origin/${BRANCH}"
else
    SOURCE_DIR="${DEFAULT_SOURCE_DIR}"
    log_info "First-time setup: cloning ${REPO_URL} into ${SOURCE_DIR}..."
    mkdir -p "$(dirname "${SOURCE_DIR}")"
    git clone --depth 1 -b "${BRANCH}" "${REPO_URL}" "${SOURCE_DIR}"
    cd "${SOURCE_DIR}"
fi

log_success "Source repository ready at commit: $(git rev-parse --short HEAD)"

# ------------------------------------------------------------------------------
# 4. Production Build (Native or Containerized)
# ------------------------------------------------------------------------------
if [[ "${BUILD_MODE}" == "native" ]]; then
    log_info "Installing dependencies via npm..."
    if [[ -f "package-lock.json" ]]; then
        npm ci --prefer-offline --no-audit --no-fund
    else
        npm install --no-audit --no-fund
    fi

    log_info "Compiling static export with Next.js..."
    export NEXT_TELEMETRY_DISABLED=1
    export NEXT_CPU_COUNT=1
    export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
    npm run build

elif [[ "${BUILD_MODE}" == "docker" ]]; then
    log_info "Running static export inside Docker build container..."
    export NEXT_TELEMETRY_DISABLED=1
    if command -v docker &>/dev/null && docker compose version &>/dev/null; then
        docker compose run --rm build
    else
        # Direct BuildKit export without needing docker-compose
        DOCKER_BUILDKIT=1 docker build --target exporter --output type=local,dest=out .
    fi
fi

if [[ ! -f "out/index.html" ]]; then
    log_error "Build failed: 'out/index.html' does not exist."
    exit 1
fi

log_success "Build completed successfully."

# ------------------------------------------------------------------------------
# 5. Deploy to Web Root
# ------------------------------------------------------------------------------
log_info "Deploying static assets to ${WEB_ROOT}..."
mkdir -p "${WEB_ROOT}"

if command -v rsync &>/dev/null; then
    rsync -av --delete out/ "${WEB_ROOT}/"
else
    log_warn "rsync not found, falling back to cp..."
    rm -rf "${WEB_ROOT:?}"/*
    cp -r out/* "${WEB_ROOT}/"
fi

if id -u www-data &>/dev/null; then
    chown -R www-data:www-data "${WEB_ROOT}"
fi
chmod -R 755 "${WEB_ROOT}"

log_success "Static export deployed to ${WEB_ROOT}."

# ------------------------------------------------------------------------------
# 6. Host Nginx Configuration & Reload
# ------------------------------------------------------------------------------
NGINX_CONF_TEMPLATE="${SOURCE_DIR}/deploy/nginx.conf"

if [[ -f "${NGINX_CONF_TEMPLATE}" ]]; then
    if [[ ! -f "${NGINX_AVAILABLE}" ]]; then
        log_info "Installing initial Nginx configuration to ${NGINX_AVAILABLE}..."
        cp "${NGINX_CONF_TEMPLATE}" "${NGINX_AVAILABLE}"
    else
        log_info "Existing Nginx config preserved at ${NGINX_AVAILABLE}."
    fi

    if [[ ! -L "${NGINX_ENABLED}" && -d "/etc/nginx/sites-enabled" ]]; then
        log_info "Creating symlink in sites-enabled..."
        ln -sf "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
    fi

    log_info "Testing Nginx configuration syntax..."
    nginx -t

    log_info "Reloading host Nginx..."
    if command -v systemctl &>/dev/null; then
        systemctl reload nginx
    else
        service nginx reload
    fi
    log_success "Host Nginx reloaded successfully."
fi

# ------------------------------------------------------------------------------
# 7. Deployment Summary
# ------------------------------------------------------------------------------
echo -e "\n${C_GREEN}${C_BOLD}======================================================${C_RESET}"
echo -e "${C_GREEN}${C_BOLD} ✔ Khatt successfully deployed! (${BUILD_MODE} mode)${C_RESET}"
echo -e "${C_GREEN}${C_BOLD}======================================================${C_RESET}"
echo -e "Web Root:       ${C_BOLD}${WEB_ROOT}${C_RESET}"
echo -e "Nginx Config:   ${C_BOLD}${NGINX_AVAILABLE}${C_RESET}"
echo -e "\n${C_YELLOW}Next steps:${C_RESET}"
echo -e "1. Set domain in Nginx: ${C_BOLD}sudo nano ${NGINX_AVAILABLE}${C_RESET} (change server_name)"
echo -e "2. Apply changes:       ${C_BOLD}sudo nginx -t && sudo systemctl reload nginx${C_RESET}"
echo -e "3. Optional SSL:        ${C_BOLD}sudo certbot --nginx -d your-domain.com${C_RESET}\n"
