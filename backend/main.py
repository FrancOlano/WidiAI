from __future__ import annotations

import base64
import binascii
import io
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

import librosa
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool

from backend.custom_transcriber import transcribe_with_own_model

app = FastAPI()


def _load_allowed_origins() -> list[str]:
    raw = os.getenv("WIDI_ALLOWED_ORIGINS", "")
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ]



# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=_load_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check():
    return {"status": "ok"}

ALLOWED_SUFFIXES = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".webm"}
MAX_AUDIO_BYTES = 25 * 1024 * 1024


def run_transkun(audio_path: Path, output_path: Path) -> None:
    audio_path = str(audio_path)
    output_path = str(output_path)

    # Use module execution so we don't depend on a wrapper script shebang path.
    # This is robust even if the project folder has been moved.
    transkun_cmd = [sys.executable, "-m", "transkun.transcribe", audio_path, output_path]

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
            transkun_cmd,
            check=True,
            capture_output=True,
            text=True,
            env=env,
        )
    except FileNotFoundError as e:
        raise RuntimeError(
            "transkun module is not available in the current environment. "
            "Install requirements in this venv: .venv/bin/python -m pip install -r requirements.txt"
        ) from e
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
            output_path = Path(tmp_dir) / "output.mid"

            if selected_model == "onsets_and_frames":
                # Formats that librosa can handle via BytesIO
                bytesio_safe_formats = {".wav", ".mp3", ".ogg", ".flac"}

                if suffix in bytesio_safe_formats:
                    # Fast path: load in memory via BytesIO
                    try:
                        audio_array, sample_rate = librosa.load(
                            io.BytesIO(audio_bytes),
                            sr=16000,
                            mono=True,
                        )
                        await run_in_threadpool(
                            transcribe_with_own_model,
                            audio_path=None,
                            midi_path=output_path,
                            audio_array=audio_array,
                            sample_rate=sample_rate,
                        )
                    except Exception:
                        # Fallback to temp file if BytesIO fails
                        input_path = Path(tmp_dir) / f"input{suffix}"
                        input_path.write_bytes(audio_bytes)
                        await run_in_threadpool(
                            transcribe_with_own_model,
                            audio_path=input_path,
                            midi_path=output_path,
                        )
                else:
                    # WebM and other formats requiring ffmpeg: use temp file
                    input_path = Path(tmp_dir) / f"input{suffix}"
                    input_path.write_bytes(audio_bytes)
                    await run_in_threadpool(
                        transcribe_with_own_model,
                        audio_path=input_path,
                        midi_path=output_path,
                    )
            else:
                # transkun still needs file path
                input_path = Path(tmp_dir) / f"input{suffix}"
                input_path.write_bytes(audio_bytes)
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
