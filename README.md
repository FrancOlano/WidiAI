# Wave2Midi

Wave2Midi is a Music Technology Lab project developed by group S104. The goal of the project is to build a web application that converts piano audio recordings into MIDI files using Automatic Music Transcription (AMT).

The current MVP allows users to upload a `.wav` or `.mp3` piano recording, choose a transcription backend, send the file to a FastAPI server, and download the generated MIDI file.

## Team

Bet Jara, Carolina Henao, Eric Matas, Francesc Baiget, Franco Olano, Pau Solàs

## Project status

Current status: MVP under development.

Implemented:
- FastAPI backend.
- Browser-based frontend.
- Audio upload from the web interface.
- `POST /transcribe` endpoint.
- Direct MIDI file response.
- Model selection: `own` or `transkun`.
- Basic upload validation.
- Basic pytest tests.

Experimental or future features:
- Microphone recording endpoints.
- `/upload-audio` endpoint.
- MIDI piano-roll or falling-note visualisation.
- Playback controls.
- Speed and volume controls.
- Persistent output URLs.
- CI/CD with GitHub Actions.

## Repository structure

```text
.
├── fastapi_app.py          # Active FastAPI backend for the MVP
├── app.py                  # Legacy Flask prototype, not the active backend
├── custom_transcriber.py   # Custom transcription logic
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Frontend HTML template
├── static/
│   └── script.js           # Frontend JavaScript
├── tests/
│   └── test_fastapi_app.py # Basic backend tests
└── README.md

The custom model checkpoint is not included in the repository.
Download checkpoint_50000.pt from (https://drive.google.com/file/d/1ly9Ux77OxtdZW71cZnnXt1Yz6H4Pcj-E/view?usp=sharing) and place it in the project root.
