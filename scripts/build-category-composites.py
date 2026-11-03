"""Build single SVG category images from existing game/app artwork, with embedded delivery thumbnails."""
import base64
import hashlib
import io
import json
from pathlib import Path
from xml.sax.saxutils import escape
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
data = json.loads((root / 'docs/category-card-art.json').read_text(encoding='utf-8'))
output = root / 'assets/images/category-composites'
output.mkdir(parents=True, exist_ok=True)
cards = {}
for route, config in data['destinations'].items():
    if not route.startswith('/console/') or config.get('kind') not in ('mods', 'tools', 'games'):
        continue
    sources = config.get('images', [])[:4]
    if len(sources) < 2:
        continue
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#0a1011"/>']
    for index, source in enumerate(sources):
        path = root / source['src'].lstrip('/')
        if path.suffix.lower() == '.svg':
            payload, mime = path.read_bytes(), 'image/svg+xml'
        else:
            with Image.open(path) as original:
                image = ImageOps.exif_transpose(original).convert('RGB')
                image.thumbnail((480, 270), Image.Resampling.LANCZOS)
                buffer = io.BytesIO()
                image.save(buffer, 'JPEG', quality=80, optimize=True, progressive=True)
                payload, mime = buffer.getvalue(), 'image/jpeg'
        x, y = (index % 2) * 480, (index // 2) * 270
        height = 540 if len(sources) == 2 else 270
        parts.append(f'<image x="{x}" y="{y}" width="480" height="{height}" preserveAspectRatio="xMidYMid meet" href="data:{mime};base64,{base64.b64encode(payload).decode()}"/>')
    parts.append('</svg>')
    content = ''.join(parts).encode()
    identity = hashlib.sha256(route.encode()).hexdigest()[:12]
    target = output / (identity + '.svg')
    target.write_bytes(content)
    cards[route] = {'id': 'composite-' + identity, 'path': '/' + target.relative_to(root).as_posix(),
                    'width': 960, 'height': 540, 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest(),
                    'title': config['title'], 'alt': 'Combined ' + config['title'] + ' artwork: ' + ', '.join(s.get('label', s['alt']) for s in sources),
                    'sourceImages': [s['src'] for s in sources]}
(root / 'docs/category-composite-covers.json').write_text(json.dumps({'policy': 'Single self-contained SVG compositions using existing game/app images; originals retained.', 'routes': cards}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'composites': len(cards), 'bytes': sum(c['bytes'] for c in cards.values())}))
