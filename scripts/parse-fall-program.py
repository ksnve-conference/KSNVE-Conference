"""
Parse the autumn programme book (source-pdf/program.pdf) into the app's
session / paper / poster data.

Source sections (PDF page numbers, not the printed folios):
  42–68  세션별 발표논문  — sessions, papers, posters (the canonical names)
  37–41  발표자별 시간표  — cross-check only: per-slot presentation counts
  13–15  키노트 안내      — official keynote numbers (키노트[n]); not chronological,
                           so matched to the keynote papers by date/start/room

Session names follow the programme book exactly (the abstract folders use
slightly different spellings; those are matched back to these in step 2).

Writes:
  data/sessions.json   paper sessions
  data/papers.json     orals + posters, programme metadata only (input to
                       scripts/assemble-fall-data.py, which adds abstracts)
  .paper-extraction/fall/program-report.md

Poster blocks are listed in data/official-events.json (포스터 발표 [1]/[2]);
posters take their sessionId from there, so write that file first.

Usage:
  python3 scripts/parse-fall-program.py [--pdf source-pdf/program.pdf]
Requires poppler's `pdftotext` on PATH.
"""
import argparse
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAPER_PAGES = (42, 68)
PRESENTER_PAGES = (37, 41)
KEYNOTE_PAGES = (13, 15)
YEAR_MONTH = '2026-11'

# Programme-book room labels -> the venue names used across the app.
VENUE_ALIASES = [
    (re.compile(r'^LIG\s*D&A홀'), 'LIG D&A홀'),
    (re.compile(r'^컨퍼런스홀'), '컨퍼런스홀'),
    (re.compile(r'^세미나실\s*\[?(\d+)\]?'), None),  # -> 세미나실[n]
]

FURNITURE = [
    re.compile(r'2026년 추계 소음진동 학술대회 및 전시회│'),
    re.compile(r'첫 번째 저자가 발표자 임'),
    re.compile(r'^\s*┃?\s*\d*\s*$'),
    re.compile(r'^\s*┃'),
    re.compile(r'^\s*발표논문\s*$'),
    re.compile(r'세션/발표일시/논문제목'),
    re.compile(r'^\s*2026년 11월 2\d일\(.\)\s*$'),
]

SESSION_HEADER = re.compile(
    r'^\s*11월\s*(\d{1,2})일\((.)\)\s*(\d{2}:\d{2})~(\d{2}:\d{2}),\s*(.+?)(?:\s{2,}좌장\s*:\s*(.+?))?\s*$'
)
ORAL_START = re.compile(r'^\s*(\d{2}:\d{2})~(\d{2}:\d{2})\s*([+@*]?)\s*(.*)$')
POSTER_START = re.compile(r'^\s*(P\d{3})\s*([+@*]?)\s*(.*)$')
LABEL = re.compile(r'^(기획|부문|특별)\s+')

# Programme items that have a speaker slot but are not papers: absent from the
# 발표자별 시간표 and from the abstract folders. Kept out of the paper list.
NON_PAPER_TITLES = re.compile(r'^(축사|기획 취지 소개|토의\s*:.*|층간소음 연구소 소개)$')


def pdf_text(pdf: Path, first: int, last: int) -> str:
    return subprocess.run(
        ['pdftotext', '-layout', '-f', str(first), '-l', str(last), str(pdf), '-'],
        check=True, capture_output=True, text=True,
    ).stdout


def clean(value: str) -> str:
    return re.sub(r'\s+', ' ', value).strip()


def normalize_venue(raw: str) -> str:
    raw = clean(raw)
    for pattern, name in VENUE_ALIASES:
        m = pattern.match(raw)
        if m:
            return name if name else f'세미나실[{m.group(1)}]'
    return raw


def normalize_session_title(raw: str) -> str:
    """'기획   비선형진동[1]' -> '기획 비선형진동 [1]';  '바닥충격음[1] ; 일반/감성' keeps its subtitle."""
    title = clean(raw)
    title = re.sub(r'\s*\[(\d+)\]', r' [\1]', title)
    title = re.sub(r'\s*;\s*', ' ; ', title)
    return title


def session_category(title: str) -> str:
    """Filter group: drop the [n] counter and the ' ; subtitle' so numbered parts share one chip."""
    category = re.sub(r'\s*\[\d+\]', '', title)
    return category.split(' ; ')[0].strip()


AUTHOR_NAME = re.compile(r"^[A-Za-z가-힣.\-' ]{1,30}$")


def names_only(line: str) -> bool:
    """A wrapped author list's first line: 'A, B, C,' — names, no affiliation yet."""
    text = clean(line)
    parts = [p.strip() for p in text.split(',') if p.strip()]
    return text.endswith(',') and len(parts) >= 2 and all(AUTHOR_NAME.match(p) for p in parts)


def looks_like_authors(line: str) -> bool:
    """'김진욱, Haseeb Khan(경북대)' — comma-separated short names, at least one (affiliation)."""
    if '(' not in line or ')' not in line:
        return False
    names = re.sub(r'\([^)]*\)', '', line)
    parts = [p.strip() for p in names.split(',') if p.strip()]
    return bool(parts) and all(AUTHOR_NAME.match(p) for p in parts)


def affiliations(authors: str) -> list[str]:
    values: list[str] = []
    for m in re.finditer(r'\(([^)]+)\)', authors):
        for v in re.split(r'[,;/]', m.group(1)):
            v = v.strip()
            if v and v not in values:
                values.append(v)
    return values


def presenter_of(authors: str) -> str:
    return clean(re.sub(r'\(.*', '', authors.split(',')[0]))


def join_title(parts: list[str]) -> str:
    out = ''
    for part in parts:
        part = clean(part)
        if not out:
            out = part
        elif out.endswith('-'):
            out += part
        else:
            out += ' ' + part
    return out


def parse_entries(lines: list[str], start: re.Pattern, notes: list[str], where: str):
    """Group a session's lines into entries; returns dicts with title/authors/flag/keynote."""
    groups: list[tuple[re.Match, list[str]]] = []
    for line in lines:
        m = start.match(line)
        if m:
            groups.append((m, []))
        elif groups:
            groups[-1][1].append(line)
        else:
            notes.append(f'{where}: 항목 앞의 해석 안 된 줄 — {clean(line)!r}')

    entries = []
    for m, rest in groups:
        rest = [r for r in rest if clean(r)]
        keynote = any(clean(r).upper() == 'KEYNOTE' for r in rest)
        rest = [r for r in rest if clean(r).upper() != 'KEYNOTE']
        author_at = next((i for i, r in enumerate(rest) if looks_like_authors(r)), None)
        # an author list that wrapped: 'A, B, C,' then 'D, E(소속)' — start at the first half
        while author_at and names_only(rest[author_at - 1]):
            author_at -= 1
        head = m.group(m.lastindex)
        if NON_PAPER_TITLES.match(clean(head)):
            notes.append(f'{where}: 논문 아닌 진행 항목 제외 — {clean(head)!r}')
            continue
        if author_at is None:
            notes.append(f'{where}: 발표자 없는 항목(논문 아님) — {clean(head)!r} {[clean(r) for r in rest]}')
            continue
        title = join_title([head, *rest[:author_at]])
        authors = clean(' '.join(rest[author_at:]))
        if len(rest) - author_at > 1 or author_at > 0:
            notes.append(f'{where}: 여러 줄 항목 확인 — 제목={title!r} / 저자={authors!r}')
        if entries and entries[-1]['title'] == title and entries[-1]['authors'] == authors:
            # The book repeats a paper in slots whose extra papers aren't confirmed yet.
            notes.append(f'{where}: 미확정 슬롯(직전 논문 반복 인쇄) 제외 — {m.group(1)} {title!r}')
            continue
        entries.append({'m': m, 'title': title, 'authors': authors, 'keynote': keynote})
    return entries


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf', default=str(ROOT / 'source-pdf' / 'program.pdf'))
    args = ap.parse_args()
    pdf = Path(args.pdf)

    official = json.loads((ROOT / 'data' / 'official-events.json').read_text(encoding='utf-8'))
    poster_sessions = {e['title']: e['id'] for e in official if e['title'].startswith('포스터')}

    raw = pdf_text(pdf, *PAPER_PAGES).split('\n')
    lines = [l for l in raw if clean(l) and not any(f.search(l) for f in FURNITURE)]

    headers = [i for i, l in enumerate(lines) if SESSION_HEADER.match(l)]
    notes: list[str] = []
    sessions, papers, posters = [], [], []
    paper_no = 0

    for n, h in enumerate(headers):
        m = SESSION_HEADER.match(lines[h])
        day, weekday, t0, t1, venue_raw, chair = m.groups()
        title = normalize_session_title(lines[h - 1])
        body_end = headers[n + 1] - 1 if n + 1 < len(headers) else len(lines)
        body = lines[h + 1:body_end]
        date = f'{YEAR_MONTH}-{int(day):02d}'
        venue = normalize_venue(venue_raw)
        is_poster = title.startswith('포스터')
        chair_line = next((l for l in body if clean(l).startswith('좌장')), None)
        if chair_line and not chair:
            chair = re.sub(r'^좌장\s*:\s*', '', clean(chair_line))
            body = [l for l in body if l is not chair_line]

        if is_poster:
            entries = parse_entries(body, POSTER_START, notes, title)
            for e in entries:
                pid = e['m'].group(1)
                flag = e['m'].group(2)
                posters.append({
                    'paper_id': pid,
                    'id': f'poster-{pid.lower()}',
                    'sessionId': poster_sessions.get(title, ''),
                    'session': title,
                    'date': date,
                    'time': f'{t0}~{t1}',
                    'venue': venue,
                    'chair': clean(chair) if chair else '-',
                    'flags': flag,
                    'title': e['title'],
                    'authors': e['authors'],
                    'presenter': presenter_of(e['authors']),
                    'affiliations': affiliations(e['authors']),
                })
            continue

        sid = f's{len(sessions) + 1:03d}'
        sessions.append({
            'id': sid,
            'title': title,
            'date': date,
            'day': weekday,
            'time': f'{t0}~{t1}',
            'venue': venue,
            'chair': clean(chair) if chair else '-',
            'category': session_category(title),
        })
        for e in parse_entries(body, ORAL_START, notes, title):
            paper_no += 1
            pm = e['m']
            papers.append({
                'paper_id': f'p{paper_no:03d}',
                'id': f'p{paper_no:03d}',
                'sessionId': sid,
                'session': title,
                'date': date,
                'time': f'{pm.group(1)}~{pm.group(2)}',
                'venue': venue,
                'chair': sessions[-1]['chair'],
                'flags': pm.group(3),
                'presentationType': 'KEYNOTE' if e['keynote'] else 'ORAL',
                'title': e['title'],
                'authors': e['authors'],
                'presenter': presenter_of(e['authors']),
                'affiliations': affiliations(e['authors']),
            })

    # --- official keynote numbers: '키노트[n]' then '2026년 11월 26일(목) 09:40~10:10│LIG D&A홀 (B1F)' ---
    kn_text = pdf_text(pdf, *KEYNOTE_PAGES)
    kn_re = re.compile(
        r'키노트\[(\d+)\]\s*\n\s*2026년\s*11월\s*(\d{1,2})일\(.\)\s*(\d{2}:\d{2})~\d{2}:\d{2}\s*│\s*([^\n(]+)'
    )
    keynote_no = {
        (f'{YEAR_MONTH}-{int(day):02d}', start, normalize_venue(room)): int(n)
        for n, day, start, room in kn_re.findall(kn_text)
    }
    for p in papers:
        if p['presentationType'] != 'KEYNOTE':
            continue
        n = keynote_no.get((p['date'], p['time'][:5], p['venue']))
        if n:
            p['keynoteNo'] = n
        else:
            notes.append(f'키노트 번호를 찾지 못함 — {p["id"]} {p["date"]} {p["time"]} {p["venue"]}')

    # --- cross-check against 발표자별 시간표: presentations per (day, time) slot ---
    table = pdf_text(pdf, *PRESENTER_PAGES)
    slot_re = re.compile(r'(\d{2})일\(.\)\s+(\d{2}:\d{2}~\d{2}:\d{2})')
    expected = Counter(slot_re.findall(table))
    actual = Counter()
    for p in papers + posters:
        actual[(p['date'][-2:], p['time'])] += 1
    slot_diffs = sorted(
        (k, expected.get(k, 0), actual.get(k, 0))
        for k in set(expected) | set(actual)
        if expected.get(k, 0) != actual.get(k, 0)
    )

    data = ROOT / 'data'
    (data / 'sessions.json').write_text(json.dumps(sessions, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    (data / 'papers.json').write_text(json.dumps(papers + posters, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    unlinked = [p['id'] for p in posters if not p['sessionId']]
    if unlinked:
        notes.append(f'official-events.json에 포스터 세션이 없어 연결 안 된 포스터 {len(unlinked)}건')

    report_dir = ROOT / '.paper-extraction' / 'fall'
    report_dir.mkdir(parents=True, exist_ok=True)
    keynotes = [p for p in papers if p['presentationType'] == 'KEYNOTE']
    flags = Counter(p['flags'] for p in papers + posters)
    report = [
        '# 프로그램북 파싱 리포트',
        '',
        f'- 세션 {len(sessions)}개 · 구두 {len(papers)}건 (키노트 {len(keynotes)}) · 포스터 {len(posters)}건',
        f'- 발표자별 시간표 총 {sum(expected.values())}건 / 파싱 결과 {len(papers) + len(posters)}건',
        f'- 플래그 분포: {dict(flags)}  (+ 학생, @ 학부, * 영어)',
        '',
        '## 시간대별 건수 불일치 (발표자별 시간표 기준)',
        *(f'- {d}일 {t}: 시간표 {e}건 / 파싱 {a}건' for (d, t), e, a in slot_diffs),
        *([] if slot_diffs else ['- 없음']),
        '',
        '## 키노트',
        *(f'- 키노트[{p.get("keynoteNo", "?")}] {p["id"]} {p["session"]} {p["time"]} — {p["title"]} / {p["authors"]}'
          for p in sorted(keynotes, key=lambda p: p.get('keynoteNo', 99))),
        '',
        '## 검토 메모',
        *(f'- {n}' for n in notes),
    ]
    (report_dir / 'program-report.md').write_text('\n'.join(report) + '\n', encoding='utf-8')
    print('\n'.join(report[:6]))
    print(f'불일치 시간대 {len(slot_diffs)}개 · 검토 메모 {len(notes)}개 → {report_dir / "program-report.md"}')


if __name__ == '__main__':
    main()
