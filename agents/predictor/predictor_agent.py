# predictor/predictor_agent.py
import os, time, json, redis, joblib, uuid, requests
import numpy as np
import pandas as pd
from datetime import datetime
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')
r = redis.from_url(REDIS_URL)

# agent id
AGENT_ID = os.getenv('AGENT_ID', f'predictor-{uuid.uuid4().hex[:8]}')
INBOX = f'agent:{AGENT_ID}:inbox'
RESULT_STREAM = 'results.stream'
MODEL_PATH = os.getenv('MODEL_PATH', '/models/demo_tire_model.pkl')
ORCH_URL = os.getenv('ORCH_URL', 'http://localhost:9090')

# Optional imports for ensemble models
try:
    import lightgbm as lgb
    has_lgb = True
except ImportError:
    has_lgb = False

try:
    import xgboost as xgb
    has_xgb = True
except ImportError:
    has_xgb = False

try:
    import catboost as cb
    has_catboost = True
except ImportError:
    has_catboost = False

def predict_with_model(model_bundle, X):
    """
    Make predictions using improved model format (supports both old and new formats).
    
    Args:
        model_bundle: Model object (can be dict with phys_model/residual_models or old format)
        X: Feature matrix (array or DataFrame)
    
    Returns:
        Predictions array
    """
    # Handle new model format (dict with phys_model and residual_models)
    if isinstance(model_bundle, dict) and 'phys_model' in model_bundle:
        phys_model = model_bundle['phys_model']
        residual_models = model_bundle.get('residual_models', model_bundle.get('residual_model_lgb'))
        
        # Ensure X is DataFrame for feature column matching
        if not isinstance(X, pd.DataFrame):
            feature_cols = model_bundle.get('feature_columns', [])
            if len(feature_cols) == len(X[0]) if hasattr(X, '__len__') else len(X):
                X_df = pd.DataFrame(X, columns=feature_cols)
            else:
                X_df = pd.DataFrame(X)
        else:
            X_df = X
        
        # Physics baseline prediction
        y_phys = phys_model.predict(X_df)
        
        # Residual prediction
        if isinstance(residual_models, dict):
            # Ensemble model
            predictions = []
            weights = []
            
            if 'lgb' in residual_models and has_lgb:
                pred = residual_models['lgb'].predict(X_df.values)
                predictions.append(pred)
                weights.append(0.5)
            
            if 'xgb' in residual_models and has_xgb:
                try:
                    pred = residual_models['xgb'].predict(xgb.DMatrix(X_df.values))
                    predictions.append(pred)
                    weights.append(0.25)
                except Exception as e:
                    print(f"[Predictor] XGBoost prediction failed: {e}")
            
            if 'catboost' in residual_models and has_catboost:
                try:
                    pred = residual_models['catboost'].predict(X_df.values)
                    predictions.append(pred)
                    weights.append(0.25)
                except Exception as e:
                    print(f"[Predictor] CatBoost prediction failed: {e}")
            
            # Normalize weights
            if weights:
                total_weight = sum(weights)
                weights = [w / total_weight for w in weights]
                
                # Weighted average
                res_pred = np.zeros_like(predictions[0])
                for pred, weight in zip(predictions, weights):
                    res_pred += pred * weight
            else:
                # Fallback to single model if ensemble unavailable
                if has_lgb and 'lgb' in residual_models:
                    res_pred = residual_models['lgb'].predict(X_df.values)
                else:
                    res_pred = np.zeros(len(y_phys))
        elif has_lgb and isinstance(residual_models, lgb.Booster):
            res_pred = residual_models.predict(X_df.values)
        elif has_xgb and isinstance(residual_models, xgb.Booster):
            res_pred = residual_models.predict(xgb.DMatrix(X_df.values))
        elif has_catboost and isinstance(residual_models, cb.CatBoostRegressor):
            res_pred = residual_models.predict(X_df.values)
        else:
            # Fallback: assume it's a sklearn-style model
            res_pred = residual_models.predict(X_df)
        
        # Combined prediction
        return y_phys + res_pred
    
    # Handle old model format (direct sklearn/LightGBM model)
    elif hasattr(model_bundle, 'predict'):
        if isinstance(X, pd.DataFrame):
            return model_bundle.predict(X.values if hasattr(X, 'values') else X)
        return model_bundle.predict(X)
    
    else:
        # Unknown format, return zeros
        print("[Predictor] Unknown model format, returning zeros")
        return np.zeros(len(X) if hasattr(X, '__len__') else 1)

# load model (for demo fallback to trivial linear predictor)
model = None
try:
    model_bundle = joblib.load(MODEL_PATH)
    print("Loaded model:", MODEL_PATH)
    model = model_bundle  # Store the bundle
    # Check model format
    if isinstance(model_bundle, dict):
        if 'phys_model' in model_bundle:
            model_types = model_bundle.get('model_types', [])
            is_ensemble = model_bundle.get('is_ensemble', False)
            print(f"[Predictor] Model format: {'Ensemble' if is_ensemble else 'Single'}, Types: {model_types}")
        else:
            print("[Predictor] Model format: Legacy (direct model)")
    else:
        print("[Predictor] Model format: Legacy (direct model)")
except Exception as e:
    print("Model load failed, using trivial fallback", e)
    class Dummy:
        def predict(self, X): return [0.05 for _ in X]
    model = Dummy()

def predict_feature_vector(payload):
    """
    Enhanced feature extraction using fe_lib for pre-event predictions.
    Falls back to simple features if aggregate data not available.
    """
    # Try to use enhanced features from aggregate_window (preprocessor_v2 output)
    agg = payload.get('aggregate', payload.get('perSector', payload.get('per_sector')))
    if agg:
        try:
            from predictor_wrapper import features_from_aggregate
            return features_from_aggregate({'per_sector': agg}, include_advanced=True)
        except Exception as e:
            print(f"[Predictor] Enhanced features failed, using fallback: {e}")
    
    # Fallback: simple features from sample/derived (backward compatibility)
    sample = payload.get('sample', {})
    derived = payload.get('derived', {})
    # create feature vector in exact order your training code expects
    # Example: [lapdist_m, speed_kmh, tire_stress_inst]
    return [ float(sample.get('lapdist_m', 0)), float(sample.get('speed_kmh', 0)), float(derived.get('tire_stress_inst', 0)) ]

def register_agent():
    """Register with orchestrator"""
    try:
        requests.post(
            f'{ORCH_URL}/api/agents/register',
            json={
                'agentId': AGENT_ID,
                'types': ['predictor'],
                'tracks': ['*'],
                'capacity': 2
            },
            timeout=5
        )
        print(f"[Predictor] Registered with orchestrator: {AGENT_ID}")
    except Exception as e:
        print(f"[Predictor] Registration failed (continuing anyway): {e}")

def main_loop():
    register_agent()
    print("Predictor agent listening inbox:", INBOX)
    while True:
        try:
            msg = r.blpop(INBOX, timeout=5)
            if not msg:
                time.sleep(0.05); continue
            task = json.loads(msg[1].decode())
            task_id = task.get('task_id')
            payload = task.get('payload', {})
            features = predict_feature_vector(payload)
            pred = float(model.predict([features])[0])
            insight_id = f"insight-{uuid.uuid4().hex[:8]}"
            # Enhanced feature importance extraction
            top_features = []
            try:
                from predictor_wrapper import get_feature_names
                feature_names = get_feature_names(track=task.get('track', 'cota'), include_advanced=True)
                if len(feature_names) == len(features):
                    # Calculate feature importance (simple: use feature values as proxy)
                    feature_importance = list(zip(feature_names, features))
                    # Sort by absolute value, take top 5
                    top_features = sorted(feature_importance, key=lambda x: abs(x[1]), reverse=True)[:5]
                    top_features = [{"name": name, "value": float(val)} for name, val in top_features]
            except Exception as e:
                print(f"[Predictor] Feature importance extraction failed: {e}")
                # Fallback to simple features
                top_features = [{"name":"tire_stress_inst","value":payload.get('derived',{}).get('tire_stress_inst', 0)}]
            
            result = {
                "type":"insight_update",
                "task_id": task_id,
                "insight_id": insight_id,
                "track": task.get('track'),
                "chassis": task.get('chassis'),
                "model_version": getattr(model, 'version', 'v0'),
                "predictions": {"predicted_loss_per_lap_seconds": pred, "laps_until_0_5s_loss": max(1.0, round(0.5 / (pred or 0.01), 2))},
                "explanation": {"top_features": top_features, "evidence":[payload.get('sample')]},
                "feature_scores": top_features,  # Add feature_scores for UI compatibility
                "created_at": datetime.utcnow().isoformat() + 'Z'
            }
            # store full insight record for later fetch by id
            r.hset(f"insight:{insight_id}", mapping={"payload": json.dumps(result), "created_at": result['created_at']})
            r.xadd(RESULT_STREAM, '*', 'result', json.dumps(result))
        except Exception as e:
            print("predict loop err", e)
            time.sleep(0.5)

if __name__ == '__main__':
    main_loop()
