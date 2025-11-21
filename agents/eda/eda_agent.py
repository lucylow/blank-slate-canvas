# eda/eda_agent.py
import os, time, json, redis, numpy as np
from datetime import datetime
from sklearn.decomposition import PCA
import umap
import hdbscan
import uuid

REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')
r = redis.from_url(REDIS_URL)

AGENT_ID = os.getenv('EDA_AGENT_ID', 'eda-01')
INBOX = f'agent:{AGENT_ID}:inbox'
RESULT_STREAM = 'results.stream'

def extract_features_from_samples(samples):
    # expected list of dicts (samples)
    # simple features: speed_kmh, accx_can, accy_can, steering
    X = []
    for s in samples:
        X.append([ float(s.get('speed_kmh',0)), float(s.get('accx_can',0)), float(s.get('accy_can',0)), float(s.get('Steering_Angle',0)) ])
    return np.array(X)

def main_loop():
    print("EDA agent listening", INBOX)
    while True:
        msg = r.blpop(INBOX, timeout=5)
        if not msg:
            time.sleep(0.05); continue
        try:
            task = json.loads(msg[1].decode())
            payload = task.get('payload', {})
            samples = payload.get('samples') or [payload.get('sample')] or []
            X = extract_features_from_samples(samples)
            if X.shape[0] < 2:
                # cannot cluster → return trivial result
                clusters = [-1]*len(samples)
                embedding = X.tolist()
            else:
                reducer = umap.UMAP(n_components=2, random_state=42)
                emb = reducer.fit_transform(X)
                clusterer = hdbscan.HDBSCAN(min_cluster_size=4)
                labels = clusterer.fit_predict(emb)
                clusters = labels.tolist()
                embedding = emb.tolist()
            insight_id = f"insight-{uuid.uuid4().hex[:8]}"
            result = {
                "type":"eda_result",
                "task_id": task.get('task_id'),
                "insight_id": insight_id,
                "agent": AGENT_ID,
                "clusters": clusters,
                "embedding": embedding,
                "samples_meta": [{"meta_time": s.get('meta_time'), "lap": s.get('lap')} for s in samples],
                "created_at": datetime.utcnow().isoformat()+'Z'
            }
            r.hset(f"insight:{insight_id}", mapping={"payload": json.dumps(result), "created_at": result['created_at']})
            r.xadd(RESULT_STREAM, '*', 'result', json.dumps(result))
        except Exception as e:
            print("eda error", e)
            time.sleep(0.5)

if __name__ == '__main__':
    main_loop()
