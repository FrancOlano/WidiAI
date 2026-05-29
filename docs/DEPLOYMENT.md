# WidiAI - HuggingFace Spaces Deployment Guide

## Deployment Setup

### Files Required
- `app.py` - FastAPI application entry point
- `packages.txt` - System dependencies
- `requirements.txt` - Python dependencies
- `backend/` - Backend module directory

### Quick Deploy to HF Spaces

1. **Create a new Space** on [HuggingFace Spaces](https://huggingface.co/spaces):
   - Name: `widiAI` (or your choice)
   - License: MIT
   - Private: False (for public API)

2. **Upload files**:
   ```bash
   git clone https://huggingface.co/spaces/[YOUR-USERNAME]/widiAI
   cd widiAI
   
   # Copy deployment files
   cp app.py packages.txt requirements.txt ./
   cp -r backend ./
   
   git add .
   git commit -m "Deploy WidiAI backend"
   git push
   ```

3. **HF Spaces will automatically**:
   - Install packages from `packages.txt`
   - Install Python dependencies from `requirements.txt`
   - Start the `app` from `app.py`

### Configuration

**Environment Variables** (set in Space Settings):
- `OWN_MODEL_CHECKPOINT`: Custom checkpoint path (optional)
- `HF_TOKEN`: HuggingFace token (auto-provided in Spaces)
- `WIDI_ALLOWED_ORIGINS`: Comma-separated CORS origins

### Rate Limiting

The Space includes **5 requests/minute per user** rate limiting to protect shared resources.

- Per-user based on IP address
- Applied to all endpoints
- Returns 429 status if exceeded

### API Usage

#### Health Check
```bash
curl https://[SPACE-URL]/
# {"status": "ok", "service": "WidiAI Piano Transcription API"}
```

#### Transcribe Audio

**Multipart Form Upload (Recommended)**:
```bash
curl -X POST https://[SPACE-URL]/transcribe \
  -F "audio=@piano.wav" \
  -F "model=onsets_and_frames"
```

**JSON with Base64**:
```bash
curl -X POST https://[SPACE-URL]/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "audio_base64": "'$(base64 -w0 piano.webm)'",
    "filename": "piano.webm",
    "model": "onsets_and_frames"
  }'
```

**Available Models**:
- `onsets_and_frames` (default) - Faster, ~3-6 seconds per transcription
- `transkun` - Alternative model

**Supported Formats**: wav, mp3, ogg, flac, webm, m4a (max 25MB)

#### Response
- Status: 200 OK
- Content-Type: `audio/midi`
- Body: Binary MIDI file

---

## Performance Notes

- **CPU-based**: ~6-8 seconds for 3-minute piano audio
- **Cold start**: ~30 seconds first request (model loading)
- **Concurrent requests**: Limited by 5/min rate limit

## Troubleshooting

### Model Download Timeout
- Increase Space timeout in Settings → Timeout
- Set `HF_TOKEN` environment variable for faster downloads

### Out of Memory
- Reduce concurrent requests
- HF Spaces Standard tier: 16GB RAM
- Pro tier available if needed

### CORS Issues
- Add your domain to `WIDI_ALLOWED_ORIGINS` env var
- Or use the Space's built-in CORS handling

---

## Development

### Local Testing (before deploy)
```bash
export PORT=7860
python app.py
```

Then visit: `http://localhost:7860/docs` for interactive API docs

### Testing on HF Spaces
Use the Space's built-in API testing interface or `curl` commands above.

---

## Project Structure
```
widiAI/
├── app.py                          # HF Spaces entry point
├── packages.txt                    # System dependencies
├── requirements.txt                # Python dependencies
├── backend/
│   ├── main.py                     # FastAPI application
│   ├── custom_transcriber.py       # Model inference logic
│   └── validate_optimization.py    # Performance validation
└── README.md
```

---

## Support

For issues or questions, visit the [WidiAI GitHub repository](https://github.com/FrancOlano/WidiAI).
