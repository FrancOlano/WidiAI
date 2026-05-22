# WidiAI

WidiAI is a web application that converts piano audio recordings into MIDI files.
It provides a browser-based workflow with a FastAPI backend and two transcription backends: `transkun` and a custom `onsets_and_frames` model.

## Table of Contents

- [WidiAI](#widiai)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Key Features](#key-features)
  - [Architecture](#architecture)
  - [Repository Structure](#repository-structure)
  - [Tech Stack](#tech-stack)
  - [Requirements](#requirements)
  - [Quick Start](#quick-start)
    - [1. Create and activate virtual environment](#1-create-and-activate-virtual-environment)
    - [2. Install dependencies](#2-install-dependencies)
    - [3. Run the app](#3-run-the-app)
    - [4. Open in browser](#4-open-in-browser)
  - [Configuration](#configuration)
  - [Model Setup](#model-setup)
    - [Option A: `transkun` (default)](#option-a-transkun-default)
    - [Option B: `onsets_and_frames` (custom model)](#option-b-onsets_and_frames-custom-model)
  - [API Reference](#api-reference)
  - [Development Workflow](#development-workflow)
  - [Current Limitations](#current-limitations)
  - [Roadmap](#roadmap)
  - [Contributing](#contributing)
  - [License](#license)

## Overview

This repository implements the core WidiAI transcription flow:

1. Upload audio from the browser.
2. Select a transcription model.
3. Convert audio to MIDI.
4. Download and preview the MIDI output.

The implementation is aligned with the project SRS document (`Software Requirements Specification v1`, April 26, 2026), while clearly indicating what is already implemented and what is still pending.

## Key Features

- Single-page web interface hosted separately from the API.
- Recordings and uploads stored in browser IndexedDB (no server-side persistence).
- Audio upload and server-side transcription.
- Two model options:
  - `transkun` (default).
  - `onsets_and_frames` (custom checkpoint-based model).
- Downloadable `.mid` output.
- Basic in-browser MIDI playback controls (play, pause, stop).
- Automatic cleanup of temporary files after response delivery.

## Architecture

- Frontend: Vanilla HTML/CSS/JS (`frontend/templates`, `frontend/static`) served by a separate static host or dev server.
- Backend: FastAPI application in `backend/main.py` (API-only; processes audio in memory and returns MIDI).
- Note: `transkun` runs via CLI and uses short-lived temp files that are deleted immediately after each request.
- Browser storage: audio files are kept in IndexedDB and only sent to the backend on transcription.
- Transcription engines:
  - `transkun` via CLI or Python module execution.
  - Custom PyTorch pipeline in `backend/custom_transcriber.py`.
- Output: Standard MIDI files (`.mid`).

High-level request flow:

1. Client sends `audio` + `model` to `POST /transcribe`.
2. Backend validates request parameters and stores temporary input.
3. Selected transcription backend runs in a background threadpool.
4. MIDI file is returned as a downloadable response.
5. Temporary input/output files are removed.

## Repository Structure

```text
MTL_S104/
|-- backend/
|   |-- __init__.py
|   |-- custom_transcriber.py
|   `-- main.py
|-- frontend/
|   |-- static/
|   |   |-- WidiAI_logo.ico
|   |   |-- audio_selector.js
|   |   |-- midi_menu.js
|   |   |-- model_selector.js
|   |   |-- record.js
|   |   |-- style.css
|   |   `-- transcription.js
|   `-- templates/
|       `-- index.html
|-- midi_outputs/
|-- recordings/
|-- tests/
|-- uploads/
|-- requirements.txt
`-- README.md
```

## Tech Stack

- Python 3.8+
- FastAPI + Uvicorn
- PyTorch
- librosa
- pretty_midi
- transkun
- Frontend playback: Tone.js + @tonejs/midi

## Requirements

- Python 3.8 or newer
- `pip`
- Dependencies listed in [`requirements.txt`](requirements.txt)

## Quick Start

### 1. Create and activate virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Run the backend

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Configure the frontend API URL

Create a `.env.frontend` file (use `.env.frontend.example` as a template) and generate `frontend/static/env.js`:

```bash
cp .env.frontend.example .env.frontend
python scripts/generate_frontend_env.py
```

### 5. Open in browser

- API docs: `http://localhost:8000/docs`
- Serve the frontend separately and point it at the API base URL.

### Install scripts (optional)

Use [scripts/install_windows.ps1](scripts/install_windows.ps1) or [scripts/install_linux.sh](scripts/install_linux.sh) to install dependencies, create a virtual environment, and generate [frontend/static/env.js](frontend/static/env.js).

Windows (PowerShell):

```powershell
./scripts/install_windows.ps1
```

Linux:

```bash
chmod +x ./scripts/install_linux.sh
./scripts/install_linux.sh
```

Common options:

- `--api-url` / `-ApiUrl`: backend URL for `WIDI_API_URL`
- `--venv` / `-VenvDir`: virtual environment directory
- `--skip-system-deps`: skip installing FFmpeg and system packages
- `--skip-frontend-env`: skip generating [frontend/static/env.js](frontend/static/env.js)
- `--skip-transkun-check`: skip validating `transkun` in the venv

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `OWN_MODEL_CHECKPOINT` | No | `./checkpoint_50000.pt` | Local checkpoint path (if present, it is used first). |
| `OWN_MODEL_CHECKPOINT_REPO` | No | `carolinahenao01/WidiAI` | Hugging Face repo id used when local checkpoint is missing. |
| `OWN_MODEL_CHECKPOINT_FILE` | No | `checkpoint_50000.pt` | Checkpoint filename inside the HF repo. |
| `OWN_MODEL_CHECKPOINT_REVISION` | No | `main` | HF branch/tag/commit to download from. |
| `OWN_MODEL_CHECKPOINT_CACHE_DIR` | No | HF default cache | Optional custom cache directory for downloaded checkpoint files. |
| `HF_TOKEN` / `HUGGINGFACE_HUB_TOKEN` | No | unset | Required only if the HF repo is private. |

### Frontend Runtime Configuration

Create `.env.frontend` and generate `frontend/static/env.js` with `scripts/generate_frontend_env.py`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `WIDI_API_URL` | Yes (for deployed frontend) | `http://localhost:8000` | Base URL of the backend API |

Notes:

- If `OWN_MODEL_CHECKPOINT` is missing, backend automatically downloads the checkpoint from Hugging Face and reuses the local cache on next runs.
- `transkun` runs without this variable.

## Model Setup

### Option A: `transkun` (default)

No additional setup is required when `transkun` is installed in the active environment.

### Option B: `onsets_and_frames` (custom model)

No manual checkpoint download is required by default.

By default, backend resolves:

- Repo: `carolinahenao01/WidiAI`
- File: `checkpoint_50000.pt`
- Revision: `main`

Optional overrides:

```bash
export OWN_MODEL_CHECKPOINT=/absolute/path/to/checkpoint_50000.pt
export OWN_MODEL_CHECKPOINT_REPO=carolinahenao01/WidiAI
export OWN_MODEL_CHECKPOINT_FILE=checkpoint_50000.pt
export OWN_MODEL_CHECKPOINT_REVISION=main
export OWN_MODEL_CHECKPOINT_CACHE_DIR=/absolute/path/to/cache
export HF_TOKEN=hf_xxx   # only if repo is private
```

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/transcribe` | `POST` | Receives `audio` + `model` and returns generated `.mid` |

Allowed `model` values:

- `transkun`
- `onsets_and_frames`

Audio extensions currently accepted by the code:

- `.wav`
- `.mp3`
- `.flac`
- `.ogg`
- `.m4a`
- `.webm`

Audio size limit:

- 25 MB per request (backend enforced)

Example multipart request:

```bash
curl -X POST "http://localhost:8000/transcribe" \
  -F "audio=@/path/to/audio.wav" \
  -F "model=transkun" \
  --output transcription_transkun.mid
```

Example JSON (base64) request:

```bash
curl -X POST "http://localhost:8000/transcribe" \
  -H "Content-Type: application/json" \
  -d '{"model":"transkun","filename":"input.wav","audio_base64":"<base64>"}' \
  --output transcription_transkun.mid
```

Frontend API base URL behavior (current code):

- If `frontend/static/env.js` defines `window.__WIDI_ENV__.API_URL`, the frontend uses it.
- Otherwise it falls back to the API URL saved in local storage or `http://localhost:8000`.

When hosting the frontend separately, ensure its API base URL points to the backend address.

## Development Workflow

Current repository state:

- No CI workflow is currently versioned in `.github/workflows/`.
- The `tests/` directory exists, but no source test files are currently versioned.
- Linting/formatting configuration is not yet standardized in this repository.

Recommended local validation before merging changes:

```bash
python -m compileall backend frontend
```

## Current Limitations

- Strict file size/duration validation from SRS is not fully implemented yet.
- Browser-recorded audio is stored locally in session storage but not fully wired into the same backend transcription path as file upload.
- Falling-notes visualization is implemented as a lightweight browser-side preview and may still need UX/performance tuning for very dense MIDI files.
- Automated test coverage and CI are pending.

## Roadmap

- Add strict backend validation for file size and duration limits.
- Integrate recorded-audio transcription end-to-end.
- Add MIDI visual timeline (piano-roll/falling notes).
- Add unit/integration tests and CI pipeline.
- Define linting and formatting standards.

## Contributing

This project is currently maintained as an academic/team prototype.

If you contribute:

1. Keep changes scoped and atomic.
2. Update documentation for behavior changes.
3. Add tests whenever test infrastructure is available.
4. Ensure new code paths fail with clear, actionable errors.

## License

No `LICENSE` file is currently included in this repository.
All rights and usage conditions remain with the project authors/team until a license is explicitly added.
