# WidiAI Architecture and Implementation Guide

This document is the comprehensive context for AI agents and contributors. It describes how the repository is structured, how the frontend and backend interact, how configuration is resolved, and how the project is deployed and operated.

The primary frontend target is the vanilla JavaScript app under frontend/static. The React/Vite app under Figma/ is out of scope for implementation work unless explicitly requested.

## Repository Layout

- backend/
  - main.py: FastAPI entry point and API routes.
  - custom_transcriber.py: custom model implementation.
- frontend/
  - templates/index.html: HTML entry point that bootstraps the app.
  - static/: JS, CSS, icons, soundfonts, env.js.
- scripts/
  - install_windows.ps1, install_linux.sh, install_mac.sh: backend-only setup helpers.
  - generate_frontend_env.py: builds env.js from .env.frontend.
- .github/workflows/deploy-pages.yml: GitHub Pages build and deploy pipeline.
- Dockerfile, docker-compose.yml: backend containerization.
- docs/ai-context.md: this guide.

## System Overview

### Frontend
- Pure HTML/CSS/ES6 (no framework).
- Entry point: frontend/templates/index.html.
- Core app module: frontend/static/widi_app.js.
- Transcription flow: frontend/static/transcription.js.
- Local persistence: IndexedDB for audio blobs, localStorage for settings.
- Runtime configuration: runtime-config.json (GitHub Pages) or env.js (local).

### Backend
- FastAPI app in backend/main.py.
- API-only: no static file hosting.
- Primary endpoint: POST /transcribe.
- Health endpoint: GET / -> {"status": "ok"}.
- Transcription engines:
  - transkun (CLI invocation).
  - onsets_and_frames (custom PyTorch model).

## Frontend Boot and Configuration Flow

### Boot Sequence
1. index.html loads runtime-config.json (if present) into window.__WIDI_RUNTIME__.
2. index.html loads env.js (optional local config).
3. The app initializes and resolves the API base URL.

### API URL Resolution Order
1. User override (localStorage: widi.apiUrl).
2. Runtime config (window.__WIDI_RUNTIME__.apiBaseUrl).
3. env.js (window.__WIDI_ENV__.API_URL).
4. Default fallback (window.location.origin or http://localhost:8000 in transcription.js).

### Settings UI
- Includes an API URL input and "Test connection" button.
- Test connection calls GET / on the configured API endpoint.
- Any user-provided URL is normalized and stored in localStorage.

### Frontend Storage
- IndexedDB: audio blobs and history.
- localStorage:
  - widi.apiUrl: API override.
  - widi.selectedModel: model choice.
  - widi.settings.v1: UI settings.
  - widi.uiLanguage: UI language.

## Backend Implementation Details

### API Contract
- GET / -> 200 OK, {"status": "ok"}
- POST /transcribe -> returns audio/midi file

### POST /transcribe Request
- multipart/form-data:
  - audio: File (wav, mp3, flac, ogg, m4a, webm)
  - model: transkun | onsets_and_frames
- JSON payload (alternative):
  - audio_base64 or audio
  - model
  - filename (optional)

### POST /transcribe Response
- 200 OK
- Content-Type: audio/midi
- Content-Disposition: attachment; filename=transcription_<model>.mid

### Limits and Validation
- Max size: 25 MB (MAX_AUDIO_BYTES)
- Model validation: only transkun or onsets_and_frames
- Allowed file suffixes: wav, mp3, flac, ogg, m4a, webm

### Execution Path
- Audio payload is written to a temp directory.
- transkun runs via subprocess; custom model runs in a threadpool.
- MIDI output is streamed back as a response.
- Temp directory is deleted automatically.

## CORS and Environment Variables

### CORS
Backend CORS is controlled by WIDI_ALLOWED_ORIGINS:

WIDI_ALLOWED_ORIGINS="https://<user>.github.io/<repo>,http://localhost:8001"

If not set, defaults to:
- http://localhost:8001
- http://127.0.0.1:8001

### Model Configuration
- OWN_MODEL_CHECKPOINT
- OWN_MODEL_CHECKPOINT_REPO
- OWN_MODEL_CHECKPOINT_FILE
- OWN_MODEL_CHECKPOINT_REVISION
- OWN_MODEL_CHECKPOINT_CACHE_DIR
- HF_TOKEN / HUGGINGFACE_HUB_TOKEN

## Deployment Flows

### GitHub Pages (Frontend)
- Workflow: .github/workflows/deploy-pages.yml
- Builds static dist/ from frontend/static + frontend/templates.
- Writes dist/static/runtime-config.json with apiBaseUrl.
- Uses Actions variable WIDI_API_URL (defaults to https://widiai.onrender.com).

### Render (Backend)
- Build step should install system deps (ffmpeg, portaudio, libsndfile).
- Start command: uvicorn backend.main:app --host 0.0.0.0 --port 8000
- Set WIDI_ALLOWED_ORIGINS to the GitHub Pages URL.

## Local Development

### Backend
1. Run install script for your OS.
2. Activate venv.
3. Start uvicorn on port 8000.

### Frontend
- Serve frontend/ as static files on port 8001.
- Open templates/index.html in the browser.
- Set API URL in Settings to http://localhost:8000 (or generate env.js).

### Optional env.js
- scripts/generate_frontend_env.py reads .env.frontend
- Produces frontend/static/env.js with window.__WIDI_ENV__

## Install Scripts (Backend Only)

Scripts are designed for local dev and do not run on Render:
- scripts/install_windows.ps1
- scripts/install_linux.sh
- scripts/install_mac.sh

Key options:
- --skip-system-deps
- --generate-frontend-env
- --api-url (used with --generate-frontend-env)
- --skip-transkun-check

## Docker

- Dockerfile builds an API-only backend container.
- docker-compose.yml runs the backend with hot reload and mounts backend/.
- Hugging Face cache is stored in a named volume.

## Common Issues

- Python 3.13 may break transkun/audioop; prefer 3.8-3.12.
- If transkun is missing, install it in the active environment.
- If the frontend cannot connect, verify WIDI_ALLOWED_ORIGINS and runtime-config.json.

## Out of Scope

- React/Vite app under Figma/.
- Major UI redesign.
- New transcription models beyond the current two.

## Implementation Checklist for AI Agents

1. Confirm backend is API-only (no static hosting) and GET / returns health JSON.
2. Ensure runtime-config.json is loaded before app init and API URL resolution prefers it.
3. Verify GitHub Pages workflow writes runtime-config.json with production API URL.
4. Ensure CORS is configured via WIDI_ALLOWED_ORIGINS in deployment.
5. Validate local install scripts remain backend-only and optional env.js generation is explicit.
6. Keep README instructions aligned with deployment and local workflows.
