#!/usr/bin/env python3
# agents/eda/eda_agent.py
# EDA Agent: Runs UMAP + HDBSCAN clustering on telemetry windows

import os
import sys
import json
import time
import redis
import requests
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime

try:
    from umap import UMAP
    from hdbscan import HDBSCAN
    from sklearn.preprocessing import StandardScaler
except ImportError:
    print("Warning: UMAP/HDBSCAN not installed. Install with: pip install umap-learn hdbscan")
    UMAP = None
    HDBSCAN = None

class EDAAgent:
    def __init__(self, config: Optional[Dict] = None):
        config = config or {}
        self.agent_id = config.get('agent_id') or f'eda-{os.getpid()}'
        self.redis_url = config.get('redis_url') or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis = redis.Redis.from_url(self.redis_url, decode_responses=True)
        self.orchestrator_url = config.get('orchestrator_url') or os.getenv('ORCHESTRATOR_URL', 'http://localhost:3000')
        self.window_size = config.get('window_size', 2000)
        self.min_cluster_size = config.get('min_cluster_size', 8)
        self.historical_centroids = {}  # track+chassis -> list of centroids
        
    def register(self) -> bool:
        """Register with orchestrator"""
        try:
            response = requests.post(
                f'{self.orchestrator_url}/agents/register',
                json={
                    'agent_id': self.agent_id,
                    'types': ['eda'],
                    'tracks': ['*'],
                    'capacity': 4
                },
                timeout=5
            )
            result = response.json()
            print(f"[EDA] Registered: {'OK' if result.get('success') else 'FAILED'}")
            return result.get('success', False)
        except Exception as e:
            print(f"[EDA] Registration failed: {e}")
            return False
    
    def heartbeat(self):
        """Send heartbeat to orchestrator"""
        try:
            requests.post(
                f'{self.orchestrator_url}/agents/heartbeat/{self.agent_id}',
                timeout=2
            )
        except:
            pass  # Silent fail
    
    def extract_features(self, aggregates: Dict) -> np.ndarray:
        """Extract feature vector from sector aggregates"""
        sectors = aggregates.get('sectors', {})
        features = []
        
        # Per-sector features: stress, brake_energy, avg_speed
        for sector_name in ['S1', 'S2', 'S3']:
            sector = sectors.get(sector_name, {})
            features.extend([
                sector.get('tire_stress', 0) / 1000,  # Normalize
                sector.get('brake_energy', 0) / 1000,
                sector.get('avg_speed', 0) / 200,  # Normalize to ~0-1
                sector.get('max_lat_g', 0)
            ])
        
        # Overall features
        total_stress = sum(s.get('tire_stress', 0) for s in sectors.values())
        total_brake = sum(s.get('brake_energy', 0) for s in sectors.values())
        avg_speed = np.mean([s.get('avg_speed', 0) for s in sectors.values()]) if sectors else 0
        
        features.extend([
            total_stress / 3000,
            total_brake / 3000,
            avg_speed / 200
        ])
        
        return np.array(features)
    
    def run_clustering(self, feature_matrix: np.ndarray) -> Dict:
        """Run UMAP + HDBSCAN clustering"""
        if UMAP is None or HDBSCAN is None:
            # Fallback: simple KMeans
            from sklearn.cluster import KMeans
            n_clusters = min(5, len(feature_matrix) // 3)
            if n_clusters < 2:
                return {
                    'clusters': [0] * len(feature_matrix),
                    'n_clusters': 1,
                    'centroids': [feature_matrix.mean(axis=0).tolist()],
                    'method': 'kmeans_fallback'
                }
            
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(feature_matrix)
            
            return {
                'clusters': labels.tolist(),
                'n_clusters': len(set(labels)),
                'centroids': kmeans.cluster_centers_.tolist(),
                'method': 'kmeans_fallback'
            }
        
        # Scale features
        scaler = StandardScaler()
        scaled = scaler.fit_transform(feature_matrix)
        
        # UMAP dimensionality reduction
        umap = UMAP(n_components=2, random_state=42, n_neighbors=min(15, len(feature_matrix) - 1))
        embedding = umap.fit_transform(scaled)
        
        # HDBSCAN clustering
        clusterer = HDBSCAN(min_cluster_size=self.min_cluster_size, min_samples=3)
        labels = clusterer.fit_predict(embedding)
        
        # Compute centroids
        unique_labels = set(labels)
        if -1 in unique_labels:
            unique_labels.remove(-1)  # Remove noise label
        
        centroids = []
        for label in unique_labels:
            mask = labels == label
            centroid = embedding[mask].mean(axis=0)
            centroids.append(centroid.tolist())
        
        return {
            'clusters': labels.tolist(),
            'n_clusters': len(unique_labels),
            'centroids': centroids,
            'embedding': embedding.tolist(),
            'noise_count': int(np.sum(labels == -1)),
            'method': 'umap_hdbscan'
        }
    
    def detect_drift(self, track: str, chassis: str, current_centroid: np.ndarray) -> bool:
        """Detect cluster drift by comparing to historical centroids"""
        key = f'{track}:{chassis}'
        history = self.historical_centroids.get(key, [])
        
        if len(history) < 2:
            # Not enough history
            history.append(current_centroid.tolist())
            self.historical_centroids[key] = history[-10:]  # Keep last 10
            return False
        
        # Compute distance to recent centroids
        recent = np.array(history[-3:])
        distances = np.linalg.norm(recent - current_centroid, axis=1)
        avg_distance = np.mean(distances)
        
        # Threshold: if centroid moved significantly
        threshold = 0.5  # Tune based on embedding scale
        drift_detected = avg_distance > threshold
        
        if drift_detected:
            print(f"[EDA] Drift detected for {track}:{chassis} (distance: {avg_distance:.3f})")
        
        history.append(current_centroid.tolist())
        self.historical_centroids[key] = history[-10:]
        
        return drift_detected
    
    def process_window(self, task: Dict) -> Dict:
        """Process aggregate window and run clustering"""
        payload = task.get('payload', {})
        aggregate_window_id = payload.get('aggregate_window_id')
        track = payload.get('track')
        chassis = payload.get('chassis')
        
        # Get aggregate data from Redis
        aggregate_key = f'aggregate:{aggregate_window_id}'
        aggregate_data = self.redis.get(aggregate_key)
        
        if not aggregate_data:
            # Try to get from stream
            return {'error': 'Aggregate window not found'}
        
        aggregate = json.loads(aggregate_data)
        sectors = aggregate.get('sectors', {})
        
        # Extract features
        features = self.extract_features(aggregate)
        
        # For single window, create a small batch with historical context
        # In production, you'd accumulate multiple windows
        feature_matrix = features.reshape(1, -1)
        
        # Run clustering
        clustering_result = self.run_clustering(feature_matrix)
        
        # Get current centroid
        if clustering_result['centroids']:
            current_centroid = np.array(clustering_result['centroids'][0])
            drift_detected = self.detect_drift(track, chassis, current_centroid)
        else:
            drift_detected = False
        
        # Sample evidence frames from recent points
        recent_points = aggregate.get('recent_points', [])
        evidence_frames = recent_points[-3:] if recent_points else []
        
        return {
            'success': True,
            'aggregate_window_id': aggregate_window_id,
            'track': track,
            'chassis': chassis,
            'clustering': clustering_result,
            'cluster_drift': drift_detected,
            'evidence_frames': evidence_frames,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def start(self):
        """Start EDA agent loop"""
        self.register()
        
        # Send heartbeat every 10s
        import threading
        def heartbeat_loop():
            while True:
                time.sleep(10)
                self.heartbeat()
        
        threading.Thread(target=heartbeat_loop, daemon=True).start()
        
        # Process tasks from inbox
        inbox = f'agent:{self.agent_id}:inbox'
        
        while True:
            try:
                msg = self.redis.blpop(inbox, timeout=5)
                if not msg:
                    continue
                
                _, task_json = msg
                task = json.loads(task_json)
                print(f"[EDA] Processing task {task.get('task_id')}")
                
                start_time = time.time()
                result = self.process_window(task)
                latency_ms = (time.time() - start_time) * 1000
                
                # Send result
                result_msg = {
                    'task_id': task.get('task_id'),
                    'agent_id': self.agent_id,
                    'task_type': 'eda',
                    'success': result.get('success', False),
                    'result': result,
                    'latency_ms': latency_ms,
                    'completed_at': datetime.utcnow().isoformat()
                }
                
                self.redis.xadd('agent_results.stream', {
                    'result': json.dumps(result_msg)
                })
                
            except Exception as e:
                print(f"[EDA] Processing error: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(1)

if __name__ == '__main__':
    agent = EDAAgent()
    agent.start()

