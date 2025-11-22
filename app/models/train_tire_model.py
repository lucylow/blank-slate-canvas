#!/usr/bin/env python3
"""
Training script for physics-informed residual tire wear model.

Usage:
  python app/models/train_tire_model.py \
    --data-dir data/precomputed \
    --out-dir models \
    --model-name tire-v1.0 \
    --use-tcn False \
    --cv-folds 5

Outputs:
 - models/<model_name>.pkl  (joblib dict: { 'phys':phys_model, 'residual':res_model, 'config':... })
 - models/manifest.json with metadata & CV metrics
"""
import argparse
import json
import os
from pathlib import Path
import joblib
import pandas as pd
import numpy as np
import time
import logging
from sklearn.linear_model import Ridge
from sklearn.model_selection import KFold, cross_val_score
from sklearn.metrics import mean_squared_error, mean_absolute_error
import lightgbm as lgb

# Optional TCN
USE_TCN_DEFAULT = False
try:
    import torch
    from torch.utils.data import Dataset, DataLoader
    # Try relative import first, then absolute
    try:
        from .tcn_residual import ResidualTCN
    except ImportError:
        from app.models.tcn_residual import ResidualTCN
    has_torch = True
except Exception:
    has_torch = False

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')


def load_precomputed_parquets(data_dir):
    p = Path(data_dir)
    files = list(p.glob("*.parquet"))
    if not files:
        raise FileNotFoundError(f"No parquet files found in {data_dir}")
    dfs = []
    for f in files:
        df = pd.read_parquet(f)
        df['source_file'] = f.name
        dfs.append(df)
    df_all = pd.concat(dfs, ignore_index=True)
    return df_all


def build_features(df):
    """
    Input: per-lap aggregated df (from precompute step)
    Output: feature matrix X (DataFrame) and labels y (Series)
    We attempt to compute label 'laps_until_cliff' using a simple heuristic:
    If the next lap(s) show time increase > threshold, mark laps_until_cliff.
    If lap times are not present, we fall back to surrogate using mean_tire_stress rising trend.
    """
    # basic feature columns (matching precompute)
    feat_cols = ['total_brake_energy', 'total_cornering_energy', 'avg_speed', 'peak_speed', 'mean_tire_temp', 'tire_temp_rise', 'mean_tire_stress', 'dt_total', 'n_samples']
    for c in feat_cols:
        if c not in df.columns:
            df[c] = np.nan

    # attempt to obtain lap_time if present in file (maybe computed upstream)
    if 'lap_time' not in df.columns:
        # create approximate lap_time = dt_total (if dt_total is seconds)
        if 'dt_total' in df.columns:
            df['lap_time'] = df['dt_total']
        else:
            # fallback to NaN
            df['lap_time'] = np.nan

    # build laps_until_cliff label per track+chassis grouping
    grouped = df.groupby(['track','chassis'])
    labels = []
    rows = []
    for (track,chassis), g in grouped:
        g_sorted = g.sort_values('lap').reset_index(drop=True)
        lt = g_sorted['lap_time'].values
        if np.all(np.isnan(lt)) or len(lt) < 3:
            # fallback: use rising mean_tire_stress to create synthetic label
            stress = g_sorted['mean_tire_stress'].ffill().fillna(0).values
            # detect first index where rolling mean increases significantly
            found = np.full(len(g_sorted), np.nan)
            for i in range(len(stress)-1):
                if (stress[i+1] - stress[i]) > (0.2 * max(1.0, np.abs(stress[i]))):
                    found[i] = 1.0
            laps_until = pd.Series(found).fillna(np.nan).values
        else:
            # numeric detection of cliff: when next lap avg increases > threshold (0.5s) sustained 2 laps
            threshold = 0.5
            sustain = 2
            L = len(lt)
            laps_until = np.full(L, np.nan)
            for idx in range(L):
                base = lt[idx]
                found = None
                for j in range(idx+1, L-(sustain-1)):
                    future_mean = lt[j:j+sustain].mean()
                    if (future_mean - base) >= threshold:
                        found = j-idx
                        break
                laps_until[idx] = float(found) if found is not None else np.nan
        # assign rows
        sub = g_sorted.copy()
        sub['laps_until_cliff'] = laps_until
        rows.append(sub)
    df_full = pd.concat(rows, ignore_index=True) if rows else df
    # drop rows without label
    df_full = df_full.reset_index(drop=True)
    # For training we may drop NaN labels (or impute large values)
    train_df = df_full.dropna(subset=['laps_until_cliff']).copy()
    X = train_df[feat_cols].fillna(0.0)
    y = train_df['laps_until_cliff'].astype(float)
    meta = train_df[['track','chassis','lap','source_file']]
    return X, y, meta


def train_physics_baseline(X, y):
    # Simple ridge regression to provide physics baseline coefficients (interpretable)
    model = Ridge(alpha=1.0)
    model.fit(X, y)
    return model


def train_residual_lgb(X, residual, num_boost_round=500):
    dtrain = lgb.Dataset(X.values, label=residual.values)
    params = {
        'objective':'regression',
        'metric':'rmse',
        'verbosity':-1,
        'boosting_type':'gbdt',
        'num_leaves':31,
        'learning_rate':0.05
    }
    bst = lgb.train(params, dtrain, num_boost_round=num_boost_round)
    return bst


# Optional simple TCN training harness (sequence)
if has_torch:
    class SequenceDataset(Dataset):
        def __init__(self, seq_X, seq_y):
            # seq_X: N x T x C
            self.X = torch.tensor(seq_X, dtype=torch.float32)
            self.y = torch.tensor(seq_y, dtype=torch.float32)
        def __len__(self): return len(self.X)
        def __getitem__(self, idx): return self.X[idx], self.y[idx]

    def train_tcn(seq_X, seq_y, in_ch, out_path, epochs=20, batch_size=32, lr=1e-3):
        model = ResidualTCN(in_channels=in_ch, hidden=64, levels=3)
        opt = torch.optim.Adam(model.parameters(), lr=lr)
        ds = SequenceDataset(seq_X, seq_y)
        dl = DataLoader(ds, batch_size=batch_size, shuffle=True)
        for epoch in range(epochs):
            model.train()
            losses = []
            for xb, yb in dl:
                opt.zero_grad()
                pred = model(xb)
                loss = ((pred - yb)**2).mean()
                loss.backward()
                opt.step()
                losses.append(loss.item())
            logging.info("TCN epoch %d mean loss %.5f", epoch, np.mean(losses))
        # save torch model
        torch.save(model.state_dict(), out_path)
        return model


def cross_val_metrics(phys, residual_model, X, y, n_splits=5):
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    rmses = []
    maes = []
    for tr, te in kf.split(X):
        Xtr, Xte = X.iloc[tr], X.iloc[te]
        ytr, yte = y.iloc[tr], y.iloc[te]
        phys_local = Ridge(alpha=1.0)
        phys_local.fit(Xtr, ytr)
        y_phys = phys_local.predict(Xte)
        # residual model: if LightGBM booster
        if isinstance(residual_model, lgb.Booster):
            res_pred = residual_model.predict(Xte.values)
        else:
            res_pred = residual_model.predict(Xte)
        y_pred = y_phys + res_pred
        rmses.append(np.sqrt(mean_squared_error(yte, y_pred)))
        maes.append(mean_absolute_error(yte, y_pred))
    return {'rmse_mean': float(np.mean(rmses)), 'rmse_std': float(np.std(rmses)), 'mae_mean': float(np.mean(maes))}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--data-dir', required=True, help='precomputed per-track parquet dir (from precompute_features)')
    p.add_argument('--out-dir', required=True, help='models output dir')
    p.add_argument('--model-name', default='tire-v1.0', help='model name')
    p.add_argument('--cv-folds', type=int, default=5)
    p.add_argument('--use-tcn', action='store_true', help='also train TCN sequence residual (requires torch)')
    p.add_argument('--tcn-epochs', type=int, default=15)
    args = p.parse_args()

    start = time.time()
    data_dir = args.data_dir
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = load_precomputed_parquets(data_dir)
    logging.info("Loaded %d rows from precomputed data", len(df))

    X, y, meta = build_features(df)
    logging.info("Training dataset shape X=%s y=%s", X.shape, y.shape)

    # physics baseline
    phys = train_physics_baseline(X, y)
    logging.info("Trained physics baseline (Ridge)")

    # compute residual target
    y_phys = phys.predict(X)
    residual = y - y_phys

    # train LightGBM residual
    lgb_model = train_residual_lgb(X, residual, num_boost_round=300)
    logging.info("Trained LightGBM residual model")

    # cross-validate combined model
    metrics = cross_val_metrics(phys, lgb_model, X, y, n_splits=args.cv_folds)
    logging.info("CV metrics: %s", metrics)

    # optionally train TCN if requested (sequence windows)
    tcn_path = None
    if args.use_tcn:
        if not has_torch:
            logging.warning("Torch not available. Skipping TCN training.")
        else:
            # build simple sliding windows from X (rows sorted by track,chassis,lap)
            # NOTE: this is a simplified example: sequence length 8, stride 1
            seq_len = 8
            rows = pd.concat([meta, X, y.rename('y')], axis=1)
            rows = rows.sort_values(['track','chassis','lap']).reset_index(drop=True)
            seq_X = []
            seq_y = []
            vals = rows[X.columns].values
            ys = rows['y'].values
            for i in range(len(vals)-seq_len):
                seq_X.append(vals[i:i+seq_len])
                # target is residual at last element
                seq_y.append( (ys[i+seq_len] - phys.predict(pd.DataFrame(vals[i+seq_len].reshape(1,-1), columns=X.columns))[0]) )
            seq_X = np.array(seq_X)
            seq_y = np.array(seq_y)
            logging.info("TCN dataset shapes: %s %s", seq_X.shape, seq_y.shape)
            if seq_X.shape[0] > 0:
                tcn_model = train_tcn(seq_X, seq_y, in_ch=seq_X.shape[2], out_path=str(out_dir / f"{args.model_name}-tcn.pth"), epochs=args.tcn_epochs)
                tcn_path = str(out_dir / f"{args.model_name}-tcn.pth")

    # package and save models
    model_bundle = {
        'phys_model': phys,
        'residual_model_lgb': lgb_model,
        'feature_columns': list(X.columns),
        'model_name': args.model_name,
        'created_at': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        'metrics': metrics
    }
    if tcn_path:
        model_bundle['tcn_path'] = tcn_path

    out_path = out_dir / f"{args.model_name}.pkl"
    joblib.dump(model_bundle, out_path)
    logging.info("Saved model bundle to %s", out_path)

    # write manifest.json
    manifest = {
        'model_name': args.model_name,
        'created_at': model_bundle['created_at'],
        'model_file': str(out_path),
        'metrics': metrics,
        'feature_columns': model_bundle['feature_columns']
    }
    manifest_path = out_dir / "manifest.json"
    with open(manifest_path, 'w') as fh:
        json.dump(manifest, fh, indent=2)
    logging.info("Wrote manifest: %s", manifest_path)

    logging.info("Total training time: %.1f s", time.time() - start)


if __name__ == '__main__':
    main()

