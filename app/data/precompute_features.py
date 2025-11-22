#!/usr/bin/env python3
"""
Precompute per-sample, per-sector and per-lap aggregates from a telemetry archive.

Usage:
  python app/data/precompute_features.py \
    --archive file:///mnt/data/pitwall-backend-v2.tar.gz \
    --out-dir data/precomputed \
    --tracks-sectors assets/track_sectors.json

This script will:
 - extract the archive (if file://)
 - scan for telemetry CSV/Parquet files
 - parse them in chunks to compute per-sample derived signals (e.g. instantaneous tire stress)
 - group into laps and sectors, compute per-lap aggregates (brake_energy, cornering_energy, avg_speed, temp_rise, etc.)
 - write per-track parquet files under --out-dir (e.g. data/precomputed/<track>.parquet)
"""
import argparse
import os
import tarfile
import tempfile
import json
from pathlib import Path
import pandas as pd
import numpy as np
from tqdm import tqdm
import math
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

SAMPLE_COLUMNS_CANDIDATES = [
    # common column name variants; adapt to your telemetry schema
    'meta_time','timestamp','time',
    'track','lap','lapdist_m','lap_distance',
    'chassis','car_id','vehicle',
    'speed_kmh','speed','kmh',
    'accx_can','acc_x','ax',
    'accy_can','acc_y','ay',
    'brake_pressure','brake','brake_psi',
    'throttle','throttle_pct',
    'Steering_Angle','steering_angle',
    'wheel_temp_fl','wheel_temp_fr','wheel_temp_rl','wheel_temp_rr',
    'wheel_spd_fl','wheel_spd_fr','wheel_spd_rl','wheel_spd_rr',
    'rpm'
]

def safe_extract(archive_path, extract_to):
    logging.info("Extracting archive %s -> %s", archive_path, extract_to)
    if archive_path.startswith("file://"):
        archive_path = archive_path[len("file://"):]
    if not os.path.exists(archive_path):
        raise FileNotFoundError(archive_path)
    with tarfile.open(archive_path, "r:*") as tf:
        tf.extractall(path=extract_to)
    logging.info("Extraction complete.")

def find_telemetry_files(root):
    rootp = Path(root)
    files = []
    for ext in ('.parquet', '.pq', '.csv', '.jsonl', '.ndjson'):
        files.extend(rootp.rglob(f'*{ext}'))
    # try also nested /data or /telemetry folders
    return sorted(files)

def identify_cols(df):
    # map common telemetry names to canonical names used below
    cols = {c.lower():c for c in df.columns}
    mapping = {}
    # heuristics
    def pick(keys):
        for k in keys:
            if k.lower() in cols:
                return cols[k.lower()]
        return None
    mapping['meta_time'] = pick(['meta_time','timestamp','time'])
    mapping['track'] = pick(['track'])
    mapping['lap'] = pick(['lap'])
    mapping['lapdist_m'] = pick(['lapdist_m','lap_distance'])
    mapping['chassis'] = pick(['chassis','car','vehicle','car_id'])
    mapping['speed_kmh'] = pick(['speed_kmh','speed','kmh'])
    mapping['accx_can'] = pick(['accx_can','acc_x','ax'])
    mapping['accy_can'] = pick(['accy_can','acc_y','ay'])
    mapping['brake_pressure'] = pick(['brake_pressure','brake','brake_psi'])
    mapping['throttle'] = pick(['throttle','throttle_pct'])
    mapping['steering'] = pick(['steering_angle','steering'])
    # temps
    mapping['wt_fl'] = pick(['wheel_temp_fl','wt_fl','tire_temp_fl'])
    mapping['wt_fr'] = pick(['wheel_temp_fr','wt_fr','tire_temp_fr'])
    mapping['wt_rl'] = pick(['wheel_temp_rl','wt_rl','tire_temp_rl'])
    mapping['wt_rr'] = pick(['wheel_temp_rr','wt_rr','tire_temp_rr'])
    # wheel speeds
    mapping['ws_fl'] = pick(['wheel_spd_fl','ws_fl'])
    mapping['ws_fr'] = pick(['wheel_spd_fr','ws_fr'])
    mapping['ws_rl'] = pick(['wheel_spd_rl','ws_rl'])
    mapping['ws_rr'] = pick(['wheel_spd_rr','ws_rr'])
    mapping['rpm'] = pick(['rpm'])
    return mapping

def compute_instantaneous_features(df, cols):
    # compute derived per-sample features. df is a DataFrame chunk
    # Ensure numeric
    for k,v in cols.items():
        if v is None: continue
        try:
            df[v] = pd.to_numeric(df[v], errors='coerce')
        except Exception:
            pass
    # speed -> km/h normalized
    if cols.get('speed_kmh'):
        df['speed_kmh'] = df[cols['speed_kmh']]

    # approximate dt: try meta_time if present, otherwise infer from index freq
    if cols.get('meta_time'):
        df['meta_time'] = pd.to_datetime(df[cols['meta_time']])
        df = df.sort_values('meta_time')
        df['dt'] = df['meta_time'].diff().dt.total_seconds().fillna(0.02)  # fallback 50Hz ~0.02s
    else:
        df['dt'] = 0.02

    # compute instantaneous tire stress (simple proxy): ax^2 + ay^2 + steering^2
    ax = cols.get('accx_can')
    ay = cols.get('accy_can')
    st = cols.get('steering')
    df['tire_stress_inst'] = 0.0
    if ax: df['tire_stress_inst'] += df[ax].fillna(0.0).astype(float).pow(2)
    if ay: df['tire_stress_inst'] += df[ay].fillna(0.0).astype(float).pow(2)
    if st: df['tire_stress_inst'] += (df[st].fillna(0.0).abs() / 180.0).pow(2)

    # brake energy surrogate: brake_pressure * speed * dt (numeric surrogate)
    bp = cols.get('brake_pressure')
    if bp and cols.get('speed_kmh'):
        # convert km/h to m/s: /3.6
        df['brake_energy_inst'] = (df[bp].fillna(0.0).astype(float) * (df['speed_kmh'].fillna(0.0).astype(float)/3.6) * df['dt']).abs()
    else:
        df['brake_energy_inst'] = 0.0

    # cornering energy surrogate: lateral accel^2 * dt
    if ay:
        df['cornering_energy_inst'] = df[ay].fillna(0.0).astype(float).pow(2) * df['dt']
    else:
        df['cornering_energy_inst'] = 0.0

    # wheel temps mean
    temps = [cols.get('wt_fl'), cols.get('wt_fr'), cols.get('wt_rl'), cols.get('wt_rr')]
    temp_cols = [c for c in temps if c]
    if temp_cols:
        df['tire_temp_mean'] = df[temp_cols].astype(float).mean(axis=1)
    else:
        df['tire_temp_mean'] = np.nan

    return df

def aggregate_lap_sector(df):
    """
    Input: df containing a single car's telemetry for a session (sorted by time)
    Output: DataFrame rows = per-lap-per-sector aggregates with chosen features
    """
    out_rows = []
    if 'lap' not in df.columns or 'lapdist_m' not in df.columns:
        # fallback: treat entire stream as single lap
        df['lap'] = df.get('lap', 1)
        df['sector'] = 0
    # define simplistic sectors: divide lapdist into thirds if no sector map
    # compute sector boundaries per lap
    for lap_no, lap_df in df.groupby('lap'):
        if lap_df.empty: continue
        max_ld = lap_df['lapdist_m'].max() if 'lapdist_m' in lap_df.columns else None
        # sectors fallback: (0..max)/3
        if max_ld is None or math.isnan(max_ld) or max_ld <= 0:
            lap_df['sector'] = 0
        else:
            edges = [0, max_ld/3.0, 2*max_ld/3.0, max_ld+1]
            # assign sector
            lap_df['sector'] = lap_df['lapdist_m'].apply(lambda x: sum([1 for e in edges if x >= e]) - 1)
        # aggregate per-sector
        for sector, sec_df in lap_df.groupby('sector'):
            row = {
                'track': sec_df.get('track', pd.Series([None])).iloc[0] if 'track' in sec_df.columns else None,
                'chassis': sec_df.get('chassis', pd.Series([None])).iloc[0] if 'chassis' in sec_df.columns else None,
                'lap': lap_no,
                'sector': int(sector),
                'n_samples': len(sec_df),
                'avg_speed': sec_df['speed_kmh'].mean() if 'speed_kmh' in sec_df.columns else np.nan,
                'peak_speed': sec_df['speed_kmh'].max() if 'speed_kmh' in sec_df.columns else np.nan,
                'total_brake_energy': sec_df['brake_energy_inst'].sum(),
                'total_cornering_energy': sec_df['cornering_energy_inst'].sum(),
                'mean_tire_temp': sec_df['tire_temp_mean'].mean() if 'tire_temp_mean' in sec_df.columns else np.nan,
                'tire_temp_rise': (sec_df['tire_temp_mean'].iloc[-1]-sec_df['tire_temp_mean'].iloc[0]) if 'tire_temp_mean' in sec_df.columns and len(sec_df)>=2 else np.nan,
                'mean_tire_stress': sec_df['tire_stress_inst'].mean(),
                'dt_total': sec_df['dt'].sum()
            }
            out_rows.append(row)
    return pd.DataFrame(out_rows)

def create_laps_to_cliff_label(lap_aggregates, lap_time_df, cliff_delta_s=0.5, sustained_laps=2):
    """
    Create label: laps_until_cliff for each lap.
    Approach: for each lap i, consider future lap times and find earliest lap j > i such that
      (avg lap_time[j:j+sustained_laps] - lap_time[i]) >= cliff_delta_s
    Return DataFrame with columns [track,chassis,lap,laps_until_cliff]
    """
    # lap_time_df: DataFrame with columns ['track','chassis','lap','lap_time']
    out = []
    grouped = lap_time_df.groupby(['track','chassis'])
    for (track,chassis), g in grouped:
        g_sorted = g.sort_values('lap').reset_index(drop=True)
        lt = g_sorted['lap_time'].values
        L = len(lt)
        for idx in range(L):
            base = lt[idx]
            found = None
            for j in range(idx+1, L - (sustained_laps-1)):
                future_mean = lt[j:j+sustained_laps].mean()
                if (future_mean - base) >= cliff_delta_s:
                    found = j - idx
                    break
            laps_until = float(found) if found is not None else np.nan
            out.append({'track':track,'chassis':chassis,'lap':int(g_sorted.loc[idx,'lap']),'laps_until_cliff':laps_until})
    return pd.DataFrame(out)

def process_archive(archive_path, out_dir, tracks_sectors=None):
    workdir = tempfile.mkdtemp(prefix="pitwall_precompute_")
    if archive_path.startswith("file://"):
        safe_extract(archive_path, workdir)
    else:
        raise ValueError("Only local file:// archive supported for now. Got: %s" % archive_path)

    telemetry_files = find_telemetry_files(workdir)
    logging.info("Found %d telemetry files", len(telemetry_files))
    if len(telemetry_files) == 0:
        raise RuntimeError("No telemetry files found in extracted archive.")

    per_track_aggregates = {}

    for fpath in telemetry_files:
        logging.info("Processing telemetry file: %s", fpath)
        ext = fpath.suffix.lower()
        if ext in ('.parquet', '.pq'):
            # read full
            df = pd.read_parquet(fpath)
            files_iter = [df]
        elif ext in ('.csv',):
            # read in chunks
            files_iter = pd.read_csv(fpath, chunksize=200000)
        else:
            # try to read as json lines
            try:
                df = pd.read_json(fpath, lines=True)
                files_iter = [df]
            except Exception:
                logging.warning("Skipping unknown file: %s", fpath)
                continue

        # aggregate by chassis-session: accumulate per-chassis list and process per-chassis
        # For memory reasons we process file chunk by chunk and group by chassis+lap within chunk
        buffer_by_chassis = {}
        for chunk in files_iter:
            if chunk.empty:
                continue
            mapping = identify_cols(chunk)
            chunk = compute_instantaneous_features(chunk, mapping)
            # ensure standard names exist
            # normalize columns rename mapping
            rename_map = {}
            for k,v in mapping.items():
                if v:
                    rename_map[v] = k
            chunk = chunk.rename(columns=rename_map)

            # require 'chassis' and 'lap'
            if 'chassis' not in chunk.columns:
                chunk['chassis'] = 'unknown'
            if 'lap' not in chunk.columns:
                # try infer lap=1
                chunk['lap'] = 1

            for (chassis, lap), group in chunk.groupby(['chassis','lap']):
                key = (chassis,)
                # accumulate per-chassis per-lap in memory (safe for demo datasets)
                if key not in buffer_by_chassis:
                    buffer_by_chassis[key] = []
                buffer_by_chassis[key].append(group)

            # flush buffer_by_chassis into lap-level processing
            for (chassis,), groups in list(buffer_by_chassis.items()):
                full = pd.concat(groups, ignore_index=True)
                # group by lap to produce per-lap aggregates
                per_lap_aggs = aggregate_lap_sector(full)
                # store per track
                track = full.get('track', pd.Series([None])).iloc[0]
                key_track = track or 'unknown'
                if key_track not in per_track_aggregates:
                    per_track_aggregates[key_track] = []
                per_track_aggregates[key_track].append(per_lap_aggs)
                buffer_by_chassis.pop((chassis,), None)

    # finalize and write per-track parquet
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    for track, pieces in per_track_aggregates.items():
        df_all = pd.concat(pieces, ignore_index=True) if pieces else pd.DataFrame()
        if df_all.empty:
            logging.info("No aggregates for track %s", track)
            continue
        # compute per-lap aggregate by summing sectors
        df_lap = df_all.groupby(['track','chassis','lap']).agg({
            'n_samples':'sum',
            'dt_total':'sum',
            'total_brake_energy':'sum',
            'total_cornering_energy':'sum',
            'avg_speed':'mean',
            'peak_speed':'max',
            'mean_tire_temp':'mean',
            'tire_temp_rise':'sum',
            'mean_tire_stress':'mean'
        }).reset_index()
        out_path = out_dir / f"{(str(track) or 'unknown').replace(' ','_')}.parquet"
        df_lap.to_parquet(out_path, index=False)
        logging.info("Wrote precomputed file: %s (%d rows)", out_path, len(df_lap))

    logging.info("Precompute complete. Output dir: %s", out_dir)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--archive', required=True, help='file:///... tar.gz archive of backend telemetry files')
    p.add_argument('--out-dir', required=True, help='output directory for precomputed parquet per-track')
    p.add_argument('--tracks-sectors', default=None, help='optional JSON map for track sectors')
    args = p.parse_args()
    process_archive(args.archive, args.out_dir, args.tracks_sectors)

if __name__ == '__main__':
    main()

