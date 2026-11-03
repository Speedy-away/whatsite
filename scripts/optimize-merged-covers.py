"""Create responsive delivery copies; never replace the original illustrations."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'docs/merged-category-covers.json').read_text(encoding='utf-8'))
output = root / 'assets/images/merged-categories/optimized'
output.mkdir(parents=True, exist_ok=True)
previous_path = root / 'docs/optimized-category-covers.json'
images = json.loads(previous_path.read_text(encoding='utf-8'))['images'] if previous_path.exists() else {}
for cover in manifest['covers'].values():
    source = root / cover['path'].lstrip('/')
    variants = []
    with Image.open(source) as original:
        original = ImageOps.exif_transpose(original).convert('RGB')
        for width in (480, 960):
            image = original.copy()
            image.thumbnail((width, width * 2), Image.Resampling.LANCZOS)
            target = output / f'{source.stem}-{width}.jpg'
            image.save(target, 'JPEG', quality=82, optimize=True, progressive=True)
            data = target.read_bytes()
            variants.append({'path': '/' + target.relative_to(root).as_posix(), 'width': image.width,
                             'height': image.height, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    images[cover['path']] = {'originalBytes': source.stat().st_size, 'variants': variants}
pages = json.loads(subprocess.check_output(['node', '-e', "console.log(JSON.stringify(require('./scripts/site-public-pages.cjs').pages()))"], cwd=root, text=True))
additional = set(images) - {c['path'] for c in manifest['covers'].values()}
for page in pages:
    html = Path(page).read_text(encoding='utf-8')
    for reference in re.findall(r'(?:src|data-original-image)=["\']([^"\']+)["\']', html):
        parsed = urlparse(urljoin('https://whatwhatboy.com/' + Path(page).relative_to(root).as_posix(), reference))
        if parsed.netloc != 'whatwhatboy.com':
            continue
        source = unquote(parsed.path)
        if not source.startswith('/assets/images/') or '/optimized/' in source:
            continue
        file = root / source.lstrip('/')
        if source not in images and file.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp', '.avif') and file.exists() and file.stat().st_size > 200000:
            additional.add(source)
for source in sorted(additional):
    path = root / source.lstrip('/')
    variants = []
    with Image.open(path) as original:
        if getattr(original, 'is_animated', False):
            if source == '/assets/images/steamdeck/steamgriddb.png':
                frames, durations = [], []
                for frame_index in range(original.n_frames):
                    original.seek(frame_index)
                    frames.append(original.convert('RGBA').copy())
                    durations.append(original.info.get('duration', 100))
                for width in (88, 176):
                    small = [frame.resize((width, round(frame.height * width / frame.width)), Image.Resampling.LANCZOS) for frame in frames]
                    sheet = Image.new('RGB', (width * 8, small[0].height * ((len(small) + 7) // 8)))
                    for index, frame in enumerate(small):
                        sheet.paste(frame.convert('RGB'), ((index % 8) * width, (index // 8) * small[0].height))
                    palette = sheet.quantize(colors=192, method=Image.Quantize.MEDIANCUT)
                    small = [frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE) for frame in small]
                    for frame in small:
                        frame.info.clear()
                    target = output / f'steamgriddb-animated-{width}.png'
                    small[0].save(target, 'PNG', save_all=True, append_images=small[1:], duration=durations, loop=0, optimize=True)
                    data = target.read_bytes()
                    variants.append({'path': '/' + target.relative_to(root).as_posix(), 'width': small[0].width,
                                     'height': small[0].height, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
                images[source] = {'originalBytes': path.stat().st_size, 'animated': True, 'variants': variants}
            continue
        original = ImageOps.exif_transpose(original)
        alpha = 'A' in original.getbands() or 'transparency' in original.info
        original = original.convert('RGBA' if alpha else 'RGB')
        if alpha and original.getchannel('A').getextrema() == (255, 255):
            alpha = False
            original = original.convert('RGB')
        for width in (480, 960):
            image = original.copy()
            image.thumbnail((width, width * 2), Image.Resampling.LANCZOS)
            identity = hashlib.sha256(source.encode()).hexdigest()[:16]
            target = output / f'asset-{identity}-{width}{"-v2" if alpha else ""}.{"png" if alpha else "jpg"}'
            if alpha:
                image.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(target, 'PNG', optimize=True)
            else:
                image.save(target, 'JPEG', quality=82, optimize=True, progressive=True)
            data = target.read_bytes()
            variants.append({'path': '/' + target.relative_to(root).as_posix(), 'width': image.width,
                             'height': image.height, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    if variants[-1]['bytes'] < path.stat().st_size:
        images[source] = {'originalBytes': path.stat().st_size, 'variants': variants}
report = {'policy': 'Responsive progressive JPEG delivery copies; all original PNGs retained.', 'images': images}
(root / 'docs/optimized-category-covers.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'images': len(images), 'originalBytes': sum(i['originalBytes'] for i in images.values()),
                  'deliveryBytes960': sum(i['variants'][-1]['bytes'] for i in images.values())}))
