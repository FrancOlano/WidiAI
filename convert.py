from fastapi import FastAPI
from fastapi.responses import FileResponse
import subprocess
import os

app = FastAPI()

INPUT_AUDIO = "input.mp3"   # your existing file
OUTPUT_MIDI = "output.mid"


@app.get("/convert")
def convert_audio():
    # Check input exists
    if not os.path.exists(INPUT_AUDIO):
        return {"error": "Input file not found"}

    try:
        # Run Transkun CLI
        subprocess.run(
            ["transkun", INPUT_AUDIO, OUTPUT_MIDI],
            check=True
        )

        #If transkun not found we use this:
        #subprocess.run(
        #    ["python", "-m", "transkun", INPUT_AUDIO, OUTPUT_MIDI],
        #    check=True
        #)

    except subprocess.CalledProcessError as e:
        return {"error": f"Transkun failed: {e}"}

    # Check output
    if not os.path.exists(OUTPUT_MIDI):
        return {"error": "MIDI file not generated"}

    return FileResponse(
        OUTPUT_MIDI,
        media_type="audio/midi",
        filename="output.mid"
    )