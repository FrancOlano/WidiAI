"""
WidiAI - Piano Transcription with Gradio UI for HuggingFace Spaces
"""
import io
import tempfile
from pathlib import Path
from typing import Optional

import gradio as gr
import librosa
import numpy as np
import torch

from backend.custom_transcriber import (
    load_own_model,
    transcribe_with_own_model,
    CONFIG_INFERENCE,
    get_device,
)


# Global model cache
_model = None


def get_model():
    """Load model once and cache it."""
    global _model
    if _model is None:
        _model = load_own_model(CONFIG_INFERENCE)
    return _model


def transcribe_audio(
    audio_file,
    model_name: str = "onsets_and_frames",
) -> tuple[str, bytes]:
    """
    Transcribe piano audio to MIDI.

    Args:
        audio_file: Audio file (can be file path or numpy array from Gradio)
        model_name: Model to use ("onsets_and_frames" or "transkun")

    Returns:
        Tuple of (status message, MIDI bytes)
    """
    try:
        if audio_file is None:
            return "Error: Please upload an audio file", None

        # Handle Gradio audio input (can be tuple or path)
        if isinstance(audio_file, tuple):
            # Gradio returns (sample_rate, audio_array)
            sample_rate, audio_array = audio_file
            audio_array = audio_array.astype(np.float32)
            # Normalize to [-1, 1] if needed
            if np.max(np.abs(audio_array)) > 1.0:
                audio_array = audio_array / np.max(np.abs(audio_array))
        else:
            # File path
            audio_array, sample_rate = librosa.load(audio_file, sr=16000, mono=True)

        # Create temp output path
        with tempfile.TemporaryDirectory(prefix="widi_") as tmp_dir:
            output_path = Path(tmp_dir) / "output.mid"

            if model_name == "onsets_and_frames":
                # Use optimized in-memory transcription
                midi_path = transcribe_with_own_model(
                    audio_path=None,
                    midi_path=output_path,
                    audio_array=audio_array,
                    sample_rate=sample_rate,
                    config_override=None,
                )
            elif model_name == "transkun":
                # Transkun needs file path, write temporarily
                audio_file_path = Path(tmp_dir) / "audio.wav"
                import soundfile as sf

                sf.write(str(audio_file_path), audio_array, sample_rate)

                from backend.main import run_transkun

                run_transkun(audio_file_path, output_path)
                midi_path = output_path
            else:
                return f"Error: Unknown model '{model_name}'", None

            # Read MIDI output
            midi_bytes = Path(midi_path).read_bytes()

            status = (
                f"Success! Transcribed with {model_name} model. "
                f"Generated MIDI: {len(midi_bytes)} bytes"
            )
            return status, midi_bytes

    except Exception as e:
        return f"Error during transcription: {str(e)}", None


def create_interface():
    """Create Gradio interface."""
    with gr.Blocks(
        title="WidiAI - Piano Transcription",
        theme=gr.themes.Soft(),
    ) as interface:
        gr.Markdown(
            """
        # 🎹 WidiAI - Piano Transcription to MIDI

        Convert piano audio recordings to MIDI format using AI models.

        **Supported formats**: WAV, MP3, OGG, FLAC, WebM, M4A (max 25MB)

        **Models**:
        - **Onsets & Frames** (recommended): Fast, accurate onset and frame detection
        - **Transkun**: Alternative transcription engine
        """
        )

        with gr.Row():
            with gr.Column():
                gr.Markdown("### Input")
                audio_input = gr.Audio(
                    label="Upload Piano Audio",
                    type="numpy",
                    scale=1,
                )

                model_select = gr.Dropdown(
                    choices=["onsets_and_frames", "transkun"],
                    value="onsets_and_frames",
                    label="Transcription Model",
                    scale=1,
                )

                transcribe_btn = gr.Button(
                    "🎵 Transcribe to MIDI",
                    variant="primary",
                    scale=1,
                )

            with gr.Column():
                gr.Markdown("### Output")
                status_output = gr.Textbox(
                    label="Status",
                    interactive=False,
                    lines=2,
                )

                midi_output = gr.File(
                    label="Download MIDI",
                    type="binary",
                    interactive=False,
                )

        # Examples
        gr.Markdown("### Example Usage")
        gr.Examples(
            examples=[
                ["example_piano.wav", "onsets_and_frames"],
            ],
            inputs=[audio_input, model_select],
            fn=transcribe_audio,
            outputs=[status_output, midi_output],
            cache_examples=False,
            label="Try with examples (if available)",
        )

        # Connect button
        transcribe_btn.click(
            fn=transcribe_audio,
            inputs=[audio_input, model_select],
            outputs=[status_output, midi_output],
            api_name="transcribe",
        )

        gr.Markdown(
            """
        ---
        **Tips**:
        - Use clear piano recordings for best results
        - Mono audio works best (stereo will be converted)
        - For best accuracy, use the onsets_and_frames model

        [GitHub](https://github.com/FrancOlano/WidiAI) |
        [Paper](https://magenta.tensorflow.org/onsets-frames)
        """
        )

    return interface


if __name__ == "__main__":
    interface = create_interface()
    interface.launch()
