from __future__ import annotations

import base64
import binascii
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response, FileResponse         
from fastapi.staticfiles import StaticFiles                  
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool

from backend.custom_transcriber import transcribe_with_own_model

app = FastAPI()



# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

@app.get("/")
async def serve_index():
    return FileResponse("frontend/templates/index.html")

ALLOWED_SUFFIXES = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".webm"}
MAX_AUDIO_BYTES = 25 * 1024 * 1024


def run_transkun(audio_path: Path, output_path: Path) -> None:
    audio_path = str(audio_path)
    output_path = str(output_path)

    # Prefer the transkun binary from the same Python environment as this API.
    # This avoids picking unrelated global installs (e.g. conda/base).
    env_transkun = Path(sys.executable).with_name("transkun")
    transkun_bin = str(env_transkun) if env_transkun.exists() else None

    # Fallback to PATH only if local environment does not provide transkun.
    if not transkun_bin:
        transkun_bin = shutil.which("transkun")

    if not transkun_bin:
        raise RuntimeError(
            "transkun executable not found in current environment. "
            "Activate your project venv and run: pip install transkun"
        )

    env = os.environ.copy()
    path_entries = []

    ffmpeg_bin = shutil.which("ffmpeg")
    ffprobe_bin = shutil.which("ffprobe")
    if ffmpeg_bin and ffprobe_bin:
        path_entries.append(str(Path(ffmpeg_bin).parent))
    else:
        winget_packages = Path.home() / "AppData" / "Local" / "Microsoft" / "WinGet" / "Packages"
        for candidate in winget_packages.glob("Gyan.FFmpeg_*/*/bin"):
            if (candidate / "ffmpeg.exe").exists() and (candidate / "ffprobe.exe").exists():
                path_entries.append(str(candidate))
                break

    path_entries.append(env.get("PATH", ""))
    env["PATH"] = os.pathsep.join(path_entries)

    try:
        subprocess.run(
            [transkun_bin, audio_path, output_path],
            check=True,
            capture_output=True,
            text=True,
            env=env,
        )
    except subprocess.CalledProcessError as e:
        stderr = e.stderr or e.stdout or ""
        if "No module named 'audioop'" in stderr or "No module named 'pyaudioop'" in stderr:
            raise RuntimeError(
                "TransKun dependency error (audioop/pyaudioop). "
                "Use a compatible Python environment for transkun "
                "(or install audioop-lts/pyaudioop in that environment)."
            )
        raise RuntimeError(f"TransKun failed:\n{stderr}")

    if not Path(output_path).exists():
        raise RuntimeError("TransKun finished but no MIDI file was created.")


def _normalize_model_name(model_name: Optional[str]) -> str:
    if not model_name:
        raise HTTPException(status_code=400, detail="Missing model.")
    value = model_name.strip().lower()
    if value in {"transkun"}:
        return "transkun"
    if value in {"onsets_and_frames", "onsets and frames", "onsets-frames", "onsets&frames", "own"}:
        return "onsets_and_frames"
    raise HTTPException(status_code=400, detail="Invalid model. Use 'transkun' or 'onsets_and_frames'.")


def _decode_base64_audio(payload: str) -> bytes:
    if not payload:
        raise HTTPException(status_code=400, detail="Missing audio payload.")
    value = payload.strip()
    if value.startswith("data:") and "," in value:
        value = value.split(",", 1)[1]
    try:
        return base64.b64decode(value, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 audio payload.") from exc


def _select_suffix(filename: Optional[str]) -> str:
    suffix = Path(filename or "input.wav").suffix.lower()
    return suffix if suffix in ALLOWED_SUFFIXES else ".wav"


@app.post("/transcribe")
async def transcribe_audio(
    request: Request,
    audio: Optional[UploadFile] = File(None),
    model_name: Optional[str] = Form(None, alias="model"),
):
    if audio is None:
        if not request.headers.get("content-type", "").lower().startswith("application/json"):
            raise HTTPException(status_code=400, detail="Missing audio upload or JSON payload.")
        payload = await request.json()
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="Invalid JSON payload.")
        model_name = model_name or payload.get("model")
        audio_bytes = _decode_base64_audio(payload.get("audio_base64") or payload.get("audio"))
        filename = payload.get("filename") or "input.wav"
    else:
        model_name = model_name or ""
        audio_bytes = await audio.read()
        filename = audio.filename or "input.wav"

    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file too large.")

    selected_model = _normalize_model_name(model_name)
    suffix = _select_suffix(filename)

    try:
        with tempfile.TemporaryDirectory(prefix="widi_") as tmp_dir:
            input_path = Path(tmp_dir) / f"input{suffix}"
            output_path = Path(tmp_dir) / "output.mid"
            input_path.write_bytes(audio_bytes)

            if selected_model == "onsets_and_frames":
                await run_in_threadpool(transcribe_with_own_model, input_path, output_path)
            else:
                await run_in_threadpool(run_transkun, input_path, output_path)

            midi_bytes = output_path.read_bytes()

        return Response(
            content=midi_bytes,
            media_type="audio/midi",
            headers={
                "Content-Disposition": f"attachment; filename=transcription_{selected_model}.mid"
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
