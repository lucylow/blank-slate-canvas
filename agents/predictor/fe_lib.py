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
    Enhanced aggregation with advanced features for pre-event predictions.
    samples: list of canonicalized points (dicts)
    Returns: dict keyed by sector index -> aggregates with enhanced metrics
    """
    # compute derived for each sample
    for s in samples:
        s['_derived'] = compute_derived(s)
        s['_sector'] = sectorize_point(track_sectors, track, s['lapdist_m'])
    # group with enhanced tracking
    groups = {}
    for s in samples:
        idx = s['_sector']
        if idx not in groups: 
            groups[idx] = {
                'n':0, 'speed_sum':0, 'speed_sq_sum':0, 'speed_list':[],
                'max_lat':0, 'lat_g_list':[], 'lat_g_sum':0,
                'tire_stress':0, 'max_tire_stress':0, 'tire_stress_list':[],
                'brake_energy':0, 'brake_count':0, 'brake_intensity_sum':0,
                'long_g_sum':0, 'long_g_list':[],
                'throttle_sum':0, 'throttle_list':[],
                'rpm_sum':0, 'rpm_list':[],
                'samples':[]
            }
        g = groups[idx]
        g['n'] += 1
        speed = s.get('speed_kmh',0.0)
        g['speed_sum'] += speed
        g['speed_sq_sum'] += speed * speed
        g['speed_list'].append(speed)
        
        lat_g = abs(s['_derived']['lateral_g'])
        g['max_lat'] = max(g['max_lat'], lat_g)
        g['lat_g_list'].append(lat_g)
        g['lat_g_sum'] += lat_g
        
        tire_stress = s['_derived']['inst_tire_stress']
        g['tire_stress'] += tire_stress
        g['max_tire_stress'] = max(g['max_tire_stress'], tire_stress)
        g['tire_stress_list'].append(tire_stress)
        
        brake_pct = s.get('brake_pct', 0.0)
        if brake_pct > 5.0:  # Significant braking
            g['brake_count'] += 1
            g['brake_intensity_sum'] += brake_pct
        g['brake_energy'] += s['_derived']['brake_power']
        
        long_g = abs(s['_derived']['long_g'])
        g['long_g_sum'] += long_g
        g['long_g_list'].append(long_g)
        
        throttle = s.get('throttle_pct', 0.0)
        g['throttle_sum'] += throttle
        g['throttle_list'].append(throttle)
        
        rpm = s.get('rpm', 0.0)
        g['rpm_sum'] += rpm
        g['rpm_list'].append(rpm)
        
        if len(g['samples']) < 3:
            g['samples'].append({'meta_time':s['meta_time'],'lapdist_m':s['lapdist_m'],'speed_kmh':s['speed_kmh']})
    
    # reduce with enhanced metrics
    out = {}
    for k,v in groups.items():
        n = v['n'] if v['n'] > 0 else 1
        avg_speed = v['speed_sum'] / n
        
        # Speed consistency metrics
        speed_std = np.std(v['speed_list']) if len(v['speed_list']) > 1 else 0.0
        speed_cv = speed_std / avg_speed if avg_speed > 0 else 0.0  # Coefficient of variation
        
        # Lateral G consistency
        avg_lat_g = v['lat_g_sum'] / n
        lat_g_std = np.std(v['lat_g_list']) if len(v['lat_g_list']) > 1 else 0.0
        lat_g_consistency = 1.0 - (lat_g_std / avg_lat_g) if avg_lat_g > 0 else 0.0
        
        # Tire stress metrics
        avg_tire_stress = v['tire_stress'] / n
        tire_stress_std = np.std(v['tire_stress_list']) if len(v['tire_stress_list']) > 1 else 0.0
        tire_stress_rate = (v['max_tire_stress'] - avg_tire_stress) / avg_tire_stress if avg_tire_stress > 0 else 0.0
        
        # Brake metrics
        brake_frequency = v['brake_count'] / n  # Braking events per sample
        avg_brake_intensity = v['brake_intensity_sum'] / v['brake_count'] if v['brake_count'] > 0 else 0.0
        
        # Longitudinal G metrics
        avg_long_g = v['long_g_sum'] / n
        long_g_std = np.std(v['long_g_list']) if len(v['long_g_list']) > 1 else 0.0
        
        # Throttle metrics
        avg_throttle = v['throttle_sum'] / n
        throttle_std = np.std(v['throttle_list']) if len(v['throttle_list']) > 1 else 0.0
        
        # RPM metrics
        avg_rpm = v['rpm_sum'] / n
        rpm_std = np.std(v['rpm_list']) if len(v['rpm_list']) > 1 else 0.0
        
        # Cornering efficiency: ratio of lateral G to speed (higher = more efficient cornering)
        cornering_efficiency = avg_lat_g / avg_speed if avg_speed > 0 else 0.0
        
        # Energy balance: ratio of braking to acceleration energy
        energy_balance = v['brake_energy'] / (v['brake_energy'] + avg_throttle * avg_speed) if (v['brake_energy'] + avg_throttle * avg_speed) > 0 else 0.0
        
        out[k] = {
            'n': v['n'],
            'avg_speed': avg_speed,
            'speed_std': speed_std,
            'speed_cv': speed_cv,  # Coefficient of variation (consistency)
            'max_lat_g': v['max_lat'],
            'avg_lat_g': avg_lat_g,
            'lat_g_std': lat_g_std,
            'lat_g_consistency': lat_g_consistency,
            'tire_stress_sum': v['tire_stress'],
            'avg_tire_stress': avg_tire_stress,
            'max_tire_stress': v['max_tire_stress'],
            'tire_stress_std': tire_stress_std,
            'tire_stress_rate': tire_stress_rate,  # Peak stress relative to average
            'brake_energy': v['brake_energy'],
            'brake_frequency': brake_frequency,
            'avg_brake_intensity': avg_brake_intensity,
            'avg_long_g': avg_long_g,
            'long_g_std': long_g_std,
            'avg_throttle': avg_throttle,
            'throttle_std': throttle_std,
            'avg_rpm': avg_rpm,
            'rpm_std': rpm_std,
            'cornering_efficiency': cornering_efficiency,
            'energy_balance': energy_balance,
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

def prepare_features_for_model(agg, feature_order=None, include_advanced=True):
    """
    Enhanced feature preparation with advanced metrics for pre-event predictions.
    Flatten per_sector aggregates into fixed vector with comprehensive features.
    
    Args:
        agg: aggregate dict with per_sector data
        feature_order: optional list of feature names in specific order
        include_advanced: if True, include advanced features (speed consistency, cornering metrics, etc.)
    
    Returns:
        numpy array of features ready for model prediction
    """
    # collect sectors sorted
    sectors = sorted([int(k) for k in agg.get('perSector', agg.get('per_sector',{})).keys()])
    features = {}
    
    per_sector_data = agg.get('perSector', agg.get('per_sector',{}))
    
    # Core features per sector
    for s in sectors:
        sec = per_sector_data.get(str(s), {})
        # Basic features (always included)
        features[f'tire_stress_s{s}'] = sec.get('tire_stress_sum', 0.0)
        features[f'avg_speed_s{s}'] = sec.get('avg_speed', 0.0)
        features[f'max_lat_g_s{s}'] = sec.get('max_lat_g', 0.0)
        features[f'brake_energy_s{s}'] = sec.get('brake_energy', 0.0)
        
        # Advanced features (if enabled)
        if include_advanced:
            features[f'avg_tire_stress_s{s}'] = sec.get('avg_tire_stress', 0.0)
            features[f'max_tire_stress_s{s}'] = sec.get('max_tire_stress', 0.0)
            features[f'tire_stress_rate_s{s}'] = sec.get('tire_stress_rate', 0.0)
            features[f'speed_std_s{s}'] = sec.get('speed_std', 0.0)
            features[f'speed_cv_s{s}'] = sec.get('speed_cv', 0.0)  # Coefficient of variation
            features[f'avg_lat_g_s{s}'] = sec.get('avg_lat_g', 0.0)
            features[f'lat_g_consistency_s{s}'] = sec.get('lat_g_consistency', 0.0)
            features[f'brake_frequency_s{s}'] = sec.get('brake_frequency', 0.0)
            features[f'avg_brake_intensity_s{s}'] = sec.get('avg_brake_intensity', 0.0)
            features[f'avg_long_g_s{s}'] = sec.get('avg_long_g', 0.0)
            features[f'cornering_efficiency_s{s}'] = sec.get('cornering_efficiency', 0.0)
            features[f'energy_balance_s{s}'] = sec.get('energy_balance', 0.0)
    
    # Cross-sector features (aggregate metrics across all sectors)
    if include_advanced and len(sectors) > 0:
        # Overall lap metrics
        total_tire_stress = sum(sec.get('tire_stress_sum', 0.0) for sec in per_sector_data.values())
        features['total_tire_stress'] = total_tire_stress
        
        max_sector_stress = max((sec.get('max_tire_stress', 0.0) for sec in per_sector_data.values()), default=0.0)
        features['max_sector_stress'] = max_sector_stress
        
        avg_sector_speed = np.mean([sec.get('avg_speed', 0.0) for sec in per_sector_data.values()])
        features['avg_lap_speed'] = avg_sector_speed
        
        speed_consistency = np.mean([sec.get('speed_cv', 0.0) for sec in per_sector_data.values()])
        features['lap_speed_consistency'] = speed_consistency
        
        total_brake_energy = sum(sec.get('brake_energy', 0.0) for sec in per_sector_data.values())
        features['total_brake_energy'] = total_brake_energy
        
        # Sector transition metrics (stress differences between sectors)
        if len(sectors) > 1:
            for i in range(len(sectors) - 1):
                s1_stress = per_sector_data.get(str(sectors[i]), {}).get('avg_tire_stress', 0.0)
                s2_stress = per_sector_data.get(str(sectors[i+1]), {}).get('avg_tire_stress', 0.0)
                features[f'stress_transition_s{i}_to_s{i+1}'] = abs(s1_stress - s2_stress)
    
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

