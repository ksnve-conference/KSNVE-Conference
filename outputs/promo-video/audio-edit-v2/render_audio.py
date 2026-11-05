"""Revise the connected question to a calmer speaking rate, as requested."""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / "intro-v4" / "voice-a-question.mp3"
SR = 44100

def run(args, data=None):
    return subprocess.run(args, input=data, capture_output=True, check=True).stdout

def decode(path):
    return np.frombuffer(run(["ffmpeg", "-v", "error", "-i", str(path),
        "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]), dtype="<f4").copy()

source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
x = decode(SOURCE)
start, end = round(.095*SR), round(1.480*SR)
# Work from the untouched source: remove v1's extra local 1.2x speed-up.
# The current user explicitly requests slower speech. The full connected
# phrase now runs at 0.85x of the source with pitch preserved.
tempo = .85
y = np.frombuffer(run(["ffmpeg", "-v", "error", "-f", "f32le",
    "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
    "-af", f"atempo={tempo}", "-f", "f32le", "pipe:1"],
    x[start:end].astype("<f4").tobytes()), dtype="<f4").copy()
gain = min(1.0, 10**(-1.5/20)/float(np.max(np.abs(y))))
y *= gain
fade_in, fade_out = round(.004*SR), round(.012*SR)
y[:fade_in] *= np.linspace(0, 1, fade_in)
y[-fade_out:] *= np.linspace(1, 0, fade_out)
wav = ROOT / "KSNVE_female_question_connected_slower.wav"
mp3 = ROOT / "KSNVE_female_question_connected_slower.mp3"
run(["ffmpeg", "-nostdin", "-v", "error", "-n", "-f", "f32le",
    "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
    "-c:a", "pcm_s24le", str(wav)], y.astype("<f4").tobytes())
run(["ffmpeg", "-nostdin", "-v", "error", "-n", "-i", str(wav),
    "-c:a", "libmp3lame", "-q:a", "1", str(mp3)])
z = decode(mp3)
assert len(z) == len(y)
assert np.all(np.isfinite(z))
assert float(np.max(np.abs(z))) < 1.0
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash
previous = json.loads((ROOT.parent / "audio-edit-v1" / "production.json").read_text())
previous_duration = previous["output_duration_seconds"]
assert len(y)/SR > previous_duration
ledger = {
    "revision": "audio-edit-v2",
    "user_request": "말이 너무 빠르다",
    "spoken_text": "아니그게 고민이 된다고?",
    "source": str(SOURCE.relative_to(ROOT.parent)),
    "source_sha256": source_hash,
    "source_in_seconds": start/SR,
    "source_out_seconds": end/SR,
    "change": "Removed the previous local 1.2x opening speed-up; slowed the full connected phrase to 0.85x of the untouched source with pitch preserved.",
    "tempo_multiplier_from_source": tempo,
    "silence_inserted": False,
    "new_synthesis": False,
    "gain": gain,
    "previous_duration_seconds": previous_duration,
    "output_duration_seconds": len(y)/SR,
    "outputs": [wav.name, mp3.name],
    "sample_rate": SR,
    "channels": 1,
    "verification": {
        "source_unchanged": True,
        "full_decode_passed": True,
        "finite_samples": True,
        "decoded_peak": float(np.max(np.abs(z))),
        "audio_listening_performed": False,
        "note": "Technical audio checks passed. Naturalness and intonation remain unverified by listening."
    },
    "next_step": "Use accepted audio to drive character lip-sync."
}
(ROOT / "production.json").write_text(json.dumps(ledger, ensure_ascii=False, indent=2)+"\n")
print(json.dumps({"duration_seconds":len(y)/SR,
    "previous_duration_seconds":previous_duration,
    "peak":float(np.max(np.abs(z))),"mp3":str(mp3)},ensure_ascii=False))

