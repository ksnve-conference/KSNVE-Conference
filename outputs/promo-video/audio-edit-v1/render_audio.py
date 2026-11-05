"""Local dialogue edit: compact the connected opening without new synthesis."""
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

def samples(t):
    return round(t * SR)

original_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
x = decode(SOURCE)
# Visually inspected acoustic boundaries. Provider word timestamps do not
# match the waveform precisely, so they are not used as phoneme boundaries.
source_in = samples(0.095)
opening_out = samples(0.505)
source_out = samples(1.480)
tempo = 1.20
opening = x[source_in:opening_out]
opening_fast = np.frombuffer(run(["ffmpeg", "-v", "error",
    "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
    "-af", f"atempo={tempo}", "-f", "f32le", "pipe:1"],
    opening.astype("<f4").tobytes()), dtype="<f4").copy()
tail = x[opening_out:source_out].copy()
overlap = samples(0.004)
ramp = np.linspace(0.0, 1.0, overlap, dtype=np.float64)
bridge = opening_fast[-overlap:] * (1-ramp) + tail[:overlap] * ramp
y = np.concatenate([opening_fast[:-overlap], bridge, tail[overlap:]]).astype(np.float32)
gain = min(1.0, 10**(-1.5/20) / float(np.max(np.abs(y))))
y *= gain
fade_in, fade_out = samples(0.004), samples(0.012)
y[:fade_in] *= np.linspace(0, 1, fade_in)
y[-fade_out:] *= np.linspace(1, 0, fade_out)
wav = ROOT / "KSNVE_female_question_connected.wav"
mp3 = ROOT / "KSNVE_female_question_connected.mp3"
run(["ffmpeg", "-nostdin", "-v", "error", "-n", "-f", "f32le",
    "-ar", str(SR), "-ac", "1", "-i", "pipe:0", "-c:a", "pcm_s24le",
    str(wav)], y.astype("<f4").tobytes())
run(["ffmpeg", "-nostdin", "-v", "error", "-n", "-i", str(wav),
    "-c:a", "libmp3lame", "-q:a", "1", str(mp3)])
decoded = decode(mp3)
assert len(decoded) == len(y)
assert np.all(np.isfinite(decoded))
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == original_hash
assert float(np.max(np.abs(decoded))) < 1.0
# A sample comparison verifies that the rest of the sentence is copied at 1x,
# excluding the overlap and the final fade.
tail_final_start = len(opening_fast) - overlap
a, b = overlap + samples(.01), len(tail) - fade_out - 1
max_tail_error = float(np.max(np.abs(
    y[tail_final_start+a:tail_final_start+b] / gain - tail[a:b])))
assert max_tail_error < 1e-6
ledger = {
    "project": "KSNVE conference invitation",
    "revision": "audio-edit-v1",
    "workflow": "Local FFmpeg audio edit; no new TTS or video generation",
    "written_text": "아니 그게 고민이 된다고?",
    "spoken_text": "아니그게 고민이 된다고?",
    "source": str(SOURCE.relative_to(ROOT.parent)),
    "source_sha256": original_hash,
    "source_voice": "fe3fbd12d84c41b5a791e6ea544f774d",
    "source_duration_seconds": len(x)/SR,
    "edits": [
        {"operation": "trim_leading_margin", "source_seconds": [0, source_in/SR]},
        {"operation": "pitch_preserving_local_tempo", "source_seconds": [source_in/SR, opening_out/SR],
         "target_phrase": "아니그게", "tempo_multiplier": tempo,
         "output_samples": len(opening_fast), "output_seconds": len(opening_fast)/SR,
         "authorization": "User requested faster, more connected delivery"},
        {"operation": "linear_crossfade", "duration_seconds": overlap/SR,
         "output_start_seconds": (len(opening_fast)-overlap)/SR},
        {"operation": "copy_at_original_speed", "source_seconds": [opening_out/SR, source_out/SR],
         "output_start_seconds": tail_final_start/SR},
        {"operation": "trim_trailing_margin", "source_seconds": [source_out/SR, len(x)/SR]},
        {"operation": "headroom_gain", "linear_gain": gain},
        {"operation": "boundary_fades", "in_seconds": fade_in/SR, "out_seconds": fade_out/SR}
    ],
    "outputs": [wav.name, mp3.name],
    "sample_rate": SR, "channels": 1,
    "output_duration_seconds": len(y)/SR,
    "verification": {
        "original_preserved": True,
        "full_decode_passed": True,
        "finite_samples": True,
        "decoded_peak": float(np.max(np.abs(decoded))),
        "tail_sample_comparison_max_error": max_tail_error,
        "waveform_and_spectrogram_reviewed": True,
        "listening_review_performed": False,
        "note": "The latest source was already connected without a long silence; the opening was locally accelerated. No phoneme-level silence deletion or new rising-intonation synthesis was claimed."
    },
    "next_workflow": "Confirm speech before audio-driven lip-sync generation with existing character images."
}
(ROOT / "production.json").write_text(json.dumps(ledger, ensure_ascii=False, indent=2)+"\n")
print(json.dumps({"mp3":str(mp3),"wav":str(wav),
    "duration_seconds":len(y)/SR, "opening_before_seconds":len(opening)/SR,
    "opening_after_seconds":len(opening_fast)/SR,
    "decoded_peak":float(np.max(np.abs(decoded))),"tail_sample_error":max_tail_error},ensure_ascii=False))

