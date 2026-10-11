"""Export a self-contained preview with fonts, figures, styles, scripts and data."""
import base64
import json
import mimetypes
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
docs = root / 'docs'
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else root / '.preview' / 'inverse-pde-preview.html'
html = (docs / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>' + (docs / 'styles.css').read_text() + '</style>')
for name in ['app.js','reads.js']:
    html = html.replace(f'  <script src="{name}" defer></script>', '')
payload = {name: json.loads((docs / 'data' / f'{name}.json').read_text()) for name in ['methods', 'results', 'protocols', 'sources', 'applicability', 'references']}
embedded = '<script id="embedded-research-data" type="application/json">' + json.dumps(payload, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
for path in (docs / 'assets').rglob('*'):
    if not path.is_file() or path.suffix not in {'.svg','.png','.woff2'}:
        continue
    relative = path.relative_to(docs).as_posix()
    if relative not in html:
        continue
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    uri = 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()
    for quote in ['"', "'"]:
        html = html.replace(quote + relative + quote, quote + uri + quote)
for path in (docs / 'data').iterdir():
    mime = 'text/csv' if path.suffix == '.csv' else 'application/json'
    uri = 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()
    html = html.replace('href="data/' + path.name + '" download', 'href="' + uri + '" download="' + path.name + '"')
scripts = '\n'.join('<script>'+(docs/name).read_text().replace('</script>', '<\\/script>')+'</script>' for name in ['app.js','reads.js'])
html = html.replace('</body>', embedded + '\n' + scripts + '\n</body>')
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(html)
print(destination)
