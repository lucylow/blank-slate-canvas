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
from sklearn.linear_model import Ridge, ElasticNet
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
import lightgbm as lgb

# Optional advanced libraries
try:
    import xgboost as xgb
    has_xgb = True
except ImportError:
    has_xgb = False
    logging.warning("XGBoost not available. Install with: pip install xgboost")

try:
    import catboost as cb
    has_catboost = True
except ImportError:
    has_catboost = False
    logging.warning("CatBoost not available. Install with: pip install catboost")

try:
    import optuna
    has_optuna = True
except ImportError:
    has_optuna = False
    logging.warning("Optuna not available. Install with: pip install optuna")

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


def train_physics_baseline(X, y, model_type='ridge'):
    """
    Train physics-informed baseline model with improved regularization.
    
    Args:
        X: Feature matrix
        y: Target values
        model_type: 'ridge' or 'elastic_net'
    
    Returns:
        Trained model
    """
    if model_type == 'elastic_net':
        # ElasticNet combines L1 and L2 regularization for better feature selection
        model = ElasticNet(alpha=0.5, l1_ratio=0.5, max_iter=2000, random_state=42)
    else:
        # Improved Ridge with better regularization
        model = Ridge(alpha=1.5, max_iter=2000, solver='auto', random_state=42)
    model.fit(X, y)
    return model


def train_residual_lgb(X, residual, num_boost_round=1000, validation_split=0.2, early_stopping_rounds=50):
    """
    Train improved LightGBM model with better hyperparameters and early stopping.
    
    Args:
        X: Feature matrix
        residual: Residual targets
        num_boost_round: Maximum number of boosting rounds
        validation_split: Fraction of data to use for validation
        early_stopping_rounds: Early stopping patience
    
    Returns:
        Trained LightGBM booster
    """
    X_train, X_val, y_train, y_val = train_test_split(
        X.values, residual.values, test_size=validation_split, random_state=42
    )
    
    dtrain = lgb.Dataset(X_train, label=y_train)
    dval = lgb.Dataset(X_val, label=y_val, reference=dtrain)
    
    # Improved hyperparameters based on best practices
    params = {
        'objective': 'regression',
        'metric': 'rmse',
        'verbosity': -1,
        'boosting_type': 'gbdt',
        'num_leaves': 63,  # Increased for better capacity
        'learning_rate': 0.03,  # Lower learning rate for better generalization
        'feature_fraction': 0.8,  # Feature subsampling for regularization
        'bagging_fraction': 0.8,  # Data subsampling
        'bagging_freq': 5,
        'min_child_samples': 20,  # Minimum samples per leaf
        'max_depth': -1,  # No limit but controlled by num_leaves
        'reg_alpha': 0.1,  # L1 regularization
        'reg_lambda': 0.1,  # L2 regularization
        'random_state': 42,
        'force_row_wise': True
    }
    
    bst = lgb.train(
        params,
        dtrain,
        num_boost_round=num_boost_round,
        valid_sets=[dtrain, dval],
        valid_names=['train', 'eval'],
        callbacks=[
            lgb.early_stopping(stopping_rounds=early_stopping_rounds, verbose=False),
            lgb.log_evaluation(period=100)
        ]
    )
    return bst

def train_residual_xgb(X, residual, num_boost_round=1000, validation_split=0.2):
    """
    Train XGBoost model as an alternative gradient boosting approach.
    
    Args:
        X: Feature matrix
        residual: Residual targets
        num_boost_round: Maximum number of boosting rounds
        validation_split: Fraction of data to use for validation
    
    Returns:
        Trained XGBoost booster
    """
    if not has_xgb:
        raise ImportError("XGBoost not available")
    
    X_train, X_val, y_train, y_val = train_test_split(
        X.values, residual.values, test_size=validation_split, random_state=42
    )
    
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    
    params = {
        'objective': 'reg:squarederror',
        'eval_metric': 'rmse',
        'max_depth': 6,
        'learning_rate': 0.03,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'gamma': 0.1,
        'reg_alpha': 0.1,
        'reg_lambda': 1.0,
        'random_state': 42,
        'verbosity': 0
    }
    
    evals_result = {}
    bst = xgb.train(
        params,
        dtrain,
        num_boost_round=num_boost_round,
        evals=[(dtrain, 'train'), (dval, 'eval')],
        evals_result=evals_result,
        early_stopping_rounds=50,
        verbose_eval=100
    )
    return bst

def train_residual_catboost(X, residual, iterations=1000, validation_split=0.2):
    """
    Train CatBoost model for potentially better handling of features.
    
    Args:
        X: Feature matrix
        residual: Residual targets
        iterations: Maximum number of iterations
        validation_split: Fraction of data to use for validation
    
    Returns:
        Trained CatBoost model
    """
    if not has_catboost:
        raise ImportError("CatBoost not available")
    
    X_train, X_val, y_train, y_val = train_test_split(
        X.values, residual.values, test_size=validation_split, random_state=42
    )
    
    model = cb.CatBoostRegressor(
        iterations=iterations,
        learning_rate=0.03,
        depth=6,
        loss_function='RMSE',
        eval_metric='RMSE',
        random_seed=42,
        verbose=100,
        early_stopping_rounds=50,
        reg_lambda=1.0,
        border_count=128,
        l2_leaf_reg=3.0
    )
    
    model.fit(
        X_train, y_train,
        eval_set=(X_val, y_val),
        use_best_model=True,
        verbose=100
    )
    return model

def train_ensemble_residual(X, residual, include_xgb=True, include_catboost=True):
    """
    Train ensemble of multiple gradient boosting models.
    
    Args:
        X: Feature matrix
        residual: Residual targets
        include_xgb: Whether to include XGBoost
        include_catboost: Whether to include CatBoost
    
    Returns:
        Dictionary of trained models
    """
    models = {}
    
    # Always train LightGBM
    logging.info("Training LightGBM...")
    models['lgb'] = train_residual_lgb(X, residual)
    
    # Optionally train XGBoost
    if include_xgb and has_xgb:
        try:
            logging.info("Training XGBoost...")
            models['xgb'] = train_residual_xgb(X, residual)
        except Exception as e:
            logging.warning(f"XGBoost training failed: {e}")
    
    # Optionally train CatBoost
    if include_catboost and has_catboost:
        try:
            logging.info("Training CatBoost...")
            models['catboost'] = train_residual_catboost(X, residual)
        except Exception as e:
            logging.warning(f"CatBoost training failed: {e}")
    
    return models

def predict_ensemble(models, X):
    """
    Make predictions using ensemble of models (weighted average).
    
    Args:
        models: Dictionary of trained models
        X: Feature matrix
    
    Returns:
        Ensemble predictions
    """
    predictions = []
    weights = []
    
    # LightGBM (primary model, higher weight)
    if 'lgb' in models:
        pred = models['lgb'].predict(X.values if hasattr(X, 'values') else X)
        predictions.append(pred)
        weights.append(0.5)
    
    # XGBoost
    if 'xgb' in models and has_xgb:
        try:
            X_matrix = X.values if hasattr(X, 'values') else X
            pred = models['xgb'].predict(xgb.DMatrix(X_matrix))
            predictions.append(pred)
            weights.append(0.25)
        except Exception as e:
            logging.warning(f"XGBoost prediction failed: {e}")
    
    # CatBoost
    if 'catboost' in models and has_catboost:
        try:
            pred = models['catboost'].predict(X.values if hasattr(X, 'values') else X)
            predictions.append(pred)
            weights.append(0.25)
        except Exception as e:
            logging.warning(f"CatBoost prediction failed: {e}")
    
    # Normalize weights
    total_weight = sum(weights)
    weights = [w / total_weight for w in weights]
    
    # Weighted average
    ensemble_pred = np.zeros_like(predictions[0])
    for pred, weight in zip(predictions, weights):
        ensemble_pred += pred * weight
    
    return ensemble_pred


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
    """
    Improved cross-validation with ensemble model support.
    
    Args:
        phys: Physics baseline model
        residual_model: Residual model (can be single model or dict of ensemble models)
        X: Feature matrix
        y: Target values
        n_splits: Number of CV folds
    
    Returns:
        Dictionary with metrics including R²
    """
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    rmses = []
    maes = []
    r2_scores = []
    
    for tr, te in kf.split(X):
        Xtr, Xte = X.iloc[tr], X.iloc[te]
        ytr, yte = y.iloc[tr], y.iloc[te]
        
        # Train physics baseline on fold
        phys_local = Ridge(alpha=1.5, max_iter=2000, random_state=42)
        phys_local.fit(Xtr, ytr)
        y_phys = phys_local.predict(Xte)
        
        # Predict residuals
        if isinstance(residual_model, dict):
            # Ensemble model
            res_pred = predict_ensemble(residual_model, Xte)
        elif isinstance(residual_model, lgb.Booster):
            res_pred = residual_model.predict(Xte.values)
        elif has_xgb:
            try:
                if isinstance(residual_model, xgb.Booster):
                    res_pred = residual_model.predict(xgb.DMatrix(Xte.values))
                else:
                    res_pred = residual_model.predict(Xte)
            except:
                res_pred = residual_model.predict(Xte)
        elif has_catboost:
            try:
                if isinstance(residual_model, cb.CatBoostRegressor):
                    res_pred = residual_model.predict(Xte.values)
                else:
                    res_pred = residual_model.predict(Xte)
            except:
                res_pred = residual_model.predict(Xte)
        else:
            res_pred = residual_model.predict(Xte)
        
        y_pred = y_phys + res_pred
        
        # Calculate metrics
        rmse = np.sqrt(mean_squared_error(yte, y_pred))
        mae = mean_absolute_error(yte, y_pred)
        r2 = r2_score(yte, y_pred)
        
        rmses.append(rmse)
        maes.append(mae)
        r2_scores.append(r2)
    
    return {
        'rmse_mean': float(np.mean(rmses)),
        'rmse_std': float(np.std(rmses)),
        'mae_mean': float(np.mean(maes)),
        'mae_std': float(np.std(maes)),
        'r2_mean': float(np.mean(r2_scores)),
        'r2_std': float(np.std(r2_scores))
    }


def main():
    p = argparse.ArgumentParser(description='Train improved tire wear prediction models')
    p.add_argument('--data-dir', required=True, help='precomputed per-track parquet dir (from precompute_features)')
    p.add_argument('--out-dir', required=True, help='models output dir')
    p.add_argument('--model-name', default='tire-v2.0', help='model name')
    p.add_argument('--cv-folds', type=int, default=5, help='number of cross-validation folds')
    p.add_argument('--use-tcn', action='store_true', help='also train TCN sequence residual (requires torch)')
    p.add_argument('--tcn-epochs', type=int, default=20, help='TCN training epochs')
    p.add_argument('--use-ensemble', action='store_true', default=True, help='use ensemble of multiple models (LightGBM, XGBoost, CatBoost)')
    p.add_argument('--use-xgb', action='store_true', default=True, help='include XGBoost in ensemble (if available)')
    p.add_argument('--use-catboost', action='store_true', default=True, help='include CatBoost in ensemble (if available)')
    p.add_argument('--num-boost-round', type=int, default=1000, help='number of boosting rounds')
    p.add_argument('--physics-model', type=str, default='ridge', choices=['ridge', 'elastic_net'], help='physics baseline model type')
    args = p.parse_args()

    start = time.time()
    data_dir = args.data_dir
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = load_precomputed_parquets(data_dir)
    logging.info("Loaded %d rows from precomputed data", len(df))

    X, y, meta = build_features(df)
    logging.info("Training dataset shape X=%s y=%s", X.shape, y.shape)

    # Improved physics baseline with better regularization
    phys = train_physics_baseline(X, y, model_type=args.physics_model)
    logging.info(f"Trained physics baseline ({args.physics_model})")

    # compute residual target
    y_phys = phys.predict(X)
    residual = y - y_phys
    logging.info(f"Residual statistics: mean={residual.mean():.4f}, std={residual.std():.4f}")

    # Train improved models
    if args.use_ensemble:
        logging.info("Training ensemble of models...")
        residual_models = train_ensemble_residual(
            X, residual,
            include_xgb=args.use_xgb and has_xgb,
            include_catboost=args.use_catboost and has_catboost
        )
        logging.info(f"Trained ensemble with {len(residual_models)} models: {list(residual_models.keys())}")
    else:
        # Single LightGBM model (improved)
        logging.info("Training single LightGBM model...")
        residual_models = train_residual_lgb(X, residual, num_boost_round=args.num_boost_round)
        logging.info("Trained improved LightGBM residual model")

    # cross-validate combined model
    metrics = cross_val_metrics(phys, residual_models, X, y, n_splits=args.cv_folds)
    logging.info("CV metrics: RMSE=%.4f±%.4f, MAE=%.4f±%.4f, R²=%.4f±%.4f",
                 metrics['rmse_mean'], metrics['rmse_std'],
                 metrics['mae_mean'], metrics['mae_std'],
                 metrics['r2_mean'], metrics['r2_std'])

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

    # Get feature importance if available
    feature_importance = {}
    if isinstance(residual_models, dict):
        if 'lgb' in residual_models:
            try:
                importance = residual_models['lgb'].feature_importance(importance_type='gain')
                feature_importance['lgb'] = dict(zip(X.columns, importance))
            except:
                pass
    elif isinstance(residual_models, lgb.Booster):
        try:
            importance = residual_models.feature_importance(importance_type='gain')
            feature_importance['lgb'] = dict(zip(X.columns, importance))
        except:
            pass

    # package and save models
    model_bundle = {
        'phys_model': phys,
        'residual_models': residual_models,  # Can be single model or dict of ensemble
        'feature_columns': list(X.columns),
        'model_name': args.model_name,
        'created_at': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        'metrics': metrics,
        'feature_importance': feature_importance,
        'is_ensemble': isinstance(residual_models, dict),
        'model_types': list(residual_models.keys()) if isinstance(residual_models, dict) else ['lgb']
    }
    if tcn_path:
        model_bundle['tcn_path'] = tcn_path

    out_path = out_dir / f"{args.model_name}.pkl"
    joblib.dump(model_bundle, out_path)
    logging.info("Saved model bundle to %s", out_path)

    # write manifest.json with improved metadata
    manifest = {
        'model_name': args.model_name,
        'created_at': model_bundle['created_at'],
        'model_file': str(out_path),
        'metrics': metrics,
        'feature_columns': model_bundle['feature_columns'],
        'is_ensemble': model_bundle['is_ensemble'],
        'model_types': model_bundle['model_types'],
        'feature_importance': feature_importance,
        'training_config': {
            'cv_folds': args.cv_folds,
            'num_boost_round': args.num_boost_round,
            'physics_model': args.physics_model,
            'use_ensemble': args.use_ensemble
        }
    }
    if tcn_path:
        manifest['tcn_path'] = tcn_path
        manifest['tcn_epochs'] = args.tcn_epochs
    
    manifest_path = out_dir / "manifest.json"
    with open(manifest_path, 'w') as fh:
        json.dump(manifest, fh, indent=2)
    logging.info("Wrote manifest: %s", manifest_path)

    logging.info("Total training time: %.1f s", time.time() - start)
    logging.info("Model improvement summary:")
    logging.info("  - RMSE: %.4f (lower is better)", metrics['rmse_mean'])
    logging.info("  - MAE: %.4f (lower is better)", metrics['mae_mean'])
    logging.info("  - R²: %.4f (higher is better, closer to 1.0)", metrics['r2_mean'])


if __name__ == '__main__':
    main()

