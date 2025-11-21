# predictor/predictor_agent.py
import os, time, json, redis, joblib, uuid, requests
from datetime import datetime
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')
r = redis.from_url(REDIS_URL)

# agent id
AGENT_ID = os.getenv('AGENT_ID', f'predictor-{uuid.uuid4().hex[:8]}')
INBOX = f'agent:{AGENT_ID}:inbox'
RESULT_STREAM = 'results.stream'
MODEL_PATH = os.getenv('MODEL_PATH', '/models/demo_tire_model.pkl')
ORCH_URL = os.getenv('ORCH_URL', 'http://localhost:9090')

# load model (for demo fallback to trivial linear predictor)
model = None
try:
    model = joblib.load(MODEL_PATH)
    print("Loaded model:", MODEL_PATH)
except Exception as e:
    print("Model load failed, using trivial fallback", e)
    class Dummy:
        def predict(self, X): return [0.05 for _ in X]
    model = Dummy()

def predict_feature_vector(payload):
    # payload will be dict. For demo we support sample-derived simple features:
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
            result = {
                "type":"insight_update",
                "task_id": task_id,
                "insight_id": insight_id,
                "track": task.get('track'),
                "chassis": task.get('chassis'),
                "model_version": getattr(model, 'version', 'v0'),
                "predictions": {"predicted_loss_per_lap_seconds": pred, "laps_until_0_5s_loss": max(1.0, round(0.5 / (pred or 0.01), 2))},
                "explanation": {"top_features": [{"name":"tire_stress_inst","value":payload.get('derived',{}).get('tire_stress_inst')}], "evidence":[payload.get('sample')]},
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
