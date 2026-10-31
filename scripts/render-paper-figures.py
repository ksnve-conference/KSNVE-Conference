"""Render reviewed figure/table bands, including captions, without re-extracting text.

Requires PyMuPDF and Pillow. Crop coordinates are PDF points, except imageBox
which refers to the existing 200-dpi original-page image for approved pilots.
Run from the repository root: python3 scripts/render-paper-figures.py
"""
import hashlib
import json
import unicodedata
from pathlib import Path

import fitz
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = next(p for p in (ROOT / 'source-pdf').iterdir()
              if p.is_dir() and '세션' in unicodedata.normalize('NFC', p.name))
CROPS = json.loads((ROOT / 'scripts/paper-figure-crops.json').read_text())
metadata = {}
for crop in CROPS:
    paper_id = crop['id']
    if 'imageBox' in crop:
        with Image.open(ROOT / f'public/paper-pages/{paper_id}.webp') as original:
            image = original.convert('RGB').crop(crop['imageBox'])
    else:
        with fitz.open(SOURCE / crop['pdf']) as document:
            page = document[crop['page']]
            box = fitz.Rect(crop['box'])
            pixmap = page.get_pixmap(matrix=fitz.Matrix(200 / 72, 200 / 72), clip=box, alpha=False)
            image = Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples)
            for mask in crop.get('masks', []):
                # Omit adjacent text when a figure starts alongside the last body line.
                coordinates = [(mask[i] - (box.x0 if i % 2 == 0 else box.y0)) * 200 / 72
                               for i in range(4)]
                ImageDraw.Draw(image).rectangle(coordinates, fill='white')
            if 'contentBox' in crop:
                # Keep the original horizontal placement but omit adjacent prose.
                keep = fitz.Rect(crop['contentBox'])
                draw = ImageDraw.Draw(image)
                left = max(0, round((keep.x0 - box.x0) * 200 / 72))
                right = min(image.width, round((keep.x1 - box.x0) * 200 / 72))
                if left: draw.rectangle((0, 0, left - 1, image.height), fill='white')
                if right < image.width: draw.rectangle((right, 0, image.width, image.height), fill='white')
    path = ROOT / f'public/paper-pages/{paper_id}-figures.webp'
    image.save(path, 'WEBP', lossless=True, method=6)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:10]
    metadata[paper_id] = {'src': f'/paper-pages/{path.name}?v={digest}', 'width': image.width, 'height': image.height}

for filename in ['papers-with-abstracts.json', 'poster-papers.json']:
    path = ROOT / 'data' / filename
    papers = json.loads(path.read_text())
    for paper in papers:
        if paper['id'] in metadata:
            paper['figureImage'] = metadata[paper['id']]
    path.write_text(json.dumps(papers, ensure_ascii=False, indent=1) + '\n')
print(f'Rendered {len(metadata)} figure/table images.')
