#!/usr/bin/env python3

"""
Run demo analysis over demo_data.json (7 tracks) and produce eda_results_summary.json.

Usage:
  python run_demo_analysis.py

Requirements (recommended):
  pip install pandas numpy scikit-learn requests
"""

import os, json, math, random, sys
import gzip
import tarfile
from pathlib import Path
import requests
import numpy as np
import pandas as pd

RAW_URL = "https://raw.githubusercontent.com/lucylow/blank-slate-canvas/main/demo_data.json"
OUT_PATH = Path("eda_results_summary.json")

def fetch_demo_bundle(raw_url=RAW_URL, target="demo_data.json"):
    print("Downloading demo bundle from:", raw_url)
    r = requests.get(raw_url, timeout=30)
    r.raise_for_status()
    with open(target, "wb") as f:
        f.write(r.content)
    print("Saved to", target)
    return Path(target)

def load_tracks_from_bundle(path: Path):
    tracks = []
    
    # Check if it's a tar.gz archive
    try:
        with tarfile.open(path, 'r:gz') as tar:
            # Extract track JSON files from demo_data/ directory
            track_files = [m for m in tar.getmembers() if m.name.endswith('_demo.json') and 'demo_data/' in m.name and not m.name.startswith('demo_data/._')]
            
            if track_files:
                print(f"Found {len(track_files)} track files in tar archive")
                for member in track_files:
                    try:
                        f = tar.extractfile(member)
                        if f:
                            data = json.load(f)
                            tid = data.get("track_id") or member.name.replace('demo_data/', '').replace('_demo.json', '')
                            track_name = data.get("track_name", tid)
                            tracks.append({"track_id": tid, "track_name": track_name, "payload": data})
                            print(f"  Loaded: {tid}")
                    except Exception as e:
                        print(f"  Warning: Failed to load {member.name}: {e}")
                        continue
                
                if tracks:
                    return tracks
    except (tarfile.TarError, Exception) as e:
        # Not a tar file, try regular JSON
        pass
    
    # Try to read as regular JSON
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        # Try gzip decompression - read as binary first
        try:
            with open(path, 'rb') as f:
                # Check if it's gzip by reading first 2 bytes
                magic = f.read(2)
                f.seek(0)
                if magic == b'\x1f\x8b':  # gzip magic number
                    with gzip.open(f, 'rt', encoding='utf-8', errors='replace') as gz:
                        data = json.load(gz)
                else:
                    # Not gzip, try reading as text with error handling
                    f.seek(0)
                    content = f.read()
                    data = json.loads(content.decode('utf-8', errors='replace'))
        except Exception as e:
            print(f"Failed to read {path}: {e}")
            raise
    
    # Handle regular JSON structure
    if isinstance(data, dict) and "tracks" in data:
        for t in data["tracks"]:
            tid = t.get("track_id") or t.get("track") or t.get("track_name", "unknown")
            tracks.append({"track_id": tid, "track_name": t.get("track_name", tid), "payload": t})
    elif isinstance(data, list):
        for t in data:
            tid = t.get("track_id") or t.get("track") or t.get("track_name", "unknown")
            tracks.append({"track_id": tid, "track_name": t.get("track_name", tid), "payload": t})
    else:
        # fallback: treat whole file as single track
        tracks.append({"track_id": "bundle", "track_name": "bundle", "payload": data})
    
    return tracks

def build_df_from_payload(payload):
    rows = []
    if isinstance(payload, dict):
        if "races" in payload and isinstance(payload["races"], list):
            for r in payload["races"]:
                samples = r.get("telemetry_sample") or r.get("telemetry") or r.get("telemetry_samples") or []
                for s in samples:
                    rows.append(s)
        if "telemetry" in payload and isinstance(payload["telemetry"], list):
            for s in payload["telemetry"]:
                rows.append(s)
        if "data" in payload and isinstance(payload["data"], list):
            for s in payload["data"]:
                rows.append(s)
    elif isinstance(payload, list):
        rows = payload
    if not rows:
        return None
    df = pd.DataFrame.from_records(rows)
    return df

def pivot_telemetry(df):
    """Pivot long-format telemetry (telemetry_name/telemetry_value) into wide format"""
    if df is None or df.empty:
        return None
    
    # Check if data is in long format (has telemetry_name and telemetry_value)
    if 'telemetry_name' in df.columns and 'telemetry_value' in df.columns:
        # Create a unique key for grouping (timestamp + vehicle + lap)
        group_cols = []
        for col in ['timestamp', 'vehicle_id', 'vehicle_number', 'original_vehicle_id', 'lap']:
            if col in df.columns:
                group_cols.append(col)
        
        if not group_cols:
            # Fallback: use index
            df['_group_key'] = df.index
            group_cols = ['_group_key']
        
        # Pivot the data
        pivoted = df.pivot_table(
            index=group_cols,
            columns='telemetry_name',
            values='telemetry_value',
            aggfunc='first'  # Take first value if duplicates
        ).reset_index()
        
        # Flatten column names
        pivoted.columns.name = None
        
        # Merge back other metadata columns that weren't in the pivot
        meta_cols = [col for col in df.columns if col not in ['telemetry_name', 'telemetry_value'] and col not in group_cols]
        if meta_cols:
            # Get first occurrence of each group for metadata
            meta_df = df.groupby(group_cols)[meta_cols].first().reset_index()
            pivoted = pivoted.merge(meta_df, on=group_cols, how='left')
        
        # Drop temporary group key if we created it
        if '_group_key' in pivoted.columns:
            pivoted = pivoted.drop(columns=['_group_key'])
        
        return pivoted
    else:
        # Data is already in wide format
        return df

def normalize_and_stats(df):
    """Normalize column names and compute statistics"""
    # First pivot if needed
    df = pivot_telemetry(df)
    if df is None or df.empty:
        return None, {"n_samples": 0, "note": "empty dataframe after pivot"}
    
    # Normalize column names - map telemetry channel names to standard names
    rename_map = {}
    for col in df.columns:
        lc = str(col).lower()
        # Map telemetry channel names
        if lc == 'speed':
            rename_map[col] = "speed_kmh"
        elif lc == 'ath':
            rename_map[col] = "throttle_pct"
        elif lc in ('pbrake_f', 'pbrake_r', 'brake'):
            rename_map[col] = "brake_pct"
        elif 'tire' in lc and 'temp' in lc:
            rename_map[col] = "tire_temp"
        elif lc == 'accx_can':
            rename_map[col] = "accx_can"
        elif lc == 'accy_can':
            rename_map[col] = "accy_can"
        elif lc == 'nmot' or lc == 'rpm':
            rename_map[col] = "rpm"
        elif 'vehicle' in lc or 'chassis' in lc or lc == 'original_vehicle_id':
            rename_map[col] = "vehicle_id"
        elif lc == 'lap':
            rename_map[col] = "lap"
    
    if rename_map:
        df = df.rename(columns=rename_map)
    
    # Coerce numeric columns
    for c in df.columns:
        try:
            if c in df.dtypes.index and df.dtypes[c] == 'object':
                df[c] = pd.to_numeric(df[c], errors="ignore")
        except (KeyError, AttributeError, Exception):
            pass
    
    numeric = df.select_dtypes(include=[np.number]).copy()
    
    # Get vehicle count - try multiple column names (before numeric coercion)
    # We need to check this before converting to numeric, as vehicle_id might be a string
    n_vehicles = None
    try:
        # Check original df before numeric conversion for string vehicle IDs
        for veh_col in ['vehicle_id', 'vehicle_number', 'original_vehicle_id', 'chassis']:
            if veh_col in df.columns:
                # Get unique values - handle both string and numeric IDs
                unique_vals = df[veh_col].dropna()
                if len(unique_vals) > 0:
                    # Convert to unique set
                    unique_set = unique_vals.unique()
                    n_vehicles = len(unique_set) if hasattr(unique_set, '__len__') else 1
                    if n_vehicles is not None and n_vehicles > 0:
                        break
    except Exception:
        n_vehicles = None
    
    # Also check numeric columns for vehicle_number (integer)
    if n_vehicles is None:
        try:
            if 'vehicle_number' in numeric.columns:
                unique_vals = numeric['vehicle_number'].dropna().unique()
                if len(unique_vals) > 0:
                    n_vehicles = len(unique_vals) if hasattr(unique_vals, '__len__') else 1
        except Exception:
            pass
    
    # Extract stats from pivoted data
    def safe_mean(series):
        """Safely get mean value, handling edge cases"""
        try:
            mean_val = series.mean()
            if pd.isna(mean_val):
                return None
            return float(mean_val) if not isinstance(mean_val, (list, pd.Series)) else float(mean_val.iloc[0]) if len(mean_val) > 0 else None
        except Exception:
            return None
    
    def safe_std(series):
        """Safely get std value, handling edge cases"""
        try:
            std_val = series.std()
            if pd.isna(std_val):
                return None
            return float(std_val) if not isinstance(std_val, (list, pd.Series)) else float(std_val.iloc[0]) if len(std_val) > 0 else None
        except Exception:
            return None
    
    stats = {
        "n_samples": int(len(df)),
        "n_vehicles": n_vehicles,
        "avg_speed_kmh": safe_mean(numeric['speed_kmh']) if 'speed_kmh' in numeric.columns else None,
        "std_speed_kmh": safe_std(numeric['speed_kmh']) if 'speed_kmh' in numeric.columns else None,
        "avg_throttle_pct": safe_mean(numeric['throttle_pct']) if 'throttle_pct' in numeric.columns else None,
        "avg_brake_pct": safe_mean(numeric['brake_pct']) if 'brake_pct' in numeric.columns else None,
        "avg_tire_temp": safe_mean(numeric['tire_temp']) if 'tire_temp' in numeric.columns else None,
        "avg_rpm": safe_mean(numeric['rpm']) if 'rpm' in numeric.columns else None,
        "numeric_cols": list(numeric.columns)
    }
    return numeric, stats

def do_clustering(numeric, features=None):
    try:
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import StandardScaler
    except Exception as e:
        print("scikit-learn not available; skipping clustering:", e)
        return None
    if numeric is None or numeric.empty:
        return None
    candidate = features or [c for c in ['speed_kmh','lapdist_m','throttle','brake','tire_temp'] if c in numeric.columns]
    if not candidate:
        return None
    sample_df = numeric[candidate].dropna()
    if len(sample_df) < 5:
        return None
    # sample for speed if large
    if len(sample_df) > 2000:
        sample_df = sample_df.sample(n=2000, random_state=42)
    scaler = StandardScaler().fit(sample_df.values)
    Xs = scaler.transform(sample_df.values)
    k = 3 if len(sample_df) >= 6 else 2
    kmeans = KMeans(n_clusters=k, n_init=10, random_state=42).fit(Xs)
    labels = kmeans.labels_
    sizes = dict(zip(*np.unique(labels, return_counts=True)))
    centroids = scaler.inverse_transform(kmeans.cluster_centers_).tolist()
    centroids_out = {str(i): {candidate[j]: float(centroids[i][j]) for j in range(len(candidate))} for i in range(k)}
    return {"n_clusters": int(k), "sizes": {str(int(kp)): int(sizes.get(kp,0)) for kp in sizes}, "centroids": centroids_out}

def analyze_and_write(tracks, out_path=OUT_PATH):
    results = {}
    for t in tracks:
        tid = t.get("track_id")
        payload = t.get("payload")
        df = build_df_from_payload(payload)
        if df is None or df.empty:
            results[tid] = {"track_name": t.get("track_name"), "n_samples": 0, "note": "no telemetry samples found"}
            continue
        numeric, stats = normalize_and_stats(df)
        cluster_info = do_clustering(numeric)
        stats["cluster_info"] = cluster_info
        results[tid] = stats
        print(f"Analyzed {tid}: samples={stats['n_samples']}, vehicles={stats['n_vehicles']}, avg_speed={stats['avg_speed_kmh']}")
    # write out
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("Wrote results to", out_path)
    return results

def main():
    # Try to use local demo_data.json first
    local_path = Path("demo_data.json")
    if local_path.exists():
        print(f"Using local demo_data.json at {local_path.absolute()}")
        demo_file = local_path
    else:
        try:
            demo_file = fetch_demo_bundle()
        except Exception as e:
            print("Failed to download demo bundle:", e)
            sys.exit(1)
    
    tracks = load_tracks_from_bundle(demo_file)
    if not tracks:
        print("No tracks parsed from bundle.")
        sys.exit(1)
    
    print(f"Found {len(tracks)} track(s) to analyze")
    analyze_and_write(tracks)

if __name__ == "__main__":
    main()

