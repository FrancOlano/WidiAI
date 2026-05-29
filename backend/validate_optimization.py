"""
Validation script for WidiAI optimization changes.
Establishes baseline metrics and compares before/after performance.
"""
from __future__ import annotations

import io
import json
import time
from pathlib import Path
from typing import Optional

import numpy as np
import torch

from backend.custom_transcriber import (
    load_own_model,
    transcribe_with_own_model,
    CONFIG_INFERENCE,
    get_device,
)


class ValidationMetrics:
    """Capture and compare performance metrics."""

    def __init__(self, name: str):
        self.name = name
        self.gpu_peak_mb = 0.0
        self.inference_time_ms = 0.0
        self.midi_output_bytes = b""
        self.midi_notes_count = 0
        self.midi_notes = []
        self.timestamp = time.time()

    def to_dict(self):
        return {
            "name": self.name,
            "gpu_peak_mb": self.gpu_peak_mb,
            "inference_time_ms": self.inference_time_ms,
            "midi_output_bytes": len(self.midi_output_bytes),
            "midi_notes_count": self.midi_notes_count,
            "timestamp": self.timestamp,
        }

    def __repr__(self):
        return (
            f"ValidationMetrics(name={self.name}, "
            f"gpu_peak={self.gpu_peak_mb:.1f}MB, "
            f"time={self.inference_time_ms:.1f}ms, "
            f"notes={self.midi_notes_count})"
        )


def measure_gpu_memory() -> float:
    """Measure current GPU memory usage in MB."""
    if not torch.cuda.is_available():
        return 0.0
    torch.cuda.synchronize()
    return torch.cuda.memory_allocated() / 1024 / 1024


def extract_midi_notes(midi_bytes: bytes) -> tuple[list, int]:
    """
    Extract note information from MIDI bytes.
    Returns: (list of note dicts, count)
    """
    try:
        import pretty_midi
        midi_obj = pretty_midi.PrettyMIDI(io.BytesIO(midi_bytes))

        notes = []
        for instrument in midi_obj.instruments:
            for note in instrument.notes:
                notes.append({
                    "pitch": note.pitch,
                    "start": note.start,
                    "end": note.end,
                    "velocity": note.velocity,
                })

        return notes, len(notes)
    except Exception as e:
        print(f"Warning: Could not parse MIDI: {e}")
        return [], 0


def validate_inference(
    audio_path: Path,
    config_override: Optional[dict] = None,
    description: str = "baseline",
) -> ValidationMetrics:
    """
    Run transcription inference and capture metrics.

    Args:
        audio_path: Path to test audio file
        config_override: Optional config overrides
        description: Label for this metrics capture

    Returns:
        ValidationMetrics object with captured data
    """
    import tempfile

    metrics = ValidationMetrics(description)

    # Create temp output path
    temp_dir = Path(tempfile.gettempdir())
    output_path = temp_dir / "validation_test.mid"

    # Clear GPU cache and measure starting memory
    if torch.cuda.is_available():
        torch.cuda.reset_peak_memory_stats()
        torch.cuda.empty_cache()

    initial_gpu_mb = measure_gpu_memory()

    # Run inference with timing
    start_time = time.time()
    try:
        midi_path = transcribe_with_own_model(
            audio_path=audio_path,
            midi_path=output_path,
            config_override=config_override,
        )

        # Capture timing
        metrics.inference_time_ms = (time.time() - start_time) * 1000

        # Measure peak GPU memory
        if torch.cuda.is_available():
            torch.cuda.synchronize()
            peak_gpu_mb = torch.cuda.max_memory_allocated() / 1024 / 1024
            metrics.gpu_peak_mb = peak_gpu_mb - initial_gpu_mb

        # Read MIDI output
        midi_output = Path(midi_path).read_bytes()
        metrics.midi_output_bytes = midi_output

        # Extract notes
        notes, count = extract_midi_notes(midi_output)
        metrics.midi_notes = notes
        metrics.midi_notes_count = count

        print(f"[OK] {metrics}")
        return metrics

    except Exception as e:
        print(f"[FAILED] Inference failed: {e}")
        raise


def compare_metrics(baseline: ValidationMetrics, new: ValidationMetrics) -> dict:
    """
    Compare baseline vs new metrics.

    Returns:
        Dict with comparison results and flagged issues
    """
    comparison = {
        "baseline": baseline.to_dict(),
        "new": new.to_dict(),
        "gpu_delta_mb": new.gpu_peak_mb - baseline.gpu_peak_mb,
        "time_delta_ms": new.inference_time_ms - baseline.inference_time_ms,
        "time_delta_percent": (
            (new.inference_time_ms - baseline.inference_time_ms) / baseline.inference_time_ms * 100
        ),
        "notes_delta": new.midi_notes_count - baseline.midi_notes_count,
        "issues": [],
    }

    # Flag major issues
    if abs(new.midi_notes_count - baseline.midi_notes_count) > 1:
        comparison["issues"].append(
            f"Note count changed significantly: {baseline.midi_notes_count} → {new.midi_notes_count}"
        )

    if new.inference_time_ms > baseline.inference_time_ms * 1.2:
        comparison["issues"].append(
            f"Inference time regressed >20%: {baseline.inference_time_ms:.1f}ms → {new.inference_time_ms:.1f}ms"
        )

    if new.gpu_peak_mb > baseline.gpu_peak_mb * 1.1:
        comparison["issues"].append(
            f"GPU memory regressed >10%: {baseline.gpu_peak_mb:.1f}MB → {new.gpu_peak_mb:.1f}MB"
        )

    return comparison


def create_test_tone(output_path: Path, duration_sec: float = 3.0) -> None:
    """Generate a simple test tone (sine wave)."""
    import scipy.io.wavfile as wavfile

    sample_rate = 16000
    num_samples = int(sample_rate * duration_sec)
    t = np.linspace(0, duration_sec, num_samples)

    # Mix of frequencies (C4, E4, G4 chord)
    freq_c4, freq_e4, freq_g4 = 262, 330, 392
    signal = (
        0.3 * np.sin(2 * np.pi * freq_c4 * t)
        + 0.3 * np.sin(2 * np.pi * freq_e4 * t)
        + 0.3 * np.sin(2 * np.pi * freq_g4 * t)
    )

    signal = np.int16(signal / signal.max() * 32767)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(str(output_path), sample_rate, signal)


def main():
    """Run validation suite."""
    print("=" * 70)
    print("WidiAI Backend Optimization Validation")
    print("=" * 70)

    # Find or create test audio file
    test_audio_dir = Path(__file__).parent.parent / "test_audio"
    test_audio_path = None

    if test_audio_dir.exists():
        # Find first audio file
        audio_files = list(test_audio_dir.glob("*.wav")) + \
                     list(test_audio_dir.glob("*.mp3")) + \
                     list(test_audio_dir.glob("*.flac"))
        if audio_files:
            test_audio_path = audio_files[0]

    # Fallback: create test tone
    if test_audio_path is None or not test_audio_path.exists():
        import tempfile
        temp_dir = Path(tempfile.gettempdir())
        test_audio_path = temp_dir / "validation_test_tone.wav"
        print(f"\nGenerating test tone: {test_audio_path}")
        try:
            create_test_tone(test_audio_path)
        except Exception as e:
            print(f"Could not create test tone: {e}")
            print("Please provide a test audio file")
            return 1

    print(f"\nTest audio: {test_audio_path}")
    print(f"Device: {get_device()}")

    # Load model once
    print("\nLoading model...")
    model = load_own_model(CONFIG_INFERENCE)
    print(f"Model device: {next(model.parameters()).device}")

    # Baseline run
    print("\n" + "-" * 70)
    print("BASELINE RUN (current implementation)")
    print("-" * 70)
    baseline = validate_inference(test_audio_path, description="baseline")

    # Save baseline
    baseline_file = Path(__file__).parent / "validation_baseline.json"
    with open(baseline_file, "w") as f:
        json.dump(baseline.to_dict(), f, indent=2)
    print(f"\nBaseline saved to: {baseline_file}")

    print("\n" + "=" * 70)
    print("[OK] Baseline validation complete")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Make optimization changes")
    print("2. Re-run this script to get NEW metrics")
    print("3. Script will automatically compare baseline vs new results")
    print("\nTo compare after changes, run:")
    print(f"  python -m backend.validate_optimization --compare")

    return 0


def compare_mode():
    """Compare baseline with new metrics."""
    baseline_file = Path(__file__).parent / "validation_baseline.json"
    if not baseline_file.exists():
        print(f"No baseline found at {baseline_file}")
        print("Run without --compare first to establish baseline")
        return 1

    print("=" * 70)
    print("WidiAI Backend Optimization Validation - COMPARISON MODE")
    print("=" * 70)

    with open(baseline_file) as f:
        baseline_data = json.load(f)

    # Find or create test audio
    test_audio_dir = Path(__file__).parent.parent / "test_audio"
    test_audio_path = None

    if test_audio_dir.exists():
        audio_files = list(test_audio_dir.glob("*.wav")) + \
                     list(test_audio_dir.glob("*.mp3")) + \
                     list(test_audio_dir.glob("*.flac"))
        if audio_files:
            test_audio_path = audio_files[0]

    if test_audio_path is None or not test_audio_path.exists():
        import tempfile
        temp_dir = Path(tempfile.gettempdir())
        test_audio_path = temp_dir / "validation_test_tone.wav"
        print(f"\nRegenerating test tone: {test_audio_path}")
        try:
            create_test_tone(test_audio_path)
        except Exception as e:
            print(f"Could not create test tone: {e}")
            return 1

    print(f"Test audio: {test_audio_path}")
    print(f"Device: {get_device()}")

    # Load model
    print("\nLoading model...")
    model = load_own_model(CONFIG_INFERENCE)

    # New run
    print("\n" + "-" * 70)
    print("NEW RUN (after optimizations)")
    print("-" * 70)
    new = validate_inference(test_audio_path, description="optimized")

    # Compare
    print("\n" + "-" * 70)
    print("COMPARISON RESULTS")
    print("-" * 70)

    # Restore baseline data for comparison
    baseline = ValidationMetrics("baseline")
    baseline.gpu_peak_mb = baseline_data.get("gpu_peak_mb", 0)
    baseline.inference_time_ms = baseline_data.get("inference_time_ms", 0)
    baseline.midi_notes_count = baseline_data.get("midi_notes_count", 0)

    comparison = compare_metrics(baseline, new)

    print(f"\nGPU Memory: {baseline.gpu_peak_mb:.1f}MB -> {new.gpu_peak_mb:.1f}MB "
          f"({comparison['gpu_delta_mb']:+.1f}MB)")
    print(f"Inference Time: {baseline.inference_time_ms:.1f}ms -> {new.inference_time_ms:.1f}ms "
          f"({comparison['time_delta_ms']:+.1f}ms, {comparison['time_delta_percent']:+.1f}%)")
    print(f"Note Count: {baseline.midi_notes_count} -> {new.midi_notes_count} "
          f"({comparison['notes_delta']:+d})")

    if comparison["issues"]:
        print("\n[WARNING] ISSUES DETECTED:")
        for issue in comparison["issues"]:
            print(f"  - {issue}")
    else:
        print("\n[OK] All comparisons within acceptable range")

    # Save new metrics
    new_file = Path(__file__).parent / "validation_new.json"
    with open(new_file, "w") as f:
        json.dump(new.to_dict(), f, indent=2)
    print(f"\nNew metrics saved to: {new_file}")

    return 0 if not comparison["issues"] else 1


if __name__ == "__main__":
    import sys

    if "--compare" in sys.argv:
        sys.exit(compare_mode())
    else:
        sys.exit(main())
