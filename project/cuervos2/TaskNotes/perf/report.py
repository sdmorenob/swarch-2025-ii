"""
Aggregate k6 JSON summaries and wrk text outputs into a CSV and simple charts.

Usage:
  python perf/report.py

Outputs:
  perf/reports/summary.csv
  perf/reports/p95_by_scenario.png
"""
import json
import re
import csv
import os

try:
    import matplotlib.pyplot as plt
except Exception:
    plt = None

BASE = os.path.dirname(__file__)
REPORTS = os.path.join(BASE, 'reports')
os.makedirs(REPORTS, exist_ok=True)

rows = []

# Parse k6 JSON summaries
for name in os.listdir(REPORTS):
    if not name.startswith('k6-') or not name.endswith('.json'):
        continue
    path = os.path.join(REPORTS, name)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    parts = name.replace('.json','').split('-')
    scenario = parts[1] if len(parts) > 1 else 'unknown'
    rps_raw = parts[2] if len(parts) > 2 else '0'
    ts = parts[3] if len(parts) > 3 else ''
    rps_num = int(re.sub('[^0-9]', '', rps_raw) or 0)
    metrics = data.get('metrics', {})
    dur = metrics.get('http_req_duration', {}).get('values', {})
    err = metrics.get('http_req_failed', {}).get('values', {}).get('rate', None)
    rows.append({
        'tool': 'k6', 'scenario': scenario, 'rps': rps_num, 'duration': data.get('state', ''),
        'p50': dur.get('p(50)'), 'p90': dur.get('p(90)'), 'p95': dur.get('p(95)'), 'p99': dur.get('p(99)'),
        'error_rate': err, 'ts': ts
    })

# Parse wrk outputs
WRK_LAT_RE = re.compile(r'\s*\d+\.\d+%\s*(\d+\.\d+)ms')
for name in os.listdir(REPORTS):
    if not name.startswith('wrk-') or not name.endswith('.txt'):
        continue
    path = os.path.join(REPORTS, name)
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    parts = name.replace('.txt','').split('-')
    scenario = parts[1] if len(parts) > 1 else 'unknown'
    rps_raw = parts[2] if len(parts) > 2 else '0'
    ts = parts[3] if len(parts) > 3 else ''
    # Extract requests/sec
    m_rps = re.search(r'Requests/sec:\s*(\d+\.?\d*)', text)
    reqs_sec = float(m_rps.group(1)) if m_rps else None
    # Extract non-2xx
    m_non2xx = re.search(r'Non-2xx or 3xx responses:\s*(\d+)', text)
    non2xx = int(m_non2xx.group(1)) if m_non2xx else 0
    # Extract latency percentiles
    pcts = re.findall(r'\s*(\d+\.\d+)%\s*(\d+\.\d+)ms', text)
    p50 = p90 = p99 = None
    for pct, val in pcts:
        if pct == '50.000': p50 = float(val)
        if pct == '90.000': p90 = float(val)
        if pct == '99.000': p99 = float(val)
    rows.append({
        'tool': 'wrk', 'scenario': scenario, 'rps': int(re.sub('[^0-9]', '', rps_raw) or 0), 'duration': '',
        'p50': p50, 'p90': p90, 'p95': None, 'p99': p99,
        'error_rate': None if reqs_sec is None else (non2xx / (reqs_sec * 120.0)), 'ts': ts
    })

# Write CSV
csv_path = os.path.join(REPORTS, 'summary.csv')
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['tool','scenario','rps','duration','p50','p90','p95','p99','error_rate','ts'])
    w.writeheader()
    for r in sorted(rows, key=lambda x: (x['scenario'], x['tool'], x['rps'])):
        w.writerow(r)
print(f'Wrote {csv_path} ({len(rows)} rows)')

# Plot P95 by scenario (k6 only)
if plt:
    scenarios = {}
    for r in rows:
        if r['tool'] != 'k6':
            continue
        scenarios.setdefault(r['scenario'], []).append((r['rps'], r['p95']))
    for s in scenarios:
        scenarios[s].sort(key=lambda x: x[0])
    for s, pts in scenarios.items():
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        plt.plot(xs, ys, marker='o', label=s)
    plt.xlabel('RPS')
    plt.ylabel('P95 (ms)')
    plt.title('P95 by Scenario (k6)')
    plt.legend()
    out_png = os.path.join(REPORTS, 'p95_by_scenario.png')
    plt.savefig(out_png, dpi=120)
    print(f'Wrote {out_png}')
else:
    print('matplotlib not available; skipped chart generation.')