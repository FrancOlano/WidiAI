#!/usr/bin/env bash
set -euo pipefail

API_URL="http://localhost:8000"
VENV_DIR=".venv"
SKIP_SYSTEM_DEPS=0
GENERATE_FRONTEND_ENV=0
SKIP_FRONTEND_ENV=0
SKIP_TRANSKUN_CHECK=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --venv)
            VENV_DIR="$2"
            shift 2
            ;;
        --skip-system-deps)
            SKIP_SYSTEM_DEPS=1
            shift
            ;;
        --generate-frontend-env)
            GENERATE_FRONTEND_ENV=1
            shift
            ;;
        --skip-frontend-env)
            SKIP_FRONTEND_ENV=1
            shift
            ;;
        --skip-transkun-check)
            SKIP_TRANSKUN_CHECK=1
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--api-url URL] [--venv DIR] [--skip-system-deps] [--generate-frontend-env] [--skip-frontend-env] [--skip-transkun-check]"
            exit 0
            ;;
        *)
            echo "Unknown argument: $1"
            exit 1
            ;;
    esac
 done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

log() {
    echo "[WidiAI] $1"
}

install_system_deps() {
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update
        sudo apt-get install -y ffmpeg portaudio19-dev libsndfile1
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y ffmpeg portaudio-devel libsndfile
    elif command -v pacman >/dev/null 2>&1; then
        sudo pacman -Syu --noconfirm ffmpeg portaudio libsndfile
    else
        echo "Unsupported package manager. Install ffmpeg, portaudio, and libsndfile manually."
        exit 1
    fi
}

if [[ ${SKIP_SYSTEM_DEPS} -eq 0 ]]; then
    log "Installing system dependencies"
    install_system_deps
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 not found. Install Python 3.8+ and rerun."
    exit 1
fi

if ! python3 -m pip --version >/dev/null 2>&1; then
    echo "pip not found. Install pip for Python 3 and rerun."
    exit 1
fi

PY_VERSION_RAW="$(python3 --version 2>&1)"
if [[ ! $PY_VERSION_RAW =~ ([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
    echo "Unable to parse Python version: $PY_VERSION_RAW"
    exit 1
fi
PY_MAJOR="${BASH_REMATCH[1]}"
PY_MINOR="${BASH_REMATCH[2]}"

if [[ $PY_MAJOR -lt 3 || ( $PY_MAJOR -eq 3 && $PY_MINOR -lt 8 ) ]]; then
    echo "Python 3.8+ required. Found: $PY_VERSION_RAW"
    exit 1
fi
if [[ $PY_MAJOR -eq 3 && $PY_MINOR -ge 13 ]]; then
    echo "Warning: Python 3.13+ may break transkun/audioop. Use 3.8-3.12 if needed."
fi

if ! python3 -c "import venv" >/dev/null 2>&1; then
    echo "Python venv module not available. Install python3-venv and rerun."
    exit 1
fi

VENV_PATH="${REPO_ROOT}/${VENV_DIR}"
if [[ ! -d "${VENV_PATH}" ]]; then
    log "Creating virtual environment at ${VENV_PATH}"
    python3 -m venv "${VENV_PATH}"
fi

VENV_PY="${VENV_PATH}/bin/python"
if [[ ! -x "${VENV_PY}" ]]; then
    echo "Virtual environment python not found at ${VENV_PY}"
    exit 1
fi

log "Upgrading pip"
"${VENV_PY}" -m pip install --upgrade pip

log "Installing Python dependencies"
"${VENV_PY}" -m pip install -r "${REPO_ROOT}/requirements.txt"

if [[ ${SKIP_TRANSKUN_CHECK} -eq 0 ]]; then
    if [[ ! -x "${VENV_PATH}/bin/transkun" ]]; then
        echo "Warning: transkun executable not found in venv. Verify installation if transcription fails."
    fi
fi

SHOULD_GENERATE_FRONTEND_ENV=0
if [[ ${GENERATE_FRONTEND_ENV} -eq 1 && ${SKIP_FRONTEND_ENV} -eq 0 ]]; then
    SHOULD_GENERATE_FRONTEND_ENV=1
fi

if [[ ${SHOULD_GENERATE_FRONTEND_ENV} -eq 1 ]]; then
    ENV_FILE="${REPO_ROOT}/.env.frontend"

    if [[ -n "${API_URL}" ]]; then
        if [[ -f "${ENV_FILE}" ]]; then
            if grep -q "^WIDI_API_URL=" "${ENV_FILE}"; then
                sed -i "s|^WIDI_API_URL=.*|WIDI_API_URL=${API_URL}|" "${ENV_FILE}"
            else
                echo "WIDI_API_URL=${API_URL}" >> "${ENV_FILE}"
            fi
        else
            echo "WIDI_API_URL=${API_URL}" > "${ENV_FILE}"
        fi
    fi

    log "Generating frontend env.js"
    "${VENV_PY}" "${REPO_ROOT}/scripts/generate_frontend_env.py"
fi

log "Done. Activate the venv and run: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"
