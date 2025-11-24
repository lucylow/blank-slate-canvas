"""
Predictive modeling module for PitWall A.I. — Race outcome predictions.

Features:
- Load one or more race CSVs
- Robust preprocessing and feature engineering (time parsing, lap stats, telemetry aggregates)
- Train XGBoost regressor (total_time_seconds) and classifier (podium: top-3)
- RandomizedSearchCV for simple hyperparameter tuning
- Evaluate and save models
- Predict for new inputs

Usage (example):
    python -m src.models.predictive_model --csv data/sebring.csv --out-dir models/

Notes:
- The code expects common columns if available:
  POSITION, NUMBER, TOTAL_TIME, FL_TIME, FL_KPH, LAPS,
  accx_can, accy_can, Laptrigger_lapdist_dls, meta_time
- If telemetry (accx/accy) isn't present, code falls back to simpler features.
"""

import argparse
import json
import os
from pathlib import Path
from typing import List, Tuple, Dict

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    accuracy_score,
    f1_score,
    roc_auc_score,
    classification_report,
)
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier, XGBRegressor
from tqdm import tqdm
import warnings

warnings.filterwarnings("ignore")

# ---------------------------
# Helpers: time parsing utils
# ---------------------------
def time_str_to_seconds(t: str) -> float:
    """
    Parse times like "46:23.022" (MM:SS.sss) or "2:25.437" (M:SS.sss) into seconds.
    Return np.nan if parsing fails.
    """
    if pd.isna(t):
        return np.nan
    if isinstance(t, (int, float)):
        return float(t)
    s = str(t).strip()
    try:
        if ':' in s:
            parts = s.split(':')
            # support M:SS.sss or MM:SS.sss or H:MM:SS.sss
            if len(parts) == 2:
                minutes = float(parts[0])
                seconds = float(parts[1])
                return 60.0 * minutes + seconds
            elif len(parts) == 3:
                hours = float(parts[0])
                minutes = float(parts[1])
                seconds = float(parts[2])
                return 3600 * hours + 60 * minutes + seconds
        # fallback: raw numeric seconds
        return float(s)
    except Exception:
        return np.nan


# ---------------------------
# Data loading & merging
# ---------------------------
def load_csvs(paths: List[str]) -> pd.DataFrame:
    """Load one or many CSV files and concat them into a single dataframe."""
    frames = []
    for p in paths:
        p = Path(p)
        if not p.exists():
            raise FileNotFoundError(f"CSV not found: {p}")
        df = pd.read_csv(p)
        df['__source_file'] = str(p.name)
        frames.append(df)
    if not frames:
        raise ValueError("No CSVs loaded.")
    df_all = pd.concat(frames, ignore_index=True)
    print(f"[load_csvs] Loaded {len(df_all)} rows from {len(frames)} file(s).")
    return df_all


# ---------------------------
# Preprocessing & features
# ---------------------------
def preprocess_and_engineer(df: pd.DataFrame) -> pd.DataFrame:
    """
    Perform cleaning and feature engineering.
    Returns a dataframe with feature columns plus label columns:
      - total_time_seconds (float)  -> regression target
      - finish_position (int)       -> ordinal info
      - podium (int: 1 if position <=3 else 0) -> classification target
    """
    df = df.copy()

    # Normalize column names (upper-case trimmed)
    df.columns = [col.strip() for col in df.columns]
    # Common columns mapping
    col_map = {c.upper(): c for c in df.columns}
    # helper to check if column exists
    def has(col_upper):
        return col_upper in col_map

    # Parse finishing time
    if has("TOTAL_TIME"):
        df["total_time_seconds"] = df[col_map["TOTAL_TIME"]].apply(time_str_to_seconds)
    else:
        # Attempt to derive from LAPS * average lap time if fl_time present
        df["total_time_seconds"] = np.nan

    # parse fastest lap time if present
    if has("FL_TIME"):
        df["fastest_lap_seconds"] = df[col_map["FL_TIME"]].apply(time_str_to_seconds)
    else:
        df["fastest_lap_seconds"] = np.nan

    # finish position
    if has("POSITION"):
        df["finish_position"] = pd.to_numeric(df[col_map["POSITION"]], errors="coerce").astype(pd.Int64Dtype())
    else:
        df["finish_position"] = pd.NA

    # lap count
    if has("LAPS"):
        df["laps"] = pd.to_numeric(df[col_map["LAPS"]], errors="coerce").fillna(0).astype(int)
    else:
        df["laps"] = 0

    # speed / kph
    if has("FL_KPH"):
        df["fastest_lap_kph"] = pd.to_numeric(df[col_map["FL_KPH"]], errors="coerce")
    else:
        df["fastest_lap_kph"] = np.nan

    # vehicle/chassis identification if available
    if has("NUMBER"):
        df["car_number"] = df[col_map["NUMBER"]].astype(str)
    else:
        df["car_number"] = df.get("CAR", df.get("Vehicle", pd.Series(["unknown"] * len(df))))

    # Telemetry aggregates (if accx_can & accy_can exist)
    if has("ACCX_CAN") and has("ACCY_CAN"):
        # We expect rows to be telemetry samples; but if dataset is results-level, these won't exist.
        # Aggregate per car_number: mean/max/std of acc magnitudes if present
        # Convert to numeric and compute magnitude
        df["accx_can_num"] = pd.to_numeric(df[col_map["ACCX_CAN"]], errors="coerce").fillna(0.0)
        df["accy_can_num"] = pd.to_numeric(df[col_map["ACCY_CAN"]], errors="coerce").fillna(0.0)
        df["acc_mag"] = np.sqrt(df["accx_can_num"] ** 2 + df["accy_can_num"] ** 2)
        # group features per car
        agg = df.groupby("car_number").agg(
            acc_mag_mean=("acc_mag", "mean"),
            acc_mag_std=("acc_mag", "std"),
            acc_mag_max=("acc_mag", "max"),
        ).reset_index()
        df = df.merge(agg, on="car_number", how="left")
    else:
        # Create placeholders
        df["acc_mag_mean"] = np.nan
        df["acc_mag_std"] = np.nan
        df["acc_mag_max"] = np.nan

    # Derived features: avg lap time if total_time_seconds and laps are present
    df["avg_lap_seconds"] = np.where(
        (df["total_time_seconds"].notna()) & (df["laps"] > 0),
        df["total_time_seconds"] / df["laps"],
        np.nan,
    )

    # Fastest-lap delta to avg lap
    df["fastest_vs_avg"] = df["avg_lap_seconds"] - df["fastest_lap_seconds"]

    # Flag podium
    df["podium"] = df["finish_position"].apply(lambda x: 1 if (pd.notna(x) and int(x) <= 3) else 0)

    # Fill NaNs for modelling (later we will scale)
    # Keep original typed columns available as well
    feature_df = df.copy()

    # Example features set (expandable)
    feature_columns = [
        "laps",
        "avg_lap_seconds",
        "fastest_lap_seconds",
        "fastest_lap_kph",
        "fastest_vs_avg",
        "acc_mag_mean",
        "acc_mag_std",
        "acc_mag_max",
    ]

    # Ensure all feature columns exist
    for c in feature_columns:
        if c not in feature_df.columns:
            feature_df[c] = np.nan

    # Keep a simple set for modelling use
    model_df = feature_df[feature_columns + ["total_time_seconds", "finish_position", "podium", "car_number", "__source_file"]].copy()

    return model_df


# ---------------------------
# Train / Eval
# ---------------------------
def train_and_evaluate(
    df: pd.DataFrame,
    out_dir: str = "models",
    test_size: float = 0.2,
    random_state: int = 42,
    do_hyperopt: bool = True,
) -> Dict[str, str]:
    """
    Train regression (total_time_seconds) and classification (podium) XGBoost models.
    Returns a dict with model paths and metrics.
    """

    os.makedirs(out_dir, exist_ok=True)

    # Drop rows missing essential label(s)
    df = df.copy()
    df = df[df["finish_position"].notna() | df["total_time_seconds"].notna()]

    # For regression, only keep rows with total_time_seconds
    reg_df = df[df["total_time_seconds"].notna()].dropna(subset=["total_time_seconds"]).copy()
    # For classification, keep rows with finish_position
    clf_df = df[df["finish_position"].notna()].dropna(subset=["podium"]).copy()

    # Feature list (automatically take numeric features)
    feature_cols = [c for c in df.columns if c not in ("total_time_seconds", "finish_position", "podium", "car_number", "__source_file")]
    # Filter numeric
    feature_cols = [c for c in feature_cols if pd.api.types.is_numeric_dtype(df[c])]

    print(f"[train_and_evaluate] Features used: {feature_cols}")

    results = {}

    # ---------------- REGRESSION ----------------
    if len(reg_df) >= 10:  # require minimal rows
        X_reg = reg_df[feature_cols].fillna(0.0)
        y_reg = reg_df["total_time_seconds"].values

        X_train, X_test, y_train, y_test = train_test_split(X_reg, y_reg, test_size=test_size, random_state=random_state)

        reg_pipe = Pipeline([("scaler", StandardScaler()), ("model", XGBRegressor(objective="reg:squarederror", n_jobs=4, random_state=random_state))])

        if do_hyperopt:
            param_dist = {
                "model__n_estimators": [50, 100, 200],
                "model__max_depth": [3, 5, 7],
                "model__learning_rate": [0.01, 0.05, 0.1],
                "model__subsample": [0.6, 0.8, 1.0],
            }
            search = RandomizedSearchCV(reg_pipe, param_dist, n_iter=8, cv=3, scoring="neg_mean_absolute_error", n_jobs=2, random_state=random_state, verbose=1)
            search.fit(X_train, y_train)
            best_reg = search.best_estimator_
            print("[train] Best reg params:", search.best_params_)
        else:
            reg_pipe.fit(X_train, y_train)
            best_reg = reg_pipe

        y_pred = best_reg.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = mean_squared_error(y_test, y_pred, squared=False)
        results["regression_mae"] = float(mae)
        results["regression_rmse"] = float(rmse)

        reg_model_path = os.path.join(out_dir, "xgb_reg_total_time.joblib")
        joblib.dump(best_reg, reg_model_path)
        results["regression_model"] = reg_model_path
        print(f"[train] Regression saved to {reg_model_path} (MAE={mae:.3f}, RMSE={rmse:.3f})")
    else:
        print("[train] Not enough rows for regression training. Skipping regression.")

    # ---------------- CLASSIFICATION ----------------
    if len(clf_df) >= 20:  # need more rows for classifier
        X_clf = clf_df[feature_cols].fillna(0.0)
        y_clf = clf_df["podium"].astype(int).values

        X_train, X_test, y_train, y_test = train_test_split(X_clf, y_clf, test_size=test_size, random_state=random_state, stratify=y_clf)

        clf_pipe = Pipeline([("scaler", StandardScaler()), ("model", XGBClassifier(use_label_encoder=False, eval_metric="logloss", random_state=random_state))])

        if do_hyperopt:
            param_dist = {
                "model__n_estimators": [50, 100, 200],
                "model__max_depth": [3, 5, 7],
                "model__learning_rate": [0.01, 0.05, 0.1],
                "model__subsample": [0.6, 0.8, 1.0],
            }
            search = RandomizedSearchCV(clf_pipe, param_dist, n_iter=10, cv=4, scoring="f1", n_jobs=2, random_state=random_state, verbose=1)
            search.fit(X_train, y_train)
            best_clf = search.best_estimator_
            print("[train] Best clf params:", search.best_params_)
        else:
            clf_pipe.fit(X_train, y_train)
            best_clf = clf_pipe

        y_pred = best_clf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        results["classification_accuracy"] = float(acc)
        results["classification_f1"] = float(f1)

        # probability-based metrics
        if hasattr(best_clf.named_steps["model"], "predict_proba"):
            y_proba = best_clf.predict_proba(X_test)[:, 1]
            try:
                auc = roc_auc_score(y_test, y_proba)
                results["classification_auc"] = float(auc)
            except Exception:
                results["classification_auc"] = None

        clf_model_path = os.path.join(out_dir, "xgb_clf_podium.joblib")
        joblib.dump(best_clf, clf_model_path)
        results["classification_model"] = clf_model_path
        print(f"[train] Classification saved to {clf_model_path} (acc={acc:.3f}, f1={f1:.3f})")
    else:
        print("[train] Not enough rows for classification training. Skipping classification.")

    # Save metadata and results.yaml/json
    meta_path = os.path.join(out_dir, "training_results.json")
    with open(meta_path, "w") as f:
        json.dump(results, f, indent=2)
    print("[train] Training summary saved to", meta_path)

    return results


# ---------------------------
# Prediction helper
# ---------------------------
def load_models(reg_path: str = None, clf_path: str = None):
    """Load saved models (joblib) if available."""
    reg_model = joblib.load(reg_path) if reg_path and os.path.exists(reg_path) else None
    clf_model = joblib.load(clf_path) if clf_path and os.path.exists(clf_path) else None
    return reg_model, clf_model


def predict(df: pd.DataFrame, reg_model=None, clf_model=None) -> pd.DataFrame:
    """
    Predict using pre-trained models.
    Input: a dataframe of raw rows (will be preprocessed inside).
    Returns dataframe with predictions appended: pred_total_time, pred_podium_prob, pred_podium
    """
    engineered = preprocess_and_engineer(df)
    feature_cols = [c for c in engineered.columns if c not in ("total_time_seconds", "finish_position", "podium", "car_number", "__source_file") and pd.api.types.is_numeric_dtype(engineered[c])]
    X = engineered[feature_cols].fillna(0.0)

    out = engineered[["car_number", "__source_file", "finish_position", "total_time_seconds"]].copy()

    if reg_model:
        try:
            out["pred_total_time_seconds"] = reg_model.predict(X)
        except Exception as e:
            out["pred_total_time_seconds"] = np.nan
            print("[predict] Regression prediction error:", e)

    if clf_model:
        try:
            if hasattr(clf_model.named_steps["model"], "predict_proba"):
                out["pred_podium_prob"] = clf_model.predict_proba(X)[:, 1]
            else:
                out["pred_podium_prob"] = clf_model.predict(X)
            out["pred_podium"] = (out["pred_podium_prob"] >= 0.5).astype(int)
        except Exception as e:
            out["pred_podium_prob"] = np.nan
            out["pred_podium"] = np.nan
            print("[predict] Classification prediction error:", e)

    return out


# ---------------------------
# CLI
# ---------------------------
def cli_main():
    parser = argparse.ArgumentParser(description="Train race outcome predictive models.")
    parser.add_argument("--csv", type=str, required=True, help="Path to a CSV file or directory containing CSV files.")
    parser.add_argument("--out-dir", type=str, default="models", help="Directory to write models and metadata.")
    parser.add_argument("--no-hyperopt", action="store_true", help="Disable hyperparameter search for speed.")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if csv_path.is_dir():
        csv_files = [str(p) for p in csv_path.glob("*.csv")]
    else:
        csv_files = [str(csv_path)]

    df = load_csvs(csv_files)
    engineered = preprocess_and_engineer(df)
    results = train_and_evaluate(engineered, out_dir=args.out_dir, do_hyperopt=not args.no_hyperopt)
    print("Training finished. Summary:", results)


if __name__ == "__main__":
    cli_main()



