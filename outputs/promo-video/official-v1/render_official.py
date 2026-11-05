"""KSNVE Official 로고송 영상 (A안: 로고 모션그래픽).

  python render_official.py --format 16x9            # 전체 렌더
  python render_official.py --format 9x16
  python render_official.py --format 16x9 --stills 5,12,40   # 해당 초의 정지 화면만 PNG로

필요: numpy, pillow, librosa (~/.venvs/whisper), ffmpeg.
가사 시점은 lyrics_timing.json 에서 읽는다.
"""
import argparse, json, math, subprocess, sys
from functools import lru_cache
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
AUDIO = REPO.parent / "KSNVE Music" / "KSNVE official.mp3"
COVER = ROOT / "assets" / "ksnve_logo_cover.png"
TIMING = json.loads((ROOT / "lyrics_timing.json").read_text())
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FPS, SS, DUR = 30, 2, 48.6
N = round(DUR * FPS)

TEAL = (80, 148, 174)
INK = (26, 25, 25)
URL = "www.ksnve.or.kr"

# ---- 로고 심볼 기하 (커버 이미지 픽셀 단위로 측정) ----
SYM_C = (702.0, 461.5)                      # 심볼 중심
LOCK_C = (702.0, 643.0)                     # 심볼+글자 전체 중심
BAR_X = [701, 813.5, 925.5, 1037, 1149, 1261]
BAR_H = [405.5, 285, 148, 88, 40, 32]       # 반높이
BAR_W = 65
RING_C = (645.0, 461.5)

LAYOUT = {
    "16x9": dict(W=1920, H=1080,
                 intro=(960, 500, 0.62), verse=(960, 330, 0.42), outro=(960, 361, 0.60),
                 lyric_y=770, lyric_px=104, name_px=124, url_y=905, url_px=46),
    "9x16": dict(W=1080, H=1920,
                 intro=(540, 900, 0.70), verse=(540, 700, 0.62), outro=(540, 829, 0.72),
                 lyric_y=1290, lyric_px=84, name_px=100, url_y=1475, url_px=50),
}

# ---- 시간표 ----
LINES = TIMING["lines"]
LYR_END = TIMING["lyrics_end"]
MOVE_IN = (8.5, 9.4)        # 인트로 위치 → 가사 위치
MOVE_OUT = (38.0, 39.6)     # 가사 위치 → 로고 잠금 위치
TEXT_IN = (39.3, 40.5)
URL_IN = (40.5, 41.3)
FADE_OUT = (47.9, 48.6)


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, a, b):
    return clamp((t - a) / (b - a))


def ease_io(p):
    return p * p * (3 - 2 * p)


def ease_out(p):
    return 1 - (1 - p) ** 3


def ease_back(p, k=1.6):
    p -= 1
    return 1 + (k + 1) * p ** 3 + k * p ** 2


# ---- 오디오 분석 (메인 프로세스에서 1회) ----
def analyze():
    import librosa
    y, sr = librosa.load(str(AUDIO), sr=22050, mono=True)
    hop = sr // FPS
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))[:, :N]
    if S.shape[1] < N:
        S = np.pad(S, ((0, 0), (0, N - S.shape[1])))
    f = librosa.fft_frequencies(sr=sr, n_fft=2048)
    edges = [40, 120, 300, 800, 2000, 5000, 11000]
    bands = []
    for lo, hi in zip(edges[:-1], edges[1:]):
        e = 20 * np.log10(S[(f >= lo) & (f < hi)].mean(0) + 1e-7)
        lo_, hi_ = np.percentile(e, 10), np.percentile(e, 97)
        bands.append(np.clip((e - lo_) / (hi_ - lo_), 0, 1))
    bands = np.array(bands)
    sm = np.zeros_like(bands)          # 빠른 상승, 느린 하강
    for i in range(1, N):
        d = bands[:, i] - sm[:, i - 1]
        sm[:, i] = sm[:, i - 1] + np.where(d > 0, 0.6, 0.15) * d
    rms = 20 * np.log10(np.sqrt((S ** 2).mean(0)) + 1e-7)
    rms = np.clip((rms - np.percentile(rms, 10)) / (np.percentile(rms, 97) - np.percentile(rms, 10)), 0, 1)
    _, beats = librosa.beat.beat_track(y=y, sr=sr)
    beats = librosa.frames_to_time(beats, sr=sr)
    return dict(bands=sm, rms=rms, beats=beats)


# ---- 워커 상태 ----
G = {}


def init_worker(fmt, ana):
    L = LAYOUT[fmt]
    G.update(L=L, fmt=fmt, **ana)
    cover = np.asarray(Image.open(COVER).convert("RGB")).astype(np.float32)
    # 나팔(혼) 스프라이트: 열마다 내부 색을 쓰고, 흰 배경 대비로 알파를 복원
    x0, x1, y0, y1 = 100, 632, 150, 775
    crop = cover[y0:y1, x0:x1]
    inner = cover[int(SYM_C[1]), x0:x1]
    inner_l = inner.mean(1)
    lum = crop.mean(2)
    alpha = np.clip((255 - lum) / np.maximum(255 - inner_l, 1), 0, 1)
    alpha = np.clip((alpha - 0.06) / 0.94, 0, 1)   # 흰 배경 잡음 제거
    alpha[:, inner_l > 245] = 0
    rgba = np.dstack([np.broadcast_to(inner, crop.shape), alpha * 255]).astype(np.uint8)
    G["horn"] = Image.fromarray(rgba, "RGBA").resize((2 * (x1 - x0), 2 * (y1 - y0)), Image.LANCZOS)
    G["horn_org"] = (x0, y0)
    # 글자(사단법인/국문/영문) 스프라이트
    x0, x1, y0, y1 = 100, 1305, 850, 1245
    crop = cover[y0:y1, x0:x1]
    a = np.clip((255 - crop.mean(2)) / (255 - 26), 0, 1)
    a[np.abs(crop[..., 2] - crop[..., 0]) > 20] = 0   # 심볼(청록) 픽셀 제외
    rgba = np.dstack([np.full(a.shape + (3,), INK, np.float32), a * 255]).astype(np.uint8)
    G["text"] = Image.fromarray(rgba, "RGBA").resize((2 * (x1 - x0), 2 * (y1 - y0)), Image.LANCZOS)
    G["text_org"] = (x0, y0)
    # 배경 빛(저해상도, 매 프레임 확대)
    w, h = L["W"] // 8, L["H"] // 8
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy = L["verse"][0] / 8, L["verse"][1] / 8
    r = np.hypot(xx - cx, yy - cy) / (0.55 * max(w, h))
    G["glow"] = np.clip(1 - r, 0, 1) ** 2
    rng = np.random.default_rng(7)
    W, H = L["W"], L["H"]
    pts = np.column_stack([rng.uniform(0.08, 0.92, 16) * W,
                           L["lyric_y"] + rng.uniform(-0.17, 0.12, 16) * H])
    G["net"] = pts[np.argsort(pts[:, 0])]
    lines = [(np.hypot(*(pts[i] - pts[j])), i, j) for i in range(16) for j in range(i + 1, 16)]
    G["edges"] = [(i, j) for d, i, j in sorted(lines)[:26]]


@lru_cache(maxsize=8)
def font(px, idx=6):
    return ImageFont.truetype(FONT, px * SS, index=idx)


@lru_cache(maxsize=64)
def scaled(name, s):
    im = G[name]
    return im.resize((max(1, round(im.width * s / 2)), max(1, round(im.height * s / 2))), Image.LANCZOS)


# ---- 장면 상태 ----
def symbol_state(t):
    L = G["L"]
    a, b, c = L["intro"], L["verse"], L["outro"]
    p1 = ease_io(prog(t, *MOVE_IN))
    p2 = ease_io(prog(t, *MOVE_OUT))
    st = [a[k] + (b[k] - a[k]) * p1 for k in range(3)]
    st = [st[k] + (c[k] - st[k]) * p2 for k in range(3)]
    return st


def intro_times():
    bt = [x for x in G["beats"] if x > 1.95][:7]
    while len(bt) < 7:
        bt.append(bt[-1] + 0.9)
    return bt


def react_amp(t):
    if t < 7.4:
        return 0.0
    if t < MOVE_IN[1]:
        return 0.5 * prog(t, 7.4, 8.0) + 0.5 * prog(t, *MOVE_IN)
    return 1.0 - prog(t, MOVE_OUT[0], MOVE_OUT[1] - 0.2)


def ring_events():
    bt = G["beats"]
    ev = [(x, 0.18) for x in intro_times()]
    v1 = [x for x in bt if 9.2 <= x < 22.3][::2]
    v2 = [x for x in bt if 22.3 <= x < LYR_END]
    ev += [(x, 0.14) for x in v1]
    ev += [(x, 0.32 if 26.2 <= x < 29.6 else 0.18) for x in v2]
    ev.append((MOVE_OUT[1] - 0.1, 0.30))
    return ev


# ---- 그리기 ----
def to_screen(st, u, v):
    cx, cy, s = st
    return ((cx + (u - SYM_C[0]) * s) * SS, (cy + (v - SYM_C[1]) * s) * SS)


def draw_symbol(img, t, i_frame, st):
    cx, cy, s = st
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    times = intro_times()
    amp = react_amp(t)
    bands = G["bands"][:, min(i_frame, N - 1)]
    # 혼: 끝(왼쪽)에서부터 펼쳐짐
    p = ease_out(prog(t, times[0], times[0] + 0.7))
    if p > 0:
        horn = scaled("horn", s * SS)
        w = max(1, round(horn.width * p))
        piece = horn.crop((0, 0, w, horn.height))
        x, y = to_screen(st, *G["horn_org"])
        layer.alpha_composite(piece, (round(x), round(y)))
    for k in range(6):
        p = prog(t, times[k + 1], times[k + 1] + 0.45)
        if p <= 0:
            continue
        grow = ease_back(p)
        h = BAR_H[k] * grow * (1 + amp * 0.65 * (bands[k] - 0.45))
        h = max(h, BAR_W / 2 * min(1, grow))
        x0, y0 = to_screen(st, BAR_X[k] - BAR_W / 2, SYM_C[1] - h)
        x1, y1 = to_screen(st, BAR_X[k] + BAR_W / 2, SYM_C[1] + h)
        r = (x1 - x0) / 2
        if y1 - y0 < 2 * r:
            y0, y1 = (y0 + y1) / 2 - r, (y0 + y1) / 2 + r
        d.rounded_rectangle((x0, y0, x1, y1), radius=r, fill=TEAL + (255,))
    img.alpha_composite(layer)


def draw_fx(img, t, i_frame, st):
    L = G["L"]
    W, H = L["W"] * SS, L["H"] * SS
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    # 울림 고리
    rx, ry = to_screen(st, *RING_C)
    for t0, strength in G["rings"]:
        p = (t - t0) / 1.7
        if 0 <= p <= 1:
            r = (30 + 0.55 * max(L["W"], L["H"]) * ease_out(p)) * SS
            a = int(255 * strength * (1 - p) ** 1.6)
            d.ellipse((rx - r, ry - r, rx + r, ry + r), outline=TEAL + (a,), width=3 * SS)
    # 파동선: 소음과 진동을 넘어 ~ 더 나은 세상으로
    f = prog(t, 15.1, 15.8) * (1 - prog(t, 21.8, 22.4))
    if f > 0:
        rms = G["rms"][min(i_frame, N - 1)]
        base = (L["lyric_y"] + 115) * SS
        A = (14 + 46 * rms) * SS * f
        pts = []
        for x in np.linspace(0, W, 200):
            env = math.sin(math.pi * x / W)
            pts.append((x, base + A * env * math.sin(2 * math.pi * x / (W / 3.2) - 5.0 * t)))
        d.line(pts, fill=TEAL + (int(150 * f),), width=3 * SS, joint="curve")
    # 연결망: 지식과 기술을 이어
    f = prog(t, 29.5, 30.0) * (1 - prog(t, 34.3, 34.8))
    if f > 0:
        pts = G["net"] * SS
        q = prog(t, 29.6, 33.2)
        n = len(G["edges"])
        for k, (i, j) in enumerate(G["edges"]):
            e = clamp(q * n - k)
            if e <= 0:
                continue
            a, b = pts[i], pts[j]
            d.line((a[0], a[1], a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e),
                   fill=TEAL + (int(110 * f),), width=2 * SS)
        for k, (x, y) in enumerate(pts):
            r = 7 * SS * f
            d.ellipse((x - r, y - r, x + r, y + r), fill=TEAL + (int(170 * f),))
    img.alpha_composite(layer)


def draw_glow(img, t):
    f = prog(t, 34.4, 35.6) * (1 - prog(t, 37.4, 38.6))
    if f <= 0:
        return
    a = (G["glow"] * 0.22 * f * 255).astype(np.uint8)
    g = np.dstack([np.full(a.shape + (3,), TEAL, np.uint8), a])
    img.alpha_composite(Image.fromarray(g, "RGBA").resize(img.size, Image.BILINEAR))


def draw_lyrics(img, t):
    L = G["L"]
    W = L["W"] * SS
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for k, line in enumerate(LINES):
        t0 = line["t"] - 0.12
        t1 = LINES[k + 1]["t"] - 0.12 if k + 1 < len(LINES) else LYR_END
        if not (t0 <= t <= t1 + 0.05):
            continue
        exit_p = ease_io(prog(t, t1 - 0.28, t1))
        name = line.get("name", False)
        fnt = font(L["name_px"] if name else L["lyric_px"], 6)
        color = TEAL if name else INK
        text = line["text"]
        total = fnt.getlength(text)
        x0 = (W - total) / 2
        base = L["lyric_y"] * SS - exit_p * 26 * SS
        for i, ch in enumerate(text):
            if ch == " ":
                continue
            p = ease_out(prog(t, t0 + i * 0.035, t0 + i * 0.035 + 0.32))
            a = p * (1 - exit_p)
            if a <= 0:
                continue
            x = x0 + fnt.getlength(text[:i])
            y = base + (1 - p) * 34 * SS
            d.text((x, y), ch, font=fnt, fill=color + (int(255 * a),), anchor="ls")
    img.alpha_composite(layer)


def draw_lockup(img, t, st):
    L = G["L"]
    p = ease_out(prog(t, *TEXT_IN))
    if p > 0:
        tx = scaled("text", st[2] * SS)
        x, y = to_screen(st, *G["text_org"])
        piece = tx.copy()
        piece.putalpha(piece.getchannel("A").point(lambda v: int(v * p)))
        img.alpha_composite(piece, (round(x), round(y + (1 - p) * 24 * SS)))
    p = ease_out(prog(t, *URL_IN))
    if p > 0:
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        d.text((L["W"] * SS / 2, (L["url_y"] + (1 - p) * 16) * SS), URL,
               font=font(L["url_px"], 2), fill=TEAL + (int(255 * p),), anchor="mm")
        img.alpha_composite(layer)


def render(i):
    t = i / FPS
    L = G["L"]
    img = Image.new("RGBA", (L["W"] * SS, L["H"] * SS), (255, 255, 255, 255))
    st = symbol_state(t)
    draw_glow(img, t)
    draw_fx(img, t, i, st)
    draw_symbol(img, t, i, st)
    draw_lyrics(img, t)
    draw_lockup(img, t, st)
    out = img.convert("RGB").resize((L["W"], L["H"]), Image.LANCZOS)
    f = prog(t, *FADE_OUT)
    if f > 0:
        out = Image.blend(out, Image.new("RGB", out.size, (255, 255, 255)), ease_io(f))
    return out


def render_bytes(i):
    return render(i).tobytes()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", choices=LAYOUT, default="16x9")
    ap.add_argument("--stills")
    args = ap.parse_args()
    ana = analyze()
    init_worker(args.format, ana)
    G["rings"] = ring_events()
    ana["rings"] = G["rings"]
    L = LAYOUT[args.format]
    if args.stills:
        outdir = ROOT / "stills" / args.format
        outdir.mkdir(parents=True, exist_ok=True)
        for s in args.stills.split(","):
            i = round(float(s) * FPS)
            render(i).save(outdir / f"t{float(s):05.1f}.png")
        print("stills ->", outdir)
        return
    out = ROOT / f"KSNVE_official_{args.format}.mp4"
    ff = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{L['W']}x{L['H']}", "-r", str(FPS), "-i", "-",
        "-i", str(AUDIO), "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-c:a", "aac", "-b:a", "256k", "-t", str(DUR), "-movflags", "+faststart", str(out)],
        stdin=subprocess.PIPE)
    with Pool(9, initializer=_init_with_rings, initargs=(args.format, ana)) as pool:
        for k, buf in enumerate(pool.imap(render_bytes, range(N), chunksize=6)):
            ff.stdin.write(buf)
            if k % 150 == 0:
                print(f"{k}/{N}", flush=True)
    ff.stdin.close()
    if ff.wait():
        sys.exit("ffmpeg failed")
    print("->", out)


def _init_with_rings(fmt, ana):
    init_worker(fmt, {k: v for k, v in ana.items() if k != "rings"})
    G["rings"] = ana["rings"]


if __name__ == "__main__":
    main()
