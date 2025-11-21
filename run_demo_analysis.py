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

def normalize_and_stats(df):
    # normalize common columns
    rename_map = {}
    for col in df.columns:
        lc = col.lower()
        if "speed" in lc and "km" in lc:
            rename_map[col] = "speed_kmh"
        elif lc in ("speed","spd"):
            rename_map[col] = "speed_kmh"
        elif "lapdist" in lc or "lap_dist" in lc:
            rename_map[col] = "lapdist_m"
        elif "throttle" in lc:
            rename_map[col] = "throttle"
        elif "brake" in lc:
            rename_map[col] = "brake"
        elif "tire" in lc and "temp" in lc:
            rename_map[col] = "tire_temp"
        elif "vehicle" in lc or "chassis" in lc or "original_vehicle_id" in lc:
            rename_map[col] = "chassis"
        elif lc == "lap":
            rename_map[col] = "lap"
    if rename_map:
        df = df.rename(columns=rename_map)
    # coerce numeric
    for c in df.columns:
        try:
            if df.dtypes[c] == 'object':
                df[c] = pd.to_numeric(df[c], errors="ignore")
        except (KeyError, AttributeError, Exception):
            pass
    numeric = df.select_dtypes(include=[np.number]).copy()
    
    # Get vehicle count
    n_vehicles = None
    try:
        if 'chassis' in df.columns:
            unique_vals = df['chassis'].unique()
            n_vehicles = len(unique_vals) if hasattr(unique_vals, '__len__') else int(unique_vals) if isinstance(unique_vals, (int, np.integer)) else None
        elif 'vehicle_id' in df.columns:
            unique_vals = df['vehicle_id'].unique()
            n_vehicles = len(unique_vals) if hasattr(unique_vals, '__len__') else int(unique_vals) if isinstance(unique_vals, (int, np.integer)) else None
    except Exception:
        n_vehicles = None
    
    stats = {
        "n_samples": int(len(df)),
        "n_vehicles": n_vehicles,
        "avg_speed_kmh": float(numeric['speed_kmh'].mean()) if 'speed_kmh' in numeric.columns else None,
        "std_speed_kmh": float(numeric['speed_kmh'].std()) if 'speed_kmh' in numeric.columns else None,
        "avg_tire_temp": float(numeric['tire_temp'].mean()) if 'tire_temp' in numeric.columns else None,
        "numeric_cols": numeric.columns.tolist()
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
    kmeans = KMeans(n_clusters=k, random_state=42).fit(Xs)
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

