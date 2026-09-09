#!/usr/bin/env bash
# ==============================================================================
# Khatt Production Deployment Script
# 
# Usage:
#   First-time or continuous deployment:
#     sudo ./deploy/deploy.sh
#   Or run via curl:
#     curl -fsSL https://raw.githubusercontent.com/mohamadtsn/khatt/main/deploy/deploy.sh | sudo bash
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Configuration (Override via environment variables if desired)
# ------------------------------------------------------------------------------
APP_NAME="${APP_NAME:-khatt}"
REPO_URL="${REPO_URL:-https://github.com/mohamadtsn/khatt.git}"
BRANCH="${BRANCH:-main}"
DEFAULT_SOURCE_DIR="/opt/${APP_NAME}"
WEB_ROOT="${WEB_ROOT:-/var/www/${APP_NAME}}"
NGINX_AVAILABLE="/etc/nginx/sites-available/${APP_NAME}.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/${APP_NAME}.conf"

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

# ------------------------------------------------------------------------------
# 1. Privilege Check
# ------------------------------------------------------------------------------
if [[ $EUID -ne 0 ]]; then
    log_warn "This script requires superuser privileges to write to ${WEB_ROOT} and configure Nginx."
    log_warn "Rerunning with sudo..."
    exec sudo -E bash "$0" "$@"
fi

# ------------------------------------------------------------------------------
# 2. Dependency Verification
# ------------------------------------------------------------------------------
log_info "Checking prerequisites..."

for cmd in git node npm nginx; do
    if ! command -v "$cmd" &>/dev/null; then
        log_error "Missing required command: '$cmd'"
        if [[ "$cmd" == "node" || "$cmd" == "npm" ]]; then
            echo -e "To install Node.js 22 LTS on Ubuntu/Debian:\n" \
                    "  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -\n" \
                    "  apt-get install -y nodejs\n"
        elif [[ "$cmd" == "nginx" ]]; then
            echo -e "To install Nginx on Ubuntu/Debian:\n" \
                    "  apt-get update && apt-get install -y nginx rsync\n"
        fi
        exit 1
    fi
done

NODE_VERSION=$(node -v | tr -d 'v' | cut -d'.' -f1)
if [[ "${NODE_VERSION}" -lt 20 ]]; then
    log_warn "Detected Node.js v${NODE_VERSION}. Node.js 22 or higher is strongly recommended."
fi

# ------------------------------------------------------------------------------
# 3. Source Repository Setup (First-time clone or Pull latest)
# ------------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURRENT_GIT_ROOT=""
if git rev-parse --show-toplevel &>/dev/null; then
    CURRENT_GIT_ROOT="$(git rev-parse --show-toplevel)"
fi

if [[ -n "${CURRENT_GIT_ROOT}" && -f "${CURRENT_GIT_ROOT}/package.json" ]]; then
    SOURCE_DIR="${CURRENT_GIT_ROOT}"
    log_info "Running from existing local repository at: ${SOURCE_DIR}"
    cd "${SOURCE_DIR}"
    if git remote get-url origin &>/dev/null; then
        log_info "Fetching latest changes from origin/${BRANCH}..."
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

log_success "Source directory ready at: $(git rev-parse --short HEAD)"

# ------------------------------------------------------------------------------
# 4. Dependency Installation & Production Build
# ------------------------------------------------------------------------------
log_info "Installing dependencies..."
if [[ -f "package-lock.json" ]]; then
    npm ci --prefer-offline --no-audit --no-fund
else
    npm install --no-audit --no-fund
fi

log_info "Building static export (output to out/)..."
npm run build

if [[ ! -f "out/index.html" ]]; then
    log_error "Build failed: out/index.html not found."
    exit 1
fi

log_success "Production build completed successfully."

# ------------------------------------------------------------------------------
# 5. Deploy to Web Root
# ------------------------------------------------------------------------------
log_info "Syncing static files to ${WEB_ROOT}..."
mkdir -p "${WEB_ROOT}"

if command -v rsync &>/dev/null; then
    rsync -av --delete out/ "${WEB_ROOT}/"
else
    log_warn "rsync not found, falling back to cp..."
    rm -rf "${WEB_ROOT:?}"/*
    cp -r out/* "${WEB_ROOT}/"
fi

# Set proper ownership and permissions
if id -u www-data &>/dev/null; then
    chown -R www-data:www-data "${WEB_ROOT}"
fi
chmod -R 755 "${WEB_ROOT}"

log_success "Files successfully placed in ${WEB_ROOT}."

# ------------------------------------------------------------------------------
# 6. Nginx Configuration
# ------------------------------------------------------------------------------
NGINX_CONF_TEMPLATE="${SOURCE_DIR}/deploy/nginx.conf"

if [[ -f "${NGINX_CONF_TEMPLATE}" ]]; then
    if [[ ! -f "${NGINX_AVAILABLE}" ]]; then
        log_info "First-time Nginx setup: installing ${NGINX_AVAILABLE}..."
        cp "${NGINX_CONF_TEMPLATE}" "${NGINX_AVAILABLE}"
    else
        log_info "Nginx site configuration exists at ${NGINX_AVAILABLE} (preserving your custom edits)."
    fi

    # Ensure symlink in sites-enabled exists
    if [[ ! -L "${NGINX_ENABLED}" && -d "/etc/nginx/sites-enabled" ]]; then
        log_info "Enabling Nginx site..."
        ln -sf "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
    fi

    # Validate and reload Nginx
    log_info "Testing Nginx configuration syntax..."
    nginx -t

    log_info "Reloading Nginx service..."
    if command -v systemctl &>/dev/null; then
        systemctl reload nginx
    else
        service nginx reload
    fi
    log_success "Nginx reloaded successfully."
else
    log_warn "Template ${NGINX_CONF_TEMPLATE} not found. Skipping automated Nginx config."
fi

# ------------------------------------------------------------------------------
# 7. Summary
# ------------------------------------------------------------------------------
echo -e "\n${C_GREEN}${C_BOLD}======================================================${C_RESET}"
echo -e "${C_GREEN}${C_BOLD} ✔ Deployment completed successfully!${C_RESET}"
echo -e "${C_GREEN}${C_BOLD}======================================================${C_RESET}"
echo -e "Web Root:       ${C_BOLD}${WEB_ROOT}${C_RESET}"
echo -e "Nginx Config:   ${C_BOLD}${NGINX_AVAILABLE}${C_RESET}"
echo -e "\n${C_YELLOW}Next steps:${C_RESET}"
echo -e "1. Set your domain name in Nginx:"
echo -e "   Edit: ${C_BOLD}sudo nano ${NGINX_AVAILABLE}${C_RESET} and change ${C_BOLD}server_name _;${C_RESET} to your actual domain."
echo -e "   Then test & reload: ${C_BOLD}sudo nginx -t && sudo systemctl reload nginx${C_RESET}"
echo -e "\n2. Optional: Enable free SSL via Certbot:"
echo -e "   ${C_BOLD}sudo certbot --nginx -d your-domain.com${C_RESET}\n"
