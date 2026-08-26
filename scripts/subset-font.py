"""Subset Pretendard to the characters this app actually renders.

The full variable font is ~2 MB, which is a poor trade on saturated
conference wifi. Everything the app shows comes from data/ and the UI
strings, so the glyph set is knowable at build time. KS X 1001's 2,350
Hangul syllables are kept as a safety net for text added later
(e.g. announcements pulled from the organiser's spreadsheet).
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
chars = set()

for path in (ROOT / 'data').glob('*.json'):
    chars |= set(json.dumps(json.loads(path.read_text()), ensure_ascii=False))
for pattern in ('app/**/*.tsx', 'components/*.tsx', 'lib/*.ts'):
    for path in ROOT.glob(pattern):
        chars |= set(path.read_text())

# ASCII, common punctuation and symbols the UI uses
chars |= set(''.join(chr(c) for c in range(0x20, 0x7F)))
chars |= set('·…—–‘’“”₩°±×÷≤≥→←↑↓•※◦㎜㎝㎞㎡㎥㏊℃㎈㎉㎧㎨㎩㎪㏈')
# KS X 1001 Hangul syllable block (the 2,350 syllables Korean typesetting assumes)
try:
    for lead in range(0xB0, 0xC9):
        for trail in range(0xA1, 0xFF):
            try:
                chars.add(bytes([lead, trail]).decode('euc-kr'))
            except UnicodeDecodeError:
                pass
except Exception:
    pass

chars = {c for c in chars if c.isprintable() and not (0xD800 <= ord(c) <= 0xDFFF)}
text = ''.join(sorted(chars))
(ROOT / 'scripts' / '.font-charset.txt').write_text(text, encoding='utf-8')
print(f'charset: {len(chars)} characters')

src = ROOT / 'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2'
out = ROOT / 'app/fonts/PretendardVariable.subset.woff2'
if not src.exists():
    sys.exit('run `npm i pretendard` first')

subprocess.run([
    sys.executable, '-m', 'fontTools.subset', str(src),
    f'--text-file={ROOT / "scripts" / ".font-charset.txt"}',
    '--flavor=woff2', '--layout-features=*', '--no-hinting',
    '--desubroutinize', f'--output-file={out}',
], check=True)
print(f'{src.stat().st_size/1024:.0f} KB -> {out.stat().st_size/1024:.0f} KB')
