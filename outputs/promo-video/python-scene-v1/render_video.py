"""Render the approved question with Python/Pillow and FFmpeg, entirely locally."""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
BASE = ROOT.parent
IMAGE = BASE / "casting-v1" / "01-cafe-master.png"
AUDIO = BASE / "intro-v4" / "voice-a-question.mp3"
FONT = Path("/System/Library/Fonts/AppleSDGothicNeo.ttc")
W, H, FPS, SR = 1920, 1080, 30, 44100
OFFSET_FRAME, CLOSEUP_FRAME = 12, 10
OFFSET = OFFSET_FRAME / FPS
TEXT = "아니그게 고민이 된다고?"
FONT_SIZE = 84
OUT = ROOT / "KSNVE_python_question_v1.mp4"

def run(args, data=None):
    return subprocess.run(args, input=data, capture_output=True, check=True).stdout

def decode(path):
    return np.frombuffer(run(["ffmpeg", "-v", "error", "-i", str(path),
        "-vn", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]), dtype="<f4").copy()

def stamp(sec):
    ms = round(sec * 1000)
    return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"

source_hash = hashlib.sha256(AUDIO.read_bytes()).hexdigest()
speech = decode(AUDIO)
source_duration = len(speech) / SR
N = math.ceil((OFFSET + source_duration + 0.40) * FPS)
duration = N / FPS
# Phrase-level timing from the actual decoded speech envelope.
# No word-by-word timings or fabricated karaoke alignment.
window = round(0.005 * SR)
rms = np.array([np.sqrt(np.mean(speech[i:i+window]**2))
                for i in range(0, len(speech), window)])
active = np.flatnonzero(rms > 10**(-38/20))
speech_on = max(0, active[0] * window / SR - .025)
speech_off = min(source_duration, (active[-1]+1) * window / SR + .08)
CAPTION_START = math.floor((OFFSET + speech_on) * FPS) / FPS
CAPTION_END = min(duration, OFFSET + max(speech_off, source_duration-.04) + .18)
caption_start_frame = round(CAPTION_START * FPS)
caption_end_frame = math.ceil(CAPTION_END * FPS)

# Copy the accepted recording in full at 1x. Static gain only for AAC headroom.
gain = 10**(-2/20)
master = np.zeros(round(duration*SR), dtype=np.float32)
insert = round(OFFSET*SR)
master[insert:insert+len(speech)] = speech * gain
assert np.max(np.abs(master[insert:insert+len(speech)]/gain-speech)) < 1e-6
master_path = ROOT / "audio_master.wav"
run(["ffmpeg", "-nostdin", "-v", "error", "-n", "-f", "f32le",
    "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
    "-c:a", "pcm_f32le", str(master_path)], master.astype("<f4").tobytes())

scene = Image.open(IMAGE).convert("RGB")
font = ImageFont.truetype(str(FONT), FONT_SIZE, index=6)
caption = Image.new("RGBA", (W, H), (0,0,0,0))
d = ImageDraw.Draw(caption)
parts = [("아니그게 고민이 ", (255,255,255,255)), ("된다고?", (255,221,93,255))]
width = sum(d.textlength(s,font=font) for s,c in parts)
x = (W-width)/2
y = 875
for s,c in parts:
    d.text((x+2,y+5), s, font=font, fill=(0,0,0,190),
           stroke_width=9, stroke_fill=(0,0,0,190))
    d.text((x,y), s, font=font, fill=c, stroke_width=6,
           stroke_fill=(15,28,50,255))
    x += d.textlength(s,font=font)
caption_bounds = caption.getbbox()
assert caption_bounds[0] > 80 and caption_bounds[2] < W-80
assert caption_bounds[3] < H-60

# Contrast protection over the lower part of the photo, not a separate text panel.
shade = np.zeros((H,W,4),dtype=np.uint8)
shade[:,:,:3] = (6,17,33)
for row in range(H):
    alpha = max(0,min(1,(row/H-.63)/.37))**1.5
    shade[row,:,3] = round(125*alpha)
shade_img = Image.fromarray(shade, "RGBA")
initial_box = (0,0,scene.width,scene.height)
def frame(index):
    if index < CLOSEUP_FRAME:
        box = initial_box
    else:
        u = min(1,max(0,(index-CLOSEUP_FRAME)/6))
        eased = 1-(1-u)**3
        crop_w = 1160-40*eased
        crop_h = crop_w*H/W
        cx,cy = 610,350
        box = (cx-crop_w/2,cy-crop_h/2,cx+crop_w/2,cy+crop_h/2)
    im = scene.transform((W,H), Image.Transform.EXTENT, box,
                         resample=Image.Resampling.BICUBIC).convert("RGBA")
    if caption_start_frame <= index < caption_end_frame:
        im = Image.alpha_composite(im,shade_img)
        im = Image.alpha_composite(im,caption)
    return im.convert("RGB")

logpath = ROOT/"render.log"
args = ["ffmpeg","-nostdin","-v","warning","-n",
    "-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","pipe:0",
    "-i",str(master_path),"-map","0:v:0","-map","1:a:0",
    "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","256k","-movflags","+faststart",
    "-color_primaries","bt709","-color_trc","bt709","-colorspace","bt709",
    str(OUT)]
with logpath.open("wb") as log:
    proc = subprocess.Popen(args,stdin=subprocess.PIPE,stderr=log)
    for i in range(N):
        proc.stdin.write(frame(i).tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError(logpath.read_text())

# Decode the actual delivery, validate its duration and the preserved audio clock.
probe = json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(OUT)]))
run(["ffmpeg","-v","error","-i",str(OUT),"-f","null","-"])
final_audio = decode(OUT)
a = final_audio[insert:insert+len(speech)]
correlation = float(np.corrcoef(a,speech)[0,1])
assert correlation > .985
assert hashlib.sha256(AUDIO.read_bytes()).hexdigest() == source_hash
video_stream = next(s for s in probe["streams"] if s["codec_type"]=="video")
assert video_stream["width"]==W and video_stream["height"]==H
assert abs(float(probe["format"]["duration"])-duration) < .05

# Inspect frames decoded from the actual MP4, including the shot/caption boundaries.
sample_frames = [0,9,10,16,30,47,62,N-1]
thumbs = []
for i in sample_frames:
    raw = run(["ffmpeg","-v","error","-i",str(OUT),"-vf",
        f"select=eq(n\\,{i}),scale=640:360","-frames:v","1","-f","rawvideo","-pix_fmt","rgb24","-"])
    thumbs.append(Image.frombytes("RGB",(640,360),raw))
sheet = Image.new("RGB",(1280,4*392),(238,240,243))
label_font = ImageFont.truetype(str(FONT),22,index=2)
sd=ImageDraw.Draw(sheet)
for j,(i,im) in enumerate(zip(sample_frames,thumbs)):
    xx=(j%2)*640;yy=(j//2)*392
    sheet.paste(im,(xx,yy))
    sd.text((xx+14,yy+364),f"{i/FPS:.2f}s",font=label_font,fill=(20,30,45))
sheet.save(ROOT/"review_contact.jpg",quality=92)
frame(30).save(ROOT/"poster.jpg",quality=94)
(ROOT/"captions.srt").write_text(
    f"1\n{stamp(CAPTION_START)} --> {stamp(CAPTION_END)}\n{TEXT}\n",encoding="utf-8")
ledger = {
    "project":"KSNVE Python question scene",
    "scope":"Selected female question only; a local editing proof of concept",
    "method":"Python + Pillow + FFmpeg",
    "external_generation":False,"lip_sync_synthesis":False,
    "spoken_text":TEXT,
    "art_direction":"Photographic dialogue with restrained hard-cut emphasis and white/yellow Korean captions",
    "source_image":str(IMAGE.relative_to(BASE)),
    "source_audio":str(AUDIO.relative_to(BASE)),
    "source_audio_sha256":source_hash,
    "source_audio_duration_seconds":source_duration,
    "audio_speed":1.0,"pitch_processing":"none","audio_gain_db":-2,
    "audio_start_seconds":OFFSET,
    "video":{"file":OUT.name,"width":W,"height":H,"fps":FPS,"frames":N,
             "duration_seconds":duration,"codec":"H.264","audio_codec":"AAC"},
    "shots":[{"start_frame":0,"end_frame":CLOSEUP_FRAME,"view":"cafe two-shot"},
             {"start_frame":CLOSEUP_FRAME,"end_frame":N,"view":"woman close-up",
              "motion":"six-frame settling push from width 1160 to 1120; then fixed"}],
    "caption":{"text":TEXT,"mode":"phrase","start_seconds":CAPTION_START,
               "end_seconds":CAPTION_END,"bounds":caption_bounds,
               "timing_basis":"Decoded source envelope with readable tail; no word-level claims"},
    "verification":{"full_decode_passed":True,"original_audio_preserved":True,
                    "source_final_audio_correlation":correlation,
                    "decoded_audio_peak":float(np.max(np.abs(final_audio))),
                    "audible_quality_review":"not_performed",
                    "visual_review":"contact sheet prepared, pending inspection"},
    "limitations":["This is an animated still-image edit. Mouth and facial performance are not synthesized.",
                   "Audible naturalness has not been independently checked."],
    "render_command":"python3 render_video.py"
}
(ROOT/"production.json").write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"output":str(OUT),"duration":duration,"audio_correlation":correlation,
    "caption_start":CAPTION_START,"caption_end":CAPTION_END,
    "contact_sheet":str(ROOT/"review_contact.jpg")},ensure_ascii=False))

