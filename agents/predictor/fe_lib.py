# fe_lib.py
# Feature engineering helpers for PitWall A.I.
# Use from Predictor/EDA workers: import fe_lib
# Seed doc available: /mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md

import json, math, time
from datetime import datetime
import numpy as np
import pandas as pd

# load track sectors (path mutable)
def load_track_sectors(path='public/tracks/track_sectors.json'):
    try:
        with open(path,'r') as f:
            return json.load(f)
    except Exception:
        # Try alternative paths
        alt_paths = [
            '../../public/tracks/track_sectors.json',
            '/mnt/data/public/tracks/track_sectors.json',
            'pitwall-dist/public/tracks/track_sectors.json'
        ]
        for alt_path in alt_paths:
            try:
                with open(alt_path, 'r') as f:
                    return json.load(f)
            except:
                continue
        return {}

def canonicalize_point(p):
    # Ensure keys & types, convert units if needed
    out = {}
    out['meta_time'] = p.get('meta_time')
    out['track'] = p.get('track') or p.get('circuit') or 'unknown'
    out['chassis'] = p.get('chassis') or p.get('vehicle') or 'unknown'
    out['lap'] = int(p.get('lap') or 0)
    out['lapdist_m'] = float(p.get('lapdist_m') or p.get('lap_distance') or 0.0)
    out['speed_kmh'] = float(p.get('speed_kmh') or p.get('speed') or 0.0)
    out['accx_can'] = float(p.get('accx_can') or p.get('ax') or 0.0)
    out['accy_can'] = float(p.get('accy_can') or p.get('ay') or 0.0)
    out['Steering_Angle'] = float(p.get('Steering_Angle') or p.get('steering_deg') or 0.0)
    out['throttle_pct'] = float(p.get('throttle_pct') or p.get('throttle') or 0.0)
    out['brake_pct'] = float(p.get('brake_pct') or p.get('pbrake_f') or 0.0)
    out['rpm'] = float(p.get('rpm') or 0.0)
    out['source'] = p.get('source') or p.get('raw_source') or 'unknown'
    return out

def compute_derived(p):
    ax = float(p.get('accx_can',0.0))
    ay = float(p.get('accy_can',0.0))
    # assume acc in g already; if m/s2, divide by 9.81
    lateral_g = ay
    long_g = ax
    inst_tire_stress = ax*ax + ay*ay
    brake_power = (p.get('brake_pct',0.0)/100.0) * p.get('speed_kmh',0.0)
    return {
        'lateral_g': lateral_g,
        'long_g': long_g,
        'inst_tire_stress': inst_tire_stress,
        'brake_power': brake_power
    }

def sectorize_point(track_sectors, track, lapdist_m):
    meta = track_sectors.get(track)
    if not meta:
        # fallback equal thirds for robustness
        total = 5000.0
        sLen = total / 3.0
        if lapdist_m < sLen: return 0
        if lapdist_m < 2*sLen: return 1
        return 2
    for i, s in enumerate(meta.get('sectors',[])):
        if lapdist_m >= s.get('start_m',0) and lapdist_m < s.get('end_m', 1e9):
            return i
    return len(meta.get('sectors',[])) - 1

def ewma(series, alpha=0.3):
    s = []
    if len(series)==0: return s
    prev = series[0]
    s.append(prev)
    for x in series[1:]:
        prev = alpha*x + (1-alpha)*prev
        s.append(prev)
    return s

def resample_uniform(samples, freq_hz=10):
    """
    samples: list of dicts with meta_time ISO strings.
    returns pandas DataFrame resampled at freq_hz using linear interpolation.
    """
    if len(samples)==0:
        return pd.DataFrame()
    df = pd.DataFrame(samples)
    df['meta_time'] = pd.to_datetime(df['meta_time'])
    df = df.set_index('meta_time').sort_index()
    # ensure numeric columns are floats
    numeric_cols = ['speed_kmh','accx_can','accy_can','Steering_Angle','throttle_pct','brake_pct','rpm','lapdist_m']
    for c in numeric_cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors='coerce')
    # resample index
    rule = f'{int(1000/freq_hz)}L' # e.g., '100L' for 10Hz
    dfr = df.resample(rule).mean().interpolate()
    return dfr

def aggregate_per_sector(samples, track_sectors, track):
    """
    samples: list of canonicalized points (dicts)
    Returns: dict keyed by sector index -> aggregates
    """
    # compute derived for each sample
    for s in samples:
        s['_derived'] = compute_derived(s)
        s['_sector'] = sectorize_point(track_sectors, track, s['lapdist_m'])
    # group
    groups = {}
    for s in samples:
        idx = s['_sector']
        if idx not in groups: groups[idx] = {'n':0,'speed_sum':0,'max_lat':0,'tire_stress':0,'brake_energy':0,'samples':[]}
        g = groups[idx]
        g['n'] += 1
        g['speed_sum'] += s.get('speed_kmh',0.0)
        g['max_lat'] = max(g['max_lat'], abs(s['_derived']['lateral_g']))
        g['tire_stress'] += s['_derived']['inst_tire_stress']
        g['brake_energy'] += s['_derived']['brake_power']
        if len(g['samples']) < 3:
            g['samples'].append({'meta_time':s['meta_time'],'lapdist_m':s['lapdist_m'],'speed_kmh':s['speed_kmh']})
    # reduce
    out = {}
    for k,v in groups.items():
        out[k] = {
            'n': v['n'],
            'avg_speed': v['speed_sum']/v['n'] if v['n'] else 0.0,
            'max_lat_g': v['max_lat'],
            'tire_stress_sum': v['tire_stress'],
            'brake_energy': v['brake_energy'],
            'evidence': v['samples']
        }
    return out

def aggregate_per_lap(samples, track_sectors, track):
    per_sector = aggregate_per_sector(samples, track_sectors, track)
    total_samples = len(samples)
    lap_metrics = {
        'track': track,
        'sample_count': total_samples,
        'per_sector': per_sector,
        'created_at': datetime.utcnow().isoformat()+'Z'
    }
    return lap_metrics

def prepare_features_for_model(agg, feature_order=None):
    """
    Flatten per_sector aggregates into fixed vector.
    feature_order: list of keys like ['tire_stress_s0', 'tire_stress_s1', 'avg_speed_s0', ...]
    If feature_order not provided, produce a default consistent ordering: tire_stress for sectors ascending then avg_speed.
    """
    # collect sectors sorted
    sectors = sorted([int(k) for k in agg.get('perSector', agg.get('per_sector',{})).keys()])
    features = {}
    
    per_sector_data = agg.get('perSector', agg.get('per_sector',{}))
    
    for s in sectors:
        sec = per_sector_data.get(str(s), {})
        features[f'tire_stress_s{s}'] = sec.get('tire_stress_sum', 0.0)
        features[f'avg_speed_s{s}'] = sec.get('avg_speed', 0.0)
        features[f'max_lat_g_s{s}'] = sec.get('max_lat_g', 0.0)
        features[f'brake_energy_s{s}'] = sec.get('brake_energy', 0.0)
    
    # if feature_order provided, use it
    if feature_order:
        vec = [features.get(k,0.0) for k in feature_order]
        return np.array(vec, dtype=float)
    # else default sort
    keys = sorted(features.keys())
    return np.array([features[k] for k in keys], dtype=float)

# quick local test helper
if __name__ == '__main__':
    # attempt to run small example using demo JSON if present
    import os
    demo_path = os.getenv('DEMO_JSON', '/mnt/data/pitwall-dist/public/tracks/demo_7tracks.json')
    tmap = load_track_sectors('public/tracks/track_sectors.json')
    if os.path.exists(demo_path):
        pts = json.load(open(demo_path))
        canonical = [canonicalize_point(p) for p in pts]
        for p in canonical:
            p.update(compute_derived(p))
            p['_sector'] = sectorize_point(tmap, p['track'], p['lapdist_m'])
        agg = aggregate_per_lap(canonical, tmap, canonical[0]['track'])
        print('example agg', json.dumps(agg, indent=2))
    else:
        print('demo not found at', demo_path)

