"""
Match the autumn extended abstracts (one PDF per paper) to the parsed
programme and extract their keywords + body text.

Input:
  data/papers.json                         programme metadata (parse-fall-program.py)
  source-pdf/확장요약문_세션별/**/*.pdf      one 1–2 page extended abstract per paper

Matching is global, not per folder: the folder names are spelled differently
from the programme's session names, and the file names carry only the
presenter (`{접수번호}_{발표자}.pdf`). Each PDF's title block is compared with
every programme title; a presenter-name hit adds a bonus; pairs are assigned
greedily, best score first, one PDF per paper. The folder is only used to
flag disagreements in the report.

Body text keeps the abstract proper. Left out: the title/author block, figure
labels and captions, affiliation/corresponding-author footnotes, research
funding statements and references.

Output:
  .paper-extraction/fall/abstracts.json      {paperId: {abstract, keywords, pageImage, ...}}
  .paper-extraction/fall/abstract-report.md  match + extraction review
  public/paper-pages/{paperId}.webp          page image (200dpi; 2-page PDFs stacked)

Then run scripts/assemble-fall-data.py.

Usage:
  python3 scripts/extract-fall-abstracts.py [--no-images]
"""
import argparse
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'source-pdf' / '확장요약문_세션별'
OUT_DIR = ROOT / '.paper-extraction' / 'fall'
PAGE_DIR = ROOT / 'public' / 'paper-pages'
DPI = 200
WEBP_QUALITY = 85
# files in the abstract folders that are not abstracts
NOT_ABSTRACTS = {
    '전자,건축,모빌리티 교류세션[1]/261_이태근.pdf': '저작물 활용 동의서(확장요약문 아님)',
}
ACCEPT = 0.55          # below this a PDF is left unmatched
REVIEW = 0.80          # below this an accepted match is listed for a human check

KEYWORDS_RE = re.compile(r'^\s*(key\s*words?|keywords?|핵심어|주제어)\s*[:：]?\s*', re.I)
# the body ends at the references or the acknowledgement heading
END_RE = re.compile(r'^\s*[<(\[]?\s*(\d+\.\s*)?(참\s*고\s*문\s*헌|references?|후\s*기|사\s*사|감사의\s*글|a?c?knowledge?ments?)\b', re.I)
CAPTION_RE = re.compile(r'^\s*(fig\.?|figure|그림|table|표)\s*\d', re.I)
FOOTNOTE_RE = re.compile(r'^\s*(\*{1,3}|†|‡|§|#|¶)\s*\S')
# a funding note: "본 연구는 …의 재원으로 …의 지원을 받아" / "This work was supported by".
# Body sentences also open with "본 연구는", so the grant wording is what identifies it.
FUNDING_SENTENCE_RE = re.compile(
    r'[(\[]?\s*((본|이)\s*(연구|논문|결과물|성과물|성과|과제)(\([^)]*\))?\s*(는|은)\s.{0,60}'
    r'(재원|지원을|지원으로|지원받아|지원\s*하에|지원에\s*의해|과제의\s*(지원|결과|일환)|사업의\s*(지원|일환)|과제\s*\(|과제번호)'
    r'|this\s+(work|research|study|paper)\s+(was|is)\s+(partially\s+|partly\s+)?(supported|funded))',
    re.I,
)
GRANT_ID_RE = re.compile(r'과제번호|RS-\s*\d{4}|고유번호|grant\s+(no|number)|재원으로|지원을\s*받아\s*(수행|연구)|\(no\.\s*[a-z]*\d|에\s*의해\s*수행되었습니다|수행된\s*과제임', re.I)
SENTENCE_END_RE = re.compile(r'(\.|다|:|요)\s*$')
HEADING_RE = re.compile(r'^\s*((\d+(\.\d+)*|[IVX]+)[.)]?\s+\S|[<\[【].{1,30}[>\]】]\s*$|[가-힣 ·]{1,12}$|(introduction|conclusions?|methods?|results?|discussion|summary|background)\b)', re.I)
AFFILIATION_RE = re.compile(r'교신저자|e-?mail\s*:|corresponding\s+author|정회원|학생회원|회원,', re.I)
AFFILIATION_PARA_RE = re.compile(r'대학교|university|연구원|department|company|institute|학부|학과|㈜|\(주\)', re.I)
SENTENCE_RE = re.compile(r'다\.|\.\s+[A-Z가-힣]')
HANGUL = re.compile(r'[가-힣]')


def norm(text: str) -> str:
    text = unicodedata.normalize('NFKC', text).lower()
    return re.sub(r'[^0-9a-z가-힣]', '', text)


def bigrams(text: str) -> set[str]:
    t = norm(text)
    return {t[i:i + 2] for i in range(len(t) - 1)}


def containment(title: str, header_grams: set[str]) -> float:
    grams = bigrams(title)
    return len(grams & header_grams) / len(grams) if grams else 0.0


def span_text(span) -> str:
    """A few PDFs drop the space glyphs from Korean text, leaving only a wider
    advance between words. Put a space back wherever the gap between two
    characters is clearly wider than the span's usual letter spacing."""
    chars = span['chars']
    text = ''.join(c['c'] for c in chars)
    if len(chars) < 8 or text.count(' ') / len(chars) > 0.06:
        return text
    gaps = [b['bbox'][0] - a['bbox'][2] for a, b in zip(chars, chars[1:])]
    usual = sorted(gaps)[len(gaps) // 2]
    out = chars[0]['c']
    for gap, c in zip(gaps, chars[1:]):
        if gap - usual > span['size'] * 0.18 and not out.endswith(' ') and c['c'] != ' ':
            out += ' '
        out += c['c']
    return out


# Equations typed in the HWP / Hancom equation editor come out in its own font
# with every symbol on a private-use code point instead of the real character.
# Both fonts share one regular layout, worked out from rendering each glyph.
EQ_FONT_RE = re.compile(r'HancomEQN|HyhwpEQ', re.I)
GREEK = 'αβγδεζηθικλμνξοπρστυφχψω'
EQ_SYMBOLS = {
    0xe03d: '0', 0xe044: '(', 0xe045: ')', 0xe046: '−', 0xe047: '=', 0xe048: '+', 0xe04d: '|',
    0xe052: ',', 0xe053: '.', 0xe054: '/', 0xe05b: '∫', 0xe067: '∑', 0xe0c4: '∂', 0xe101: '|',
    0xe05f: '\u0307', 0xe060: '\u0308',  # dot / double dot over the next letter (u̇, ü)
}
# Symbol / Wingdings put their glyphs at U+F000 + the 8-bit code
SYMBOL_FONT = {'a': 'α', 'b': 'β', 'g': 'γ', 'd': 'δ', 'e': 'ε', 'z': 'ζ', 'h': 'η', 'q': 'θ', 'k': 'κ',
               'l': 'λ', 'm': 'μ', 'n': 'ν', 'p': 'π', 'r': 'ρ', 's': 'σ', 't': 'τ', 'f': 'φ', 'c': 'χ',
               'y': 'ψ', 'w': 'ω', 'D': 'Δ', 'F': 'Φ', 'G': 'Γ', 'L': 'Λ', 'P': 'Π', 'S': 'Σ', 'W': 'Ω'}
SUPERSCRIPT = str.maketrans('0123456789+−=()ni', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ')
SUBSCRIPT = str.maketrans('0123456789+−=()aehijklmnoprstuvx', '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ')


def eq_char(code: int) -> str:
    if 0xe000 <= code <= 0xe019:
        return chr(ord('A') + code - 0xe000)
    if 0xe0e5 <= code <= 0xe0fe:
        return chr(ord('a') + code - 0xe0e5)
    if 0xe034 <= code <= 0xe03c:
        return str(code - 0xe033)
    if 0xe09d <= code <= 0xe0b4:
        return GREEK[code - 0xe09d]
    return EQ_SYMBOLS.get(code, '')  # unidentified glyphs are dropped rather than shown as boxes


def decode_private_use(span) -> str:
    """Real characters for a span's private-use glyphs; other text untouched."""
    text = span['text']
    if not any('\ue000' <= ch <= '\uf8ff' for ch in text):
        return text
    font = span['font']
    out = []
    for ch in text:
        code = ord(ch)
        if not 0xe000 <= code <= 0xf8ff:
            out.append(ch)
        elif EQ_FONT_RE.search(font):
            out.append(eq_char(code))
        elif 'Symbol' in font and 0xf020 <= code <= 0xf0ff:
            out.append(SYMBOL_FONT.get(chr(code - 0xf000), ''))
        elif 'Wingdings' in font and code == 0xf09e:
            out.append('·')
    text = ''.join(out)
    # the accent glyph precedes its letter in the PDF; a combining mark follows it
    return re.sub(r'([\u0307\u0308])(\w)', r'\2\1', text)


def script_text(text: str, kind: str) -> str:
    """m³, ω₀ when every character has a Unicode super/subscript form;
    otherwise V_AC, λ_A0, e^(ikL) so the text still reads unambiguously."""
    text = text.replace(' ', '')
    table = SUPERSCRIPT if kind == 'sup' else SUBSCRIPT
    converted = text.translate(table)
    if all(a != b for a, b in zip(text, converted)):
        return converted
    mark = '^' if kind == 'sup' else '_'
    return f'{mark}({text})' if len(text) > 1 and kind == 'sup' else mark + text


def join_spans(spans) -> str:
    """Join a line's spans. Small equation spans sitting above or below the
    line's baseline become super/subscripts (m³/s, κᵥ); an equation set
    between Latin text and digits keeps a space on each side."""
    main = max(spans, key=lambda s: len(s['text'].strip()))
    base = main['origin'][1]
    ref = max(s['size'] for s in spans)  # equations are often set larger than the body
    parts: list[list] = []  # [kind, text]; adjacent scripts of one kind merge
    prev = None
    for s in spans:
        text = decode_private_use(s)
        is_eq = bool(EQ_FONT_RE.search(s['font']))
        kind = 'text'
        if is_eq and s['size'] < ref * 0.8 and text.strip():
            if s['origin'][1] < base - s['size'] * 0.2:
                kind = 'sup'
            elif s['origin'][1] > base + s['size'] * 0.2:
                kind = 'sub'
        if kind == 'text' and prev is not None and text and parts and (is_eq or prev['is_eq']) \
                and s['bbox'][0] - prev['bbox'][2] > 0.45:
            last = parts[-1][1]
            if last and last[-1].isascii() and last[-1].isalnum() and text[0].isascii() and text[0].isalnum():
                text = ' ' + text
        if parts and parts[-1][0] == kind and kind != 'text':
            parts[-1][1] += text
        else:
            parts.append([kind, text])
        prev = {'bbox': s['bbox'], 'is_eq': is_eq}
    return ''.join(text if kind == 'text' else script_text(text, kind) for kind, text in parts)


def page_lines(page):
    """Lines as dicts: text (spans joined), size (dominant by chars), bbox."""
    out = []
    for block in page.get_text('rawdict')['blocks']:
        if block['type'] != 0:
            continue
        for line in block['lines']:
            for s in line['spans']:
                s['text'] = span_text(s)
            text = join_spans(line['spans'])
            if not text.strip():
                continue
            weight = Counter()
            for s in line['spans']:
                weight[round(s['size'], 1)] += len(s['text'].strip())
            size = weight.most_common(1)[0][0] if weight else 0
            out.append({'text': text, 'size': size, 'x0': line['bbox'][0], 'y0': line['bbox'][1],
                        'x1': line['bbox'][2], 'y1': line['bbox'][3], 'page': page.number,
                        'weight': weight})
    return merge_rows(out)


def merge_rows(lines):
    """Some PDFs break one printed line into several pieces (e.g. the keyword line
    split word by word, each with its own baseline). Pieces that share a baseline
    and sit close together horizontally are joined back into one line."""
    lines = sorted(lines, key=lambda l: (round(l['y1']), l['x0']))
    merged = []
    for l in lines:
        prev = merged[-1] if merged else None
        if prev and abs(prev['y1'] - l['y1']) < 2.5 and 0 <= l['x0'] - prev['x1'] < 12 \
                and abs(prev['size'] - l['size']) < 1:
            sep = '' if prev['text'].endswith(' ') or l['text'].startswith(' ') else ' '
            prev['text'] += sep + l['text']
            prev['x1'] = l['x1']
            prev['y0'] = min(prev['y0'], l['y0'])
            prev['weight'] = prev['weight'] + l['weight']
            prev['size'] = prev['weight'].most_common(1)[0][0]
        else:
            merged.append(dict(l))
    return merged


def join(lines: list[str]) -> str:
    """Korean text here wraps mid-word: a line that ends without a trailing space
    continues the same word on the next line."""
    out = ''
    prev_raw = ''
    for raw in lines:
        cur = raw.strip()
        if not cur:
            continue
        if not out:
            out = cur
        elif prev_raw.endswith((' ', '　')):
            out += ' ' + cur
        elif HANGUL.match(out[-1]) and HANGUL.match(cur[0]):
            out += cur
        elif out.endswith('-') and cur[:1].islower():
            out += cur
        else:
            out += ' ' + cur
        prev_raw = raw
    return re.sub(r'\s+', ' ', out).strip()


def split_keywords(text: str) -> list[str]:
    parts, depth, cur = [], 0, ''
    for ch in text:
        if ch in '([':
            depth += 1
        elif ch in ')]':
            depth = max(0, depth - 1)
        if ch in ',;' and depth == 0:
            parts.append(cur)
            cur = ''
        else:
            cur += ch
    parts.append(cur)
    out = []
    for p in parts:
        # "Early Warning( )": the Korean gloss did not come through
        p = re.sub(r'\(\s*\)', '', p)
        if p.count('(') > p.count(')'):
            p = p[:p.rfind('(')]
        p = p.strip(' .')
        if p:
            out.append(p)
    return out


def extract(pdf: Path) -> dict:
    doc = fitz.open(pdf)
    lines = [l for page in doc for l in page_lines(page)]
    width = doc[0].rect.width

    sizes = Counter()
    for l in lines:
        if len(l['text'].strip()) >= 20:
            sizes[l['size']] += len(l['text'])
    body_size = sizes.most_common(1)[0][0] if sizes else 10

    def reading_order(l):
        return (l['page'], l['y0'], l['x0'])

    ordered = sorted(lines, key=reading_order)
    kw_idx = next((i for i, l in enumerate(ordered) if KEYWORDS_RE.match(l['text'])), None)

    # header (title block) = large lines before the keywords, used for matching
    head_end = kw_idx if kw_idx is not None else min(len(ordered), 6)
    header = ' '.join(l['text'] for l in ordered[:head_end])
    title_lines = [l['text'] for l in ordered[:head_end] if l['size'] >= body_size * 1.25]

    keywords: list[str] = []
    body_start = 0
    if kw_idx is not None:
        kw = ordered[kw_idx]
        kw_lines = [KEYWORDS_RE.sub('', kw['text'], count=1)]
        j = kw_idx + 1
        # continuation: same size, directly below, before the body starts
        # keywords run to two lines at most; a numbered heading or a finished
        # sentence means the body has started even when it shares the font size
        while j < len(ordered) and j - kw_idx <= 2 and abs(ordered[j]['size'] - kw['size']) < 0.15 \
                and not re.match(r'^\s*(\d+|[IVX]+)\.\s', ordered[j]['text']) \
                and not re.search(r'다\.', ordered[j]['text']) \
                and ordered[j]['y0'] - ordered[j - 1]['y1'] < kw['size'] * 0.9 \
                and ordered[j]['page'] == kw['page']:
            kw_lines.append(ordered[j]['text'])
            j += 1
        keywords = split_keywords(join(kw_lines))
        body_start = j

    # body: body-sized lines after the keywords; stop at references; skip captions,
    # footnotes and funding/affiliation notes (a note can wrap onto following lines)
    candidates = [l for l in ordered[body_start:] if abs(l['size'] - body_size) <= 0.6]
    two_col = sum(1 for l in candidates if l['x0'] > width * 0.45) > len(candidates) * 0.25
    if two_col:
        mid = width / 2
        candidates.sort(key=lambda l: (l['page'], l['x0'] >= mid, l['y0']))

    # text inside a figure or table (labels, axis ticks, cell values) is not body text
    figures = {}
    for page in doc:
        area = page.rect.width * page.rect.height
        rects = [fitz.Rect(i['bbox']) for i in page.get_image_info()]
        try:
            rects += page.cluster_drawings()
        except AttributeError:
            pass
        figures[page.number] = [r for r in rects if r.width * r.height < area * 0.4 and r.width > 30 and r.height > 30]

    def in_figure(l):
        cx, cy = (l['x0'] + l['x1']) / 2, (l['y0'] + l['y1']) / 2
        return any(r.x0 <= cx <= r.x1 and r.y0 <= cy <= r.y1 for r in figures[l['page']])

    candidates = [l for l in candidates if not in_figure(l)]

    paragraphs: list[list[dict]] = []
    note_line = None  # last line of the caption/footnote being skipped
    # the body's left margin: where most lines start (an indented first line starts further right)
    left = Counter(round(c['x0']) for c in candidates).most_common(1)[0][0] if candidates else 0
    right = sorted(c['x1'] for c in candidates)[int(len(candidates) * 0.9)] if candidates else 0
    # line spacing differs between templates; a paragraph break is a gap clearly
    # wider than this file's usual one
    line_gaps = sorted(b['y0'] - a['y1'] for a, b in zip(candidates, candidates[1:])
                       if a['page'] == b['page'] and 0 <= b['y0'] - a['y1'] < body_size * 3)
    usual_gap = line_gaps[len(line_gaps) // 2] if line_gaps else body_size * 0.5
    para_gap = max(body_size * 1.1, usual_gap + body_size * 0.6)
    for l in candidates:
        text = l['text'].strip()
        if END_RE.match(text):
            break
        if note_line is not None and l['page'] == note_line['page'] \
                and 0 <= l['y0'] - note_line['y1'] < body_size * 0.9:
            note_line = l
            continue  # wrapped tail of a note
        note_line = None
        if CAPTION_RE.match(text) or FOOTNOTE_RE.match(text) or AFFILIATION_RE.search(text) \
                or FUNDING_SENTENCE_RE.match(text) or GRANT_ID_RE.match(text):
            note_line = l
            continue
        prev = paragraphs[-1][-1] if paragraphs and paragraphs[-1] else None
        gap = l['y0'] - prev['y1'] if prev and prev['page'] == l['page'] else 99
        # Many templates indent a new paragraph by only half a character (~4pt);
        # that small indent counts when the line before it ended the paragraph
        # (a finished sentence, or a line stopping well short of the right margin).
        indent = l['x0'] - left
        prev_ended = prev is not None and (SENTENCE_END_RE.search(prev['text'].strip())
                                           or prev['x1'] < right - body_size * 2)
        new_para = (prev is None or gap > para_gap
                    or (not two_col and (indent > body_size * 0.6
                                         or (indent > body_size * 0.3 and prev_ended))))
        if new_para:
            paragraphs.append([l])
        else:
            paragraphs[-1].append(l)

    paras = [join([l['text'] for l in p]) for p in paragraphs]
    # "서론" + "1." printed as two lines → "1. 서론"
    paras = [re.sub(r'^(.{1,30}?)\s+(\d+)\.$', r'\2. \1', p) for p in paras]
    # a funding note can follow the body's last sentence in the same paragraph
    paras = [p[:m.start()].rstrip() if (m := FUNDING_SENTENCE_RE.search(p)) else p for p in paras]
    # a sentence split by a tall formula or a subscript line continues the paragraph before it
    merged: list[str] = []
    for p in paras:
        if merged and not SENTENCE_END_RE.search(merged[-1]) and not HEADING_RE.match(merged[-1]) \
                and not HEADING_RE.match(p) and SENTENCE_END_RE.search(p) and len(p) < 40:
            merged[-1] = join([merged[-1] + ' ', p])
        else:
            merged.append(p)
    paras = [p for p in merged if re.search(r'[^\W_]', p) and not AFFILIATION_RE.search(p)
             and not (GRANT_ID_RE.search(p) and len(p) < 400)
             and not (AFFILIATION_PARA_RE.search(p) and not SENTENCE_RE.search(p))]
    # Fonts without a Unicode map come out as private-use glyphs or bare punctuation.
    def readable(p):
        letters = sum(1 for ch in p if ch.isalnum() and not ('' <= ch <= ''))
        return letters / max(1, len(p.replace(' ', ''))) >= 0.6
    total_chars = sum(len(p) for p in paras) or 1
    unreadable = sum(len(p) for p in paras if not readable(p))
    # leftover figure labels and table cells: short, no sentence ending, not a heading
    paras = [p for p in paras if readable(p)
             and (len(p) >= 40 or SENTENCE_END_RE.search(p) or HEADING_RE.match(p))
             and not (len(p) < 15 and p.endswith(').'))]
    # body text set in outlines or an embedded image leaves only the small
    # footnote text behind; that is not an abstract
    abstract = '\n\n'.join(paras) if body_size >= 8.5 else ''
    # some exports lay the text down twice (and shuffle the punctuation), or map
    # glyphs to nothing; the page image is fine but the text layer is unusable
    texts = [l['text'].strip() for l in candidates if len(l['text'].strip()) > 10]
    repeated = sum(c for c in Counter(texts).values() if c > 1)
    broken = (bool(texts) and repeated / len(texts) > 0.2) or unreadable / total_chars > 0.2
    # punctuation shaken loose from its sentence (" . " / " , ") marks an export whose
    # text runs are out of order; many tiny fragments mark inline equations that
    # did not come out as text, leaving sentences with holes in them
    stray = len(re.findall(r'(?<=\s)[.,](?=\s)', abstract))
    fragments = sum(1 for p in paras if len(p) < 20 and not re.match(r'^\s*((\d+(\.\d+)*|[IVX]+)[.)]?\s|[<\[【])', p))
    broken = broken or stray >= 3 or fragments >= 6
    if broken:
        abstract = ''
    return {
        'header': header,
        'title_lines': title_lines,
        'keywords': keywords,
        'abstract': abstract,
        'pages': doc.page_count,
        'body_size': body_size,
        'two_column': two_col,
        'broken_text': broken,
    }


def presenter_hint(pdf: Path) -> str:
    parts = [unicodedata.normalize('NFC', x) for x in pdf.relative_to(SOURCE).parts]
    if parts[0] == '키노트' and len(parts) >= 3:
        return parts[-2]
    stem = unicodedata.normalize('NFC', pdf.stem)
    m = re.match(r'^\d+_(.+)$', stem)
    if m:
        return m.group(1).strip()
    return stem.rsplit('_', 1)[-1].strip() if '_' in stem else ''


def render(pdf: Path, out: Path) -> None:
    from PIL import Image
    doc = fitz.open(pdf)
    pages = []
    for page in doc:
        # a second page holding only overflowed affiliation footnotes, or nothing, is left off
        if page.number > 0 and len(page.get_text().strip()) < 300 and not page.get_images():
            continue
        pix = page.get_pixmap(dpi=DPI)
        pages.append(Image.frombytes('RGB', (pix.width, pix.height), pix.samples))
    w = max(p.width for p in pages)
    canvas = Image.new('RGB', (w, sum(p.height for p in pages)), 'white')
    y = 0
    for p in pages:
        canvas.paste(p, (0, y))
        y += p.height
    canvas.save(out, 'WEBP', quality=WEBP_QUALITY, method=6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-images', action='store_true')
    args = ap.parse_args()

    papers = json.loads((ROOT / 'data' / 'papers.json').read_text(encoding='utf-8'))
    pdfs = sorted(p for p in SOURCE.rglob('*.pdf') if not p.name.startswith('.'))

    skipped, extracted = [], {}
    for pdf in pdfs:
        rel = str(pdf.relative_to(SOURCE))
        if unicodedata.normalize('NFC', rel) in NOT_ABSTRACTS:
            skipped.append((rel, NOT_ABSTRACTS[unicodedata.normalize('NFC', rel)]))
            continue
        try:
            doc = fitz.open(pdf)
            if doc.needs_pass:
                skipped.append((rel, '암호 설정'))
                continue
            if 'Microsoft Information Protection' in doc[0].get_text():
                skipped.append((rel, 'Microsoft 정보 보호(MIP) 암호화 — 내용 열람 불가'))
                continue
        except Exception as e:  # damaged file
            skipped.append((rel, f'열기 실패: {e}'))
            continue
        info = extract(pdf)
        info['hint'] = presenter_hint(pdf)
        info['folder'] = pdf.relative_to(SOURCE).parts[0]
        info['grams'] = bigrams(' '.join(info['title_lines']) + ' ' + info['header'])
        extracted[rel] = info

    # score every (pdf, paper) pair
    pairs = []
    for rel, info in extracted.items():
        for p in papers:
            s = containment(p['title'], info['grams'])
            if s < 0.3:
                continue
            hint = norm(info['hint'])
            if hint and hint == norm(p['presenter']):
                s += 0.3
            elif hint and hint in norm(p['authors']):
                s += 0.15
            elif hint:
                s -= 0.3
            pairs.append((s, rel, p['id']))
    pairs.sort(reverse=True)

    taken_pdf, taken_paper, match = set(), set(), {}
    for s, rel, pid in pairs:
        if rel in taken_pdf or pid in taken_paper or s < ACCEPT:
            continue
        taken_pdf.add(rel)
        taken_paper.add(pid)
        match[pid] = (rel, s)

    # Titles revised after the programme went to print no longer match. Pair what is
    # left by presenter name when that name points at exactly one remaining paper.
    by_presenter: dict[str, list[str]] = {}
    for p in papers:
        if p['id'] not in taken_paper:
            by_presenter.setdefault(norm(p['presenter']), []).append(p['id'])
    hint_count = Counter(norm(extracted[r]['hint']) for r in extracted if r not in taken_pdf)
    title_differs = set()
    for rel, info in extracted.items():
        hint = norm(info['hint'])
        if rel in taken_pdf or not hint or hint_count[hint] != 1 or len(by_presenter.get(hint, [])) != 1:
            continue
        pid = by_presenter[hint][0]
        taken_pdf.add(rel)
        taken_paper.add(pid)
        match[pid] = (rel, 0.0)
        title_differs.add(pid)

    by_id = {p['id']: p for p in papers}
    PAGE_DIR.mkdir(parents=True, exist_ok=True)
    result, review, empties, folder_diff = {}, [], [], []
    for pid, (rel, score) in sorted(match.items()):
        info = extracted[rel]
        paper = by_id[pid]
        image = f'/paper-pages/{pid}.webp'
        if not args.no_images:
            render(SOURCE / rel, PAGE_DIR / f'{pid}.webp')
        result[pid] = {
            'abstract': info['abstract'],
            'keywords': info['keywords'],
            'pageImage': image,
            'sourcePdf': rel,
            # image-only: the page image is shown, but there is no text to show beside it
            'extractionStatus': 'pdf-text' if info['abstract'] else 'image-only',
        }
        if pid in title_differs:
            pdf_title = re.sub(r'\s+', ' ', ' '.join(info['title_lines'][:2])).strip() or '(텍스트 없음)'
            review.append(f'- {pid} (발표자명으로 연결) 프로그램: {paper["title"]} / 요약문: {pdf_title}  ←  {rel}')
        elif score < REVIEW:
            review.append(f'- {pid} ({score:.2f}) {paper["title"]}  ←  {rel}')
        if len(info['abstract']) < 200 or not info['keywords']:
            why = ' (텍스트 레이어 중복·깨짐 → 원문 이미지만)' if info['broken_text'] else ''
            empties.append(f'- {pid} 초록 {len(info["abstract"])}자 · 키워드 {len(info["keywords"])}개{why} — {rel}')
        folder_norm = norm(re.sub(r'\[\d+\]', '', info['folder']))
        session_norm = norm(re.sub(r'^(기획|부문|특별)\s+|\s*\[\d+\]', '', paper['session']).split(' ; ')[0])
        poster = paper['id'].startswith('poster-')
        if not poster and info['folder'] != '키노트' and not (folder_norm in session_norm or session_norm in folder_norm):
            folder_diff.append(f'- {pid} 세션 "{paper["session"]}" ↔ 폴더 "{info["folder"]}"')

    unmatched_pdfs = [r for r in extracted if r not in taken_pdf]
    missing = [p for p in papers if p['id'] not in match]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / 'abstracts.json').write_text(json.dumps(result, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    report = [
        '# 확장요약문 매칭·추출 리포트',
        '',
        f'- PDF {len(pdfs)}개 → 읽음 {len(extracted)} · 제외 {len(skipped)}',
        f'- 매칭 {len(match)}건 / 논문 {len(papers)}건 — 확장요약문 없음 {len(missing)}건 · 매칭 안 된 PDF {len(unmatched_pdfs)}개',
        '',
        '## 제외한 PDF', *(f'- {r} — {why}' for r, why in skipped), *([] if skipped else ['- 없음']),
        '',
        '## 매칭 안 된 PDF', *(f'- {r} (발표자 추정: {extracted[r]["hint"]})' for r in unmatched_pdfs), *([] if unmatched_pdfs else ['- 없음']),
        '',
        '## 확장요약문이 없는 논문 (프로그램 정보만 표시)',
        *(f'- {p["id"]} {p["session"]} {p["time"]} {p["presenter"]} — {p["title"]}' for p in missing),
        '',
        f'## 점수가 낮아 확인이 필요한 매칭 (< {REVIEW})', *review, *([] if review else ['- 없음']),
        '',
        '## 초록이 짧거나 키워드가 없는 건', *empties, *([] if empties else ['- 없음']),
        '',
        '## 폴더와 세션이 다른 매칭 (참고용)', *folder_diff, *([] if folder_diff else ['- 없음']),
    ]
    (OUT_DIR / 'abstract-report.md').write_text('\n'.join(report) + '\n', encoding='utf-8')
    print('\n'.join(report[2:4]))
    print(f'확인 필요 {len(review)} · 짧은 초록 {len(empties)} · 폴더 불일치 {len(folder_diff)} → {OUT_DIR / "abstract-report.md"}')


if __name__ == '__main__':
    main()
