"""
Assemble the app's paper data from the parsed programme (data/papers.json)
plus extracted extended abstracts (.paper-extraction/fall/abstracts.json,
optional — written by the abstract-matching step).

Writes:
  data/papers-with-abstracts.json   orals (+ abstract, keywords when matched)
  data/poster-papers.json           posters (same)
  data/speakers.json                presenter index

Then run `npm run build:paper-index` and `npm run validate:data`.

Usage:
  python3 scripts/assemble-fall-data.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
ABSTRACTS = ROOT / '.paper-extraction' / 'fall' / 'abstracts.json'


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def dump(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def presenter_affiliation(authors: str) -> str:
    m = re.search(r'\(([^)]+)\)', authors)
    return m.group(1).strip() if m else ''


def main():
    papers = load(DATA / 'papers.json')
    abstracts = load(ABSTRACTS) if ABSTRACTS.exists() else {}

    merged = []
    for paper in papers:
        extra = abstracts.get(paper['id'], {})
        merged.append({**paper, **extra})

    orals = [p for p in merged if not p['id'].startswith('poster-')]
    posters = [p for p in merged if p['id'].startswith('poster-')]

    # One speaker per (name, affiliation): two different 김성현s stay apart,
    # while one person presenting several papers collects them all.
    speakers: dict[tuple[str, str], list[str]] = {}
    for p in merged:
        key = (p['presenter'], presenter_affiliation(p['authors']))
        speakers.setdefault(key, []).append(p['id'])
    speaker_list = [
        {'id': f'sp{i + 1:03d}', 'name': name, 'papers': ids}
        for i, ((name, _aff), ids) in enumerate(sorted(speakers.items(), key=lambda kv: kv[0]))
    ]

    dump(DATA / 'papers-with-abstracts.json', orals)
    dump(DATA / 'poster-papers.json', posters)
    dump(DATA / 'speakers.json', speaker_list)

    with_abstract = sum(1 for p in merged if p.get('abstract'))
    print(f'구두 {len(orals)}건 · 포스터 {len(posters)}건 · 발표자 {len(speaker_list)}명 · 초록 연결 {with_abstract}건')


if __name__ == '__main__':
    main()
