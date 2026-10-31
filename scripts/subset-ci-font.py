"""Subset 고도M — the typeface of the KSNVE CI — to the characters the app
sets in it: the conference name and the home hero's date, venue, theme and
status badge. A few KB instead of a 2 MB Korean font.

The source font is not kept in the repo. Get GodoM.otf from NHN커머스's free
font page (design.godo.co.kr/custom/free-font.php, 고도체) and run:

    python3 scripts/subset-ci-font.py path/to/GodoM.otf

Add any new text to TEXT below when the hero copy changes.
"""
import pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

TEXT = (
    '2026 추계 소음진동 학술대회'                 # conference name (hero + every header)
    '11.25(수) – 28(토)'                          # hero date chip
    '여수 엑스포컨벤션센터'                        # hero venue chip
    '“지속 가능한 내일의 소음진동”'                # theme
    'D-0123456789 일차 진행 중 종료'               # status badge
    '2026. 11. 25.(수) ~ 28.(토) ·'                # link-preview image (app/opengraph-image.tsx)
)

if len(sys.argv) != 2:
    sys.exit(__doc__)
src = pathlib.Path(sys.argv[1])
# WOFF2 for the pages; TTF for the link-preview image, whose renderer (Satori)
# doesn't read WOFF2.
for flavor, out in (('woff2', ROOT / 'app/fonts/GodoM.subset.woff2'), (None, ROOT / 'app/fonts/GodoM.subset.ttf')):
    subprocess.run([
        sys.executable, '-m', 'fontTools.subset', str(src), f'--text={TEXT}',
        *([f'--flavor={flavor}'] if flavor else []),
        '--layout-features=*', '--no-hinting', f'--output-file={out}',
    ], check=True)
    print(f'{src.stat().st_size/1024:.0f} KB -> {out.name} {out.stat().st_size/1024:.1f} KB')
