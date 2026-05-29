# WidiAI - HuggingFace Spaces Deployment Guide

## Gradio Web Interface Deployment

### Files Required for HF Spaces
- `app.py` - Gradio application (HF Spaces entry point)
- `packages.txt` - System dependencies
- `requirements.txt` - Python dependencies (Gradio-based)
- `backend/` - Backend module directory

### Quick Deploy to HF Spaces

#### Method 1: Direct Upload (Easiest)
1. Go to [HuggingFace Spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"**
3. Choose:
   - Name: `widiAI`
   - License: MIT
   - Private: No (for public access)
   - Space SDK: **Docker** (or Python if you configure manually)
4. Upload the files:
   - `app.py`
   - `packages.txt`
   - `requirements.txt`
   - `backend/` folder
5. HF Spaces will auto-start the Gradio app

#### Method 2: Git Push
```bash
# Clone your Space repo
git clone https://huggingface.co/spaces/[YOUR-USERNAME]/widiAI
cd widiAI

# Copy files from project
cp app.py packages.txt requirements.txt ./
cp -r backend ./

# Push to HF
git add .
git commit -m "Deploy WidiAI Gradio interface"
git push
```

### What Gets Installed

**System packages** (`packages.txt`):
- `ffmpeg` - Audio format conversion
- `libsndfile1`, `libasound2-dev` - Audio library dependencies
- `portaudio19-dev`, `libportaudio2` - Audio I/O

**Python packages** (`requirements.txt`):
- `gradio` - Web UI framework
- `torch` - Deep learning
- `librosa` - Audio processing
- `pretty_midi` - MIDI output
- `soundfile` - Audio file I/O
- `transkun` - Alternative transcription model
- `huggingface_hub` - Model downloading

---

## Using the Interface

### Web UI Features
✓ **Audio Upload** - Drag & drop or browse files  
✓ **Format Support** - WAV, MP3, OGG, FLAC, WebM, M4A  
✓ **Model Selection** - Choose between onsets_and_frames or transkun  
✓ **Live Transcription** - Process and download MIDI in real-time  
✓ **Status Updates** - See transcription progress

### Supported Formats
- WAV (uncompressed)
- MP3 (MPEG Audio)
- OGG (Vorbis)
- FLAC (lossless)
- **WebM** (web format - fully supported!)
- M4A (AAC)
- Max file size: 25 MB

### Available Models

**Onsets & Frames** (Recommended)
- Optimized for piano music
- ~3-6 seconds per transcription
- Best accuracy for classical piano

**Transkun**
- Alternative polyphonic transcription
- Different accuracy/latency tradeoff

---

## API Access (if enabled)

Gradio automatically exposes an API at `/api/predict/`:

```bash
curl -X POST https://[SPACE-URL]/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"name": "piano.wav", "data": "data:audio/wav;base64,..."},
      "onsets_and_frames"
    ]
  }'
```

Or use the Gradio Python client:
```python
from gradio_client import Client

client = Client("[SPACE-URL]")
result = client.predict(
    audio="piano.wav",
    model_name="onsets_and_frames",
    api_name="/transcribe"
)
```

---

## Performance Expectations

### Latency
- **Cold start**: ~30 seconds (first request, loads model)
- **Warm inference**: 3-8 seconds per transcription
- **Format conversion**: +2-3 seconds for WebM/MP3

### Resource Usage
- **CPU**: ~60-80% during transcription
- **Memory**: ~4-6 GB (peak)
- **Disk**: ~2 GB (model checkpoint)

HF Spaces Standard tier provides:
- 16 GB RAM
- 2 CPU cores
- Sufficient for smooth operation

---

## Troubleshooting

### Upload Fails
- ✓ Check file size (max 25MB)
- ✓ Try a different format (WebM → WAV)
- ✓ Ensure audio is valid

### Transcription Hangs
- Wait 30+ seconds (cold start for first request)
- Check HF Spaces status page for degradation
- Refresh and retry

### MIDI Download Doesn't Work
- Check browser console for errors
- Try different browser
- Verify audio had detectable notes

### Model Download Error
- Space needs internet access (auto-enabled)
- First run downloads ~500MB model
- May take 2-3 minutes

---

## Configuration

**Environment Variables** (Space Settings → Secret):
- `HF_TOKEN` - Auto-provided for model downloads
- `OWN_MODEL_CHECKPOINT` - Custom checkpoint path (optional)

---

## Files Structure
```
widiAI/
├── app.py                    # Gradio UI (HF Spaces entry)
├── packages.txt              # System dependencies
├── requirements.txt          # Python dependencies
├── backend/
│   ├── main.py               # (Optional for API mode)
│   ├── custom_transcriber.py # Core transcription logic
│   └── validate_optimization.py
├── DEPLOYMENT.md             # This file
└── README.md
```

---

## Comparison: FastAPI vs Gradio

| Feature | FastAPI | Gradio |
|---------|---------|--------|
| Web UI | ❌ None | ✅ Built-in |
| API | ✅ REST | ✅ Gradio API |
| Ease of use | Medium | Easy |
| Customization | High | Medium |
| HF Spaces | Requires wrapper | Native ✅ |
| Rate limiting | Manual | Built-in |
| File handling | Manual | Automatic |
| Deployment | Docker config | Auto-detect |

**We chose Gradio because:**
- ✅ Native HF Spaces support
- ✅ No FastAPI/Gradio version conflicts
- ✅ Simpler deployment
- ✅ Better UX for users
- ✅ Still provides API access

---

## Support & Resources

- **GitHub**: [WidiAI Repository](https://github.com/FrancOlano/WidiAI)
- **HF Spaces**: [Example Spaces](https://huggingface.co/spaces)
- **Gradio Docs**: [Gradio Documentation](https://gradio.app/docs/)

---

## Next Steps

1. Create Space on HuggingFace
2. Upload deployment files
3. Wait for build & launch (~2-5 minutes)
4. Share URL with users or embed in your site

Enjoy! 🎵
