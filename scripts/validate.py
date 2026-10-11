"""Validate the static companion without third-party dependencies."""
import csv
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
load = lambda name: json.loads((DOCS / 'data' / f'{name}.json').read_text())
methods = load('methods')['records']
records = load('results')['records']
protocols = load('protocols')
sources = load('sources')
matrix = load('applicability')
references = load('references')

assert len({m['id'] for m in methods}) == len(methods), 'Duplicate method IDs'
assert len({r['record_id'] for r in records}) == len(records), 'Duplicate result IDs'
for method in methods:
    assert method['task'] in {'inverse_problems', 'inverse_design', 'control', 'cross_task'}
    assert method['name'] and method['title'] and isinstance(method['year'], int)
    assert not method['url'] or urlsplit(method['url']).scheme in {'http', 'https'}
    if method.get('code_url'):
        assert urlsplit(method['code_url']).scheme == 'https', f'Unsafe code URL: {method["id"]}'
        assert method.get('code_source') and method.get('code_checked_at'), f'Missing code provenance: {method["id"]}'
        assert urlsplit(method['code_source']).scheme == 'https'
    if method.get('collection') == 'companion':
        assert method.get('metadata_source') and method.get('first_published') and method.get('added_at')
        assert method['section'] is None, 'Companion additions must not invent manuscript sections'
        assert method['first_published'] <= method['added_at'], 'Future paper date'
for record in records:
    assert record['protocol_id'] in protocols
    assert record['source_id'] in sources
    assert record['evidence_type'] == 'literature_reported'
    for key in ['metric_1', 'metric_2', 'offline_cost', 'online_cost']:
        item = record[key]
        assert item['status'] in {'reported', 'NR', 'NA'}
        assert (item['value'] is not None) == (item['status'] == 'reported')
        if item['value'] is not None:
            float(item['value'])
for key, protocol in protocols.items():
    assert protocol['source_id'] in sources
    assert any(record['protocol_id'] == key for record in records)
for row in matrix['rows']:
    assert len(row['values']) == len(matrix['columns'])
    assert set(row['values']) <= {0, 1, 2}
    assert all(key in references for key in row['keys']), f"Missing matrix reference: {row['name']}"
with (DOCS / 'data' / 'results.csv').open() as stream:
    csv_records = list(csv.DictReader(stream))
assert {r['record_id'] for r in csv_records} == {r['record_id'] for r in records}
csv_by_id = {r['record_id']: r for r in csv_records}
for record in records:
    csv_record = csv_by_id[record['record_id']]
    for key in ['metric_1', 'metric_2', 'offline_cost', 'online_cost']:
        for field in ['value', 'unit', 'std', 'status', 'source_location']:
            assert csv_record[f'{key}_{field}'] == str(record[key].get(field) or ''), f'CSV mismatch: {record["record_id"]} {key} {field}'

class LocalReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for attr in ['src', 'href']:
            value = attrs.get(attr)
            if value:
                self.refs.append(value)

parser = LocalReferences()
parser.feed((DOCS / 'index.html').read_text())
assert len(parser.ids) == len(set(parser.ids)), 'Duplicate HTML IDs'
for ref in parser.refs:
    if ref.startswith('#'):
        anchor = ref[1:].split('?')[0]
        assert anchor in parser.ids, f'Missing anchor {ref}'
    elif not urlsplit(ref).scheme:
        assert (DOCS / unquote(ref.split('?')[0])).is_file(), f'Missing local asset {ref}'
print(f'Validated {len(methods)} studies, {len(records)} results, {len(protocols)} protocols, and {len(matrix["rows"])} workflows.')
print('All local links, IDs, source references, and quantitative missing-value states are consistent.')
